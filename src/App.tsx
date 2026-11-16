import { useState, useEffect, useMemo, useRef, FormEvent } from "react";
import { 
  Globe, 
  Settings, 
  Compass, 
  Activity, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  Search, 
  Flame, 
  Wind, 
  Droplets,
  Thermometer, 
  Plus, 
  CheckCircle,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  Shield,
  FileText,
  Lock,
  Unlock,
  Radio,
  Clock,
  Sun,
  Moon,
  Bell,
  X,
  ChevronDown
} from "lucide-react";
import ClimateMap from "./components/ClimateMap";
import DashboardCharts from "./components/DashboardCharts";
import AuthModule, { UserSession } from "./components/AuthModule";
import DataFusion from "./components/DataFusion";
import RefinementStudio from "./components/RefinementStudio";
import PatternDiscovery from "./components/PatternDiscovery";
import ForecastingPanel from "./components/ForecastingPanel";
import ResearchCenter from "./components/ResearchCenter";
import AdminPanel from "./components/AdminPanel";
import { GlobalRegion, HistoricalRecord, HarmonizedFeatureSet } from "./types";

export default function App() {
  // Navigation & Security Theme Layouts
  const [activeTab, setActiveTab ] = useState<"dashboard" | "fusion" | "refinement" | "patterns" | "forecasting" | "research" | "auth" | "admin">("dashboard");
  const [isDark, setIsDark] = useState<boolean>(true);
  
  // Security Role session mapping (drills custom write locks down to editing panels)
  const [currentUser, setCurrentUser] = useState<UserSession | null>({
    email: "researcher@noaa.gov",
    name: "Dr. Elena Rostova",
    role: "Researcher"
  });

  // Advanced Filtering variables
  const [filterYearEpoch, setFilterYearEpoch] = useState<"all" | "modern" | "historical">("all");
  const [filterSeverityMin, setFilterSeverityMin] = useState<number>(-3.0);
  const [filterRegionBound, setFilterRegionBound] = useState<string>("all");

  // ENSO Global Boundary Force Anomaly
  const [activeOni, setActiveOni] = useState<number>(1.4); 

  // Geospatial Regions list computed on state
  const [regions, setRegions] = useState<GlobalRegion[]>([]);
  const [activeRegion, setActiveRegion] = useState<GlobalRegion | null>(null);

  // Historical correlation records
  const [historicalRecords, setHistoricalRecords] = useState<HistoricalRecord[]>([]);
  const [customDatasetsAdded, setCustomDatasetsAdded] = useState<string[]>([]);

  // Climate intelligence brief
  const [briefLoading, setBriefLoading] = useState<boolean>(false);
  const [briefText, setBriefText] = useState<string>("");
  const [briefSource, setBriefSource] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const briefsCacheRef = useRef<Record<string, { text: string; source: string }>>({});

  // Status logs simulated
  const [statusLogs, setStatusLogs] = useState<string[]>([
    "SST Anomaly feed integrated successfully",
    "NOAA ONI multi-variate calibration complete",
    "Atmospheric teleconnection wave-guides model loaded"
  ]);

  // Notifications Popover variables
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: "not-01", text: "⚠️ EXTREME WEATHE: Warm pool anomaly in Niño 3.4 reached +2.2°C.", isNew: true },
    { id: "not-02", text: "✓ DATA QUALITY REPORT: Complete linear interpolation patch on Galapagos.", isNew: true },
    { id: "not-03", text: "🔬 PLUME OUTLOOK: Forecast consensus projects Neutral phase within 5 months.", isNew: false }
  ]);

  // Fetch metrics upon adjustment of active ONI variable (Module 2 Engine loop)
  useEffect(() => {
    fetch(`/api/climate/regions?oni=${activeOni}`)
      .then((res) => res.json())
      .then((data) => {
        setRegions(data.regions);
        // Retain selection if exists
        if (activeRegion) {
          const updated = data.regions.find((r: any) => r.id === activeRegion.id);
          if (updated) setActiveRegion(updated);
        } else {
          // Default selection to Indonesia / SE Asia for high-stakes visibility
          const def = data.regions.find((r: any) => r.id === "se_asia");
          if (def) setActiveRegion(def);
        }
      })
      .catch((err) => console.error("Error running region anomalies calculating engine:", err));
  }, [activeOni]);

  // Fetch full historical fusion series on mount (Module 1)
  useEffect(() => {
    fetch("/api/climate/historical")
      .then((res) => res.json())
      .then((data) => {
        setHistoricalRecords(data.records);
      })
      .catch((err) => console.error("Error importing ERA5/NOAA historical timeline:", err));
  }, []);

  // Request real-time intelligence briefing for active region (Module 3)
  useEffect(() => {
    if (!activeRegion) return;

    const cacheKey = `${activeRegion.id}_${activeOni.toFixed(1)}`;
    if (briefsCacheRef.current[cacheKey]) {
      const cached = briefsCacheRef.current[cacheKey];
      setBriefText(cached.text);
      setBriefSource(cached.source);
      setBriefLoading(false);
      return;
    }

    if (isPlaying) {
      setBriefText("• Live intelligence brief is suspended during autoplay to conserve API quota and avoid display flickering.\n• Pause playback or manually adjust the region/parameters to trigger detailed AI analysis.");
      setBriefSource("Offline Data Stream Mode (Paused)");
      setBriefLoading(false);
      return;
    }

    setBriefLoading(true);
    
    const debounceTimer = setTimeout(() => {
      fetch("/api/climate/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: activeRegion,
          activeOni: activeOni,
          currentAnomalies: {
            tempAnom: activeRegion.calculatedTempAnomaly || 0,
            zTemp: activeRegion.zScoreTemp || 0,
            precipAnom: activeRegion.calculatedPrecipAnomaly || 0,
            precipPercent: activeRegion.precipPercentAnomaly || 0,
            zPrecip: activeRegion.zScorePrecip || 0,
            soilStress: activeRegion.soilMoistureStress || 0,
            hazardLevel: activeRegion.hazardLevel || "Low"
          },
          mode: "brief"
        })
      })
        .then((res) => res.json())
        .then((data) => {
          setBriefText(data.responseText);
          const sourceInfo = data.info || "Live Gemini Climatologist Model";
          setBriefSource(sourceInfo);
          setBriefLoading(false);
          briefsCacheRef.current[cacheKey] = {
            text: data.responseText,
            source: sourceInfo
          };
        })
        .catch((err) => {
          console.error("AI Briefing failed:", err);
          setBriefLoading(false);
        });
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [activeRegion, activeOni, isPlaying]);

  // Integrates uploaded datasets directly to active states (Module 1 action loop)
  const handleDatasetIntegration = (newRecords: HistoricalRecord[], label: string) => {
    setHistoricalRecords(prev => [...newRecords, ...prev]);
    setCustomDatasetsAdded(prev => [...prev, label]);
    
    // Push alert note
    const timestamp = new Date().toLocaleTimeString();
    setStatusLogs(prev => [
      `[${timestamp}] Integrated dataset feed from "${label}"`,
      ...prev.slice(0, 4)
    ]);
    
    setNotifications(prev => [
      { id: Date.now().toString(), text: `✓ DATA OVERSEER: Incorporated ${newRecords.length} records from ${label}.`, isNew: true },
      ...prev
    ]);
  };

  // Helper calculating live stats of active datasets (Dashboard cards)
  const totalRecordsCount = useMemo(() => {
    return historicalRecords.length;
  }, [historicalRecords]);

  const elNinoEpochsCount = useMemo(() => {
    return historicalRecords.filter(r => r.oni >= 1.5).length;
  }, [historicalRecords]);

  const computedMeanAnomalistTemp = useMemo(() => {
    if (regions.length === 0) return "0.0";
    const sum = regions.reduce((acc, r) => acc + (r.calculatedTempAnomaly || 0), 0);
    return (sum / regions.length).toFixed(2);
  }, [regions]);

  const computedMeanRainShift = useMemo(() => {
    if (regions.length === 0) return "0.0";
    const sum = regions.reduce((acc, r) => acc + (r.precipPercentAnomaly || 0), 0);
    return (sum / regions.length).toFixed(1);
  }, [regions]);

  // Filters of regions based on Advanced Header components
  const filteredRegions = useMemo(() => {
    if (filterRegionBound === "all") return regions;
    return regions.filter(r => r.id === filterRegionBound);
  }, [regions, filterRegionBound]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDark ? "bg-[#040815] text-slate-100 selection:bg-cyan-500 selection:text-slate-900" : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* GLOBAL SHELL LAYOUT: SIDEBAR + CONTENT AREA */}
      <div className="flex-grow flex flex-col lg:flex-row items-stretch">
        
        {/* LEFT NAV WORKSTATION RAIL */}
        <aside id="sidebar-navigation" className={`w-full lg:w-72 shrink-0 border-r py-6 px-5 flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-900 text-slate-200" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <div className="space-y-6">
            {/* Header Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Globe className="w-5.5 h-5.5 text-slate-950 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight uppercase leading-none font-sans text-white">
                  ENSO Climate<br/>
                  <span className="text-cyan-400 font-mono text-xs">Intelligence</span>
                </h1>
                <span className="text-[9px] font-mono text-slate-500 mt-1 block">WMO REANALYSIS PRO v3.8</span>
              </div>
            </div>

            <div className="h-px bg-slate-800/40" />

            {/* Nav Button List */}
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard Home", icon: Globe, desc: "Spatio-Temporal map & stats" },
                { id: "fusion", label: "Module 1 - Climate Fusion", icon: Database, desc: "Add CSV/JSON station datasets" },
                { id: "refinement", label: "Module 2 - Quality & QC", icon: Sliders, desc: "Imputations & feature engineering" },
                { id: "patterns", label: "Module 3 - Patterns", icon: TrendingUp, desc: "ENSO severity & statistics" },
                { id: "forecasting", label: "Module 4 - Forecasts", icon: Sparkles, desc: "Ensemble plume & query search" },
                { id: "research", label: "Research Insight briefs", icon: FileText, desc: "Compose dynamic reports & CSV export" },
                { id: "auth", label: "Session Authority Portal", icon: Shield, desc: "Role configuration & credentials" },
                { id: "admin", label: "Admin workstation", icon: Settings, desc: "User databases & live logging" }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveTab(m.id as any)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 group relative cursor-pointer ${
                      activeTab === m.id
                        ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-900/10"
                        : "text-slate-400 hover:bg-slate-950 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="text-xs leading-none">{m.label}</div>
                      <div className={`text-[9px] mt-0.5 font-normal truncate max-w-[170px] ${activeTab === m.id ? "text-slate-900/70" : "text-slate-500Group-hover:text-slate-400"}`}>{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Connected workstation footer */}
          <div className="pt-4 border-t border-slate-800/30 space-y-2.5 text-[10px] font-mono leading-relaxed text-slate-500">
            {currentUser && (
              <div className="flex items-center gap-2 bg-[#050917]/50 border border-slate-850 p-2 rounded-xl">
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                <div className="truncate">
                  <span className="font-sans font-bold text-slate-300 block leading-tight truncate">{currentUser.name}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">{currentUser.role} PRIVILEGES</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center bg-slate-950/20 p-2 rounded-xl border border-slate-800/20">
              <span className="uppercase text-[9px] font-bold">API Sync State:</span>
              <span className="text-emerald-400 animate-pulse font-extrabold flex items-center gap-1">● ON SITE</span>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY PORT WORKSPACE */}
        <div className="flex-grow flex flex-col min-w-0">
          
          {/* TOP HEADER COMPONENT (NOTIFICATIONS, MODE TRIGGER, TICKER) */}
          <header id="top-portal-header" className={`border-b px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300 ${
            isDark ? "bg-[#080d1e] border-slate-900 text-slate-200" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-2 bg-[#020617]/40 border border-slate-850/80 px-3 py-1.5 rounded-full text-xs font-mono text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Diagnostic Cycle: <span className="font-bold text-white uppercase font-sans">Active (1980 - 2026 Grid)</span></span>
            </div>

            <div className="flex items-center gap-3">
              {/* Themes toggling overlay */}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark ? "bg-slate-950 border-slate-800 text-amber-400" : "bg-slate-100 border-slate-300 text-slate-600"
                }`}
                title="Toggle Mode theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className="h-5 w-px bg-slate-800" />

              {/* Advanced Filters Overlay Quick dropdowns */}
              <div className="relative">
                <select
                  value={filterRegionBound}
                  onChange={(e) => setFilterRegionBound(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-[11px] font-mono font-bold text-white px-2.5 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="all">Sectors: All Mapped</option>
                  <option value="se_asia">SE Asia & Monsoons</option>
                  <option value="s_america_west">Peru & Upwelling</option>
                  <option value="australia_east">Australia Bushfires</option>
                  <option value="us_south">US Subtropical jet</option>
                </select>
              </div>

              <div className="h-5 w-px bg-slate-800" />

              {/* Live Status Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                    isDark ? "bg-slate-950 border-slate-800 text-cyan-400" : "bg-slate-100 border-indigo-400 text-slate-600"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => n.isNew).length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-xl z-50 text-xs font-mono space-y-3.5">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <span className="font-bold text-slate-200">ALERT VERIFICATION LIST</span>
                      <button onClick={() => setIsNotificationsOpen(false)}>
                        <X className="w-4 h-4 text-slate-500 hover:text-white" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 italic">No pending notifications.</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-2 border border-slate-900 bg-[#020617]/40 rounded-xl space-y-1.5 flex justify-between gap-1">
                            <span className="text-slate-300 leading-normal">{n.text}</span>
                            <button onClick={() => clearNotification(n.id)} className="text-slate-500 hover:text-white">
                              <X className="w-3 h-3 flex-shrink-0" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN CHASSIS INNER WRAPPER */}
          <main className="flex-grow p-4 lg:p-6 space-y-6 overflow-y-auto">
            
            {/* TAB VIEW CARRIER */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* OVERVIEW CARDS GRID (6 Cards as specified) */}
                <div id="stats-dashboard-chassis" className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Total records</span>
                    <span className="text-lg font-bold text-white tracking-tight mt-1block">{totalRecordsCount} Mapped</span>
                    <span className="text-[9px] text-cyan-400 font-mono mt-2 block">NOAA-BOM Continuous</span>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">El Niño Epochs</span>
                    <span className="text-lg font-bold text-pink-500 tracking-tight mt-1 block font-mono">9 events</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-2 block">ONI anomaly &gt;= 1.5°C</span>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Regions Analyzed</span>
                    <span className="text-lg font-bold text-white tracking-tight mt-1 block">8 core scales</span>
                    <span className="text-[9px] text-cyan-400 font-mono mt-2 block">Ocean-Atmospheric grids</span>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Average Temp</span>
                    <span className="text-lg font-bold text-rose-500 mt-1 block">+{computedMeanAnomalistTemp}°C</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-2 block">Mean anomaly deviations</span>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Average Rain</span>
                    <span className="text-lg font-bold text-sky-400 mt-1 block">{computedMeanRainShift}% shift</span>
                    <span className="text-[9px] text-cyan-400 font-mono mt-2 block">Pluvial moisture budget</span>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isDark ? "bg-[#0b1021] border-slate-850 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Active Dataset</span>
                    <span className="text-[11px] font-bold text-zinc-200 leading-tight block mt-1">ECMWF ERA5 + NOAA Grids</span>
                    <span className="text-[9px] text-cyan-400 font-mono mt-2 block truncate">Custom: {customDatasetsAdded.length} integrated</span>
                  </div>
                </div>

                {/* TWO-COLUMN GENERAL GRID WRAPPER */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                  
                  {/* LEFT: Climate Map Center: 8 cols */}
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    <ClimateMap 
                      regions={filteredRegions}
                      activeRegion={activeRegion}
                      onSelectRegion={setActiveRegion}
                      activeOni={activeOni}
                      onChangeOni={setActiveOni}
                      historicalRecords={historicalRecords}
                      onPlayStateChange={setIsPlaying}
                    />

                    {/* DYNAMIC SPATIO-TEMPORAL CHARTS, TEMPERATURE HEATMAP AND MONSOON BAR CHARTS */}
                    <DashboardCharts 
                      regions={filteredRegions}
                      historicalRecords={historicalRecords}
                      activeOni={activeOni}
                      onSelectOni={setActiveOni}
                      isDark={isDark}
                    />
                    
                    {/* STATUS TICKER AND STATS FEED */}
                    <div className={`rounded-3xl border p-4.5 font-mono text-xs ${
                      isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-650"
                    }`}>
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2 select-none">
                        <span className="uppercase text-[9px] font-bold">Recon-Server Sync logs</span>
                        <span className="text-cyan-400">Total Activities: {statusLogs.length} events</span>
                      </div>
                      <div className="space-y-1">
                        {statusLogs.map((log, i) => (
                          <div key={i} className="truncate">📡 {log}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: ONI Controllers + AI insights briefs: 4 cols */}
                  <div className="xl:col-span-4 flex flex-col gap-6 justify-between">
                    {/* BENTO CONTROLLER */}
                    <div className={`rounded-3xl border p-6 flex flex-col justify-between h-50% ${
                      isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
                    }`}>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-cyan-400">Boundary parameter</span>
                            <h3 className="text-base font-sans font-bold text-white tracking-tight leading-none mt-1">ENSO SST Boundary Force</h3>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          Drag the slider dynamically to adjust equatorial warm pools anomalies from Super La Niña (-3.0°C) to Super El Niño (+3.0°C).
                        </p>

                        <div className="space-y-2">
                          <input
                            type="range"
                            min="-3.0"
                            max="3.0"
                            step="0.1"
                            value={activeOni}
                            onChange={(e) => setActiveOni(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-slate-600 to-red-500 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold">
                            <span>-3.0°C (La Niña)</span>
                            <span className="text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-extrabold text-cyan-400">{activeOni >= 0 ? "+" : ""}{activeOni.toFixed(1)}°C</span>
                            <span>+3.0°C (El Niño)</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-3.5 border-t border-slate-850">
                        <button
                          onClick={() => setActiveOni(2.2)}
                          className="py-1 px-1.5 bg-slate-950 hover:bg-slate-850 text-[10px] text-rose-450 border border-slate-850 font-semibold font-mono rounded-lg transition-all"
                        >
                          🔥 El Niño
                        </button>
                        <button
                          onClick={() => setActiveOni(-1.8)}
                          className="py-1 px-1.5 bg-slate-950 hover:bg-slate-850 text-[10px] text-cyan-400 border border-slate-850 font-semibold font-mono rounded-lg transition-all"
                        >
                          ❄ La Niña
                        </button>
                        <button
                          onClick={() => setActiveOni(0.0)}
                          className="py-1 px-1.5 bg-slate-950 hover:bg-slate-850 text-[10px] text-slate-400 border border-slate-850 font-semibold font-mono rounded-lg transition-all"
                        >
                          ● Neutral
                        </button>
                      </div>
                    </div>

                    {/* GEMINI REAL-TIME KNOWLEDGE BRIEF */}
                    <div className={`rounded-3xl border p-6 flex flex-col justify-between h-50% relative overflow-hidden ${
                      isDark ? "bg-[#0b1021] border-slate-855 text-slate-300" : "bg-white border-slate-200"
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">Gemini Intelligence</h3>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">diagnostic summary v3.5</span>
                        </div>

                        {activeRegion ? (
                          <div className="space-y-3">
                            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5 bg-slate-950/60 py-1.5 px-3 rounded-xl border border-slate-850">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span>Region focus: {activeRegion.name}</span>
                            </div>

                            {briefLoading ? (
                              <div className="text-center py-6 text-slate-500 font-mono text-[11px] animate-pulse">Running live diagnostics on dynamic teleconnection wave-guides...</div>
                            ) : (
                              <div className="text-[11px] leading-relaxed max-h-40 overflow-y-auto scrollbar-thin space-y-2 font-serif text-slate-350">
                                {briefText ? briefText.split("\n").map((line, idx) => (
                                  <p key={idx}>{line}</p>
                                )) : "Awaiting response matrix..."}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-center py-8">Select a station coordinates region above to generate insights.</div>
                        )}
                      </div>

                      <div className="text-[9px] text-zinc-500 font-mono pt-3 border-t border-slate-850 text-right">
                        Ref: {briefSource}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "fusion" && (
              <DataFusion 
                onIntegrateDataset={handleDatasetIntegration}
                isDark={isDark}
                userRole={currentUser?.role || "Viewer"}
              />
            )}

            {activeTab === "refinement" && (
              <RefinementStudio 
                regions={regions}
                historicalRecords={historicalRecords}
                isDark={isDark}
                userRole={currentUser?.role || "Viewer"}
              />
            )}

            {activeTab === "patterns" && (
              <PatternDiscovery 
                regions={regions}
                historicalRecords={historicalRecords}
                activeOni={activeOni}
                isDark={isDark}
                userRole={currentUser?.role || "Viewer"}
              />
            )}

            {activeTab === "forecasting" && (
              <ForecastingPanel 
                historicalRecords={historicalRecords}
                isDark={isDark}
                activeOni={activeOni}
              />
            )}

            {activeTab === "research" && (
              <ResearchCenter 
                regions={regions}
                historicalRecords={historicalRecords}
                activeOni={activeOni}
                isDark={isDark}
                userRole={currentUser?.role || "Viewer"}
              />
            )}

            {activeTab === "auth" && (
              <div className="max-w-xl mx-auto py-8">
                <AuthModule 
                  currentUser={currentUser}
                  onLogin={setCurrentUser}
                  onLogout={() => setCurrentUser(null)}
                  isDark={isDark}
                />
              </div>
            )}

            {activeTab === "admin" && (
              <AdminPanel 
                isDark={isDark}
                currentUserRole={currentUser?.role || "Viewer"}
              />
            )}

          </main>

          {/* SYSTEM FOOTER */}
          <footer className={`px-6 py-4 border-t text-[10px] text-slate-500 font-mono flex flex-col md:flex-row items-center justify-between gap-2.5 transition-colors duration-300 ${
            isDark ? "bg-[#050817] border-slate-900 text-slate-200" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-wrap gap-4 items-center">
              <span>ACTIVE SYSTEM: Express + TSX Climatic Proxy 3.11</span>
              <span className="h-3 w-px bg-slate-800" />
              <span>Grids: NOAA Oceanographic Niño Index, Copernicus ERA5 reanalysis</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">WMO FRAMEWORK 2026</span>
              <span>© 2026 CLIMATEFUSION LABS INC.</span>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
