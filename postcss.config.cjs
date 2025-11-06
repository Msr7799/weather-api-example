// postcss config — guard optional plugins so missing dev-deps don't crash Vite
const plugins = [
  require('@tailwindcss/postcss')(),
  require('autoprefixer')(),
];

try {
  // optional: transforms CSS custom properties to static values
  const customProps = require('postcss-custom-properties');
  plugins.push(customProps({ preserve: false }));
} catch (err) {
  // not fatal — devs can install the plugin if they need custom-properties processing
  console.warn('[postcss] postcss-custom-properties not found; skipping. Install with `pnpm add -D postcss-custom-properties` to enable.');
}

module.exports = { plugins };
