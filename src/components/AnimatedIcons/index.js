// Barrel file: re-export AnimatedIcon utilities and components for convenient imports
export { default as AnimatedIcon } from './AnimatedIcon';
export { default as Thermometer } from './Thermometer';
export { default as WindBeaufort } from './WindBeaufort';
export { ICONS, LIST, CATEGORIES } from './icons';

// Also provide a default export (ES module) that contains the same items.
import AnimatedIconDefault from './AnimatedIcon';
import ThermometerDefault from './Thermometer';
import WindBeaufortDefault from './WindBeaufort';
import * as IconsModule from './icons';

const defaultExport = {
  AnimatedIcon: AnimatedIconDefault,
  Thermometer: ThermometerDefault,
  WindBeaufort: WindBeaufortDefault,
  ICONS: IconsModule.ICONS,
  LIST: IconsModule.LIST,
  CATEGORIES: IconsModule.CATEGORIES,
};

export default defaultExport;
