
![App Logo](public/logo.gif)

# Weather App — University Report

Date: October 25, 2025

This repository contains a small React + Vite front-end application that displays real-time weather data using WeatherAPI. The document below is written to be suitable for a university submission: it includes a project summary, used technologies and libraries, setup and run instructions, architecture notes, and an explanation of how day/night detection is implemented.

## Summary

The app provides:
- A search bar for cities.
- Detailed weather display (temperature, condition, humidity, wind, feels-like).
- Local time display for the searched location.
- A carousel of recent searches (up to 5 items), each shown automatically for 5 seconds.
- Day/night icon selection based on weather API data and/or astronomy (sunrise/sunset) information.

This project is suitable as a university assignment or demo because it integrates with an external API, includes timezone-aware logic, and demonstrates state management and UI animation.

## Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm / yarn — commands below use pnpm)
- WeatherAPI key (register at https://www.weatherapi.com/ to get a free key)

## Install and run locally

1. Clone the repository and cd into the project folder.
2. Install dependencies:

```bash
pnpm install
```

3. Add a `.env` file in the project root with the following variable:

```env
VITE_WEATHER_API_KEY=your_weatherapi_key_here
```

4. Start the dev server and open http://localhost:5173

```bash
pnpm run dev
```

Helpful commands:

```bash
pnpm run build    # build for production
pnpm run preview  # preview production build
pnpm run lint     # run eslint
```

## Quick usage

- Type a city name in the search input (for example: Manama, London, Riyadh).
- Each search result is added to Recent Searches (up to 5). The carousel displays each recent item for 5 seconds.
- Weather details show the local time for the searched location using `localtime` and `timezone` returned by the weather service.

## Libraries & Technologies

The list below is taken from `package.json` as used in the project at the time of writing.

Dependencies (runtime):
- dotenv ^17.2.3 — load environment variables
- framer-motion ^12.23.24 — UI animation and motion components
- lucide-react ^0.546.0 — icon library (optional)
- luxon ^3.7.2 — timezone-aware date/time handling (used for localtime and day/night detection)
- motion ^12.23.24 — additional motion library (often used alongside framer-motion)
- ogl ^1.0.11 — WebGL helper library (present for visual effects)
- react ^19.1.1 — UI library
- react-dom ^19.1.1 — DOM renderer for React
- react-icons ^5.5.0 — icon set

DevDependencies (development tooling):
- @eslint/js ^9.36.0 — linting configuration
- @tailwindcss/postcss ^4.1.15 — Tailwind PostCSS adapter
- @types/react ^19.1.16, @types/react-dom ^19.1.9 — Type helpers (if using TS)
- @vitejs/plugin-react ^5.0.4 — Vite plugin for React
- autoprefixer ^10.4.21 — CSS vendor prefixing
- eslint ^9.36.0 and related plugins — code quality
- postcss ^8.5.6 and tailwindcss ^4.1.15 — CSS tooling
- vite ^7.1.7 — dev server / bundler

> Note: You may update dependency versions as needed for your environment.

## Weather API endpoints used

The project uses WeatherAPI (https://www.weatherapi.com/):

- Current Weather
  - GET https://api.weatherapi.com/v1/current.json
  - query params: key, q (city or lat,lon)

- Astronomy
  - GET https://api.weatherapi.com/v1/astronomy.json
  - query params: key, q, dt (YYYY-MM-DD)

Full API documentation: https://www.weatherapi.com/docs/

## Accurate day/night detection (how it works)

Implemented in `src/services/weatherService.js`:

1. Fetch `current.json` for the target location. The response may include `current.is_day` (0 or 1). If present, use it.
2. If `is_day` is not available or for higher confidence, fetch `astronomy.json` for the same location and date to get sunrise/sunset times.
3. Use Luxon to parse the returned local time and sunrise/sunset times with the correct timezone, then compare the times to compute `isDay`.
4. If the above fails, fall back to a heuristic using the local hour (e.g., treat 06:00–18:00 as day).

This approach ensures local icons (sun/moon) match the actual local state of the searched location rather than the user's own local time.

## Project structure (important files)

- `src/`
  - `App.jsx` — main app component, manages state and calls the weather service
  - `services/weatherService.js` — API calls + day/night & localtime logic
  - `components/` — UI components
    - `WeatherSearch/` — search bar component
    - `WeatherDetails/` — detailed weather display (includes local time)
    - `WeatherIcon/` — chooses day or night icon
    - `AnimatedCarousel.jsx` — carousel for recent searches (shows items for 5s, limits to 5)
    - `RecentSearches/` — cards for recent searches
    - `BarLoader.jsx`, `ThemeToggle/`, `TrueFocus.jsx` — supporting components
  - `index.css` — CSS variables and minimal Tailwind/PostCSS setup

- `public/` — static assets (put `moon.png` and `animated/day.svg` here if you want local icons)

## Common setup issues & tips

- Add `VITE_WEATHER_API_KEY` in `.env` before running the app.
- Ensure `public/moon.png` and `public/animated/day.svg` exist if local icons are expected.
- If you see `motion is not defined` in the browser console, check that `framer-motion` is imported in components using `<motion.*>`.
- If you encounter Tailwind/PostCSS plugin warnings, verify `postcss.config.cjs` is using the Tailwind PostCSS adapter.

## Suggestions for a university submission

- Include a short design document (1–2 pages) describing:
  - API interaction flow (sequence diagram)
  - The `isDay` decision tree (flowchart)
  - Data shapes returned by the weather service
- Add a couple of unit tests for the `isDay` computation (mock responses for sunrise/sunset and localtime).
- Attach screenshots demonstrating the app in both day/night modes and the recent searches carousel.

## References

- WeatherAPI documentation — https://www.weatherapi.com/docs/
- Luxon — https://moment.github.io/luxon/#/
- Framer Motion — https://www.framer.com/motion/

## License

This project is released under the MIT License.

---
