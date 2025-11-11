import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { show as fetchWeather, getForecast, formatWindDirection, getAQIInfo, getUVInfo } from '../../services/weatherService';
import { DragCloseDrawer } from './drawer';
import Spinner from '../Spinner/Spinner';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPEN_WEATHER_API_KEY;

// Weather Layer Types
const WEATHER_LAYERS = {
  PRECIPITATION: { id: 'precipitation_new', name: '🌧️ Precipitation', opacity: 0.55 },
  CLOUDS: { id: 'clouds_new', name: '☁️ Clouds', opacity: 0.35 },
  TEMPERATURE: { id: 'temp_new', name: '🌡️ Temperature', opacity: 0.4 },
  WIND: { id: 'wind_new', name: '💨 Wind Speed', opacity: 0.35 },
};

// خريطة الأيقونات المتحركة
const animatedIconsMap = {
  'clear': 'clear-day',
  'sunny': 'clear-day',
  'cloudy': 'cloudy',
  'overcast': 'overcast',
  'partly cloudy': 'partly-cloudy-day',
  'rain': 'rain',
  'drizzle': 'drizzle',
  'light rain': 'rain',
  'heavy rain': 'rain',
  'snow': 'snow',
  'blizzard': 'snow',
  'sleet': 'sleet',
  'thunder': 'thunderstorms',
  'storm': 'thunderstorms',
  'lightning': 'thunderstorms',
  'fog': 'fog',
  'mist': 'mist',
  'haze': 'haze',
  'default': 'not-available'
};

// دالة للحصول على أيقونة الطقس المناسبة
const getWeatherIcon = (condition, isDay) => {
  const c = condition?.toLowerCase() || '';
  for (const [key, icon] of Object.entries(animatedIconsMap)) {
    if (c.includes(key)) {
      if (!isDay && icon.includes('-day')) {
        const nightIcon = icon.replace('-day', '-night');
        return `/animated_icons/production/fill/all/${nightIcon}.svg`;
      }
      return `/animated_icons/production/fill/all/${icon}.svg`;
    }
  }
  return `/animated_icons/production/fill/all/${animatedIconsMap['default']}.svg`;
};

