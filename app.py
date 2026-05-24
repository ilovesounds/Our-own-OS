from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import anthropic
from dotenv import load_dotenv

import database
import agent_graph

# Load environment variables from the .env file
load_dotenv()

app = FastAPI(title="ChronosDev Chaos OS Kernel")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ActionSchema(BaseModel):
    action_type: str
    target: str
    instructions: str
    required_cores: List[str]

class PromptRequest(BaseModel):
    prompt: str

class ChaosToggleRequest(BaseModel):
    enabled: bool

class RollbackRequest(BaseModel):
    snapshot_id: int

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    database.init_db()
    # Reset database ledger on system boot for a clean demo experience
    database.clear_db()
    database.add_log("System", "INFO", "KERNEL :: PrompterOS Kernel Booted Successfully.")
    database.add_log("System", "INFO", "Ready for natural language intent...")

# 1. Parse prompt & boot LangGraph workflow
@app.post("/api/parse-intent")
async def parse_intent(request: PromptRequest, background_tasks: BackgroundTasks):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    prompt = request.prompt
    
    # Define fallback action schema if Anthropic API is not available
    action_data = {
        "action_type": "GENERATE_CODE",
        "target": "logistics_tracker.py",
        "instructions": prompt,
        "required_cores": ["Planner", "Coder", "Tester", "Deployer", "HydraDB"]
    }
    
    if api_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            system_instruction = (
                "You are the PrompterOS Kernel Parser. Your job is to translate messy, casual human intent "
                "into a strict JSON action schema matching the provided tool definition. "
                "Do not include any conversational pleasantries."
            )
            
            response = client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=1000,
                temperature=0.1,
                system=system_instruction,
                messages=[{"role": "user", "content": prompt}],
                tools=[
                    {
                        "name": "parse_to_action_schema",
                        "description": "Outputs the structured operating system action commands.",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "action_type": {"type": "string", "description": "e.g. GENERATE_CODE, DEBUG_FILE, READ_DOCS"},
                                "target": {"type": "string", "description": "e.g. logistics_tracker.py, main.py"},
                                "instructions": {"type": "string", "description": "Filtered core task description"},
                                "required_cores": {
                                    "type": "array", 
                                    "items": {"type": "string"},
                                    "description": "Cores required, e.g. ['Planner', 'Coder', 'Tester']"
                                }
                            },
                            "required": ["action_type", "target", "instructions", "required_cores"]
                        }
                    }
                ],
                tool_choice={"type": "tool", "name": "parse_to_action_schema"}
            )
            
            # Extract output
            action_data = response.content[0].input
        except Exception as e:
            print(f"Anthropic parsing failed, using smart fallback. Error: {e}")
            database.add_log("System", "WARNING", f"Parser warning: falling back to mock schema. Details: {e}")
            if "logistics" in prompt.lower():
                action_data["target"] = "logistics_tracker.py"
            elif "sort" in prompt.lower() or "search" in prompt.lower():
                action_data["target"] = "sorting_algorithm.py"
            else:
                action_data["target"] = "app_server.py"

    # Log command validation in HydraDB
    database.add_log("Prompter", "INFO", f"user >> {prompt}")
    database.add_log("Prompter", "INFO", f"ACTION SCHEMA GENERATED :: {action_data.get('action_type')}")
    database.add_log("Prompter", "INFO", f"TARGET :: {action_data.get('target')}")
    database.add_log("Prompter", "INFO", "HANDING OFF TO DEVFACTORY KERNEL...")
    
    # Trigger background execution loop of LangGraph
    background_tasks.add_task(
        agent_graph.run_agent_workflow,
        prompt_text=prompt,
        target_file=action_data.get("target"),
        instructions=action_data.get("instructions")
    )
    
    return action_data

# 2. Get real-time status of CPU cores, logs, plan and code
@app.get("/api/devfactory/status")
async def get_devfactory_status():
    return {
        "active_core": agent_graph.OSState.active_core,
        "cores": agent_graph.OSState.cores,
        "current_plan": agent_graph.OSState.current_plan,
        "current_code": agent_graph.OSState.current_code,
        "last_error": agent_graph.OSState.last_error,
        "chaos_enabled": agent_graph.OSState.chaos_enabled,
        "recovery_status": agent_graph.OSState.recovery_status,
        "logs": database.get_logs(limit=60)
    }

