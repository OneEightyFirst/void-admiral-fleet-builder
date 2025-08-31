/**
 * Utility functions for displaying refit information consistently across the UI
 * Handles both legacy and canonical refit systems
 */

/**
 * Gets the applied refit for a ship, checking both canonical and legacy systems
 * @param {Object} ship - The ship object
 * @returns {Object|null} - The refit object or null if no refit applied
 */
export function getAppliedRefit(ship) {
  if (!ship) return null;
  
  // Check canonical refit system first (preferred)
  if (ship.appliedCanonicalRefit) {
    return ship.appliedCanonicalRefit;
  }
  
  // Fall back to legacy refit system
  if (ship.refit) {
    return ship.refit;
  }
  
  // For squadrons, check legacy squadron refit
  if (ship.squadronRefit) {
    return ship.squadronRefit;
  }
  
  return null;
}

/**
 * Gets the refit name for display
 * @param {Object} ship - The ship object
 * @returns {string|null} - The refit name or null if no refit applied
 */
export function getRefitName(ship) {
  const refit = getAppliedRefit(ship);
  return refit?.name || null;
}

/**
 * Gets the selected option name for display
 * @param {Object} ship - The ship object
 * @returns {string|null} - The selected option name or null if no option selected
 */
export function getRefitSelectedOption(ship) {
  const refit = getAppliedRefit(ship);
  return refit?.selectedOption || null;
}

/**
 * Checks if a ship has any refit applied
 * @param {Object} ship - The ship object
 * @returns {boolean} - True if ship has a refit applied
 */
export function hasRefit(ship) {
  return getAppliedRefit(ship) !== null;
}

/**
 * Gets the full refit display text for UI
 * @param {Object} ship - The ship object
 * @returns {string} - Formatted refit text for display
 */
export function getRefitDisplayText(ship) {
  const refit = getAppliedRefit(ship);
  
  if (!refit) {
    return "No refit selected";
  }
  
  let text = refit.name;
  
  if (refit.selectedOption) {
    text += ` - ${refit.selectedOption}`;
  }
  
  return text;
}

/**
 * Gets refit notes for display
 * @param {Object} ship - The ship object
 * @returns {Array|null} - Array of note strings or null if no notes
 */
export function getRefitNotes(ship) {
  const refit = getAppliedRefit(ship);
  return refit?.notes || null;
}
