// src/services/weatherService.js
/**
 * Weather Service
 * This service handles fetching weather data from the WeatherAPI.com,
 * including current weather and astronomy data to determine day/night status.
 * It also provides a utility to get background images based on weather conditions.
 */
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// API Endpoints (base includes key param so helpers will append additional query params)
const BASE_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}`;
const FORECAST_URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}`;
const ASTRONOMY_URL = `https://api.weatherapi.com/v1/astronomy.json?key=${API_KEY}`;
const SEARCH_URL = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}`;

import { DateTime } from 'luxon';

// ----- Additional configuration and lightweight caching -----
const DEFAULT_TIMEOUT = 8000; // ms
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Simple in-memory caches for current and forecast responses (key -> { ts, data })
const cacheCurrent = new Map();
const cacheForecast = new Map();

// ----- Helper: buildUrl -----
/**
 * Build a URL by appending encoded query parameters to a base URL that already contains the API key.
 * Example: buildUrl(BASE_URL, { q: 'London', aqi: 'yes' }) => '...current.json?key=...&q=London&aqi=yes'
 */
const buildUrl = (base, params = {}) => {
  const parts = [];
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `${base}&${parts.join('&')}` : base;
};

// ----- Helper: fetchWithTimeout -----
/**
 * Wrap fetch with an AbortController to enforce a timeout.
 * Returns the fetch Response or throws on timeout/network errors.
 */
export const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// ----- Helper: simple cache utilities -----
const getCache = (map, key) => {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    map.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (map, key, data) => map.set(key, { ts: Date.now(), data });

// ----- Helper: parse coordinates (accepts 'lat,lng' or an object) -----
/**
 * Parse a location input and return a string suitable for the API (e.g. 'lat,lng' or city name).
 * Accepts 'lat,lng' strings, objects like { lat, lng } or a plain location string.
 */
export const parseCoordinates = (location) => {
  if (!location && location !== 0) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const { lat, lng, lon } = location;
    if ((lat || lat === 0) && (lng || lng === 0)) return `${lat},${lng}`;
    if ((lat || lat === 0) && (lon || lon === 0)) return `${lat},${lon}`;
  }
  return String(location);
};

// ----- Utility: convert temperature between C and F -----
/**
 * Convert temperature between Celsius and Fahrenheit.
 * @param {number} temp - temperature value
 * @param {'C'|'F'} to - target unit
 */
export const convertTemperature = (temp, to = 'C') => {
  if (to === 'F') return +(temp * 9/5 + 32).toFixed(1);
  if (to === 'C') return +(((temp - 32) * 5) / 9).toFixed(1);
  return temp;
};

// ----- Utility: format local time nicely using luxon -----
/**
 * Format a localtime string (from API) or an ISO timestamp according to the provided timezone.
 * Default format: yyyy-LL-dd HH:mm
 */
export const formatLocalTime = (isoOrLocaltimeStr, tz, fmt = 'yyyy-LL-dd HH:mm') => {
  if (!isoOrLocaltimeStr) return null;
  // The API often returns 'YYYY-MM-DD HH:mm' without zone; try parsing in the zone if provided
  let dt = tz
    ? DateTime.fromFormat(isoOrLocaltimeStr, 'yyyy-LL-dd HH:mm', { zone: tz })
    : DateTime.fromISO(isoOrLocaltimeStr);
  if (!dt.isValid) dt = DateTime.fromISO(isoOrLocaltimeStr, { zone: tz });
  return dt.isValid ? dt.toFormat(fmt) : null;
};

/**
 * Fetch comprehensive weather data
 * - uses fetchWithTimeout for network robustness
 * - uses a small in-memory cache to reduce repeated calls
 * - computes day/night if API value is missing
 */
export const show = async (location) => {
  if (!API_KEY) throw new Error('VITE_WEATHER_API_KEY is not set in environment variables');
  try {
    const loc = parseCoordinates(location);
    const params = { q: loc, aqi: 'yes' };
    const url = buildUrl(BASE_URL, params);

    // Attempt to use cache
    const cacheKey = `${BASE_URL}|${JSON.stringify(params)}`;
    const cached = getCache(cacheCurrent, cacheKey);
    if (cached) return cached;

    const currentRes = await fetchWithTimeout(url);
    const currentData = await currentRes.json();

    if (currentData.error) throw new Error(currentData.error.message || 'Weather API Error');

    const tz = currentData?.location?.tz_id || null;
    const localtimeStr = currentData?.location?.localtime || null;

    // Determine date string for astronomy lookup
    let dateStr;
    if (localtimeStr) {
      dateStr = localtimeStr.split(' ')[0];
    } else if (tz) {
      dateStr = DateTime.now().setZone(tz).toISODate();
    } else {
      dateStr = DateTime.now().toISODate();
    }

    // Fetch astronomy data (best-effort)
    let astro = null;
    try {
      const astroUrl = buildUrl(ASTRONOMY_URL, { q: loc, dt: dateStr });
      const astroRes = await fetchWithTimeout(astroUrl);
      const astroJson = await astroRes.json();
      astro = astroJson?.astronomy?.astro || null;
    } catch (e) {
      // non-fatal; we still return main data
      console.warn('Astronomy fetch failed', e);
    }

    // Compute day/night status if API doesn't provide reliable value
    const apiIsDay = typeof currentData?.current?.is_day === 'number'
      ? currentData.current.is_day === 1
      : null;

    let computedIsDay = null;
    if (astro && tz) {
      const now = DateTime.now().setZone(tz);
      const parseTimeToDateTime = (dateISO, timeStr, zone) => {
        let dt = DateTime.fromFormat(`${dateISO} ${timeStr}`, 'yyyy-LL-dd h:mm a', { zone });
        if (!dt.isValid) dt = DateTime.fromFormat(`${dateISO} ${timeStr}`, 'yyyy-LL-dd HH:mm', { zone });
        return dt.isValid ? dt : null;
      };
      const sunriseDT = parseTimeToDateTime(dateStr, astro.sunrise, tz);
      const sunsetDT = parseTimeToDateTime(dateStr, astro.sunset, tz);
      if (sunriseDT && sunsetDT) computedIsDay = now >= sunriseDT && now < sunsetDT;
    }

    const isDay = apiIsDay !== null ? apiIsDay : computedIsDay;

    const result = {
      raw: currentData,
      location: currentData.location,
      current: currentData.current,
      isDay,
      localtime: localtimeStr,
      timezone: tz,
      astronomy: astro,
      airQuality: currentData.current?.air_quality || null,
    };

    // store in cache
    setCache(cacheCurrent, cacheKey, result);

    return result;
  } catch (err) {
    console.error('Weather API Error:', err);
    throw err;
  }
};

/**
 * Fetch weather forecast (up to 3 days)
 * Uses caching and timeout wrapper
 */
export const getForecast = async (location, days = 3) => {
  if (!API_KEY) throw new Error('VITE_WEATHER_API_KEY is not set in environment variables');
  try {
    const loc = parseCoordinates(location);
    const params = { q: loc, days, aqi: 'yes', alerts: 'yes' };
    const url = buildUrl(FORECAST_URL, params);

    const cacheKey = `${FORECAST_URL}|${JSON.stringify(params)}`;
    const cached = getCache(cacheForecast, cacheKey);
    if (cached) return cached;

    const res = await fetchWithTimeout(url);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message || 'Forecast API Error');

    const result = {
      location: data.location,
      current: data.current,
      forecast: data.forecast?.forecastday || [],
      alerts: data.alerts?.alert || [],
      airQuality: data.current?.air_quality || null,
    };

    setCache(cacheForecast, cacheKey, result);
    return result;
  } catch (err) {
    console.error('Forecast API Error:', err);
    throw err;
  }
};

/**
 * Get detailed astronomy data
 * Uses fetchWithTimeout and buildUrl
 */
export const getAstronomy = async (location, date) => {
  if (!API_KEY) throw new Error('VITE_WEATHER_API_KEY is not set in environment variables');
  try {
    const loc = parseCoordinates(location);
    const params = { q: loc };
    if (date) params.dt = date;
    const url = buildUrl(ASTRONOMY_URL, params);
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Astronomy API Error');
    return {
      location: data.location,
      astronomy: data.astronomy?.astro || null,
    };
  } catch (err) {
    console.error('Astronomy API Error:', err);
    throw err;
  }
};

/**
 * Search for location suggestions using the WeatherAPI search endpoint.
 * Useful for autosuggest boxes and reducing bad queries from free text.
 */
export const getLocationSuggestions = async (query) => {
  if (!API_KEY) throw new Error('VITE_WEATHER_API_KEY is not set in environment variables');
  if (!query) return [];
  try {
    const url = buildUrl(SEARCH_URL, { q: query });
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    // returns an array of location-like objects from the API
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Location suggestions failed', err);
    return [];
  }
};

/**
 * Get air quality description
 * @param {number} index - Air Quality Index from EPA
 * @returns {Object} AQI description and color
 */
export const getAQIInfo = (index) => {
  if (index <= 50) {
    return { label: 'Good', color: '#00e400', emoji: '🟢' };
  } else if (index <= 100) {
    return { label: 'Moderate', color: '#ffff00', emoji: '🟡' };
  } else if (index <= 150) {
    return { label: 'Unhealthy for Sensitive', color: '#ff7e00', emoji: '🟠' };
  } else if (index <= 200) {
    return { label: 'Unhealthy', color: '#ff0000', emoji: '🔴' };
  } else if (index <= 300) {
    return { label: 'Very Unhealthy', color: '#8f3f97', emoji: '🟣' };
  } else {
    return { label: 'Hazardous', color: '#7e0023', emoji: '🟤' };
  }
};

/**
 * Get UV Index description
 * @param {number} uv - UV Index value
 * @returns {Object} UV description and color
 */
export const getUVInfo = (uv) => {
  if (uv <= 2) {
    return { label: 'Low', color: '#299501', advice: 'No protection needed' };
  } else if (uv <= 5) {
    return { label: 'Moderate', color: '#f7e400', advice: 'Wear sunscreen' };
  } else if (uv <= 7) {
    return { label: 'High', color: '#f85900', advice: 'Protection required' };
  } else if (uv <= 10) {
    return { label: 'Very High', color: '#d8001d', advice: 'Extra protection' };
  } else {
    return { label: 'Extreme', color: '#6b49c8', advice: 'Stay indoors' };
  }
};

/**
 * Get weather background image
 * @param {string} condition - Weather condition text
 * @returns {string} Unsplash image URL
 */
export const getWeatherBackground = (condition) => {
  const conditionLower = condition?.toLowerCase() || '';
  let query = 'sunny sky';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    query = 'rainy weather';
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    query = 'cloudy sky';
  } else if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
    query = 'snowy weather';
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    query = 'thunderstorm lightning';
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    query = 'foggy weather';
  } else if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    query = 'clear blue sky';
  }
  return `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
};

/**
 * Format wind direction
 * @param {string} dir - Wind direction abbreviation
 * @returns {string} Full direction name with emoji
 */
export const formatWindDirection = (dir) => {
  const directions = {
    N: '⬆️ North',
    NNE: '↗️ North-Northeast',
    NE: '↗️ Northeast',
    ENE: '➡️ East-Northeast',
    E: '➡️ East',
    ESE: '↘️ East-Southeast',
    SE: '↘️ Southeast',
    SSE: '⬇️ South-Southeast',
    S: '⬇️ South',
    SSW: '↙️ South-Southwest',
    SW: '↙️ Southwest',
    WSW: '⬅️ West-Southwest',
    W: '⬅️ West',
    WNW: '↖️ West-Northwest',
    NW: '↖️ Northwest',
    NNW: '↖️ North-Northwest',
  };
  return directions[dir] || dir;
};

// End of file

