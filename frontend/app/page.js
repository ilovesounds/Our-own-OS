"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Zap, History, LayoutGrid, Monitor, HelpCircle, Home as HomeIcon } from 'lucide-react';
import { getApiUrl } from '@/utils/api';
import PrompterTab from '@/components/PrompterTab';
import DevFactoryTab from '@/components/DevFactoryTab';
import ChaosControlTab from '@/components/ChaosControlTab';
import ChronosTimelineTab from '@/components/ChronosTimelineTab';
import LandingPage from '@/components/LandingPage';
import DocsTab from '@/components/DocsTab';

export default function Home() {
  const [viewMode, setViewMode] = useState('landing');
  const [activeTab, setActiveTab] = useState('prompter');
  const [statusData, setStatusData] = useState({
    active_core: null,
    cores: {
      "Core 00": "IDLE",
      "Core 01": "IDLE",
      "Core 02": "IDLE",
      "Core 03": "IDLE",
      "Core 04": "IDLE",
      "Core 05": "IDLE"
    },
    current_plan: "",
    current_code: "",
    last_error: "",
    chaos_enabled: false,
    recovery_status: "NONE",
    logs: []
  });

  // Polling backend status every 1000ms
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(getApiUrl('/api/devfactory/status'));
        if (res.ok) {
          const data = await res.json();
          setStatusData(data);
        }
      } catch (err) {
        console.warn("DevFactory Poll Warning: FastAPI server offline at 127.0.0.1:8000.");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleChaos = async (enabled) => {
    try {
      const res = await fetch(getApiUrl('/api/chaos/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(prev => ({ ...prev, chaos_enabled: data.chaos_enabled }));
      }
    } catch (err) {
      console.error("Failed to toggle chaos:", err);
    }
  };

  const handleTriggerRollback = async (snapshotId) => {
    // Instantly reset the client-side state of cores to IDLE to make UI snappy
    setStatusData(prev => ({
      ...prev,
      active_core: null,
      cores: {
        "Core 00": "IDLE",
        "Core 01": "IDLE",
        "Core 02": "IDLE",
        "Core 03": "IDLE",
        "Core 04": "IDLE",
        "Core 05": "IDLE"
      },
      last_error: ""
    }));
  };

  const handleTriggerRecovery = async () => {
    try {
      const res = await fetch(getApiUrl('/api/devfactory/recover'), {
        method: 'POST'
      });
      if (res.ok) {
        setStatusData(prev => ({
          ...prev,
          recovery_status: "RUNNING"
        }));
      }
    } catch (err) {
      console.error("Failed to trigger recovery:", err);
    }
  };

  const handleDismissRecovery = async () => {
    try {
      const res = await fetch(getApiUrl('/api/devfactory/clear-fault'), {
        method: 'POST'
      });
      if (res.ok) {
        setStatusData(prev => ({
          ...prev,
          last_error: "",
          recovery_status: "NONE"
        }));
      }
    } catch (err) {
      console.error("Failed to dismiss recovery:", err);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'prompter':
        return <PrompterTab setActiveTab={setActiveTab} />;
      case 'devfactory':
        return (
          <DevFactoryTab 
            statusData={statusData} 
            onTriggerRecovery={handleTriggerRecovery} 
            onDismissRecovery={handleDismissRecovery}
          />
        );
      case 'chaos':
        return <ChaosControlTab statusData={statusData} onToggleChaos={handleToggleChaos} />;
      case 'chronos':
        return <ChronosTimelineTab statusData={statusData} onTriggerRollback={handleTriggerRollback} />;
      case 'docs':
        return <DocsTab />;
      default:
        return <PrompterTab setActiveTab={setActiveTab} />;
    }
  };

  if (viewMode === 'landing') {
    return <LandingPage onEnterConsole={() => {
      setViewMode('terminal');
      setActiveTab('prompter');
    }} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-cyber-dark text-zinc-100 font-sans">
      
      {/* Navigation Header */}
      <header className="border-b border-cyber-gray bg-black/45 py-3 px-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="w-full max-w-[98%] mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
          
          {/* Brand header */}
          <div 
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="p-1 rounded bg-zinc-900 border border-zinc-700/80 text-lime-400">
              <Monitor size={16} />
            </div>
            <div>
              <h2 className="font-extrabold text-xs tracking-wide text-white uppercase leading-none">ChronosDev</h2>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 block">Chaos OS v1.0</span>
            </div>
          </div>

          {/* Nav Links (Horizontal with Wrap Support) */}
          <nav className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap shrink-0">
            <button
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition-all duration-205"
            >
              <HomeIcon size={12} className="text-zinc-500" />
              <span>Landing</span>
            </button>

            <button
              onClick={() => setActiveTab('prompter')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border transition-all duration-205 ${
                activeTab === 'prompter'
                  ? 'bg-green-950/20 text-green-400 border-green-900/60 shadow-[0_0_10px_rgba(34,197,94,0.15)] font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Terminal size={12} className={activeTab === 'prompter' ? 'text-green-400' : 'text-zinc-500'} />
              <span>Prompter</span>
            </button>

            <button
              onClick={() => setActiveTab('devfactory')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border transition-all duration-205 ${
                activeTab === 'devfactory'
                  ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Cpu size={12} className={activeTab === 'devfactory' ? 'text-cyan-400' : 'text-zinc-500'} />
              <span>DevFactory</span>
            </button>

            <button
              onClick={() => setActiveTab('chaos')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border transition-all duration-205 ${
                activeTab === 'chaos'
                  ? 'bg-red-950/20 text-red-400 border-red-900/60 shadow-[0_0_10px_rgba(239,68,68,0.15)] font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Zap size={12} className={activeTab === 'chaos' ? 'text-red-400' : 'text-zinc-500'} />
              <span>Chaos</span>
            </button>

            <button
              onClick={() => setActiveTab('chronos')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border transition-all duration-205 ${
                activeTab === 'chronos'
                  ? 'bg-lime-950/10 text-lime-400 border-lime-900/40 shadow-[0_0_10px_rgba(132,204,22,0.15)] font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <History size={12} className={activeTab === 'chronos' ? 'text-lime-400' : 'text-zinc-500'} />
              <span>Chronos</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wide cursor-pointer border transition-all duration-205 ${
                activeTab === 'docs'
                  ? 'bg-zinc-900/40 text-lime-400 border-zinc-800 shadow-[0_0_10px_rgba(132,204,22,0.15)] font-bold'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <HelpCircle size={12} className={activeTab === 'docs' ? 'text-lime-400' : 'text-zinc-500'} />
              <span>Specs</span>
            </button>
          </nav>

          {/* Telemetry Badges */}
          <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded">
              <span className="text-zinc-500">DB LINK:</span>
              <span className={statusData.cores ? "text-lime-400 font-bold" : "text-red-500"}>ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded">
              <span className="text-zinc-500">CHAOS MONKEY:</span>
              <span className={statusData.chaos_enabled ? "text-red-400 font-bold animate-pulse" : "text-zinc-500"}>
                {statusData.chaos_enabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow py-6 px-8 overflow-y-auto bg-cyber-dark/40">
        {renderActiveTab()}
      </main>

    </div>
  );
}
