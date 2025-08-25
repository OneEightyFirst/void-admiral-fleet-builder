import React, { useMemo, useState, useEffect } from "react";
import {
  ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box, Grid, Card, CardContent,
  Stack, Button, TextField, Chip, Divider, Paper, IconButton, Tooltip as MuiTooltip, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Tooltip, Avatar, Fab, ClickAwayListener, Drawer, ListItemIcon, useMediaQuery
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, PlayArrow as PlayIcon, Remove as RemoveIcon, Add as PlusIcon, Print as PrintIcon, ContentCopy as CopyIcon, Save as SaveIcon, Folder as FolderIcon, Login as LoginIcon, Logout as LogoutIcon, Build as BuildIcon, ArrowForward as ArrowForwardIcon, Check as CheckIcon, Menu as MenuIcon, Edit as EditIcon } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// FACTIONS will be loaded dynamically

// Firebase imports
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

function shipCost(def) {
  return def.points ?? (def.size === "Large" ? 9 :
                        def.size === "Medium" ? 6 :
                        def.size === "Small" ? 3 : 1);
}

function uid(){ return Math.random().toString(36).slice(2,9); }
function armingKey(cls, loadout){
  const prow = loadout.prow?.name || "";
  const hull = (loadout.hull || []).slice().sort().join("|");
  return `${cls}::prow:${prow}::hull:${hull}`;
}

// safe getters for new faction fields
function getFluff(f, factions) { return (factions?.[f]?.fluff || "").trim(); }
function getSpecialRules(f, factions) { return Array.isArray(factions?.[f]?.specialRules) ? factions[f].specialRules : []; }
function getCommandAbilities(f, factions) { return Array.isArray(factions?.[f]?.commandAbilities) ? factions[f].commandAbilities : []; }

// Fleet building rule modifiers
function getPointLimit(faction, basePoints, factions) {
  const specialRules = getSpecialRules(faction, factions);
  
  // Few in Number: 20% fewer points (Ancients, Cyborgs)
  if (specialRules.some(rule => rule.name === "Few in Number")) {
    return Math.floor(basePoints * 0.8);
  }
  
  // Wealthy: 20% more points (Merchants)
  if (specialRules.some(rule => rule.name === "Wealthy")) {
    return Math.floor(basePoints * 1.2);
  }
  
  // Industrious: 20% more points (Scrap Bots)
  if (specialRules.some(rule => rule.name === "Industrious")) {
    return Math.floor(basePoints * 1.2);
  }
  
  return basePoints;
}

// Special ship cost calculations
function getShipCost(faction, def, roster) {
  // Note: Insectoid Pincers cost 1pt each for fleet building
  // The 0.5pt value is only for opponent victory point scoring
  return shipCost(def);
}

// Check if faction has special squadron rules
function hasSwarmRule(faction, factions) {
  return getSpecialRules(faction, factions).some(rule => rule.name === "The Swarm");
}

// Check if faction has random weapon construction
function hasUnplannedConstruction(faction, factions) {
  return getSpecialRules(faction, factions).some(rule => rule.name === "Unplanned Construction");
}

// Group weapons by name and count duplicates
function groupWeapons(weaponNames, allWeapons) {
  const weaponCounts = {};
  const weaponData = {};
  
  weaponNames.forEach(name => {
    weaponCounts[name] = (weaponCounts[name] || 0) + 1;
    if (!weaponData[name]) {
      weaponData[name] = allWeapons.find(x => x.name === name) || { name };
    }
  });
  
  return Object.entries(weaponCounts).map(([name, count]) => ({
    name,
    count,
    data: weaponData[name]
  }));
}

// Generate random weapons for Scrap Bots
function randomizeScrapBotWeapons(def) {
  const weaponTypes = ["Cannons", "Lasers", "Missiles"];
  const randomWeapons = [];
  
  for (let i = 0; i < def.hull.select; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 2) {
      randomWeapons.push("Cannons");
    } else if (roll <= 4) {
      randomWeapons.push("Lasers");
    } else {
      randomWeapons.push("Missiles");
    }
  }
  
  return randomWeapons;
}

// Dice face SVG components
function DiceFace({ value, size = 24 }) {
  const dotPositions = {
    1: [{ x: 12, y: 12 }],
    2: [{ x: 6, y: 6 }, { x: 18, y: 18 }],
    3: [{ x: 6, y: 6 }, { x: 12, y: 12 }, { x: 18, y: 18 }],
    4: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 6, y: 18 }, { x: 18, y: 18 }],
    5: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 12, y: 12 }, { x: 6, y: 18 }, { x: 18, y: 18 }],
    6: [{ x: 6, y: 6 }, { x: 18, y: 6 }, { x: 6, y: 12 }, { x: 18, y: 12 }, { x: 6, y: 18 }, { x: 18, y: 18 }]
  };

  const dots = dotPositions[value] || [];

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ border: '2px solid #000', backgroundColor: '#fff' }}>
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r="2" fill="#000" />
      ))}
    </svg>
  );
}

