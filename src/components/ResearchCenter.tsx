import { useState } from "react";
import { FileText, Download, Share2, Printer, Check, Clipboard, Sparkles, Filter, HelpCircle, Eye } from "lucide-react";
import { GlobalRegion, HistoricalRecord } from "../types";

interface ResearchCenterProps {
  regions: GlobalRegion[];
  historicalRecords: HistoricalRecord[];
  activeOni: number;
  isDark: boolean;
  userRole: "Admin" | "Researcher" | "Viewer";
}

export default function ResearchCenter({ regions, historicalRecords, activeOni, isDark, userRole }: ResearchCenterProps) {
  const [reportType, setReportType] = useState<"enso_brief" | "hydro_risk" | "marine_upwelling">("enso_brief");
  const [sectionsSelected, setSectionsSelected] = useState<string[]>(["summary", "regional", "forecast"]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Compile active data into real downloadable CSV text
  const compileCSVBlob = () => {
    // Generate headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Region,Latitude,Longitude,Temp Anomaly (C),Z-Score Temp,Precip Anomaly (mm/m),Precip Shift (%),Soil Moisture Stress (%),Hazard Level\n";
    
    // Append rows
    regions.forEach(r => {
      // simulate region active values matching ONI
      const tempAnom = (r.tempCoef * activeOni).toFixed(2);
      const zTemp = (parseFloat(tempAnom) / r.stdTemp).toFixed(2);
      const precipShift = (r.precipCoef * activeOni).toFixed(0);
      const precipAnom = (r.averagePrecip * (parseFloat(precipShift) / 100)).toFixed(1);
      const soilStress = (parseFloat(precipShift) * r.soilMoistureCoef).toFixed(1);
      
      let hazard = "Low";
      const severeMetric = Math.max(Math.abs(parseFloat(zTemp)), Math.abs(parseFloat(precipShift) / r.stdPrecip));
      if (severeMetric > 2.5) hazard = "Extreme";
      else if (severeMetric > 1.6) hazard = "High";
      else if (severeMetric > 0.8) hazard = "Moderate";

      csvContent += `"${r.name}",${r.lat},${r.lng},${tempAnom},${zTemp},${precipAnom},${precipShift}%,${soilStress}%,${hazard}\n`;
    });

    // Trigger browser file download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EL_NINO_INTELLIGENCE_REPORT_ONI_${activeOni.toFixed(1)}C.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess("csv");
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const compileJSONBlob = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      globalActiveOniDegC: activeOni,
      climatologicalEpoch: "1980-2026",
      teleconnectionGrid: regions.map(r => ({
        id: r.id,
        name: r.name,
        teleconnectionLagMonths: r.lagMonths,
        modelAnomalies: {
          temperatureAnomDegC: +(r.tempCoef * activeOni).toFixed(2),
          precipAnomalyPercent: +(r.precipCoef * activeOni).toFixed(0)
        }
      }))
    };

    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", str);
    link.setAttribute("download", `EL_NINO_MODEL_EXPORTS_ONI_${activeOni.toFixed(1)}C.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess("json");
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (id: string) => {
    if (sectionsSelected.includes(id)) {
      setSectionsSelected(prev => prev.filter(s => s !== id));
    } else {
      setSectionsSelected(prev => [...prev, id]);
    }
  };

  return (
    <div id="research-center-workspace" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* Sidebar options / controls: 4 cols */}
      <div className={`xl:col-span-4 rounded-3xl border p-6 flex flex-col justify-between ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
      }`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400">Insights Compiler</span>
              <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">Research Reports Center</h3>
            </div>
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Configure dynamic climate briefs, select required diagnostic layers, and download verified research datasets directly.
          </p>

          {/* REPORT WRITER TOGGLES */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Select Report Core:</span>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setReportType("enso_brief")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col ${
                  reportType === "enso_brief" 
                    ? "bg-slate-950 border-cyan-500/30 text-cyan-400 font-semibold" 
                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 text-slate-450 hover:text-slate-200"
                }`}
              >
                <span className="text-xs">🌍 Coupled ENSO Teleconnection Assessment</span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">Global wind/SST shift profiles & monsoon offsets</span>
              </button>

              <button
                onClick={() => setReportType("hydro_risk")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col ${
                  reportType === "hydro_risk" 
                    ? "bg-slate-950 border-cyan-500/30 text-cyan-400 font-semibold" 
                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 text-slate-450 hover:text-slate-200"
                }`}
              >
                <span className="text-xs">💧 Hydro-hazard Risk & Crop Vulnerability summary</span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">Soil moisture stress models & reservoir drop alerts</span>
              </button>

              <button
                onClick={() => setReportType("marine_upwelling")}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col ${
                  reportType === "marine_upwelling" 
                    ? "bg-slate-950 border-cyan-500/30 text-cyan-400 font-semibold" 
                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-950 text-slate-450 hover:text-slate-200"
                }`}
              >
                <span className="text-xs">🐟 Humboldt Current Marine Upwelling closures</span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">Coastal nutrient decay & anchovy biomass collapse</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC DOCUMENT SECTIONS BOX */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Configure Document Layout:</span>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850 text-[10px] font-mono">
              <button
                onClick={() => toggleSection("summary")}
                className={`py-1 rounded cursor-pointer ${sectionsSelected.includes("summary") ? "bg-slate-800 text-cyan-400 font-bold" : "text-slate-600"}`}
              >
                Brief Summary
              </button>
              <button
                onClick={() => toggleSection("regional")}
                className={`py-1 rounded cursor-pointer ${sectionsSelected.includes("regional") ? "bg-slate-800 text-cyan-400 font-bold" : "text-slate-600"}`}
              >
                Region Table
              </button>
              <button
                onClick={() => toggleSection("forecast")}
                className={`py-1 rounded cursor-pointer ${sectionsSelected.includes("forecast") ? "bg-slate-800 text-cyan-400 font-bold" : "text-slate-600"}`}
              >
                Plume Charts
              </button>
            </div>
          </div>
        </div>

        {/* PRINT / VERIFIED ACTIONS */}
        <div className="mt-6 pt-4 border-t border-slate-855 flex gap-2">
          <button
            onClick={compileCSVBlob}
            className="flex-1 py-2 px-3 border border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            {downloadSuccess === "csv" ? "Downloaded!" : "Export CSV"}
          </button>
          <button
            onClick={compileJSONBlob}
            className="flex-1 py-2 px-3 border border-slate-800 bg-slate-950 hover:bg-slate-850 text-slate-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            {downloadSuccess === "json" ? "Exported!" : "Export JSON"}
          </button>
        </div>
      </div>

      {/* Main Report Viewer Panel: 8 cols */}
      <div className={`xl:col-span-8 rounded-3xl border p-6 flex flex-col justify-between ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
      }`}>
        <div className="space-y-5">
          {/* Action Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Live Report Preview Layout</span>
            </div>
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 bg-slate-950 border border-slate-850 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-slate-900 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-405" />
              Compile PDF / Print
            </button>
          </div>

          {/* SIMULATED REPORT PREVIEW CANVAS */}
          <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 space-y-6 font-serif text-slate-300 leading-relaxed text-xs aspect-auto relative overflow-hidden">
            {/* Report Header Stamp */}
            <div className="flex justify-between items-start border-b border-slate-850 pb-4 font-mono select-none">
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-500 uppercase font-extrabold tracking-widest block">World Meteorological reanalysis archive</span>
                <h4 className="text-sm font-sans font-bold text-white uppercase tracking-tight">Climatic Synthesis Report v3.8</h4>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <div>TS: {new Date().toLocaleDateString()}</div>
                <div>Status: ARCHIVED</div>
              </div>
            </div>

            {/* Simulated Watermark background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900/10 text-[7vw] font-black font-sans uppercase tracking-widest pointer-events-none select-none z-0">
              WMO FUSION
            </div>

            {/* DYNAMIC SECTIONS RENDER */}
            <div className="space-y-5 relative z-10 font-serif">
              
              {/* SECTION A: EXECUTIVE BRIEF SUMMARY */}
              {sectionsSelected.includes("summary") && (
                <div className="space-y-2">
                  <h5 className="font-sans font-bold text-white text-[11px] uppercase tracking-wider font-semibold border-l-2 border-cyan-500 pl-2">
                    1.0 Executive Diagnostic Boundary (Active ONI: {activeOni > 0 ? "+" : ""}{activeOni}°C)
                  </h5>
                  <p className="indent-5 text-[11px] italic text-slate-400">
                    This document provides an official diagnostic assessment of ocean-atmospheric coupling limits. Under the current simulated anomaly threshold of <strong>{activeOni}°C ONI</strong>, we observe persistent convective displacement patterns across the equatorial belt.
                  </p>
                  
                  {reportType === "enso_brief" && (
                    <p className="text-[11px]">
                      Atmospheric Hadley/Walker cell restructuring halts traditional trade wind envelopes, giving rise to split subtropical jet configurations. High travel lag delays are documented on the Indo-Pacific tracks, severely reducing baseline monsoonal precipitation.
                    </p>
                  )}
                  {reportType === "hydro_risk" && (
                    <p className="text-[11px]">
                      Severe soil moisture budget depletion is anticipated on western Pacific territories. Conversely, coastal South American nodes must brace for pluvial anomalies of up to +85% over standard climatological base averages (1980–2026), increasing dynamic hydrological hazard risk.
                    </p>
                  )}
                  {reportType === "marine_upwelling" && (
                    <p className="text-[11px]">
                      Equatorial warm water pool intrusion stops nutrient-rich Humboldt Current upwelling along the South American continental shelf. Anchovy and secondary pelagic biomass collapses are forecasted, requiring immediate multi-lateral fishery quota conservation triggers.
                    </p>
                  )}
                </div>
              )}

              {/* SECTION B: REGIONAL TELECONNECTIONS TABLE */}
              {sectionsSelected.includes("regional") && (
                <div className="space-y-2 font-mono">
                  <h5 className="font-sans font-bold text-white text-[11px] uppercase tracking-wider font-semibold border-l-2 border-cyan-500 pl-2">
                    2.0 Spatial Region Teleconnection Grid Metrics
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/60 p-1.5 text-[9px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold">
                          <th className="p-1">Region Territory</th>
                          <th className="p-1 text-center">Temp Δ (C)</th>
                          <th className="p-1 text-center">Precip Shift</th>
                          <th className="p-1 text-center">Hazard Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40 text-slate-400">
                        {regions.slice(0, 4).map((r, i) => (
                          <tr key={i}>
                            <td className="p-1 text-white font-semibold">{r.name}</td>
                            <td className="p-1 text-center font-bold">{(r.tempCoef * activeOni).toFixed(1)}°C</td>
                            <td className={`p-1 text-center font-bold ${r.precipCoef * activeOni < 0 ? "text-orange-400" : "text-sky-400"}`}>
                              {(r.precipCoef * activeOni).toFixed(0)}%
                            </td>
                            <td className="p-1 text-center uppercase font-bold text-cyan-500">
                              {r.precipCoef * activeOni < -30 ? "High" : "Low"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION C: ENSEMBLE CONSENSUS OUTLOOK */}
              {sectionsSelected.includes("forecast") && (
                <div className="space-y-2">
                  <h5 className="font-sans font-bold text-white text-[11px] uppercase tracking-wider font-semibold border-l-2 border-cyan-500 pl-2">
                    3.0 Multi-Model Consensus Plume Prognosis
                  </h5>
                  <p className="text-[11px]">
                    Analysis of simulated plume models suggests that boundary conditions will remain in simulated transition for t+3 periods. Models NCEP and CPC converge near a {activeOni >= 1.5 ? "Severe Major Event" : activeOni <= -1.5 ? "Super La Niña" : "Stochastic Balanced Transition"} threshold consensus.
                  </p>
                </div>
              )}
            </div>

            {/* Printable official signoff stamp */}
            <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] font-mono leading-none select-none">
              <div>PREPARED BY CLIMATE FUSION INTELLIGENCE LABS</div>
              <div className="font-sans font-bold italic border border-slate-800 p-1 bg-slate-900">VERIFIED SE SESSION ARCHIVE</div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer panel */}
        <div className="hidden lg:flex items-center gap-1.5 text-[9px] text-slate-500 mt-4 leading-normal bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/40">
          <HelpCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span>This diagnostic summary is powered by simulated linear interpolation grids mapped against the standard 46-year ERA5 satellite reanalysis. Direct real-world policy implementations require independent academic double-signoffs.</span>
        </div>
      </div>
    </div>
  );
}
