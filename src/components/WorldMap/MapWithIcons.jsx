import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
import { 
  show as fetchWeather, 
  getForecast,
  getAQIInfo,
  getUVInfo,
  formatWindDirection 
} from '../../services/weatherService';

/**
 * Ultimate Interactive Weather Map
 * Shows comprehensive weather data with detailed modal popups
 */
export default function LeafletWorldMap({ onCountryClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lastFetchRef = useRef({ lat: null, lng: null, time: 0 });
  const isLoadingRef = useRef(false);
  
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (!selectedLocation) return;
    const prevTitle = document.title;
    document.title = `Weather - ${selectedLocation}`;
    console.log('Selected location:', selectedLocation);
    return () => { document.title = prevTitle; };
  }, [selectedLocation]);
  const [detailedWeather, setDetailedWeather] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clickHistory, setClickHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('mapClickHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  // History helpers (used by DraggableHistory component below)
  const removeHistoryItem = (index) => {
    setClickHistory(prev => {
      const next = prev.filter((_, i) => i !== index);
      try { localStorage.setItem('mapClickHistory', JSON.stringify(next)); } catch (err) { console.warn('localStorage set error', err); }
      return next;
    });
  };

  const clearHistory = () => {
    setClickHistory([]);
    try { localStorage.removeItem('mapClickHistory'); } catch (err) { console.warn('localStorage remove error', err); }
  };

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: true,
      });

      // Use an English-labeled basemap (Carto Voyager) to keep place labels in English
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &mdash; © OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      map.zoomControl.setPosition('topright');
      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
    } catch (err) {
      console.error('Map initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Map cleanup error:', e);
        }
      }
    };
  }, []);

  // Clear markers
  const clearMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current.removeLayer(marker);
      } catch { /* empty */ }
    });
    markersRef.current = [];
  }, []);

  // Fetch detailed weather data
  const fetchDetailedWeather = useCallback(async (location) => {
    setLoading(true);
    try {
      const forecast = await getForecast(location, 3);
      setDetailedWeather(forecast);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to fetch detailed weather:', err);
      alert('Failed to load detailed weather. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // خريطة الأيقونات المتحركة من IconsDisplay.jsx (استخدم fill للأيقونات الملونة)
  const animatedIconsMap = {
    // Clear/Sunny
    'clear': 'clear-day',
    'sunny': 'clear-day',
    // Cloudy
    'cloudy': 'cloudy',
    'overcast': 'overcast',
    'partly cloudy': 'partly-cloudy-day',
    // Rain
    'rain': 'rain',
    'drizzle': 'drizzle',
    'light rain': 'rain',
    'heavy rain': 'rain',
    // Snow
    'snow': 'snow',
    'blizzard': 'snow',
    'sleet': 'sleet',
    // Thunder
    'thunder': 'thunderstorms',
    'storm': 'thunderstorms',
    'lightning': 'thunderstorms',
    // Fog/Mist
    'fog': 'fog',
    'mist': 'mist',
    'haze': 'haze',
    // Other
    'dust': 'dust',
    'hail': 'hail',
    'tornado': 'tornado',
    'hurricane': 'hurricane',
    // Astronomical
    'sunrise': 'sunrise',
    'sunset': 'sunset',
    'moonrise': 'moonrise',
    'moonset': 'moonset',
    'moon phase': 'moon-full', // افتراضي، يمكن تخصيص حسب البيانات
    // Miscellaneous
    'humidity': 'humidity',
    'wind': 'wind',
    'pressure': 'barometer',
    'visibility': 'not-available', // افتراضي
    'uv': 'uv-index',
    'air quality': 'not-available', // افتراضي
    'compass': 'compass',
    'windsock': 'windsock',
    'thermometer': 'thermometer',
    'celsius': 'celsius',
    'fahrenheit': 'fahrenheit',
    'umbrella': 'umbrella',
    // Particles
    'lightning bolt': 'lightning-bolt',
    'raindrop': 'raindrop',
    'snowflake': 'snowflake',
    'star': 'star',
    'smoke particles': 'smoke-particles',
    // Beaufort (للرياح)
    'beaufort': 'wind-beaufort-0', // افتراضي، يمكن حساب حسب السرعة
    // Default
    'default': 'not-available'
  };

  // Get weather icon path based on condition and time of day
  const getWeatherIcon = (condition, isDay) => {
    const c = condition?.toLowerCase() || '';
    
    // ابحث عن تطابق دقيق أو جزئي
    for (const [key, icon] of Object.entries(animatedIconsMap)) {
      if (c.includes(key)) {
        // إذا كان ليلاً، حاول استبدال 'day' بـ 'night' إذا كانت الأيقونة متوفرة
        if (!isDay && icon.includes('-day')) {
          const nightIcon = icon.replace('-day', '-night');
          // افترض وجودها، أو أعد icon الأصلي إذا لم تكن
          return `/animated_icons/production/fill/all/${nightIcon}.svg`;
        }
        return `/animated_icons/production/fill/all/${icon}.svg`;
      }
    }
    
    // Default
    return `/animated_icons/production/fill/all/${animatedIconsMap['default']}.svg`;
  };

  // Fetch weather for location
  const fetchWeatherForLocation = useCallback(async (lat, lng) => {
    const map = mapInstanceRef.current;
    if (!map || isLoadingRef.current) return;

    const now = Date.now();
    const distance = lastFetchRef.current.lat 
      ? Math.sqrt(
          Math.pow(lat - lastFetchRef.current.lat, 2) + 
          Math.pow(lng - lastFetchRef.current.lng, 2)
        ) * 111
      : Infinity;

    if (distance < 5 && now - lastFetchRef.current.time < 3000) return;

    lastFetchRef.current = { lat, lng, time: now };
    isLoadingRef.current = true;

    try {
      const data = await fetchWeather(`${lat.toFixed(4)},${lng.toFixed(4)}`);
      
      if (!data || !data.location || !data.current) {
        console.warn('Invalid weather data');
        isLoadingRef.current = false;
        return;
      }

      const { location, current, astronomy, isDay, airQuality } = data;

      const weatherIcon = getWeatherIcon(current.condition?.text, isDay);
      const bgColor = isDay ? '#3b82f6' : '#1e293b';

      const customIcon = L.divIcon({
        html: `
          <div style="
            background: ${bgColor};
            color: white;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
            transition: transform 0.2s;
            padding: 6px;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            <img src="${weatherIcon}" style="width: 100%; height: 100%; filter: brightness(0) invert(1);" />
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      // UV Info
      const uvInfo = getUVInfo(current.uv || 0);
      
      // AQI Info
      const aqiValue = airQuality?.['us-epa-index'];
      const aqiInfo = aqiValue ? getAQIInfo(aqiValue) : null;

      // Wind direction degree (0-360, where 0 is North)
      const windDegree = current.wind_degree || 0;

      const popupContent = `
        <div style="font-family: system-ui; min-width: 300px; max-width: 420px; box-sizing: border-box; width:100%;">
          <div style="
            background: linear-gradient(135deg, ${bgColor} 0%, ${isDay ? '#60a5fa' : '#334155'} 100%);
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            margin: -10px -10px 12px -10px;
          ">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">
              <img src="/animated_icons/production/fill/all/compass.svg" style="width: 20px; height: 20px; margin-right: 8px;" /> ${location.name}
            </div>
            <div style="font-size: 13px; opacity: 0.9;">
              ${location.region ? location.region + ', ' : ''}${location.country}
            </div>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
              🕐 ${location.localtime || 'N/A'}
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <div style="width: 64px; height: 64px;">
              <img src="${weatherIcon}" style="width: 100%; height: 100%;" />
            </div>
            <div>
              <div style="font-size: 36px; font-weight: 800; color: #1e293b;">
                ${Math.round(current.temp_c)}°C
              </div>
              <div style="font-size: 14px; color: #64748b; font-weight: 500;">
                ${current.condition?.text || 'N/A'}
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                Feels like ${Math.round(current.feelslike_c)}°C
              </div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
                <img src="/animated_icons/production/fill/all/humidity.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Humidity
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b;">${current.humidity}%</div>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
                <img src="/animated_icons/production/fill/all/wind.svg" style="width: 20px; height: 20px; margin-right: 6px;" /> Wind
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <span>${Math.round(current.wind_kph)} km/h</span>
                <img 
                  src="/animated_icons/production/fill/all/compass.svg" 
                  style="width: 22px; height: 22px; transform: rotate(${windDegree}deg); transition: transform 0.3s ease;"
                />
              </div>
              <div style="font-size: 10px; color: #94a3b8;">${current.wind_dir} (${windDegree}°)</div>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
                <img src="/animated_icons/production/fill/all/barometer.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Pressure
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b;">${current.pressure_mb} mb</div>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
                <img src="/animated_icons/production/fill/all/not-available.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Visibility
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #1e293b;">${current.vis_km} km</div>
            </div>
          </div>

          ${current.uv ? `
            <div style="
              padding: 10px;
              background: linear-gradient(to right, ${uvInfo.color}22, ${uvInfo.color}44);
              border-left: 4px solid ${uvInfo.color};
              border-radius: 6px;
              margin-bottom: 12px;
            ">
              <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 2px;">
                <img src="/animated_icons/production/fill/all/uv-index.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> UV Index: ${current.uv} - ${uvInfo.label}
              </div>
              <div style="font-size: 11px; color: #64748b;">
                ${uvInfo.advice}
              </div>
            </div>
          ` : ''}

          ${aqiInfo ? `
            <div style="
              padding: 10px;
              background: ${aqiInfo.color}22;
              border-left: 4px solid ${aqiInfo.color};
              border-radius: 6px;
              margin-bottom: 12px;
            ">
              <div style="font-size: 12px; font-weight: 600; color: #1e293b;">
                <img src="/animated_icons/production/fill/all/not-available.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Air Quality: ${aqiInfo.label}
              </div>
              <div style="font-size: 11px; color: #64748b;">
                AQI: ${aqiValue}
              </div>
            </div>
          ` : ''}
          
          ${astronomy ? `
            <div style="
              padding: 10px;
              background: linear-gradient(to right, #fef3c7, #fde68a);
              border-radius: 8px;
              margin-bottom: 12px;
            ">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #92400e;">
                <div>
                  <img src="/animated_icons/production/fill/all/sunrise.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Sunrise
                  <div>${astronomy.sunrise || '--'}</div>
                </div>
                <div>
                  <img src="/animated_icons/production/fill/all/sunset.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Sunset
                  <div>${astronomy.sunset || '--'}</div>
                </div>
                <div>
                  <img src="/animated_icons/production/fill/all/moon-full.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Moon Phase
                  <div>${astronomy.moon_phase || '--'}</div>
                </div>
                <div>
                  <img src="/animated_icons/production/fill/all/moonrise.svg" style="width: 16px; height: 16px; margin-right: 4px;" /> Moonrise
                  <div>${astronomy.moonrise || '--'}</div>
                </div>
              </div>
            </div>
          ` : ''}

          <button 
            onclick="window.showDetailedWeather('${location.name}')"
            style="
              width: 100%;
              padding: 12px;
              background: linear-gradient(135deg, #3b82f6, #2563eb);
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
          >
            📊 View 3-Day Forecast
          </button>
        </div>

        
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupContent, {
          maxWidth: 420,
          className: 'custom-popup'
        })
        .addTo(map);

      marker.openPopup();

      // Store location for detailed view
      marker.on('click', () => {
        setSelectedLocation(location.name);
        // store click history (keep unique, move to front)
        try {
          const name = location.name;
          setClickHistory(prev => {
            const filtered = prev.filter(item => item !== name);
            const next = [name, ...filtered].slice(0, 20);
            localStorage.setItem('mapClickHistory', JSON.stringify(next));
            return next;
          });
          } catch { /* ignore storage errors */ }
        if (onCountryClick) onCountryClick(location.name);
      });

      markersRef.current.push(marker);

      if (markersRef.current.length > 10) {
        const old = markersRef.current.shift();
        try { map.removeLayer(old); } catch { /* empty */ }
      }

    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      isLoadingRef.current = false;
    }
  }, [onCountryClick]);

  // Expose function to window for popup button
  useEffect(() => {
    window.showDetailedWeather = (locationName) => {
      setSelectedLocation(locationName);
      try {
        setClickHistory(prev => {
          const filtered = prev.filter(item => item !== locationName);
          const next = [locationName, ...filtered].slice(0, 20);
          try { localStorage.setItem('mapClickHistory', JSON.stringify(next)); } catch (err) { console.warn('localStorage set error', err); }
          return next;
        });
      } catch (err) {
        console.warn('history update error', err);
      }
      fetchDetailedWeather(locationName);
    };
    return () => {
      delete window.showDetailedWeather;
    };
  }, [fetchDetailedWeather]);

  // Map click handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      fetchWeatherForLocation(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [fetchWeatherForLocation]);

  /* Draggable & resizable history panel component (kept local to file) */
  function DraggableHistory({ initialPos = { x: 16, y: 96 }, initialSize = { w: 260, h: 220 } }) {
    const winRef = useRef(null);
    const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: initialPos.x, oy: initialPos.y });
    const resizeRef = useRef({ active: false, sw: initialSize.w, sh: initialSize.h, ow: initialSize.w, oh: initialSize.h, sx: 0, sy: 0 });
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState(initialSize);

    useEffect(() => {
      const onMove = (e) => {
        if (dragRef.current.active) {
          e.preventDefault();
          const nx = e.clientX - dragRef.current.sx + dragRef.current.ox;
          const ny = e.clientY - dragRef.current.sy + dragRef.current.oy;
          setPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
        } else if (resizeRef.current.active) {
          e.preventDefault();
          const nw = Math.max(180, resizeRef.current.ow + (e.clientX - resizeRef.current.sx));
          const nh = Math.max(120, resizeRef.current.oh + (e.clientY - resizeRef.current.sy));
          setSize({ w: nw, h: nh });
        }
      };

      const onUp = () => {
        dragRef.current.active = false;
        resizeRef.current.active = false;
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }, []);

    const startDrag = (e) => {
      e.stopPropagation();
      dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    };

    const startResize = (e) => {
      e.stopPropagation();
      resizeRef.current = { active: true, sx: e.clientX, sy: e.clientY, ow: size.w, oh: size.h };
    };

    

    return (
      <div
        ref={winRef}
        className="absolute z-[1200]"
        style={{ left: pos.x + 'px', top: pos.y + 'px', width: size.w + 'px', height: size.h + 'px', minWidth: 180, minHeight: 120 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          {/* titlebar (drag handle) */}
          <div
            className="flex items-center justify-between px-3 py-2 cursor-move"
            onMouseDown={startDrag}
            style={{ background: '#000', color: '#fff', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <img src="/animated_icons/production/fill/all/compass.svg" style={{width: '18px', height: '18px'}} />
              <span>History</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearHistory} className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Clear</button>
              <button onClick={() => { setSize(initialSize); setPos(initialPos); }} className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Reset</button>
            </div>
          </div>

          {/* content */}
          <div style={{ padding: 8, overflow: 'auto', flex: '1 1 auto' }}>
            <ul className="space-y-2">
              {clickHistory.length === 0 && (
                <li className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No clicks yet — click the map to add</li>
              )}
              {clickHistory.map((name, idx) => (
                <li key={`${name}-${idx}`} className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setSelectedLocation(name); fetchDetailedWeather(name); }}
                    className="text-left text-md hover:underline flex-1 pr-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {name}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeHistoryItem(idx); }}
                    className="text-md px-2"
                    style={{ color: 'var(--color-danger)' }}
                    aria-label={`Remove ${name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* resize handle */}
          <div
            onMouseDown={startResize}
            style={{ height: 12, cursor: 'nwse-resize', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 6 }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--color-border)', opacity: 0.6 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-screen">
        <div 
          ref={mapRef} 
          className="w-full h-full rounded-2xl border-4 border-blue-200 shadow-2xl"
          style={{ background: '#e0f2fe' }}
        />

        {/* Info Panel removed — replaced by draggable history window below */}

  {/* Draggable & Resizable Click History Window (appears top-left by default) */}
  <DraggableHistory initialPos={{ x: 16, y: 16 }} initialSize={{ w: 320, h: 260 }} />

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.setView([20, 0], 3, { animate: true })}
            className="bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium border border-gray-200 flex items-center gap-2"
          >
            <img src="/animated_icons/production/fill/all/compass.svg" style={{width: '16px', height: '16px'}} />
            <span>Reset View</span>
          </button>
          
          <button
            onClick={() => {
              clearMarkers();
              lastFetchRef.current = { lat: null, lng: null, time: 0 };
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2"
          >
            <img src="/animated_icons/production/fill/all/not-available.svg" style={{width: '16px', height: '16px'}} />
            <span>Clear All</span>
          </button>
        </div>

        <style>{`
          /* Improve popup layout so it doesn't collapse to a thin strip */
          .custom-popup {
            max-width: 92vw !important;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.22);
            max-width: 420px;
            width: auto;
            box-sizing: border-box;
            background: var(--color-card);
            color: var(--color-text);
            border: 1px solid var(--color-border);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 12px;
            box-sizing: border-box;
            width: 100%;
          }
          .custom-popup .leaflet-popup-tip {
            background: var(--color-card);
            box-shadow: none;
          }
          .custom-popup img { max-width: 100%; height: auto; display: block; }
          /* ensure text inside popup uses the theme color */
          .custom-popup, .custom-popup * { color: inherit; }
        `}</style>
      </div>

      {/* Detailed Weather Modal */}
      {showModal && detailedWeather && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-card rounded-lg shadow-2xl mix-w-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto px-2 sm:px-0"
            onClick={(e) => e.stopPropagation()}
          >
                {/* Header */}
        <div className="sticky z-[2500] top-0 w-full bg-gradient-to-r from-slate-950 via-slate-800 to-slate-800 text-white p-6 rounded-t-2xl border-b border-slate-700">
          <div className="flex  justify-between items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1 text-white">
                <img src="/animated_icons/production/fill/all/compass.svg" style={{width: '20px', height: '20px', marginRight: '8px'}} /> {detailedWeather.location.name}
              </h2>
              <p className="text-sm md:text-md opacity-90 text-slate-300">
                {detailedWeather.location.region && `${detailedWeather.location.region}, `}
                {detailedWeather.location.country}
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/90 hover:text-white text-2xl font-bold leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Current Weather */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700 shadow-inner hover:shadow-slate-700/40 transition-all duration-300">
              <div className="flex items-center gap-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32">
                <img 
                  src={getWeatherIcon(detailedWeather.current.condition?.text, detailedWeather.current.is_day)} 
                  alt="weather" 
                  className="w-full h-full"
                />
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-bold text-white">
                  {Math.round(detailedWeather.current.temp_c)}°C
                </div>
                <div className="text-lg text-slate-300 font-medium">
                  {detailedWeather.current.condition?.text}
                </div>
                <div className="text-md text-slate-400">
                  Feels like {Math.round(detailedWeather.current.feelslike_c)}°C
                </div>
              </div>
            </div>
          </div>

          {/* Weather Alerts */}
          {detailedWeather.alerts && detailedWeather.alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/lightning-bolt.svg" style={{width: '20px', height: '20px'}} /> Weather Alerts
              </h3>
              {detailedWeather.alerts.map((alert, idx) => (
                <div key={idx} className="bg-red-500/20 border-l-4 border-red-600 p-4 rounded-lg mb-2">
                  <div className="font-bold text-red-200">{alert.headline}</div>
                  <div className="text-md text-red-300 mt-1">{alert.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Humidity", icon: 'humidity', value: `${detailedWeather.current.humidity}%` },
              { 
                label: "Wind Speed", 
                icon: 'wind',
                value: `${Math.round(detailedWeather.current.wind_kph)} km/h`,
                extra: (
                  <img 
                    src="/animated_icons/production/fill/all/compass.svg"
                    alt="wind direction"
                    className="w-7 h-7 opacity-90 inline-block"
                    style={{ transform: `rotate(${detailedWeather.current.wind_degree || 0}deg)`, transition: 'transform 0.3s ease' }}
                  />
                ),
                footer: `${detailedWeather.current.wind_dir} (${detailedWeather.current.wind_degree}°)`
              },
              { label: "Pressure", icon: 'barometer', value: `${detailedWeather.current.pressure_mb} mb` },
              { label: "Visibility", icon: 'not-available', value: `${detailedWeather.current.vis_km} km` },
              { label: "Cloud Cover", icon: 'cloudy', value: `${detailedWeather.current.cloud}%` },
              { 
                label: "UV Index", 
                icon: 'uv-index',
                value: detailedWeather.current.uv,
                footer: getUVInfo(detailedWeather.current.uv).label 
              },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 hover:bg-slate-800/80 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <div className="text-md text-slate-300 mb-1 flex items-center gap-2">
                  <img src={`/animated_icons/production/fill/all/${item.icon}.svg`} style={{width: '20px', height: '20px', marginRight: '4px'}} />
                  {item.label}
                </div>
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>{item.value}</span>
                  {item.extra}
                </div>
                {item.footer && (
                  <div className="text-sm text-slate-400 mt-1">{item.footer}</div>
                )}
              </div>
            ))}
          </div>

          {/* Air Quality */}
          {detailedWeather.airQuality && detailedWeather.airQuality['us-epa-index'] && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-muted mb-3 flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/not-available.svg" style={{width: '20px', height: '20px'}} /> Air Quality
              </h3>
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold" style={{ color: getAQIInfo(detailedWeather.airQuality['us-epa-index']).color }}>
                      {getAQIInfo(detailedWeather.airQuality['us-epa-index']).emoji} {getAQIInfo(detailedWeather.airQuality['us-epa-index']).label}
                    </div>
                    <div className="text-md text-slate-400">AQI: {detailedWeather.airQuality['us-epa-index']}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm md:text-md">
                  {Object.entries({
                    CO: detailedWeather.airQuality.co,
                    'NO₂': detailedWeather.airQuality.no2,
                    'O₃': detailedWeather.airQuality.o3,
                    PM2_5: detailedWeather.airQuality.pm2_5,
                    PM10: detailedWeather.airQuality.pm10,
                    'SO₂': detailedWeather.airQuality.so2
                  }).map(([k, v]) => v && (
                    <div key={k} className="text-slate-300">
                      <span>{k}:</span>
                      <span className="font-semibold ml-2 text-white">{v.toFixed(1)} μg/m³</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wind Details */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <img src="/animated_icons/production/fill/all/wind.svg" style={{width: '20px', height: '20px'}} /> Wind Details
            </h3>
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700">
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-600 bg-slate-900 shadow-inner">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-sm font-bold text-red-400">N</div>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-400">S</div>
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">W</div>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">E</div>
                  </div>
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                    style={{ transform: `rotate(${detailedWeather.current.wind_degree || 0}deg)` }}
                  >
                    <img 
                      src="/animated_icons/production/fill/all/compass.svg" 
                      alt="wind direction" 
                      className="w-24 h-24 opacity-90"
                    />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {Math.round(detailedWeather.current.wind_kph)} km/h
                </div>
                <div className="text-md text-slate-300 mb-2">
                  Direction: {formatWindDirection(detailedWeather.current.wind_dir)}
                </div>
                <div className="text-sm text-slate-400">
                  {detailedWeather.current.wind_degree}° from North
                </div>
                {detailedWeather.current.gust_kph && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-md text-slate-300">
                      <img src="/animated_icons/production/fill/all/wind.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Gusts up to <span className="font-bold text-white">{Math.round(detailedWeather.current.gust_kph)} km/h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3-Day Forecast */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <img src="/animated_icons/production/fill/all/not-available.svg" style={{width: '20px', height: '20px'}} /> 3-Day Forecast
            </h3>
            <div className="space-y-3">
              {detailedWeather.forecast.map((day, idx) => (
                <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:bg-slate-800/80 transition-colors">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16">
                        <img 
                          src={getWeatherIcon(day.day.condition?.text, true)} 
                          alt="weather" 
                          className="w-full h-full"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-md text-slate-300">{day.day.condition?.text}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {Math.round(day.day.maxtemp_c)}°
                      </div>
                      <div className="text-md text-slate-400">
                        {Math.round(day.day.mintemp_c)}°
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                    <div className="p-2 rounded bg-slate-700/50">
                      <img src="/animated_icons/production/fill/all/raindrop.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Rain <span className="font-semibold text-white ml-1">{day.day.daily_chance_of_rain}%</span>
                    </div>
                    <div className="p-2 rounded bg-slate-700/50">
                      <img src="/animated_icons/production/fill/all/wind.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Wind <span className="font-semibold text-white ml-1">{Math.round(day.day.maxwind_kph)} km/h</span>
                    </div>
                    <div className="p-2 rounded bg-slate-700/50">
                      <img src="/animated_icons/production/fill/all/uv-index.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> UV <span className="font-semibold text-white ml-1">{day.day.uv}</span>
                    </div>
                  </div>

                  {day.astro && (
                    <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-sm text-slate-400">
                      <div><img src="/animated_icons/production/fill/all/sunrise.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Sunrise: <span className="font-semibold text-white ml-1">{day.astro.sunrise}</span></div>
                      <div><img src="/animated_icons/production/fill/all/sunset.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Sunset: <span className="font-semibold text-white ml-1">{day.astro.sunset}</span></div>
                      <div><img src="/animated_icons/production/fill/all/moon-full.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Phase: <span className="font-semibold text-white ml-1">{day.astro.moon_phase}</span></div>
                      <div><img src="/animated_icons/production/fill/all/moonrise.svg" style={{width: '20px', height: '20px', marginRight: '6px'}} /> Moonrise: <span className="font-semibold text-white ml-1">{day.astro.moonrise}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800/70 p-4 rounded-b-2xl border-t border-slate-700 backdrop-blur-sm">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {loading && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2001] flex items-center justify-center">
      <div className="bg-slate-800 text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-semibold">Loading detailed weather...</div>
        </div>
      </div>
    </div>
  )}
  </>
  )
}