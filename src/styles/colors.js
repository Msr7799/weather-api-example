// ============================================
// THEME MANAGEMENT SYSTEM
// ============================================

const THEME_KEY = 'app-theme' // للحفظ في localStorage

/**
 * Apply theme to the document
 * @param {'light' | 'dark'} theme 
 */
export function applyTheme(theme) {
  const body = document.body
  // Remove both classes first
  body.classList.remove('theme-light', 'theme-dark')
  // Always add the specific theme class
  body.classList.add(`theme-${theme}`)
  
  // Save to localStorage
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (e) {
    console.warn('Could not save theme preference:', e)
  }
}

/**
 * Get current active theme
 * @returns {'light' | 'dark'}
 */
export function getCurrentTheme() {
  const body = document.body
  
  if (body.classList.contains('theme-dark')) {
    return 'dark'
  }
  
  if (body.classList.contains('theme-light')) {
    return 'light'
  }
  
  // Default fallback
  return 'light'
}

/**
 * Toggle between light and dark themes
 * @returns {'light' | 'dark'} The new theme
 */
export function toggleTheme() {
  const currentTheme = getCurrentTheme()
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  applyTheme(newTheme)
  return newTheme
}

/**
 * Initialize theme from localStorage or system preference
 * Call this once when your app starts
 */
export function initTheme() {
  // Try to get saved theme from localStorage
  let savedTheme
  try {
    savedTheme = localStorage.getItem(THEME_KEY)
  } catch (e) {
    console.warn('Could not access localStorage:', e)
  }
  
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme)
    return savedTheme
  }
  
  // Fall back to system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const defaultTheme = prefersDark ? 'dark' : 'light'
  applyTheme(defaultTheme)
  return defaultTheme
}

/**
 * Get CSS variable value from the current theme
 * @param {string} varName - Variable name (with or without --)
 * @returns {string} The computed value
 */
export function getCSSVar(varName) {
  const name = varName.startsWith('--') ? varName : `--${varName}`
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Get color value from current theme
 * @param {string} colorName - e.g., 'bg', 'text', 'primary'
 * @returns {string}
 */
export function getColor(colorName) {
  return getCSSVar(`color-${colorName}`)
}

/**
 * Listen to theme changes
 * @param {(theme: 'light' | 'dark') => void} callback 
 * @returns {() => void} cleanup function
 */
export function onThemeChange(callback) {
  const observer = new MutationObserver(() => {
    callback(getCurrentTheme())
  })
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // Return cleanup function
  return () => observer.disconnect()
}

// ============================================
// PREDEFINED COLOR PALETTES
// ============================================

/**
 * Get all theme colors as an object
 * Useful for libraries that need color values (Chart.js, etc.)
 */
export function getThemeColors() {
  return {
    bg: getColor('bg'),
    surface: getColor('surface'),
    card: getColor('card'),
    primary: getColor('primary'),
    primaryHover: getColor('primary-600'),
    accent: getColor('accent'),
    muted: getColor('muted'),
    text: getColor('text'),
    textSecondary: getColor('text-secondary'),
    success: getColor('success'),
    danger: getColor('danger'),
    inputBg: getColor('input-bg'),
    border: getColor('border'),
    borderHover: getColor('border-hover'),
  }
}

// ============================================
// AUTO-INITIALIZE ON IMPORT (OPTIONAL)
// ============================================

// Uncomment this if you want theme to initialize automatically
// when this module is imported
// initTheme()