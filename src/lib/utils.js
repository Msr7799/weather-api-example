/**
 * Safely merges class names for Tailwind CSS.
 *
 * Accepts the same inputs as clsx (strings, arrays, objects, and falsy values)
 * and uses tailwind-merge to resolve conflicting Tailwind utility classes,
 * producing a single normalized class string with duplicates and conflicts removed.
 *
 * @param {...any} inputs - Class name inputs (strings, arrays, objects, etc.) accepted by clsx.
 * @returns {string} A single className string with duplicates removed and Tailwind utility conflicts resolved.
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
