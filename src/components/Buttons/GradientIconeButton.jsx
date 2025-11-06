import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";

export const GradientIconsButton = ({ icons = [], children, onIconClick }) => {
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const glowRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  // تأثير الـ glow المتحرك للزر
  useEffect(() => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, {
      backgroundPosition: "200% 0%",
      duration: 6,
      ease: "linear",
      repeat: -1,
    });
  }, []);

  const handleMouseEnter = () => {
    setVisible(true);
    
    // Smooth opening للحاوية
    setTimeout(() => {
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { 
            opacity: 0, 
            y: 10,
            scale: 0.95
          },
          { 
            opacity: 1, 
            y: 0,
            scale: 1,
            duration: 0.4, 
            ease: "power2.out" 
          }
        );
      }
      
      // ظهور الأيقونات بالتسلسل
      if (previewRef.current) {
        gsap.fromTo(
          previewRef.current.children,
          { 
            opacity: 0, 
            scale: 0.5,
            y: 20
          },
          { 
            opacity: 1, 
            scale: 1,
            y: 0,
            stagger: 0.03, 
            duration: 0.5, 
            ease: "back.out(1.4)" 
          }
        );
      }
    }, 50);
  };

  const handleMouseLeave = () => {
    // اختفاء الأيقونات بالتسلسل العكسي
    if (previewRef.current) {
      gsap.to(previewRef.current.children, {
        opacity: 0,
        scale: 0.5,
        y: 20,
        stagger: 0.02,
        duration: 0.3,
        ease: "power2.in",
      });
    }
    
    // Smooth closing للحاوية
    setTimeout(() => {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: 10,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setVisible(false)
        });
      }
    }, 200);
  };

  const gradient = "linear-gradient(90deg, #3b82f6, #8b5cf6, #cb3642ff, #f97316, #96abcbff)";

  return (
    <div 
      className="relative inline-block group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* معاينة الأيقونات فوق الزر */}
      {visible && (
        <div
          ref={containerRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pb-2 z-50"
          style={{ minWidth: "500px" }}
        >
          <div className="relative bg-gradient-to-br from-gray-900 via-neutral-800 to-neutral-900 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-gray-700/50">
            {/* توهج خلفي للحاوية */}
            <div className="absolute -inset-1 bg-gradient-to-r from-zince-900 via-neutral-800 to-zince-600 rounded-2xl opacity-20 blur-xl"></div>
            
            {/* شبكة الأيقونات */}
            <div
              ref={previewRef}
              className="relative grid grid-cols-6 gap-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-800/30 pr-2"
            >
              {icons.map((icon, index) => (
                <div
                  key={`${icon}-${index}`}
                  onMouseEnter={() => setHoveredIcon(index)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  onClick={() => onIconClick && onIconClick(icon)}
                  className="group/icon relative flex items-center justify-center cursor-pointer"
                >
                  {/* توهج خلف كل أيقونة عند الـ hover */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-red-400 rounded-xl transition-all duration-300"
                    style={{
                      opacity: hoveredIcon === index ? 0.6 : 0,
                      transform: hoveredIcon === index ? 'scale(1.6)' : 'scale(1)',
                      filter: 'blur(20px)'
                    }}
                  ></div>
                  
                  {/* الأيقونة */}
                  <div
                    className="relative z-10 transition-all duration-300"
                    style={{
                      transform: hoveredIcon === index ? 'scale(1.5) rotate(8deg)' : 'scale(1) rotate(0deg)',
                    }}
                  >
                    <img
                      src={`/animated_icons/production/fill/all/${icon}.svg`}
                      alt={icon}
                      className="w-11 h-11 filter brightness-100 transition-all duration-300"
                      style={{
                        filter: hoveredIcon === index ? 'brightness(1.3) drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))' : 'brightness(1)'
                      }}
                    />
                  </div>
                  
                  {/* اسم الأيقونة عند الـ hover */}
                  {hoveredIcon === index && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                      <div className="bg-gray-950/95 text-white text-xs px-2 py-1 rounded-md border border-purple-500/30 shadow-lg">
                        {icon}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* السهم للأسفل */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45 border-r border-b border-gray-700/50"></div>
          </div>
        </div>
      )}

      {/* الزر الرئيسي مع التأثيرات */}
      <div className="relative">
        {/* Glow effect قوي مثل المثال */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute -inset-2 -z-10 rounded-xl opacity-0 transition-all duration-300 group-hover:opacity-90"
          style={{
            backgroundImage: gradient,
            backgroundSize: "300% 300%",
            backgroundPosition: "0% 0%",
            filter: "blur(40px)",
            transform: "scale(0.8)",
            willChange: "background-position, opacity",
          }}
        />
        
        {/* الزر */}
        <button
          className="relative px-8 py-3.5 rounded-md bg-gradient-to-r from-neutral-950 to-black 
                     text-white font-medium shadow-xl
                     transition-all duration-300 
                     hover:scale-105 hover:shadow-2xl
                     border-2 border-neutral-900 group-hover:border-purple-700/50
                     overflow-hidden cursor-pointer"
        >
          {/* تأثير shimmer */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
          
          <span className="relative z-10 flex items-center gap-2">
            {children}
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};


  