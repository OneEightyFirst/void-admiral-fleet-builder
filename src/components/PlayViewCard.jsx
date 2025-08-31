import React from 'react';
import {
  Card, Typography, Box, Grid
} from '@mui/material';
import { ProwIcon, RearIcon, HullIcon } from './SVGComponents';

import { getStatDisplayName, formatStatValue, shipCost } from '../utils/gameUtils';
import { getWeaponDataByIndex, convertLoadoutToIndices, getRefitSlotWeapons } from '../utils/refits/weaponData.js';

// Helper function to format attacks value for display
const formatAttacks = (attacks) => {
  if (typeof attacks === 'number') {
    return attacks;
  }
  if (typeof attacks === 'object' && attacks.dice) {
    return attacks.star ? `${attacks.dice}*` : attacks.dice;
  }
  return attacks || '?';
};

// Helper function to format range value for display
const formatRange = (range) => {
  if (range === '-' || range === '—') {
    return range;
  }
  if (typeof range === 'number') {
    return range;
  }
  // Remove inch marks from string ranges
  if (typeof range === 'string') {
    return range.replace(/[″"]/g, '');
  }
  return range || '?';
};

const PlayViewCard = ({ ship, squadron, faction, shipDef }) => {
  // Determine if this is a squadron or single ship based on shipDef.squadron
  const isSquadron = shipDef?.squadron === true;
  const rawShip = isSquadron ? (squadron ? squadron[0] : ship) : ship;
  const currentShipDef = shipDef;
  
  // Convert ship loadout to index-based format if needed
  const currentShip = rawShip ? convertLoadoutToIndices(rawShip, currentShipDef) : rawShip;

  if (!currentShip || !currentShipDef) return null;
  if (isSquadron && squadron && squadron.length === 0) return null;

  // Calculate cost and statline based on ship type
  const getCostAndStatline = () => {
    if (isSquadron) {
      // Squadron logic
      const firstShip = squadron[0];
      
      // For now, always use shipDef.statline as base, then apply refit modifications if they exist
      let statline = { ...currentShipDef.statline };
      
      // If refit was applied and modified the statline, use those modifications
      if (firstShip?.statline && Object.keys(firstShip.statline).length > 0) {
        console.log('🔧 DEBUG: Using modified statline from refit');
        statline = { ...firstShip.statline };
      }
            
      // Calculate squadron cost and display
      const isFreeSquadron = firstShip.isFree;
      const squadronCost = isFreeSquadron ? 0 : shipCost(currentShipDef) * squadron.length;
      const costDisplay = squadronCost === 0 ? 'Free' : `${squadronCost} pts`;
      
      return { cost: squadronCost, costDisplay, statline };
    } else {
      // Single ship logic
      const cost = shipCost(currentShipDef);
      const statline = currentShip.statline || currentShipDef.statline || {};
      return { cost, costDisplay: `${cost} pts`, statline };
    }
  };

  const { cost, costDisplay, statline } = getCostAndStatline();

  // Get weapons based on ship type
  const getWeapons = () => {
    if (isSquadron) {
      // Squadron weapons logic - collect from all ships in squadron
      const allWeapons = [];
      squadron.forEach((rawShip, shipIndex) => {
        // Convert each ship in squadron to index-based format
        const convertedShip = convertLoadoutToIndices(rawShip, currentShipDef);
        
        // Add prow weapon for this ship
        if (convertedShip.loadout?.prow) {
          const weaponData = getWeaponDataByIndex(convertedShip.loadout.prow, currentShipDef, 'prow', convertedShip);
          const weaponName = currentShipDef.prow?.options?.[convertedShip.loadout.prow.optionIndex]?.name || 'Unknown';
          allWeapons.push({
            name: weaponName,
            data: weaponData,
            type: 'prow',
            shipIndex: shipIndex
          });
        }
        
        // Add hull weapons for this ship
        if (convertedShip.loadout?.hull) {
          convertedShip.loadout.hull.forEach(weaponRef => {
            const weaponData = getWeaponDataByIndex(weaponRef, currentShipDef, 'hull', convertedShip);
            const weaponName = currentShipDef.hull?.options?.[weaponRef.optionIndex]?.name || 'Unknown';
            allWeapons.push({
              name: weaponName,
              data: weaponData,
              type: 'hull',
              shipIndex: shipIndex
            });
          });
        }
      });
      
      // Check if any weapons are Fighter Bays
      const hasFighterBays = allWeapons.some(weapon => weapon.name === "Fighter Bays");
      
      return { allWeapons, hasFighterBays, prowWeapon: null, hullWeapons: [], groupedHullWeapons: {} };
    } else {
      // Single ship weapons logic
      const prowWeapon = currentShip.loadout?.prow;
      const hullWeapons = currentShip.loadout?.hull || [];

      // Group hull weapons by name (convert indices to names first)
      const groupedHullWeapons = hullWeapons.reduce((acc, weaponRef) => {
        const weaponName = currentShipDef.hull?.options?.[weaponRef.optionIndex]?.name || 'Unknown';
    acc[weaponName] = (acc[weaponName] || 0) + 1;
    return acc;
  }, {});

  // Check if any weapons are Fighter Bays (for footnote)
      const prowWeaponName = prowWeapon ? currentShipDef.prow?.options?.[prowWeapon.optionIndex]?.name : null;
      const hasFighterBays = (prowWeaponName === "Fighter Bays") || 
                            hullWeapons.some(weaponRef => {
                              const weaponName = currentShipDef.hull?.options?.[weaponRef.optionIndex]?.name;
                              return weaponName === "Fighter Bays";
                            });

      return { allWeapons: [], hasFighterBays, prowWeapon, hullWeapons, groupedHullWeapons };
    }
  };

  const { allWeapons, hasFighterBays, prowWeapon, hullWeapons, groupedHullWeapons } = getWeapons();
  
  // Debug logging for index-based system
  if (faction === 'Loyalists' && (currentShipDef?.className === 'Galleon' || currentShipDef?.className === 'Destroyer')) {
    console.log('🎯 INDEX SYSTEM: Ship:', currentShip?.className);
    console.log('🎯 INDEX SYSTEM: Raw loadout:', rawShip?.loadout);
    console.log('🎯 INDEX SYSTEM: Converted loadout:', currentShip?.loadout);
    console.log('🎯 INDEX SYSTEM: Hull options:', currentShipDef?.hull?.options?.map((w, i) => `${i}: ${w.name}`));
  }

  return (
    <Card className="play-view-card">
            {/* Header Section */}
      <div className="play-view-card__header">
        <div className="play-view-card__header-content">
          <div className="play-view-card__header-left">
            <div className="play-view-card__header-faction">
              {faction.toUpperCase()}
            </div>
            <div className="play-view-card__header-name">
              {currentShip.className}
            </div>
            <div className="play-view-card__header-size">
              {currentShipDef.size}
            </div>
          </div>
          <div className="play-view-card__header-right">
            <div className="play-view-card__header-cost">
              {costDisplay}
            </div>
            {isSquadron && (
              <div className="play-view-card__header-count">
                {squadron.length} ships
              </div>
            )}
          </div>
        </div>
      </div>

            {/* Stats Section */}
      <div className="play-view-card__stats">
        {/* Stat Labels Row */}
        <div className="play-view-card__stats-labels">
          <div className="play-view-card__stats-grid">
            {['Hull', 'Speed', 'Armour', 'Shields', 'Flak']
              .filter(statName => statline[statName] !== undefined)
              .map((statName) => (
              <div key={statName} className="play-view-card__stats-label-item">
                <Typography variant="body2" className="play-view-card__stats-label">
                  {getStatDisplayName(statName)}
                </Typography>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stat Values Row */}
        <div className="play-view-card__stats-values">
          <div className="play-view-card__stats-grid">
            {['Hull', 'Speed', 'Armour', 'Shields', 'Flak']
              .filter(statName => statline[statName] !== undefined)
              .map((statName) => (
              <div key={statName} className="play-view-card__stats-value-item">
                <Typography variant="h6" className="play-view-card__stats-value">
                  {formatStatValue(statName, statline[statName])}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weapons Section */}
      <div className="play-view-card__weapons">
        {isSquadron ? (
          // Squadron weapons display - show refit info first if present
          <>
            {currentShip.squadronRefit && (
              <div className="play-view-card__refit">
                <Typography variant="body1" className="play-view-card__refit-title">
                  Squadron Refit: {currentShip.squadronRefit.name}
                </Typography>
                {currentShip.squadronRefit.effects?.map((effect, index) => (
                  <Typography key={index} variant="body2" className="play-view-card__refit-effect">
                    • {effect.description}
                  </Typography>
                ))}
              </div>
            )}
            
            {/* Squadron Weapons Table Header */}
            <div className="play-view-card__weapons-header">
              <div className="play-view-card__weapons-header-grid">
                <div>
                  {/* Empty column for weapon names */}
                </div>
                <div className="play-view-card__weapons-header-label">
                  Target
                </div>
                <div className="play-view-card__weapons-header-label">
                  Attacks
                </div>
                <div className="play-view-card__weapons-header-label">
                  Range
                </div>
              </div>
            </div>
            
                        {/* Squadron Weapons Rows */}
            {allWeapons.map((weapon, index) => (
              <div key={index} className={`play-view-card__weapons-row ${index === allWeapons.length - 1 ? 'play-view-card__weapons-row--last' : ''}`}>
                <div className="play-view-card__weapons-row-grid">
                  <div className="play-view-card__weapons-row-name">
                    <div className="play-view-card__weapons-row-number">
                      {index + 1}
                    </div>
                    {weapon.type === 'prow' ? (
                      faction === 'Merchants' && !currentShipDef.squadron ? <RearIcon size={16} /> : <ProwIcon size={16} />
                    ) : (
                      <HullIcon size={16} />
                    )}
                    <Typography variant="body1" className="play-view-card__weapons-row-title">
                      {weapon.name}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body1" className="play-view-card__weapons-row-stat">
                      {weapon.data.targets}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body1" className="play-view-card__weapons-row-stat">
                      {formatAttacks(weapon.data.attacks)}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="body1" className="play-view-card__weapons-row-stat">
                      {formatRange(weapon.data.range)}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
                    // Capital ship weapons display
          <>
            {/* Weapons Table Header */}
            <div className="play-view-card__weapons-header">
              <div className="play-view-card__weapons-header-grid">
                <div>
                  {/* Empty column for weapon names */}
                </div>
                <div className="play-view-card__weapons-header-label">
                  Target
                </div>
                <div className="play-view-card__weapons-header-label">
                  Attacks
                </div>
                <div className="play-view-card__weapons-header-label">
                  Range
                </div>
              </div>
            </div>

                  {/* Prow Weapon */}
            {prowWeapon && (() => {
              const weaponData = getWeaponDataByIndex(prowWeapon, currentShipDef, 'prow', currentShip);
              const weaponName = currentShipDef.prow?.options?.[prowWeapon.optionIndex]?.name || 'Unknown';
              return (
                <div className="play-view-card__weapons-row">
                  <div className="play-view-card__weapons-row-grid">
                    <div className="play-view-card__weapons-row-name">
                      {faction === 'Merchants' && !currentShipDef.squadron ? <RearIcon size={16} /> : <ProwIcon size={16} />}
                      <Typography variant="body1" className="play-view-card__weapons-row-title">
                        {weaponName}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {weaponData.targets}
                  </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {formatAttacks(weaponData.attacks)}
                </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {formatRange(weaponData.range)}
                </Typography>
                    </div>
                  </div>
                </div>
              );
                  })()}

                {/* Hull Weapons */}
            {Object.entries(groupedHullWeapons).map(([weaponName, count], weaponIndex) => {
              // Find the first weapon with this name to get its index
              const weaponRef = hullWeapons.find(ref => {
                const refWeaponName = currentShipDef.hull?.options?.[ref.optionIndex]?.name;
                return refWeaponName === weaponName;
              });
              const weaponData = weaponRef ? getWeaponDataByIndex(weaponRef, currentShipDef, 'hull', currentShip) : null;
              
              if (!weaponData) return null;

          return (
                <div key={weaponName} className="play-view-card__weapons-row">
                  <div className="play-view-card__weapons-row-grid">
                    <div className="play-view-card__weapons-row-name">
                  <HullIcon size={16} />
                      <Typography variant="body1" className="play-view-card__weapons-row-title">
                        {count > 1 ? `${weaponName}` : weaponName}
                  </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {weaponData.targets}
                </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {formatAttacks(weaponData.attacks)}
                </Typography>
                    </div>
                    <div>
                      <Typography variant="body1" className="play-view-card__weapons-row-stat">
                        {formatRange(weaponData.range)}
                </Typography>
                    </div>
                  </div>
                </div>
          );
        })}

                        {/* Refit Slot Weapons */}
            {(() => {
              const refitWeapons = getRefitSlotWeapons(currentShip);
              return refitWeapons.map((weapon, index) => {
                const weaponData = getWeaponDataByIndex(weapon, currentShipDef, weapon.originalSlot || 'hull', currentShip);
                
                return (
                  <div key={`refit-${index}`} className={`play-view-card__weapons-row play-view-card__weapons-row--refit ${index === refitWeapons.length - 1 ? 'play-view-card__weapons-row--last' : ''}`}>
                    <div className="play-view-card__weapons-row-grid">
                      <div className="play-view-card__weapons-row-name">
                        {weapon.originalSlot === 'turret' ? <HullIcon size={16} /> : (faction === 'Merchants' && !currentShipDef.squadron ? <RearIcon size={16} /> : <ProwIcon size={16} />)}
                        <Typography variant="body1" className="play-view-card__weapons-row-title">
                          {weapon.name}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body1" className="play-view-card__weapons-row-stat">
                          {weaponData.targets}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body1" className="play-view-card__weapons-row-stat">
                          {formatAttacks(weaponData.attacks)}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body1" className="play-view-card__weapons-row-stat">
                          {formatRange(weaponData.range)}
                        </Typography>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}

        {/* Fighter Bays Footnote */}
        {hasFighterBays && (
          <div className="play-view-card__footnote">
            <Typography variant="caption" className="play-view-card__footnote-text">
              * Per fighter token
            </Typography>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PlayViewCard;