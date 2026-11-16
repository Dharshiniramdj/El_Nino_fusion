/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Sliders, 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Download,
  Flame,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  FileCheck
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area,
  ComposedChart,
  Line
} from "recharts";
import { GlobalRegion, HistoricalRecord } from "../types";

interface RefinementStudioProps {
  regions: GlobalRegion[];
  historicalRecords: HistoricalRecord[];
  isDark: boolean;
  userRole: "Admin" | "Researcher" | "Viewer";
}

interface QualityIssue {
  id: string;
  field: string;
  type: "missing" | "duplicate" | "outlier" | "consistency";
  desc: string;
  severity: "low" | "medium" | "high";
  remedy: string;
}

export default function RefinementStudio({ regions, historicalRecords, isDark, userRole }: RefinementStudioProps) {
  const [activeSegment, setActiveSegment] = useState<"quality" | "features">("quality");
  const [isProcessing, setIsProcessing] = useState(false);
  const [remediedList, setRemediedList] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<"DJF" | "MAM" | "JJA" | "SON">("DJF");
  const [distributionMetric, setDistributionMetric] = useState<"temp" | "precip">("temp");

  const [issues, setIssues] = useState<QualityIssue[]>([
    {
      id: "err-01",
      field: "Niño 4 Sea Surface temperature",
      type: "missing",
      desc: "5 null/blank values discovered in 2024 November buoy observations during signal loss.",
      severity: "medium",
      remedy: "Temporal linear interpolation across t-1 and t+1"
    },
    {
      id: "err-02",
      field: "Darwin Station Pressure (SOI Feed)",
      type: "duplicate",
      desc: "Double logging entry detected on 1998 October 12th; coordinates overlap fully.",
      severity: "low",
      remedy: "Deduplicate and average overlapping atmospheric points"
    },
    {
      id: "err-03",
      field: "Galapagos Station Thermal Node",
      type: "outlier",
      desc: "Spurious temperature shift reading of +9.25°C exceeds standard climatology thresholds (±4.5).",
      severity: "high",
      remedy: "Prune outlier values and substitute with region average"
    },
    {
      id: "err-04",
      field: "Air-Sea Convective Balance",
      type: "consistency",
      desc: "Atmospheric Southern Oscillation pressure trends diverge from equatorial East Pacific thermocline shift.",
      severity: "medium",
      remedy: "Adjust weight of Coupled Climate Model to match SST satellite grid"
    }
  ]);

  const handleRunRemedy = (issue: QualityIssue) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRemediedList(prev => [...prev, issue.id]);
    }, 500);
  };

  const handleAutoImpute = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRemediedList(issues.map(i => i.id));
    }, 800);
  };

  const hasWritePermission = userRole === "Admin" || userRole === "Researcher";

  // KPI Calculations
  const missingValuesRemoved = remediedList.length * 5 + 235; // Simulated base + dynamic updates
  const duplicateRecordsRemoved = remediedList.includes("err-02") ? 42 : 41;
  const featuresGeneratedCount = 5;
  const averagePeakOni = 1.45;
  const averageSeverityScore = 78;

  // Correlation Matrix Data Setup (Blue-to-Red Diverging)
  const variables = ["Peak ONI", "Temp Anom", "Rain Anom", "Severity", "Lat", "Lng"];
  const correlationMatrix = [
    [1.00,  0.88, -0.74,  0.92, -0.12,  0.08], // Peak ONI
    [0.88,  1.00, -0.68,  0.84, -0.05,  0.12], // Temp Anom
    [-0.74, -0.68,  1.00, -0.79,  0.15, -0.10], // Rain Anom
    [0.92,  0.84, -0.79,  1.00, -0.09,  0.05], // Severity
    [-0.12, -0.05,  0.15, -0.09,  1.00, -0.22], // Lat
    [0.08,  0.12, -0.10,  0.05, -0.22,  1.00], // Lng
  ];

  const getHeatmapColor = (val: number) => {
    if (val === 1) return "bg-red-600 text-white";
    if (val > 0.8) return "bg-red-500/90 text-white";
    if (val > 0.5) return "bg-orange-500/75 text-white";
    if (val > 0.2) return "bg-orange-500/30 text-orange-200";
    if (val > -0.2) return "bg-slate-900 text-slate-500";
    if (val > -0.5) return "bg-sky-500/35 text-sky-200";
    if (val > -0.8) return "bg-sky-500/75 text-white";
    return "bg-blue-600 text-white";
  };

  // Box Plot Data Modeling: Before vs. After Preprocessing
  // Represented beautifully using Recharts as floating bars (or ranges)
  const boxPlotData = [
    {
      metric: "Temperature (°C)",
      beforeMin: -1.2,
      beforeQ1: 0.1,
      beforeMedian: 0.8,
      beforeQ3: 1.9,
      beforeMax: 4.8, // out of bounds outlier
      afterMin: -0.8,
      afterQ1: 0.3,
      afterMedian: 0.8,
      afterQ3: 1.4,
      afterMax: 2.2 // extreme pruned
    },
    {
      metric: "Rainfall (mm/day)",
      beforeMin: -8.0,
      beforeQ1: -2.1,
      beforeMedian: 0.5,
      beforeQ3: 4.6,
      beforeMax: 15.4, // sensors spike
      afterMin: -5.5,
      afterQ1: -1.4,
      afterMedian: 0.5,
      afterQ3: 3.2,
      afterMax: 8.5 // smoothed
    }
  ];

  // Histograms post cleaning: Distribution bins for Recharts
  const tempHistogramBins = [
    { bin: "-1.0 to -0.5", frequency: 15 },
    { bin: "-0.5 to 0.0", frequency: 42 },
    { bin: "0.0 to 0.5", frequency: 78 },
    { bin: "0.5 to 1.0", frequency: 110 },
    { bin: "1.0 to 1.5", frequency: 85 },
    { bin: "1.5 to 2.0", frequency: 32 },
    { bin: "2.0 to 2.5", frequency: 12 },
  ];

  const precipHistogramBins = [
    { bin: "-40% to -30%", frequency: 18 },
    { bin: "-30% to -20%", frequency: 35 },
    { bin: "-20% to -10%", frequency: 64 },
    { bin: "-10% to 0%", frequency: 95 },
    { bin: "0% to 10%", frequency: 80 },
    { bin: "10% to 20%", frequency: 48 },
    { bin: "20% to 30%", frequency: 22 },
  ];

  // Violin Plot approximation representing Peak ONI distributions across categories
  const violinPlotCategories = [
    { category: "La Niña", median: -1.25, max: -0.5, min: -2.8, density: [10, 25, 45, 60, 45, 25, 10], color: "#06b6d4" },
    { category: "Neutral", median: 0.05, max: 0.45, min: -0.45, density: [5, 20, 55, 90, 55, 20, 5], color: "#64748b" },
    { category: "El Niño", median: 1.38, max: 2.9, min: 0.5, density: [12, 30, 50, 75, 50, 30, 12], color: "#f43f5e" }
  ];

  // Helper to trigger direct download of mock sanitized dataset
  const handleDownloadDataset = (format: "csv" | "json") => {
    const timestamp = new Date().toISOString().split("T")[0];
    const dataString = format === "csv" 
      ? "Year,Month,PeakONI,GlobalTempAnomaly,RainfallAnomaly,SeverityScore,Status\n2025,12,1.8,1.25,24.5,82,Sanitized\n2025,11,1.7,1.18,22.1,78,Sanitized"
      : JSON.stringify({ metadata: { source: "ERA5/NOAA", status: "Sanitized", date: timestamp }, records: historicalRecords.slice(0, 5) }, null, 2);

    const blob = new Blob([dataString], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `enso_fusion_sanitized_${timestamp}.${format}`);
    a.click();
  };

  return (
    <div id="refinement-studio-section" className="space-y-6">
      
      {/* 5 KPI CARDS ROW (From prompt requirements) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Missing Values Removed</span>
          <span className="text-xl font-bold text-white tracking-tight mt-1">{missingValuesRemoved} pts</span>
          <span className="text-[9px] text-cyan-400 font-mono mt-1.5 block">Interpolation auto-check</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Duplicate Records Pruned</span>
          <span className="text-xl font-bold text-white tracking-tight mt-1">{duplicateRecordsRemoved} entries</span>
          <span className="text-[9px] text-cyan-400 font-mono mt-1.5 block">Deduplicated Darwin inputs</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Features Synthesized</span>
          <span className="text-xl font-bold text-white tracking-tight mt-1">{featuresGeneratedCount} Layers</span>
          <span className="text-[9px] text-pink-400 font-mono mt-1.5 block">Z-scores & Moving Averages</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Average Peak ONI</span>
          <span className="text-xl font-bold text-rose-500 tracking-tight mt-1">+{averagePeakOni.toFixed(2)}°C</span>
          <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block">Strong El Niño Baseline</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-[#0b1021] border-slate-850" : "bg-white border-slate-200"
        }`}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Average Severity Score</span>
          <span className="text-xl font-bold text-amber-500 tracking-tight mt-1">{averageSeverityScore} / 100</span>
          <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block">Composite extreme hazard index</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT WORKSPACE CONTROLS (4 cols on lg) */}
        <div className={`lg:col-span-4 rounded-3xl border p-6 flex flex-col justify-between ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/20">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400">Harmonization & QC</span>
                <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">Signal Refinement Deck</h3>
              </div>
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Refine meteorological data anomalies, mitigate sensor noise, compute rolling averages, and compile custom climate features in real-time.
            </p>

            {/* Navigation Segments */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveSegment("quality")}
                type="button"
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  activeSegment === "quality" 
                    ? "bg-slate-950 border-cyan-500/30 text-cyan-400 font-semibold" 
                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 text-slate-450 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${issues.length === remediedList.length ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-xs font-sans">Data Quality & QC Patches</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {issues.length - remediedList.length} unresolved
                </span>
              </button>

              <button
                onClick={() => setActiveSegment("features")}
                type="button"
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  activeSegment === "features" 
                    ? "bg-slate-950 border-cyan-500/30 text-cyan-400 font-semibold" 
                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 text-slate-450 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-sans">Feature Synthesis Deck</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  5 variables computed
                </span>
              </button>
            </div>

            {/* Explanatory cards on feature engineering (rolling mean, standardized z-score) */}
            <div className="space-y-2 pt-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Feature Engineering Definitions</span>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 space-y-1.5 text-[10px] font-mono leading-normal text-slate-400">
                <span className="text-white font-bold block text-[11px]">Formula Library</span>
                <p>• <strong>Rolling Mean:</strong> 3-month moving averages smoothing short-term high-frequency sensor anomalies.</p>
                <p>• <strong>Z-Score:</strong> Standardized deviation metric dividing anomalies by regional variance limits.</p>
                <p>• <strong>Derived Severity Index:</strong> Non-linear composite hazard multiplier (Temp Anomaly × precip deficit factor).</p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/20 space-y-2.5">
            {activeSegment === "quality" ? (
              <button
                onClick={handleAutoImpute}
                disabled={isProcessing || remediedList.length === issues.length || !hasWritePermission}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  issues.length === remediedList.length || !hasWritePermission
                    ? "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-600 to-cyan-500 text-slate-950 hover:from-cyan-500 hover:to-cyan-400"
                }`}
              >
                <Wand2 className="w-4 h-4" />
                {!hasWritePermission 
                  ? "Authorization Locked" 
                  : isProcessing 
                    ? "Resolving Stations..." 
                    : "Auto-Impute All Anomalies"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadDataset("csv")}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-850 text-cyan-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleDownloadDataset("json")}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MAIN WORKSPACE DISPLAY (8 cols on lg) */}
        <div className={`lg:col-span-8 rounded-3xl border p-6 flex flex-col justify-between ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
        }`}>
          {activeSegment === "quality" ? (
            /* DATA QUALITY & OUTLIERS CONTROL */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-orange-400/10 text-orange-400">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Active Station Anomaly Triage Buffer</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Resolved {remediedList.length} of {issues.length}
                </span>
              </div>

              {/* Station issues triage list */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                {issues.map((issue) => {
                  const isRemedied = remediedList.includes(issue.id);
                  return (
                    <div 
                      key={issue.id}
                      className={`rounded-2xl border p-4 transition-all duration-300 ${
                        isRemedied 
                          ? "bg-emerald-950/5 border-emerald-900/15 opacity-60" 
                          : isDark
                            ? "bg-slate-950/60 border-slate-850 hover:border-slate-800"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                              isRemedied
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : issue.severity === "high" 
                                  ? "bg-rose-950 text-rose-450 border border-rose-900/30" 
                                  : issue.severity === "medium"
                                    ? "bg-amber-950 text-amber-500 border border-amber-900/30"
                                    : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}>
                              {isRemedied ? "RESOLVED" : `${issue.severity.toUpperCase()} SEVERITY`}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-slate-300">{issue.field}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-normal mt-1">
                            {issue.desc}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center gap-1.5">
                            <Wand2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                            <span>Remedy: <span className="text-slate-300 font-semibold">{issue.remedy}</span></span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRunRemedy(issue)}
                          disabled={isRemedied || isProcessing || !hasWritePermission}
                          className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all flex-shrink-0 cursor-pointer ${
                            isRemedied 
                              ? "bg-emerald-950/30 text-emerald-300 border border-emerald-900/20 cursor-default" 
                              : !hasWritePermission
                                ? "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                                : "bg-slate-950 hover:bg-slate-850 border border-slate-850 text-cyan-400"
                          }`}
                        >
                          {isRemedied ? "✓ Applied" : "Apply Patch"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* INTERACTIVE CORRELATION HEATMAP & BOX PLOT ANALYSIS */
            <div className="space-y-6">
              
              {/* CORRELATION HEATMAP PANEL (With diverging color scheme from prompt) */}
              <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold block">
                      Feature Correlation Matrix (Pearson coefficients)
                    </span>
                    <h4 className="text-xs font-sans font-extrabold text-slate-200">
                      Blue-to-Red Diverging Heatmap of Forcing Correlates
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                    <span>Neg (-1)</span>
                    <div className="w-16 h-2 bg-gradient-to-r from-blue-600 via-slate-900 to-red-600 rounded" />
                    <span>Pos (+1)</span>
                  </div>
                </div>

                {/* Heatmap Grid rendering */}
                <div className="overflow-x-auto">
                  <div className="min-w-[480px] space-y-1">
                    {/* Header Columns */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold text-slate-400">
                      <div className="text-left font-sans text-[10px] text-slate-500 pl-1">Metrics</div>
                      {variables.map((v) => (
                        <div key={`col-${v}`} className="bg-slate-950/80 py-1 rounded">
                          {v}
                        </div>
                      ))}
                    </div>

                    {/* Heatmap Matrix rows */}
                    {variables.map((rowName, rIdx) => (
                      <div key={`row-${rowName}`} className="grid grid-cols-7 gap-1 items-center">
                        <div className="text-slate-300 font-sans font-bold text-[10px] truncate pr-1">
                          {rowName}
                        </div>
                        {correlationMatrix[rIdx].map((val, cIdx) => (
                          <div
                            key={`cell-${rIdx}-${cIdx}`}
                            className={`py-2 rounded-lg text-center font-mono text-[9px] font-extrabold border border-slate-850/40 transition-all duration-200 ${getHeatmapColor(val)}`}
                            title={`${rowName} vs ${variables[cIdx]} Correlation: ${val}`}
                          >
                            {val >= 0 ? "+" : ""}{val.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BOX PLOTS & FEATURE DISTRIBUTION HISTOGRAM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* BEFORE VS AFTER PREPROCESSING BOX PLOTS */}
                <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 flex flex-col justify-between">
                  <div className="pb-2 border-b border-slate-900">
                    <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">
                      Outlier Mitigation Profiles
                    </span>
                    <h4 className="text-[11px] font-sans font-extrabold text-slate-200">
                      Before vs. After Range Comparison
                    </h4>
                  </div>

                  {/* Range distribution render */}
                  <div className="space-y-4 py-3">
                    {boxPlotData.map((data) => (
                      <div key={data.metric} className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-300 font-bold block">{data.metric}</span>
                        
                        {/* Before strip */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[8px] font-mono text-slate-500">
                            <span>Before preproc (Max outlier: {data.beforeMax})</span>
                          </div>
                          <div className="relative h-4 bg-slate-950 rounded border border-slate-900 overflow-hidden flex items-center">
                            <div className="absolute left-1/4 right-1/4 h-2 bg-rose-900/30 border-l border-r border-rose-500 rounded p-1" />
                            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-3 bg-rose-500" />
                            <div className="absolute right-[5%] w-1.5 h-1.5 rounded-full bg-rose-450 animate-pulse" title="Outlier flagged" />
                          </div>
                        </div>

                        {/* After strip */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[8px] font-mono text-slate-400">
                            <span>After sanitization (Cleaned Max: {data.afterMax})</span>
                          </div>
                          <div className="relative h-4 bg-slate-950 rounded border border-slate-900 overflow-hidden flex items-center">
                            <div className="absolute left-[30%] right-[30%] h-2 bg-emerald-950/45 border-l border-r border-emerald-500 rounded p-1" />
                            <div className="absolute left-[45%] -translate-x-1/2 w-1 h-3 bg-emerald-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[8px] text-slate-500 font-mono">
                    *Outliers capped via Interquartile Range (IQR) gating at 1.5x threshold.
                  </div>
                </div>

                {/* DISTRIBUTION HISTOGRAM & VIOLIN OVERVIEW */}
                <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">
                        Feature Density Curves
                      </span>
                      <h4 className="text-[11px] font-sans font-extrabold text-slate-200">
                        Signal Distribution Histograms
                      </h4>
                    </div>

                    {/* Metric Select */}
                    <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[8px] font-mono">
                      <button 
                        onClick={() => setDistributionMetric("temp")}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${distributionMetric === "temp" ? "bg-slate-800 text-cyan-400 font-bold" : "text-slate-500"}`}
                      >
                        Temp Anom
                      </button>
                      <button 
                        onClick={() => setDistributionMetric("precip")}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${distributionMetric === "precip" ? "bg-slate-800 text-cyan-400 font-bold" : "text-slate-500"}`}
                      >
                        Precip Shift
                      </button>
                    </div>
                  </div>

                  {/* Histogram Chart */}
                  <div className="h-32 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionMetric === "temp" ? tempHistogramBins : precipHistogramBins} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                        <XAxis dataKey="bin" stroke="#475569" fontSize={8} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: "9px" }} />
                        <Bar dataKey="frequency" fill={distributionMetric === "temp" ? "#f43f5e" : "#06b6d4"} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-[8px] text-slate-500 font-mono text-center">
                    Frequency histogram showing bell-shaped Gaussian convergence post cleaning.
                  </div>
                </div>

              </div>

              {/* VIOLIN PLOT APPROXIMATION */}
              <div className="bg-slate-950/40 rounded-2xl border border-slate-850 p-4 space-y-3">
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">
                    Oceanic Niño Index Distribution Envelope
                  </span>
                  <h4 className="text-xs font-sans font-extrabold text-slate-200">
                    ENSO Category Violin Density Plots
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {violinPlotCategories.map((cat) => (
                    <div key={cat.category} className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span style={{ backgroundColor: cat.color }} className="w-1.5 h-1.5 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-250 font-sans">{cat.category}</span>
                      </div>

                      {/* Violin Envelope Graphic Representation */}
                      <div className="flex items-center justify-center h-16 relative">
                        {/* Vertical line representation of median range */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-700" />
                        {/* Median marker dot */}
                        <div style={{ backgroundColor: cat.color }} className="absolute w-2 h-2 rounded-full z-10" />
                        
                        {/* Simulated violin density wings */}
                        <div className="flex flex-col gap-0.5 w-12 items-center justify-between h-full py-1">
                          {cat.density.map((dense, dIdx) => (
                            <div 
                              key={dIdx}
                              style={{ width: `${dense}%`, backgroundColor: cat.color, opacity: 0.15 + (dense/120) }}
                              className="h-1 rounded-full" 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-slate-500">
                        Med: {cat.median >= 0 ? "+" : ""}{cat.median}°C
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Console diagnostic status row */}
          <div className="mt-6 pt-3 border-t border-slate-850/60 leading-relaxed text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isProcessing ? "animate-spin" : ""}`} />
              <span>Sanitization Loop Status: <span className="font-bold text-white">{issues.length === remediedList.length ? "100% Calibrated" : `${issues.length - remediedList.length} sensor flags flagged`}</span></span>
            </span>
            <span className="hidden sm:inline text-slate-500">Matched to standard ERA5 bias metrics</span>
          </div>
        </div>

      </div>
    </div>
  );
}
