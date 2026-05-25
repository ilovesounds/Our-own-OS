"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Cpu, Zap, History, ChevronRight } from 'lucide-react';

export default function LandingPage({ onEnterConsole }) {
  const canvasRef = useRef(null);
  const [tiltStyles, setTiltStyles] = useState({ card1: {}, card2: {}, card3: {} });

  // Terminal Typing Simulation State
  const [demoIndex, setDemoIndex] = useState(0);
  const [typedPrompt, setTypedPrompt] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [currentStatus, setCurrentStatus] = useState("STANDBY");
  const [stage, setStage] = useState(0); // 0: typing prompt, 1: compile status, 2: reveal code, 3: completed wait

  const demoScenarios = [
    {
      prompt: "scaffold a fastapi health check endpoint",
      status: "COMPILING API SCHEMA...",
      code: `@app.get("/health")\ndef get_health():\n    return {"status": "healthy", "cores": 6}`
    },
    {
      prompt: "retrieve list of all active core timelines",
      status: "FETCHING HYDRADB RECORDS...",
      code: `timelines = db.query("SELECT * FROM snapshots")\nprint(f"Loaded {len(timelines)} states")`
    },
    {
      prompt: "run diagnostics check on Core 03 corrector",
      status: "EXECUTING CORRECTOR DIAGNOSTICS...",
      code: `faults = corrector.audit_filesystem()\nif faults:\n    corrector.patch_modules(faults)`
    }
  ];

  useEffect(() => {
    let timer;
    const currentDemo = demoScenarios[demoIndex];

    if (stage === 0) {
      // Type prompt
      let charIndex = 0;
      setTypedPrompt("");
      setCurrentCode("");
      setCurrentStatus("STANDBY");

      const typeChar = () => {
        if (charIndex < currentDemo.prompt.length) {
          setTypedPrompt(currentDemo.prompt.substring(0, charIndex + 1));
          charIndex++;
          timer = setTimeout(typeChar, 50);
        } else {
          // Finished typing, move to status compilation
          timer = setTimeout(() => {
            setStage(1);
          }, 800);
        }
      };
      typeChar();
    } else if (stage === 1) {
      // Show compiler status
      setCurrentStatus(currentDemo.status);
      timer = setTimeout(() => {
        setStage(2);
      }, 1200);
    } else if (stage === 2) {
      // Reveal code block
      let charIndex = 0;
      const typeCode = () => {
        if (charIndex < currentDemo.code.length) {
          setCurrentCode(currentDemo.code.substring(0, charIndex + 4));
          charIndex += 4;
          timer = setTimeout(typeCode, 20);
        } else {
          setCurrentCode(currentDemo.code);
          setStage(3);
        }
      };
      typeCode();
    } else if (stage === 3) {
      // Wait, then cycle to next scenario
      timer = setTimeout(() => {
        setDemoIndex((prev) => (prev + 1) % demoScenarios.length);
        setStage(0);
      }, 3500);
    }

    return () => clearTimeout(timer);
  }, [demoIndex, stage]);

  // 3D Projection Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 3D points
    // 6 core nodes
    const cores = [
      { name: "Planner", x: -100, y: -60, z: -100, color: "#06b6d4" },
      { name: "Coder", x: 100, y: -60, z: -100, color: "#06b6d4" },
      { name: "Tester", x: 120, y: 60, z: -50, color: "#a78bfa" },
      { name: "Corrector", x: -120, y: 60, z: -50, color: "#f59e0b" },
      { name: "Deployer", x: 0, y: -100, z: 120, color: "#eab308" },
      { name: "HydraDB", x: 0, y: 100, z: 120, color: "#84cc16" }
    ];

    // Floating particles
    const particles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 80 + Math.random() * 180;
      particles.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 200,
        z: Math.sin(angle) * radius,
        size: 1 + Math.random() * 2
      });
    }

    let angleX = 0.003;
    let angleY = 0.005;

    // Rotate points
    const rotate = (point, sinX, cosX, sinY, cosY) => {
      // Rotate Y
      let x1 = point.x * cosY - point.z * sinY;
      let z1 = point.z * cosY + point.x * sinY;
      
      // Rotate X
      let y2 = point.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + point.y * sinX;

      return { ...point, x: x1, y: y2, z: z2 };
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const fov = 350; // Camera perspective field of view
      const cx = width / 2;
      const cy = height / 2;

      const sinX = Math.sin(angleX);
      const cosX = Math.cos(angleX);
      const sinY = Math.sin(angleY);
      const cosY = Math.cos(angleY);

      // Rotate all core nodes
      const projectedCores = cores.map(core => {
        const rotated = rotate(core, sinX, cosX, sinY, cosY);
        // Persist rotations back to base core positions slowly
        core.x = rotated.x;
        core.y = rotated.y;
        core.z = rotated.z;

        // Project to 2D
        const scale = fov / (fov + rotated.z);
        const x2d = rotated.x * scale + cx;
        const y2d = rotated.y * scale + cy;

        return { ...rotated, x2d, y2d, scale };
      });

      // Rotate and project particles
      const projectedParticles = particles.map(p => {
        const rotated = rotate(p, sinX, cosX, sinY, cosY);
        p.x = rotated.x;
        p.y = rotated.y;
        p.z = rotated.z;

        const scale = fov / (fov + rotated.z);
        const x2d = rotated.x * scale + cx;
        const y2d = rotated.y * scale + cy;

        return { x2d, y2d, scale, size: p.size };
      });

      // Draw particle constellation backdrops
      ctx.fillStyle = "rgba(132, 204, 22, 0.45)";
      projectedParticles.forEach(p => {
        if (p.x2d >= 0 && p.x2d <= width && p.y2d >= 0 && p.y2d <= height) {
          ctx.beginPath();
          ctx.arc(p.x2d, p.y2d, p.size * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw wireframe connecting links
      ctx.strokeStyle = "rgba(63, 63, 70, 0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < projectedCores.length; i++) {
        for (let j = i + 1; j < projectedCores.length; j++) {
          ctx.beginPath();
          ctx.moveTo(projectedCores[i].x2d, projectedCores[i].y2d);
          ctx.lineTo(projectedCores[j].x2d, projectedCores[j].y2d);
          ctx.stroke();
        }
      }

      // Draw core nodes
      projectedCores.forEach(c => {
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = c.color;

        ctx.beginPath();
        ctx.arc(c.x2d, c.y2d, 7 * c.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // Reset glow

        // Text label
        ctx.fillStyle = "rgba(244, 244, 245, 0.85)";
        ctx.font = `12px Outfit, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(c.name.toUpperCase(), c.x2d, c.y2d - 14);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Card Mouse Tilt Effect
  const handleMouseMove = (cardKey, e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // x coordinate relative to element
    const y = e.clientY - rect.top;  // y coordinate relative to element
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    // Tilt calculations (max 12deg rotation)
    const rotateY = ((x - xc) / xc) * 12;
    const rotateX = -((y - yc) / yc) * 12;

    setTiltStyles(prev => ({
      ...prev,
      [cardKey]: {
        transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`,
        transition: 'transform 0.05s ease-out',
        borderColor: 'rgba(132, 204, 22, 0.45)',
        boxShadow: '0 10px 25px -5px rgba(132, 204, 22, 0.12)'
      }
    }));
  };

  const handleMouseLeave = (cardKey) => {
    setTiltStyles(prev => ({
      ...prev,
      [cardKey]: {
        transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: 'all 0.3s ease-in-out'
      }
    }));
  };

  return (
    <div className="relative min-h-screen bg-cyber-dark text-zinc-100 flex flex-col font-sans scanlines-overlay overflow-y-auto">
      
      {/* 3D background canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-[65vh] md:h-screen pointer-events-none opacity-60 z-0" 
      />

      {/* Decorative neon borders & grid layout */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(132,204,22,0.06),rgba(0,0,0,0))] pointer-events-none z-0" />

      {/* Content wrapper */}
      <div className="relative flex-grow flex flex-col justify-between max-w-[95%] mx-auto px-6 py-12 z-10 w-full">
        
        {/* Logo/Identity */}
        <header className="flex items-center gap-3">
          <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-lime-400">
            <Terminal size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest text-white uppercase leading-none">KRATOS OS</h1>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">AGENTIC SANDBOX SYSTEMS</span>
          </div>
        </header>

        {/* Main Hero & Terminal Simulation Grid */}
        <div className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12">
          
          {/* Left Column: Hero copy */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              An Autonomous <span className="text-lime-400">6-Core Arena</span> Sandbox.
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-sans max-w-lg">
              Deploy natural language instructions to an agentic multi-core processor sandbox. Inject chaos exceptions, run automated repairs, and rollback ledger histories seamlessly.
            </p>
            <div className="pt-2">
              <button
                onClick={onEnterConsole}
                className="group px-7 py-3.5 bg-lime-500 hover:bg-lime-600 text-black font-extrabold text-xs uppercase tracking-widest rounded flex items-center gap-2 cursor-pointer shadow-lg shadow-lime-500/10 hover:shadow-lime-500/20 hover:scale-[1.02] transition-all duration-300"
              >
                Enter System Console
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Terminal Agent Demo */}
          <div className="lg:col-span-6 w-full max-w-lg lg:max-w-none mx-auto">
            <div className="w-full bg-black/85 border border-zinc-800 rounded-lg shadow-2xl p-6 md:p-7 font-mono text-sm select-none relative overflow-hidden backdrop-blur-sm">
              
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-5">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-xs text-zinc-500 tracking-wider">agent_compiler.py</span>
                <span className="text-xs text-zinc-500">v1.0</span>
              </div>

              {/* Terminal Body */}
              <div className="space-y-5 min-h-[310px] flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2 leading-relaxed">
                    <span className="text-lime-400 shrink-0">user@kratos:~$</span>
                    <span className="text-zinc-300 whitespace-pre-wrap">{typedPrompt}</span>
                    {stage === 0 && <span className="w-1.5 h-4 bg-lime-400 animate-pulse inline-block align-middle"></span>}
                  </div>

                  {stage > 0 && (
                    <div className="mt-3 text-xs text-cyan-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                      <span>{currentStatus}</span>
                    </div>
                  )}
                </div>

                {currentCode && (
                  <div className="bg-zinc-950/70 border border-zinc-900 p-4 rounded text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    {currentCode}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* 3D Tilting Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900/70">
          
          {/* Card 1 */}
          <div 
            onMouseMove={(e) => handleMouseMove('card1', e)}
            onMouseLeave={() => handleMouseLeave('card1')}
            style={tiltStyles.card1}
            className="p-5 bg-zinc-950/70 border border-zinc-900 rounded-lg flex flex-col justify-between gap-4 cursor-default select-none transition-all duration-200"
          >
            <div className="space-y-2">
              <Cpu size={20} className="text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Agentic Orchestration</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Six dedicated co-processors manage steps from planning to deployment in a visual LangGraph thread.
              </p>
            </div>
            <span className="text-[9px] text-zinc-600 uppercase font-mono tracking-wider">CORE 00 - 04 STATUS: OK</span>
          </div>

          {/* Card 2 */}
          <div 
            onMouseMove={(e) => handleMouseMove('card2', e)}
            onMouseLeave={() => handleMouseLeave('card2')}
            style={tiltStyles.card2}
            className="p-5 bg-zinc-950/70 border border-zinc-900 rounded-lg flex flex-col justify-between gap-4 cursor-default select-none transition-all duration-200"
          >
            <div className="space-y-2">
              <Zap size={20} className="text-red-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Chaos Interceptor</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Inject artificial tracebacks to observe how the auto-corrector diagnoses, resolves, and repairs tasks.
              </p>
            </div>
            <span className="text-[9px] text-zinc-600 uppercase font-mono tracking-wider">CHAOS INTERCEPT: READY</span>
          </div>

          {/* Card 3 */}
          <div 
            onMouseMove={(e) => handleMouseMove('card3', e)}
            onMouseLeave={() => handleMouseLeave('card3')}
            style={tiltStyles.card3}
            className="p-5 bg-zinc-950/70 border border-zinc-900 rounded-lg flex flex-col justify-between gap-4 cursor-default select-none transition-all duration-200"
          >
            <div className="space-y-2">
              <History size={20} className="text-lime-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Ledger Rollbacks</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                HydraDB journals audit logs and timeline snapshots, allowing developers to roll the system back to any point.
              </p>
            </div>
            <span className="text-[9px] text-zinc-600 uppercase font-mono tracking-wider">IMMUTABLE BLOCK: CONNECTED</span>
          </div>

        </div>

      </div>

      {/* Scroll Down Features Manual Section */}
      <section className="relative max-w-[95%] mx-auto px-6 py-24 border-t border-zinc-900 z-10 w-full space-y-16">
        
        {/* Section Header */}
        <div className="text-left space-y-2">
          <span className="text-[10px] font-mono text-lime-400 uppercase tracking-widest block">SYSTEM REFERENCE MANUAL</span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">6-Core Architecture & Sandbox Modes</h3>
        </div>

        {/* 6-Core Grid */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">1. Hardware Core Allocation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Core 00 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 00 [Planner]</span>
                <span className="px-2 py-0.5 bg-cyan-950/40 text-[9px] text-cyan-400 rounded border border-cyan-900">PLANNING</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Compiles conversational requests into actionable tasks. Decomposes large goals into detailed checklists and step dependencies.
              </p>
            </div>

            {/* Core 01 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 01 [Coder]</span>
                <span className="px-2 py-0.5 bg-cyan-950/40 text-[9px] text-cyan-400 rounded border border-cyan-900">WRITE</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Generates modular React layout structures, Tailwind styles, and FastAPI backend endpoints directly to the workspaces.
              </p>
            </div>

            {/* Core 02 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 02 [Tester]</span>
                <span className="px-2 py-0.5 bg-purple-950/40 text-[9px] text-purple-400 rounded border border-purple-900">VERIFY</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Launches automated test scripts, runs static checks, and evaluates code behavior against initial plan objectives.
              </p>
            </div>

            {/* Core 03 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 03 [Corrector]</span>
                <span className="px-2 py-0.5 bg-amber-950/40 text-[9px] text-amber-400 rounded border border-amber-900">SELF-HEAL</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Monitors compilation trace logs, parses execution errors, drafts in-place code hotfixes, and automatically retries tests.
              </p>
            </div>

            {/* Core 04 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 04 [Deployer]</span>
                <span className="px-2 py-0.5 bg-yellow-950/40 text-[9px] text-yellow-400 rounded border border-yellow-900">DEPLOY</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Compiles the fully verified codebase, builds production assets, and restarts service endpoints safely.
              </p>
            </div>

            {/* Core 05 */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3 hover:border-zinc-800 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Core 05 [HydraDB]</span>
                <span className="px-2 py-0.5 bg-lime-950/40 text-[9px] text-lime-400 rounded border border-lime-900">LEDGER</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                Writes immutable states, snapshot logs, and changes to the central database, establishing timeline rollbacks.
              </p>
            </div>

          </div>
        </div>

        {/* 4 System Modes Terminals Section */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">2. System Mode Specifications</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Terminal 1: Prompter Shell */}
            <div className="bg-black/90 border border-zinc-900 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">prompter_core.sh</span>
                <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase">MODE 01</span>
              </div>
              {/* Body */}
              <div className="p-5 font-mono text-[11px] space-y-3">
                <div className="flex items-center gap-1.5 text-lime-400">
                  <span>$</span>
                  <span>cat /etc/modes/prompter.conf</span>
                </div>
                <div className="text-zinc-300 leading-relaxed space-y-1">
                  <p className="text-white font-bold uppercase text-xs tracking-wide">🖥️ PROMPT MODE</p>
                  <p className="text-zinc-400 text-[11px] font-sans mt-1">
                    An interactive chat-based workspace interface where natural language commands are translated directly into core task plans. Supports context attachment and full project configuration schemas.
                  </p>
                  <div className="pt-2 text-lime-500">
                    STATUS: LISTENING_TO_PORT_3000
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal 2: DevCore Tab */}
            <div className="bg-black/90 border border-zinc-900 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">dev_orchestrator.py</span>
                <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase">MODE 02</span>
              </div>
              {/* Body */}
              <div className="p-5 font-mono text-[11px] space-y-3">
                <div className="flex items-center gap-1.5 text-lime-400">
                  <span>$</span>
                  <span>python -m devcore --monitor</span>
                </div>
                <div className="text-zinc-300 leading-relaxed space-y-1">
                  <p className="text-white font-bold uppercase text-xs tracking-wide">⚙️ DEVCORE MODE</p>
                  <p className="text-zinc-400 text-[11px] font-sans mt-1">
                    The core orchestrator manager console. Displays live system log trace streams, file writing operations, testing feedback loops, and status summaries across all 6 physical cores.
                  </p>
                  <div className="pt-2 text-cyan-400">
                    THREAD_POOL_SIZE: 6_ACTIVE_CORES
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal 3: Chaos Mode */}
            <div className="bg-black/90 border border-zinc-900 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">chaos_monkey.bin</span>
                <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase">MODE 03</span>
              </div>
              {/* Body */}
              <div className="p-5 font-mono text-[11px] space-y-3">
                <div className="flex items-center gap-1.5 text-red-400">
                  <span>$</span>
                  <span>./chaos_monkey --inject-all</span>
                </div>
                <div className="text-zinc-300 leading-relaxed space-y-1">
                  <p className="text-white font-bold uppercase text-xs tracking-wide">💥 CHAOS MODE</p>
                  <p className="text-zinc-400 text-[11px] font-sans mt-1">
                    An active disruption simulator that injects artificial compilation tracebacks, division-by-zero faults, and file lock errors to stress-test the auto-correction resilience loops.
                  </p>
                  <div className="pt-2 text-red-500 animate-pulse">
                    INTERCEPTOR: ARMED_AND_ACTIVE
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal 4: Chronos Mode */}
            <div className="bg-black/90 border border-zinc-900 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-900 bg-zinc-950/50">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                </div>
                 <span className="text-[10px] font-mono text-zinc-500">kratos_ledger.db</span>
                <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase">MODE 04</span>
              </div>
              {/* Body */}
              <div className="p-5 font-mono text-[11px] space-y-3">
                <div className="flex items-center gap-1.5 text-lime-400">
                  <span>$</span>
                  <span>sqlite3 kratos.db "SELECT * FROM commits"</span>
                </div>
                <div className="text-zinc-300 leading-relaxed space-y-1">
                   <p className="text-white font-bold uppercase text-xs tracking-wide">⏳ KRATOS OS MODE</p>
                  <p className="text-zinc-400 text-[11px] font-sans mt-1">
                    The snapshot history ledger navigator. Records full-state workspaces, configuration logs, and timeline journal actions, enabling developers to roll the workspace state back seamlessly.
                  </p>
                  <div className="pt-2 text-lime-400">
                    TIMELINE_STATUS: SYNCED_WITH_KRATOSDB
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. LangGraph Workflow Execution Protocol */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">3. Agentic Graph Execution Protocol</h4>
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-6 space-y-6">
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Kratos OS orchestrates agentic tasks through a cyclic state management model powered by LangGraph. Below is the operational sequence triggered when a user issues an intent prompt:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="border-l-2 border-cyan-500 pl-4 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400">PHASE 01</span>
                <h5 className="text-xs font-bold text-white uppercase font-mono">Intent Parsing</h5>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Llama 3.3 vectorizes raw prompt strings into validated JSON schemas, selecting target file buffers and routing requirements.
                </p>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400">PHASE 02</span>
                <h5 className="text-xs font-bold text-white uppercase font-mono">Checklist Compilation</h5>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Core 00 (Planner) maps constraints, compiles target checklists, and establishes file dependencies.
                </p>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400">PHASE 03</span>
                <h5 className="text-xs font-bold text-white uppercase font-mono">Source Construction</h5>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Core 01 (Coder) accesses plan objectives and writes modular modules directly to local directories.
                </p>
              </div>
              <div className="border-l-2 border-cyan-500 pl-4 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400">PHASE 04</span>
                <h5 className="text-xs font-bold text-white uppercase font-mono">Assurance & Healing</h5>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  Core 02 (Tester) validates source code. If assertions fail, Core 03 (Self-Corrector) reviews trace logs and applies repairs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. HydraDB Engine Overview */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">4. Hybrid Edge-to-Cloud Database Engine</h4>
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-6 space-y-6">
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Data reliability is managed using a zero-trust dual journal system, linking edge execution with cloud database states:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-zinc-900/20 border border-zinc-900 rounded p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                  <h5 className="text-xs font-bold text-white uppercase font-mono">Immutable SQLite Ledger</h5>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Stores live snapshots at `/tmp/hydradb.db` in serverless modes and `hydradb.db` in local modes. Preserves strict hash audits of plan states, corrected source scripts, and chronological execution timelines.
                </p>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-900 rounded p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-400"></span>
                  <h5 className="text-xs font-bold text-white uppercase font-mono">Ledger-Synced Time Travel</h5>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Enables rollback recovery by capturing snapshots at every step transition. Restores plan checkmarks, disk buffers, and co-processor logs, letting you reverse chaotic system faults instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
