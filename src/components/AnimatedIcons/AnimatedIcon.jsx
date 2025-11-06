import React from 'react';
import { iconPath } from '../../lib/animatedIcons';

/**
 * AnimatedIcon
 * Props:
 * - name: string (icon filename without .svg)
 * - size: number or string (px number or CSS size like '2rem')
 * - className: additional class names
 * - alt: alt text
 * - style: extra inline styles
 */
export default function AnimatedIcon({ name, size = 24, className = '', alt = '', style = {}, ...rest }) {
  const src = iconPath(name);

  const sizeStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : { width: size, height: size };

  return (
    <img
      src={src}
      alt={alt || name}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...sizeStyle, ...style }}
      {...rest}
    />
  );
}
