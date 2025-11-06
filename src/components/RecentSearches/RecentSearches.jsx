import WeatherIcon from "../WeatherIcon/WeatherIcon";


/**
 * RecentSearches component - Displays the last 3 searched locations with their weather
 * @param {Object} props - Component props
 * @param {Array} props.recentSearches - Array of recent weather search results
 * @param {Function} props.onCityClick - Callback when a city is clicked
 * @returns {JSX.Element} Recent searches display
 */
const RecentSearches = ({ recentSearches, onCityClick }) => {
  // Don't render if no recent searches
  if (!recentSearches || recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-6 text-surface">Recent Searches</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recentSearches.map((search, index) => (
          <motion.div
            key={`${search.location}-${index}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group border-2 border-white/20"
            onClick={() => onCityClick(search.location)}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundImage: `url(${search.backgroundImage})`,
                filter: 'brightness(0.5)'
              }}
            />
            
            {/* Content Overlay */}
            <div className="relative backdrop-blur-sm bg-gradient-to-t from-black/70 to-transparent p-8 min-h-[240px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-3xl text-surface mb-2">{search.location}</h3>
                  <p className="text-lg text-surface">{search.condition}</p>
                </div>

                <WeatherIcon iconUrl={search.iconUrl} condition={search.condition} size="md" isDay={search.isDay} />

              </div>
              
              <div className="mt-6">
                <p className="text-7xl font-bold text-surface">{Math.round(search.temperature)}°</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
