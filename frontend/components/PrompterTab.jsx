"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Cpu, CheckCircle } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

export default function PrompterTab({ setActiveTab }) {
  const [input, setInput] = useState('');
  const [consoleLines, setConsoleLines] = useState([
    'KERNEL :: PrompterOS Booted Successfully.',
    'LOGS   :: Listening on memory bus channel 05.',
    'Ready for natural language intent...'
  ]);
  const [schemaData, setSchemaData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLines]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;

    const userPrompt = input;
    setConsoleLines(prev => [...prev, `user >> ${userPrompt}`]);
    setInput('');
    setIsParsing(true);
    setSchemaData(null);

    // Simulate thinking state
    setConsoleLines(prev => [...prev, 'KERNEL PARSER :: Intercepting signal... Parsing NLP vectors.']);

    try {
      const response = await fetch(getApiUrl('/api/parse-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!response.ok) throw new Error('API server returned error');
      
      const data = await response.json();
      
      setIsParsing(false);
      setSchemaData(data);
      
      setConsoleLines(prev => [
        ...prev,
        'SYSTEM >> LLM analysis validated.',
        `ACTION SCHEMA GENERATED :: [${data.action_type}]`,
        `TARGET FILE REGISTERED :: ${data.target}`,
        'KERNEL CONTROL >> Core 00 - Core 05 spinning up. Handing off to DevFactory...'
      ]);

      // Leap to Tab 2 to watch cores process tasks live!
      setTimeout(() => {
        setActiveTab('devfactory');
      }, 2500);

    } catch (error) {
      setIsParsing(false);
      setConsoleLines(prev => [
        ...prev,
        'KERNEL ERROR :: Link failure to parser backend. Check if app.py is running on :8000.'
      ]);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-[95%] mx-auto">
      {/* Description header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            🖥️ Prompter Shell
          </h1>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-green-500 font-mono bg-green-950/40 border border-green-900/60 px-2 py-0.5 rounded animate-pulse-glow">
            ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-[500px]">
        {/* Terminal Container */}
        <div className="lg:col-span-2 bg-black/90 rounded-lg border border-zinc-800 flex flex-col justify-between overflow-hidden relative shadow-lg shadow-black/50 scanlines-overlay">
          {/* Header Bar */}
          <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-2"><Terminal size={12} className="text-green-500" /> prompter@chaos-os:~</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
          </div>

          {/* Scrollable logs */}
          <div 
            ref={scrollRef} 
            className="flex-grow p-5 overflow-y-auto space-y-2.5 font-mono text-sm text-green-400 min-h-[350px] max-h-[420px]"
          >
            {consoleLines.map((line, idx) => {
              let textClass = "text-green-400";
              if (line.startsWith("user >>")) textClass = "text-cyan-400 font-medium";
              else if (line.startsWith("KERNEL ERROR")) textClass = "text-red-400 animate-pulse";
              else if (line.includes("GENERATED") || line.includes("REGISTERED")) textClass = "text-yellow-400";
              else if (line.startsWith("SYSTEM >>")) textClass = "text-green-500";
              
              return (
                <div key={idx} className={`${textClass} whitespace-pre-wrap leading-relaxed`}>
                  {line}
                </div>
              );
            })}
            
            {isParsing && (
              <div className="text-yellow-500 font-mono text-sm flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full animate-blink-fast"></span>
                CLAUDE INTENT ENGINE :: Restructuring NLP strings...
              </div>
            )}
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4 bg-zinc-950/80 flex items-center gap-2">
            <span className="text-green-500 font-mono font-bold select-none">&gt;&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isParsing}
              placeholder="Type your goal (e.g. 'Scaffold an API for a logistics tracker')"
              className="bg-transparent text-green-400 focus:outline-none flex-grow font-mono text-sm caret-green-500 disabled:opacity-50"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isParsing || !input.trim()}
              className="p-1.5 rounded bg-green-950 border border-green-800 text-green-400 hover:bg-green-900 transition disabled:opacity-30 disabled:hover:bg-green-950"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Action Schema Sidebar */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mt-1">
                <Cpu size={14} className="text-yellow-500" /> Action Plan
              </h2>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Natural language queries are parsed into structured schemas with forced tool schema output on Claude 3.5.
            </p>

            {schemaData ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">ACTION_TYPE:</span>
                    <span className="text-cyan-400 font-bold">{schemaData.action_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-500">TARGET:</span>
                    <span className="text-yellow-400">{schemaData.target}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 block">CORES_REQUIRED:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {schemaData.required_cores && schemaData.required_cores.map((core, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] border border-zinc-700">
                          {core}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-green-950/20 border border-green-900/50 p-3 rounded flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-green-400">Execution Plan Booted</h4>
                    <p className="text-[10px] text-green-500/80 leading-relaxed mt-0.5">
                      The instruction was parsed, logged in HydraDB, and dispatched to the background kernels.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg p-10 text-center text-zinc-500 gap-2 flex-grow h-[220px]">
                <Terminal size={32} className="text-zinc-700 animate-pulse-glow" />
                <span className="text-xs font-mono">WAITING FOR NLP STREAM</span>
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-zinc-600 font-mono border-t border-zinc-900 pt-4 flex items-center justify-between">
            <span>BUS LINK: HYDRADB // 05</span>
            <span>OS PROTOCOL V1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
