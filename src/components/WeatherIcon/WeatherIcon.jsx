/**
 * WeatherIcon component - Displays realistic weather image from API
 * @param {Object} props - Component props
 * @param {string} props.iconUrl - Weather icon URL from API
 * @param {string} props.condition - Weather condition text (fallback)
 * @param {string} props.size - Icon size ('sm', 'md', 'lg', 'xl', 'xxl')
 * @returns {JSX.Element} Weather icon image
 */
const WeatherIcon = ({ iconUrl, condition = 'Clear', size = 'md', isDay }) => {
  // Size mapping - much larger realistic images
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    xxl: 'w-80 h-80'
  };

  // Choose a local SVG/PNG from `public/` when possible for consistent visuals.
  // We have a curated set of images in /public (cloudy-day.svg, rainy-night.svg, snowy-day-sun.svg, etc.).
  const chooseLocal = (cond = '', day) => {
    const c = (cond || '').toLowerCase();

    // Thunder/Storm
    if (c.includes('thunder') || c.includes('storm')) return '/thunder.svg';

    // Snow
    if (c.includes('snow') || c.includes('sleet') || c.includes('blizzard')) {
      return day ? '/snowy-day-sun.svg' : '/snowy-night.svg';
    }

    // Rain / Drizzle
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return day ? '/rainy-day-sun.svg' : '/rainy-night.svg';
    }

    // Fog / Mist / Haze
    if (c.includes('fog') || c.includes('mist') || c.includes('haze') || c.includes('smoke')) {
      return day ? '/cloudy-day.svg' : '/cloudy-night.svg';
    }

    // Cloudy / Overcast
    if (c.includes('cloud') || c.includes('overcast')) {
      // prefer explicit day/night variants if available
      return day ? '/cloudy-day.svg' : '/cloudy-night.svg';
    }

    // Sunset / dusk
    if (c.includes('sunset') || c.includes('dusk')) return '/weather_sunset.svg';

    // Clear / Sunny
    if (c.includes('clear') || c.includes('sunny') || c.includes('sun')) {
      return day ? '/day.svg' : '/night.svg';
    }

    // Fallbacks
    if (day) return '/cloudy-day.svg';
    return '/cloudy-night.svg';
  };

  let src;
  if (typeof isDay === 'boolean') {
    src = chooseLocal(condition, isDay);
  } else {
    // Prefer API icon when isDay unknown; try local mapping first if condition provided
    if (condition) {
      src = chooseLocal(condition, true);
    }
    // If API provided an icon URL, use it (ensure https)
    if (iconUrl) {
      const apiSrc = iconUrl?.startsWith('//') ? `https:${iconUrl}` : iconUrl;
      src = apiSrc.replace('64x64', '128x128');
    }
  }

  return (
    <div className="flex items-center justify-center">
      <img
        src={src}
        alt={condition}
        className={`${sizeClasses[size]} object-contain drop-shadow-2xl filter brightness-110 contrast-110`}
        loading="lazy"
      />
    </div>
  )
};

export default WeatherIcon;
