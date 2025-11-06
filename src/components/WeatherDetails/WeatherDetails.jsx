import BarLoader from '../BarLoader';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { Thermometer, WindBeaufort, AnimatedIcon } from '../AnimatedIcons';
import { WiThermometer } from 'react-icons/wi';
import { DateTime } from 'luxon';


/**
 * WeatherDetails component - Displays detailed weather information for a location
 * @param {Object} props - Component props
 * @param {Object} props.weather - Weather data object
 * @param {string} props.weather.location - Location name
 * @param {number} props.weather.temperature - Temperature in celsius
 * @param {string} props.weather.condition - Weather condition text
 * @param {boolean} props.weather.isDay - Whether it's daytime
 * @param {string} props.weather.iconUrl - Weather icon URL from API
 * @param {number} props.weather.humidity - Humidity percentage
 * @param {number} props.weather.windSpeed - Wind speed in km/h
 * @param {number} props.weather.feelsLike - Feels like temperature
 * @param {string} props.weather.backgroundImage - Background image URL
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Weather details display
 */
const WeatherDetails = ({weather, loading}) => {
  const  { location, temperature, condition, iconUrl, humidity, windSpeed, feelsLike, backgroundImage, localtime, timezone } = weather;

  // Format local time using Luxon if available
  let formattedLocalTime = null;
  if(localtime){
    try{
      // WeatherAPI returns localtime like "YYYY-MM-DD HH:mm". Try parsing that first.
      let dt = DateTime.fromFormat(localtime, 'yyyy-MM-dd HH:mm', { zone: timezone || 'utc' });
      if(!dt.isValid){
        // Fallback: try ISO parsing
        dt = DateTime.fromISO(localtime, { zone: timezone || 'utc' });
      }
      if(dt.isValid){
        // Example output: "Sat, Oct 25, 2025 — 2:23 PM (Asia/Bahrain)"
        formattedLocalTime = dt.toFormat("ccc, LLL dd yyyy — t") + ` (${timezone || dt.zoneName})`;
      }
    }catch{
      // ignore and fall back to raw string
      formattedLocalTime = `${localtime} ${timezone ? `(${timezone})` : ''}`;
    }
  }

  // Show loading animation while fetching data
  if(loading){
    return (
      <div className="flex items-center justify-center py-20">
        <BarLoader />
      </div>
    );
  }

  return (
    <section className="relative border-3 border-border overflow-hidden shadow-2xl rounded-2xl">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'brightness(0.6)' }}
      />

      {/* Glassmorphism Card */}
    <div className="relative backdrop-blur-lg transition-all duration-300 bg-black/28 border border-[rgba(255,255,255,0.04)]">
        <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-14">
          {/* Main Weather Display */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 mb-6">
            <div className="flex-1">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold  mb-2">{location}</h2>
              <p className="text-zince-400 text-base sm:text-lg md:text-xl font-semibold">{condition}</p>
              {formattedLocalTime && (
                <p className="text-zinc-600 text-sm sm:text-base mt-2">Local time: {formattedLocalTime}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              <WeatherIcon iconUrl={iconUrl} condition={condition} size="xl" isDay={weather.isDay} />
            </div>
          </div>
           
          {/* Temperature Display */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Thermometer temperature={temperature} size={90} className="shrink-0 !md:w-50 !md:h-100" />
              <div>
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-bold text-text mb-2 leading-tight">{typeof temperature === 'number' ? Math.round(temperature) : '--'}°</div>
                <p className="text-text/90 text-base sm:text-lg md:text-xl font-light">Feels like {typeof feelsLike === 'number' ? Math.round(feelsLike) : '--'}°C</p>
              </div>
            </div>
          </div>

          {/* Weather Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Humidity */}
            <div className="backdrop-blur-md transition-all duration-300 hover:bg-text/25 bg-[rgba(255,255,255,0.06)] rounded-xl p-4 md:p-6 border border-[rgba(255,255,255,0.04)] shadow-sm flex flex-col items-center text-center" >
              <AnimatedIcon name="humidity" size={56} className="mb-2" />
              <span className="text-text text-sm md:text-base mb-1">Humidity</span>
              <p className="text-2xl md:text-4xl font-bold text-text">{humidity ?? '--'}%</p>
            </div>

            {/* Wind Speed */}
            <div className="backdrop-blur-md transition-all duration-300 hover:bg-white/25 bg-[rgba(255,255,255,0.06)] rounded-xl p-4 md:p-6 border border-[rgba(255,255,255,0.04)] shadow-sm flex flex-col items-center text-center">
              <WindBeaufort speed={windSpeed} size={56} className="mb-2" />
              <span className="text-text text-sm md:text-base mb-1">Wind</span>
              <p className="text-2xl md:text-4xl font-bold text-text">{windSpeed ?? '--'}</p>
              <span className="text-text text-xs md:text-sm">km/h</span>
            </div>

            {/* Feels Like */}
            <div className="backdrop-blur-md transition-all duration-300 hover:bg-surface/25 bg-[rgba(255,255,255,0.06)] rounded-xl p-4 md:p-6 border border-[rgba(255,255,255,0.04)] shadow-sm flex flex-col items-center text-center">
             <Thermometer size={56} className="mb-2" />
              <span className="text-text text-sm md:text-base mb-1">Feels Like</span>
              <p className="text-2xl md:text-4xl font-bold text-text">{typeof feelsLike === 'number' ? Math.round(feelsLike) : '--'}°C</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherDetails;
