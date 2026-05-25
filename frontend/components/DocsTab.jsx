"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Terminal, Zap, Layers, Play, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function DocsTab() {
  const [demoState, setDemoState] = useState('IDLE'); // IDLE, PLAN, WRITE, TEST, CHAOS_CHECK, CORRECT, DEPLOY, DONE
  const [chaosInjected, setChaosInjected] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const intervalRef = useRef(null);

  const steps = [
    { name: "Prompter Input", desc: "User goals parsed into action commands", core: "SHELL" },
    { name: "Planner Core", desc: "Core 00 breaks down goal into checklist", core: "Core 00" },
    { name: "Coder Core", desc: "Core 01 generates python/react workspace files", core: "Core 01" },
    { name: "Tester Core", desc: "Core 02 runs automated assertions and checks", core: "Core 02" },
    { name: "Self-Corrector", desc: "Core 03 auto-heals exceptions & syntax faults", core: "Core 03" },
    { name: "Deployer Core", desc: "Core 04 bundles safe workspace code", core: "Core 04" },
    { name: "HydraDB Core", desc: "Core 05 records immutable timeline states", core: "Core 05" }
  ];

  const handleStartDemo = () => {
    setDemoState('PLAN');
    setActiveStep(1);
    let currentStep = 1;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      currentStep++;
      
      if (currentStep === 3) {
        // Coder step
        setDemoState('WRITE');
        setActiveStep(2);
      } else if (currentStep === 4) {
        // Tester step
        setDemoState('TEST');
        setActiveStep(3);
      } else if (currentStep === 5) {
        if (chaosInjected) {
          setDemoState('CHAOS_FAIL');
          setActiveStep(4); // Corrector Core
        } else {
          setDemoState('DEPLOY');
          setActiveStep(5); // Deployer
        }
      } else if (currentStep === 6) {
        if (chaosInjected) {
          // Self-Corrector runs, then redirects to deploy
          setDemoState('CORRECTING');
          setActiveStep(4);
        } else {
          setDemoState('LEDGER');
          setActiveStep(6); // HydraDB ledger
        }
      } else if (currentStep === 7) {
        if (chaosInjected) {
          setDemoState('DEPLOY');
          setActiveStep(5);
        } else {
          setDemoState('DONE');
          setActiveStep(-1);
          clearInterval(intervalRef.current);
        }
      } else if (currentStep === 8) {
        if (chaosInjected) {
          setDemoState('LEDGER');
          setActiveStep(6);
        }
      } else if (currentStep === 9) {
        setDemoState('DONE');
        setActiveStep(-1);
        clearInterval(intervalRef.current);
      }
    }, 1500);
  };

  const handleResetDemo = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDemoState('IDLE');
    setActiveStep(-1);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full max-w-[95%] mx-auto font-mono text-zinc-300">
      
      {/* Title */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="text-lime-400" size={20} /> Specs & Core Architecture Guide
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Specification details */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-lg shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-lime-400" /> WHAT IS CHAOSOS?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              ChaosOS is a specialized agentic runtime container designed for parallel code orchestration, automated verification, and resilient self-healing. Using a 6-core LangGraph engine, ChaosOS delegates task decomposition, code generation, diagnostics, packaging, and auditing to specialized AI sub-processes.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-lg shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" /> PHYSICAL CORE ARCHITECTURE
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="border-l-2 border-blue-500 pl-3">
                <span className="text-white font-bold">Core 00 [Planner]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Translates natural language inputs into clean action lists and verification checklists.</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <span className="text-white font-bold">Core 01 [Coder]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Asynchronously writes logic, schemas, and styling components to the workspace.</p>
              </div>
              <div className="border-l-2 border-purple-500 pl-3">
                <span className="text-white font-bold">Core 02 [Tester]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Executes local test assertions and reports stack trace anomalies.</p>
              </div>
              <div className="border-l-2 border-purple-500 pl-3">
                <span className="text-white font-bold">Core 03 [Self-Corrector]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Monitors execution tracebacks, analyzes error syntax, and applies patches in-place.</p>
              </div>
              <div className="border-l-2 border-yellow-500 pl-3">
                <span className="text-white font-bold">Core 04 [Deployer]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Pipes finished modules, runs compile audits, and exposes sandbox endpoints.</p>
              </div>
              <div className="border-l-2 border-yellow-500 pl-3">
                <span className="text-white font-bold">Core 05 [HydraDB Core]</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Maintains a secure ledger of snapshot state history, enabling timeline rollbacks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2D Simulation Pipeline */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-lg shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" /> 2D PIPELINE SIMULATOR
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChaosInjected(!chaosInjected)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                    chaosInjected 
                      ? 'bg-red-950/45 border-red-700 text-red-400 animate-pulse' 
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {chaosInjected ? '⚠️ CHAOS INJECTED' : 'INJECT CHAOS'}
                </button>
                <button
                  onClick={handleStartDemo}
                  disabled={demoState !== 'IDLE' && demoState !== 'DONE'}
                  className="px-2.5 py-1 rounded text-[10px] bg-lime-500 hover:bg-lime-600 text-black font-extrabold flex items-center gap-1 transition disabled:opacity-30 cursor-pointer"
                >
                  <Play size={10} /> PLAY FLOW
                </button>
                <button
                  onClick={handleResetDemo}
                  className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <RefreshCw size={10} />
                </button>
              </div>
            </div>

            {/* Pipeline nodes map */}
            <div className="relative flex flex-col gap-4 py-2">
              
              {/* Animated node dot connection lines */}
              <div className="absolute left-[24px] top-6 bottom-6 w-0.5 bg-zinc-900 z-0"></div>
              
              {steps.map((step, idx) => {
                const isStepActive = activeStep === idx;
                const isStepCompleted = activeStep > idx || demoState === 'DONE';
                let stepColorClass = "border-zinc-800 bg-zinc-950 text-zinc-500";
                let dotColorClass = "bg-zinc-800";

                if (isStepActive) {
                  if (idx === 4 && demoState === 'CORRECTING') {
                    stepColorClass = "border-amber-700 bg-amber-950/20 text-amber-300 ring-2 ring-amber-950 shadow-md shadow-amber-950/20";
                    dotColorClass = "bg-amber-400 animate-ping";
                  } else if (demoState === 'CHAOS_FAIL' && idx === 3) {
                    stepColorClass = "border-red-700 bg-red-950/20 text-red-400 ring-2 ring-red-950 shadow-md shadow-red-950/20";
                    dotColorClass = "bg-red-500 animate-ping";
                  } else {
                    stepColorClass = "border-lime-700 bg-lime-950/20 text-lime-400 ring-2 ring-lime-950 shadow-md shadow-lime-950/20";
                    dotColorClass = "bg-lime-400 animate-ping";
                  }
                } else if (isStepCompleted) {
                  stepColorClass = "border-zinc-800 bg-zinc-900/40 text-zinc-300";
                  dotColorClass = "bg-zinc-600";
                }

                return (
                  <div key={idx} className={`relative flex items-start gap-4 p-3 rounded-lg border transition-all duration-300 z-10 ${stepColorClass}`}>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full shrink-0">
                      <span className={`w-3.5 h-3.5 rounded-full border border-black shadow ${dotColorClass} transition-colors duration-300`}></span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-xs uppercase">{step.name}</span>
                        <span className="text-[10px] text-zinc-500">{step.core}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400/80 font-sans mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Bottom status display */}
            <div className="p-4 rounded-lg bg-black border border-zinc-900 flex items-center justify-between min-h-[58px]">
              <div>
                <span className="text-[9px] text-zinc-500 block uppercase">SYSTEM STATE STREAM</span>
                <div className="text-xs font-bold mt-1 flex items-center gap-1.5">
                  {demoState === 'IDLE' && <span className="text-zinc-500">STANDBY - Click PLAY FLOW to start demonstration</span>}
                  {demoState === 'PLAN' && <span className="text-cyan-400 animate-pulse">PLANNING PHASE: Compiling action checklist...</span>}
                  {demoState === 'WRITE' && <span className="text-cyan-400 animate-pulse">GENERATION PHASE: Compiling source packages...</span>}
                  {demoState === 'TEST' && <span className="text-purple-400 animate-pulse">VERIFICATION PHASE: Executing local tests suite...</span>}
                  {demoState === 'CHAOS_FAIL' && (
                    <span className="text-red-400 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={12} className="text-red-500" /> EXCEPTION: Disk intercept timeout in Core 02 tests!
                    </span>
                  )}
                  {demoState === 'CORRECTING' && (
                    <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <ShieldCheck size={12} className="text-amber-500" /> SELF-HEALING: Patching files, rebuilding sandbox...
                    </span>
                  )}
                  {demoState === 'DEPLOY' && <span className="text-yellow-400 animate-pulse">DEPLOYMENT PHASE: Releasing bundle packages...</span>}
                  {demoState === 'LEDGER' && <span className="text-lime-400 animate-pulse">LEDGER WRITE: Committing snapshot to HydraDB...</span>}
                  {demoState === 'DONE' && <span className="text-lime-400 flex items-center gap-1"><ShieldCheck size={12} /> SYSTEM READY - Cycle successfully completed.</span>}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
