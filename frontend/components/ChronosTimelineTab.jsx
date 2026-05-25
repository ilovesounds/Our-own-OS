"use client";

import React, { useState, useEffect } from 'react';
import { History, ArrowLeftRight, CheckCircle2, RotateCcw, AlertTriangle, FileCode } from 'lucide-react';

export default function ChronosTimelineTab({ statusData, onTriggerRollback }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [snapshotDetails, setSnapshotDetails] = useState(null);
  const [sliderVal, setSliderVal] = useState(0);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState(false);

  // Fetch snapshots list
  const fetchSnapshots = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chronos/snapshots');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
        // Automatically select the latest if none selected
        if (data.length > 0 && selectedSnapshotId === null) {
          const latest = data[data.length - 1];
          setSelectedSnapshotId(latest.id);
          setSliderVal(data.length - 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    const interval = setInterval(fetchSnapshots, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch specific snapshot details on change
  useEffect(() => {
    if (selectedSnapshotId === null) return;

    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/chronos/snapshot/${selectedSnapshotId}`);
        if (res.ok) {
          const data = await res.json();
          setSnapshotDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch snapshot details:", err);
      }
    };

    fetchDetails();
  }, [selectedSnapshotId]);

  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value);
    setSliderVal(idx);
    if (snapshots[idx]) {
      setSelectedSnapshotId(snapshots[idx].id);
      setRollbackSuccess(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedSnapshotId) return;
    setIsRollingBack(true);
    setRollbackSuccess(false);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chronos/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot_id: selectedSnapshotId })
      });

      if (res.ok) {
        setRollbackSuccess(true);
        // Let the parent component know so it updates its poll state immediately
        if (onTriggerRollback) {
          onTriggerRollback(selectedSnapshotId);
        }
      }
    } catch (err) {
      console.error("Failed to rollback:", err);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-[95%] mx-auto font-mono">
      {/* Telemetry Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            ⏳ Chronos Timeline
          </h1>
        </div>
        <div>
          <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded">
            HYDRADB LINK: IMMUTABLE LEDGER
          </span>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-zinc-950 border border-zinc-800 rounded-lg text-center gap-4 min-h-[300px]">
          <History size={48} className="text-zinc-700 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-white">No snapshots recorded</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Snapshots are written automatically by Core 05 to HydraDB at each phase of the LangGraph execution. Submit a prompt first.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Time slider area */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">TIMELINE SLIDER (PAST SNAPSHOTS)</span>
              <span className="text-lime-400 font-bold">SNAPSHOT {sliderVal + 1} OF {snapshots.length}</span>
            </div>

            {/* Actual HTML range slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max={snapshots.length - 1}
                value={sliderVal}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-ew-resize accent-lime-500 focus:outline-none"
              />
            </div>

            {/* Milestones labels */}
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1 relative">
              {snapshots.map((snap, i) => (
                <button
                  key={snap.id}
                  onClick={() => {
                    setSliderVal(i);
                    setSelectedSnapshotId(snap.id);
                    setRollbackSuccess(false);
                  }}
                  className={`flex flex-col items-center gap-1 focus:outline-none cursor-pointer ${
                    selectedSnapshotId === snap.id ? "text-lime-400" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full border ${
                    selectedSnapshotId === snap.id 
                      ? "bg-lime-500 border-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.8)]" 
                      : "bg-zinc-900 border-zinc-700"
                  }`}></span>
                  <span>Snap_{snap.id} ({snap.status})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rollback Trigger Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ready for rollback execution</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Restoring to this point will overwrite active memory buffers and reset core execution statuses back to safe standbys.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {rollbackSuccess && (
                <div className="text-xs text-lime-400 flex items-center gap-1.5 bg-lime-950/40 border border-lime-900/60 px-3 py-2 rounded">
                  <CheckCircle2 size={14} /> State Restored Successfully
                </div>
              )}
              
              <button
                onClick={handleRollback}
                disabled={isRollingBack}
                className="w-full sm:w-auto py-2.5 px-5 rounded text-xs font-extrabold bg-lime-500 hover:bg-lime-600 text-black flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-lime-500/20 disabled:opacity-50"
              >
                <RotateCcw size={14} className={isRollingBack ? "animate-spin" : ""} />
                {isRollingBack ? "ROLLING BACK STATE..." : "ROLLBACK TO THIS SNAPSHOT"}
              </button>
            </div>
          </div>

          {/* Code comparison split pane */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Pane: Plan Checklist */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col h-[400px]">
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase border-b border-zinc-900 pb-2 mb-3">
                CHECKLIST SNAPSHOT DETAILS
              </span>
              <div className="flex-grow overflow-y-auto font-mono text-xs text-zinc-300 space-y-4 pr-1">
                {snapshotDetails ? (
                  <div className="space-y-4 leading-relaxed">
                    <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/60 rounded border border-zinc-800">
                      <div>
                        <span className="text-[10px] text-zinc-500">SNAPSHOT ID:</span>
                        <p className="font-bold text-white">#{snapshotDetails.id}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500">SAVED STATUS:</span>
                        <p className="font-bold text-yellow-400">{snapshotDetails.status}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase block">Implementation Steps:</span>
                      <pre className="whitespace-pre-wrap font-sans text-xs bg-zinc-900/20 p-3 rounded border border-zinc-900 text-zinc-400">
                        {snapshotDetails.plan || "No plan compiled in this snapshot step."}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    <span>LOADING SNAPSHOT HISTORY...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Code Viewer */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase">
                  CORE CODE SNAPSHOT FILE
                </span>
                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                  <FileCode size={10} /> main.py
                </span>
              </div>
              <div className="flex-grow overflow-y-auto bg-black p-4 rounded border border-zinc-900 font-mono text-xs text-emerald-400 pr-1 max-h-[320px]">
                {snapshotDetails ? (
                  <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                    {snapshotDetails.code || "# No file write compiled at this execution step."}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    <span>LOADING WORKSPACE SNAPSHOT...</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
