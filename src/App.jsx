import React, { useMemo, useState, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box,
  Stack, Button, IconButton, Avatar, ClickAwayListener, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, useMediaQuery,
  Menu, MenuItem
} from "@mui/material";
import { Delete as DeleteIcon, PlayArrow as PlayIcon, Save as SaveIcon, Folder as FolderIcon, Login as LoginIcon, Logout as LogoutIcon, Build as BuildIcon, Menu as MenuIcon, Palette as PaletteIcon, Close as CloseIcon } from "@mui/icons-material";
import './styles/main.scss';
import './styles/themes.scss';

// Components
import { Logo } from './components/SVGComponents';
import CreateNewFleetView from './components/CreateNewFleetView';
import BuildView from './components/BuildView';
import PlayView from './components/PlayView';
import FleetsView from './components/FleetsView';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeSettings from './components/ThemeSettings';

// Utils
import {
  shipCost, uid, armingKey, getPointLimit, getShipCost, hasUnplannedConstruction,
  randomizeScrapBotWeapons, cleanRosterForSave, arraysEqual
} from './utils/gameUtils';

// Import canonical refit system
// Migration no longer needed - factions.json uses canonical format directly
import { applyCanonicalRefitToShip } from './utils/refits/shipRefits.js';

// Firebase imports
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, setDoc, getDoc } from "firebase/firestore";

