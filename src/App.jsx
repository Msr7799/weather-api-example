import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { initTheme, applyTheme } from './styles/colors';
import WeatherSearch from './components/WeatherSearch/WeatherSearch';
import * as weatherService from './services/weatherService';
import WeatherDetails from './components/WeatherDetails/WeatherDetails';
import { AnimatedThemeToggler } from './components/ThemeToggle/AnimatedThemeToggler'; 
import TrueFocus from './components/TrueFocus';
import CardNav from './components/RecentSearches/CardNav.jsx';
import WorldMap from './components/WorldMap/WorldMapLeaflet';
import WorldMapWeather from './components/WorldMap/WorldMapWeather';
import IconsDisplay from './components/IconsDisplay/IconsDisplay'; 
import { GradientShadow } from "./components/Buttons/GradientShadow";
import { GradientIconsButton } from  "./components/Buttons/GradientIconeButton";
import { RevealText } from "./components/RevealText";

/**
 * Main App component - Weather application with theme toggle and recent searches
 * @returns {JSX.Element} Main application component
 */
const App = () => {
  const [weather, setWeather] = useState({})
  const [loading, setLoading] = useState(true)
  const [recentSearches, setRecentSearches] = useState([])
  const [theme, setTheme] = useState('dark')
  const [photoBgEnabled, setPhotoBgEnabled] = useState(() => {
    try {
      const v = localStorage.getItem('photoBgEnabled');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });
  const [showSocialIcons, setShowSocialIcons] = useState(false);
  const navigate = useNavigate();

const sampleIcons = [
  'barometer',
  'celsius',
  'clear-day',
  'clear-night',
  'cloudy',
  'compass',
  'drizzle',
  'dust-day',
  'dust-night',
  'dust-wind',
  'dust',
  'fahrenheit',
  'falling-stars',
  'fog-day',
  'fog-night',
  'fog',
  'hail',
  'haze-day',
  'haze-night',
  'haze',
  'horizon',
  'humidity',
  'hurricane',
  'lightning-bolt',
  'mist',
  'moon-first-quarter',
  'moon-full',
  'moon-last-quarter',
  'moon-new',
  'moon-waning-crescent',
  'moon-waning-gibbous',
  'moon-waxing-crescent',
  'moon-waxing-gibbous',
  'moonrise',
  'moonset',
  'not-available',
  'overcast-day',
  'overcast-night',
  'overcast',
  'partly-cloudy-day-drizzle',
  'partly-cloudy-day-fog',
  'partly-cloudy-day-hail',
  'partly-cloudy-day-haze',
  'partly-cloudy-day-rain',
  'partly-cloudy-day-sleet',
  'partly-cloudy-day-smoke',
  'partly-cloudy-day-snow',
  'partly-cloudy-day',
  'partly-cloudy-night-drizzle',
  'partly-cloudy-night-fog',
  'partly-cloudy-night-hail',
  'partly-cloudy-night-haze',
  'partly-cloudy-night-rain',
  'partly-cloudy-night-sleet',
  'partly-cloudy-night-smoke',
  'partly-cloudy-night-snow',
  'partly-cloudy-night',
  'pressure-high-alt',
  'pressure-high',
  'pressure-low-alt',
  'pressure-low',
  'rain',
  'raindrop',
  'raindrops',
  'sleet',
  'smoke-particles',
  'smoke',
  'snow',
  'snowflake',
  'solar-eclipse',
  'star',
  'starry-night',
  'sunrise',
  'sunset',
  'thermometer-celsius',
  'thermometer-colder',
  'thermometer-fahrenheit',
  'thermometer-glass-celsius',
  'thermometer-glass-fahrenheit',
  'thermometer-glass',
  'thermometer-mercury-cold',
  'thermometer-mercury',
  'thermometer-warmer',
  'thermometer',
  'thunderstorms-day-rain',
  'thunderstorms-day-snow',
  'thunderstorms-day',
  'thunderstorms-night-rain',
  'thunderstorms-night-snow',
  'thunderstorms-night',
  'thunderstorms-rain',
  'thunderstorms-snow',
  'thunderstorms',
  'tornado',
  'umbrella',
  // UV indexes (several numbered files)
  'uv-index-1','uv-index-2','uv-index-3','uv-index-4','uv-index-5','uv-index-6','uv-index-7','uv-index-8','uv-index-9','uv-index-10','uv-index-11','uv-index',
  // Wind / beaufort series
  'wind-beaufort-0','wind-beaufort-1','wind-beaufort-2','wind-beaufort-3','wind-beaufort-4','wind-beaufort-5','wind-beaufort-6','wind-beaufort-7','wind-beaufort-8','wind-beaufort-9','wind-beaufort-10','wind-beaufort-11','wind-beaufort-12',
  'wind','windsock'
];

  /**
   * Load recent searches from localStorage on component mount
   */
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) || [];
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [])

  /**
   * CardNav configuration
   */
  const items = recentSearches.map((search, index) => ({
    id: index,
    title: search.location,
    description: `${search.condition} • ${Math.round(search.temperature)}°C`,
    iconUrl: search.iconUrl,
    isDay: search.isDay,
    condition: search.condition,
  }));

  /**
   * Fetch weather data for a given city and update recent searches
   * @param {string} city - City name to fetch weather for
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async (city) => {
    setLoading(true)
    const data = await weatherService.show(city)
    const newWeatherState = {
      location: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
      isDay: data.isDay,
      localtime: data.localtime,
      timezone: data.timezone,
      iconUrl: data.current.condition.icon,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph,
      feelsLike: data.current.feelslike_c,
      backgroundImage: weatherService.getWeatherBackground(data.current.condition.text),
    };
    setWeather(newWeatherState)
    
    // Update recent searches - keep only last 5 unique locations
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.location !== newWeatherState.location)
      return [newWeatherState, ...filtered].slice(0, 5)
    })
    
    setLoading(false)
  }, [])

  /**
   * Fetch initial weather data for default city
   */
  useEffect(() => {
    async function getInitialWeather() {
      await fetchData('manama')
    }
    getInitialWeather()
  }, [fetchData])

  /**
   * Toggle photo background based on theme
   * Light theme -> use bg2.svg background
   * Dark theme -> no background image
   */
  useEffect(() => {
    try {
      // Show photo background only in light theme
      if (theme === 'light' && photoBgEnabled) {
        document.body.classList.add('use-photo-bg');
      } else {
        document.body.classList.remove('use-photo-bg');
      }
    } catch {
      // ignore (server-side rendering or missing document)
    }
  }, [theme, photoBgEnabled]);

  // Persist photoBgEnabled and expose a global toggle helper so existing buttons can call it
  useEffect(() => {
    try {
      localStorage.setItem('photoBgEnabled', photoBgEnabled ? 'true' : 'false');
    } catch {
      // ignore localStorage errors
    }

    // helper for manual toggles from legacy buttons or console
    try {
      window.togglePhotoBg = () => setPhotoBgEnabled((v) => !v);
    } catch {
      // ignore window assignment errors
    }

    return () => {
      try {
        // cleanup optional global helper
        // keep it defined (no removal) to avoid breaking code that expects it
      } catch {
        // ignore cleanup errors
      }
    };
  }, [photoBgEnabled]);

  /**
   * Initialize theme on first render
   */
  useEffect(() => {
    // Use initTheme from colors.js - it handles localStorage and system preference
    const initialTheme = initTheme()
    setTheme(initialTheme)
  }, [])

  /**
   * Update recent searches in localStorage whenever it changes
   */
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches))
    }
  }, [recentSearches])

  /**
   * Handle theme change
   * @param {string} newTheme - New theme value ('light' or 'dark')
   */
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const Home = (
    <main className="m-14">
      {/* Header */}
      <div className="flex justify-between  items-center mb-[var(--spacing-3xl)]">
        <div>
          <div className="w-50 h-50  rounded-full">
            <img
              src="logo.gif"
              alt="Logo"
              className="object-contain text-6xl !rounded-full mb-10 w-full h-full"
            />
          </div>
          
          {/* Title with TrueFocus effect */}
<div className="text-[var(--color-text-secondary)]  mb-10 mt-10">
    <TrueFocus 
      sentence="Weather App"
      fontSize="7rem"
      fontWeight='900'
      borderWidth="5px"
      borderColor="var(--color-primary)"
      manualMode={false}
      animationDuration={2}
      pauseBetweenAnimations={1}
    />
</div>

<div className="mt-25">

<RevealText>
  <span className="text-2xl font-medium sm:text-4xl xl:text-5xl">
  Real-time weather information worldwide
  </span>
  
  <p className="text-sm font-medium mt-5 ">
   world map,icons,forecast,uv index,wind speed,feels like,air quality
   
  </p>
</RevealText>
</div>

</div>
        
        <AnimatedThemeToggler selected={theme} setSelected={handleThemeChange} />
      </div>

      {/* Search Bar */}
      <WeatherSearch 
      fetchData={fetchData}
      
      />

      {/* Card Navigation Menu */}
      <div className="relative mb-8">
        <CardNav
          items={items}
          logo="cloudy-day.svg"
          logoAlt="Weather App Logo"
          baseColor="var(--color-input-bg)"
          menuColor="var(--color-border)"
          buttonBgColor="rgba(50, 95, 139, 0.35)"
          buttonTextColor="var(--color-text)"
          ease="power3.out"
          className="translate-x-0 backdrop-blur-xl  shadow-xl rounded-2xl mb-16"
          onCityClick={fetchData}
        />
      </div>

      {/* Main Weather Display */}
      <WeatherDetails weather={weather} loading={loading} />
        <div className="p-10 flex mt-50 sm:justify-center justify-start">
          
          <GradientShadow colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
          <button 
        className="rounded bg-black mr-5 px-12 rounded-md py-4 text-white" 
        onClick={() => navigate('/world-map')} >
          World Map   
          </button>
          </GradientShadow>

          <GradientShadow colors={["#10b981", "#3b82f6", "#6366f1"]}>
          <button 
        className="rounded bg-black mr-5 px-12 rounded-md py-4 text-white" 
        onClick={() => navigate('/weather-map')} >
          🌦️ Weather Map   
          </button>
          </GradientShadow>

  
  <GradientIconsButton 
    icons={sampleIcons}
    onIconClick={() => navigate('/icons-display')} >
    <button 
        className="rounded bg-black text-white" 
        onClick={() => navigate('/icons-display')} >
        Icons Gallery
    </button>
  </GradientIconsButton>
       
       
        </div>
  




    <div className="p-10">
      <div 
        className="flex flex-col items-center gap-4"
        onMouseEnter={() => setShowSocialIcons(true)}
        onMouseLeave={() => setShowSocialIcons(false)}
        >
             <GradientShadow colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
       
        <button className="px-6 py-3 rounded-xl bg-black text-white">
          Contact me
        </button>
        </GradientShadow>
        {showSocialIcons && (
          <div className="flex gap-4">
            <img
              src="/images/Github.svg"
              alt="Github"
              onClick={() => window.open('https://github.com/msr7799', '_blank')}
              className="w-16 h-16 object-contain cursor-pointer hover:scale-125 transition-all duration-300 drop-shadow-2xl animate-[fadeInUp_0.3s_ease-out]"
              title="Github"
              style={{ opacity: 0, animationFillMode: 'forwards' }}
            />
            <img
              src="/images/WhatsApp.svg"
              alt="WhatsApp"
              onClick={() => window.open('https://wa.me/97337925259', '_blank')}
              className="w-16 h-16 object-contain cursor-pointer hover:scale-125 transition-all duration-300 drop-shadow-2xl animate-[fadeInUp_0.3s_ease-out_0.1s]"
              title="WhatsApp"
              style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
            />
            <img
              src="/images/Gmail.gif"
              alt="Gmail"
              onClick={() => window.open('mailto:code4ever11@gmail.com', '_blank')}
              className="w-16 h-16 object-contain cursor-pointer hover:scale-125 transition-all duration-300 drop-shadow-2xl animate-[fadeInUp_0.3s_ease-out_0.2s]"
              title="Gmail"
              style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
            />
          </div>
        )}
      </div>
    </div>

    </main>
  );

  return (
    <Routes>
      <Route path="/" element={Home} />
      <Route path="/world-map" element={<WorldMap onCountryClick={fetchData} />} />
      <Route path="/weather-map" element={<WorldMapWeather />} />
      <Route path="/icons-display" element={<IconsDisplay />} />
    </Routes>
  );
}

export default App