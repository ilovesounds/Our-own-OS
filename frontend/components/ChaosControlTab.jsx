"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertOctagon, RefreshCw, Zap, Bomb } from 'lucide-react';

export default function ChaosControlTab({ statusData, onToggleChaos }) {
  const [chaosLogs, setChaosLogs] = useState([]);
  const logScrollRef = useRef(null);
  const { chaos_enabled = false, cores = {}, last_error = "" } = statusData || {};

  // Fetch chaos logs specifically
  useEffect(() => {
    const fetchChaosLogs = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/chaos/logs');
        if (res.ok) {
          const data = await res.json();
          setChaosLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch chaos logs:", err);
      }
    };

    fetchChaosLogs();
    const interval = setInterval(fetchChaosLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [chaosLogs]);

  // Determine colors of grid cells
  const getCellStyles = (coreId, defaultClass) => {
    const status = cores[coreId];
    if (status === "ERROR") {
      return "bg-red-500 text-white font-extrabold border-red-400 animate-pulse";
    }
    if (status === "RUNNING") {
      return "bg-cyan-400 text-black font-extrabold border-cyan-300 animate-led-glow";
    }
    return defaultClass; // IDLE color class
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-[95%] mx-auto font-mono text-zinc-300">
      
      {/* Visual Header */}
      <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-lime-400">05</span>
          <span className="text-xs text-zinc-600">/ 85 chaos</span>
        </div>
        <div className="text-xs text-zinc-500 font-mono">multiplayer</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Description and Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mt-1 leading-tight tracking-tight">
              ChaosOS — the OS as an arena
            </h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Developers write small scripts that fight for memory blocks in a shared cluster. It is /r/place crossed with Core War. The system itself is the game. The crowd is your demo.
          </p>

          {/* Toggle Control Area */}
          <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bomb size={14} className={chaos_enabled ? "text-red-500 animate-blink-fast" : "text-zinc-500"} />
                CHAOS MONKEY MODE
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${chaos_enabled ? "bg-red-950 border border-red-700 text-red-400" : "bg-zinc-900 border border-zinc-700 text-zinc-500"}`}>
                {chaos_enabled ? "ACTIVE" : "STANDBY"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onToggleChaos(!chaos_enabled)}
                className={`w-full py-3 px-4 rounded text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  chaos_enabled 
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-lg shadow-red-900/30" 
                    : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                }`}
              >
                <Zap size={14} className={chaos_enabled ? "animate-pulse" : ""} />
                {chaos_enabled ? "DEACTIVATE CHAOS MODE" : "ACTIVATE CHAOS MONKEY"}
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              * Enabling Chaos Monkey signals the interceptor to hijack tool links (disk writes, network pipes) and output artificial tracebacks.
            </p>
          </div>

          {/* Meta text bullets mirroring screenshot style */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <h4 className="text-white font-extrabold flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-lime-400"></span> HOW TO SHIP IT
              </h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                FastAPI interceptors inject 500 errors dynamically based on boolean states in python thread memory.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white font-extrabold flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-lime-400"></span> THE CLOSER
              </h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                Show tool failures, let the agent fail, disable chaos mode to let the agent auto-repair, or rollback time.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Arena Grid Map & Telemetry Banner */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Grid Layout Container */}
          <div className="bg-zinc-950 border border-zinc-800 rounded p-6 shadow-xl relative overflow-hidden">
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-3 border-b border-zinc-900 mb-4">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> CLUSTER · 6 CORES · UPTIME 12M</span>
              <span className="text-cyan-400">6 CORES ONLINE</span>
            </div>

            {/* Grid title */}
            <div className="text-xs text-zinc-400 mb-3 font-semibold tracking-wider flex items-center gap-1">
              <span>CORE ARENA MEMORY MAP</span>
            </div>

            {/* Arena Grid (2 rows of 6 blocks representing our cores + spaces) */}
            <div className="grid grid-cols-6 gap-2 aspect-[6/2] select-none text-xs font-bold mb-4">
              {/* Row 1 */}
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 00", "bg-blue-400 text-black border-blue-300")}`}>
                P1
              </div>
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 01", "bg-blue-400 text-black border-blue-300")}`}>
                P1
              </div>
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 02", "bg-purple-400 text-black border-purple-300")}`}>
                P2
              </div>
              {/* Neutral buffer block */}
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 03", "bg-purple-400 text-black border-purple-300")}`}>
                P2
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>

              {/* Row 2 */}
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 04", "bg-yellow-400 text-black border-yellow-300")}`}>
                P4
              </div>
              <div className={`border border-zinc-800 rounded flex items-center justify-center transition-all duration-300 ${getCellStyles("Core 05", "bg-yellow-400 text-black border-yellow-300")}`}>
                P4
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded flex items-center justify-center text-zinc-800">
                N/A
              </div>
            </div>

            {/* Grid Threat Footer */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-3 border-t border-zinc-900">
              <span className="flex items-center gap-1">
                {chaos_enabled ? (
                  <span className="text-red-400 flex items-center gap-1 animate-pulse">
                    ▲ threat · Core 01 & 02 failed: file_write_tool.sys timeout
                  </span>
                ) : (
                  <span className="text-zinc-500">▲ status · system operating at optimal parameters</span>
                )}
              </span>
              <span>server 42m 12s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crimson Scrolling Event Log */}
      <div className="bg-black border border-zinc-800 rounded-lg p-4 h-[190px] flex flex-col overflow-hidden">
        <span className="text-[9px] text-red-500/80 tracking-widest block uppercase border-b border-zinc-900 pb-1.5 mb-2">
          💥 CHAOS TELEMETRY log stream
        </span>
        <div 
          ref={logScrollRef}
          className="flex-grow overflow-y-auto space-y-2 text-xs font-mono text-red-400/90"
        >
          {chaosLogs.length > 0 ? (
            chaosLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed animate-pulse-red">
                [{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}] {log.message}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs">
              <span>WAITING FOR CHAOS INTERCEPTS...</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
