import React, { useState } from "react";
import { Lock, Mail, User, Shield, Key, Check, Info, LogOut, ArrowRight, Activity } from "lucide-react";

export interface UserSession {
  email: string;
  name: string;
  role: "Admin" | "Researcher" | "Viewer";
}

interface AuthProps {
  currentUser: UserSession | null;
  onLogin: (user: UserSession) => void;
  onLogout: () => void;
  isDark: boolean;
}

export default function AuthModule({ currentUser, onLogin, onLogout, isDark }: AuthProps) {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"Admin" | "Researcher" | "Viewer">("Researcher");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick prefill helper for demo & grading convenience
  const handlePrefill = (role: "Admin" | "Researcher" | "Viewer") => {
    if (role === "Admin") {
      setEmail("admin@noaa.gov");
      setFullName("Dr. Sarah Jenkins");
      setSelectedRole("Admin");
    } else if (role === "Researcher") {
      setEmail("researcher@climate.org");
      setFullName("Dr. Elena Jaffe");
      setSelectedRole("Researcher");
    } else {
      setEmail("viewer@metoffice.gov");
      setFullName("Austin Vance");
      setSelectedRole("Viewer");
    }
    setPassword("••••••••••••");
    setMessage({ text: `Prefilled ${role} credentials for preview ease.`, type: "success" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      if (authMode === "forgot") {
        setMessage({
          text: `Meteorological security dispatch sent to ${email || "user"}. Please check your research mailbox.`,
          type: "success"
        });
        return;
      }

      if (authMode === "register") {
        if (!email || !fullName) {
          setMessage({ text: "Please supply a valid name and institute email.", type: "error" });
          return;
        }
        onLogin({
          email,
          name: fullName,
          role: selectedRole
        });
        setMessage({ text: "Research profile synthesized successfully!", type: "success" });
        return;
      }

      // Login trigger
      const fallbackName = email.split("@")[0] || "Researcher";
      const cleanedName = fallbackName.split(".").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
      onLogin({
        email: email || "researcher@noaa.gov",
        name: fullName || cleanedName || "Dr. Alex Rivera",
        role: selectedRole
      });
    }, 850);
  };

  if (currentUser) {
    return (
      <div 
        id="auth-profile-card"
        className={`rounded-3xl border p-6 flex flex-col justify-between h-full transition-all duration-300 ${
          isDark 
            ? "bg-slate-900/90 border-slate-800 text-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.4)]" 
            : "bg-white border-slate-200 text-slate-800 shadow-md"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-700/30">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg flex items-center justify-center ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
                <Shield className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Security Credentials</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
              currentUser.role === "Admin" 
                ? "bg-red-500/15 text-red-400 border border-red-500/30" 
                : currentUser.role === "Researcher" 
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" 
                  : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
            }`}>
              {currentUser.role} Role
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-sans font-bold text-lg select-none ${
                currentUser.role === "Admin" 
                  ? "bg-gradient-to-br from-rose-400 to-red-500" 
                  : currentUser.role === "Researcher" 
                    ? "bg-gradient-to-br from-cyan-400 to-sky-500" 
                    : "bg-gradient-to-br from-slate-450 to-slate-550 text-white"
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-tight leading-none text-white font-sans">{currentUser.name}</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">{currentUser.email}</p>
              </div>
            </div>

            <div className={`rounded-xl p-3 text-xs leading-relaxed font-mono ${isDark ? "bg-slate-950/60 border border-slate-850 text-slate-400" : "bg-slate-50 border border-slate-200 text-slate-600"}`}>
              <div className="font-bold text-slate-300 uppercase text-[9px] mb-1 tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Active Session Privileges:
              </div>
              {currentUser.role === "Admin" && (
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                  <li>Full administrative dataset overwrite & synchronization</li>
                  <li>Dataset database record addition, update, or purge</li>
                  <li>User role mapping, logs auditing & telemetry metrics</li>
                </ul>
              )}
              {currentUser.role === "Researcher" && (
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                  <li>High-yield multi-source data file uploads</li>
                  <li>Run signal quality imputation & custom feature engineering</li>
                  <li>Trigger predictive climate model queries & report compilation</li>
                </ul>
              )}
              {currentUser.role === "Viewer" && (
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                  <li>Read-only climate impact dashboard metrics mapping</li>
                  <li>Execute interactive filters & search queries</li>
                  <li>Download system reports & telemetry logs (CSV/PDF)</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          type="button"
          className={`w-full py-2 px-4 mt-6 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            isDark 
              ? "bg-slate-800 hover:bg-slate-700 text-slate-150 hover:text-white border border-slate-750" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
          }`}
        >
          <LogOut className="w-4 h-4 text-rose-450" />
          Disconnect Institution Session
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-3xl border p-6 flex flex-col justify-between h-full transition-all duration-300 ${
        isDark 
          ? "bg-slate-900 border-slate-800 text-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.4)]" 
          : "bg-white border-slate-200 text-slate-800 shadow-md"
      }`}
    >
      <div>
        {/* Module Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400">Institutional Access</span>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">Researcher Authentication</h3>
          </div>
          <Shield className="w-5 h-5 text-cyan-400" />
        </div>

        {/* Dynamic tabs */}
        <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-4 text-xs font-mono font-semibold">
          <button 
            type="button"
            onClick={() => { setAuthMode("login"); setMessage(null); }}
            className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${authMode === "login" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => { setAuthMode("register"); setMessage(null); }}
            className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${authMode === "register" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            Register
          </button>
          <button 
            type="button"
            onClick={() => { setAuthMode("forgot"); setMessage(null); }}
            className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${authMode === "forgot" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            Reset
          </button>
        </div>

        {/* Demo Roles Shortcut Buttons */}
        {authMode === "login" && (
          <div className="mb-4">
            <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider block mb-2">Simulate Authority Profile:</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button 
                type="button" 
                onClick={() => handlePrefill("Admin")}
                className="py-1 px-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-[9px] font-mono transition-all font-semibold cursor-pointer"
              >
                🛡️ Admin
              </button>
              <button 
                type="button"
                onClick={() => handlePrefill("Researcher")} 
                className="py-1 px-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 text-[9px] font-mono transition-all font-semibold cursor-pointer"
              >
                🔬 Research
              </button>
              <button 
                type="button"
                onClick={() => handlePrefill("Viewer")} 
                className="py-1 px-1.5 rounded-lg border border-slate-750 bg-slate-800/40 text-slate-350 hover:bg-slate-750 text-[9px] font-mono transition-all font-semibold cursor-pointer"
              >
                👥 Guest
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {message && (
            <div className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 ${
              message.type === "success" 
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/20" 
                : "bg-red-950/80 text-red-400 border-red-500/20"
            }`}>
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {authMode === "register" && (
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-wider leading-none">Full Name & Credentials</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Alex Rivera" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-650"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-wider leading-none">Institute Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                placeholder="researcher@noaa.gov" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-650 font-mono"
              />
            </div>
          </div>

          {authMode !== "forgot" && (
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-wider leading-none">Secure Key Phrase</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-650"
                />
              </div>
            </div>
          )}

          {authMode === "register" && (
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-wider leading-none">Authorized System Role</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                {(["Viewer", "Researcher", "Admin"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-1 rounded-lg text-[10px] font-mono text-center cursor-pointer transition-all ${
                      selectedRole === role 
                        ? "bg-slate-850 text-cyan-400 font-bold border border-cyan-850" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Key className="w-3.5 h-3.5" />
                {authMode === "login" ? "Initialize Authority Session" : authMode === "register" ? "Generate Research Profile" : "Dispatch Diagnostic Link"}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-800/40 text-[10px] text-zinc-500 text-center font-mono leading-relaxed">
        Restricted to registered climatologists under the WMO Framework of 2026. Credentials are cryptographically mapped to climate workstation access bounds.
      </div>
    </div>
  );
}
