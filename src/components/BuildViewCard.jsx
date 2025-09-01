import React from 'react';
import {
  Card, Box, Grid, IconButton, Button, Stack, Chip, Tooltip as MuiTooltip, Alert, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { getStatDisplayName, formatStatValue, calculateEffectiveHullSlots, shipCost } from '../utils/gameUtils';
import { hasRefit, getRefitName, getRefitNotes } from '../utils/refitDisplayUtils';
import { getWeaponDataByIndex } from '../utils/refits/weaponData';
import { ProwIcon, HullIcon, RearIcon, BeginsWithIcon } from './SVGComponents';
import BeginsWithSection from './shared/BeginsWithSection';

// Helper functions for weapon display
const formatAttacks = (attacksObj) => {
  if (!attacksObj) return '';
  if (typeof attacksObj === 'string') return attacksObj;
  if (typeof attacksObj === 'object' && attacksObj.dice) {
    return attacksObj.star ? `${attacksObj.dice}*` : attacksObj.dice;
  }
  return attacksObj.toString();
};

const formatRange = (range) => {
  if (!range) return '';
  return `${range}"`;
};

// Format condensed weapon stats for mobile display
const formatCondensedStats = (weaponData) => {
  const arc = weaponData?.targets || weaponData?.arc;
  const attacks = formatAttacks(weaponData?.attacks);
  const range = formatRange(weaponData?.range);
  
  const parts = [];
  if (arc && arc !== 'undefined') parts.push(arc);
  if (attacks) parts.push(`Att ${attacks}`);
  if (range) parts.push(range);
  
  return parts.join(' · ');
};

// Helper function to get weapon icon based on location
const getWeaponIcon = (location, size = 14) => {
  switch (location) {
    case 'prow':
      return <ProwIcon size={size} />;
    case 'hull':
      return <HullIcon size={size} />;
    case 'rear':
      return <RearIcon size={size} />;
    case 'begins':
    case 'beginsWith':
      return <BeginsWithIcon size={size} />;
    default:
      return <ProwIcon size={size} />;
  }
};

// Swipeable Weapon Row Component
const SwipeableWeaponRow = ({ 
  weaponName, 
  weaponData, 
  currentCount, 
  maxCount,
  isMaxed,
  onCountChange,
  onTap,
  onPreciseEdit,
  sectionType,
  weaponLocation = 'prow', // 'prow', 'hull', 'rear'
  isPlayMode = false,
  shipNumber = null // For squadrons: 1, 2, 3, etc.
}) => {
  const [startX, setStartX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  
  // Detect if we have touch support
  React.useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    console.log('🔥 DEVICE INFO:', { hasTouch, maxTouchPoints: navigator.maxTouchPoints, userAgent: navigator.userAgent.substring(0, 50) });
  }, []);

  const handleTouchStart = (e) => {
    console.log('🔥 TOUCH START:', weaponName, sectionType);
    e.preventDefault(); // Prevent default touch behavior
    
    if (sectionType === 'single') {
      // Prow weapons - just call onTap
      onTap && onTap();
      return;
    }
    
    // Hull weapons - prepare for swipe
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setDragX(0); // Reset visual position
  };

  const handleTouchMove = (e) => {
    if (!isDragging || sectionType === 'single') return;
    e.preventDefault(); // Prevent scrolling while swiping
    
    // Update visual drag position for immediate feedback
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const maxDrag = 100; // Limit how far it can slide
    const clampedDeltaX = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    setDragX(clampedDeltaX);
    
    console.log('🔥 TOUCH MOVE:', weaponName, 'deltaX:', deltaX, 'clampedDeltaX:', clampedDeltaX);
  };

  const handleTouchEnd = (e) => {
    console.log('🔥 TOUCH END:', weaponName, sectionType, 'isDragging:', isDragging);
    e.preventDefault(); // Prevent default touch behavior
    
    if (sectionType === 'single' || !isDragging) {
      setIsDragging(false);
      setDragX(0);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const threshold = 50;

    console.log('🔥 SWIPE CALCULATION:', { deltaX, threshold, startX, endX: touch.clientX });

    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX < 0 ? 'add' : 'remove';
      const newCount = direction === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      console.log('🔥 SWIPE DETECTED:', direction, 'newCount:', newCount);
      onCountChange && onCountChange(newCount);
    } else {
      console.log('🔥 SWIPE TOO SHORT:', Math.abs(deltaX), 'needed:', threshold);
    }

    setIsDragging(false);
    setDragX(0); // Reset visual position
  };

  const handleMouseDown = (e) => {
    console.log('🔥 MOUSE DOWN:', weaponName, sectionType);
    if (sectionType === 'single') {
      onTap && onTap();
      return;
    }
    
    // For hull weapons, start mouse drag
    e.preventDefault();
    setStartX(e.clientX);
    setIsDragging(true);
    console.log('🔥 MOUSE DRAG START:', e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Update visual drag position
    const deltaX = e.clientX - startX;
    const maxDrag = 100; // Limit how far it can slide
    const clampedDeltaX = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
    setDragX(clampedDeltaX);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    console.log('🔥 MOUSE UP:', weaponName, 'isDragging:', isDragging);
    
    const deltaX = e.clientX - startX;
    const threshold = 50;
    
    console.log('🔥 MOUSE SWIPE CALCULATION:', { deltaX, threshold, startX, endX: e.clientX });
    
    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX < 0 ? 'add' : 'remove';
      const newCount = direction === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      console.log('🔥 MOUSE SWIPE DETECTED:', direction, 'newCount:', newCount);
      onCountChange && onCountChange(newCount);
    } else {
      console.log('🔥 MOUSE SWIPE TOO SHORT:', Math.abs(deltaX), 'needed:', threshold);
    }
    
    setIsDragging(false);
    setDragX(0); // Reset visual position
  };

  return (
    <div 
      className={`weapon-row ${currentCount > 0 ? 'weapon-row--selected' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: 'pan-x' }}
    >
      {/* Swipe Background for Hull Weapons */}
      {sectionType === 'multi' && (
        <div className="swipe-background">
          <div className="swipe-background__left">
            <span className="swipe-background__text">−1</span>
          </div>
          <div className="swipe-background__right">
            <span className="swipe-background__text">+1</span>
          </div>
        </div>
      )}
      
      <div 
        className="weapon-row__content"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease-out'
        }}
      >
        <div className="weapon-row__name">
          {isPlayMode && (
            <>
              {shipNumber && <span className="weapon-row__ship-number">{shipNumber}</span>}
              {getWeaponIcon(weaponLocation, 14)}
              {' '}
            </>
          )}
          {weaponName}
          {(!isPlayMode || !shipNumber) && currentCount > 1 && (
            <span className="weapon-row__count">x{currentCount}</span>
          )}
        </div>
        <div className="weapon-row__target">
          {weaponData?.targets || weaponData?.arc || 'Fr/Sd'}
        </div>
        <div className="weapon-row__attacks">
          {formatAttacks(weaponData?.attacks)}
        </div>
        <div className="weapon-row__range">
          {formatRange(weaponData?.range)}
        </div>
      </div>
    </div>
  );
};

// Legacy calculateModifiedStats removed - using canonical refit system

const BuildViewCard = ({ 
  // Single ship props
  ship, 
  // Squadron props
  squadron,
  // Common props
  shipDef, 
  faction,
  onRemoveShip, 
  onRemoveGroup, 
  onDuplicateGroup,
  onPickProw,
  onPickHull,
  onAddHull,
  onRemoveHull,
  // Weapon selection handlers (for new table-based layout)
  onSelectWeapon,
  onAddWeapon,
  onRemoveWeapon,
  children, // For weapon selection UI that comes from the parent (legacy support)
  // View mode
  isPlayMode = false
}) => {
  // Determine if this is a squadron or single ship based on shipDef.squadron
  const isSquadron = shipDef?.squadron === true;
  const currentShip = isSquadron ? (squadron ? squadron[0] : ship) : ship;
  const currentShipDef = shipDef;

  if (!currentShip || !currentShipDef) return null;
  if (isSquadron && squadron && squadron.length === 0) return null;

  // Use canonical refit system - ship.statline should already contain modified stats
  const modifiedStats = currentShip.statline || currentShipDef.statline || {};
  const baseStats = currentShipDef.statline || {};
  
  // Function to check if a stat has been modified (comparing against base ship definition)
  const isStatModified = (statName) => {
    return currentShip.appliedCanonicalRefit && baseStats[statName] !== modifiedStats[statName];
  };

  // Filter stats based on ship type and return in correct order
  const getFilteredStats = () => {
    const statOrder = ['Hull', 'Speed', 'Armour', 'Shields', 'Flak'];
    return statOrder
      .filter(statName => {
        if (modifiedStats[statName] === undefined) return false;
        if (isSquadron) {
          return !['ArmouredProws', 'hull_weapons'].includes(statName);
        } else {
          return statName !== 'hull_weapons';
        }
      })
      .map(statName => [statName, modifiedStats[statName]]);
  };

  // Get refit information
  const getRefitInfo = () => {
    if (isSquadron) {
      const squadronRefit = currentShip.squadronRefit || currentShip.appliedCanonicalRefit;
      if (squadronRefit) {
        return {
          hasRefit: true,
          name: squadronRefit.name || (squadronRefit.selectedOption ? squadronRefit.selectedOption.name : squadronRefit.name),
          notes: squadronRefit.notes || []
        };
      }
      return { hasRefit: false };
    } else {
      return {
        hasRefit: hasRefit(currentShip),
        name: getRefitName(currentShip),
        notes: getRefitNotes(currentShip) || []
      };
    }
  };

  const refitInfo = getRefitInfo();

  // Calculate cost and display
  const getCostAndStatline = () => {
    if (isSquadron) {
      // Squadron logic
      const isFreeSquadron = currentShip.isFree;
      const squadronCost = isFreeSquadron ? 0 : shipCost(currentShipDef) * squadron.length;
      const costDisplay = squadronCost === 0 ? 'Free' : `${squadronCost}pts`;
      const perShipCost = shipCost(currentShipDef);
      
      return { cost: squadronCost, costDisplay, perShipCost };
    } else {
      // Single ship logic
      const cost = shipCost(currentShipDef);
      return { cost, costDisplay: `${cost}pts` };
    }
  };

  const { cost, costDisplay, perShipCost } = getCostAndStatline();

  return (
    <Card className="build-view-card">
      {/* Header Section */}
      <div className="ship-card__header">
        <div className="ship-card__header-content">
          <div className="ship-card__header-left">
            <div className="ship-card__header-faction">
              {faction.toUpperCase()}
            </div>
            <div className="ship-card__header-name">
              {currentShip.className}
            </div>
            <div className="ship-card__header-size">
              {currentShipDef.size}
            </div>
          </div>
          <div className="ship-card__header-right">
            {isPlayMode ? (
              // In Play mode, show cost where the delete button would be
              <>
                <div className="ship-card__header-cost">
                  {costDisplay}
                  {isSquadron && perShipCost && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {perShipCost} pt per ship
                    </div>
                  )}
                </div>
              </>
            ) : (
              // In Build mode, show placeholder cost area but hide it
              <>
                <div className="ship-card__header-cost" style={{ display: 'none' }}>
                  {/* Hidden in build mode */}
                </div>
                {isSquadron && (
                  <div className="ship-card__header-count" style={{ display: 'none' }}>
                    {/* Hidden in build mode */}
                  </div>
                )}
              </>
            )}
            
            {/* Actions and Delete Button - hide in Play mode */}
            {!isPlayMode && (
              <Stack direction="row" spacing={1} alignItems="center" className="build-view-card__header-actions">
                {currentShip.isFree && (
                <Chip size="small" label="Free" color="success" />
              )}
                {isSquadron ? (
                  // Squadron actions (duplicate only)
                  <>
                    {!currentShip.isFree && (
                      <MuiTooltip title="Duplicate Squadron" arrow>
                        <IconButton 
                          color="primary" 
                          onClick={() => onDuplicateGroup(currentShip.groupId)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </MuiTooltip>
                    )}
                  </>
                ) : (
                  // Single ship actions (remove group only, delete moved to header corner)
                  <>
                    {currentShip.groupId && (
              <Button 
                size="small" 
                variant="outlined"
                        onClick={() => onRemoveGroup(currentShip.groupId)}
              >
                Remove Group
              </Button>
            )}
                  </>
                )}
                
                {/* Delete Button */}
                <MuiTooltip title={isSquadron ? "Remove Squadron" : "Remove Ship"} arrow>
            <IconButton 
                    className="build-view-card__header-delete-button"
                    onClick={isSquadron ? () => onRemoveGroup(currentShip.groupId) : () => onRemoveShip(currentShip.id)}
            >
              <DeleteIcon />
            </IconButton>
                </MuiTooltip>
          </Stack>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section - Always Visible */}
      <div className="build-view-card__stats-section">
        <div className="build-view-card__stats-labels">
          <div className="build-view-card__stats-grid">
            {getFilteredStats().map(([statName, value]) => (
              <div key={statName} className="build-view-card__stats-item">
                <div
                  className={`build-view-card__stats-label ${isStatModified(statName) ? 'build-view-card__stats-label--modified' : ''}`}
                >
                  {getStatDisplayName(statName)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="build-view-card__stats-values">
          <div className="build-view-card__stats-grid">
            {getFilteredStats().map(([statName, value]) => (
              <div key={`${statName}-value`} className="build-view-card__stats-item">
                <div
                  className={`build-view-card__stats-value ${isStatModified(statName) ? 'build-view-card__stats-value--modified' : ''}`}
                >
                  {formatStatValue(statName, value)}
                  {isStatModified(statName) && (
                    <span
                      className="build-view-card__stats-original"
                    >
                      ({formatStatValue(statName, baseStats[statName])})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Begins With Section - hide in Play mode */}
      {!isPlayMode && ((isSquadron && children) ? (
        // For squadrons, only render if there are beginsWith weapons
        ((currentShip.beginsWith && currentShip.beginsWith.length > 0) || (currentShipDef.beginsWith && currentShipDef.beginsWith.length > 0)) && (
          <div className="build-view-card__begins-with">
            {children}
          </div>
        )
      ) : (
        // For capital ships, render BeginsWithSection directly if they have beginsWith weapons
        ((currentShip.beginsWith && currentShip.beginsWith.length > 0) || (currentShipDef.beginsWith && currentShipDef.beginsWith.length > 0)) && (
          <div className="build-view-card__begins-with">
            <BeginsWithSection 
              beginsWith={currentShip.beginsWith || currentShipDef.beginsWith}
              squadronRefit={currentShip.squadronRefit}
              getWeaponData={getWeaponDataByIndex}
              shipDef={currentShipDef}
              isPlayMode={isPlayMode}
            />
          </div>
        )
      ))}

      {/* Mobile-First Weapon Selection Section */}
      <div className="build-view-card__weapons">
          {/* Prow Section */}
          {currentShipDef.prow && currentShipDef.prow.select > 0 && (() => {
            if (isSquadron) {
              // Squadron multi-select logic (like hull weapons)
              const totalSelected = (currentShip.loadout?.prow || []).length;
              const maxWeapons = 3; // Squadrons can select up to 3 weapons
              const remaining = maxWeapons - totalSelected;
              
              return (
                <div className="weapon-section">
                  <div className="weapon-section__header weapon-section__header--sticky">
                    {!isPlayMode && (
                      <div className="weapon-section__title">
                        <ProwIcon size={16} />
                        <span>Prow Weapons <span className="weapon-section__title-counter">(Select {totalSelected}/{maxWeapons})</span></span>
                      </div>
                    )}
                    {!isPlayMode && (
                      <div className="weapon-section__table-header">
                        <div className="weapon-section__helper">Swipe to adjust.</div>
                        <div className="weapon-section__column-label">Target</div>
                        <div className="weapon-section__column-label">Attacks</div>
                        <div className="weapon-section__column-label">Range</div>
                      </div>
                    )}

                  </div>

                  <div className="weapon-section__rows">
                    {(() => {
                      if (isPlayMode) {
                        // In Play mode for squadrons, collect all selected weapons and render with proper ship numbering
                        const allSelectedWeapons = [];
                        const beginsWithWeapons = currentShip.beginsWith || currentShipDef.beginsWith || [];
                        let shipCounter = 1;
                        
                        // Collect all selected weapon instances first
                        const selectedWeaponInstances = [];
                        currentShipDef.prow.options.forEach((option, optionIndex) => {
                          const selectedCount = (currentShip.loadout?.prow || []).filter(p => {
                            if (typeof p === 'string') {
                              return p === option.name;
                            }
                            return p.optionIndex === optionIndex;
                          }).length;
                          
                          const weaponData = getWeaponDataByIndex({ optionIndex }, currentShipDef, 'prow', currentShip);
                          
                          // Add each selected weapon instance
                          for (let i = 0; i < selectedCount; i++) {
                            selectedWeaponInstances.push({
                              option,
                              optionIndex,
                              weaponData,
                              instanceIndex: i
                            });
                          }
                        });
                        
                        // Now render each ship with its weapon + begins-with weapons
                        selectedWeaponInstances.forEach((weaponInstance, instanceIndex) => {
                          // Main selected weapon for this ship
                          allSelectedWeapons.push(
                            <SwipeableWeaponRow
                              key={`ship-${shipCounter}-main`}
                              weaponName={weaponInstance.option.name}
                              weaponData={weaponInstance.weaponData}
                              currentCount={1}
                              maxCount={1}
                              isMaxed={true}
                              sectionType="single"
                              weaponLocation="prow"
                              isPlayMode={isPlayMode}
                              shipNumber={shipCounter}
                              onCountChange={() => {}}
                              onTap={() => {}}
                              onPreciseEdit={() => {}}
                            />
                          );
                          
                          // Add begins-with weapons for this ship (indented, no ship number)
                          beginsWithWeapons.forEach((beginsWeapon, beginsIndex) => {
                            const beginsWeaponData = getWeaponDataByIndex(beginsWeapon, currentShipDef, 'prow', currentShip);
                            allSelectedWeapons.push(
                              <SwipeableWeaponRow
                                key={`ship-${shipCounter}-begins-${beginsIndex}`}
                                weaponName={beginsWeapon.name || 'Unknown'}
                                weaponData={beginsWeaponData}
                                currentCount={1}
                                maxCount={1}
                                isMaxed={true}
                                sectionType="single"
                                weaponLocation="begins"
                                isPlayMode={isPlayMode}
                                shipNumber={null} // No number for begins-with weapons
                                onCountChange={() => {}}
                                onTap={() => {}}
                                onPreciseEdit={() => {}}
                              />
                            );
                          });
                          
                          // Add separator between ships (but not after the last ship)
                          if (instanceIndex < selectedWeaponInstances.length - 1) {
                            allSelectedWeapons.push(
                              <div key={`ship-separator-${shipCounter}`} className="squadron-ship-separator"></div>
                            );
                          }
                          
                          shipCounter++;
                        });
                        
                        return allSelectedWeapons;
                      } else {
                        // Build mode - original logic
                        return currentShipDef.prow.options.map((option, optionIndex) => {
                          const selectedCount = (currentShip.loadout?.prow || []).filter(p => {
                            if (typeof p === 'string') {
                              return p === option.name;
                            }
                            return p.optionIndex === optionIndex;
                          }).length;
                          
                          const weaponData = getWeaponDataByIndex({ optionIndex }, currentShipDef, 'prow', currentShip);
                        
                          return (
                            <SwipeableWeaponRow
                              key={optionIndex}
                              weaponName={option.name}
                              weaponData={weaponData}
                              currentCount={selectedCount}
                              maxCount={maxWeapons}
                              isMaxed={remaining === 0 && selectedCount > 0}
                              sectionType="multi"
                              weaponLocation="prow"
                              isPlayMode={isPlayMode}
                              onCountChange={(newCount) => {
                                const delta = newCount - selectedCount;
                                if (delta > 0) {
                                  // Add weapons - pass weapon name, not index
                                  for (let i = 0; i < delta; i++) {
                                    onAddWeapon && onAddWeapon('prow', option.name);
                                  }
                                } else if (delta < 0) {
                                  // Remove weapons - pass weapon name, not index
                                  for (let i = 0; i < Math.abs(delta); i++) {
                                    onRemoveWeapon && onRemoveWeapon('prow', option.name);
                                  }
                                }
                              }}
                              onPreciseEdit={() => {
                                // Open precise edit modal/sheet
                              }}
                            />
                          );
                        });
                      }
                    })()}
                  </div>

                  {/* Info Alert for Squadron Prow - moved below weapon rows */}
                  {remaining > 0 && (
                    <div className="weapon-section__alert">
                      <Alert severity="info">Choose {remaining} more prow weapon(s).</Alert>
                    </div>
                  )}
                </div>
              );
            } else {
              // Capital ship single-select logic (existing)
              const isSelected = currentShip.loadout?.prow?.optionIndex !== undefined;
              
              return (
                <div className="weapon-section">
                  <div className="weapon-section__header weapon-section__header--sticky">
                    {!isPlayMode && (
                      <div className="weapon-section__title">
                        <ProwIcon size={16} />
                        <span>Prow Weapons <span className="weapon-section__title-counter">(Select 1)</span></span>
                      </div>
                    )}
                    {!isPlayMode && (
                      <div className="weapon-section__table-header">
                        <div className="weapon-section__helper">Tap a row to select.</div>
                        <div className="weapon-section__column-label">Target</div>
                        <div className="weapon-section__column-label">Attacks</div>
                        <div className="weapon-section__column-label">Range</div>
                      </div>
                    )}

                  </div>

                  <div className="weapon-section__rows">
                    {currentShipDef.prow.options.map((option, optionIndex) => {
                      const isOptionSelected = currentShip.loadout?.prow?.optionIndex === optionIndex;
                      
                      // In play mode, only show selected weapons
                      if (isPlayMode && !isOptionSelected) {
                        return null;
                      }
                      
                      const weaponData = getWeaponDataByIndex({ optionIndex }, currentShipDef, 'prow', currentShip);
                      
                      return (
                        <SwipeableWeaponRow
                          key={optionIndex}
                          weaponName={option.name}
                          weaponData={weaponData}
                          currentCount={isOptionSelected ? 1 : 0}
                          maxCount={1}
                          isMaxed={isOptionSelected}
                          sectionType="single"
                          weaponLocation="prow"
                          isPlayMode={isPlayMode}
                          onCountChange={(newCount) => {
                            // Single-select doesn't use swipe, only tap
                          }}
                          onTap={() => {
                            // Tap to select for single-select weapons
                            if (isOptionSelected) {
                              // If already selected, clear selection
                              onSelectWeapon && onSelectWeapon('prow', null);
                            } else {
                              // Select this weapon with optionIndex format
                              onSelectWeapon && onSelectWeapon('prow', { optionIndex, name: option.name });
                            }
                          }}
                          onPreciseEdit={() => {
                            // For single-select, precise edit just toggles selection
                            if (isOptionSelected) {
                              // Clear selection logic would go here
                            } else {
                              onSelectWeapon && onSelectWeapon('prow', optionIndex);
                            }
                          }}
                        />
                      );
                    }).filter(Boolean)}
                  </div>

                  {/* Info Alert for Capital Ship Prow - moved below weapon rows */}
                  {!isSelected && (
                    <div className="weapon-section__alert">
                      <Alert severity="info">Pick {currentShipDef.prow.select} prow option.</Alert>
                    </div>
                  )}
                </div>
              );
            }
          })()}

          {/* Hull Section */}
          {currentShipDef.hull && currentShipDef.hull.select > 0 && (() => {
            // Calculate total including beginsWith weapons
            const totalSelected = (currentShip.loadout?.hull || []).length;
            const effectiveSlots = calculateEffectiveHullSlots(currentShip, currentShipDef);
            const remaining = effectiveSlots - totalSelected;
            const isSingleSelect = effectiveSlots === 1;
            
            return (
              <div className="weapon-section">
                <div className="weapon-section__header weapon-section__header--sticky">
                  {!isPlayMode && (
                    <div className="weapon-section__title">
                      <HullIcon size={16} />
                      <span>Hull Weapons <span className="weapon-section__title-counter">{isSingleSelect ? `(Select 1)` : `(Select ${totalSelected}/${effectiveSlots})`}</span></span>
                    </div>
                  )}
                  {!isPlayMode && (
                    <div className="weapon-section__table-header">
                      <div className="weapon-section__helper">{isSingleSelect ? 'Tap a row to select.' : 'Swipe to adjust.'}</div>
                      <div className="weapon-section__column-label">Target</div>
                      <div className="weapon-section__column-label">Attacks</div>
                      <div className="weapon-section__column-label">Range</div>
                    </div>
                  )}
                </div>

                <div className="weapon-section__rows">
                  {currentShipDef.hull.options.map((option, optionIndex) => {
                    if (isSingleSelect) {
                      // Single-select logic (like prow weapons)
                      const isSelected = (currentShip.loadout?.hull || []).some(h => {
                        if (typeof h === 'string') {
                          return h === option.name;
                        }
                        return h.optionIndex === optionIndex;
                      });
                      
                      // In play mode, only show selected weapons
                      if (isPlayMode && !isSelected) {
                        return null;
                      }
                      
                      const weaponData = getWeaponDataByIndex({ optionIndex }, currentShipDef, 'hull', currentShip);
                      
                      return (
                        <SwipeableWeaponRow
                          key={optionIndex}
                          weaponName={option.name}
                          weaponData={weaponData}
                          currentCount={isSelected ? 1 : 0}
                          maxCount={1}
                          isMaxed={isSelected}
                          sectionType="single"
                          weaponLocation="hull"
                          isPlayMode={isPlayMode}
                          onCountChange={(newCount) => {
                            // Single-select doesn't use swipe, only tap
                          }}
                          onTap={() => {
                            // Tap to select for single-select weapons
                            if (isSelected) {
                              // If already selected, clear selection
                              onSelectWeapon && onSelectWeapon('hull', null);
                            } else {
                              // Select this weapon with optionIndex format
                              onSelectWeapon && onSelectWeapon('hull', { optionIndex, name: option.name });
                            }
                          }}
                          onPreciseEdit={() => {
                            // For single-select, precise edit just toggles selection
                            if (isSelected) {
                              onSelectWeapon && onSelectWeapon('hull', null);
                            } else {
                              onSelectWeapon && onSelectWeapon('hull', { optionIndex, name: option.name });
                            }
                          }}
                        />
                      );
                    } else {
                      // Multi-select logic (existing)
                      const selectedCount = (currentShip.loadout?.hull || []).filter(h => {
                        if (typeof h === 'string') {
                          return h === option.name;
                        }
                        return h.optionIndex === optionIndex;
                      }).length;
                      
                      // In play mode, only show selected weapons
                      if (isPlayMode && selectedCount === 0) {
                        return null;
                      }
                      
                      const weaponData = getWeaponDataByIndex({ optionIndex }, currentShipDef, 'hull', currentShip);
                      
                      return (
                        <SwipeableWeaponRow
                          key={optionIndex}
                          weaponName={option.name}
                          weaponData={weaponData}
                          currentCount={selectedCount}
                          maxCount={currentShipDef.hull.select}
                          isMaxed={remaining === 0 && selectedCount > 0}
                          sectionType="multi"
                          weaponLocation="hull"
                          isPlayMode={isPlayMode}
                          onCountChange={(newCount) => {
                            const delta = newCount - selectedCount;
                            if (delta > 0) {
                              // Add weapons - pass weapon name, not index
                              for (let i = 0; i < delta; i++) {
                                onAddWeapon && onAddWeapon('hull', option.name);
                              }
                            } else if (delta < 0) {
                              // Remove weapons - pass weapon name, not index
                              for (let i = 0; i < Math.abs(delta); i++) {
                                onRemoveWeapon && onRemoveWeapon('hull', option.name);
                              }
                            }
                          }}
                          onPreciseEdit={() => {
                            // Open precise edit modal/sheet
                          }}
                        />
                      );
                    }
                  }).filter(Boolean)}
                </div>

                {/* Info Alert for Hull - moved below weapon rows */}
                {isSingleSelect ? (
                  !totalSelected && (
                    <div className="weapon-section__alert">
                      <Alert severity="info">Pick {effectiveSlots} hull option.</Alert>
                    </div>
                  )
                ) : (
                  remaining > 0 && (
                    <div className="weapon-section__alert">
                      <Alert severity="info">Choose {remaining} more hull weapon(s).</Alert>
                    </div>
                  )
                )}
              </div>
            );
          })()}
      </div>

      {/* Refit and other rule notations */}
      {(refitInfo.hasRefit || isSquadron) && (
        <div className="build-view-card__footer">
          {refitInfo.hasRefit && (
            <Typography variant="caption" className="build-view-card__footer-refit-title">
              {isSquadron ? 'Squadron Refit' : 'Refit'}: {refitInfo.name}
            </Typography>
          )}
          {refitInfo.notes && refitInfo.notes.length > 0 && (
            <div className="build-view-card__footer-notes">
              {refitInfo.notes.map((note, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  className="build-view-card__footer-note"
                >
                  • {note}
                </Typography>
              ))}
            </div>
          )}
          {isSquadron && (
            <Typography variant="caption" className="build-view-card__footer-note">
              • Each weapon = 1 ship
          </Typography>
          )}
        </div>
      )}
    </Card>
  );
};

export default BuildViewCard;