function AppContent(){
  const { muiTheme, currentTheme } = useTheme();

  // State declarations first
  const [tab,setTab] = useState(0);
  const [faction,setFaction] = useState("Loyalists");
  const [points,setPoints] = useState(30);
  const [roster,setRoster] = useState([]);
  const [fleetName,setFleetName] = useState("");
  const [savedFleets,setSavedFleets] = useState([]);
  const [hasLoadedSavedFleets, setHasLoadedSavedFleets] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved'
  const [FACTIONS, setFACTIONS] = useState(null);
  const [REFITS, setREFITS] = useState(null);
  const [factionsLoading, setFactionsLoading] = useState(true);
  const [useRefits, setUseRefits] = useState(false);
  const [useJuggernauts, setUseJuggernauts] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Apply theme class to body element
  useEffect(() => {
    // Remove any existing theme classes
    document.body.classList.remove('theme-space', 'theme-dark', 'theme-default', 'theme-vintage');
    
    // Add current theme class
    if (currentTheme) {
      document.body.classList.add(`theme-${currentTheme}`);
      console.log('🎨 Applied theme class:', `theme-${currentTheme}`);
    }
    
    // Cleanup function to remove theme class when component unmounts
    return () => {
      document.body.classList.remove('theme-space', 'theme-dark', 'theme-default', 'theme-vintage');
    };
  }, [currentTheme]);

  // Apply play-view class to body when in play mode
  useEffect(() => {
    if (isPlayMode) {
      document.body.classList.add('play-view');
    } else {
      document.body.classList.remove('play-view');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('play-view');
    };
  }, [isPlayMode]);
  
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const ships = FACTIONS ? FACTIONS[faction]?.ships || {} : {};
  
  // Calculate refit limits and usage
  const maxRefits = Math.floor(points / 15);
  const usedRefits = roster.filter(ship => ship.refit).length;
  const usedSquadronRefits = new Set(roster.filter(ship => ship.squadronRefit).map(ship => ship.groupId)).size;
  const totalUsedRefits = usedRefits + usedSquadronRefits;
  const canAddRefit = totalUsedRefits < maxRefits;

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        loadUserFleets(user.uid);
        loadUserPreferences(user.uid);
      } else {
        loadLocalStorageData();
        loadLocalPreferences();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load factions and refits data
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Starting data load...');
      try {
        console.log('🔄 Fetching data files...');
        const [factionsResponse, refitsResponse] = await Promise.all([
          fetch(`/void-admiral/data/factions.json?v=${Date.now()}`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch(`/void-admiral/refits.json?v=${Date.now()}`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
          })
        ]);
        
        console.log('🔄 Fetch responses:', { 
          factionsOk: factionsResponse.ok, 
          refitsOk: refitsResponse.ok 
        });

        if (!factionsResponse.ok) {
          throw new Error(`Failed to load factions: ${factionsResponse.status}`);
        }
        if (!refitsResponse.ok) {
          throw new Error(`Failed to load refits: ${refitsResponse.status}`);
        }

        const [factionsData, refitsData] = await Promise.all([
          factionsResponse.json(),
          refitsResponse.json()
        ]);
        
        console.log('📦 Loaded factions data');
        console.log('🔧 Loaded refits data:', refitsData.length, 'refits');
        console.log('🔧 First few refits:', refitsData.slice(0, 3).map(r => ({ id: r.id, name: r.name, scope: r.scope })));
        
        setFACTIONS(factionsData);
        setREFITS(refitsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setFactionsLoading(false);
      }
    };

    loadData();
  }, []);

  const loadLocalStorageData = () => {
    const saved = localStorage.getItem("va_factions_full");
    if(saved){
      try{
        const obj = JSON.parse(saved);
        setFaction(obj.faction||"Loyalists"); 
        setPoints(obj.points||30); 
        setRoster(obj.roster||[]); 
        setFleetName(obj.fleetName||"");
      }catch{}
    }
    const savedFleets = localStorage.getItem("va_saved_fleets");
    if(savedFleets){
      try{
        const parsed = JSON.parse(savedFleets);
        setSavedFleets(parsed);
      }catch(e){}
    }
    setHasLoadedSavedFleets(true);
  };

  // Load preferences from localStorage (for non-authenticated users)
  const loadLocalPreferences = () => {
    const savedPrefs = localStorage.getItem('va_preferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setUseRefits(prefs.useRefits || false);
        setUseJuggernauts(prefs.useJuggernauts || false);
      } catch (error) {
        console.error('Failed to load local preferences:', error);
      }
    }
  };

  // Load preferences from Firebase (for authenticated users)
  const loadUserPreferences = async (userId) => {
    try {
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        const prefs = userPrefsSnap.data();
        setUseRefits(prefs.useRefits || false);
        setUseJuggernauts(prefs.useJuggernauts || false);
        return;
      }
      
      // If no Firebase preferences found, check localStorage as fallback
      loadLocalPreferences();
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      loadLocalPreferences();
    }
  };

  // Save preferences to Firebase (for authenticated users) or localStorage
  const savePreferences = async (prefs) => {
    if (user) {
      try {
        const userPrefsRef = doc(db, 'userPreferences', user.uid);
        await setDoc(userPrefsRef, prefs, { merge: true });
      } catch (error) {
        console.error('Failed to save preferences to Firebase:', error);
        // Fallback to localStorage if Firebase fails
        localStorage.setItem('va_preferences', JSON.stringify(prefs));
      }
    } else {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('va_preferences', JSON.stringify(prefs));
    }
  };

  // Clean up existing ships that have beginsWith weapons incorrectly in hull
  // AND ensure all ships have statline data for canonical refit system
  useEffect(() => {
    if (ships && roster.length > 0) {
      setRoster(currentRoster => currentRoster.map(ship => {
        const def = ships[ship.className];
        if (!def) return ship;
        
        let needsUpdate = false;
        let updatedShip = { ...ship };
        
        // Fix beginsWith weapons
        if (def.beginsWith && def.beginsWith.length > 0) {
          const beginsWithNames = def.beginsWith.map(w => w.name);
          const hasIncorrectHullWeapons = ship.loadout.hull.some(weaponName => 
            beginsWithNames.includes(weaponName)
          );
          
          if (hasIncorrectHullWeapons) {
            const cleanedHull = ship.loadout.hull.filter(weaponName => 
              !beginsWithNames.includes(weaponName)
            );
            
            updatedShip = {
              ...updatedShip,
              loadout: {
                ...updatedShip.loadout,
                hull: cleanedHull,
                begins: beginsWithNames
              }
            };
            needsUpdate = true;
          }
        }
        
        // Ensure ship has statline for canonical refit system
        if (!ship.statline && def.statline) {
          updatedShip.statline = { ...def.statline };
          needsUpdate = true;
        }
        
        return needsUpdate ? updatedShip : ship;
      }));
    }
  }, [ships, roster.length]); // Only run when ships data or roster length changes

  useEffect(()=>{
    localStorage.setItem("va_factions_full", JSON.stringify({ faction, points, roster, fleetName }));
  },[faction, points, roster, fleetName]);
  
  useEffect(()=>{
    if (hasLoadedSavedFleets) {
      localStorage.setItem("va_saved_fleets", JSON.stringify(savedFleets));
    }
  },[savedFleets, hasLoadedSavedFleets]);

  const cap = FACTIONS ? getPointLimit(faction, points, FACTIONS) : points;
  const used = useMemo(() =>
    roster.reduce((sum, s) => {
      if (s.isFree) return sum;
      const def = ships[s.className];
      return sum + shipCost(def);
    }, 0),
    [roster, ships]
  );

  const uniqueClash = useMemo(()=>{
    const counts = new Map();
    for(const s of roster){
      const def = ships[s.className];
      if(def.squadron) continue;
      const key = armingKey(s.className, s.loadout);
      counts.set(key, (counts.get(key)||0)+1);
    }
    return [...counts.values()].some(v=>v>1);
  },[roster, ships]);

  function addShip(className){
    const def = ships[className];
    const cost = shipCost(def);
    const count = def.squadron ? 3 : 1;

    if (used + cost * count > cap) return;

    const groupId = def.squadron ? uid() : null;

    const mk = () => {
      const loadout = { prow:null, hull:[], begins:(def.beginsWith||[]).map(o=>o.name) };
      // Note: beginsWith weapons are stored in loadout.begins, not added to hull or prow
      
      if (hasUnplannedConstruction(faction, FACTIONS)) {
        const randomWeapons = randomizeScrapBotWeapons(def);
        loadout.hull = [...loadout.hull, ...randomWeapons];
        loadout.isRandomized = true;
      }
      
      // Include base statline for canonical refit system
      const statline = def.statline ? { ...def.statline } : {};
      
      return { id: uid(), className, loadout, groupId, statline };
    };

    const newShips = Array.from({length: count}, mk);
    
    // Insectoid Swarm: Add free Pincer squadron when adding Pincers
    if (faction === "Insectoids" && className === "Pincer") {
      const freeGroupId = uid();
      const mkFree = () => {
        const loadout = { prow:null, hull:[], begins:(def.beginsWith||[]).map(o=>o.name) };
        // Note: beginsWith weapons are stored in loadout.begins, not added to hull or prow
        
        if (hasUnplannedConstruction(faction, FACTIONS)) {
          const randomWeapons = randomizeScrapBotWeapons(def);
          loadout.hull = [...loadout.hull, ...randomWeapons];
          loadout.isRandomized = true;
        }
        
        // Include base statline for canonical refit system
        const statline = def.statline ? { ...def.statline } : {};
        
        return { id: uid(), className, loadout, groupId: freeGroupId, isFree: true, statline };
      };
      const freeShips = Array.from({length: 3}, mkFree);
      setRoster(r => [...r, ...newShips, ...freeShips]);
    } else {
      setRoster(r => [...r, ...newShips]);
    }
  }

  function removeShip(id){ setRoster(r=>r.filter(x=>x.id!==id)); }
  function removeGroup(groupId){ setRoster(r=>r.filter(x=>x.groupId!==groupId)); }
  function duplicateGroup(groupId){
    setRoster(r=>{
      const groupShips = r.filter(x=>x.groupId===groupId);
      if(groupShips.length === 0) return r;
      
      const firstShip = groupShips[0];
      const def = ships[firstShip.className];
      const cost = shipCost(def);
      const count = def.squadron ? 3 : 1;
      
      if (used + cost * count > cap) return r;
      
      const newGroupId = uid();
      const duplicatedShips = groupShips.map(ship => {
        const def = ships[ship.className];
        const statline = def.statline ? { ...def.statline } : {};
        
        return {
          ...ship,
          id: uid(),
          groupId: ship.isFree ? uid() : newGroupId,
          isFree: ship.isFree,
          statline
        };
      });
      
      if (faction === "Insectoids" && firstShip.className === "Pincer" && !firstShip.isFree) {
        const freeShips = r.filter(x=>x.className === "Pincer" && x.isFree);
        const matchingFreeGroup = freeShips.find(x=>x.loadout.prow?.name === firstShip.loadout.prow?.name && 
          arraysEqual(x.loadout.hull, firstShip.loadout.hull));
        
        if (matchingFreeGroup) {
          const freeGroupShips = freeShips.filter(x=>x.groupId === matchingFreeGroup.groupId);
          const newFreeGroupId = uid();
          const duplicatedFreeShips = freeGroupShips.map(ship => {
            const def = ships[ship.className];
            const statline = def.statline ? { ...def.statline } : {};
            
            return {
              ...ship,
              id: uid(),
              groupId: newFreeGroupId,
              statline
            };
          });
          return [...r, ...duplicatedShips, ...duplicatedFreeShips];
        }
      }
      
      return [...r, ...duplicatedShips];
    });
  }

  const saveFleet = async () => {
    if(!fleetName.trim() || !user) return;
    
    setSaveStatus('saving');
    
    const cleanedRoster = roster ? cleanRosterForSave(roster) : [];
    
    const fleet = {
      name: fleetName.trim(),
      faction: faction || "Loyalists",
      points: points || 30,
      roster: cleanedRoster,
      savedAt: new Date().toISOString()
    };
    
    try {
      const existingFleet = savedFleets.find(f => f.name === fleet.name);
      if (existingFleet) {
        await deleteFleetFromFirestore(existingFleet.id);
      }
      
      const docId = await saveFleetToFirestore(fleet);
      const newFleet = { ...fleet, id: docId };
      
      setSavedFleets(prev => [...prev.filter(f => f.name !== fleet.name), newFleet]);
      
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save fleet:', error);
      setSaveStatus('idle');
    }
  };

  function loadFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true);
    setTab(0);
  }

  function editFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true);
    setTab(0);
  }

  function playFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true);
    setTab(1);
  }

  function startNewFleet(){
    setFleetName('');
    setNameSubmitted(false);
    setRoster([]);
    setFaction('Loyalists');
    setPoints(30);
    setTab(0);
  }

  function deleteFleet(fleetId){
    if (user) {
      deleteFleetFromFirestore(fleetId);
    }
  }

  const handleNameSubmit = () => {
    if (fleetName.trim()) {
      setNameSubmitted(true);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      
      // Clear all localStorage data
      localStorage.removeItem('va_factions_full');
      localStorage.removeItem('va_saved_fleets');
      localStorage.removeItem('va_preferences');
      localStorage.removeItem('va_theme');
      
      // Reset all app state to defaults
      setSavedFleets([]);
      setFaction("Loyalists");
      setPoints(30);
      setRoster([]);
      setFleetName("");
      setNameSubmitted(false);
      setUseRefits(false);
      setUseJuggernauts(false);
      setTab(0);
      setSaveStatus('idle');
      setIsEditingName(false);
      
      console.log('Successfully signed out and cleared all data');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const loadUserFleets = async (userId) => {
    try {
      const q = query(
        collection(db, "fleets"),
        where("userId", "==", userId),
        orderBy("savedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fleets = [];
      querySnapshot.forEach((doc) => {
        fleets.push({ id: doc.id, ...doc.data() });
      });

      setSavedFleets(fleets);
      setHasLoadedSavedFleets(true);
      
      if (fleets.length > 0 && tab === 0) {
        setTab(2);
      }
    } catch (error) {
      console.error('Failed to load fleets:', error);
      setHasLoadedSavedFleets(true);
    }
  };

  const saveFleetToFirestore = async (fleet) => {
    try {
      const docRef = await addDoc(collection(db, "fleets"), {
        ...fleet,
        userId: user.uid
      });
      return docRef.id;
    } catch (error) {
      console.error('Failed to save to Firestore:', error);
      throw error;
    }
  };

  const deleteFleetFromFirestore = async (fleetId) => {
    try {
      await deleteDoc(doc(db, "fleets", fleetId));
      setSavedFleets(prev => prev.filter(f => f.id !== fleetId));
    } catch (error) {
      console.error('Failed to delete fleet:', error);
    }
  };

  function pickProw(id, opt){ 
    setRoster(r=>r.map(x=> x.id===id ? { ...x, loadout:{ ...x.loadout, prow: opt } } : x)); 
  }

  function addHull(id, optName, def){
    setRoster(r=>r.map(x=>{
      if(x.id!==id) return x;
      const totalEditable = (x.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
      if(totalEditable >= def.hull.select) return x;
      return { ...x, loadout:{ ...x.loadout, hull:[...x.loadout.hull, optName] } };
    }));
  }

  function removeHullByName(id, optName, def){
    setRoster(r=>r.map(x=>{
      if(x.id!==id) return x;
      if((def.beginsWith||[]).some(b=>b.name===optName)) return x;
      const hull = [...x.loadout.hull];
      const index = hull.lastIndexOf(optName);
      if(index !== -1) hull.splice(index, 1);
      return { ...x, loadout:{ ...x.loadout, hull } };
    }));
  }

  function randomizeHull(id, def) {
    setRoster(r => r.map(x => {
      if (x.id !== id) return x;

      const fixed = (x.loadout.hull || []).filter(n =>
        (def.beginsWith || []).some(b => b.name === n)
      );

      const pool = def.hull.options.map(o => o.name);
      const picks = [];
      const n = def.hull.select;

      for (let i = 0; i < n; i++) {
        picks.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      return { ...x, loadout: { ...x.loadout, hull: [...fixed, ...picks] } };
    }));
  }

  // Refit functions
  function addRefit(shipId, refit) {
    if (!canAddRefit) return;
    
    // Create capital ship refit object with notes included
    const capitalShipRefit = {
      name: refit.name,
      description: refit.description,
      effects: refit.effects,
      notes: refit.notes || [],
      selectedOption: refit.selectedOption,
      selectedEffects: refit.selectedEffects || refit.effects,
      weaponModifications: refit.weaponModifications
    };
    
    setRoster(r => r.map(x => {
      if (x.id === shipId) {
        const updatedShip = { ...x, refit: capitalShipRefit };
        
        // Auto-assign replacement weapons if the refit has replaceWith effects
        if (refit.weaponModifications) {
          refit.weaponModifications.forEach(modification => {
            if (modification.effects?.replaceWith && modification.conditions) {
              modification.conditions.forEach(condition => {
                if (condition.type === 'weaponLocation') {
                  const location = condition.value;
                  if (location === 'prow') {
                    updatedShip.loadout = {
                      ...updatedShip.loadout,
                      prow: modification.effects.replaceWith
                    };
                  }
                  // Add other weapon locations (hull, etc.) as needed
                }
              });
            }
          });
        }
        
        return updatedShip;
      }
      return x;
    }));
  }

  function removeRefit(shipId) {
    console.log('🗑️ REMOVE_REFIT: Called for shipId:', shipId);
    setRoster(r => r.map(ship => {
      if (ship.id !== shipId) return ship;
      
      console.log('🗑️ REMOVE_REFIT: Processing ship:', {
        id: ship.id,
        className: ship.className,
        hasCanonicalRefit: !!ship.appliedCanonicalRefit,
        refitName: ship.appliedCanonicalRefit?.name
      });
      
      // Use canonical refit system to properly restore stats
      if (ship.appliedCanonicalRefit) {
        // Get original ship definition for stat restoration
        const shipDef = ships[ship.className];
        const originalStatline = shipDef.statline ? { ...shipDef.statline } : {};
        
        console.log('🗑️ REMOVE_REFIT: Removing refit:', ship.appliedCanonicalRefit.name);
        
        // Remove canonical refit and restore original stats
        // Note: Weapon options will be automatically updated by the weapon system
        // when appliedCanonicalRefit is removed
        const updatedShip = {
          ...ship,
          appliedCanonicalRefit: null,
          statline: originalStatline
        };
        
        console.log('🗑️ REMOVE_REFIT: Ship updated, refit removed:', !updatedShip.appliedCanonicalRefit);
        return updatedShip;
      }
      
      console.log('🗑️ REMOVE_REFIT: No canonical refit found on ship');
      // Fallback for legacy refits (shouldn't happen anymore)
      return { ...ship, refit: null };
    }));
  }

  function addRefitToGroup(groupId, refit, selectedOption = null) {
    if (!canAddRefit) return;
    
    setRoster(r => r.map(x => {
      if (x.groupId === groupId) {
        // Get the ship definition for stat restoration baseline
        const shipDef = ships[x.className];
        if (!shipDef) {
          console.error('SQUADRON REFIT ERROR: Ship definition not found for', x.className);
          return x;
        }
        
        // Create ship with baseline stats for canonical refit application
        const shipWithBaseStats = {
          ...x,
          statline: shipDef.statline ? { ...shipDef.statline } : {}
        };
        
        // Create canonical refit format
        const canonicalRefit = {
          ...refit,
          selectedOption: selectedOption // Pass the full option object, not just the name
        };
        
        console.log('🎯 SQUADRON REFIT: Applying canonical refit:', canonicalRefit.name);
        if (selectedOption) {
          console.log('🎯 SQUADRON REFIT: With selected option:', selectedOption.name);
          console.log('🎯 SQUADRON REFIT: Option cost:', selectedOption.cost);
          console.log('🎯 SQUADRON REFIT: Option gains:', selectedOption.gains);
        } else {
          console.log('🎯 SQUADRON REFIT: No option selected, applying base refit');
        }
        console.log('🎯 SQUADRON REFIT: Ship before application:', shipWithBaseStats.statline);
        
        // Apply canonical refit to get stat changes and other modifications
        const result = applyCanonicalRefitToShip(shipWithBaseStats, canonicalRefit, 'squadron');
        
        if (result.ok) {
          console.log('✅ SQUADRON REFIT: Applied successfully, new statline:', result.ship.statline);
          console.log('✅ SQUADRON REFIT: Applied canonical refit stored as:', result.ship.appliedCanonicalRefit);
          
          // Create squadron refit metadata (for UI display)
          const squadronRefit = {
            name: refit.name,
            description: refit.description,
            effects: refit.effects,
            notes: refit.notes || [],
            selectedOption: selectedOption?.name || null,
            selectedEffects: selectedOption?.effects || refit.effects,
            weaponModifications: refit.weaponModifications
          };
          
          // Return ship with both metadata and applied canonical changes
          return {
            ...result.ship,
            squadronRefit
          };
        } else {
          console.error('❌ SQUADRON REFIT ERROR: Failed to apply:', result.error);
          return x; // Return unchanged ship if refit application failed
        }
      }
      return x;
    }));
  }

  function removeRefitFromGroup(groupId) {
    setRoster(r => r.map(ship => {
      if (ship.groupId !== groupId) return ship;
      
      // Use canonical refit system to properly restore stats
      if (ship.appliedCanonicalRefit) {
        // Get original ship definition for stat restoration
        const shipDef = ships[ship.className];
        const originalStatline = shipDef.statline ? { ...shipDef.statline } : {};
        
        // Create a clean ship without refit modifications
        const cleanedShip = {
          ...ship,
          squadronRefit: null,
          appliedCanonicalRefit: null,
          statline: originalStatline
        };
        
        // Remove any modified beginsWith weapons (restore to original ship definition)
        if (ship.beginsWith) {
          delete cleanedShip.beginsWith;
        }
        
        return cleanedShip;
      }
      
      // Fallback for legacy refits
      return { ...ship, squadronRefit: null };
    }));
  }

  // Enhanced refit toggle function that saves preferences and clears refits
  function toggleUseRefits(enabled) {
    setUseRefits(enabled);
    
    // If disabling refits, remove all existing refits from roster
    if (!enabled) {
      setRoster(r => r.map(ship => ({ ...ship, refit: null, squadronRefit: null })));
    }
    
    // Save preference
    savePreferences({ useRefits: enabled, useJuggernauts });
  }

  // Enhanced juggernauts toggle function that saves preferences
  function toggleUseJuggernauts(enabled) {
    setUseJuggernauts(enabled);
    
    // Save preference
    savePreferences({ useRefits, useJuggernauts: enabled });
  }

  // Show loading screen until both auth and factions are ready
  if (loading || factionsLoading) {
    return (
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline/>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          textAlign: 'center',
          p: 3
        }}>
          <Typography variant="h4" sx={{ mb: 2, color: 'white' }}>
            Void Admiral Fleet Builder
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {loading ? "Initializing..." : "Loading faction data..."}
          </Typography>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            border: '3px solid',
            borderColor: 'primary.main',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
        </Box>
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline/>
      <Box className="app-root" sx={{ minHeight: '100vh' }}>
        <AppBar position="sticky" color="default" enableColorOnDark>
          <Toolbar>
            <Logo height={28} className="nav-logo" />
            
            <Box sx={{ flex: 1 }} />
            
            {/* Navigation Dropdown */}
            {loading ? (
              <Typography variant="body2" color="text.secondary">Loading...</Typography>
            ) : user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 32, height: 32 }} />
                <IconButton
                  color="inherit"
                  onClick={(e) => setDropdownOpen(e.currentTarget)}
                  sx={{ padding: 1 }}
                >
                  {dropdownOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
                <Menu
                  anchorEl={dropdownOpen}
                  open={Boolean(dropdownOpen)}
                  onClose={() => setDropdownOpen(false)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      '& .MuiMenuItem-root': {
                        py: 1,
                      },
                    },
                  }}
                >
                  {/* User Info */}
                  <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  
                  {/* Navigation Items */}
                  <MenuItem
                    onClick={() => {
                      setTab(1);
                      setDropdownOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Fleets</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      startNewFleet();
                      setDropdownOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>New Fleet</ListItemText>
                  </MenuItem>
                  <Divider />
                  
                  {/* Theme */}
                  <MenuItem
                    onClick={() => {
                      setTab(2);
                      setDropdownOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <PaletteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Theme</ListItemText>
                  </MenuItem>
                  
                  {/* Logout */}
                  <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={signInWithGoogle}
                sx={{ ml: 1 }}
              >
                Sign In
              </Button>
            )}
          </Toolbar>
        </AppBar>



        <Box>
          {tab===0 && (
            !nameSubmitted ? (
              <CreateNewFleetView
                fleetName={fleetName}
                setFleetName={setFleetName}
                faction={faction}
                setFaction={setFaction}
                factions={FACTIONS}
                onSubmit={handleNameSubmit}
              />
            ) : (
              <BuildView
                fleetName={fleetName}
                setFleetName={setFleetName}
                faction={faction}
                setFaction={setFaction}
                points={points}
                setPoints={setPoints}
                roster={roster}
                setRoster={setRoster}
                factions={FACTIONS}
                refits={REFITS}
                ships={ships}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                saveStatus={saveStatus}
                user={user}
                cap={cap}
                used={used}
                uniqueClash={uniqueClash}
                useRefits={useRefits}
                setUseRefits={toggleUseRefits}
                useJuggernauts={useJuggernauts}
                setUseJuggernauts={toggleUseJuggernauts}
                maxRefits={maxRefits}
                usedRefits={totalUsedRefits}
                canAddRefit={canAddRefit}
                addShip={addShip}
                removeShip={removeShip}
                removeGroup={removeGroup}
                duplicateGroup={duplicateGroup}
                pickProw={pickProw}
                addHull={addHull}
                removeHullByName={removeHullByName}
                randomizeHull={randomizeHull}
                addRefit={addRefit}
                removeRefit={removeRefit}
                addRefitToGroup={addRefitToGroup}
                removeRefitFromGroup={removeRefitFromGroup}
                saveFleet={saveFleet}
                startNewFleet={startNewFleet}
                signInWithGoogle={signInWithGoogle}
                isPlayMode={isPlayMode}
                setIsPlayMode={setIsPlayMode}
              />
            )
          )}

          {tab===1 && (
            <FleetsView
              user={user}
              savedFleets={savedFleets}
              startNewFleet={startNewFleet}
              setTab={setTab}
              editFleet={editFleet}
              playFleet={playFleet}
              deleteFleet={deleteFleet}
              signInWithGoogle={signInWithGoogle}
            />
          )}

          {tab===2 && (
            <ThemeSettings />
          )}
        </Box>
      </Box>
    </MuiThemeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
