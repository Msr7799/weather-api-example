import React from 'react';
import AnimatedIcon from './AnimatedIcon';
import { pickThermometerIcon } from '../../lib/animatedIcons';

/**
 * Thermometer component
 * Usage:
 * <Thermometer temperature={22} unit="C" size={48} className="..." />
 * OR use explicit variant:
 * <Thermometer variant="thermometer-mercury" size={40} />
 */
export default function Thermometer({ temperature, unit = 'C', variant, size = 32, className = '', alt = 'thermometer', style = {} }) {
  const name = variant || (typeof temperature === 'number' ? pickThermometerIcon(temperature, unit) : 'thermometer');

  return (
    <AnimatedIcon name={name} size={size} className={className} alt={alt} style={style} />
  );
}

export { Thermometer };
