/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  ReferenceLine,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  LineChart as LucideLineChart, 
  BarChart3, 
  Grid3X3, 
  TrendingUp, 
  Info, 
  Sparkles,
  Thermometer,
  CloudRain
} from "lucide-react";
import { GlobalRegion, HistoricalRecord } from "../types";

interface DashboardChartsProps {
  regions: GlobalRegion[];
  historicalRecords: HistoricalRecord[];
  activeOni: number;
  onSelectOni: (oni: number) => void;
  isDark: boolean;
}

export default function DashboardCharts({
  regions,
  historicalRecords,
  activeOni,
  onSelectOni,
  isDark
}: DashboardChartsProps) {
  const [yearRange, setYearRange] = useState<"all" | "modern" | "2010" | "2015">("2010");
  const [activeTab, setActiveTab] = useState<"charts" | "multiline" | "heatmap" | "coverage">("charts");
  const [hiddenSeries, setHiddenSeries] = useState<Record<"oni" | "tempAnomaly" | "rainfallAnomaly", boolean>>({
    oni: false,
    tempAnomaly: false,
    rainfallAnomaly: false
  });

  const toggleSeries = (key: "oni" | "tempAnomaly" | "rainfallAnomaly") => {
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Group and average the monthly data by year for the Line Chart
  const yearlyData = useMemo(() => {
    if (!historicalRecords || historicalRecords.length === 0) return [];

    const grouped: Record<number, { tempSum: number; count: number; oniMax: number; oniMin: number; phaseCount: Record<string, number> }> = {};
    
    historicalRecords.forEach((rec) => {
      if (!grouped[rec.year]) {
        grouped[rec.year] = { tempSum: 0, count: 0, oniMax: -99, oniMin: 99, phaseCount: { "El Nino": 0, "La Nina": 0, "Neutral": 0 } };
      }
      grouped[rec.year].tempSum += rec.globalTempAnomaly;
      grouped[rec.year].count += 1;
      grouped[rec.year].oniMax = Math.max(grouped[rec.year].oniMax, rec.oni);
      grouped[rec.year].oniMin = Math.min(grouped[rec.year].oniMin, rec.oni);
      if (rec.phase) {
        grouped[rec.year].phaseCount[rec.phase] = (grouped[rec.year].phaseCount[rec.phase] || 0) + 1;
      }
    });

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((year) => {
        const group = grouped[year];
        const avgTemp = Math.round((group.tempSum / group.count) * 100) / 100;
        
        // Determine dominant phase
        let dominantPhase = "Neutral";
        if (group.oniMax >= 0.5) dominantPhase = "El Nino";
        else if (group.oniMin <= -0.5) dominantPhase = "La Nina";

        return {
          year,
          tempAnomaly: avgTemp,
          oniPeak: Math.abs(group.oniMax) > Math.abs(group.oniMin) ? group.oniMax : group.oniMin,
          phase: dominantPhase
        };
      });
  }, [historicalRecords]);

  // Filter yearly data based on range select
  const filteredYearlyData = useMemo(() => {
    return yearlyData.filter((d) => {
      if (yearRange === "all") return true;
      if (yearRange === "modern") return d.year >= 2000;
      if (yearRange === "2010") return d.year >= 2010;
      return d.year >= 2015;
    });
  }, [yearlyData, yearRange]);

  // Lookup map of peak ONI per year for accurate SST Hovmöller Heatmap values
  const yearlyPeakOniMap = useMemo(() => {
    const map: Record<number, number> = {};
    yearlyData.forEach((d) => {
      map[d.year] = d.oniPeak;
    });
    return map;
  }, [yearlyData]);

  // 2. Bar Chart Data: dynamic rainfall shifts of regions based on active ONI state
  const regionalRainfallData = useMemo(() => {
    if (!regions || regions.length === 0) return [];
    
    const shortLabels: Record<string, string> = {
      eq_pacific: "Niño 3.4",
      se_asia: "SE Asia",
      s_america_west: "Peru Coast",
      australia_east: "Australia",
      us_south: "US South",
      east_africa: "E. Africa",
      sa_brazil_north: "Amazonia",
      us_pacific_nw: "US NW"
    };

    return regions.map((r) => {
      const shift = r.precipPercentAnomaly !== undefined ? r.precipPercentAnomaly : Math.round(r.precipCoef * activeOni);
      
      return {
        id: r.id,
        name: r.name,
        shortName: shortLabels[r.id] || r.name.split(" ")[0],
        rainfallAnomaly: shift,
        tempAnomaly: r.calculatedTempAnomaly !== undefined ? r.calculatedTempAnomaly : Math.round(r.tempCoef * activeOni * 100) / 100,
        hazardLevel: r.hazardLevel || "Low"
      };
    });
  }, [regions, activeOni]);

  // 3. Heatmap Grid Data: 2D spatial heatmap matrix
  // Showing regions vs major historical strong ENSO years
  const heatmapYears = [1982, 1988, 1997, 1998, 2007, 2010, 2015, 2016, 2020, 2023, 2025];
  const heatmapRegions = [
    { id: "australia_east", name: "Australia East", coef: -1.2 },
    { id: "se_asia", name: "SE Asia / Indonesia", coef: -1.4 },
    { id: "s_america_west", name: "Peru West Coast", coef: 1.6 },
    { id: "us_south", name: "US Subtropical Jet", coef: 0.8 },
    { id: "kenya", name: "East Africa / Kenya", coef: 0.9 },
    { id: "california", name: "California Coast", coef: 0.7 }
  ];

  // Align multi-source data parameters into time-series comparisons
  const multiLineData = useMemo(() => {
    return filteredYearlyData.map(d => {
      // Model global average rainfall anomalies as inverse teleconnections of active ONI
      const rainShift = Math.round(d.oniPeak * -18); 
      return {
        year: d.year,
        oni: Number(d.oniPeak.toFixed(2)),
        tempAnomaly: Number(d.tempAnomaly.toFixed(2)),
        rainfallAnomaly: rainShift
      };
    });
  }, [filteredYearlyData]);

  // Helper to color heatmap cells based on temperature anomaly values
  const getHeatmapColor = (val: number) => {
    if (val > 1.5) return "bg-rose-600/90 hover:bg-rose-500 border-rose-500 text-white";
    if (val > 0.8) return "bg-red-500/80 hover:bg-red-400 border-red-400 text-white";
    if (val > 0.3) return "bg-orange-500/65 hover:bg-orange-400 border-orange-400 text-white";
    if (val > -0.3) return isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-200 border-slate-300 text-slate-700";
    if (val > -0.8) return "bg-sky-600/70 hover:bg-sky-500 border-sky-500 text-white";
    return "bg-blue-600/90 hover:bg-blue-500 border-blue-400 text-white";
  };

  return (
    <div id="analytics-climatology-workbench" className={`rounded-3xl border p-5 space-y-5 transition-all duration-300 ${
      isDark ? "bg-[#0b1021] border-slate-800" : "bg-white border-slate-200 shadow-sm"
    }`}>
      {/* SECTION HEADER BAR */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 ${
        isDark ? "border-slate-800/60" : "border-slate-200"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${isDark ? "bg-cyan-950 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-sans font-bold tracking-tight uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
              Oceanic &amp; Atmospheric Climatology Analytics
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            High-fidelity geospatial and statistical modeling of ENSO events
          </span>
        </div>

        {/* CONTROLS & SWITCHES */}
        <div className="flex items-center gap-2">
          {/* Main Panel Mode Toggles */}
          <div className={`flex p-0.5 rounded-xl border text-[10px] font-mono flex-wrap ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button 
              type="button"
              onClick={() => setActiveTab("charts")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === "charts" 
                  ? isDark ? "bg-slate-800 text-cyan-400 font-bold" : "bg-white text-cyan-700 font-bold shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LucideLineChart className="w-3.5 h-3.5" />
              Core Anomalies
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("multiline")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === "multiline" 
                  ? isDark ? "bg-slate-800 text-cyan-400 font-bold" : "bg-white text-cyan-700 font-bold shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Multi-Line Comparison
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("heatmap")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === "heatmap" 
                  ? isDark ? "bg-slate-800 text-cyan-400 font-bold" : "bg-white text-cyan-700 font-bold shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              SST Hovmöller Heatmap
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("coverage")}
              className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
                activeTab === "coverage" 
                  ? isDark ? "bg-slate-800 text-cyan-400 font-bold" : "bg-white text-cyan-700 font-bold shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dataset Coverage
            </button>
          </div>
        </div>
      </div>

      {/* CORE DISPLAY CONDITIONAL PORTS */}
      {activeTab === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: LINE CHART (7/12 cols) */}
          <div className={`lg:col-span-7 min-w-0 border rounded-2xl p-4 flex flex-col justify-between ${
            isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between gap-2 pb-2 mb-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">
                  Global Temperature Anomalies
                </span>
                <h4 className={`text-xs font-sans font-extrabold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  Surface warming trajectory vs ENSO index
                </h4>
              </div>

              {/* Year range dropdown */}
              <select
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value as "all" | "modern" | "2010" | "2015")}
                className={`border text-[10px] font-mono px-2.5 py-1 rounded-xl focus:outline-none cursor-pointer shrink-0 ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-slate-200"
                    : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                <option value="2015">2015 - 2026</option>
                <option value="2010">2010 - 2026</option>
                <option value="modern">2000 - 2026</option>
                <option value="all">1980 - 2026 (All)</option>
              </select>
            </div>

            {/* Line chart wrapper */}
            <div className="w-full min-h-[224px]">
              {filteredYearlyData.length === 0 ? (
                <div className="h-[224px] flex items-center justify-center text-xs font-mono text-slate-500">
                  Loading surface warming trajectory...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224} initialDimension={{ width: 520, height: 224 }}>
                  <AreaChart data={filteredYearlyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientAnomaly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#cbd5e1"} opacity={0.35} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#64748b" 
                      fontSize={9} 
                      fontFamily="JetBrains Mono" 
                      tickLine={false}
                    />
                    <YAxis 
                      width={38}
                      stroke="#64748b" 
                      fontSize={9} 
                      fontFamily="JetBrains Mono" 
                      domain={["auto", "auto"]} 
                      tickLine={false}
                      tickFormatter={(val) => `${val > 0 ? "+" : ""}${val}°`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? "#020617" : "#ffffff", 
                        borderColor: isDark ? "#1e293b" : "#cbd5e1", 
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontFamily: "JetBrains Mono",
                        color: isDark ? "#f8fafc" : "#0f172a"
                      }}
                      formatter={(val: any) => [`${val >= 0 ? "+" : ""}${val}°C`, "Anomaly"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tempAnomaly" 
                      stroke="#22d3ee" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#gradientAnomaly)" 
                      name="Global Temp Anom"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={`flex items-center justify-between text-[9px] text-slate-500 font-mono mt-3 pt-2.5 border-t ${
              isDark ? "border-slate-900" : "border-slate-200"
            }`}>
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                ERA5 Reanalysis Surface dataset
              </span>
              <span>Values in deviation of 1951-1980 mean</span>
            </div>
          </div>

          {/* RIGHT: BAR CHART (5/12 cols) */}
          <div className={`lg:col-span-5 min-w-0 border rounded-2xl p-4 flex flex-col justify-between ${
            isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
          }`}>
            <div>
              <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">
                Rainfall Impact by Region
              </span>
              <h4 className={`text-xs font-sans font-extrabold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                Monsoonal shift under {activeOni >= 0.5 ? "El Niño" : activeOni <= -0.5 ? "La Niña" : "Neutral"} ({activeOni >= 0 ? "+" : ""}{activeOni.toFixed(1)}°C ONI)
              </h4>
            </div>

            {/* Bar chart rendering */}
            <div className="w-full min-h-[224px]">
              {regionalRainfallData.length === 0 ? (
                <div className="h-[224px] flex items-center justify-center text-xs font-mono text-slate-500">
                  Loading regional monsoonal anomalies...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224} initialDimension={{ width: 360, height: 224 }}>
                  <BarChart data={regionalRainfallData} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#cbd5e1"} opacity={0.25} />
                    <XAxis 
                      dataKey="shortName" 
                      stroke="#64748b" 
                      fontSize={9} 
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={36}
                      tickLine={false}
                    />
                    <YAxis 
                      width={40}
                      stroke="#64748b" 
                      fontSize={9} 
                      fontFamily="JetBrains Mono"
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? "#020617" : "#ffffff", 
                        borderColor: isDark ? "#1e293b" : "#cbd5e1", 
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontFamily: "JetBrains Mono",
                        color: isDark ? "#f8fafc" : "#0f172a"
                      }}
                      formatter={(val: any) => [`${val >= 0 ? "+" : ""}${val}%`, "Rainfall Shift"]}
                    />
                    {/* Zero reference line */}
                    <ReferenceLine y={0} stroke="#64748b" opacity={0.5} strokeWidth={1} />
                    <Bar dataKey="rainfallAnomaly" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {regionalRainfallData.map((entry, index) => {
                        const color = entry.rainfallAnomaly >= 0 ? "#22d3ee" : "#f59e0b";
                        return <Cell key={`cell-rain-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={`flex items-center justify-between text-[9px] text-slate-500 font-mono mt-3 pt-2.5 border-t ${
              isDark ? "border-slate-900" : "border-slate-200"
            }`}>
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-amber-500" />
                Drought vs. Pluvial anomalies
              </span>
              <span>Based on Equatorial walker cells</span>
            </div>
          </div>

        </div>
      )}

      {/* CLIMATE FUSION MULTI-LINE ANALYSIS PORT */}
      {activeTab === "multiline" && (
        <div className={`border rounded-2xl p-5 space-y-4 ${
          isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
            isDark ? "border-slate-900" : "border-slate-200"
          }`}>
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold block">
                Module 1 Capstone Plot
              </span>
              <h4 className={`text-xs font-sans font-extrabold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                Interactive Multi-Line Time Series Comparison
              </h4>
              <p className="text-[10px] text-slate-500 font-mono">
                Coupled overlay of Oceanic Niño Index (ONI), Global Temp Anomaly (°C), and Rainfall Anomaly (%) over time.
              </p>
            </div>
            
            <select
              value={yearRange}
              onChange={(e) => setYearRange(e.target.value as "all" | "modern" | "2010" | "2015")}
              className={`border text-[10px] font-mono px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              <option value="2015">2015 - 2026</option>
              <option value="2010">2010 - 2026</option>
              <option value="modern">2000 - 2026</option>
              <option value="all">1980 - 2026 (All)</option>
            </select>
          </div>

          {/* Interactive Series Visibility Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "oni" as const, label: "Oceanic Niño Index (ONI)", color: "#ef4444" },
                { key: "tempAnomaly" as const, label: "Temperature Anomaly (°C)", color: "#22d3ee" },
                { key: "rainfallAnomaly" as const, label: "Rainfall Anomaly (%)", color: "#f59e0b" }
              ].map((series) => {
                const isHidden = hiddenSeries[series.key];
                return (
                  <button
                    key={series.key}
                    type="button"
                    onClick={() => toggleSeries(series.key)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isHidden
                        ? isDark
                          ? "bg-slate-950/50 border-slate-800 text-slate-500 opacity-60"
                          : "bg-slate-100 border-slate-300 text-slate-400 opacity-60"
                        : isDark
                          ? "bg-slate-900 border-slate-700 text-slate-100 shadow-sm"
                          : "bg-white border-slate-300 text-slate-800 shadow-sm"
                    }`}
                    title={`Click to ${isHidden ? "show" : "hide"} ${series.label}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: isHidden ? "#64748b" : series.color }}
                    />
                    <span className={isHidden ? "line-through" : ""}>{series.label}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] font-mono text-slate-500">
              Click series to toggle • Click a year point to sync ONI ({activeOni >= 0 ? "+" : ""}{activeOni.toFixed(1)}°C)
            </span>
          </div>

          <div className={`w-full rounded-2xl border p-4 ${
            isDark ? "bg-slate-950 border-slate-900/80" : "bg-white border-slate-200"
          }`}>
            {multiLineData.length === 0 ? (
              <div className="h-[270px] flex items-center justify-center text-xs font-mono text-slate-500">
                Loading coupled climate time-series records...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={270} initialDimension={{ width: 820, height: 270 }}>
                <LineChart
                  data={multiLineData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                  onClick={(state: any) => {
                    const labelYear = state?.activeLabel != null ? Number(state.activeLabel) : NaN;
                    const matchByLabel = !Number.isNaN(labelYear)
                      ? multiLineData.find((d) => d.year === labelYear)
                      : undefined;
                    if (matchByLabel) {
                      onSelectOni(matchByLabel.oni);
                      return;
                    }
                    const idx = state?.activeTooltipIndex != null ? Number(state.activeTooltipIndex) : NaN;
                    if (!Number.isNaN(idx) && multiLineData[idx]) {
                      onSelectOni(multiLineData[idx].oni);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#cbd5e1"} opacity={0.35} />
                  <XAxis
                    dataKey="year"
                    stroke="#64748b"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    width={42}
                    stroke="#ef4444"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(val) => `${val}°C`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    width={42}
                    stroke="#f59e0b"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <ReferenceLine yAxisId="left" y={0} stroke="#475569" strokeDasharray="3 3" opacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#020617" : "#ffffff",
                      borderColor: isDark ? "#1e293b" : "#cbd5e1",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontFamily: "JetBrains Mono",
                      color: isDark ? "#f8fafc" : "#0f172a"
                    }}
                    formatter={(value: any, name: any) => [
                      name === "Rainfall Anomaly (%)" ? `${value > 0 ? "+" : ""}${value}%` : `${value > 0 ? "+" : ""}${value}°C`,
                      name
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    wrapperStyle={{ fontSize: "10px", cursor: "pointer" }}
                    onClick={(entry: any) => {
                      const key = entry?.dataKey;
                      if (key === "oni" || key === "tempAnomaly" || key === "rainfallAnomaly") {
                        toggleSeries(key);
                      }
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="oni"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    name="Oceanic Niño Index (ONI)"
                    hide={hiddenSeries.oni}
                    dot={{ r: 3, fill: "#ef4444" }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="tempAnomaly"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    name="Temperature Anomaly (°C)"
                    hide={hiddenSeries.tempAnomaly}
                    dot={{ r: 3, fill: "#22d3ee" }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rainfallAnomaly"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    name="Rainfall Anomaly (%)"
                    hide={hiddenSeries.rainfallAnomaly}
                    dot={{ r: 3, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Dual-axis plot maps standard atmosphere deviations (left axis, °C) against percentage monsoonal shifts (right axis, %).</span>
          </div>
        </div>
      )}

      {/* HEATMAP GRID PORTAL */}
      {activeTab === "heatmap" && (
        <div className={`border rounded-2xl p-4 space-y-4 ${
          isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
            isDark ? "border-slate-900" : "border-slate-200"
          }`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Grid3X3 className="w-4 h-4 text-rose-500 animate-pulse" />
                <h4 className={`text-xs font-sans font-extrabold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  Equatorial Sea Surface Temperature (SST) Heatmap Matrix
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                A regional Hovmöller comparison mapping peak-year local anomaly stress across major historical ENSO events.
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] font-mono">
              <span className="text-slate-500">Scale:</span>
              <div className={`flex items-center gap-1 px-2 py-1 border rounded-lg ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <span className="w-2.5 h-2.5 bg-blue-600 rounded" />
                <span className="text-[9px] text-slate-400">La Niña</span>
                <span className={`w-2.5 h-2.5 rounded ml-2 ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />
                <span className="text-[9px] text-slate-400">Neutral</span>
                <span className="w-2.5 h-2.5 bg-rose-600 rounded ml-2" />
                <span className="text-[9px] text-slate-400">El Niño</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid implementation */}
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[650px] space-y-1.5 py-1">
              
              {/* Heatmap Columns (Years) Header */}
              <div className="grid grid-cols-12 gap-1 text-center font-mono text-[9px] font-bold text-slate-400">
                <div className="text-left font-sans text-[10px] uppercase tracking-wider text-slate-500 pl-1 col-span-2">
                  Monitored Region
                </div>
                {heatmapYears.map((yr) => {
                  const peakOni = yearlyPeakOniMap[yr] ?? 0.0;
                  return (
                    <button
                      type="button"
                      key={`yr-h-${yr}`}
                      className={`py-1 rounded border cursor-pointer transition-colors ${
                        isDark
                          ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50"
                          : "bg-white border-slate-300 text-slate-700 hover:text-slate-950 hover:border-cyan-600"
                      }`}
                      title={`Jump to ${yr} Peak ONI (${peakOni >= 0 ? "+" : ""}${peakOni.toFixed(1)}°C)`}
                      onClick={() => onSelectOni(peakOni)}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>

              {/* Heatmap Rows (Regions) */}
              {heatmapRegions.map((row) => {
                return (
                  <div key={`row-h-${row.id}`} className="grid grid-cols-12 gap-1 items-center">
                    {/* Region Label */}
                    <div className={`font-sans font-bold text-[10px] leading-tight col-span-2 pr-1.5 truncate ${
                      isDark ? "text-slate-300" : "text-slate-800"
                    }`}>
                      {row.name}
                    </div>

                    {/* Heatmap Cells */}
                    {heatmapYears.map((yr) => {
                      const baseOni = yearlyPeakOniMap[yr] ?? 0.0;
                      const calculatedAnom = Math.round((row.coef * baseOni) * 100) / 100;

                      return (
                        <button
                          type="button"
                          key={`cell-${row.id}-${yr}`}
                          onClick={() => onSelectOni(baseOni)}
                          className={`py-2 rounded-lg border text-center font-mono text-[9px] font-bold transition-all duration-200 cursor-pointer ${getHeatmapColor(calculatedAnom)}`}
                          title={`${row.name} (${yr} Peak ONI ${baseOni >= 0 ? "+" : ""}${baseOni.toFixed(1)}°C) → Anomaly: ${calculatedAnom >= 0 ? "+" : ""}${calculatedAnom}°C`}
                        >
                          {calculatedAnom >= 0 ? "+" : ""}{calculatedAnom.toFixed(1)}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Legend description */}
          <div className={`flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-1.5 p-2.5 rounded-xl border ${
            isDark ? "bg-slate-950/40 border-slate-900" : "bg-white border-slate-200"
          }`}>
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>
              <strong>GIS Tip:</strong> Click any year header or grid cell on the SST Heatmap to jump the active dashboard simulation to that historical period&apos;s peak Equatorial forcing index.
            </span>
          </div>
        </div>
      )}

      {/* DATASET COVERAGE PORT */}
      {activeTab === "coverage" && (
        <div className={`border rounded-2xl p-5 space-y-4 ${
          isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
            isDark ? "border-slate-900" : "border-slate-200"
          }`}>
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold block">
                Module 1 Dataset Integrity Matrix
              </span>
              <h4 className={`text-xs font-sans font-extrabold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                Dataset Temporal Coverage &amp; Data Quality Heatmap
              </h4>
              <p className="text-[10px] text-slate-500 font-mono">
                Visualizes data reporting coverage across NOAA ONI, Copernicus ERA5, and simulated Regional Climate Impact datasets.
              </p>
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-xl border shrink-0 self-start sm:self-center ${
              isDark ? "bg-slate-950 border-slate-800 text-cyan-400" : "bg-white border-slate-300 text-cyan-700"
            }`}>
              {historicalRecords.length} active monthly records
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-[10px] font-mono">
              <thead>
                <tr className={`border-b text-slate-500 select-none ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <th className="py-2 pr-3 text-left font-sans text-xs">Climate Feed Dataset Source</th>
                  <th className="py-2 text-center w-24">1950 - 1959</th>
                  <th className="py-2 text-center w-24">1960 - 1979</th>
                  <th className="py-2 text-center w-24">1980 - 1999</th>
                  <th className="py-2 text-center w-24">2000 - 2014</th>
                  <th className="py-2 text-center w-24">2015 - 2026</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                <tr>
                  <td className={`py-3 font-sans text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    NOAA Oceanic Niño Index (CPC Feed)
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                </tr>
                <tr>
                  <td className={`py-3 font-sans text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    ECMWF Copernicus ERA5 Reanalysis
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-amber-500 font-bold">Reconstruct</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                </tr>
                <tr>
                  <td className={`py-3 font-sans text-[11px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    Regional Simulated Climate Impact Logs
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-rose-950/20 border border-rose-900/30 text-rose-500 font-bold">Simulated</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-rose-950/20 border border-rose-900/30 text-rose-500 font-bold">Simulated</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-amber-500 font-bold">Extrapolated</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-bold">100% Core</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={`flex flex-wrap items-center gap-y-2 gap-x-3 text-[9px] text-slate-500 font-mono pt-2 border-t ${
            isDark ? "border-slate-900" : "border-slate-200"
          }`}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded animate-pulse" /> Full Coverage (Observed)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded" /> Partial Coverage (Statistical Reconstructed)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded" /> Model Mode (Climatology Simulated)</span>
          </div>
        </div>
      )}
    </div>
  );
}
