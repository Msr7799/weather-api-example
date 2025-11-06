import React from 'react';
import AnimatedIcon from './AnimatedIcon';

/**
 * WindBeaufort component
 * Props:
 * - speed: number (wind speed in km/h)
 * - size: number|string
 * - variant: optional explicit icon name like 'wind-beaufort-3'
 * - className, style, alt
 */
export default function WindBeaufort({ speed, size = 32, variant, className = '', style = {}, alt = 'wind' }) {
  // Beaufort thresholds in km/h (approximate)
  const thresholds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];

  function pickBeaufortIndex(kmh) {
    if (typeof kmh !== 'number' || Number.isNaN(kmh)) return 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (kmh <= thresholds[i]) return i; // returns 0..11
    }
    return 12; // 12 and above
  }

  const idx = variant ? variant.replace(/^wind-beaufort-/, '') : String(pickBeaufortIndex(Number(speed)));
  const name = variant || `wind-beaufort-${idx}`;

  return (
    <AnimatedIcon name={name} size={size} className={className} alt={alt} style={style} />
  );
}

export { WindBeaufort };
