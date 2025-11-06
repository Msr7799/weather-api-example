import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const WeatherSearch = (props) => {
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const inputWrapperRef = useRef(null);
  const portalElRef = useRef(null);

  // Create a portal container attached to document.body
  useEffect(() => {
    const el = document.createElement('div');
    // use fixed positioning so the portal is positioned relative to the viewport
    el.style.position = 'fixed';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = 'auto';
    el.style.zIndex = '999';
    portalElRef.current = el;
    document.body.appendChild(el);

    return () => {
      if (portalElRef.current && portalElRef.current.parentNode) {
        portalElRef.current.parentNode.removeChild(portalElRef.current);
      }
      portalElRef.current = null;
    };
  }, []);

  // Use CSS variables defined in `src/index.css` for colors so theme switching stays consistent

  // Update portal position to match the input wrapper
  useEffect(() => {
    if (!showSuggestions || !inputWrapperRef.current || !portalElRef.current) return;

    const updatePosition = () => {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      // portal element is fixed (viewport-relative). Use rect coordinates directly
      // (don't add window.scrollX / scrollY) to avoid moving the dropdown when scrolling.
      portalElRef.current.style.left = `${rect.left}px`;
      portalElRef.current.style.top = `${rect.bottom}px`;
      portalElRef.current.style.width = `${rect.width}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showSuggestions, filteredCities]);

  // جلب قائمة الدول والعواصم عند تحميل المكون
  useEffect(() => {
   const fetchCities = async () => {
  try {
    const URL = 'https://restcountries.com/v3.1/all?fields=name,capital,altSpellings,cca2';
    const res = await fetch(URL, { cache: 'force-cache' });
    console.log('[fetchCities] status', res.status);

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
    }

    const countries = await res.json();
    console.log('[fetchCities] countriesCount=', countries.length);

    const cityList = new Set();

    countries.forEach(country => {
      // country.name.common may be missing for very odd entries
      if (country.name?.common) cityList.add(country.name.common);

      // capital may be an array or missing
      if (Array.isArray(country.capital) && country.capital[0]) {
        cityList.add(country.capital[0]);
      }

      // altSpellings can include short codes or variants; filter short entries
      if (Array.isArray(country.altSpellings)) {
        country.altSpellings.forEach(alt => {
          if (alt && alt.length > 3) cityList.add(alt);
        });
      }
    });

    const sortedCities = Array.from(cityList).sort((a, b) => a.localeCompare(b));
    setCities(sortedCities);
    setLoading(false);
  } catch (err) {
    console.error('[fetchCities] error', err);
    // fallback list
    setCities([
      "Manama","Riyadh","Dubai","Abu Dhabi","Doha","Kuwait City",
      "Muscat","Cairo","London","Paris","New York","Tokyo"
    ].sort());
    setLoading(false);
  }
};

    fetchCities();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      props.fetchData(city);
      setCity('');
      setShowSuggestions(false);
    }
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setCity(value);

    if (value.length > 0 && cities.length > 0) {
      const filtered = cities.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredCities(filtered);
      setShowSuggestions(true);
      // reset highlighted index to first result
      setHighlightedIndex(filtered.length > 0 ? 0 : -1);
    } else {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const selectHighlighted = () => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
      handleCitySelect(filteredCities[highlightedIndex]);
    }
  };

  const handleKeyDown = (e) => {
    // If suggestions are not visible but there are filtered results, allow ArrowDown/ArrowUp to open list
    if (!showSuggestions && filteredCities.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex(0);
      return;
    }

    if (!showSuggestions || filteredCities.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= filteredCities.length ? 0 : next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? filteredCities.length - 1 : next;
      });
      return;
    }

    if (e.key === 'Enter') {
      // when suggestions visible, Enter should select highlighted option
      if (highlightedIndex >= 0) {
        e.preventDefault();
        selectHighlighted();
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <section className=" relative">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-bg/50 py-10 px-6 sm:flex-row items-center backdrop-blur-md rounded-3xl transition-all duration-300 hover:shadow-2xl gap-4 p-4 sm:p-6 shadow-xl !mb-30"
      >
        <div className="flex items-center gap-3 w-full sm:flex-1 relative">
          <svg className="w-6 h-6 text-text flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
            <div className="w-full relative" ref={inputWrapperRef}>
            <input
              id="city"
              type="text"
              value={city}
              onChange={handleCityChange}
              onFocus={() => city.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              aria-controls="city-suggestion-list"
              aria-activedescendant={highlightedIndex >= 0 ? `city-option-${highlightedIndex}` : undefined}
              placeholder={loading ? "Loading cities..." : "Search for a city or country..."}
              required
              disabled={loading}
              className="w-full py-3 px-3 bg-muted/10 border-2 border-border rounded-md text-base sm:text-lg focus:outline-none focus:border-orange-800 focus:ring-orange-800 font-light disabled:opacity-50"
              aria-label="City name"
              autoComplete="off"
            />
            
            {showSuggestions && filteredCities.length > 0 && inputWrapperRef.current && portalElRef.current && createPortal(
              <div
                id="city-suggestion-list"
                role="listbox"
                className="font-bold backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                style={{
                  position: 'relative',
                  width: '100%',
                  zIndex: 999,
                  backdropFilter: 'blur(10px)',
                  color: 'var(--color-text)',
                  border: '2px solid var(--color-border)',
                  background:'var(--color-list)'

                }}
              >
{filteredCities.map((c, idx) => (
  <button
    key={idx}
    id={`city-option-${idx}`}
    role="option"
    aria-selected={highlightedIndex === idx}
    type="button"
    onClick={() => handleCitySelect(c)}
    onMouseEnter={() => setHighlightedIndex(idx)}
    onMouseLeave={() => setHighlightedIndex(-1)}
    className={`w-full text-left px-4 py-3 transition-colors duration-200 border-b last:border-b-0 cursor-pointer
      ${highlightedIndex === idx
        ? 'bg-[var(--color-bg-hover)] text-white'
        : 'bg-[var(--color-list)] text-[rgba(255,255,255,0.53)] hover:bg-[var(--color-primary)] hover:text-white'
      }`}
  >
    <div className="flex items-center gap-2">
      <svg
        className="w-4 h-4 opacity-60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span className="font-light">{c}</span>
    </div>
  </button>
))}

              </div>,
              portalElRef.current
            )}
          </div>
        </div>

        <button
          className="mt-0 flex sm:mt-0 w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 hover:from-gray-900 hover:via-gray-800 hover:to-gray-800 text-white/80 font-semibold text-base sm:text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
          aria-label="Search"
        >
          Search
        </button>
      </form>
    </section>
  );
};

export default WeatherSearch;