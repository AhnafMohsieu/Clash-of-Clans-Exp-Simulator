// Utility functions for XP Farming Simulator

/**
 * Format large numbers with k/M suffix
 * @param {number} v - Value to format
 * @returns {string} Formatted string
 */
export function fmtK(v) {
  if (v === 0) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return parseFloat((v / 1000).toFixed(1)) + 'k';
  return String(v);
}

/**
 * Format number with locale-specific separators
 * @param {number} v - Value to format
 * @returns {string} Localized string
 */
export function loc(v) {
  return v.toLocaleString();
}

/**
 * Validate input value against constraints
 * @param {number} value - Input value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} step - Step increment
 * @returns {{ valid: number, error: string|null }}
 */
export function validateInput(value, min, max, step = 1) {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: min, error: 'Invalid number' };
  }
  
  if (num < min) {
    return { valid: min, error: `Minimum value is ${min}` };
  }
  
  if (num > max) {
    return { valid: max, error: `Maximum value is ${max}` };
  }
  
  // Round to nearest step
  const rounded = Math.round(num / step) * step;
  return { valid: rounded, error: null };
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function percentage(part, total) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}