export default function App(){
  console.log("App component mounting/rendering");
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [FACTIONS, setFACTIONS] = useState(null);
  const [factionsLoading, setFactionsLoading] = useState(true);
  
  // Create theme with custom breakpoints and check for mobile
  // Custom breakpoint: md=850px for optimal mobile/desktop split
  // Mobile: < 850px (xs, sm), Desktop: ≥ 850px (md, lg, xl)
  const theme = createTheme({ 
    palette: { mode: "dark" }, 
    shape: { borderRadius: 12 },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 850,  // Custom mobile/desktop breakpoint (was 900px)
        lg: 1200,
        xl: 1536,
      },
    }
  });
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const ships = FACTIONS ? FACTIONS[faction]?.ships || {} : {};

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        console.log("🔐 User signed in:", user.displayName);
        console.log("👤 User ID:", user.uid);
        console.log("📧 User email:", user.email);
        loadUserFleets(user.uid);
      } else {
        console.log("🚪 User signed out");
        loadLocalStorageData();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load factions data
  useEffect(() => {
    const loadFactions = async () => {
      try {
        console.log("🔄 Loading factions data...");
        const response = await fetch('/void-admiral/data/factions.json');
        if (!response.ok) {
          throw new Error(`Failed to load factions: ${response.status}`);
        }
        const factionsData = await response.json();
        setFACTIONS(factionsData);
        console.log("✅ Factions data loaded successfully");
      } catch (error) {
        console.error("❌ Error loading factions:", error);
        // You could add error state here if needed
      } finally {
        setFactionsLoading(false);
      }
    };

    loadFactions();
  }, []);

  const loadLocalStorageData = () => {
    console.log("Loading data from localStorage");
    const saved = localStorage.getItem("va_factions_full");
    if(saved){
      try{
        const obj = JSON.parse(saved);
        setFaction(obj.faction||"Loyalists"); setPoints(obj.points||30); setRoster(obj.roster||[]); setFleetName(obj.fleetName||"");
      }catch{}
    }
    const savedFleets = localStorage.getItem("va_saved_fleets");
    console.log("Loading saved fleets from localStorage:", savedFleets);
    if(savedFleets){
      try{
        const parsed = JSON.parse(savedFleets);
        console.log("Parsed saved fleets:", parsed);
        setSavedFleets(parsed);
      }catch(e){
        console.error("Error parsing saved fleets:", e);
      }
    }
    setHasLoadedSavedFleets(true);
  };
  useEffect(()=>{
    localStorage.setItem("va_factions_full", JSON.stringify({ faction, points, roster, fleetName }));
  },[faction, points, roster, fleetName]);
  
  useEffect(()=>{
    if (hasLoadedSavedFleets) {
      console.log("Saving to localStorage:", savedFleets);
      localStorage.setItem("va_saved_fleets", JSON.stringify(savedFleets));
    }
  },[savedFleets, hasLoadedSavedFleets]);

  const cap = FACTIONS ? getPointLimit(faction, points, FACTIONS) : points;
  const used = useMemo(() =>
    roster.reduce((sum, s) => {
      // Skip free ships (Insectoid Swarm bonus squadrons)
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
    const count = def.squadron ? 3 : 1; // groups of 3 for squadrons

    // guard: block if this would exceed cap
    if (used + cost * count > cap) return;

    const groupId = def.squadron ? uid() : null;

    const mk = () => {
    const loadout = { prow:null, hull:[], begins:(def.beginsWith||[]).map(o=>o.name) };
      if (def.beginsWith?.length) loadout.hull = [...loadout.hull, ...def.beginsWith.map(o=>o.name)];
      
      // Scrap Bot random weapon construction
      if (hasUnplannedConstruction(faction)) {
        const randomWeapons = randomizeScrapBotWeapons(def);
        loadout.hull = [...loadout.hull, ...randomWeapons];
        loadout.isRandomized = true;
      }
      
      return { id: uid(), className, loadout, groupId };
    };

    const newShips = Array.from({length: count}, mk);
    
    // Insectoid Swarm: Add free Pincer squadron when adding Pincers
    if (faction === "Insectoids" && className === "Pincer") {
      const freeGroupId = uid();
      const mkFree = () => {
        const loadout = { prow:null, hull:[], begins:(def.beginsWith||[]).map(o=>o.name) };
        if (def.beginsWith?.length) loadout.hull = [...loadout.hull, ...def.beginsWith.map(o=>o.name)];
        
        // Scrap Bot random weapon construction (even for free ships)
        if (hasUnplannedConstruction(faction)) {
          const randomWeapons = randomizeScrapBotWeapons(def);
          loadout.hull = [...loadout.hull, ...randomWeapons];
          loadout.isRandomized = true;
        }
        
        return { id: uid(), className, loadout, groupId: freeGroupId, isFree: true };
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
      
      if (used + cost * count > cap) return r; // Check if we can afford it
      
      const newGroupId = uid();
      const duplicatedShips = groupShips.map(ship => ({
        ...ship,
        id: uid(),
        groupId: ship.isFree ? uid() : newGroupId, // Free ships get their own group
        isFree: ship.isFree // Preserve free status
      }));
      
      // For Insectoid Pincers, also duplicate the free squadron
      if (faction === "Insectoids" && firstShip.className === "Pincer" && !firstShip.isFree) {
        const freeShips = r.filter(x=>x.className === "Pincer" && x.isFree);
        const matchingFreeGroup = freeShips.find(x=>x.loadout.prow?.name === firstShip.loadout.prow?.name && 
          JSON.stringify(x.loadout.hull?.sort()) === JSON.stringify(firstShip.loadout.hull?.sort()));
        
        if (matchingFreeGroup) {
          const freeGroupShips = freeShips.filter(x=>x.groupId === matchingFreeGroup.groupId);
          const newFreeGroupId = uid();
          const duplicatedFreeShips = freeGroupShips.map(ship => ({
            ...ship,
            id: uid(),
            groupId: newFreeGroupId
          }));
          return [...r, ...duplicatedShips, ...duplicatedFreeShips];
        }
      }
      
      return [...r, ...duplicatedShips];
    });
  }

  // Clean roster data to remove undefined values
  const cleanRosterForSave = (rosterData) => {
    return rosterData.map(ship => {
      const cleanShip = {};
      Object.keys(ship).forEach(key => {
        if (ship[key] !== undefined) {
          cleanShip[key] = ship[key];
        }
      });
      return cleanShip;
    });
  };

  const saveFleet = async () => {
    if(!fleetName.trim() || !user) return; // Require authentication
    
    setSaveStatus('saving');
    
    const cleanedRoster = roster ? cleanRosterForSave(roster) : [];
    
    const fleet = {
      name: fleetName.trim(),
      faction: faction || "Loyalists", // Default fallback
      points: points || 30, // Default fallback
      roster: cleanedRoster,
      savedAt: new Date().toISOString()
    };
    
    // Debug logging to identify undefined values
    console.log("🔍 Saving fleet data:", {
      name: fleet.name,
      faction: fleet.faction,
      points: fleet.points,
      roster: fleet.roster,
      rosterLength: fleet.roster.length
    });
    
    // Save to Firestore (only option now)
    try {
      const existingFleet = savedFleets.find(f => f.name === fleet.name);
      if (existingFleet) {
        // For overwriting, we need to delete the old one and create a new one
        // (Firestore doesn't have a simple "upsert by name" operation)
        await deleteFleetFromFirestore(existingFleet.id);
      }
      
      const docId = await saveFleetToFirestore(fleet);
      const newFleet = { ...fleet, id: docId };
      
      setSavedFleets(prev => [...prev.filter(f => f.name !== fleet.name), newFleet]);
      console.log("Fleet saved to Firestore:", newFleet);
      
      setSaveStatus('saved');
      
      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error("Error saving fleet to Firestore:", error);
      setSaveStatus('idle');
      // Could show an error message to user here
    }
    
    // Keep the fleet name in the field (don't clear it)
  };

  function loadFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true); // Mark name as submitted when loading fleet
    setTab(0); // Switch to Build tab
  }

  function editFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true); // Mark name as submitted when loading fleet
    setTab(0); // Switch to Build tab
  }

  function playFleet(fleet){
    setFaction(fleet.faction);
    setPoints(fleet.points);
    setRoster([...fleet.roster]);
    setFleetName(fleet.name);
    setNameSubmitted(true); // Mark name as submitted when loading fleet
    setTab(1); // Switch to Play tab
  }

  function startNewFleet(){
    setFleetName('');
    setNameSubmitted(false);
    setRoster([]);
    setFaction('Loyalists');
    setPoints(30);
    setTab(0); // Stay on Build tab
  }

  function deleteFleet(fleetId){
    // Delete from Firestore (only option now)
    if (user) {
      deleteFleetFromFirestore(fleetId);
    }
  }

  // Firebase Authentication Functions
  const handleNameSubmit = () => {
    if (fleetName.trim()) {
      setNameSubmitted(true);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Signed in as:", result.user.displayName);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("Signed out");
      // Clear saved fleets and reload localStorage data
      setSavedFleets([]);
      loadLocalStorageData();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Firestore Functions
  const loadUserFleets = async (userId) => {
    try {
      console.log("🔍 Loading fleets for userId:", userId);
      const q = query(
        collection(db, "fleets"),
        where("userId", "==", userId),
        orderBy("savedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fleets = [];
      querySnapshot.forEach((doc) => {
        console.log("📄 Found fleet document:", doc.id, doc.data());
        fleets.push({ id: doc.id, ...doc.data() });
      });
      console.log("✅ Loaded fleets from Firestore:", fleets.length, "fleets");
      console.log("📋 Fleet details:", fleets);
      setSavedFleets(fleets);
      setHasLoadedSavedFleets(true);
      
      // Auto-switch to fleets tab if user has saved fleets
      if (fleets.length > 0 && tab === 0) {
        setTab(2); // Tab 2 is the Fleets tab
      }
    } catch (error) {
      console.error("❌ Error loading fleets:", error);
      setHasLoadedSavedFleets(true);
    }
  };

  const saveFleetToFirestore = async (fleet) => {
    try {
      const docRef = await addDoc(collection(db, "fleets"), {
        ...fleet,
        userId: user.uid
      });
      console.log("Fleet saved to Firestore with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving fleet:", error);
      throw error;
    }
  };

  const deleteFleetFromFirestore = async (fleetId) => {
    try {
      await deleteDoc(doc(db, "fleets", fleetId));
      console.log("Fleet deleted from Firestore");
      setSavedFleets(prev => prev.filter(f => f.id !== fleetId));
    } catch (error) {
      console.error("Error deleting fleet:", error);
    }
  };

  function pickProw(id, opt){ setRoster(r=>r.map(x=> x.id===id ? { ...x, loadout:{ ...x.loadout, prow: opt } } : x)); }
  function addHull(id, optName, def){
    setRoster(r=>r.map(x=>{
      if(x.id!==id) return x;
      const totalEditable = (x.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
      if(totalEditable >= def.hull.select) return x;
      return { ...x, loadout:{ ...x.loadout, hull:[...x.loadout.hull, optName] } };
    }));
  }
  function removeHull(id, index, def){
    setRoster(r=>r.map(x=>{
      if(x.id!==id) return x;
      const name = x.loadout.hull[index];
      if((def.beginsWith||[]).some(b=>b.name===name)) return x;
      const next = [...x.loadout.hull]; next.splice(index,1);
      return { ...x, loadout:{ ...x.loadout, hull: next } };
    }));
  }
  function removeHullByName(id, optName, def){
    setRoster(r=>r.map(x=>{
      if(x.id!==id) return x;
      if((def.beginsWith||[]).some(b=>b.name===optName)) return x; // Can't remove fixed weapons
      const hull = [...x.loadout.hull];
      const index = hull.lastIndexOf(optName); // Remove last occurrence
      if(index !== -1) hull.splice(index, 1);
      return { ...x, loadout:{ ...x.loadout, hull } };
    }));
  }
  function randomizeHull(id, def) {
    setRoster(r => r.map(x => {
      if (x.id !== id) return x;

      // keep any fixed "beginsWith" entries in place
      const fixed = (x.loadout.hull || []).filter(n =>
        (def.beginsWith || []).some(b => b.name === n)
      );

      const pool = def.hull.options.map(o => o.name);
      const picks = [];
      const n = def.hull.select;

      // random WITH replacement (duplicates allowed, per "randomly select" feel)
      for (let i = 0; i < n; i++) {
        picks.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      return { ...x, loadout: { ...x.loadout, hull: [...fixed, ...picks] } };
    }));
  }

  // Navigation menu items
  const navItems = [
    { label: 'Build', icon: <BuildIcon />, index: 0 },
    { label: 'Play', icon: <PlayIcon />, index: 1 },
    { label: 'Fleets', icon: <FolderIcon />, index: 2 }
  ];

  // Mobile drawer component
  const drawer = (
    <Box sx={{ width: 250, bgcolor: 'background.paper', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 900,
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
          onClick={() => setDrawerOpen(false)}
        >
          Void Admiral
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.label}
            selected={tab === item.index}
            onClick={() => {
              setTab(item.index);
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        {!user ? (
          <Button 
            fullWidth
            variant="outlined" 
            startIcon={<LoginIcon/>}
            onClick={() => {
              signInWithGoogle();
              setDrawerOpen(false);
            }}
          >
            Sign In
          </Button>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {user.displayName}
            </Typography>
            <Button 
              fullWidth
              variant="outlined" 
              startIcon={<LogoutIcon/>}
              onClick={() => {
                signOut();
                setDrawerOpen(false);
              }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  // Show loading screen until both auth and factions are ready
  if (loading || factionsLoading) {
    return (
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <AppBar position="sticky" color="default" enableColorOnDark>
        <Toolbar>
          {/* Mobile hamburger menu */}
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" sx={{ fontWeight:900, mr:2 }}>Void Admiral</Typography>
          
          {/* Desktop tabs - hidden on mobile */}
          {!isMobile && (
            <Tabs value={tab} onChange={(e,v)=>setTab(v)}>
              <Tab 
                label="Build"
                icon={<BuildIcon/>} 
                iconPosition="start"
              />
              <Tab 
                label="Play"
                icon={<PlayIcon/>} 
                iconPosition="start"
              />
              <Tab 
                label="Fleets"
                icon={<FolderIcon/>} 
                iconPosition="start"
              />
            </Tabs>
          )}
          
          <Box sx={{ flex:1 }} />
          
          {/* Authentication UI */}
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : user ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 32, height: 32 }} />
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.displayName}
              </Typography>
              <IconButton color="inherit" onClick={handleSignOut} title="Sign Out">
                <LogoutIcon />
              </IconButton>
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

      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ p:2 }}>
        {tab===0 && (
          <>
            {/* Name Entry Screen - Show when name not submitted */}
            {!nameSubmitted ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh',
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ mb: 1, color: 'white' }}>
                  Create New Fleet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Give your fleet a name to start building
                </Typography>
                
                <Box sx={{ width: '100%', maxWidth: '400px' }}>
                  <TextField 
                    fullWidth
                    value={fleetName} 
                    onChange={e=>setFleetName(e.target.value)}
                    placeholder="Enter fleet name..."
                    onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                    sx={{ 
                      mb: 3,
                      '& .MuiInputBase-root': { 
                        fontSize: '1.2rem', 
                        padding: '16px 20px',
                        textAlign: 'center'
                      }
                    }}
                    autoFocus
                  />
                  
                  <Button 
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleNameSubmit}
                    disabled={!fleetName.trim()}
                    sx={{ 
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                  >
                    Start Building
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Build Interface - Show when fleet name exists */
              <>
                {/* Fleet Name Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isEditingName ? (
                      <ClickAwayListener onClickAway={() => setIsEditingName(false)}>
                        <TextField 
                          value={fleetName}
                          onChange={e => setFleetName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                          size="small"
                          autoFocus
                          sx={{ '& .MuiInputBase-root': { fontSize: '1.5rem', fontWeight: 700 } }}
                        />
                      </ClickAwayListener>
                    ) : (
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700, 
                          color: 'white', 
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' }
                        }}
                        onClick={() => setIsEditingName(true)}
                      >
                        {fleetName}
                      </Typography>
                    )}
                    <Chip 
                      label={faction} 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                  
                  {/* New Fleet Button */}
                  <Button 
                    variant="outlined" 
                    onClick={startNewFleet}
                    size="small"
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    New Fleet
                  </Button>
                </Box>
                
                {!user && (
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<LoginIcon/>}
                      onClick={signInWithGoogle}
                      size="small"
                    >
                      Sign In to Save
                    </Button>
                  </Box>
                )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card><CardContent>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Game Size</InputLabel>
                        <Select label="Game Size" value={points} onChange={e=>setPoints(e.target.value)}>
                          <MenuItem value={15}>15 pts - Quick Skirmish</MenuItem>
                          <MenuItem value={30}>30 pts - Standard Engagement</MenuItem>
                          <MenuItem value={45}>45 pts - Large Battle</MenuItem>
                          <MenuItem value={60}>60 pts - Epic Battle</MenuItem>
                        </Select>
                      </FormControl>
                      
                <FormControl fullWidth size="small" sx={{ mt:1 }}>
                  <InputLabel>Faction</InputLabel>
                  <Select label="Faction" value={faction} onChange={e=>{ setFaction(e.target.value); setRoster([]); }}>
                          {FACTIONS ? Object.keys(FACTIONS).map(f=> <MenuItem key={f} value={f}>{f}</MenuItem>) : []}
                  </Select>
                </FormControl>

                <Divider sx={{ my:2 }}/>
                <Typography variant="subtitle1" sx={{ fontWeight:800, mb:1 }}>Add Ships</Typography>
                <Stack spacing={1}>
                  {Object.entries(ships).map(([cls,def])=> (
                    <Paper key={cls} variant="outlined" sx={{ p:1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight:700 }}>{cls}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {def.squadron ? (
                              faction === "Insectoids" && cls === "Pincer" ? 
                                `Squadron • 1pt x 3 (+3 free)` :
                                `Squadron • ${getShipCost(faction, { ...def, className: cls }, roster)}pt x 3`
                            ) : (
                              `${def.size} • ${getShipCost(faction, { ...def, className: cls }, roster)} pts`
                            )}
                          </Typography>
                        </Box>
                        <Button size="small" variant="contained" startIcon={<AddIcon/>} onClick={()=>addShip(cls)}>Add</Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
                <Divider sx={{ my:1 }}/>
                <Typography>Total: {used}/{cap} pts</Typography>
                {cap !== points && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {cap < points ? `Reduced from ${points} pts (Few in Number)` : `Increased from ${points} pts (${FACTIONS ? getSpecialRules(faction, FACTIONS).find(r => r.name === "Wealthy" || r.name === "Industrious")?.name : ""})`}
                  </Typography>
                )}
                {uniqueClash && <Alert severity="warning" sx={{ mt:1 }}>Unique rule: two non‑squadron ships are armed identically. Change a prow or hull mix.</Alert>}
              </CardContent></Card>
            </Grid>

            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight:800, mb:1 }}>Faction Overview</Typography>

                    {FACTIONS && getFluff(faction, FACTIONS) && (
                      <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                        <Typography variant="body2" color="text.secondary">{getFluff(faction, FACTIONS)}</Typography>
                      </Paper>
                    )}

                    <Accordion disableGutters sx={{ mb:1 }} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Special Rules</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt:0 }}>
                        {getSpecialRules(faction).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">None listed.</Typography>
                        ) : (
                          <Stack spacing={0.75}>
                            {getSpecialRules(faction).map((r, i)=>(
                              <Paper key={i} variant="outlined" sx={{ p:1 }}>
                                <Typography variant="body2" sx={{ fontWeight:700 }}>{r.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>{r.description}</Typography>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>

                    <Accordion disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Command Abilities</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt:0 }}>
                        {getCommandAbilities(faction).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">None listed.</Typography>
                        ) : (
                          <Grid container spacing={1}>
                            {getCommandAbilities(faction).sort((a,b)=>a.dice-b.dice).map((c, i)=>(
                              <Grid key={i} item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p:1, height: '100%' }}>
                                  <Stack direction="row" spacing={1} alignItems="stretch">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <DiceFace value={c.dice} size={32} />
                                    </Box>
                                    <Stack sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight:700 }}>{c.name}</Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>{c.description}</Typography>
                                    </Stack>
                                  </Stack>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </AccordionDetails>
                    </Accordion>
                    </CardContent>
                  </Card>
                </Grid>
                {(() => {
                  // Group squadron ships together, show individual ships separately
                  const processedGroups = new Set();
                  const cards = [];
                  
                  roster.forEach(s => {
                  const def = ships[s.className];
                    
                    if (def.squadron && s.groupId && !processedGroups.has(s.groupId)) {
                      // Handle squadron as a group
                      processedGroups.add(s.groupId);
                      const squadronShips = roster.filter(ship => ship.groupId === s.groupId);
                      
                      cards.push(
                        <Grid key={s.groupId} item xs={12} md={6}>
                          <Card>
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight:900 }}>{s.className} Squadron</Typography>
                                  {s.isFree && <Chip size="small" label="Free" color="success" sx={{ mt: 0.5 }} />}
                                </Box>
                                <Stack direction="row" spacing={1}>
                                  {!s.isFree && (
                                    <MuiTooltip title="Duplicate Squadron" arrow>
                                      <IconButton color="primary" onClick={()=>duplicateGroup(s.groupId)}><CopyIcon/></IconButton>
                                    </MuiTooltip>
                                  )}
                                  <MuiTooltip title="Remove Squadron" arrow>
                                    <IconButton color="error" onClick={()=>removeGroup(s.groupId)}><DeleteIcon/></IconButton>
                                  </MuiTooltip>
                                </Stack>
                              </Stack>
                              <Divider sx={{ my:1 }}/>

                              {/* Stats */}
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                                    <Grid container spacing={1}>
                                      {Object.entries(def.statline).map(([k,v])=> (
                                        <Grid key={k} item xs={2.4}>
                                          <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{k}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{v}</Typography>
                                          </Box>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Paper>
                                </Grid>

                                {/* Begins with */}
                                {(def.beginsWith||[]).length>0 && (
                                  <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p:1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Begins with</Typography>
                                      <Stack direction="row" spacing={0.5} sx={{ flexWrap:"wrap" }}>
                                        {def.beginsWith.map(o=> (
                                          <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                            <Chip size="small" label={o.name} />
                                          </MuiTooltip>
                                        ))}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                )}

                                {/* Individual ships in squadron */}
                                {squadronShips.map((squadShip, idx) => (
                                  <Grid key={squadShip.id} item xs={12}>
                                    <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight:800, mb:1 }}>Ship {idx + 1}</Typography>
                                      
                                      {/* Prow weapons for this ship */}
                                      {def.prow.select > 0 && def.prow.options.length > 0 && (
                                        <Box sx={{ mb:1 }}>
                                          <Typography variant="caption" sx={{ fontWeight:700, mb:0.5, display: 'block' }}>Prow — Select {def.prow.select}</Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {def.prow.options.map(o=> {
                                              const selected = squadShip.loadout.prow?.name === o.name;
                  return (
                                                <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                                  <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(squadShip.id, o)} label={o.name} />
                                                </MuiTooltip>
                                              );
                                            })}
                                          </Box>
                                        </Box>
                                      )}

                                      {/* Hull weapons for this ship */}
                                      {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0)) && (
                                        <Box>
                                          {def.hull.select > 0 && (
                                            <Typography variant="caption" sx={{ fontWeight:700, mb:0.5, display: 'block' }}>Hull — Select {def.hull.select} (mix allowed)</Typography>
                                          )}
                                          {hasUnplannedConstruction(faction) && squadShip.loadout.isRandomized ? (
                                            <Alert severity="info" sx={{ mb: 1 }}>
                                              Weapons randomly assigned at game start. Hull selection disabled.
                                            </Alert>
                                          ) : (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                              {def.hull.options.map(o=> {
                                                const currentCount = (squadShip.loadout.hull||[]).filter(name => name === o.name).length;
                                                const totalEditable = (squadShip.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                                const canAdd = totalEditable < def.hull.select;
                                                const canRemove = currentCount > 0;
                                                const isAtLimit = totalEditable >= def.hull.select;
                                                const hasSelection = currentCount > 0;
                                                const shouldHighlight = isAtLimit && hasSelection;
                                                
                                                return (
                                                  <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                                    <Chip 
                                                      color={shouldHighlight ? "primary" : "default"}
                                                      sx={{ 
                                                        '& .MuiChip-label': { 
                                                          display: 'flex', 
                                                          alignItems: 'center', 
                                                          gap: 0.5,
                                                          px: 1
                                                        } 
                                                      }}
                                                      label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                          <Typography variant="caption">
                                                            {o.name}
                                                          </Typography>
                                                          <IconButton 
                                                            size="small" 
                                                            disabled={!canRemove}
                                                            onClick={(e)=> {
                                                              e.stopPropagation();
                                                              removeHullByName(squadShip.id, o.name, def);
                                                            }}
                                                            sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                          >
                                                            <RemoveIcon fontSize="small" />
                                                          </IconButton>
                                                          <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem' }}>
                                                            {currentCount}
                                                          </Typography>
                                                          <IconButton 
                                                            size="small" 
                                                            disabled={!canAdd}
                                                            onClick={(e)=> {
                                                              e.stopPropagation();
                                                              addHull(squadShip.id, o.name, def);
                                                            }}
                                                            sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                          >
                                                            <PlusIcon fontSize="small" />
                                                          </IconButton>
                                                        </Box>
                                                      }
                                                    />
                                                  </MuiTooltip>
                                                );
                                              })}
                                            </Box>
                                          )}
                                          {(() => {
                                            const editableCount = (squadShip.loadout.hull||[]).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                            return editableCount < def.hull.select && <Alert severity="info" sx={{ mt:1 }}>Choose {def.hull.select - editableCount} more hull weapon(s).</Alert>;
                                          })()}
                                        </Box>
                                      )}
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    } else if (!def.squadron) {
                      // Handle individual ships (non-squadron)
                      const editableCount = (s.loadout.hull||[]).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                      cards.push(
                        <Grid key={s.id} item xs={12} md={6}>
                          <Card>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                          <Typography variant="h6" sx={{ fontWeight:900 }}>{s.className}</Typography>
                            {s.isFree && <Chip size="small" label="Free" color="success" sx={{ mt: 0.5 }} />}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            { s.groupId
                              ? <Button size="small" onClick={()=>removeGroup(s.groupId)}>Remove Group</Button>
                              : null }
                          <IconButton color="error" onClick={()=>removeShip(s.id)}><DeleteIcon/></IconButton>
                          </Stack>
                        </Stack>
                        <Divider sx={{ my:1 }}/>

                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                              <Grid container spacing={1}>
                                {Object.entries(def.statline).map(([k,v])=> (
                                  <Grid key={k} item xs={2.4}>
                                    <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{k}</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{v}</Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Paper>
                          </Grid>

                            {(def.beginsWith||[]).length>0 && (
                            <Grid item xs={12}>
                              <Paper variant="outlined" sx={{ p:1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Begins with</Typography>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap:"wrap" }}>
                                  {def.beginsWith.map(o=> (
                                    <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                      <Chip size="small" label={o.name} />
                                    </MuiTooltip>
                                  ))}
                                </Stack>
                              </Paper>
                          </Grid>
                          )}

                          <Grid item xs={12}>
                            {def.prow.select > 0 && def.prow.options.length > 0 && (
                            <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Prow — Select {def.prow.select}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {def.prow.options.map(o=> {
                                  const selected = s.loadout.prow?.name === o.name;
                                  return (
                                    <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                      <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(s.id, o)} label={o.name} />
                                    </MuiTooltip>
                                  );
                                })}
                                </Box>
                              {!s.loadout.prow && <Alert severity="info" sx={{ mt:1 }}>Pick {def.prow.select} prow option.</Alert>}
                            </Paper>
                            )}

                            {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0)) && (
                            <Paper variant="outlined" sx={{ p:1 }}>
                                {def.hull.select > 0 && (
                              <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Hull — Select {def.hull.select} (mix allowed)</Typography>
                                )}
                                {def.randomizeHull && (
                                  <Stack direction="row" spacing={1} sx={{ mb: 1, mt: 0.5 }}>
                                    <Alert severity="info" sx={{ py: 0 }}>
                                      Scrap Bots: randomly select {def.hull.select} hull weapon(s).
                                    </Alert>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => randomizeHull(s.id, def)}
                                    >
                                      Randomize
                                    </Button>
                              </Stack>
                                )}
                                {hasUnplannedConstruction(faction) && s.loadout.isRandomized ? (
                                  <Alert severity="info" sx={{ mb: 1 }}>
                                    Weapons randomly assigned at game start. Hull selection disabled.
                                  </Alert>
                                ) : (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {def.hull.options.map(o=> {
                                      const currentCount = (s.loadout.hull||[]).filter(name => name === o.name).length;
                                      const totalEditable = (s.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                      const canAdd = totalEditable < def.hull.select;
                                      const canRemove = currentCount > 0;
                                      const isAtLimit = totalEditable >= def.hull.select;
                                      const hasSelection = currentCount > 0;
                                      const shouldHighlight = isAtLimit && hasSelection;
                                      
                                  return (
                                        <MuiTooltip key={o.name} title={`Targets: ${o.targets||"—"} • Attacks: ${o.attacks??"—"} • Range: ${o.range||"—"}`} arrow>
                                          <Chip 
                                            color={shouldHighlight ? "primary" : "default"}
                                            sx={{ 
                                              '& .MuiChip-label': { 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 0.5,
                                                px: 1
                                              } 
                                            }}
                                            label={
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption">
                                                  {o.name}
                                                </Typography>
                                                <IconButton 
                                                  size="small" 
                                                  disabled={!canRemove}
                                                  onClick={(e)=> {
                                                    e.stopPropagation();
                                                    removeHullByName(s.id, o.name, def);
                                                  }}
                                                  sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                >
                                                  <RemoveIcon fontSize="small" />
                                                </IconButton>
                                                <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem' }}>
                                                  {currentCount}
                                                </Typography>
                                                <IconButton 
                                                  size="small" 
                                                  disabled={!canAdd}
                                                  onClick={(e)=> {
                                                    e.stopPropagation();
                                                    addHull(s.id, o.name, def);
                                                  }}
                                                  sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                >
                                                  <PlusIcon fontSize="small" />
                                                </IconButton>
                                              </Box>
                                            }
                                          />
                                    </MuiTooltip>
                                  );
                                })}
                                  </Box>
                                )}
                              {editableCount < def.hull.select && <Alert severity="info" sx={{ mt:1 }}>Choose {def.hull.select - editableCount} more hull weapon(s).</Alert>}
                            </Paper>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                          </Grid>
                        );
                      }
                    });
                    
                    return cards;
                  })()}
            </Grid>
          </Grid>
          </Grid>
                
                {/* Floating Save Button */}
                {user && fleetName.trim() && roster.length > 0 && (
                  <Fab 
                    color={saveStatus === 'saved' ? 'success' : 'primary'}
                    onClick={saveFleet}
                    disabled={saveStatus === 'saving'}
                    sx={{ 
                      position: 'fixed', 
                      bottom: 24, 
                      right: 24,
                      zIndex: 1000,
                      bgcolor: saveStatus === 'saved' ? '#4caf50' : undefined,
                      '&:hover': {
                        bgcolor: saveStatus === 'saved' ? '#45a049' : undefined
                      }
                    }}
                  >
                    {saveStatus === 'saved' ? <CheckIcon /> : <SaveIcon />}
                  </Fab>
                )}
              </>
            )}
          </>
        )}

        {tab===1 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:3 }}>
              <Typography variant="h4" sx={{ fontWeight:900, color: 'white' }}>{faction}</Typography>
              {/* <Button variant="contained" size="large" startIcon={<PrintIcon/>} onClick={()=>window.print()}>Print</Button> */}
            </Stack>
            {(getSpecialRules(faction).length>0 || getCommandAbilities(faction).length>0) && (
              <Paper variant="outlined" sx={{ p:2, mb:3, backgroundColor: '#1f1f1f' }}>
                {getSpecialRules(faction).length>0 && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'white' }}>Special Rules</Typography>
                    <Box sx={{ mb: getCommandAbilities(faction).length > 0 ? 3 : 0 }}>
                      {getSpecialRules(faction).map((r,i)=>(
                        <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, backgroundColor: '#181818' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>{r.name}</Typography>
                          <Typography variant="body2" sx={{ color: 'grey.300' }}>{r.description}</Typography>
                        </Paper>
                      ))}
                    </Box>
                  </>
                )}
                {getCommandAbilities(faction).length>0 && (
                  <>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'white' }}>Command Abilities</Typography>
            <Grid container spacing={2}>
                      {getCommandAbilities(faction).sort((a,b)=>a.dice-b.dice).map((c,i)=>(
                        <Grid key={i} item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: '#181818', display: 'flex', alignItems: 'stretch', gap: 1.5, height: '100%' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              aspectRatio: '1/1', 
                              minWidth: '48px',
                              alignSelf: 'stretch'
                            }}>
                              <Box sx={{ width: '100%', height: '100%', maxWidth: '48px', maxHeight: '48px' }}>
                                <DiceFace value={c.dice} size={48} />
                              </Box>
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>{c.name}</Typography>
                              <Typography variant="body2" sx={{ color: 'grey.300' }}>{c.description}</Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Paper>
            )}
            <Grid container spacing={2}>
              {(() => {
                // Group ships by groupId for squadrons, individual ships get their own entries
                const grouped = {};
                const individuals = [];
                
                roster.forEach(s => {
                  if (s.groupId) {
                    if (!grouped[s.groupId]) grouped[s.groupId] = [];
                    grouped[s.groupId].push(s);
                  } else {
                    individuals.push(s);
                  }
                });
                
                const squadronGroups = Object.values(grouped);
                const allEntries = [...squadronGroups, ...individuals.map(s => [s])];
                
                // Sort by ship size: Large -> Medium -> Small -> Squadron
                const sizeOrder = { Large: 0, Medium: 1, Small: 2, Squadron: 3 };
                allEntries.sort((a, b) => {
                  const aSize = ships[a[0].className].size;
                  const bSize = ships[b[0].className].size;
                  return sizeOrder[aSize] - sizeOrder[bSize];
                });
                
                return allEntries.map((group, groupIndex) => {
                  const isSquadron = group.length > 1;
                  const firstShip = group[0];
                  const def = ships[firstShip.className];
                  
                  if (isSquadron) {
                    // Squadron card
                    return (
                      <Grid key={`squadron-${firstShip.groupId}`} item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p:2, borderRadius:2, backgroundColor: '#1f1f1f' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Box>
                              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{faction}</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'white' }}>{firstShip.className} Squadron</Typography>
                            </Box>
                            <Typography variant="body2" color="white" sx={{ fontWeight: 600, textAlign: 'right' }}>
                              {firstShip.isFree ? "Free" : `${shipCost(def) * 3} pts`}
                            </Typography>
                          </Stack>
                          <Divider sx={{ my: 1.5 }}/>
                          
                          {/* Stats */}
                          <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                            <Grid container spacing={1}>
                              {Object.entries(def.statline).map(([k,v])=> (
                                <Grid key={k} item xs={2.4}>
                                  <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{k}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{v}</Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Paper>
                          
                          {/* Squadron ships */}
                          {group.map((s, shipIndex) => (
                            <Box key={s.id} sx={{ mb: shipIndex < group.length - 1 ? 2 : 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>Ship {shipIndex + 1}</Typography>
                              
                              {(def.prow.select > 0 && def.prow.options.length > 0) && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'white' }}>Prow</Typography>
                                  {s.loadout.prow ? (
                                    <Paper variant="outlined" sx={{ p: 1, backgroundColor: '#2e2e2e' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'white' }}>{s.loadout.prow.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Targets: {s.loadout.prow.targets||"—"} • Attacks: {s.loadout.prow.attacks??"—"} • Range: {s.loadout.prow.range||"—"}
                                      </Typography>
                                    </Paper>
                                  ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                                </Box>
                              )}
                              
                              {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0) || (s.loadout.hull||[]).length > 0) && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'white' }}>Hull</Typography>
                                  <Stack spacing={0.5}>
                                    {(() => {
                                      const all = [...def.hull.options, ...(def.beginsWith||[])];
                                      const groupedWeapons = groupWeapons(s.loadout.hull||[], all);
                                      
                                      return groupedWeapons.map((weapon, i) => (
                                        <Paper key={i} variant="outlined" sx={{ p: 1, backgroundColor: '#2e2e2e' }}>
                                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'white' }}>
                                            {weapon.name}{weapon.count > 1 ? ` x${weapon.count}` : ''}
                                          </Typography>
                                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                            <Grid item xs={4}>
                                              <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Targets</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.targets||"—"}</Typography>
                                              </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Attacks</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.attacks??"—"}</Typography>
                                              </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                              <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Range</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.range||"—"}</Typography>
                                              </Box>
                                            </Grid>
                                          </Grid>
                                        </Paper>
                                      ));
                                    })()}
                                  </Stack>
                                </Box>
                              )}
                              
                              {shipIndex < group.length - 1 && <Divider sx={{ mt: 1 }} />}
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    );
                  } else {
                    // Individual ship card
                    const s = firstShip;
                const prow = s.loadout.prow;
                const hullList = (s.loadout.hull||[]);
                    
                return (
                      <Grid key={s.id} item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p:2, borderRadius:2, backgroundColor: '#1f1f1f' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Box>
                              <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{faction}</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'white' }}>{s.className}</Typography>
                              <Typography variant="caption" color="text.secondary">{def.size}</Typography>
                            </Box>
                            <Typography variant="body2" color="white" sx={{ fontWeight: 600, textAlign: 'right' }}>
                              {s.isFree ? "Free" : `${shipCost(def)} pts`}
                            </Typography>
                      </Stack>
                          <Divider sx={{ my: 1.5 }}/>
                          
                          {/* Stats */}
                          <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                            <Grid container spacing={1}>
                              {Object.entries(def.statline).map(([k,v])=> (
                                <Grid key={k} item xs={2.4}>
                                  <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{k}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{v}</Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Paper>
                          
                          {(def.prow.select > 0 && def.prow.options.length > 0) && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'white' }}>Prow</Typography>
                              {prow ? (
                                <Paper variant="outlined" sx={{ p: 1, backgroundColor: '#2e2e2e' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'white' }}>{prow.name}</Typography>
                                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Targets</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{prow.targets||"—"}</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Attacks</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{prow.attacks??"—"}</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Range</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{prow.range||"—"}</Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Paper>
                              ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                            </Box>
                          )}
                          {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0) || hullList.length > 0) && (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'white' }}>Hull</Typography>
                              <Stack spacing={0.5}>
                                {(() => {
                                  const all = [...def.hull.options, ...(def.beginsWith||[])];
                                  const groupedWeapons = groupWeapons(hullList, all);
                                  
                                  return groupedWeapons.map((weapon, i) => (
                                    <Paper key={i} variant="outlined" sx={{ p: 1, backgroundColor: '#2e2e2e' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'white' }}>
                                        {weapon.name}{weapon.count > 1 ? ` x${weapon.count}` : ''}
                                      </Typography>
                                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                        <Grid item xs={4}>
                                          <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Targets</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.targets||"—"}</Typography>
                                          </Box>
                                        </Grid>
                                        <Grid item xs={4}>
                                          <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Attacks</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.attacks??"—"}</Typography>
                                          </Box>
                                        </Grid>
                                        <Grid item xs={4}>
                                          <Box sx={{ textAlign: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Range</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{weapon.data.range||"—"}</Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    </Paper>
                                  ));
                                })()}
                              </Stack>
                            </Box>
                          )}
                    </Paper>
                  </Grid>
                );
                  }
                });
              })()}
            </Grid>
          </Box>
        )}

        {tab===2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight:900, color: 'white' }}>Fleets</Typography>
              <IconButton 
                color="primary" 
                onClick={() => {
                  startNewFleet();
                  setTab(0); // Go to Build tab
                }}
                sx={{ 
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.16)'
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            
            {!user ? (
              <Paper variant="outlined" sx={{ p:3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Sign In Required</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in with Google to save and access your fleets across all devices.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<LoginIcon/>}
                  onClick={signInWithGoogle}
                  size="large"
                >
                  Sign In with Google
                </Button>
              </Paper>
            ) : savedFleets.length === 0 ? (
              <Paper variant="outlined" sx={{ p:3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>No fleets yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Build a fleet and save it to see it here.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {savedFleets.map(fleet => (
                  <Grid key={fleet.id} item xs={12} md={6} lg={4}>
                    <Paper variant="outlined" sx={{ p:2, backgroundColor: '#1f1f1f', position: 'relative' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>{fleet.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fleet.faction} • {fleet.points} pts • {fleet.roster.length} ships
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton color="primary" size="small" onClick={()=>editFleet(fleet)}>
                            <EditIcon/>
                          </IconButton>
                          <IconButton color="success" size="small" onClick={()=>playFleet(fleet)}>
                            <PlayIcon/>
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Saved {new Date(fleet.savedAt).toLocaleDateString()}
                      </Typography>
                      
                      {/* Trash can in bottom right */}
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={()=>deleteFleet(fleet.id)}
                        sx={{ 
                          position: 'absolute', 
                          bottom: 8, 
                          right: 8 
                        }}
                      >
                        <DeleteIcon/>
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
