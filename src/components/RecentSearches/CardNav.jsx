import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import WeatherIcon from '../WeatherIcon/WeatherIcon';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items = [],
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  onCityClick
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const detectThemeChange = () => {
      setThemeKey(prev => prev + 1);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setTimeout(detectThemeChange, 50);
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 420;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 70;
        const padding = 100;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 420;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 70, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.5,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.1 }, '-=0.2');

    return tl;
  };

  useLayoutEffect(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    isAnimatingRef.current = false;

    if (isExpanded) {
      setIsExpanded(false);
      setIsHamburgerOpen(false);
      
      if (navRef.current) {
        gsap.set(navRef.current, { height: 70, overflow: 'hidden' });
      }
    }

    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      if (tl) {
        tl.kill();
      }
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items, themeKey]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, themeKey]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    
    if (!tl || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      
      tl.eventCallback('onComplete', null);
      tl.eventCallback('onReverseComplete', null);
      
      tl.eventCallback('onComplete', () => {
        isAnimatingRef.current = false;
      });
      
      tl.restart();
      
    } else {
      setIsHamburgerOpen(false);
      
      tl.eventCallback('onComplete', null);
      tl.eventCallback('onReverseComplete', null);
      
      tl.eventCallback('onReverseComplete', () => {
        setIsExpanded(false);
        isAnimatingRef.current = false;
        tl.progress(0);
      });
      
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  const displayedItems = items.slice(0, 3);

  return (
    <div className={`card-nav-container w-full ${className}`}>
    <nav
  ref={navRef}
  className={`card-nav ${isExpanded ? 'open' : ''} block h-[70px] !bg-[var(--color-card)]/20 rounded-2xl border-4 !border-border !shadow-2xl !relative overflow-visible will-change-[height] transition-shadow duration-300`}
  style={{ backgroundColor: baseColor }}
>
  <div
    className="card-nav-top absolute inset-x-0 top-2 flex items-center justify-between px-4 py-2 z-30"
    style={{ transform: 'translateY(-12%)' }} /* lift the bar slightly above the card */
  >
    {/* left - hamburger (fixed width, won't shrink) */}
    <div className="left flex items-center flex-shrink-0 w-12">
      <div
        className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-10 w-10 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110`}
        onClick={toggleMenu}
        role="button"
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        tabIndex={0}
        style={{ color: menuColor || '#000' }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); } }}
      >
        <div className={`hamburger-line w-[22px] h-[9px] rounded-full bg-slate-500 transition-all duration-300 ease-out ${isHamburgerOpen ? 'translate-y-[3px] rotate-45' : ''}`} />
        <div className={`hamburger-line w-[32px] h-[4px] rounded-full  bg-gradient-to-r from-slate-700 to-slate-600 transition-all duration-300 ease-out ${isHamburgerOpen ? '-translate-y-[3px] -rotate-45' : ''}`} />
      </div>
    </div>

    {/* center - logo + title (does not capture pointer events; inner restores them) */}
    <div className="center flex-1 flex items-center justify-center pointer-events-none">
      <div className="center-inner flex items-center gap-3 pointer-events-auto max-w-[60%] sm:max-w-none">
        <img src={logo} alt={logoAlt} className="h-7 sm:h-[35px] object-contain" />
        <h2 className="text-base sm:text-xl font-bold text-text/70 truncate text-center">
          Recent Searches
        </h2>
      </div>
    </div>

    {/* right - world map button (fixed width, won't shrink) */}
        <div className="right flex items-center flex-shrink-0">
      <button
        type="button"
        className="flex items-center justify-center rounded-full font-semibold cursor-pointer transition-all duration-300 hover:scale-105 whitespace-nowrap text-sm !sm:px-3 !sm:py-4 px-4 py-2"
        style={{
          backgroundColor: buttonBgColor,
          color: buttonTextColor,
          minWidth: 96 /* prevents extreme compression on small screens */
        }}
        aria-label="Open world map"
        onClick={() => navigate('/world-map')}
      >
        <span className="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></span>
        <span className="hidden sm:inline">World Map</span>
      </button>
    </div>

  </div>

        {/* محتوى الكروت - Recent Searches */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-[70px] bottom-0 !p-2 flex flex-col items-stretch gap-5 !bg-[var(--color-card)]/20 justify-start z-[1] ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          } md:flex-row md:items-stretch md:gap-5`}
          aria-hidden={!isExpanded}
        >
          {displayedItems.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
                className="nav-card !select-none !relative !border-t-3 !border-t-border !border-3 !border-border/30 !flex !flex-col !p-4 !mb-4 !rounded-2xl !min-w-0 !flex-[1_1_auto] !h-auto !min-h-[200px] !md:h-full !md:min-h-2 !md:flex-[1_1_0%] !shadow-t-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-visible group"
              ref={setCardRef(idx)}
              style={{ 
                border: '3px solid rgba(254, 254, 254, 0.12)',
                backdropFilter: 'blur(10px) brightness(60%)',
                WebkitBackdropFilter: 'blur(10px)  '
              }}
              onClick={() => onCityClick && onCityClick(item.title)}
            >
              {/* Header section - اسم المدينة والأيقونة */}
              <div className="flex items-center justify-between !ml-4 gap-4 ">
             
              <h3 
  className="font-bold text-clip tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-white text-[30px] md:text-[28px] leading-tight break-words ml-4" 
  style={{
    textShadow: '0 1px 2px rgba(83, 81, 81, 0.17)',
    letterSpacing: '0.03em',
    maxWidth: 'calc(100% - 60px)' 
  }}
>
  {item.title}
</h3>

                
                {/* Weather Icon */}
                <div className="flex-shrink-0">
                  <WeatherIcon 
                    iconUrl={item.iconUrl} 
                    condition={item.condition}
                    size="md"
                    isDay={item.isDay}
                  />
                </div>
              </div>

              {/* Weather Description - الوصف */}
              <div className="mb-5">
                <p className="text-[var(--color-card)] text-[22px] md:text-[17px] font-medium leading-relaxed break-words">
                  {item.description}
                </p>
              </div>

              {/* Footer - Click hint */}
              <div className="mt-auto pt-3 border-t border-white/10">
                <div className="text-[var(--color-muted)] text-[16px] md:text-[14px] flex items-center gap-2 group-hover:text-muted/50 transition-colors duration-200">
                  <span className="font-medium">Click to view details</span>
                  <svg 
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}

          {/* رسالة لو ما في عمليات بحث */}
          {displayedItems.length === 0 && (
            <div className="flex items-center justify-center h-full w-full text-surface/60 text-center p-8">
              <div className="space-y-3">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-medium">No recent searches yet</p>
                <p className="text-sm opacity-75">Start searching for cities to see them here</p>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export { CardNav };
export default CardNav;