# 2.5 Clear core faults and reset recovery state
@app.post("/api/devfactory/clear-fault")
async def clear_fault():
    agent_graph.OSState.last_error = ""
    agent_graph.OSState.recovery_status = "NONE"
    database.add_log("System", "INFO", "System faults dismissed. Telemetry reset.")
    return {"status": "success"}

# 3. Toggle Chaos Monkey Mode
@app.post("/api/chaos/toggle")
async def toggle_chaos(request: ChaosToggleRequest):
    agent_graph.OSState.chaos_enabled = request.enabled
    
    if request.enabled:
        database.add_log("Chaos", "CHAOS", "[CHAOS] ACTIVATE CHAOS MONKEY MODE: Tool disruption and context corruption active.")
        database.add_log("Chaos", "CHAOS", "[CHAOS] Intercepting file_write_tool.sys... Port 5432 query timeouts simulated.")
    else:
        database.add_log("Chaos", "INFO", "[CHAOS] Chaos Monkey Mode disabled. Restoring memory channels and tool links.")
        
    return {"chaos_enabled": agent_graph.OSState.chaos_enabled}

# 3.5 Trigger Manual Recovery when Chaos is OFF and system is in fault
@app.post("/api/devfactory/recover")
async def trigger_recovery(background_tasks: BackgroundTasks):
    if agent_graph.OSState.chaos_enabled:
        raise HTTPException(status_code=400, detail="Cannot trigger recovery while Chaos Monkey Mode is active.")
        
    if not agent_graph.OSState.last_error:
        raise HTTPException(status_code=400, detail="No active faults reported. System is already operating normally.")
        
    database.add_log("System", "INFO", "INITIATING SYSTEM RECOVERY CORE SEQUENCER...")
    
    # Run agent workflow starting with corrector
    background_tasks.add_task(
        agent_graph.run_agent_workflow,
        prompt_text=agent_graph.OSState.active_prompt or "Manual Recovery Run",
        target_file=agent_graph.OSState.active_target,
        instructions="Triggering self-healing recovery routine.",
        plan_override=agent_graph.OSState.current_plan,
        code_override=agent_graph.OSState.current_code,
        errors_override=[agent_graph.OSState.last_error],
        status_override="CHAOS_FAULT"
    )
    
    return {"status": "started"}

# 4. Get Chaos Control Logs
@app.get("/api/chaos/logs")
async def get_chaos_logs():
    # Returns all logs that have CHAOS status or are emitted by the Chaos source
    all_logs = database.get_logs(limit=100)
    chaos_logs = [log for log in all_logs if log["level"] == "CHAOS" or log["source"] == "Chaos"]
    return chaos_logs

# 5. List all snapshots
@app.get("/api/chronos/snapshots")
async def get_snapshots_list():
    return database.get_snapshots()

# 6. Get details of a single snapshot
@app.get("/api/chronos/snapshot/{snapshot_id}")
async def get_snapshot_details(snapshot_id: int):
    snapshot = database.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snapshot

# 7. Rollback to a specific snapshot
@app.post("/api/chronos/rollback")
async def rollback_state(request: RollbackRequest):
    snapshot = database.get_snapshot(request.snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot ID not found in HydraDB ledger.")
    
    # Overwrite the in-memory OS State to roll back time
    agent_graph.OSState.current_plan = snapshot["plan"]
    agent_graph.OSState.current_code = snapshot["code"]
    agent_graph.OSState.last_error = ""
    
    # Reset all execution cores back to idle
    agent_graph.OSState.active_core = None
    for core in agent_graph.OSState.cores:
        agent_graph.OSState.cores[core] = "IDLE"
        
    # Log the rollback event
    database.add_log("Chronos", "INFO", f"[ROLLBACK] Restore point triggered! Reverted workspace database state to Snapshot #{request.snapshot_id}.")
    
    # Write a new rollback event snapshot to register it in history
    database.create_snapshot(snapshot["plan"], snapshot["code"], "RECOVERED")
    
    return {"status": "success", "snapshot_id": request.snapshot_id}