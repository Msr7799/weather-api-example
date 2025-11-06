import React, { useState } from 'react';

// قوائم الأيقونات لكل قسم (بناءً على index-fill.html و index-line.html)
const iconSections = {
  newest: [
    'smoke-particles', 'smoke', 'partly-cloudy-day-smoke', 'partly-cloudy-night-smoke',
    'humidity', 'haze', 'haze-day', 'haze-night', 'partly-cloudy-day-haze', 'partly-cloudy-night-haze',
    'dust', 'dust-day', 'dust-night', 'dust-wind', 'thunderstorms-snow', 'thunderstorms-day-snow',
    'thunderstorms-night-snow', 'barometer', 'thermometer-colder', 'thermometer-warmer',
    'thermometer-celsius', 'thermometer-fahrenheit', 'thermometer-glass', 'thermometer-glass-celsius',
    'thermometer-glass-fahrenheit', 'thermometer-mercury', 'thermometer-mercury-cold', 'celsius',
    'fahrenheit', 'not-available', 'umbrella', 'falling-stars', 'solar-eclipse', 'starry-night',
    'wind-beaufort-0', 'wind-beaufort-1', 'wind-beaufort-2', 'wind-beaufort-3', 'wind-beaufort-4',
    'wind-beaufort-5', 'wind-beaufort-6', 'wind-beaufort-7', 'wind-beaufort-8', 'wind-beaufort-9',
    'wind-beaufort-10', 'wind-beaufort-11', 'wind-beaufort-12', 'uv-index', 'uv-index-1', 'uv-index-2',
    'uv-index-3', 'uv-index-4', 'uv-index-5', 'uv-index-6', 'uv-index-7', 'uv-index-8', 'uv-index-9',
    'uv-index-10', 'uv-index-11'
  ],
  weather: [
    'clear-day', 'clear-night', 'cloudy', 'overcast', 'overcast-day', 'overcast-night', 'drizzle',
    'hail', 'rain', 'sleet', 'smoke', 'snow', 'partly-cloudy-day', 'partly-cloudy-day-drizzle',
    'partly-cloudy-day-hail', 'partly-cloudy-day-rain', 'partly-cloudy-day-sleet', 'partly-cloudy-day-smoke',
    'partly-cloudy-day-snow', 'partly-cloudy-night', 'partly-cloudy-night-drizzle', 'partly-cloudy-night-hail',
    'partly-cloudy-night-rain', 'partly-cloudy-night-sleet', 'partly-cloudy-night-smoke', 'partly-cloudy-night-snow',
    'mist', 'hurricane', 'tornado', 'wind', 'dust', 'dust-day', 'dust-night', 'dust-wind'
  ],
  thunderstorms: [
    'thunderstorms', 'thunderstorms-day', 'thunderstorms-night', 'thunderstorms-rain',
    'thunderstorms-day-rain', 'thunderstorms-night-rain', 'thunderstorms-snow', 'thunderstorms-day-snow',
    'thunderstorms-night-snow'
  ],
  fog: [
    'fog', 'fog-day', 'fog-night', 'partly-cloudy-day-fog', 'partly-cloudy-night-fog'
  ],
  haze: [
    'haze', 'haze-day', 'haze-night', 'partly-cloudy-day-haze', 'partly-cloudy-night-haze'
  ],
  astronomical: [
    'horizon', 'sunrise', 'sunset', 'moonrise', 'moonset', 'falling-stars', 'solar-eclipse', 'starry-night'
  ],
  moonPhases: [
    'moon-new', 'moon-waxing-crescent', 'moon-first-quarter', 'moon-waxing-gibbous', 'moon-full',
    'moon-waning-gibbous', 'moon-last-quarter', 'moon-waning-crescent'
  ],
  miscellaneous: [
    'barometer', 'compass', 'windsock', 'thermometer', 'thermometer-colder', 'thermometer-warmer',
    'thermometer-celsius', 'thermometer-fahrenheit', 'thermometer-glass', 'thermometer-glass-celsius',
    'thermometer-glass-fahrenheit', 'thermometer-mercury', 'thermometer-mercury-cold', 'humidity',
    'pressure-high', 'pressure-low', 'pressure-high-alt', 'pressure-low-alt', 'celsius', 'fahrenheit',
    'not-available', 'umbrella'
  ],
  particles: [
    'lightning-bolt', 'raindrop', 'raindrops', 'snowflake', 'star', 'smoke-particles'
  ],
  beaufort: [
    'wind-beaufort-0', 'wind-beaufort-1', 'wind-beaufort-2', 'wind-beaufort-3', 'wind-beaufort-4',
    'wind-beaufort-5', 'wind-beaufort-6', 'wind-beaufort-7', 'wind-beaufort-8', 'wind-beaufort-9',
    'wind-beaufort-10', 'wind-beaufort-11', 'wind-beaufort-12'
  ],
  uvIndex: [
    'uv-index', 'uv-index-1', 'uv-index-2', 'uv-index-3', 'uv-index-4', 'uv-index-5', 'uv-index-6',
    'uv-index-7', 'uv-index-8', 'uv-index-9', 'uv-index-10', 'uv-index-11'
  ]
};

