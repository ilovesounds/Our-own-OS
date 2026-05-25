"use client";

import React, { useRef, useEffect } from 'react';
import { Cpu, Activity, ShieldAlert, Code2, AlertTriangle, Layers } from 'lucide-react';

const coreInfo = [
  { id: "Core 00", name: "Planner Core", role: "Goal Decomposition", desc: "Translates instructions into structured step plan.", color: "cyan" },
  { id: "Core 01", name: "Coder Core", role: "Code Generation", desc: "Writes program code and files to workspace.", color: "cyan" },
  { id: "Core 02", name: "Tester Core", role: "Quality Assurance", desc: "Executes unit test assertions and check suites.", color: "violet" },
  { id: "Core 03", name: "Corrector Core", role: "Self-Correction Engine", desc: "Analyzes tracebacks to automatically patch bugs.", color: "violet" },
  { id: "Core 04", name: "Deployer Core", role: "Production Packer", desc: "Bundles code and simulates gateway deployment.", color: "lime" },
  { id: "Core 05", name: "HydraDB Core", role: "Memory Bus / Ledger", desc: "Writes immutable audit logs and snapshots.", color: "lime" }
];

export default function DevFactoryTab({ statusData, onTriggerRecovery, onDismissRecovery }) {
  const logScrollRef = useRef(null);
  const lastLogCountRef = useRef(0);
  
  const { 
    cores = {}, 
    active_core = null, 
    last_error = "", 
    logs = [], 
    current_plan = "", 
    current_code = "", 
    chaos_enabled = false,
    recovery_status = "NONE"
  } = statusData || {};

  useEffect(() => {
    if (logScrollRef.current) {
      const container = logScrollRef.current;
      const lengthChanged = logs.length !== lastLogCountRef.current;
      
      if (lengthChanged) {
        const isAtBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 60;
        const isFirstLoad = lastLogCountRef.current === 0;
        const isReset = logs.length < lastLogCountRef.current;
        
        if (isFirstLoad || isAtBottom || isReset) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 50);
        }
        lastLogCountRef.current = logs.length;
      }
    }
  }, [logs]);

  // Color mapping based on status
  const getCoreStyles = (coreId, status) => {
    if (status === "RUNNING") {
      return {
        border: "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.35)] bg-cyan-950/20",
        led: "bg-cyan-400 animate-led-glow",
        textColor: "text-cyan-400"
      };
    } else if (status === "ERROR") {
      return {
        border: "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] bg-red-950/20 animate-pulse",
        led: "bg-red-500 animate-blink-fast",
        textColor: "text-red-400"
      };
    } else {
      // IDLE
      return {
        border: "border-zinc-800/80 bg-zinc-950/40",
        led: "bg-zinc-700",
        textColor: "text-zinc-500"
      };
    }
  };

  const getBoxConfig = () => {
    if (recovery_status === "RUNNING") {
      return {
        bg: "bg-amber-950/20 border-amber-900/60 shadow-lg shadow-amber-950/25",
        text: "text-amber-300",
        border: "border-amber-900/40",
        title: "🛠️ SYSTEM AUTO-HEALING RECOVERY IN PROGRESS",
        statusText: "HEALING",
        isProgress: true
      };
    } else if (recovery_status === "SUCCESS") {
      return {
        bg: "bg-green-950/20 border-green-900/60 shadow-lg shadow-green-950/25",
        text: "text-green-300",
        border: "border-green-900/40",
        title: "✅ SYSTEM AUTO-HEALING RECOVERY COMPLETED",
        statusText: "HEALTHY",
        isSuccess: true
      };
    } else if (recovery_status === "FAILED") {
      return {
        bg: "bg-red-950/20 border-red-900/60 shadow-lg shadow-red-950/25",
        text: "text-red-300",
        border: "border-red-900/40",
        title: "❌ SYSTEM AUTO-HEALING RECOVERY FAILED",
        statusText: "HALTED",
        isFailed: true
      };
    } else {
      return {
        bg: "bg-red-950/20 border-red-900/60 shadow-lg shadow-red-950/25",
        text: "text-red-400",
        border: "border-red-900/40",
        title: "⚠️ CORE FAULT REPORTED IN KERNEL TRACEBACK",
        statusText: "DISRUPTED",
        isFault: true
      };
    }
  };

  const recoveryLogs = logs
    .filter(log => ["System", "Corrector", "Deployer", "Chaos"].includes(log.source))
    .slice(-3);

  const isBoxVisible = !!(last_error || (recovery_status && recovery_status !== "NONE"));
  const config = getBoxConfig();

  return (
    <div className="flex flex-col gap-6 h-full max-w-[95%] mx-auto font-mono">
      {/* Header telemetry */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            ⚙️ DevFactory CPU Manager
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded text-zinc-400">
            <Activity size={12} className="text-cyan-400 animate-pulse" />
            <span>ACTIVE CORE: <strong className="text-white">{active_core || "NONE (SLEEP)"}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded text-zinc-400">
            <span>Uptime: <strong className="text-white">12m 45s</strong></span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-grow">
        {/* Core Chips Grid */}
        <div className="xl:col-span-2 space-y-4">
          <div className="text-xs text-zinc-400 font-mono flex items-center justify-between pb-1">
            <span>6 CORES CONNECTED</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreInfo.map((core) => {
              const status = cores[core.id] || "IDLE";
              const styles = getCoreStyles(core.id, status);
              
              return (
                <div 
                  key={core.id}
                  className={`border rounded-lg p-4 flex flex-col justify-between min-h-[170px] transition-all duration-300 relative overflow-hidden ${styles.border}`}
                >
                  {/* Pin aesthetics on CPU chip side */}
                  <div className="absolute top-0 left-4 right-4 h-0.5 flex justify-between">
                    <span className="w-1 h-0.5 bg-zinc-800"></span>
                    <span className="w-1 h-0.5 bg-zinc-800"></span>
                    <span className="w-1 h-0.5 bg-zinc-800"></span>
                    <span className="w-1 h-0.5 bg-zinc-800"></span>
                  </div>

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{core.id}</span>
                      {/* LED Light */}
                      <span className={`w-2 h-2 rounded-full ${styles.led}`}></span>
                    </div>

                    <h3 className="text-sm font-extrabold text-white mt-1.5">{core.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{core.role}</span>
                    <p className="text-xs text-zinc-400 mt-2 font-sans line-clamp-2 leading-relaxed">{core.desc}</p>
                  </div>

                  {/* Footer status bar */}
                  <div className="border-t border-zinc-900/60 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">STATUS:</span>
                    <span className={`text-[10px] font-mono font-bold ${styles.textColor}`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Multi-state Auto-Healing and Fault Box */}
          {isBoxVisible && (
            <div className={`border rounded-lg p-4 font-mono text-xs space-y-3 shadow-lg transition-all duration-300 ${config.bg} ${config.border}`}>
              <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-2 mb-1">
                <AlertTriangle size={14} className={`${config.text} ${config.isProgress ? 'animate-spin' : config.isFault ? 'animate-blink-fast' : ''}`} />
                <span className={`font-bold uppercase tracking-wider ${config.text}`}>
                  {config.title}
                </span>
              </div>

              {/* Show error context if available */}
              {last_error && (
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Fault Trace: <code className="text-zinc-200 bg-black/40 px-1 py-0.5 rounded border border-zinc-900 font-mono">{last_error}</code>
                </div>
              )}

              {/* 1. Default Fault State (Not Recovering Yet) */}
              {config.isFault && (
                <div className="space-y-3">
                  <div className="text-[10px] text-red-500/80 pt-1 flex items-center justify-between border-t border-red-950/20 pt-2">
                    <span>INTERRUPT SOURCE: CHAOS_OS_INTERCEPTOR</span>
                    <span>STATUS: {config.statusText}</span>
                  </div>
                  <div className="pt-1 flex justify-end">
                    {chaos_enabled ? (
                      <button
                        disabled
                        className="w-full md:w-auto px-4 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-500 rounded text-[11px] font-bold cursor-not-allowed uppercase tracking-wider"
                      >
                        🚫 Disable Chaos Monkey to recover
                      </button>
                    ) : (
                      <button
                        onClick={onTriggerRecovery}
                        className="w-full md:w-auto px-4 py-2 bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-800 hover:border-red-600 rounded text-[11px] font-bold cursor-pointer transition-all duration-200 uppercase tracking-wider shadow-lg shadow-red-950/40 animate-pulse hover:animate-none"
                      >
                        🛠️ Run Auto-Healing Recovery
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Recovery Running State */}
              {config.isProgress && (
                <div className="space-y-2 mt-2 border-t border-amber-900/30 pt-3">
                  <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold font-mono">
                    Real-Time Recovery Stream:
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] bg-black/40 p-2.5 rounded border border-amber-950/40 max-h-[110px] overflow-y-auto">
                    {recoveryLogs.length > 0 ? (
                      recoveryLogs.map((log) => (
                        <div key={log.id} className="flex justify-between gap-2 leading-relaxed border-b border-zinc-950 pb-1 last:border-b-0">
                          <span className="text-amber-400 shrink-0">[{log.source.toUpperCase()}]</span>
                          <span className="text-zinc-300 flex-grow">{log.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 italic animate-pulse">Initializing correction cores...</div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Recovery Success State */}
              {config.isSuccess && (
                <div className="space-y-2 mt-2 border-t border-green-900/30 pt-3">
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    The self-corrector core successfully resolved all injected exceptions, synchronized filesystem buffers with HydraDB ledger, and redeployed the sandbox modules.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={onDismissRecovery}
                      className="px-4 py-2 bg-green-950/40 hover:bg-green-900/30 text-green-300 border border-green-800 hover:border-green-600 rounded text-[11px] font-bold cursor-pointer transition-all duration-200 uppercase tracking-wider"
                    >
                      Dismiss Diagnostics
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Recovery Failed State */}
              {config.isFailed && (
                <div className="space-y-2 mt-2 border-t border-red-900/30 pt-3">
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Recovery loop terminated due to persistent chaos disruption. Ensure Chaos Monkey Mode is deactivated, then retry.
                  </p>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={onDismissRecovery}
                      className="px-4 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-[11px] font-bold cursor-pointer transition-all duration-200 uppercase tracking-wider"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={onTriggerRecovery}
                      className="px-4 py-2 bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-800 hover:border-red-600 rounded text-[11px] font-bold cursor-pointer transition-all duration-200 uppercase tracking-wider animate-pulse"
                    >
                      Retry Recovery
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Telemetry Log Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col h-[520px] shadow-xl">
          <div className="border-b border-zinc-800 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mt-1">
              <Layers size={12} className="text-cyan-500" /> Kernel Execution Logs
            </h2>
          </div>

          {/* Scrollable feed */}
          <div 
            ref={logScrollRef}
            className="flex-grow overflow-y-auto space-y-2.5 font-mono text-xs pr-1"
          >
            {logs.length > 0 ? (
              logs.map((log) => {
                let lvlColor = "text-zinc-500";
                let textStyle = "text-zinc-300";
                
                if (log.level === "ERROR") {
                  lvlColor = "text-red-400 border border-red-950 bg-red-950/20 px-1 rounded";
                  textStyle = "text-red-300 font-medium";
                } else if (log.level === "CHAOS") {
                  lvlColor = "text-red-500 border border-red-950 bg-red-950/40 px-1 rounded animate-blink-fast";
                  textStyle = "text-red-400 font-bold";
                } else if (log.level === "WARNING") {
                  lvlColor = "text-yellow-400 border border-yellow-950 bg-yellow-950/20 px-1 rounded";
                  textStyle = "text-yellow-300";
                } else if (log.source === "HydraDB") {
                  lvlColor = "text-lime-400 border border-lime-950 bg-lime-950/20 px-1 rounded";
                  textStyle = "text-lime-300/90";
                } else if (log.source === "Planner") {
                  lvlColor = "text-cyan-400 border border-cyan-950 bg-cyan-950/20 px-1 rounded";
                  textStyle = "text-cyan-300";
                } else if (log.source === "Coder") {
                  lvlColor = "text-cyan-400 border border-cyan-950 bg-cyan-950/20 px-1 rounded";
                  textStyle = "text-cyan-300";
                }

                return (
                  <div key={log.id} className="leading-relaxed border-b border-zinc-900 pb-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span>[{log.source.toUpperCase()}]</span>
                      <span>{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}</span>
                    </div>
                    <p className={`${textStyle} whitespace-pre-wrap`}>
                      <span className={`${lvlColor} mr-1.5`}>{log.level}</span>
                      {log.message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                <Cpu size={24} className="text-zinc-800 animate-pulse" />
                <span>WAITING FOR PIPELINE KICKOFF</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
