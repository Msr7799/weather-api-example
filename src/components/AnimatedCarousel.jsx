import { useEffect, useState, useRef, useMemo } from 'react';
import { motion as Motion, useMotionValue } from 'framer-motion';
import WeatherIcon from './WeatherIcon/WeatherIcon';

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 24;
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

function AnimatedCarousel({
  recentSearches = [],
  baseWidth = 400,
  autoplay = true,
  autoplayDelay = 5000, // show each recent search for 5 seconds
  pauseOnHover = true,
  loop = true,
  round = false
}) {
  // All hooks must be called before any conditional returns
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const containerRef = useRef(null);
  
  // Transform recentSearches to carousel items format - memoized to prevent infinite loops
  // limit to maximum 5 recent searches for the carousel
  const items = useMemo(() => {
    const slice = recentSearches && recentSearches.length > 0 ? recentSearches.slice(0, 5) : [];
    return slice.length > 0 ? slice.map((search, index) => ({
      id: index,
      title: search.location,
      description: `${search.condition} • ${Math.round(search.temperature)}°C`,
      iconUrl: search.iconUrl,
      isDay: search.isDay,
      condition: search.condition,
    })) : [];
  }, [recentSearches]);
  
  const containerPadding = 24;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;

  const carouselItems = useMemo(() => {
    return loop && items.length > 0 ? [...items, items[0]] : items;
  }, [items, loop]);
  
  // Use refs to store latest values for setInterval callback
  const itemsLengthRef = useRef(items.length);
  const carouselItemsLengthRef = useRef(carouselItems.length);
  
  // Update refs when values change
  useEffect(() => {
    itemsLengthRef.current = items.length;
    carouselItemsLengthRef.current = carouselItems.length;
  }, [items.length, carouselItems.length]);
  
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered) && itemsLengthRef.current > 0) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => {
          const itemsLen = itemsLengthRef.current;
          const carouselLen = carouselItemsLengthRef.current;
          
          if (prev === itemsLen - 1 && loop) {
            return prev + 1;
          }
          if (prev === carouselLen - 1) {
            return loop ? 0 : prev;
          }
          return prev + 1;
        });
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, loop, pauseOnHover]);

  if (items.length === 0) {
    return null;
  }

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 50);
    }
  };

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
      if (loop && currentIndex === items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(prev => Math.min(prev + 1, carouselItems.length - 1));
      }
    } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
      if (loop && currentIndex === 0) {
        setCurrentIndex(items.length - 1);
      } else {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0
        }
      };

  return (
    <div className="mb-16">
  
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${
          round ? 'rounded-full border-2 border-border/20' : 'rounded-3xl'
        }`}
        style={{
          width: `${baseWidth}px`,
          ...(round && { height: `${baseWidth}px` }),
          padding: 'var(--spacing-lg)',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
      <Motion.div
        className="flex"
        drag="x"
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(currentIndex * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item, index) => {
          return (
            <Motion.div
              key={index}
              className={`relative shrink-0 flex flex-col ${
                round
                  ? 'items-center justify-center text-center border-0'
                  : 'items-start justify-between'
              } overflow-hidden cursor-grab active:cursor-grabbing`}
              style={{
                width: itemWidth,
                height: round ? itemWidth : '300px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                transform: index === currentIndex ? 'scale(1)' : 'scale(0.95)',
                opacity: index === currentIndex ? 1 : 0.7,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(round && { borderRadius: '50%' })
              }}
              whileHover={{ 
                scale: 1.02,
                borderColor: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }}
              transition={effectiveTransition}
            >
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              
                <div className="text-center mb-2">
                  <h3 className="text-3xl font-bold text-surface mb-3" style={{
                    textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                    letterSpacing: '-0.01em'
                  }}>{item.title}</h3>
                  <p className="text-lg text-surface/90 font-medium">{item.description}</p>
                </div>
                  <WeatherIcon 
                    iconUrl={item.iconUrl} 
                    condition={item.condition} 
                    size="lg"
                    isDay={item.isDay}
                  />
              </div>
            </Motion.div>
          );
        })}
      </Motion.div>
      <div className={`flex w-full justify-center ${round ? 'absolute z-20 bottom-12 left-1/2 -translate-x-1/2' : 'mt-8'}`}>
        <div className="flex gap-3 p-3 rounded-full" style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}>
          {items.map((_, index) => (
            <Motion.div
              key={index}
              className={`h-2.5 rounded-full cursor-pointer transition-all duration-300`}
              style={{
                width: currentIndex % items.length === index ? '32px' : '8px',
                background: currentIndex % items.length === index 
                  ? 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)'
                  : 'rgba(255, 255, 255, 0.3)',
                boxShadow: currentIndex % items.length === index 
                  ? '0 2px 8px rgba(255, 255, 255, 0.4)'
                  : 'none'
              }}
              animate={{
                scale: currentIndex % items.length === index ? 1.1 : 0.9
              }}
              onClick={() => setCurrentIndex(index)}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                scale: 1.2, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 8px rgba(255, 255, 255, 0.5)'
              }}
            />
          ))}
        </div>
      </div>

      </div>
    </div>
  )
}

export default AnimatedCarousel;