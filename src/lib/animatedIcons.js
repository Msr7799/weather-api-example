// Centralized mapping and helpers for animated icons in public/animated_icons/production/fill/all
// Export helper functions for constructing paths and picking thermometer icons by temperature.

export const ICON_BASE = '/animated_icons/production/fill/all';

export const THERMOMETER_ICONS = [
  'thermometer-celsius',
  'thermometer-colder',
  'thermometer-fahrenheit',
  'thermometer-glass-celsius',
  'thermometer-glass-fahrenheit',
  'thermometer-glass',
  'thermometer-mercury-cold',
  'thermometer-mercury',
  'thermometer-warmer',
  'thermometer'
];

export function iconPath(name) {
  if (!name) return `${ICON_BASE}/not-available.svg`;
  return `${ICON_BASE}/${name}.svg`;
}

/**
 * Pick a thermometer icon name based on temperature.
 * temp: number (value), unit: 'C' | 'F'
 * This is a heuristic mapping — tweak thresholds to taste.
 */
export function pickThermometerIcon(temp, unit = 'C') {
  if (typeof temp !== 'number' || Number.isNaN(temp)) return 'thermometer';

  let c = temp;
  if (unit === 'F') {
    c = (temp - 32) * (5 / 9);
  }

  // thresholds (in Celsius)
  if (c <= -10) return 'thermometer-mercury-cold';
  if (c > -10 && c <= 0) return 'thermometer-colder';
  if (c > 0 && c <= 10) return 'thermometer-celsius';
  if (c > 10 && c <= 20) return 'thermometer-mercury';
  if (c > 20 && c <= 30) return 'thermometer-warmer';
  if (c > 30) return 'thermometer-glass';

  return 'thermometer';
}

export default {
  ICON_BASE,
  THERMOMETER_ICONS,
  iconPath,
  pickThermometerIcon,
};