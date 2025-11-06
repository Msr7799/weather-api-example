/**
 * Centralized icon registry for animated icons (fill / all)
 * - Exports: AnimatedIcon (component), ICONS (object mapping), LIST (array), and categorized arrays
 * - Usage examples:
 *    import { AnimatedIcon, ICONS } from './components/AnimatedIcons/icons';
 *    <AnimatedIcon name={ICONS['thermometer-glass']} size={32} />
 *    or
 *    <AnimatedIcon name="thermometer-glass" size={32} />
 *
 * This single file lists all icon names (without .svg) that live in
 * public/animated_icons/production/fill/all/*.svg and organizes them by category.
 */

import AnimatedIcon from './AnimatedIcon';
import { LIST, ICONS, CATEGORIES } from './iconsList';

// Re-export constants
export { LIST, ICONS, CATEGORIES };

// Named export for component
export { AnimatedIcon };

// Default export: { AnimatedIcon, ICONS, LIST, CATEGORIES }
export default {
  AnimatedIcon,
  ICONS,
  LIST,
  CATEGORIES
};
