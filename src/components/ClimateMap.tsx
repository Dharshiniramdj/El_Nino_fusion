/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Globe, 
  Thermometer, 
  CloudRain, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Layers, 
  Wind,
  MousePointerClick,
  Maximize2,
  Minimize2,
  Compass,
  AlertTriangle,
  Info,
  Layers2
} from "lucide-react";
import { GlobalRegion, HistoricalRecord } from "../types";
import { 
  generateHistoricalImpactRecords, 
  EnsoImpactRecord, 
  HISTORICAL_ENSO_STATES,
  LOCATIONS
} from "../data/enso_impacts";
import regeneratedMapImage from "../assets/images/regenerated_image_1782530615946.jpg";

interface ClimateMapProps {
  regions: GlobalRegion[];
  activeRegion: GlobalRegion | null;
  onSelectRegion: (region: GlobalRegion) => void;
  activeOni: number;
  onChangeOni?: (oni: number) => void;
  historicalRecords?: HistoricalRecord[];
  onPlayStateChange?: (isPlaying: boolean) => void;
}

// Map Country/ID to consistent high-contrast colors
const LOCATION_COLORS: Record<string, string> = {
  california: "#eab308", // Yellow
  mexico: "#10b981",     // Emerald
  peru: "#f43f5e",       // Rose
  brazil_south: "#8b5cf6", // Violet
  kenya: "#3b82f6",      // Blue
  zimbabwe: "#f97316",   // Orange
  south_africa: "#06b6d4", // Cyan
  india_south: "#f59e0b", // Amber
  india_north: "#ef4444", // Red
  indonesia: "#ec4899",  // Pink
  vietnam: "#84cc16",    // Lime
  philippines: "#6366f1", // Indigo
  australia: "#14b8a6"   // Teal
};

