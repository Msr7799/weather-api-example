// filepath: src/components/IconsDisplay/IconsDisplay.jsx
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { GradientShadow } from "../Buttons/GradientShadow";


// Array of Icon names for each section 
const sections = {
  newest: ['smoke-particles', 'smoke', 'humidity', 'haze', 'dust', 'barometer', 'thermometer', 'celsius', 'fahrenheit', 'not-available', 'umbrella', 'falling-stars', 'solar-eclipse', 'starry-night', 'wind-beaufort-0', 'wind-beaufort-1', 'uv-index', 'uv-index-1'],
  weather: ['clear-day', 'clear-night', 'cloudy', 'overcast', 'drizzle', 'hail', 'rain', 'sleet', 'snow', 'partly-cloudy-day', 'partly-cloudy-night', 'mist', 'hurricane', 'tornado', 'wind', 'dust'],
  thunderstorms: ['thunderstorms', 'thunderstorms-day', 'thunderstorms-night', 'thunderstorms-rain', 'thunderstorms-snow'],
  fog: ['fog', 'fog-day', 'fog-night', 'partly-cloudy-day-fog', 'partly-cloudy-night-fog'],
  haze: ['haze', 'haze-day', 'haze-night', 'partly-cloudy-day-haze', 'partly-cloudy-night-haze'],
  astronomical: ['horizon', 'sunrise', 'sunset', 'moonrise', 'moonset', 'falling-stars', 'solar-eclipse', 'starry-night'],
  moonPhases: ['moon-new', 'moon-waxing-crescent', 'moon-first-quarter', 'moon-waxing-gibbous', 'moon-full', 'moon-waning-gibbous', 'moon-last-quarter', 'moon-waning-crescent'],
  miscellaneous: ['barometer', 'compass', 'windsock', 'thermometer', 'humidity', 'pressure-high', 'pressure-low', 'celsius', 'fahrenheit', 'not-available', 'umbrella'],
  particles: ['lightning-bolt', 'raindrop', 'raindrops', 'snowflake', 'star', 'smoke-particles'],
  beaufort: ['wind-beaufort-0', 'wind-beaufort-1', 'wind-beaufort-2', 'wind-beaufort-3', 'wind-beaufort-4', 'wind-beaufort-5', 'wind-beaufort-6', 'wind-beaufort-7', 'wind-beaufort-8', 'wind-beaufort-9', 'wind-beaufort-10', 'wind-beaufort-11', 'wind-beaufort-12'],
  uvIndex: ['uv-index', 'uv-index-1', 'uv-index-2', 'uv-index-3', 'uv-index-4', 'uv-index-5', 'uv-index-6', 'uv-index-7', 'uv-index-8', 'uv-index-9', 'uv-index-10', 'uv-index-11']
};
const sectionTitles = {
  newest: 'Newest Icons',
  weather: 'Weather',
};

const IconsDisplay = () => {
  const [iconStyle, setIconStyle] = useState('fill');
  const [visible, setVisible] = useState(false); // toggle gallery
  const containerRef = useRef(null);

// Fade-in / stagger animation using useEffect and gsap library
useEffect(() => {
  if (!containerRef.current) return;
  // Use gsap.utils.toArray to convert NodeList to array (safe for GSAP)
  const icons = gsap.utils.toArray(containerRef.current.querySelectorAll('.icon-item'));
  if (!icons || icons.length === 0) return; // ✅ إذا ما فيه عناصر، لا تعمل GSAP

  if (visible) {
    gsap.fromTo(
      icons,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
    );
  } else {
    
    // Only animate out if we have targets 
    gsap.to(icons, {
      y: 20,
      opacity: 0,
      stagger: 0.03,
      duration: 0.3,
      ease: 'power2.in',
    });
  }
}, [visible]);

  const renderSection = (title, icons) => (
    <section key={title} className="mb-12">
      <h2 className="section-title">{title}</h2>
      <div className="icons-grid">
        {icons.map((icon) => (
          <div
            key={icon}
            className="icon-item cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:scale-105"
          >
            {/* build a path to the Icon image from the animated_icons folder to display all icons in the gallery  */}
            <img
              src={`/animated_icons/production/${iconStyle}/all/${icon}.svg`}
              alt={icon}
              className="w-16 h-16 mb-2"
            />
            {/* display the icon name */}
            <p className="text-sm">{icon}</p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="icons-container">
      <header className="flex flex-col items-center mb-6">
        <h1 className=" text-5xl font-bold mb-8">Animated Icons Gallery</h1>
        <p className="mb-4 text-center text-xl flex justify-center mb-12 max-w-xl">
          A collection of animated weather icons for your projects.
        </p>
        <div className="style-toggle text-primary font-bold mb-4">
        
        <GradientShadow>
          {/* i use a deferent appraoch to style the buttons i didn't use tailwindcss  */}
           <button
            onClick={() => setIconStyle('fill')}
            className={iconStyle === 'fill' ? 'active' : ''}
            style={{ 
            fontSize: '20px',
            backgroundColor: '#001122',
            color: 'white',
            backdropFilter: 'blur(20px) brightness(1)',
            WebkitBackdropFilter: 'blur(10px) brightness(0)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            padding: '12px 21px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '2px solid var(--color-card)',
            outline: 'none',
            fontWeight: 'bold'
             }} >
            Fill
          </button>
          </GradientShadow>
          
          <button
            onClick={() => setIconStyle('line')}
            className={iconStyle === 'line' ? 'active' : ''}
            style={{ 
              fontSize: '19px',
              backgroundColor: 'var(--color-muted)',
              color: 'white',
              backdropFilter: 'blur(20px) brightness(1)',
              WebkitBackdropFilter: 'blur(10px) brightness(0)',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              padding: '10px 20px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '2px solid var(--color-border)',
              outline: 'none',
              fontWeight: 'bold'        
             }} >
            Line
          </button>

        </div>


        <GradientShadow>  
        <button
          onClick={() => setVisible(!visible)}
          className="px-6 py-4 bg-[#001122] text-white font-bold text-[19px] rounded-md hover:scale-105 transition-transform duration-300 shadow-lg shadow-[rgba(0,0,0,0.5)] backdrop-filter: blur(20px) brightness(1)"
          >
          {visible ? 'Hide Gallery' : 'Show Gallery'}
        </button>
        </GradientShadow> 
      </header>
      
      {/* Gallery wrapper with fade using useRef and gsap library */}
      <div
        ref={containerRef}
        className={`transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}
      >
        {Object.entries(sections).map(([key, icons]) =>
          renderSection(sectionTitles[key] || key, icons)
        )}
      </div>
    </div>
  );
};

export default IconsDisplay;