export default function WorldMapWeather() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const weatherLayersRef = useRef({});
  
  const [activeWeatherLayer, setActiveWeatherLayer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerWeather, setDrawerWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [_selectedLocation, setSelectedLocation] = useState(null);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [layersPos, setLayersPos] = useState({ x: 16, y: 320 });
  
  // حفظ History و Pins في localStorage
  const [clickHistory, setClickHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('weatherClickHistory_advanced');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [savedPins, setSavedPins] = useState(() => {
    try {
      const saved = localStorage.getItem('weatherSavedPins_advanced');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // حفظ clickHistory في localStorage
  useEffect(() => {
    localStorage.setItem('weatherClickHistory_advanced', JSON.stringify(clickHistory));
  }, [clickHistory]);

  // حفظ savedPins في localStorage
  useEffect(() => {
    localStorage.setItem('weatherSavedPins_advanced', JSON.stringify(savedPins));
  }, [savedPins]);

  // دوال إدارة السجل
  const removeHistoryItem = (index) => {
    const locationName = clickHistory[index];
    
    setClickHistory(prev => prev.filter((_, i) => i !== index));
    setSavedPins(prev => prev.filter(p => p.locationName !== locationName));
    
    const map = mapInstanceRef.current;
    if (map) {
      markersRef.current = markersRef.current.filter(marker => {
        if (marker.locationName === locationName) {
          try {
            map.removeLayer(marker);
          } catch (e) {
            console.warn('Failed to remove marker:', e);
          }
          return false;
        }
        return true;
      });
    }
  };

  const clearHistory = () => {
    setClickHistory([]);
    setSavedPins([]);
    clearMarkers();
  };

  // التحقق من API key
  useEffect(() => {
    if (!OPENWEATHER_API_KEY) {
      console.error('⚠️ VITE_OPEN_WEATHER_API_KEY is not set!');
      console.error('Weather layers will not work without the API key.');
    } else {
      console.log('✅ OpenWeatherMap API Key is configured');
      console.log(`Key: ${OPENWEATHER_API_KEY.substring(0, 8)}...`);
    }
  }, []);

  // تهيئة الخارطة
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        maxBounds: [[-90, -180], [90, 180]], // منع التكرار الأفقي
        maxBoundsViscosity: 1.0, // منع السحب خارج الحدود
        worldCopyJump: false, // إيقاف النسخ المتعددة للخريطة
        zoomControl: true,
      });

      // الخريطة الأساسية - Dark Matter (سوداء حقيقية)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        noWrap: true, // منع تكرار الخريطة
        bounds: [[-90, -180], [90, 180]]
      }).addTo(map);

      // إضافة التسميات فوق الخريطة
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19,
        pane: 'shadowPane',
        noWrap: true, // منع تكرار التسميات
        bounds: [[-90, -180], [90, 180]]
      }).addTo(map);

      map.zoomControl.setPosition('topright');
      mapInstanceRef.current = map;

      // إضافة حدث Double Click لإضافة pin
      map.on('dblclick', async (e) => {
        const { lat, lng } = e.latlng;
        await addWeatherPin(lat, lng);
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // إضافة/إزالة طبقات الطقس
  const toggleWeatherLayer = useCallback((layerKey) => {
    if (!mapInstanceRef.current) {
      console.error('Map instance not available');
      return;
    }
    
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API Key is missing!');
      alert('OpenWeatherMap API Key is not configured. Please check your .env file.');
      return;
    }

    const map = mapInstanceRef.current;
    
    // إزالة الطبقة الحالية إذا كانت نفسها
    if (activeWeatherLayer === layerKey) {
      if (weatherLayersRef.current[layerKey]) {
        map.removeLayer(weatherLayersRef.current[layerKey]);
        delete weatherLayersRef.current[layerKey];
      }
      setActiveWeatherLayer(null);
      console.log(`Removed layer: ${layerKey}`);
      return;
    }

    // إزالة جميع الطبقات الأخرى
    Object.keys(weatherLayersRef.current).forEach((key) => {
      if (weatherLayersRef.current[key]) {
        map.removeLayer(weatherLayersRef.current[key]);
        delete weatherLayersRef.current[key];
      }
    });

    // إضافة الطبقة الجديدة
    const layer = WEATHER_LAYERS[layerKey];
    const tileUrl = `https://tile.openweathermap.org/map/${layer.id}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
    console.log(`Loading weather layer: ${layerKey}`);
    console.log(`Tile URL: ${tileUrl.replace(OPENWEATHER_API_KEY, 'YOUR_API_KEY')}`);
    
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: 'Weather data © OpenWeatherMap',
      opacity: layer.opacity,
      maxZoom: 19,
      errorTileUrl: '', // منع عرض placeholder للـ tiles الفاشلة
    });

    // معالجة أخطاء التحميل
    tileLayer.on('tileerror', (error) => {
      console.error(`Failed to load tile for ${layerKey}:`, error);
    });

    tileLayer.on('tileload', () => {
      console.log(`Tile loaded successfully for ${layerKey}`);
    });

    tileLayer.addTo(map);
    weatherLayersRef.current[layerKey] = tileLayer;
    setActiveWeatherLayer(layerKey);
    console.log(`Added layer: ${layerKey} with opacity: ${layer.opacity}`);
  }, [activeWeatherLayer]);

  // إضافة pin للطقس - نسخة محسّنة
  const addWeatherPin = useCallback(async (lat, lng) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const data = await fetchWeather(`${lat.toFixed(4)},${lng.toFixed(4)}`);
      
      if (!data || !data.location || !data.current) {
        console.warn('Invalid weather data');
        return;
      }

      const { location, current, astronomy, isDay, airQuality } = data;
      const weatherIcon = getWeatherIcon(current.condition?.text, isDay);
      const bgColor = isDay ? '#3b82f6' : '#1e293b';

      const customIcon = L.icon({
        iconUrl: '/images/pin.svg',
        iconSize: [80, 80],
        iconAnchor: [40, 80],
        popupAnchor: [0, -80],
      });

      const uvInfo = getUVInfo(current.uv || 0);
      const aqiValue = airQuality?.['us-epa-index'];
      const aqiInfo = aqiValue ? getAQIInfo(aqiValue) : null;
      const windDegree = current.wind_degree || 0;

      const popupContent = `
        <div class="weather-popup">
          <div class="popup-header" style="background: linear-gradient(135deg, ${bgColor} 0%, ${isDay ? '#60a5fa' : '#334155'} 100%);">
            <div class="text-xl font-bold mb-1 flex items-center gap-2">
              <img src="/animated_icons/production/fill/all/compass.svg" class="w-5 h-5" /> ${location.name}
            </div>
            <div class="text-sm opacity-90">
              ${location.region ? location.region + ', ' : ''}${location.country}
            </div>
            <div class="text-xs opacity-80 mt-1">
              🕒 ${location.localtime || 'N/A'}
            </div>
          </div>
          
          <div class="popup-main-temp">
            <div class="w-16 h-16">
              <img src="${weatherIcon}" class="w-full h-full" />
            </div>
            <div>
              <div class="text-4xl font-bold" style="color: var(--color-text);">
                ${Math.round(current.temp_c)}°C
              </div>
              <div class="text-sm font-medium" style="color: var(--color-muted);">
                ${current.condition?.text || 'N/A'}
              </div>
              <div class="text-xs mt-1" style="color: var(--color-text-secondary);">
                Feels like ${Math.round(current.feelslike_c)}°C
              </div>
            </div>
          </div>
          
          <div class="popup-grid">
            <div class="popup-card">
              <div class="popup-card-label">
                <img src="/animated_icons/production/fill/all/humidity.svg" class="w-4 h-4" /> Humidity
              </div>
              <div class="popup-card-value">${current.humidity}%</div>
            </div>
            <div class="popup-card">
              <div class="popup-card-label">
                <img src="/animated_icons/production/fill/all/wind.svg" class="w-4 h-4" /> Wind
              </div>
              <div class="popup-card-value">
                <span>${Math.round(current.wind_kph)} km/h</span>
                <img 
                  src="/animated_icons/production/fill/all/compass.svg" 
                  class="w-5 h-5"
                  style="transform: rotate(${windDegree}deg);"
                />
              </div>
              <div class="text-xs" style="color: var(--color-text-secondary);">${current.wind_dir} (${windDegree}°)</div>
            </div>
            <div class="popup-card">
              <div class="popup-card-label">
                <img src="/animated_icons/production/fill/all/barometer.svg" class="w-4 h-4" /> Pressure
              </div>
              <div class="popup-card-value">${current.pressure_mb} mb</div>
            </div>
            <div class="popup-card">
              <div class="popup-card-label">
                <img src="/animated_icons/production/fill/all/haze.svg" class="w-4 h-4" /> Visibility
              </div>
              <div class="popup-card-value">${current.vis_km} km</div>
            </div>
          </div>

          ${current.uv ? `
            <div class="popup-info-box" style="background: ${uvInfo.color}22; border-left-color: ${uvInfo.color};">
              <div class="popup-info-title">
                <img src="/animated_icons/production/fill/all/uv-index.svg" class="w-4 h-4" /> UV Index: ${current.uv} - ${uvInfo.label}
              </div>
              <div class="popup-info-text">${uvInfo.advice}</div>
            </div>
          ` : ''}

          ${aqiInfo ? `
            <div class="popup-info-box" style="background: ${aqiInfo.color}22; border-left-color: ${aqiInfo.color};">
              <div class="popup-info-title">
                <img src="/animated_icons/production/fill/all/smoke-particles.svg" class="w-4 h-4" /> Air Quality: ${aqiInfo.label}
              </div>
              <div class="popup-info-text">AQI: ${aqiValue}</div>
            </div>
          ` : ''}
          
          ${astronomy ? `
            <div class="popup-astro">
              <div>
                <img src="/animated_icons/production/fill/all/sunrise.svg" class="w-4 h-4" /> Sunrise
                <div>${astronomy.sunrise || '--'}</div>
              </div>
              <div>
                <img src="/animated_icons/production/fill/all/sunset.svg" class="w-4 h-4" /> Sunset
                <div>${astronomy.sunset || '--'}</div>
              </div>
              <div>
                <img src="/animated_icons/production/fill/all/moon-full.svg" class="w-4 h-4" /> Moon Phase
                <div>${astronomy.moon_phase || '--'}</div>
              </div>
              <div>
                <img src="/animated_icons/production/fill/all/moonrise.svg" class="w-4 h-4" /> Moonrise
                <div>${astronomy.moonrise || '--'}</div>
              </div>
            </div>
          ` : ''}

          <button 
            onclick="window.openWeatherDrawer('${location.name}')"
            class="popup-button"
          >
            📊 View 3-Day Forecast
          </button>
        </div>
      `;

      // tooltip للعرض عند hover
      const tooltipContent = `
        <div style="text-align: center; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${location.name}</div>
          <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${Math.round(current.temp_c)}°C</div>
          <div style="font-size: 12px; color: #64748b;">${current.condition?.text || 'N/A'}</div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip',
          offset: [0, -40]
        })
        .bindPopup(popupContent, {
          maxWidth: 420,
          className: 'custom-popup'
        })
        .addTo(map);

      marker.openPopup();

      // إضافة للهستوري
      setSelectedLocation(location.name);
      setClickHistory(prev => {
        const filtered = prev.filter(item => item !== location.name);
        return [location.name, ...filtered].slice(0, 20);
      });

      // حفظ بيانات الـ pin
      setSavedPins(prev => {
        const filtered = prev.filter(p => p.lat !== lat || p.lng !== lng);
        return [{ lat, lng, locationName: location.name }, ...filtered].slice(0, 20);
      });

      marker.locationName = location.name;
      markersRef.current.push(marker);

      if (markersRef.current.length > 10) {
        const old = markersRef.current.shift();
        try { map.removeLayer(old); } catch { /* empty */ }
      }

    } catch (err) {
      console.warn('Weather fetch error:', err);
    }
  }, []);

  // فتح الـ drawer مع بيانات الطقس
  const openDrawerWithWeather = useCallback(async (location) => {
    setLoading(true);
    try {
      const forecast = await getForecast(location, 3);
      setDrawerWeather(forecast);
      setDrawerOpen(true);
    } catch (err) {
      console.error('Failed to fetch weather for drawer:', err);
      alert('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ربط دالة الـ window
  useEffect(() => {
    window.openWeatherDrawer = (locationName) => {
      setSelectedLocation(locationName);
      setClickHistory(prev => {
        const filtered = prev.filter(item => item !== locationName);
        return [locationName, ...filtered].slice(0, 20);
      });
      openDrawerWithWeather(locationName);
    };
    
    return () => {
      delete window.openWeatherDrawer;
    };
  }, [openDrawerWithWeather]);

  // مسح جميع الـ markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  // Drag functionality for Weather Layers
  const layersDragRef = useRef({ active: false, sx: 0, sy: 0, ox: 16, oy: 320 });

  useEffect(() => {
    const onMove = (e) => {
      if (layersDragRef.current.active) {
        e.preventDefault();
        const nx = e.clientX - layersDragRef.current.sx + layersDragRef.current.ox;
        const ny = e.clientY - layersDragRef.current.sy + layersDragRef.current.oy;
        setLayersPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
      }
    };

    const onUp = () => {
      layersDragRef.current.active = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startLayersDrag = (e) => {
    e.stopPropagation();
    layersDragRef.current = { 
      active: true, 
      sx: e.clientX, 
      sy: e.clientY, 
      ox: layersPos.x, 
      oy: layersPos.y 
    };
  };

  /* مكون Swipe to Delete */
  function SwipeToDeleteItem({ name, onDelete, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const SWIPE_DISTANCE = -80;
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
        className="relative overflow-hidden border-b border-[var(--color-border)]"
      >
        <div className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-end px-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
          </motion.button>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: SWIPE_DISTANCE, right: 0 }}
          dragElastic={0.2}
          dragMomentum={false}
          animate={{ x: isOpen ? SWIPE_DISTANCE : 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < SWIPE_DISTANCE / 2) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          className="bg-[var(--color-card)] relative z-10 flex items-center justify-between py-3 cursor-grab active:cursor-grabbing"
        >
          <button
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                onSelect();
              }
            }}
            className="text-left text-sm hover:underline flex-1 px-2 text-white transition-colors"
          >
            {name}
          </button>
          
          <div className="px-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 6h6M7 10h6M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  /* مكون السجل القابل للسحب */
  function DraggableHistory({ initialPos = { x: 16, y: 16 }, initialSize = { w: 320, h: 260 } }) {
    const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: initialPos.x, oy: initialPos.y });
    const resizeRef = useRef({ active: false, sw: initialSize.w, sh: initialSize.h, ow: initialSize.w, oh: initialSize.h, sx: 0, sy: 0 });
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState(initialSize);
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        className="absolute z-[1200] hidden sm:block"
        style={{ 
          left: pos.x + 'px', 
          top: pos.y + 'px', 
          width: size.w + 'px', 
          height: isCollapsed ? 'auto' : size.h + 'px', 
          minWidth: 180, 
          minHeight: isCollapsed ? 'auto' : 120 
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl shadow-lg overflow-hidden flex flex-col bg-stone-800 border border-stone-950" style={{ height: isCollapsed ? 'auto' : '100%' }}>
          <div
            className="flex items-center justify-between px-3 py-2 bg-stone-900 text-white select-none"
            onMouseDown={(e) => {
              if (!isCollapsed) {
                startDrag(e);
              }
            }}
          >
            <div className="flex items-center gap-2 font-bold cursor-move">
              <img src="/animated_icons/production/fill/all/compass.svg" className="w-5 h-5" />
              <span>History</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }} 
                className="text-lg text-orange-300/85 hover:text-white px-2"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
              {!isCollapsed && (
                <>
                  <button onClick={clearHistory} className="text-sm text-white/85 hover:text-white">Clear</button>
                  <button onClick={() => { setSize(initialSize); setPos(initialPos); }} className="text-sm text-white/85 hover:text-white">Reset</button>
                </>
              )}
            </div>
          </div>

          {!isCollapsed && (
            <>
              <div className="p-2 overflow-auto flex-1">
            <AnimatePresence mode="popLayout">
              {clickHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-stone-600"
                >
                  No clicks yet – click the map to add
                </motion.div>
              ) : (
                clickHistory.map((name, idx) => (
                  <SwipeToDeleteItem
                    key={`${name}-${idx}`}
                    name={name}
                    onDelete={() => removeHistoryItem(idx)}
                    onSelect={() => { setSelectedLocation(name); openDrawerWithWeather(name); }}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          <div
            onMouseDown={startResize}
            className="h-3 cursor-nwse-resize flex justify-end items-center pr-2"
          >
            <div className="w-3 h-3 rounded bg-stone-600 opacity-60" />
          </div>
          </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Spinner */}
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {/* الخريطة */}
        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full bg-black"
        />

        {/* History Box - في الأعلى */}
        <DraggableHistory />

        {/* أزرار طبقات الطقس - قابل للسحب */}
        <div 
          className="absolute z-[1000] bg-neutral-950/80 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-600/50"
          style={{ left: `${layersPos.x}px`, top: `${layersPos.y}px` }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center justify-between px-3 py-2 border-b border-neutral-600 select-none"
            style={{ cursor: 'move' }}
            onMouseDown={startLayersDrag}
          >
            <div className="flex items-center gap-2 font-bold text-white">
              <img src="/animated_icons/production/fill/all/raindrop.svg" className="w-5 h-5" />
              <h3 className="text-sm">Weather Layers</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setLayersCollapsed(!layersCollapsed);
                }}
                className="text-lg text-orange-300/85 hover:text-zinc-300 px-2"
                title={layersCollapsed ? "Expand" : "Collapse"}
              >
                {layersCollapsed ? '▼' : '▲'}
              </button>
              {!layersCollapsed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLayersPos({ x: 16, y: 320 });
                  }} 
                  className="text-sm text-white/85 hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {!layersCollapsed && (
            <div className="flex flex-col gap-2 p-3">
              {Object.entries(WEATHER_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => toggleWeatherLayer(key)}
                  className={`px-4 py-2 rounded-lg mb-2 text-sm font-medium transition-all ${
                    activeWeatherLayer === key
                      ? 'bg-neutral-600 text-white shadow-md'
                      : 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600'
                  }`}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ملاحظة توضيحية */}
        <div className="absolute top-4 left-1/2 transform -tranneutral-x-1/2 z-[1000] bg-neutral-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hidden sm:block border border-neutral-600">
          💡 Double-click on map to add pin | Select weather layer
        </div>

        {/* أزرار التحكم */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.setView([20, 0], 3, { animate: true })}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium border border-neutral-600 flex items-center gap-2 text-sm"
          >
            <img src="/animated_icons/production/fill/all/compass.svg" className="w-4 h-4" />
            <span className="hidden sm:inline">Reset View</span>
          </button>

          <button
            onClick={clearMarkers}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium border border-red-500 flex items-center gap-2 text-sm"
          >
            <img src="/animated_icons/production/fill/all/not-available.svg" className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        <style>{`
          /* إزالة المسافات البيضاء */
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          .leaflet-container {
            background: #000000 !important;
          }

          /* Weather Pin Styles */
          .custom-weather-marker {
            background: none;
            border: none;
          }

          .weather-pin {
            background: white;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid #3b82f6;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .weather-pin:hover {
            transform: scale(1.15);
          }

          .weather-pin img {
            width: 32px;
            height: 32px;
          }

          .weather-pin .temp {
            font-size: 11px;
            font-weight: bold;
            color: #1e293b;
            margin-top: -2px;
          }

          /* Popup Styles */
          .custom-popup {
            max-width: 92vw !important;
          }
          
          .custom-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.22);
            max-width: 420px;
            background: var(--color-card);
            color: var(--color-text);
            border: 1px solid var(--color-border);
          }
          
          .custom-popup .leaflet-popup-content {
            margin: 0;
            padding: 12px;
            box-sizing: border-box;
            width: 100%;
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          .custom-popup .leaflet-popup-tip {
            background: var(--color-card);
          }

          /* Tooltip Styles */
          .custom-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          .custom-tooltip .leaflet-tooltip-content {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            padding: 8px 12px;
            border: 2px solid #3b82f6;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .custom-tooltip::before {
            display: none;
          }

          .weather-popup {
            min-width: 280px;
            max-width: 400px;
          }

          .popup-header {
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            margin: -12px -12px 12px -12px;
          }

          .popup-main-temp {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
          }

          .popup-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }

          .popup-card {
            background: var(--color-bg-secondary);
            padding: 10px;
            border-radius: 8px;
          }

          .popup-card-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .popup-card-value {
            font-size: 16px;
            font-weight: bold;
            color: var(--color-text);
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .popup-info-box {
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            border-left: 3px solid;
          }

          .popup-info-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--color-text);
          }

          .popup-info-text {
            font-size: 12px;
            color: var(--color-text-secondary);
          }

          .popup-astro {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--color-border);
          }

          .popup-astro > div {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
            font-size: 12px;
            color: var(--color-text);
          }

          .popup-astro > div:first-child {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            color: var(--color-text-secondary);
          }

          .popup-button {
            width: 100%;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 12px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            font-size: 14px;
          }

          .popup-button:hover {
            transform: tranneutralY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }

          .popup-button:active {
            transform: tranneutralY(0);
          }
        `}</style>
      </div>

      {/* الـ Drawer لعرض بيانات الطقس */}
      <DragCloseDrawer open={drawerOpen} setOpen={setDrawerOpen}>
        {drawerWeather && (
          <div className="w-full space-y-4 pb-8">
            {/* عنوان الموقع */}
            <div className="border-b border-neutral-700 pb-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/compass.svg" className="w-7 h-7" />
                {drawerWeather.location.name}
              </h2>
              <p className="text-base text-neutral-400 mt-1">
                {drawerWeather.location.region && `${drawerWeather.location.region}, `}
                {drawerWeather.location.country}
              </p>
            </div>

            {/* الطقس الحالي */}
            <div className="bg-neutral-800/60 backdrop-blur-sm p-6 rounded-xl border border-neutral-700">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-28 h-28">
                  <img
                    src={getWeatherIcon(drawerWeather.current.condition?.text, drawerWeather.current.is_day)}
                    alt="weather"
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <div className="text-5xl font-bold text-white">
                    {Math.round(drawerWeather.current.temp_c)}°C
                  </div>
                  <div className="text-xl text-neutral-300 mt-1">
                    {drawerWeather.current.condition?.text}
                  </div>
                  <div className="text-base text-neutral-400 mt-2">
                    Feels like {Math.round(drawerWeather.current.feelslike_c)}°C
                  </div>
                </div>
              </div>
            </div>

            {/* تفاصيل الرياح - البوصلة */}
            <div className="bg-neutral-800/60 p-6 rounded-xl border border-neutral-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/wind.svg" className="w-6 h-6" /> Wind Details
              </h3>
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-600 bg-neutral-900 shadow-inner">
                    <div className="absolute top-2 left-1/2 -tranneutral-x-1/2 text-lg font-bold text-red-400">N</div>
                    <div className="absolute bottom-2 left-1/2 -tranneutral-x-1/2 text-lg font-bold text-neutral-400">S</div>
                    <div className="absolute left-2 top-1/2 -tranneutral-y-1/2 text-lg font-bold text-neutral-400">W</div>
                    <div className="absolute right-2 top-1/2 -tranneutral-y-1/2 text-lg font-bold text-neutral-400">E</div>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                    style={{ transform: `rotate(${drawerWeather.current.wind_degree || 0}deg)` }}
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
                <div className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <img src="/animated_icons/production/fill/all/wind.svg" className="w-7 h-7" />
                  {Math.round(drawerWeather.current.wind_kph)} km/h
                </div>
                <div className="text-base text-neutral-300 mb-2">
                  Direction: {formatWindDirection(drawerWeather.current.wind_dir)}
                </div>
                <div className="text-sm text-neutral-400">
                  {drawerWeather.current.wind_degree}° from North
                </div>
                {drawerWeather.current.gust_kph && (
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <div className="text-base text-neutral-300 flex items-center justify-center gap-2">
                      <img src="/animated_icons/production/fill/all/wind.svg" className="w-5 h-5" />
                      Gusts up to <span className="font-bold text-white">{Math.round(drawerWeather.current.gust_kph)} km/h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* توقعات 3 أيام */}
            <div>
              <h3 className="text-2xl font-bold text-neutral-200 mb-4 flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/clear-day.svg" className="w-7 h-7" />
                3-Day Forecast
              </h3>
              <div className="space-y-4">
                {drawerWeather.forecast.map((day, idx) => (
                  <div key={idx} className="bg-neutral-800/60 p-5 rounded-xl border border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20">
                          <img
                            src={getWeatherIcon(day.day.condition?.text, true)}
                            alt="weather"
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-base text-neutral-300 mt-1">{day.day.condition?.text}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          {Math.round(day.day.maxtemp_c)}°
                        </div>
                        <div className="text-base text-neutral-400 mt-1">
                          {Math.round(day.day.mintemp_c)}°
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-base">
                      <div className="p-3 rounded bg-neutral-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/raindrop.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{day.day.daily_chance_of_rain}%</span>
                      </div>
                      <div className="p-3 rounded bg-neutral-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/wind.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{Math.round(day.day.maxwind_kph)} km/h</span>
                      </div>
                      <div className="p-3 rounded bg-neutral-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/uv-index.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{day.day.uv}</span>
                      </div>
                    </div>

                    {day.astro && (
                      <div className="mt-4 pt-4 border-t border-neutral-700 grid grid-cols-2 gap-3 text-base text-neutral-400">
                        <div className="flex items-center gap-2">
                          <img src="/animated_icons/production/fill/all/sunrise.svg" className="w-6 h-6" />
                          <span className="font-semibold text-white">{day.astro.sunrise}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="/animated_icons/production/fill/all/sunset.svg" className="w-6 h-6" />
                          <span className="font-semibold text-white">{day.astro.sunset}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="/animated_icons/production/fill/all/moon-full.svg" className="w-6 h-6" />
                          <span className="font-semibold text-white">{day.astro.moon_phase}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="/animated_icons/production/fill/all/moonrise.svg" className="w-6 h-6" />
                          <span className="font-semibold text-white">{day.astro.moonrise}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DragCloseDrawer>
    </>
  );
}
