// Preset Management System for XP Farming Simulator
import { generateId, deepClone, sanitizeHTML } from './utils.js';

const STORAGE_KEY = 'xp-simulator-presets';
const MAX_PRESETS = 50;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Get all saved presets from localStorage
 * @returns {Array} Array of preset objects
 */
export function getPresets() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [];
  }
}

/**
 * Save a preset to localStorage
 * @param {string} name - Preset name
 * @param {Object} state - Current application state
 * @returns {{ success: boolean, preset?: Object, error?: string }}
 */
export function savePreset(name, state) {
  const presets = getPresets();
  
  // Check limit
  if (presets.length >= MAX_PRESETS) {
    return { 
      success: false, 
      error: `Maximum of ${MAX_PRESETS} presets reached. Delete some presets first.` 
    };
  }
  
  // Sanitize name
  const sanitizedName = sanitizeHTML(name.trim());
  if (!sanitizedName) {
    return { success: false, error: 'Preset name cannot be empty' };
  }
  
  // Check for duplicate names
  if (presets.some(p => p.name === sanitizedName)) {
    return { success: false, error: 'A preset with this name already exists' };
  }
  
  // Create preset object
  const preset = {
    id: generateId(),
    name: sanitizedName,
    state: deepClone(state),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Check storage size
  const newData = [...presets, preset];
  const dataSize = new Blob([JSON.stringify(newData)]).size;
  
  if (dataSize > MAX_STORAGE_SIZE) {
    return { 
      success: false, 
      error: 'Storage limit reached. Delete some presets or export them first.' 
    };
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return { success: true, preset };
  } catch (error) {
    console.error('Failed to save preset:', error);
    return { success: false, error: 'Failed to save preset' };
  }
}

/**
 * Load a preset by ID
 * @param {string} id - Preset ID
 * @returns {{ success: boolean, state?: Object, error?: string }}
 */
export function loadPreset(id) {
  const presets = getPresets();
  const preset = presets.find(p => p.id === id);
  
  if (!preset) {
    return { success: false, error: 'Preset not found' };
  }
  
  return { success: true, state: deepClone(preset.state) };
}

/**
 * Delete a preset by ID
 * @param {string} id - Preset ID
 * @returns {{ success: boolean, error?: string }}
 */
export function deletePreset(id) {
  const presets = getPresets();
  const index = presets.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, error: 'Preset not found' };
  }
  
  presets.splice(index, 1);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete preset:', error);
    return { success: false, error: 'Failed to delete preset' };
  }
}

/**
 * Update an existing preset
 * @param {string} id - Preset ID
 * @param {string} name - New name (optional)
 * @param {Object} state - New state (optional)
 * @returns {{ success: boolean, preset?: Object, error?: string }}
 */
export function updatePreset(id, name, state) {
  const presets = getPresets();
  const index = presets.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, error: 'Preset not found' };
  }
  
  if (name !== undefined) {
    const sanitizedName = sanitizeHTML(name.trim());
    if (!sanitizedName) {
      return { success: false, error: 'Preset name cannot be empty' };
    }
    presets[index].name = sanitizedName;
  }
  
  if (state !== undefined) {
    presets[index].state = deepClone(state);
  }
  
  presets[index].updatedAt = new Date().toISOString();
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return { success: true, preset: presets[index] };
  } catch (error) {
    console.error('Failed to update preset:', error);
    return { success: false, error: 'Failed to update preset' };
  }
}

/**
 * Export all presets as JSON
 * @returns {string} JSON string of all presets
 */
export function exportPresets() {
  const presets = getPresets();
  return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON
 * @param {string} jsonString - JSON string of presets
 * @returns {{ success: boolean, imported?: number, error?: string }}
 */
export function importPresets(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    
    if (!Array.isArray(imported)) {
      return { success: false, error: 'Invalid format: expected array of presets' };
    }
    
    const existing = getPresets();
    const existingIds = new Set(existing.map(p => p.id));
    
    // Filter out duplicates by ID
    const newPresets = imported.filter(p => 
      p.id && p.name && p.state && !existingIds.has(p.id)
    );
    
    // Check storage limit
    const combined = [...existing, ...newPresets];
    if (combined.length > MAX_PRESETS) {
      return { 
        success: false, 
        error: `Import would exceed ${MAX_PRESETS} preset limit` 
      };
    }
    
    const dataSize = new Blob([JSON.stringify(combined)]).size;
    if (dataSize > MAX_STORAGE_SIZE) {
      return { 
        success: false, 
        error: 'Import would exceed storage limit' 
      };
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    return { success: true, imported: newPresets.length };
  } catch (error) {
    console.error('Failed to import presets:', error);
    return { success: false, error: 'Invalid JSON format' };
  }
}

/**
 * Get storage usage info
 * @returns {{ used: number, total: number, percentage: number }}
 */
export function getStorageInfo() {
  const data = localStorage.getItem(STORAGE_KEY) || '';
  const used = new Blob([data]).size;
  return {
    used,
    total: MAX_STORAGE_SIZE,
    percentage: Math.round((used / MAX_STORAGE_SIZE) * 100)
  };
}
