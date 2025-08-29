/**
 * Ship refit application functions
 * Handles applying canonical refits to ships
 */

import { applyRefit, canApplyRefit } from './apply.js';

/**
 * Apply a canonical refit to a ship
 * @param {Object} ship - Ship to apply refit to
 * @param {Object} canonicalRefit - Canonical refit from factions.json
 * @param {string} scope - "capital" or "squadron"
 * @returns {{ ok: boolean, ship?: Object, error?: string }}
 */
export function applyCanonicalRefitToShip(ship, canonicalRefit, scope) {
  try {
    // Apply canonical refit directly
    const result = applyRefit(ship, canonicalRefit);
    
    if (result.ok) {
      // Store canonical refit data
      result.ship.appliedCanonicalRefit = canonicalRefit;
      result.ship[scope === 'capital' ? 'refit' : 'squadronRefit'] = canonicalRefit;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to apply refit:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Check if a canonical refit can be applied to a ship
 * @param {Object} ship - Ship to check
 * @param {Object} canonicalRefit - Canonical refit from factions.json
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canApplyCanonicalRefit(ship, canonicalRefit) {
  try {
    return canApplyRefit(ship, canonicalRefit);
  } catch (error) {
    console.error('Failed to check refit eligibility:', error);
    return { ok: false, reason: error.message };
  }
}

/**
 * Remove refit from a ship
 * @param {Object} ship - Ship to remove refit from
 * @param {string} scope - "capital" or "squadron" 
 * @returns {Object} Ship without refit
 */
export function removeRefitFromShip(ship, scope) {
  const cleanedShip = { ...ship };
  
  // Remove refit data
  delete cleanedShip.appliedCanonicalRefit;
  delete cleanedShip[scope === 'capital' ? 'refit' : 'squadronRefit'];
  
  // Reset any stat modifications (would need original ship data to do this properly)
  // For now, just return cleaned ship
  
  return cleanedShip;
}

/**
 * Get available refits for a faction
 * @param {Object} factions - Factions data
 * @param {string} factionName - Faction name
 * @param {string} scope - "capital" or "squadron"
 * @returns {Array} Array of available refits
 */
export function getAvailableRefits(factions, factionName, scope) {
  const factionData = factions[factionName];
  if (!factionData) return [];
  
  // Get universal refits
  const universalKey = scope === 'capital' ? 'capitalShipRefits' : 'squadronRefits';
  const universalRefits = factions.universalRefits?.[universalKey] || [];
  
  // Get faction-specific refits
  const factionRefits = factionData.factionRefits?.[universalKey] || [];
  
  return [...universalRefits, ...factionRefits];
}
