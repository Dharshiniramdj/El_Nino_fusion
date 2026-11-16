import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Cpu, Activity, HardDrive, Shield, RefreshCw, Terminal, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Researcher" | "Viewer";
  institute: string;
}

interface AdminPanelProps {
  isDark: boolean;
  currentUserRole: "Admin" | "Researcher" | "Viewer";
}

interface ActivityLog {
  timestamp: string;
  module: string;
  event: string;
  status: "success" | "warn" | "info";
}

export default function AdminPanel({ isDark, currentUserRole }: AdminPanelProps) {
  const [users, setUsers] = useState<TeamMember[]>([
    { id: "u-1", name: "Dr. Sarah Jenkins", email: "jenkins@noaa.gov", role: "Admin", institute: "NOAA CPC" },
    { id: "u-2", name: "Dr. Elena Rostova", email: "rostova@copernicus.eu", role: "Researcher", institute: "Copernicus ECMWF" },
    { id: "u-3", name: "Hiroto Tanaka", email: "tanaka@jma.go.jp", role: "Viewer", institute: "JMA Tokyo" },
    { id: "u-4", name: "Emma Watson", email: "watson@bom.gov.au", role: "Researcher", institute: "BOM Melbourne" }
  ]);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Researcher" | "Viewer">("Viewer");
  const [newUserInst, setNewUserInst] = useState("WMO Meteorological Station");

  // Simulated live CPU & Memory load
  const [systemStates, setSystemStates] = useState({
    cpu: 28,
    memory: 5.4,
    dbConnections: 12,
    apiLatency: 45
  });

  // Automated scrollings telemetry logs
  const [logs, setLogs] = useState<ActivityLog[]>([
    { timestamp: "08:24:12", module: "SYSTEM", event: "Vite dev server pipeline healthy [Port 3000]", status: "success" },
    { timestamp: "08:24:25", module: "MET_FUSION", event: "Copernicus ERA5 air-anomaly grid mapped successfully", status: "success" },
    { timestamp: "08:25:01", module: "AI_GEMINI", event: "Dispatched prompt matrix to model gemini-3.5-flash", status: "info" },
    { timestamp: "08:25:22", module: "DATA_CONCE", event: "Sensor variance discovered at Galapagos Node (4.2C over base)", status: "warn" }
  ]);

  // Periodic simulated metrics update
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStates(prev => ({
        cpu: Math.round(15 + Math.random() * 25),
        memory: +(5.1 + Math.random() * 0.6).toFixed(1),
        dbConnections: Math.round(8 + Math.random() * 6),
        apiLatency: Math.round(35 + Math.random() * 20)
      }));

      // Randomly append a live query log entry
      const logEvents = [
        { module: "AI_GEMINI", event: "Re-evaluated active ONI boundary - prompt generated successfully", status: "success" as const },
        { module: "MET_FUSION", event: "Linear spline interpolation resolved across 8 regional sectors", status: "success" as const },
        { module: "USER_AUTH", event: "Secured session verified for Dr. Rostova WORKSTATION", status: "info" as const },
        { module: "EXPORTS", event: "Synthesized regional CSV data - downloadable blob triggered", status: "info" as const }
      ];

      const rIndex = Math.floor(Math.random() * logEvents.length);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      
      setLogs(prev => [
        { timestamp: timeStr, ...logEvents[rIndex] },
        ...prev.slice(0, 10)
      ]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;
    
    const newUser: TeamMember = {
      id: `u-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      institute: newUserInst
    };

    setUsers(prev => [...prev, newUser]);
    
    // reset forms
    setNewUserName("");
    setNewUserEmail("");
    setNewUserInst("");

    // Log it
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLogs(prev => [
      { timestamp: timeStr, module: "USER_MNG", event: `Created user profile ${newUser.name} with ${newUser.role} access`, status: "success" },
      ...prev
    ]);
  };

  const handleDeleteUser = (id: string) => {
    // Prevent delete self or primary admin for demo
    const target = users.find(u => u.id === id);
    if (!target) return;
    
    setUsers(prev => prev.filter(u => u.id !== id));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLogs(prev => [
      { timestamp: timeStr, module: "USER_MNG", event: `Pruned team member ${target.name} from research lists`, status: "warn" },
      ...prev
    ]);
  };

  const handleRoleToggle = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextRoleMap: Record<string, "Admin" | "Researcher" | "Viewer"> = {
          "Viewer": "Researcher",
          "Researcher": "Admin",
          "Admin": "Viewer"
        };
        return { ...u, role: nextRoleMap[u.role] };
      }
      return u;
    }));
  };

  const hasAdminPrivilege = currentUserRole === "Admin";

  return (
    <div id="admin-workspace-grid" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* 5 cols: User Management directory */}
      <div className={`xl:col-span-5 rounded-3xl border p-6 flex flex-col justify-between ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
      }`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400">Institutional Staff</span>
              <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">Directory & Access Map</h3>
            </div>
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>

          <p className="text-xs text-slate-400 leading-normal mb-3">
            Admin team roster mapping meteorological authority bounds across the WMO networks. Click <strong>Role badge</strong> to toggle next hierarchy.
          </p>

          {/* Users List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {users.map((u) => (
              <div 
                key={u.id}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-slate-200">
                    <span>{u.name}</span>
                    <span 
                      onClick={() => hasAdminPrivilege && handleRoleToggle(u.id)}
                      className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold cursor-pointer hover:opacity-80 transition-opacity ${
                        u.role === "Admin" ? "bg-rose-505/10 text-rose-450 border border-rose-900/30" :
                        u.role === "Researcher" ? "bg-cyan-505/10 text-cyan-400 border border-cyan-900/30" :
                        "bg-slate-800 text-slate-400"
                      }`}
                    >
                      🛡️ {u.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {u.email} • <span className="text-cyan-500 font-bold">{u.institute}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id)}
                  disabled={!hasAdminPrivilege}
                  className="p-2 text-slate-600 hover:text-rose-450 hover:bg-rose-950/20 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                  title="Remove User"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* New User Creator Form */}
          <form onSubmit={handleCreateUser} className="space-y-3 pt-3 border-t border-slate-850">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Roster New Institution Member:</span>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                disabled={!hasAdminPrivilege}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Member Name"
                className="bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-650"
              />
              <input
                type="email"
                required
                disabled={!hasAdminPrivilege}
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Work Email"
                className="bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-650 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                disabled={!hasAdminPrivilege}
                value={newUserInst}
                onChange={(e) => setNewUserInst(e.target.value)}
                placeholder="Station Institute"
                className="bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-650"
              />
              <select
                disabled={!hasAdminPrivilege}
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2 px-2.5 text-xs text-slate-450"
              >
                <option value="Viewer">Viewer Role</option>
                <option value="Researcher">Researcher Role</option>
                <option value="Admin">Admin Role</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!hasAdminPrivilege || !newUserName || !newUserEmail}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !hasAdminPrivilege 
                  ? "bg-slate-800 text-slate-550 border border-slate-850 cursor-not-allowed" 
                  : "bg-slate-950 border border-slate-800 text-cyan-400 hover:bg-slate-850 hover:border-cyan-500/20"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              {!hasAdminPrivilege ? "Admin Authorization Required" : "Register Team Member"}
            </button>
          </form>
        </div>
      </div>

      {/* 7 cols: telemetry live monitoring + ticker logs */}
      <div className={`xl:col-span-7 rounded-3xl border p-6 flex flex-col justify-between ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200"
      }`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">Climate Engine Monitor</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Telemetry Core Live-Sync</span>
          </div>

          {/* TELEMETRY GAUGES GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs text-slate-400">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">Engine Threads CPU</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block flex items-center gap-1">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {systemStates.cpu}%
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">RAM Allocation</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                {systemStates.memory} GB
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">Active Database Conns</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block flex items-center gap-1">
                <RefreshCw className="w-4 h-4 text-cyan-400 truncate" />
                {systemStates.dbConnections} threads
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">API Response Ping</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-rose-500" />
                {systemStates.apiLatency} ms
              </span>
            </div>
          </div>

          {/* LIVE TERMINAL LOGGER */}
          <div className="bg-slate-950 rounded-2xl border border-slate-850/80 p-4 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest font-semibold flex-1">Database Sync Logs</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-1.5 font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 hover:bg-slate-900/30 hover:text-white transition-colors pb-0.5">
                  <span className="text-slate-650 flex-shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold flex-shrink-0 ${
                    log.status === "success" ? "text-emerald-400" :
                    log.status === "warn" ? "text-amber-500 animate-shake" :
                    "text-cyan-400"
                  }`}>{log.module}:</span>
                  <span className="text-slate-350 truncate">{log.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[9px] text-slate-500 mt-4 leading-normal bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/40">
          <HelpCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span>Admin monitoring gauges verify host memory saturation recursively. The database synchronized events log matches standard WMO metadata sync frequencies.</span>
        </div>
      </div>
    </div>
  );
}