const AnimatedIconsGallery = () => {
  const [style, setStyle] = useState('fill'); // تبديل بين 'fill' و 'line'

  const renderIcons = (icons) => (
    <div className="wi-icons">
      {icons.map((icon) => (
        <div key={icon} className="wi-icon">
          <img src={`/animated_icons/production/${style}/all/${icon}.svg`} alt={icon} />
          <span>{icon}</span>
        </div>
      ))}
    </div>
  );

  return (
    <main className="wi-main">
      <div className="container">
        <div className="row mb-10">
          <div className="col-12 lg:col-6 px-7 sm:px-4 lg:py-10">
            <h1 className="wi-title">Meteocons</h1>
            <p className="lead">
              مجموعة أيقونات طقس متحركة مصممة يدوياً ومُحسنة للاستخدام في مشاريعك.
            </p>
            <p>
              الأيقونات متوفرة تحت رخصة MIT، وهي مجانية للاستخدام.
            </p>
          </div>
        </div>

        {/* تبديل النوع */}
        <div className="row mb-5">
          <div className="col-12">
            <button onClick={() => setStyle('fill')} className="btn">Filled</button>
            <button onClick={() => setStyle('line')} className="btn">Outlined</button>
          </div>
        </div>

        <h2 className="wi-section">أحدث الأيقونات</h2>
        <div className="wi-icons wi-icons-new">
          {iconSections.newest.map((icon) => (
            <div key={icon} className="wi-icon">
              <img src={`/animated_icons/production/${style}/all/${icon}.svg`} alt={icon} />
            </div>
          ))}
        </div>

        <h2 className="wi-section">الطقس</h2>
        {renderIcons(iconSections.weather)}
        {renderIcons(iconSections.thunderstorms)}
        {renderIcons(iconSections.fog)}
        {renderIcons(iconSections.haze)}

        <h2 className="wi-section">الفلكية</h2>
        {renderIcons(iconSections.astronomical)}

        <h2 className="wi-section">مراحل القمر</h2>
        {renderIcons(iconSections.moonPhases)}

        <h2 className="wi-section">متنوع</h2>
        {renderIcons(iconSections.miscellaneous)}

        <h2 className="wi-section">الجسيمات</h2>
        {renderIcons(iconSections.particles)}

        <h2 className="wi-section">مقياس بوفورت للرياح</h2>
        {renderIcons(iconSections.beaufort)}

        <h2 className="wi-section">مؤشر الأشعة فوق البنفسجية</h2>
        {renderIcons(iconSections.uvIndex)}

        <h2 className="wi-section">جميع الأنماط</h2>
        <div className="row">
          <div className="col-6 lg:col-4">
            <div className="panel">
              <img src="/animated_icons/production/fill/all/clear-day.svg" alt="Filled style" />
              <span>Filled</span>
            </div>
          </div>
          <div className="col-6 lg:col-4">
            <div className="panel">
              <img src="/animated_icons/production/line/all/clear-day.svg" alt="Outlined style" />
              <span>Outlined</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AnimatedIconsGallery;