export default function ClimateMap({
  regions,
  activeRegion,
  onSelectRegion,
  activeOni,
  onChangeOni,
  historicalRecords = [],
  onPlayStateChange
}: ClimateMapProps) {
  // Layer Mode: "impacts" (Realistic 2D map with legend) | "sst" (SST Anomaly) | "precipitation" (Rainfall anomaly)
  const [activeLayer, setActiveLayer] = useState<"impacts" | "sst" | "precipitation">("impacts");
  
  // Timeline States
  const [timelineYear, setTimelineYear] = useState<number>(1997);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Interactive Selection State
  const [selectedLocationId, setSelectedLocationId] = useState<string>("india_south");
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<GlobalRegion | null>(null);

  // Contextual Layers & Map Styles States
  const [showOceanCurrents, setShowOceanCurrents] = useState<boolean>(true);
  const [showAtmosphericPressure, setShowAtmosphericPressure] = useState<boolean>(true);
  const [showCloudCover, setShowCloudCover] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTradeWinds, setShowTradeWinds] = useState<boolean>(true);
  const [hoverCoordinates, setHoverCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [baseMapStyle, setBaseMapStyle] = useState<"satellite" | "political" | "realistic" | "enhanced" | "blueprint">("satellite");
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(true);

  // Zoom States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate complete ENSO Impact dataset (1950 - 2026)
  const ensoImpactRecords = useMemo(() => {
    return generateHistoricalImpactRecords();
  }, []);

  // Filter records by active timeline year
  const activeYearRecords = useMemo(() => {
    return ensoImpactRecords.filter(r => r.year === timelineYear);
  }, [ensoImpactRecords, timelineYear]);

  // Map representation of active records by location ID
  const activeRecordsMap = useMemo(() => {
    const map: Record<string, EnsoImpactRecord> = {};
    activeYearRecords.forEach(rec => {
      // Find matching location ID from metadata
      const loc = LOCATIONS.find(l => l.country === rec.country && l.name === rec.region);
      if (loc) {
        map[loc.id] = rec;
      } else {
        // Fallback checks
        const fallbackLoc = LOCATIONS.find(l => rec.region.toLowerCase().includes(l.id) || l.country.toLowerCase().includes(rec.country.toLowerCase()));
        if (fallbackLoc) {
          map[fallbackLoc.id] = rec;
        }
      }
    });
    return map;
  }, [activeYearRecords]);

  // Selected Record getter
  const selectedImpactRecord = useMemo(() => {
    return activeRecordsMap[selectedLocationId] || null;
  }, [activeRecordsMap, selectedLocationId]);

  // Active ENSO Status of current timeline year
  const activeEnsoState = useMemo(() => {
    return HISTORICAL_ENSO_STATES[timelineYear] || { type: "N", oni: 0.0, season: `${timelineYear}-${timelineYear+1}` };
  }, [timelineYear]);

  // Memoized top 20 most impacted regions globally based on activeYear/activeOni
  const top20ImpactedRegions = useMemo(() => {
    const hotspotsRaw = [
      { id: "piura", name: "Piura Region", country: "Peru", lat: -5.19, lng: -80.63, tempCoef: 0.95, precipCoef: 90, baseTemp: 24.0, basePrecip: 35, impactElNino: "Severe estuarine flooding & Humboldt Current nutrient decay", impactLaNina: "Coastal cooling, dry anomalies & high anchovy biomass" },
      { id: "kalimantan", name: "East Kalimantan", country: "Indonesia", lat: -0.5, lng: 116.5, tempCoef: 0.45, precipCoef: -50, baseTemp: 27.5, basePrecip: 210, impactElNino: "Peatland mega-wildfires, dense toxic smog & rice crop failure", impactLaNina: "Torrential monsoon rainfall, flash floods & mudslides" },
      { id: "queensland", name: "Queensland Coast", country: "Australia", lat: -19.5, lng: 145.2, tempCoef: 0.55, precipCoef: -40, baseTemp: 23.5, basePrecip: 85, impactElNino: "Coral reef bleaching, bushfires & Murray-Darling basin depletion", impactLaNina: "Tropical cyclone landfalls, coastal flooding & high reservoirs" },
      { id: "mekong", name: "Mekong Delta", country: "Vietnam", lat: 10.2, lng: 105.8, tempCoef: 0.4, precipCoef: -35, baseTemp: 27.2, basePrecip: 190, impactElNino: "Salinity intrusion, severe river drought & coffee crop stress", impactLaNina: "Heavy downstream river swelling & paddy field inundation" },
      { id: "harare", name: "Masvingo Province", country: "Zimbabwe", lat: -20.0, lng: 30.8, tempCoef: 0.35, precipCoef: -45, baseTemp: 21.2, basePrecip: 70, impactElNino: "Hydrological drought, reservoir exhaustion & crop shortfalls", impactLaNina: "Favorable rainfall, elevated groundwater & robust grain yields" },
      { id: "rift_valley", name: "Rift Valley Province", country: "Kenya", lat: -0.5, lng: 36.0, tempCoef: 0.25, precipCoef: 45, baseTemp: 22.8, basePrecip: 75, impactElNino: "Torrential short-rains, landslides & high lake level swells", impactLaNina: "Arid pasture failure, high cattle mortality & severe drought" },
      { id: "central_valley", name: "Central Valley", country: "USA (California)", lat: 37.0, lng: -120.0, tempCoef: -0.2, precipCoef: 35, baseTemp: 18.5, basePrecip: 95, impactElNino: "Heavy winter atmospheric river flooding & mudslide triggers", impactLaNina: "Extended snowpack drought & record forest fire fuel-drying" },
      { id: "amazonas", name: "Amazonas State", country: "Brazil", lat: -3.4, lng: -62.2, tempCoef: 0.5, precipCoef: -30, baseTemp: 26.8, basePrecip: 220, impactElNino: "Amazon river depth drop, forest canopy drying & carbon loss", impactLaNina: "Saturated soils, high Amazon river swells & localized flooding" },
      { id: "karnataka", name: "South Karnataka", country: "India", lat: 13.5, lng: 75.8, tempCoef: 0.3, precipCoef: -25, baseTemp: 26.5, basePrecip: 110, impactElNino: "Severe summer monsoon delay, reservoir storage drops & heatwaves", impactLaNina: "Heavy rain events, active local reservoir filling & high yields" },
      { id: "luzon", name: "Luzon Western Coast", country: "Philippines", lat: 15.8, lng: 120.3, tempCoef: 0.4, precipCoef: -30, baseTemp: 27.0, basePrecip: 200, impactElNino: "Substandard monsoon rains, crop dry spells & urban water limits", impactLaNina: "Frequent super typhoon landfalls & pluvial flooding" },
      { id: "galapagos", name: "Galapagos Islands", country: "Ecuador", lat: -0.9, lng: -90.9, tempCoef: 1.0, precipCoef: 75, baseTemp: 23.0, basePrecip: 45, impactElNino: "Extreme marine heatwaves, kelp forest death & bird starvation", impactLaNina: "Cold upwelling surges, nutrient abundance & surging sea life" },
      { id: "somalia", name: "Gedo Region", country: "Somalia", lat: 2.5, lng: 42.5, tempCoef: 0.3, precipCoef: 50, baseTemp: 28.5, basePrecip: 40, impactElNino: "Pluvial flash flooding, riverbank breaches & livestock disease", impactLaNina: "Severe multi-season drought, dry wells & humanitarian crisis" },
      { id: "murray_darling", name: "Murray-Darling Basin", country: "Australia (South)", lat: -34.0, lng: 142.0, tempCoef: 0.5, precipCoef: -35, baseTemp: 20.0, basePrecip: 45, impactElNino: "Irrigation caps, toxic blue-green algae & low river discharge", impactLaNina: "River basin replenishment, overflowing billabongs & duck breeding" },
      { id: "guayaquil", name: "Guayaquil Estuary", country: "Ecuador", lat: -2.2, lng: -79.9, tempCoef: 0.8, precipCoef: 80, baseTemp: 25.5, basePrecip: 80, impactElNino: "Urban storm drain overload, structural flooding & shrimp damage", impactLaNina: "Colder seawater & dry coastal breezes" },
      { id: "mpumalanga", name: "Mpumalanga Highveld", country: "South Africa", lat: -26.0, lng: 29.5, tempCoef: 0.3, precipCoef: -30, baseTemp: 19.0, basePrecip: 65, impactElNino: "Maize crop heat stress, water constraints & power cooling cuts", impactLaNina: "Rejuvenated water tables & healthy grazing conditions" },
      { id: "sonora", name: "Sonora Desert Coast", country: "Mexico", lat: 28.0, lng: -111.0, tempCoef: -0.25, precipCoef: 30, baseTemp: 22.0, basePrecip: 30, impactElNino: "Increased winter rainfall, greening desert & Gulf storm swells", impactLaNina: "Intensified arid drought, crop water limits & livestock losses" },
      { id: "sarawak", name: "Sarawak Coast", country: "Malaysia", lat: 2.5, lng: 112.5, tempCoef: 0.4, precipCoef: -30, baseTemp: 27.2, basePrecip: 240, impactElNino: "Extended dry seasons, smoke haze & reduced palm oil yields", impactLaNina: "Wet monsoon surges, logging halts & flash soil washes" },
      { id: "british_columbia", name: "Columbia River Basin", country: "Canada (BC)", lat: 50.0, lng: -118.0, tempCoef: 0.5, precipCoef: -18, baseTemp: 10.5, basePrecip: 110, impactElNino: "Warmer, drier winters, minimal snowpack & low summer hydro", impactLaNina: "Heavier mountain snowpacks, avalanche risks & high hydro-power" },
      { id: "chiba", name: "Kanto Coast", country: "Japan", lat: 35.5, lng: 140.2, tempCoef: 0.35, precipCoef: 15, baseTemp: 15.0, basePrecip: 130, impactElNino: "Unseasonably warm winter, high relative humidity & jet shifts", impactLaNina: "Colder, crisp winter breezes & heavy Sea of Japan snow dumps" },
      { id: "chile_central", name: "Central Valley Chile", country: "Chile", lat: -33.5, lng: -70.7, tempCoef: -0.2, precipCoef: 40, baseTemp: 16.0, basePrecip: 55, impactElNino: "Torrential Andean rainfall, mudslides & high reservoir fills", impactLaNina: "Aggravated dry cycles, glacier retreat & hydro-power constraints" }
    ];

    const activeOniFloat = activeEnsoState.oni;
    const isWarm = activeOniFloat >= 0;

    return hotspotsRaw.map(h => {
      const tempAnom = Number((h.tempCoef * activeOniFloat).toFixed(2));
      const precipShift = Math.round(h.precipCoef * activeOniFloat);
      
      const absOni = Math.abs(activeOniFloat);
      const intensity = absOni / 3.0;
      const score = Math.min(100, Math.round(intensity * 100 * (Math.abs(h.tempCoef) * 0.5 + Math.abs(h.precipCoef) / 100 * 0.5) + (absOni > 0.5 ? 15 : 0)));
      
      let severity: "Low" | "Moderate" | "High" | "Extreme" = "Low";
      if (score >= 70) severity = "Extreme";
      else if (score >= 45) severity = "High";
      else if (score >= 20) severity = "Moderate";

      const impact = isWarm ? h.impactElNino : h.impactLaNina;

      return {
        ...h,
        tempAnomaly: tempAnom,
        precipAnomaly: precipShift,
        score,
        severity,
        impact
      };
    }).sort((a, b) => b.score - a.score);
  }, [activeEnsoState]);

  // Synchronization with App state on slider modifications
  useEffect(() => {
    if (onChangeOni) {
      onChangeOni(activeEnsoState.oni);
    }
  }, [timelineYear, activeEnsoState, onChangeOni]);

  // Timeline auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineYear((prev) => {
          let next = prev + 1;
          if (next > 2025) next = 1950;
          return next;
        });
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  // Propagate play state to parent
  useEffect(() => {
    if (onPlayStateChange) {
      onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange]);

  // Zoom map handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Map dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel === 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      
      // Boundary check for panning
      const maxPanX = (zoomLevel - 1) * 200;
      const maxPanY = (zoomLevel - 1) * 100;
      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY))
      });
      return;
    }

    // Real-time GIS coordinate decoding under cursor
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
      const pctX = (mouseX / rect.width) * 100;
      const pctY = (mouseY / rect.height) * 100;
      
      const calculatedLng = (pctX / 100) * 360 - 180;
      const calculatedLat = 90 - (pctY / 100) * 180;
      
      setHoverCoordinates({
        lat: Math.max(-90, Math.min(90, calculatedLat)),
        lng: Math.max(-180, Math.min(180, calculatedLng))
      });
    } else {
      setHoverCoordinates(null);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    setHoverCoordinates(null);
  };

  // Equirectangular projection mapping
  const getCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  // Human ENSO names helper
  const getEnsoFullLabel = (type: string) => {
    switch (type) {
      case "VSE": return "Very Strong El Niño";
      case "SE": return "Strong El Niño";
      case "ME": return "Moderate El Niño";
      case "WE": return "Weak El Niño";
      case "WL": return "Weak La Niña";
      case "ML": return "Moderate La Niña";
      case "SL": return "Strong La Niña";
      default: return "Neutral Phase";
    }
  };

  return (
    <div id="climate-world-map-dashboard" className="bg-[#0b1021] border border-slate-900 rounded-3xl p-6 shadow-2xl transition-all duration-300">
      <style>{`
        @keyframes current-flow-west {
          to {
            stroke-dashoffset: 20;
          }
        }
        @keyframes current-flow-east {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes pressure-pulse {
          0% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.65; }
          100% { transform: scale(1); opacity: 0.35; }
        }
        @keyframes cloud-drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(2px, 1px); }
          100% { transform: translate(-1px, -1px); }
        }
      `}</style>
      
      {/* HEADER BAR AND MODE SELECTORS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-4.5 h-4.5 animate-spin-slow" />
            </span>
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              Spatio-Temporal Climate Impact Analysis Map
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Interactive physical world matrix analyzing global teleconnection hotspots, precipitation shifts, and localized ENSO hazard profiles.
          </p>
        </div>

        {/* Dynamic Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#030712] p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveLayer("impacts");
                setSelectedLocationId("india_south");
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLayer === "impacts" 
                  ? "bg-slate-800 text-cyan-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🗺️ ENSO Impacts
            </button>
            <button
              onClick={() => {
                setActiveLayer("sst");
                // Select default region
                const def = regions.find(r => r.id === "eq_pacific");
                if (def) onSelectRegion(def);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLayer === "sst" 
                  ? "bg-slate-800 text-rose-450 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🌡️ SST Anomalies
            </button>
            <button
              onClick={() => {
                setActiveLayer("precipitation");
                const def = regions.find(r => r.id === "se_asia");
                if (def) onSelectRegion(def);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLayer === "precipitation" 
                  ? "bg-slate-800 text-sky-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🌧️ Rainfall Shifts
            </button>
          </div>

          {/* Current year badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timelineYear} ({activeEnsoState.season})</span>
          </div>
        </div>
      </div>

      {/* CORE ANALYSIS WORKSPACE GRID (MAP + INTERACTIVE LEGEND) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: PHYSICAL SATELLITE MAP (8/12) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          <div className="relative w-full aspect-[2/1] rounded-2xl border border-slate-800/80 bg-[#020510] overflow-hidden select-none group shadow-inner">
            
            {/* Map Drag / Grab Overlay */}
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? (isDragging.current ? "grabbing" : "grab") : "default"
              }}
              className="absolute inset-0 w-full h-full transition-transform duration-200 ease-out z-0"
            >
              {/* Realistic High-Fidelity Satellite Earth Map Layer */}
              <img 
                src={
                  baseMapStyle === "political"
                    ? "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/World_map_blank_black_white.svg/1024px-World_map_blank_black_white.svg.png"
                    : regeneratedMapImage
                } 
                className={`w-full h-full object-cover pointer-events-none select-none transition-all duration-700 ${
                  baseMapStyle === "satellite"
                    ? "opacity-100 brightness-[1.05] contrast-[1.1] saturate-[1.15]"
                    : baseMapStyle === "political"
                      ? "opacity-95 brightness-[0.75] contrast-[1.45] invert-[92%] hue-rotate-[195deg] saturate-[1.4]"
                      : baseMapStyle === "realistic" 
                        ? "opacity-40 brightness-[0.55] contrast-[1.2] saturate-[1.25] grayscale-[10%]" 
                        : baseMapStyle === "enhanced" 
                          ? "opacity-60 brightness-[0.75] contrast-[1.4] saturate-[1.85] hue-rotate-[12deg]" 
                          : "opacity-25 brightness-[0.4] contrast-[1.0] saturate-[0.45] invert-[88%] hue-rotate-[185deg]"
                }`}
                referrerPolicy="no-referrer"
                alt="Physical World Map"
              />

              {/* GEOSPATIAL GRATICULES (LATITUDE / LONGITUDE GRID) */}
              {showGrid && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <g stroke="rgba(34, 211, 238, 0.05)" strokeWidth="0.1" fill="none">
                    {/* Meridians (Longitudes every 30°) */}
                    <line x1="8.33" y1="0" x2="8.33" y2="100" strokeDasharray="1,4" />
                    <line x1="16.67" y1="0" x2="16.67" y2="100" strokeDasharray="1,4" />
                    <line x1="25.0" y1="0" x2="25.0" y2="100" strokeDasharray="1,4" />
                    <line x1="33.33" y1="0" x2="33.33" y2="100" strokeDasharray="1,4" />
                    <line x1="41.67" y1="0" x2="41.67" y2="100" strokeDasharray="1,4" />
                    <line x1="50.0" y1="0" x2="50.0" y2="100" stroke="rgba(34, 211, 238, 0.2)" strokeDasharray="1,2" /> {/* Prime Meridian */}
                    <line x1="58.33" y1="0" x2="58.33" y2="100" strokeDasharray="1,4" />
                    <line x1="66.67" y1="0" x2="66.67" y2="100" strokeDasharray="1,4" />
                    <line x1="75.0" y1="0" x2="75.0" y2="100" strokeDasharray="1,4" />
                    <line x1="83.33" y1="0" x2="83.33" y2="100" strokeDasharray="1,4" />
                    <line x1="91.67" y1="0" x2="91.67" y2="100" strokeDasharray="1,4" />

                    {/* Parallels (Latitudes every 15° & Key Climatic Bounds) */}
                    <line x1="0" y1="13.0" x2="100" y2="13.0" stroke="rgba(56, 189, 248, 0.1)" strokeDasharray="2,2" /> {/* Arctic Circle */}
                    <line x1="0" y1="16.67" x2="100" y2="16.67" strokeDasharray="1,4" /> {/* 60°N */}
                    <line x1="0" y1="33.33" x2="100" y2="33.33" strokeDasharray="1,4" /> {/* 30°N */}
                    <line x1="0" y1="36.9" x2="100" y2="36.9" stroke="rgba(244, 63, 94, 0.1)" strokeDasharray="3,3" /> {/* Tropic of Cancer */}
                    <line x1="0" y1="50.0" x2="100" y2="50.0" stroke="rgba(34, 211, 238, 0.3)" strokeDasharray="3,1" /> {/* Equator */}
                    <line x1="0" y1="63.1" x2="100" y2="63.1" stroke="rgba(244, 63, 94, 0.1)" strokeDasharray="3,3" /> {/* Tropic of Capricorn */}
                    <line x1="0" y1="66.67" x2="100" y2="66.67" strokeDasharray="1,4" /> {/* 30°S */}
                    <line x1="0" y1="83.33" x2="100" y2="83.33" strokeDasharray="1,4" /> {/* 60°S */}
                    <line x1="0" y1="87.0" x2="100" y2="87.0" stroke="rgba(56, 189, 248, 0.1)" strokeDasharray="2,2" /> {/* Antarctic Circle */}
                  </g>
                </svg>
              )}

              {/* DYNAMIC PACIFIC TRADE WINDS SYSTEM */}
              {showTradeWinds && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {activeOni < 0.5 ? (
                    /* Normal/La Niña: Strong Easterlies (Right-to-Left Trades) */
                    <g stroke="rgba(34, 211, 238, 0.35)" strokeWidth="0.25" fill="none">
                      <path d="M 96,48 C 88,46 86,47 78,48" strokeDasharray="2,4" style={{ animation: "current-flow-west 3s linear infinite" }} />
                      <path d="M 96,52 C 88,54 86,53 78,52" strokeDasharray="2,4" style={{ animation: "current-flow-west 3s linear infinite" }} />
                      <path d="M 28,48 C 20,46 16,47 4,48" strokeDasharray="2,4" style={{ animation: "current-flow-west 3.5s linear infinite" }} />
                      <path d="M 28,52 C 20,54 16,53 4,52" strokeDasharray="2,4" style={{ animation: "current-flow-west 3.5s linear infinite" }} />
                    </g>
                  ) : (
                    /* El Niño: Weakened/Reversed Westerly Wind Bursts (Left-to-Right) */
                    <g stroke="rgba(244, 63, 94, 0.4)" strokeWidth="0.25" fill="none">
                      <path d="M 78,48 C 86,47 88,46 96,48" strokeDasharray="2,4" style={{ animation: "current-flow-east 5s linear infinite" }} />
                      <path d="M 78,52 C 86,53 88,54 96,52" strokeDasharray="2,4" style={{ animation: "current-flow-east 5s linear infinite" }} />
                      <path d="M 4,48 C 16,47 20,46 28,48" strokeDasharray="2,4" style={{ animation: "current-flow-east 5s linear infinite" }} />
                      <path d="M 4,52 C 16,53 20,54 28,52" strokeDasharray="2,4" style={{ animation: "current-flow-east 5s linear infinite" }} />
                    </g>
                  )}
                </svg>
              )}

              {/* LAYER 1: ENSO PHYSICAL IMPACT MARKERS */}
              {activeLayer === "impacts" && LOCATIONS.map((loc) => {
                const coords = getCoordinates(loc.lat, loc.lng);
                const color = LOCATION_COLORS[loc.id] || "#06b6d4";
                const isSelected = selectedLocationId === loc.id;
                const isHovered = hoveredLocationId === loc.id;
                const record = activeRecordsMap[loc.id];
                
                if (!record) return null;

                return (
                  <div
                    key={`loc-hotspot-${loc.id}`}
                    style={{ left: coords.x, top: coords.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/hotspot cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocationId(loc.id);
                    }}
                    onMouseEnter={() => setHoveredLocationId(loc.id)}
                    onMouseLeave={() => setHoveredLocationId(null)}
                  >
                    {/* Ring Pulse outer glow */}
                    <div 
                      style={{ 
                        borderColor: color, 
                        boxShadow: `0 0 16px ${color}50` 
                      }}
                      className={`absolute inset-0 -m-3 rounded-full border opacity-50 transition-all duration-300 ${
                        isSelected ? "scale-125 animate-ping opacity-70" : "scale-100 group-hover/hotspot:scale-110"
                      }`}
                    />

                    {/* Solid Dot core */}
                    <div 
                      style={{ backgroundColor: color }}
                      className={`w-3.5 h-3.5 rounded-full border border-white transition-all duration-300 shadow-md ${
                        isSelected ? "ring-[5px] ring-white/30 scale-125" : "hover:scale-110"
                      }`}
                    />

                    {/* HIGH-CONTRAST COUNTRY TAG (From Screenshot) */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 select-none">
                      <div className="bg-white border border-slate-350 shadow-md rounded-md px-2 py-0.5 whitespace-nowrap">
                        <span className="text-[10px] font-sans font-extrabold text-slate-900 tracking-tight">
                          {loc.country}
                        </span>
                      </div>
                    </div>

                    {/* Quick Mini Hover Information Overlay */}
                    {isHovered && !isSelected && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/95 text-slate-100 text-[10px] py-1 px-2.5 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap z-50 font-mono">
                        <div className="font-bold text-white mb-0.5">{record.region}</div>
                        <div>Anom: {record.temperatureAnomaly >= 0 ? "+" : ""}{record.temperatureAnomaly}°C</div>
                        <div className="text-slate-400 text-[9px] mt-0.5">{record.impactCategory}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* LAYER 2 & 3: SCIENTIFIC SST & PRECIPITATION MAP HEAT GLOW OVERLAYS */}
              {activeLayer !== "impacts" && regions.map((region) => {
                const coords = getCoordinates(region.lat, region.lng);
                const isTempLayer = activeLayer === "sst";
                const anomalyValue = isTempLayer 
                  ? region.tempCoef * activeOni 
                  : region.precipCoef * activeOni;
                
                if (Math.abs(anomalyValue) < 0.05) return null;

                // Dynamic background gradient and diameter
                let gradientBg = "";
                let sizePx = 0;
                
                if (isTempLayer) {
                  // Temperature anomalies typically range from -3.0°C to +3.0°C.
                  const intensity = Math.min(0.65, Math.abs(anomalyValue) * 0.22);
                  const color = anomalyValue > 0 ? "239, 68, 68" : "59, 130, 246"; // Red (warm) vs Blue (cool)
                  gradientBg = `radial-gradient(circle, rgba(${color}, ${intensity}) 0%, rgba(${color}, 0) 70%)`;
                  // Size should be proportional to anomaly
                  sizePx = Math.max(40, Math.min(220, 60 + Math.abs(anomalyValue) * 50));
                } else {
                  // Precipitation anomalies typically range from -100% to +100%.
                  const intensity = Math.min(0.65, Math.abs(anomalyValue) / 100);
                  const color = anomalyValue > 0 ? "6, 182, 212" : "249, 115, 22"; // Cyan (pluvial/wet) vs Orange (drought/dry)
                  gradientBg = `radial-gradient(circle, rgba(${color}, ${intensity}) 0%, rgba(${color}, 0) 70%)`;
                  // Size should be proportional to precipitation shift
                  sizePx = Math.max(40, Math.min(220, 60 + Math.abs(anomalyValue) * 1.0));
                }

                return (
                  <div
                    key={`science-glow-${region.id}`}
                    style={{ 
                      left: coords.x, 
                      top: coords.y,
                      width: `${sizePx}px`,
                      height: `${sizePx}px`,
                      background: gradientBg,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-10 mix-blend-screen animate-pulse duration-[5000ms] opacity-90"
                  />
                );
              })}

              {/* LAYER 2 & 3: SCIENTIFIC SST & PRECIPITATION MAP NODES */}
              {activeLayer !== "impacts" && regions.map((region) => {
                const coords = getCoordinates(region.lat, region.lng);
                const isSelected = activeRegion?.id === region.id;
                const isHovered = hoveredRegion?.id === region.id;
                
                // Calculations based on parent factors
                const isTempLayer = activeLayer === "sst";
                const anomalyValue = isTempLayer 
                  ? region.tempCoef * activeOni 
                  : region.precipCoef * activeOni;
                
                // Color codes
                let nodeColor = "#94a3b8"; // Neutral
                if (isTempLayer) {
                  if (anomalyValue >= 0.5) nodeColor = "#ef4444"; // Warm red
                  else if (anomalyValue <= -0.5) nodeColor = "#3b82f6"; // Cool blue
                } else {
                  if (anomalyValue >= 10) nodeColor = "#06b6d4"; // Pluvial cyan
                  else if (anomalyValue <= -10) nodeColor = "#f97316"; // Drought orange
                }

                return (
                  <div
                    key={`science-node-${region.id}`}
                    style={{ left: coords.x, top: coords.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRegion(region);
                    }}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <div 
                      style={{ borderColor: nodeColor }}
                      className={`absolute inset-0 -m-3 rounded-full border opacity-50 transition-all ${
                        isSelected ? "scale-125 animate-ping" : "scale-100"
                      }`}
                    />

                    <div 
                      style={{ backgroundColor: nodeColor }}
                      className={`w-4 h-4 rounded-full border border-[#040815] flex items-center justify-center transition-all ${
                        isSelected ? "ring-[4px] ring-white/20 scale-125" : "hover:scale-115"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    {/* Scientific text tag */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 whitespace-nowrap shadow-md z-30">
                      <span className="text-[8px] font-mono font-bold text-slate-350">
                        {region.name.replace(/ \([^)]*\)/, "")}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* HIGH-FIDELITY SPATIAL CONTEXTUAL LAYER OVERLAYS */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <filter id="cloud-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" />
                  </filter>
                </defs>

                {/* 1. OCEAN CURRENTS LAYERS */}
                {showOceanCurrents && (
                  <g>
                    {/* Equatorial Current: Westward (right-to-left) in Normal/La Niña, Eastward/sluggish in El Niño */}
                    <path 
                      d="M 83.3,25.0 L 26.4,25.0" 
                      fill="none" 
                      stroke={activeOni >= 0.5 ? "rgba(244, 63, 94, 0.55)" : "rgba(34, 211, 238, 0.65)"} 
                      strokeWidth="0.8" 
                      strokeDasharray="4,6"
                      style={{
                        animation: activeOni >= 0.5 
                          ? "current-flow-east 5s linear infinite" 
                          : "current-flow-west 3s linear infinite"
                      }}
                    />
                    
                    {/* Gulf Stream (Warm Red) */}
                    <path 
                      d="M 27.7,20.0 Q 31.9,15.2 43.1,11.6" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 4s linear infinite" }}
                    />
                    
                    {/* Kuroshio Current (Warm Red) */}
                    <path 
                      d="M 83.9,21.6 Q 84.7,18.0 89.4,14.4" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 4s linear infinite" }}
                    />
                    
                    {/* East Australian Current (Warm Red) */}
                    <path 
                      d="M 91.7,29.1 Q 92.0,32.0 92.5,34.7" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 5s linear infinite" }}
                    />

                    {/* Humboldt Current (Cold Blue) */}
                    <path 
                      d="M 27.7,36.1 Q 32.0,30.5 27.2,26.3" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 4s linear infinite" }}
                    />
                    
                    {/* California Current (Cold Blue) */}
                    <path 
                      d="M 16.8,11.1 Q 15.0,16.5 17.0,21.5" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 4s linear infinite" }}
                    />
                    
                    {/* Benguela Current (Cold Blue) */}
                    <path 
                      d="M 54.0,38.1 Q 52.0,33.5 54.5,28.5" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="0.7" 
                      strokeDasharray="3,5"
                      style={{ animation: "current-flow-west 5.5s linear infinite" }}
                    />
                  </g>
                )}

                {/* 2. ATMOSPHERIC PRESSURE CONCENTRIC ISOBARS */}
                {showAtmosphericPressure && (
                  <g>
                    {/* Tahiti Isobars */}
                    <circle cx="8.5" cy="29.7" r="1.5" fill="none" stroke={activeOni >= 0.5 ? "rgba(244, 63, 94, 0.15)" : "rgba(56, 189, 248, 0.15)"} strokeWidth="0.2" strokeDasharray="1,1" />
                    <circle cx="8.5" cy="29.7" r="3.0" fill="none" stroke={activeOni >= 0.5 ? "rgba(244, 63, 94, 0.25)" : "rgba(56, 189, 248, 0.25)"} strokeWidth="0.2" strokeDasharray="2,2" className="animate-[pressure-pulse_5s_infinite]" />
                    <circle cx="8.5" cy="29.7" r="4.5" fill="none" stroke={activeOni >= 0.5 ? "rgba(244, 63, 94, 0.15)" : "rgba(56, 189, 248, 0.15)"} strokeWidth="0.2" className="animate-[pressure-pulse_8s_infinite]" />

                    {/* Darwin Isobars */}
                    <circle cx="86.3" cy="28.4" r="1.5" fill="none" stroke={activeOni >= 0.5 ? "rgba(56, 189, 248, 0.15)" : "rgba(244, 63, 94, 0.15)"} strokeWidth="0.2" strokeDasharray="1,1" />
                    <circle cx="86.3" cy="28.4" r="3.0" fill="none" stroke={activeOni >= 0.5 ? "rgba(56, 189, 248, 0.25)" : "rgba(244, 63, 94, 0.25)"} strokeWidth="0.2" strokeDasharray="2,2" className="animate-[pressure-pulse_6s_infinite]" />
                    <circle cx="86.3" cy="28.4" r="4.5" fill="none" stroke={activeOni >= 0.5 ? "rgba(56, 189, 248, 0.15)" : "rgba(244, 63, 94, 0.15)"} strokeWidth="0.2" className="animate-[pressure-pulse_7s_infinite]" />

                    {/* H/L Central Indicators */}
                    <g fontStyle="normal" fontWeight="bold" fontFamily="monospace" fontSize="2" textAnchor="middle" dominantBaseline="central">
                      {/* Tahiti pressure cell indicator */}
                      <g transform="translate(8.5, 29.7)">
                        <circle r="1.3" fill="#030712" stroke={activeOni >= 0.5 ? "#f43f5e" : "#38bdf8"} strokeWidth="0.25" />
                        <text fill={activeOni >= 0.5 ? "#f43f5e" : "#38bdf8"} dy="0.3">
                          {activeOni >= 0.5 ? "L" : "H"}
                        </text>
                      </g>
                      {/* Darwin pressure cell indicator */}
                      <g transform="translate(86.3, 28.4)">
                        <circle r="1.3" fill="#030712" stroke={activeOni >= 0.5 ? "#38bdf8" : "#f43f5e"} strokeWidth="0.25" />
                        <text fill={activeOni >= 0.5 ? "#38bdf8" : "#f43f5e"} dy="0.3">
                          {activeOni >= 0.5 ? "H" : "L"}
                        </text>
                      </g>
                    </g>
                  </g>
                )}

                {/* 3. CLOUD COVER SIMULATION (Convective clusters shifting with ONI) */}
                {showCloudCover && (
                  <g fill="rgba(255, 255, 255, 0.15)" filter="url(#cloud-blur)">
                    {activeOni >= 0.5 ? (
                      /* El Niño: cloud cover clusters in Eastern and Central Pacific */
                      <g className="animate-[cloud-drift_25s_infinite_alternate]">
                        <ellipse cx="25" cy="25" rx="8" ry="3" />
                        <ellipse cx="38" cy="24" rx="10" ry="4" />
                        <ellipse cx="50" cy="25" rx="9" ry="3.5" />
                        <ellipse cx="12" cy="26" rx="4" ry="1.5" />
                        <ellipse cx="75" cy="23" rx="3" ry="1" />
                      </g>
                    ) : activeOni <= -0.5 ? (
                      /* La Niña: clouds concentrate over Maritime Continent/Australia */
                      <g className="animate-[cloud-drift_20s_infinite_alternate]">
                        <ellipse cx="78" cy="23" rx="11" ry="4" />
                        <ellipse cx="88" cy="26" rx="9" ry="3" />
                        <ellipse cx="68" cy="24" rx="7" ry="2.5" />
                        <ellipse cx="15" cy="25" rx="2" ry="1" />
                        <ellipse cx="32" cy="27" rx="3" ry="1" />
                      </g>
                    ) : (
                      /* Neutral: steady clouds distributed along Intertropical Convergence Zone */
                      <g className="animate-[cloud-drift_22s_infinite_alternate]">
                        <ellipse cx="15" cy="25" rx="5" ry="1.8" />
                        <ellipse cx="35" cy="25" rx="7" ry="2" />
                        <ellipse cx="55" cy="25" rx="6" ry="1.8" />
                        <ellipse cx="78" cy="24" rx="9" ry="2.5" />
                      </g>
                    )}
                  </g>
                )}
              </svg>

            </div>

            {/* ATMOSPHERIC CONVECTIVE WINDS OVERLAY SYSTEM */}
            {activeLayer !== "impacts" && (
              <div className="absolute inset-0 pointer-events-none z-10 opacity-40">
                <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                  {/* Equator line */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(244, 63, 94, 0.15)" strokeDasharray="2,5" strokeWidth="0.2" />
                  
                  {/* Jet streams arrows */}
                  <path 
                    d="M10,20 Q50,15 90,20" 
                    fill="none" 
                    stroke={activeOni >= 1.0 ? "rgba(239, 68, 68, 0.5)" : "rgba(34, 211, 238, 0.4)"} 
                    strokeWidth="0.3" 
                    strokeDasharray="2,8"
                    style={{
                      animation: activeOni >= 1.0 ? "wind-flow 4s linear infinite" : "wind-flow 8s linear infinite"
                    }}
                  />
                  <path 
                    d="M10,32 Q50,37 90,32" 
                    fill="none" 
                    stroke={activeOni <= -1.0 ? "rgba(59, 130, 246, 0.5)" : "rgba(34, 211, 238, 0.4)"} 
                    strokeWidth="0.3" 
                    strokeDasharray="2,8"
                    style={{
                      animation: "wind-flow 6s linear infinite"
                    }}
                  />
                </svg>
              </div>
            )}

            {/* MAP NAVIGATION PANEL CONTROLS (Top-Left overlay, Mapbox style) */}
            <div className="absolute top-4 left-4 z-30 flex flex-col bg-slate-950/90 border border-slate-850 p-1 rounded-xl shadow-xl gap-1">
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-45 transition-colors cursor-pointer"
                title="Zoom In"
              >
                ＋
              </button>
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-45 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                －
              </button>
              <button
                onClick={handleResetZoom}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer"
                title="Recenter Map"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* REAL-TIME GEOSPATIAL COORDINATES HUD PILL (Bottom-Left overlay) */}
            {hoverCoordinates && (
              <div className="absolute bottom-4 left-4 z-30 bg-slate-950/90 border border-slate-850 px-2.5 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-slate-350 pointer-events-none backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[9px] font-bold tracking-wider text-slate-200">
                  LAT: {Math.abs(hoverCoordinates.lat).toFixed(4)}°{hoverCoordinates.lat >= 0 ? "N" : "S"}
                </span>
                <span className="text-slate-700 font-mono text-[9px]">|</span>
                <span className="font-mono text-[9px] font-bold tracking-wider text-slate-200">
                  LNG: {Math.abs(hoverCoordinates.lng).toFixed(4)}°{hoverCoordinates.lng >= 0 ? "E" : "W"}
                </span>
              </div>
            )}

            {/* FLOATING GEOSPATIAL MAP CONTROL CENTER (Top-Right overlay) */}
            <div id="geospatial-layer-controller" className="absolute top-4 right-4 z-30 bg-[#040815]/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-sm select-none text-slate-200 transition-all duration-300 w-56 md:w-64">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-slate-100 text-[10px] uppercase tracking-wider">Geospatial Controls</span>
                </div>
                <button 
                  onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={isControlsExpanded ? "Collapse Controls" : "Expand Controls"}
                >
                  <span className="text-xs">{isControlsExpanded ? "▲" : "▼"}</span>
                </button>
              </div>

              {isControlsExpanded ? (
                <div className="space-y-3.5 animate-fade-in">
                  
                  {/* CONTEXTUAL LAYER TOGGLES */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-widest block">Contextual Overlays</span>
                    
                    {/* 1. Ocean Currents Toggle */}
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌊</span>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-200 block leading-tight">Ocean Currents</span>
                          <span className="text-[8px] text-slate-500 block leading-none mt-0.5">Equatorial stream flows</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showOceanCurrents}
                        onChange={(e) => setShowOceanCurrents(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400 cursor-pointer"
                      />
                    </label>

                    {/* 2. Atmospheric Pressure Toggle */}
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌀</span>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-200 block leading-tight">Walker Pressure (H/L)</span>
                          <span className="text-[8px] text-slate-500 block leading-none mt-0.5">Pacific isobar nodes</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showAtmosphericPressure}
                        onChange={(e) => setShowAtmosphericPressure(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400 cursor-pointer"
                      />
                    </label>

                    {/* 3. Cloud Cover Toggle */}
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">☁️</span>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-200 block leading-tight">Convective Clouds</span>
                          <span className="text-[8px] text-slate-500 block leading-none mt-0.5">Dynamic tropical drift</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showCloudCover}
                        onChange={(e) => setShowCloudCover(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400 cursor-pointer"
                      />
                    </label>

                    {/* 4. Coordinate Grid Toggle */}
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌐</span>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-200 block leading-tight">Coordinate Grid</span>
                          <span className="text-[8px] text-slate-500 block leading-none mt-0.5">Lat / Lng graticules</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400 cursor-pointer"
                      />
                    </label>

                    {/* 5. Pacific Trade Winds Toggle */}
                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-850 hover:bg-slate-900/80 hover:border-slate-800 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💨</span>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-200 block leading-tight">Pacific Trade Winds</span>
                          <span className="text-[8px] text-slate-500 block leading-none mt-0.5">ENSO trade wind flows</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showTradeWinds}
                        onChange={(e) => setShowTradeWinds(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-cyan-400 focus:ring-0 focus:ring-offset-0 accent-cyan-400 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* SATELLITE BASE MAP STYLES */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-800/40">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-widest block">World Map Style</span>
                    <div className="grid grid-cols-5 gap-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-850">
                      <button
                        onClick={() => setBaseMapStyle("satellite")}
                        className={`py-1.5 text-[8px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          baseMapStyle === "satellite"
                            ? "bg-slate-800 text-cyan-400 shadow-inner"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                        title="NASA Satellite Imagery"
                      >
                        SAT
                      </button>
                      <button
                        onClick={() => setBaseMapStyle("political")}
                        className={`py-1.5 text-[8px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          baseMapStyle === "political"
                            ? "bg-slate-800 text-cyan-400 shadow-inner"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                        title="Political Country Borders Map"
                      >
                        BDR
                      </button>
                      <button
                        onClick={() => setBaseMapStyle("realistic")}
                        className={`py-1.5 text-[8px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          baseMapStyle === "realistic"
                            ? "bg-slate-800 text-cyan-400 shadow-inner"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                        title="Moody Classic Theme"
                      >
                        DK
                      </button>
                      <button
                        onClick={() => setBaseMapStyle("enhanced")}
                        className={`py-1.5 text-[8px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          baseMapStyle === "enhanced"
                            ? "bg-slate-800 text-cyan-400 shadow-inner"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                        title="Infrared Thermal SST Theme"
                      >
                        TH
                      </button>
                      <button
                        onClick={() => setBaseMapStyle("blueprint")}
                        className={`py-1.5 text-[8px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          baseMapStyle === "blueprint"
                            ? "bg-slate-800 text-cyan-400 shadow-inner"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                        title="High-Tech Cyber Blueprint"
                      >
                        CY
                      </button>
                    </div>
                    {/* Visual indicators for selected option name */}
                    <div className="text-[8px] font-mono text-slate-400 flex justify-between items-center px-1">
                      <span>Active Style:</span>
                      <span className="text-cyan-400 uppercase font-bold">
                        {baseMapStyle === "satellite" ? "NASA Satellite" :
                         baseMapStyle === "political" ? "Political Borders" :
                         baseMapStyle === "realistic" ? "Moody Classic" :
                         baseMapStyle === "enhanced" ? "Thermal IR" : "Cyber Grid"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[8px] font-mono text-slate-500 leading-snug">
                    🌊 Equatorial currents reverse automatically depending on the active year's El Niño/La Niña intensity.
                  </div>

                </div>
              ) : (
                <div className="text-[9px] text-slate-400 font-mono text-center py-1">
                  Click arrow to view 3 overlays & map styles
                </div>
              )}
            </div>

          </div>

          {/* DYNAMIC SCENE SCALE BAR COLOR LEGENDS */}
          <div className="bg-[#030712] border border-slate-850 rounded-xl p-3 flex items-center justify-between font-mono text-[10px] text-slate-400">
            {activeLayer === "impacts" ? (
              <>
                <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-cyan-400" /> Legend colors link locations to the unique impact descriptions list.</span>
                <span className="font-semibold text-white">13 Instrumented Hotspots</span>
              </>
            ) : activeLayer === "sst" ? (
              <div className="w-full flex items-center justify-between">
                <span className="font-semibold text-blue-400">Cool Anomaly (&lt; -0.5°C)</span>
                <div className="h-2 flex-grow mx-4 rounded-full bg-gradient-to-r from-blue-600 via-slate-800 to-red-600 border border-slate-900" />
                <span className="font-semibold text-red-400">Warm Anomaly (&gt; +0.5°C)</span>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <span className="font-semibold text-orange-400">Drier Conditions</span>
                <div className="h-2 flex-grow mx-4 rounded-full bg-gradient-to-r from-orange-600 via-slate-800 to-cyan-600 border border-slate-900" />
                <span className="font-semibold text-cyan-400">Wetter Conditions</span>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COMPONENT: INTERACTIVE IMPACT DESCRIPTION LEGEND (4/12) */}
        <div className="xl:col-span-4 flex flex-col justify-between h-full">
          
          {activeLayer === "impacts" ? (
            <div className="flex flex-col h-full justify-between gap-4">
              
              {/* LEGEND BOX CONTAINER */}
              <div className="bg-[#030712] border border-slate-850 rounded-2xl p-5 flex flex-col h-[280px]">
                <div className="border-b border-slate-800/60 pb-3 mb-3 shrink-0">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                    Impact Description
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Select or hover an impact profile to isolate coordinates on the map.
                  </p>
                </div>

                {/* SCROLLABLE LIST OF IMPACTS WITH MATCHING COLORS (From Screenshot) */}
                <div className="flex-grow overflow-y-auto space-y-2 pr-1.5 scrollbar-thin select-none">
                  {activeYearRecords.map((record) => {
                    // Match location metadata to grab ID for coloring
                    const loc = LOCATIONS.find(l => l.country === record.country && l.name === record.region);
                    if (!loc) return null;

                    const color = LOCATION_COLORS[loc.id] || "#06b6d4";
                    const isSelected = selectedLocationId === loc.id;
                    const isHovered = hoveredLocationId === loc.id;

                    return (
                      <div
                        key={`legend-item-${loc.id}`}
                        onClick={() => setSelectedLocationId(loc.id)}
                        onMouseEnter={() => setHoveredLocationId(loc.id)}
                        onMouseLeave={() => setHoveredLocationId(null)}
                        className={`p-2 rounded-xl border transition-all duration-250 cursor-pointer flex items-start gap-2.5 ${
                          isSelected 
                            ? "bg-slate-900 border-slate-750 text-white shadow-md shadow-cyan-900/5" 
                            : isHovered
                              ? "bg-[#080d1e]/50 border-slate-800/80 text-slate-200"
                              : "bg-transparent border-transparent text-slate-400 hover:text-slate-350"
                        }`}
                      >
                        {/* Custom Colored Bullet Checkbox representation */}
                        <div 
                          style={{ backgroundColor: color }}
                          className="w-3.5 h-3.5 rounded mt-0.5 shrink-0 border border-white/20 transition-transform duration-250 hover:scale-110"
                        />
                        
                        <div className="text-[10px] leading-tight font-sans">
                          <span className="font-bold text-slate-200 mr-1.5">{loc.country}:</span>
                          <span className="font-normal italic">{record.impactDescription}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE SELECTION DETAIL RESEARCH BRIEF (Drives massive learning value) */}
              {selectedImpactRecord && (
                <div className="bg-[#030712] border border-slate-850 p-4.5 rounded-2xl text-xs space-y-3 shadow-md animate-fade-in shrink-0">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/40">
                    <div>
                      <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold tracking-widest block">Geospatial Station Profile</span>
                      <h4 className="font-bold text-slate-200 text-sm tracking-tight mt-0.5">
                        {selectedImpactRecord.region}, {selectedImpactRecord.country}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedImpactRecord.severity === "Extreme" ? "bg-rose-950/90 text-rose-450 border border-rose-800/30" :
                      selectedImpactRecord.severity === "High" ? "bg-amber-950/80 text-amber-500 border border-amber-800/30" :
                      "bg-emerald-950/80 text-emerald-400 border border-emerald-800/30"
                    }`}>
                      {selectedImpactRecord.severity.toUpperCase()} IMPACT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-[#080c18] border border-slate-850 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block uppercase">Temp Anomaly</span>
                      <span className={`font-bold mt-0.5 block ${selectedImpactRecord.temperatureAnomaly >= 0 ? "text-rose-400" : "text-cyan-400"}`}>
                        {selectedImpactRecord.temperatureAnomaly >= 0 ? "+" : ""}{selectedImpactRecord.temperatureAnomaly}°C
                      </span>
                    </div>
                    <div className="bg-[#080c18] border border-slate-850 p-2 rounded-xl">
                      <span className="text-[8px] text-slate-500 block uppercase">Rainfall anomaly</span>
                      <span className={`font-bold mt-0.5 block ${selectedImpactRecord.rainfallAnomaly >= 0 ? "text-cyan-400" : "text-amber-500"}`}>
                        {selectedImpactRecord.rainfallAnomaly >= 0 ? "+" : ""}{selectedImpactRecord.rainfallAnomaly}% shift
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#02050f]/60 p-3 rounded-xl border border-slate-900 leading-normal">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">Scientific Assessment:</span>
                    <p className="text-[10px] font-serif italic text-slate-350 mt-0.5">
                      "{selectedImpactRecord.impactDescription}"
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* SCIENTIFIC REGIONAL VIEW LEGEND AND GRAPH VALUES */
            <div className="bg-[#030712] border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[350px]">
              <div className="space-y-4">
                <div className="border-b border-slate-800/60 pb-3">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
                    {activeLayer === "sst" ? "🌡️ Thermal Deviations" : "🌧️ Hydrological shifts"}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Physical anomalies evaluated relative to 1991-2020 ERA5 climatology norms.
                  </p>
                </div>

                {activeRegion ? (
                  <div className="space-y-4">
                    <div className="bg-[#080c18] p-3 rounded-xl border border-slate-850 font-mono space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase font-bold">Selected Grid Block</span>
                      <div className="text-xs font-bold text-white leading-tight">{activeRegion.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1">{activeRegion.desc}</div>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-500">Climatology normal (Temp)</span>
                        <span className="text-slate-300 font-bold">{activeRegion.averageTemp}°C</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-500">Climatology normal (Rain)</span>
                        <span className="text-slate-300 font-bold">{activeRegion.averagePrecip} mm/mo</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-500">Calculated Anomaly (Temp)</span>
                        <span className={`font-bold ${activeOni >= 0 ? "text-rose-450" : "text-blue-400"}`}>
                          {activeOni >= 0 ? "+" : ""}{(activeRegion.tempCoef * activeOni).toFixed(2)}°C
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-900">
                        <span className="text-slate-500">Calculated Anomaly (Rain)</span>
                        <span className={`font-bold ${activeOni >= 0 ? "text-sky-400" : "text-orange-400"}`}>
                          {activeOni >= 0 ? "+" : ""}{Math.round(activeRegion.precipCoef * activeOni)} mm/mo
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 italic text-xs font-sans">
                    Click any regional coordinate dot on the map to display calculated climatology coefficients.
                  </div>
                )}
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850/40 text-[9px] text-slate-500 leading-normal flex items-start gap-1.5">
                <Layers className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Geospatial layers are fully modeled using real meteorological coefficients. Anomaly outcomes scale continuously with the master ONI boundary controller.</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* BOTTOM SECTION: DETAILED TIMELINE SLIDER CONTROL (1950 - 2025 COMPLETE RUNS) */}
      <div className="bg-[#030712] border border-slate-850 p-4 rounded-2xl mt-6 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* PLAYBACK TRIGGERS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimelineYear(prev => Math.max(1950, prev - 1))}
              disabled={timelineYear <= 1950}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors pointer-events-auto cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full transition-all duration-200 border cursor-pointer ${
                isPlaying 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" 
                  : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20"
              }`}
              title={isPlaying ? "Pause Timeline Loop" : "Play Timeline Ingest Loop"}
            >
              {isPlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={() => setTimelineYear(prev => Math.min(2025, prev + 1))}
              disabled={timelineYear >= 2025}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-3.5 py-1.5 border border-slate-800 rounded-xl ml-2 whitespace-nowrap">
              Active Year: <span className="text-white text-sm">{timelineYear}</span>
            </div>
          </div>

          {/* DUAL TIMELINE SLIDER (1950 - 2025) */}
          <div className="flex-grow flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500">1950</span>
            <input
              type="range"
              min="1950"
              max="2025"
              step="1"
              value={timelineYear}
              onChange={(e) => setTimelineYear(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-slate-800 accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-500">2025</span>
          </div>

        </div>

        {/* METEOROLOGICAL TELECONNECTION STATUS TAPE */}
        <div className="mt-3.5 pt-3 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span>Historical Phase:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${
              activeEnsoState.type === "VSE" || activeEnsoState.type === "SE" ? "bg-red-950 text-red-400" :
              activeEnsoState.type === "SL" || activeEnsoState.type === "ML" ? "bg-blue-950 text-blue-400" : "bg-slate-900 text-slate-400"
            }`}>
              {getEnsoFullLabel(activeEnsoState.type)}
            </span>
            <span className="text-slate-600">|</span>
            <span>Peak ONI Value: <span className="text-white font-bold">{activeEnsoState.oni >= 0 ? "+" : ""}{activeEnsoState.oni.toFixed(2)}°C</span></span>
          </div>

          <div className="flex items-center gap-1 text-cyan-400 font-semibold">
            <MousePointerClick className="w-3.5 h-3.5 animate-bounce" />
            <span>Click any hotspot or legend to inspect active research briefs</span>
          </div>
        </div>

        {/* TOP 20 MOST IMPACTED REGIONS GLOBALLY WIDGET */}
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-mono text-cyan-400 font-extrabold tracking-wider block">Spatiotemporal Hazard Ranking</span>
              <h4 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                Ranked Teleconnection Severity Index (Top 20 Impacted Global Hotspots)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-850">
              Active Phase Year: <span className="text-white font-bold">{timelineYear}</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-850/80 bg-slate-950/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] font-mono uppercase text-slate-500 select-none">
                  <th className="py-2 px-3 text-center w-12">Rank</th>
                  <th className="py-2 px-3">Location Grid Target</th>
                  <th className="py-2 px-3">Primary Teleconnection Hazard</th>
                  <th className="py-2 px-3 text-center">Temp Anomaly</th>
                  <th className="py-2 px-3 text-center">Rainfall Shift</th>
                  <th className="py-2 px-3 text-center">Severity</th>
                  <th className="py-2 px-3 text-right pr-4">Impact Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 font-sans">
                {top20ImpactedRegions.map((row, index) => {
                  const isPositiveTemp = row.tempAnomaly >= 0;
                  const isPositivePrecip = row.precipAnomaly >= 0;
                  
                  return (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-900/40 transition-colors group cursor-default"
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 text-[11px] group-hover:text-cyan-400">
                        #{index + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200">{row.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{row.country}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs truncate" title={row.impact}>
                        {row.impact}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={`font-bold ${row.tempAnomaly === 0 ? "text-slate-500" : isPositiveTemp ? "text-rose-500" : "text-sky-400"}`}>
                          {row.tempAnomaly === 0 ? "0.00" : isPositiveTemp ? "+" : ""}{row.tempAnomaly}°C
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span className={`font-bold ${row.precipAnomaly === 0 ? "text-slate-500" : isPositivePrecip ? "text-emerald-400" : "text-amber-500"}`}>
                          {row.precipAnomaly === 0 ? "0%" : isPositivePrecip ? "+" : ""}{row.precipAnomaly}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border select-none ${
                          row.severity === "Extreme" ? "bg-red-950/40 text-red-400 border-red-900/50" :
                          row.severity === "High" ? "bg-orange-950/30 text-orange-400 border-orange-900/30" :
                          row.severity === "Moderate" ? "bg-amber-950/20 text-amber-500 border-amber-900/20" :
                          "bg-slate-900 text-slate-400 border-slate-800"
                        }`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right pr-4 font-mono font-bold">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                row.score >= 70 ? "bg-red-500" :
                                row.score >= 45 ? "bg-orange-500" :
                                row.score >= 20 ? "bg-amber-500" :
                                "bg-slate-600"
                              }`} 
                              style={{ width: `${row.score}%` }} 
                            />
                          </div>
                          <span className={
                            row.score >= 70 ? "text-red-400" :
                            row.score >= 45 ? "text-orange-400" :
                            row.score >= 20 ? "text-amber-400" :
                            "text-slate-400"
                          }>
                            {row.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2.5 text-[9px] text-slate-500 font-mono flex items-center justify-between">
            <span>*Severity Score computed using coupled temp & precip teleconnection weighting.</span>
            <span>Update frequency: On slide change</span>
          </div>
        </div>
      </div>

    </div>
  );
}
