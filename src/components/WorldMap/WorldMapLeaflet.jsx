import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import Spinner from '../Spinner/Spinner';
import { DragCloseDrawer } from './drawer';
import { 
  show as fetchWeather, 
  getForecast,
  getAQIInfo,
  getUVInfo,
  formatWindDirection 
} from '../../services/weatherService';

/**
 * Interactive Weather Map Component
 * Displays weather data with detailed modal popups
 */
export default function LeafletWorldMap({ onCountryClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lastFetchRef = useRef({ lat: null, lng: null, time: 0 });
  const isLoadingRef = useRef(false);
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detailedWeather, setDetailedWeather] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerWeather, setDrawerWeather] = useState(null);
  
  // حفظ History و Pins في localStorage
  const [clickHistory, setClickHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('weatherClickHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [savedPins, setSavedPins] = useState(() => {
    try {
      const saved = localStorage.getItem('weatherSavedPins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // حفظ clickHistory في localStorage عند تغييره
  useEffect(() => {
    localStorage.setItem('weatherClickHistory', JSON.stringify(clickHistory));
  }, [clickHistory]);

  // حفظ savedPins في localStorage عند تغييره
  useEffect(() => {
    localStorage.setItem('weatherSavedPins', JSON.stringify(savedPins));
  }, [savedPins]);

  // تحديث عنوان الصفحة عند تحديد موقع
  useEffect(() => {
    if (!selectedLocation) return;
    const prevTitle = document.title;
    document.title = `Weather - ${selectedLocation}`;
    return () => { document.title = prevTitle; };
  }, [selectedLocation]);

  // دوال إدارة السجل
  const removeHistoryItem = (index) => {
    const locationName = clickHistory[index];
    
    // حذف من history
    setClickHistory(prev => prev.filter((_, i) => i !== index));
    
    // حذف من savedPins
    setSavedPins(prev => prev.filter(p => p.locationName !== locationName));
    
    // حذف الـ marker من الخريطة
    const map = mapInstanceRef.current;
    if (map) {
      markersRef.current = markersRef.current.filter(marker => {
        if (marker.locationName === locationName) {
          try {
            map.removeLayer(marker);
          } catch (e) {
            console.warn('Failed to remove marker:', e);
          }
          return false; // حذف من المصفوفة
        }
        return true; // الاحتفاظ به
      });
    }
  };

  const clearHistory = () => {
    setClickHistory([]);
    setSavedPins([]);
    clearMarkers();
  };

  // تهيئة الخارطة
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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
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

  // مسح العلامات
  const clearMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current.removeLayer(marker);
      } catch { /* empty */ }
    });
    markersRef.current = [];
  }, []);

  // جلب بيانات الطقس التفصيلية
  const fetchDetailedWeather = useCallback(async (location) => {
    setLoading(true);
    try {
      // تشغيل جلب البيانات والتأخير معاً
      const [forecast] = await Promise.all([
        getForecast(location, 3),
        new Promise((res) => setTimeout(res, 2500)) // عرض الـ Spinner لمدة 2.5 ثانية
      ]);
      
      setDetailedWeather(forecast);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to fetch detailed weather:', err);
      alert('Failed to load detailed weather. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // فتح الـ drawer مع بيانات الطقس
  const openDrawerWithWeather = useCallback(async (location) => {
    setLoading(true);
    try {
      const [forecast] = await Promise.all([
        getForecast(location, 3),
        new Promise((res) => setTimeout(res, 1000))
      ]);
      
      setDrawerWeather(forecast);
      setDrawerOpen(true);
    } catch (err) {
      console.error('Failed to fetch weather for drawer:', err);
      alert('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // خريطة الأيقونات
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

  // الحصول على أيقونة الطقس
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

  // جلب بيانات الطقس للموقع
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

      // إنشاء tooltip للعرض عند hover
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

      // إضافة الموقع للـ history فوراً
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

      // حفظ اسم الموقع في الـ marker للربط
      marker.locationName = location.name;

      marker.on('click', () => {
        setSelectedLocation(location.name);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCountryClick]);

  // ربط دالة الـ window
  useEffect(() => {
    window.showDetailedWeather = (locationName) => {
      setSelectedLocation(locationName);
      setClickHistory(prev => {
        const filtered = prev.filter(item => item !== locationName);
        return [locationName, ...filtered].slice(0, 20);
      });
      fetchDetailedWeather(locationName);
    };
    
    window.openWeatherDrawer = (locationName) => {
      setSelectedLocation(locationName);
      setClickHistory(prev => {
        const filtered = prev.filter(item => item !== locationName);
        return [locationName, ...filtered].slice(0, 20);
      });
      openDrawerWithWeather(locationName);
    };
    
    return () => {
      delete window.showDetailedWeather;
      delete window.openWeatherDrawer;
    };
  }, [fetchDetailedWeather, openDrawerWithWeather]);

  // معالج الضغط المزدوج على الخارطة
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapDblClick = (e) => {
      fetchWeatherForLocation(e.latlng.lat, e.latlng.lng);
    };

    map.on('dblclick', handleMapDblClick);
    return () => map.off('dblclick', handleMapDblClick);
  }, [fetchWeatherForLocation]);

  // إعادة إنشاء الـ pins المحفوظة عند تحميل الصفحة
  const pinsLoadedRef = useRef(false);
  
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || pinsLoadedRef.current || savedPins.length === 0) return;

    // الانتظار حتى تتهيأ الخارطة
    const timer = setTimeout(() => {
      savedPins.forEach(pin => {
        fetchWeatherForLocation(pin.lat, pin.lng);
      });
      pinsLoadedRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstanceRef.current]); // عند تهيئة الخارطة

  /* مكون Swipe to Delete */
  function SwipeToDeleteItem({ name, onDelete, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const SWIPE_DISTANCE = -80; // المسافة لفتح زر الحذف
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
        className="relative overflow-hidden border-b border-[var(--color-border)]"
      >
        {/* خلفية زر الحذف */}
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

        {/* العنصر القابل للسحب */}
        <motion.div
          drag="x"
          dragConstraints={{ left: SWIPE_DISTANCE, right: 0 }}
          dragElastic={0.2}
          dragMomentum={false}
          animate={{ x: isOpen ? SWIPE_DISTANCE : 0 }}
          onDragEnd={(e, info) => {
            // إذا تم السحب أكثر من نصف المسافة، افتح زر الحذف
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
            className="text-left text-sm hover:underline flex-1 px-2 text-black transition-colors"
          >
            {name}
          </button>
          
          {/* مؤشر السحب */}
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
        style={{ left: pos.x + 'px', top: pos.y + 'px', width: size.w + 'px', height: size.h + 'px', minWidth: 180, minHeight: 120 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl shadow-lg overflow-hidden flex flex-col h-full bg-card border border-[var(--color-border)]">
          <div
            className="flex items-center justify-between px-3 py-2 cursor-move bg-black text-white select-none"
            onMouseDown={startDrag}
          >
            <div className="flex items-center gap-2 font-bold">
              <img src="/animated_icons/production/fill/all/compass.svg" className="w-5 h-5" />
              <span>History</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearHistory} className="text-sm text-white/85 hover:text-white">Clear</button>
              <button onClick={() => { setSize(initialSize); setPos(initialPos); }} className="text-sm text-white/85 hover:text-white">Reset</button>
            </div>
          </div>

          <div className="p-2 overflow-auto flex-1">
            
            <AnimatePresence mode="popLayout">
              {clickHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[var(--color-text-secondary)]"
                >
                  No clicks yet – click the map to add
                </motion.div>
              ) : (
                clickHistory.map((name, idx) => (
                  <SwipeToDeleteItem
                    key={`${name}-${idx}`}
                    name={name}
                    onDelete={() => removeHistoryItem(idx)}
                    onSelect={() => { setSelectedLocation(name); fetchDetailedWeather(name); }}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          <div
            onMouseDown={startResize}
            className="h-3 cursor-nwse-resize flex justify-end items-center pr-2"
          >
            <div className="w-3 h-3 rounded bg-[var(--color-border)] opacity-60" />
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
          className="w-full h-full rounded-none sm:rounded-2xl border-0 sm:border-4 border-blue-200 shadow-2xl bg-sky-100"
        />

        <DraggableHistory />

        {/* بوصلة ديكورية */}
        <div className="absolute bottom-30 right-5 z-[999] pointer-events-none opacity-30 hover:opacity-60 transition-opacity duration-300">
          <img 
            src="/images/compass.svg" 
            alt="Compass" 
            className="w-35 h-35 sm:w-35 sm:h-30 drop-shadow-lg"
          />
        </div>

        {/* ملاحظة توضيحية */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hidden sm:block">
          💡 Double-click on map to add pin | Hover over pin to see info
        </div>

        {/* أزرار التحكم */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => mapInstanceRef.current?.setView([20, 0], 3, { animate: true })}
            className="bg-white hover:bg-gray-50 text-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium border border-gray-200 flex items-center gap-2 text-sm"
          >
            <img src="/animated_icons/production/fill/all/compass.svg" className="w-4 h-4" />
            <span className="hidden sm:inline">Reset View</span>
            <span className="sm:hidden">Reset</span>
          </button>
          
          <button
            onClick={() => {
              clearMarkers();
              lastFetchRef.current = { lat: null, lng: null, time: 0 };
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 text-sm"
          >
            <img src="/animated_icons/production/fill/all/not-available.svg" className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>

        <style>{`
          /* Weather Marker Styles */
          .weather-marker {
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
          }
          
          .weather-marker:hover {
            transform: scale(1.2);
          }
          
          .weather-marker img {
            width: 100%;
            height: 100%;
            filter: brightness(0) invert(1);
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
            background: var(--color-surface);
            padding: 10px;
            border-radius: 8px;
            border: 1px solid var(--color-border);
          }

          .popup-card-label {
            font-size: 11px;
            color: var(--color-muted);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .popup-card-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--color-text);
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .popup-info-box {
            padding: 10px;
            border-left: 4px solid;
            border-radius: 6px;
            margin-bottom: 12px;
          }

          .popup-info-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--color-text);
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .popup-info-text {
            font-size: 11px;
            color: var(--color-muted);
          }

          .popup-astro {
            padding: 10px;
            background: linear-gradient(to right, #fef3c7, #fde68a);
            border-radius: 8px;
            margin-bottom: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 12px;
            color: #92400e;
          }

          .popup-astro > div {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .popup-astro img {
            margin-right: 4px;
          }

          .popup-button {
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
          }

          .popup-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          }

          @media (max-width: 640px) {
            .weather-popup {
              min-width: 260px;
            }
            
            .popup-header {
              padding: 12px;
            }
            
            .popup-main-temp {
              gap: 12px;
            }
            
            .popup-card {
              padding: 8px;
            }
            
            .popup-card-value {
              font-size: 14px;
            }
          }
        `}</style>
      </div>

      {/* نافذة الطقس التفصيلية */}
      {showModal && detailedWeather && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-[var(--color-card)] rounded-lg shadow-2xl w-[35%] max-w-4xl max-h-[95vh] sm:max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الرأسية */}
            <div className="sticky top-0 z-[2500] bg-gradient-to-r from-slate-950 via-slate-800 to-slate-800 text-white p-4 sm:p-6 rounded-t-lg border-b border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-white flex items-center gap-2">
                    <img src="/animated_icons/production/fill/all/compass.svg" className="w-6 h-6 sm:w-7 sm:h-7" /> 
                    {detailedWeather.location.name}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base opacity-90 text-slate-300">
                    {detailedWeather.location.region && `${detailedWeather.location.region}, `}
                    {detailedWeather.location.country}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/90 cursor-pointer hover:text-red-500 text-2xl sm:text-2xl font-bold leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* الطقس الحالي */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-slate-700 shadow-inner hover:shadow-slate-700/40 transition-all duration-300">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    <img 
                      src={getWeatherIcon(detailedWeather.current.condition?.text, detailedWeather.current.is_day)} 
                      alt="weather" 
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                      {Math.round(detailedWeather.current.temp_c)}°C
                    </div>
                    <div className="text-base sm:text-lg text-slate-300 font-medium">
                      {detailedWeather.current.condition?.text}
                    </div>
                    <div className="text-sm sm:text-base text-slate-400 flex items-center gap-2">
                      <img src="/animated_icons/production/fill/all/thermometer.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                      Feels like {Math.round(detailedWeather.current.feelslike_c)}°C
                    </div>
                  </div>
                </div>
              </div>

              {/* التنبيهات الجوية */}
              {detailedWeather.alerts && detailedWeather.alerts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <img src="/animated_icons/production/fill/all/thunderstorms.svg" className="w-5 h-5 sm:w-6 sm:h-6" /> Weather Alerts
                  </h3>
                  {detailedWeather.alerts.map((alert, idx) => (
                    <div key={idx} className="bg-red-500/20 border-l-4 border-red-600 p-3 sm:p-4 rounded-lg mb-2">
                      <div className="font-bold text-red-200 text-sm sm:text-base">{alert.headline}</div>
                      <div className="text-xs sm:text-sm text-red-300 mt-1">{alert.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* شبكة التفاصيل */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
                        className="w-5 h-5 sm:w-7 sm:h-7 opacity-80 inline-block"
                        style={{ transform: `rotate(${detailedWeather.current.wind_degree || 0}deg)`, transition: 'transform 0.3s ease' }}
                      />
                    ),
                    footer: `${detailedWeather.current.wind_dir} (${detailedWeather.current.wind_degree}°)`
                  },
                  { label: "Pressure", icon: 'barometer', value: `${detailedWeather.current.pressure_mb} mb` },
                  { label: "Visibility", icon: 'haze', value: `${detailedWeather.current.vis_km} km` },
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
                    className="bg-slate-800/60 p-3 sm:p-4 rounded-lg border border-slate-700 hover:bg-slate-800/80 transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="text-xs sm:text-sm text-slate-300 mb-1 flex items-center gap-2">
                      <img src={`/animated_icons/production/fill/all/${item.icon}.svg`} className="w-4 h-4 sm:w-5 sm:h-5" />
                      {item.label}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                      <span>{item.value}</span>
                      {item.extra}
                    </div>
                    {item.footer && (
                      <div className="text-xs sm:text-sm text-slate-400 mt-1">{item.footer}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* جودة الهواء */}
              {detailedWeather.airQuality && detailedWeather.airQuality['us-epa-index'] && (
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <img src="/animated_icons/production/fill/all/smoke-particles.svg" className="w-5 h-5 sm:w-6 sm:h-6" /> Air Quality
                  </h3>
                  <div className="bg-slate-800/60 border border-slate-700 p-3 sm:p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ color: getAQIInfo(detailedWeather.airQuality['us-epa-index']).color }}>
                          <span className="text-3xl sm:text-4xl">{getAQIInfo(detailedWeather.airQuality['us-epa-index']).emoji}</span>
                          <span>{getAQIInfo(detailedWeather.airQuality['us-epa-index']).label}</span>
                        </div>
                        <div className="text-sm sm:text-base text-slate-400">AQI: {detailedWeather.airQuality['us-epa-index']}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
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

              {/* تفاصيل الرياح */}
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <img src="/animated_icons/production/fill/all/wind.svg" className="w-5 h-5 sm:w-6 sm:h-6" /> Wind Details
                </h3>
                <div className="bg-slate-800/60 p-4 sm:p-6 rounded-xl border border-slate-700">
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-600 bg-slate-900 shadow-inner">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-base sm:text-lg font-bold text-red-400">N</div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-base sm:text-lg font-bold text-slate-400">S</div>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">W</div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">E</div>
                      </div>
                      <div 
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
                        style={{ transform: `rotate(${detailedWeather.current.wind_degree || 0}deg)` }}
                      >
                        <img 
                          src="/animated_icons/production/fill/all/compass.svg" 
                          alt="wind direction" 
                          className="w-16 h-16 sm:w-24 sm:h-24 opacity-90"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                      <img src="/animated_icons/production/fill/all/wind.svg" className="w-5 h-5 sm:w-7 sm:h-7" />
                      {Math.round(detailedWeather.current.wind_kph)} km/h
                    </div>
                    <div className="text-sm sm:text-base text-slate-300 mb-2">
                      Direction: {formatWindDirection(detailedWeather.current.wind_dir)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400">
                      {detailedWeather.current.wind_degree}° from North
                    </div>
                    {detailedWeather.current.gust_kph && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-sm sm:text-base text-slate-300 flex items-center justify-center gap-2">
                          <img src="/animated_icons/production/fill/all/wind.svg" className="w-4 h-4 sm:w-5 sm:h-5" /> 
                          Gusts up to <span className="font-bold text-white">{Math.round(detailedWeather.current.gust_kph)} km/h</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* توقعات 3 أيام */}
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <img src="/animated_icons/production/fill/all/clear-day.svg" className="w-5 h-5 sm:w-6 sm:h-6" /> 3-Day Forecast
                </h3>
                <div className="space-y-3">
                  {detailedWeather.forecast.map((day, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-700 hover:bg-slate-800/80 transition-colors">
                      <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16">
                            <img 
                              src={getWeatherIcon(day.day.condition?.text, true)} 
                              alt="weather" 
                              className="w-full h-full"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm sm:text-base">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-300">{day.day.condition?.text}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            <img src="/animated_icons/production/fill/all/thermometer.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                            {Math.round(day.day.maxtemp_c)}°
                          </div>
                          <div className="text-sm sm:text-base text-slate-400">
                            {Math.round(day.day.mintemp_c)}°
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300">
                        <div className="p-2 rounded bg-slate-700/50 flex items-center gap-1 sm:gap-2">
                          <img src="/animated_icons/production/fill/all/raindrop.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-semibold text-white">{day.day.daily_chance_of_rain}%</span>
                        </div>
                        <div className="p-2 rounded bg-slate-700/50 flex items-center gap-1 sm:gap-2">
                          <img src="/animated_icons/production/fill/all/wind.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-semibold text-white">{Math.round(day.day.maxwind_kph)} km/h</span>
                        </div>
                        <div className="p-2 rounded bg-slate-700/50 flex items-center gap-1 sm:gap-2">
                          <img src="/animated_icons/production/fill/all/uv-index.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-semibold text-white">{day.day.uv}</span>
                        </div>
                      </div>

                      {day.astro && (
                        <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <img src="/animated_icons/production/fill/all/sunrise.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-semibold text-white">{day.astro.sunrise}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src="/animated_icons/production/fill/all/sunset.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-semibold text-white">{day.astro.sunset}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src="/animated_icons/production/fill/all/moon-full.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-semibold text-white">{day.astro.moon_phase}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src="/animated_icons/production/fill/all/moonrise.svg" className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-semibold text-white">{day.astro.moonrise}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* التذييل */}
            <div className="sticky bottom-0 bg-slate-800/70 p-3 sm:p-4 rounded-b-lg border-t border-slate-700 backdrop-blur-sm">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شاشة التحميل */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2001] flex items-center justify-center p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-700/50">
            <div className="flex flex-col items-center gap-6">
              <Spinner width={120} height={120} />
              <div className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Loading detailed weather...
              </div>
           </div>
          </div>
        </div>
      )}

      {/* الـ Drawer لعرض بيانات الطقس */}
      <DragCloseDrawer open={drawerOpen} setOpen={setDrawerOpen}>
        {drawerWeather && (
          <div className="w-full space-y-4 pb-8">
            {/* عنوان الموقع */}
            <div className="border-b border-slate-700 pb-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/compass.svg" className="w-7 h-7" />
                {drawerWeather.location.name}
              </h2>
              <p className="text-base text-slate-400 mt-1">
                {drawerWeather.location.region && `${drawerWeather.location.region}, `}
                {drawerWeather.location.country}
              </p>
            </div>

            {/* الطقس الحالي */}
            <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
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
                  <div className="text-xl text-slate-300 mt-1">
                    {drawerWeather.current.condition?.text}
                  </div>
                  <div className="text-base text-slate-400 mt-2">
                    Feels like {Math.round(drawerWeather.current.feelslike_c)}°C
                  </div>
                </div>
              </div>
            </div>

            {/* تفاصيل الرياح - البوصلة */}
            <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <img src="/animated_icons/production/fill/all/wind.svg" className="w-6 h-6" /> Wind Details
              </h3>
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-600 bg-slate-900 shadow-inner">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-lg font-bold text-red-400">N</div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-bold text-slate-400">S</div>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">W</div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">E</div>
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
                <div className="text-base text-slate-300 mb-2">
                  Direction: {formatWindDirection(drawerWeather.current.wind_dir)}
                </div>
                <div className="text-sm text-slate-400">
                  {drawerWeather.current.wind_degree}° from North
                </div>
                {drawerWeather.current.gust_kph && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-base text-slate-300 flex items-center justify-center gap-2">
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
                  <div key={idx} className="bg-slate-800/60 p-5 rounded-xl border border-slate-700">
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
                          <div className="text-base text-slate-300 mt-1">{day.day.condition?.text}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          {Math.round(day.day.maxtemp_c)}°
                        </div>
                        <div className="text-base text-slate-400 mt-1">
                          {Math.round(day.day.mintemp_c)}°
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-base">
                      <div className="p-3 rounded bg-slate-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/raindrop.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{day.day.daily_chance_of_rain}%</span>
                      </div>
                      <div className="p-3 rounded bg-slate-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/wind.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{Math.round(day.day.maxwind_kph)} km/h</span>
                      </div>
                      <div className="p-3 rounded bg-slate-700/50 flex items-center gap-2">
                        <img src="/animated_icons/production/fill/all/uv-index.svg" className="w-6 h-6" />
                        <span className="font-semibold text-white">{day.day.uv}</span>
                      </div>
                    </div>

                    {day.astro && (
                      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-3 text-base text-slate-400">
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
