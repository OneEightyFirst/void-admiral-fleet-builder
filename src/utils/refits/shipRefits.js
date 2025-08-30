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
export function applyCanonicalRefitToShip(ship, canonicalRefit, selectedOption = null, shipDefinition = null) {
  try {
    // Create enhanced ship object that includes ship definition data
    const enhancedShip = {
      ...ship,
      // Copy beginsWith from ship definition if it exists
      // This is needed for weapon replacement to work on beginsWith weapons
      ...(shipDefinition && shipDefinition.beginsWith && {
        beginsWith: [...shipDefinition.beginsWith]
      })
    };
    
    console.log('🔧 ENHANCED_SHIP: Ship has beginsWith:', !!enhancedShip.beginsWith);
    if (enhancedShip.beginsWith) {
      console.log('🔧 ENHANCED_SHIP: beginsWith weapons:', enhancedShip.beginsWith);
    }
    
    // Apply canonical refit directly
    const result = applyRefit(enhancedShip, canonicalRefit, selectedOption);
    
    if (result.ok) {
      // Store canonical refit data
      result.ship.appliedCanonicalRefit = canonicalRefit;
      result.ship.squadronRefit = canonicalRefit; // Store for squadrons
      
      return { success: true, ship: result.ship };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to apply refit:', error);
    return { success: false, error: error.message };
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
