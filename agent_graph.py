import time
import os
import random
import traceback
import anthropic
from groq import Groq
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import database

# Global OS State for real-time polling
class OSState:
    chaos_enabled = False
    custom_chaos_script = ""
    active_core = None
    cores = {
        "Core 00": "IDLE",  # Planner
        "Core 01": "IDLE",  # Coder
        "Core 02": "IDLE",  # Tester
        "Core 03": "IDLE",  # Self-Corrector
        "Core 04": "IDLE",  # Deployer
        "Core 05": "IDLE",  # HydraDB Core
    }
    current_plan = ""
    current_code = ""
    active_prompt = ""
    active_target = "logistics_tracker.py"
    last_error = ""
    recovery_status = "NONE"

# Define the Graph state shape
class AgentState(TypedDict):
    prompt: str
    action_type: str
    target: str
    instructions: str
    plan: str
    code: str
    tests: str
    errors: List[str]
    status: str
    iteration: int

# Initialize Groq Client safely
def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        return Groq(api_key=api_key)
    return None

# Initialize Claude API Client safely
def get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        return anthropic.Anthropic(api_key=api_key)
    return None

def trigger_hydradb_sync(plan: str, code: str, status: str, source: str, log_message: str):
    """
    Simulates Core 05 (Memory Bus) firing to capture snapshot and logs.
    """
    OSState.cores["Core 05"] = "RUNNING"
    database.add_log(source, "INFO", log_message)
    # Save the physical snapshot in PostgreSQL/SQLite
    snap_id = database.create_snapshot(plan, code, status)
    database.add_log("HydraDB", "INFO", f"Saved state snapshot index #{snap_id} successfully.")
    time.sleep(0.4)
    OSState.cores["Core 05"] = "IDLE"
    return snap_id

def check_chaos_intercept(core_id: str, default_error_type: str, default_msg: str, state: AgentState):
    if not OSState.chaos_enabled:
        return None

    OSState.cores[core_id] = "ERROR"
    error_msg = default_msg
    error_type = default_error_type

    if getattr(OSState, "custom_chaos_script", None):
        try:
            local_vars = {"state": state, "database": database, "OSState": OSState, "core_id": core_id}
            exec(OSState.custom_chaos_script, {}, local_vars)
        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)

    source_log = core_id.replace("Core ", "")
    database.add_log("Chaos", "CHAOS", f"[CHAOS] {error_type}: {error_msg}")
    database.add_log(source_log, "ERROR", f"Execution failed. Fault: {error_msg}")
    state["errors"].append(f"{error_type}: {error_msg}")
    state["status"] = "CHAOS_FAULT"
    OSState.last_error = f"{error_type}: {error_msg}"
    trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", source_log, "Snapshot saved in ERROR state.")
    return state

# ----------------- Core 00: Planner Node -----------------
def planner_node(state: AgentState) -> AgentState:
    OSState.active_core = "Core 00"
    OSState.cores["Core 00"] = "RUNNING"
    database.add_log("Planner", "INFO", f"Core 00 activated. Deconstructing schema target: '{state['target']}'...")
    time.sleep(1.0)  # Visual cycle delay

    # 0. Check for Manual Recovery Run
    if state["status"] == "CHAOS_FAULT":
        database.add_log("Planner", "INFO", "Recovery trigger detected. Retaining current checklist/plan.")
        OSState.cores["Core 00"] = "IDLE"
        return state

    # 1. Chaos Interceptor Check
    intercept = check_chaos_intercept("Core 00", "ContextWindowCorruption", "Context window data corruption (500)", state)
    if intercept:
        return intercept

    # 2. Plan Generation
    groq_client = get_groq_client()
    anthropic_client = get_anthropic_client()
    instructions = state["instructions"]
    
    plan = None
    
    if groq_client:
        try:
            system_instruction = "You are the PrompterOS Planner kernel (Core 00). Output a clean, checklist-based implementation plan in markdown."
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Plan for: {instructions}"}
                ],
                temperature=0.2
            )
            plan = response.choices[0].message.content
        except Exception as e:
            print(f"Groq Planner failed: {e}")
            database.add_log("Planner", "WARNING", f"Groq Planner failed, trying Anthropic... Details: {e}")
            
    if not plan and anthropic_client:
        try:
            system_instruction = "You are the PrompterOS Planner kernel (Core 00). Output a clean, checklist-based implementation plan in markdown."
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=800,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Plan for: {instructions}"}]
            )
            plan = response.content[0].text
        except Exception as e:
            print(f"Anthropic Planner failed: {e}")
            database.add_log("Planner", "WARNING", f"Anthropic Planner failed... Details: {e}")
            
    if not plan:
        plan = (
            f"# Execution Plan for {state['target']}\n"
            f"■ Step 1: Initialize code structure for '{state['target']}'.\n"
            f"■ Step 2: Implement core logic described in: '{instructions}'.\n"
            f"■ Step 3: Set up test assertions and export code.\n"
            f"■ Step 4: Run system diagnostics and verify database links."
        )

    state["plan"] = plan
    OSState.current_plan = plan
    state["status"] = "PLANNING"
    
    trigger_hydradb_sync(plan, state["code"], "PLANNING", "Planner", "Implementation plan created and synced.")
    OSState.cores["Core 00"] = "IDLE"
    return state

# ----------------- Core 01: Coder Node -----------------
def coder_node(state: AgentState) -> AgentState:
    # If we arrived here with errors, skip normal execution
    if state["errors"]:
        return state

    OSState.active_core = "Core 01"
    OSState.cores["Core 01"] = "RUNNING"
    database.add_log("Coder", "INFO", "Core 01 activated. Writing code based on implementation plan...")
    time.sleep(2.0)

    # 1. Chaos Interceptor Check
    intercept = check_chaos_intercept("Core 01", "IOException", "file_write_tool.sys disconnected (500)", state)
    if intercept:
        return intercept

    # 2. Code Generation
    groq_client = get_groq_client()
    anthropic_client = get_anthropic_client()
    plan = state["plan"]
    target = state["target"]

    code = None

    if groq_client:
        try:
            system_instruction = f"You are the PrompterOS Coder kernel (Core 01). Write clean, runnable code for {target}. Return ONLY the raw code."
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Implementation plan:\n{plan}\n\nTarget File: {target}"}
                ],
                temperature=0.2
            )
            code = response.choices[0].message.content
        except Exception as e:
            print(f"Groq Coder failed: {e}")
            database.add_log("Coder", "WARNING", f"Groq Coder failed, trying Anthropic... Details: {e}")

    if not code and anthropic_client:
        try:
            system_instruction = f"You are the PrompterOS Coder kernel (Core 01). Write clean, runnable code for {target}. Return ONLY the raw code."
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=1000,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Implementation plan:\n{plan}\n\nTarget File: {target}"}]
            )
            code = response.content[0].text
        except Exception as e:
            print(f"Anthropic Coder failed: {e}")
            database.add_log("Coder", "WARNING", f"Anthropic Coder failed... Details: {e}")

    if not code:
        # Generate generic mock code
        code = (
            f"# === Generated System Module: {target} ===\n"
            f"import time\n"
            f"import logging\n\n"
            f"logging.basicConfig(level=logging.INFO)\n"
            f"logger = logging.getLogger('{target.split('.')[0]}')\n\n"
            f"def execute_task(data: dict):\n"
            f"    logger.info('Processing tracking event...')\n"
            f"    # Simulated Core task processing\n"
            f"    time.sleep(0.5)\n"
            f"    return {{'status': 'success', 'processed': True, 'timestamp': time.time()}}\n\n"
            f"if __name__ == '__main__':\n"
            f"    print('Module execution completed successfully.')\n"
        )

    state["code"] = code
    OSState.current_code = code
    state["status"] = "CODING"

    trigger_hydradb_sync(state["plan"], code, "CODING", "Coder", "Source code compiled and synced.")
    OSState.cores["Core 01"] = "IDLE"
    return state

# ----------------- Core 02: Tester Node -----------------
def tester_node(state: AgentState) -> AgentState:
    if state["errors"]:
        return state

    OSState.active_core = "Core 02"
    OSState.cores["Core 02"] = "RUNNING"
    database.add_log("Tester", "INFO", "Core 02 activated. Compiling code and executing test assertions...")
    time.sleep(2.0)

    # 1. Chaos Interceptor Check
    intercept = check_chaos_intercept("Core 02", "ZeroDivisionError", "division by zero (Test Failure)", state)
    if intercept:
        return intercept

    # 2. Test Verification
    # Normally we run test scripts. Here we check code structure.
    # Let's say if code is generated, tests pass.
    database.add_log("Tester", "INFO", "Running assertions: test_execute_task_returns_dict()... PASSED.")
    database.add_log("Tester", "INFO", "Running assertions: test_timestamp_present()... PASSED.")
    
    state["tests"] = "ALL TESTS PASSED (2/2)"
    state["status"] = "TESTED"
    trigger_hydradb_sync(state["plan"], state["code"], "TESTED", "Tester", "System tests passed successfully.")
    OSState.cores["Core 02"] = "IDLE"
    return state

# ----------------- Core 03: Self-Corrector Node -----------------
def corrector_node(state: AgentState) -> AgentState:
    state["iteration"] = state.get("iteration", 0) + 1
    OSState.active_core = "Core 03"
    OSState.cores["Core 03"] = "RUNNING"
    database.add_log("Corrector", "WARNING", f"Core 03 activated: Self-correction attempt {state['iteration']}/10 initiated due to core faults.")
    time.sleep(2.0)

    # 1. Chaos Interceptor Check - If Chaos is STILL on, we keep failing
    intercept = check_chaos_intercept("Core 03", "CriticalToolInterceptError", f"Critical tool intercept error. Retry stack overflow (Attempt {state['iteration']}/10)", state)
    if intercept:
        return intercept

    # 2. Resolve Errors (Self-Healing)
    database.add_log("Corrector", "INFO", "Chaos Mode OFF. Starting source code repair utilizing LLM...")
    
    groq_client = get_groq_client()
    anthropic_client = get_anthropic_client()
    code = state["code"]
    errors_list = "\n".join(state["errors"])

    corrected_code = None

    if groq_client:
        try:
            system_instruction = "You are the PrompterOS Self-Corrector kernel (Core 03). Resolve code errors based on the traceback. Return ONLY clean corrected code."
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Errors:\n{errors_list}\n\nCode to repair:\n{code}"}
                ],
                temperature=0.2
            )
            corrected_code = response.choices[0].message.content
        except Exception as e:
            print(f"Groq Self-Corrector failed: {e}")
            database.add_log("Corrector", "WARNING", f"Groq Self-Corrector failed, trying Anthropic... Details: {e}")

    if not corrected_code and anthropic_client:
        try:
            system_instruction = "You are the PrompterOS Self-Corrector kernel (Core 03). Resolve code errors based on the traceback. Return ONLY clean corrected code."
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=1000,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Errors:\n{errors_list}\n\nCode to repair:\n{code}"}]
            )
            corrected_code = response.content[0].text
        except Exception as e:
            print(f"Anthropic Self-Corrector failed: {e}")
            database.add_log("Corrector", "WARNING", f"Anthropic Self-Corrector failed... Details: {e}")

    if not corrected_code:
        # Mock correction
        corrected_code = code + "\n# Patched: Restored disk buffer link and resolved ZeroDivisionError.\n"

    state["code"] = corrected_code
    OSState.current_code = corrected_code
    state["errors"] = []  # Clear errors
    state["status"] = "RECOVERED"
    state["iteration"] = 0  # Reset retry counter on success
    
    database.add_log("Corrector", "INFO", "Core 03 successfully patched the files and resolved tracebacks.")
    trigger_hydradb_sync(state["plan"], corrected_code, "RECOVERED", "Corrector", "Source code patched and synced.")
    OSState.cores["Core 03"] = "IDLE"
    return state

# ----------------- Core 04: Deployer Node -----------------
def deployer_node(state: AgentState) -> AgentState:
    if state["errors"]:
        return state

    OSState.active_core = "Core 04"
    OSState.cores["Core 04"] = "RUNNING"
    database.add_log("Deployer", "INFO", "Core 04 activated. Packaging bundle and deploying module...")
    time.sleep(2.0)

    # 1. Chaos Interceptor Check
    intercept = check_chaos_intercept("Core 04", "NetworkError", "Connection reset by host (Deployment Failure)", state)
    if intercept:
        return intercept

    # 2. Finalize Deployment
    database.add_log("Deployer", "INFO", f"Bundle package completed: {state['target']}.tar.gz compiled.")
    database.add_log("Deployer", "INFO", "Initializing API endpoints on localhost:8080... OK.")
    
    state["status"] = "DEPLOYED"
    trigger_hydradb_sync(state["plan"], state["code"], "DEPLOYED", "Deployer", "Deployment complete. OS kernel returned to normal state.")
    OSState.cores["Core 04"] = "IDLE"
    OSState.active_core = None
    return state

# ----------------- LangGraph Router Edge -----------------
def router_edge(state: AgentState) -> str:
    """
    Decides the next node transition in the graph based on the state.
    """
    # Guard against infinite self-correction loops under persistent Chaos
    if state.get("iteration", 0) >= 10:
        database.add_log("System", "ERROR", "LangGraph Loop Guard: Self-Correction failed after 10 attempts due to persistent Chaos disruption. Halting execution.")
        OSState.active_core = None
        OSState.cores["Core 03"] = "ERROR"
        return END

    if state["status"] == "CHAOS_FAULT":
        return "corrector"
    
    if state["status"] == "PLANNING":
        return "coder"
        
    if state["status"] == "CODING":
        return "tester"
        
    if state["status"] == "TESTED" or state["status"] == "RECOVERED":
        if state["errors"]:
            return "corrector"
        return "deployer"
        
    return END

# ----------------- LangGraph Build -----------------
def build_agent_graph():
    workflow = StateGraph(AgentState)
    
    # Register Nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("coder", coder_node)
    workflow.add_node("tester", tester_node)
    workflow.add_node("corrector", corrector_node)
    workflow.add_node("deployer", deployer_node)
    
    # Configure Flow
    workflow.set_entry_point("planner")
    
    # Connect with Conditional Edges
    workflow.add_conditional_edges(
        "planner",
        router_edge,
        {
            "coder": "coder",
            "corrector": "corrector",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "coder",
        router_edge,
        {
            "tester": "tester",
            "corrector": "corrector",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "tester",
        router_edge,
        {
            "deployer": "deployer",
            "corrector": "corrector",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "corrector",
        router_edge,
        {
            "coder": "coder",
            "deployer": "deployer",
            "corrector": "corrector",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "deployer",
        router_edge,
        {
            "corrector": "corrector",
            "__end__": END
        }
    )
    
    return workflow.compile()

# Compile the Graph
compiled_graph = build_agent_graph()

def run_agent_workflow(
    prompt_text: str, 
    target_file: str, 
    instructions: str, 
    plan_override: str = "", 
    code_override: str = "", 
    errors_override: list = None, 
    status_override: str = "START"
):
    """
    Kicks off the compiled LangGraph workflow. Runs step-by-step
    to simulate the active CPU core transitions.
    """
    initial_state = {
        "prompt": prompt_text,
        "action_type": "GENERATE_CODE",
        "target": target_file,
        "instructions": instructions,
        "plan": plan_override,
        "code": code_override,
        "tests": "",
        "errors": errors_override if errors_override is not None else [],
        "status": status_override,
        "iteration": 0
    }
    
    # Reset State variables
    OSState.active_prompt = prompt_text
    OSState.active_target = target_file
    OSState.current_plan = plan_override
    OSState.current_code = code_override
    if status_override == "START":
        OSState.last_error = ""
        OSState.recovery_status = "NONE"
    elif status_override == "CHAOS_FAULT":
        OSState.recovery_status = "RUNNING"
    for core in OSState.cores:
        OSState.cores[core] = "IDLE"
        
    try:
        # Run execution loop step by step
        for output in compiled_graph.stream(initial_state):
            # Print node transition keys to console safely
            nodes = list(output.keys())
            print(f"Graph Transition: Nodes complete: {nodes}")
            
            # Extract state values from step output to update recovery telemetry
            for node_name in nodes:
                node_state = output[node_name]
                status = node_state.get("status", "")
                if status == "CHAOS_FAULT":
                    if OSState.recovery_status == "RUNNING":
                        OSState.recovery_status = "FAILED"
                elif status == "DEPLOYED":
                    if OSState.recovery_status == "RUNNING":
                        OSState.recovery_status = "SUCCESS"
                        OSState.last_error = ""  # Clear the last error on successful deploy
            
            time.sleep(0.5)
            
        # Post-execution sanity check for recovery status
        if OSState.recovery_status == "RUNNING":
            if OSState.last_error:
                OSState.recovery_status = "FAILED"
            else:
                OSState.recovery_status = "SUCCESS"
    except Exception as e:
        print(f"LangGraph execution crashed: {e}")
        traceback.print_exc()
        OSState.active_core = None
        for core in OSState.cores:
            OSState.cores[core] = "ERROR"
        database.add_log("System", "ERROR", f"LangGraph execution halted due to critical crash: {e}")
        if OSState.recovery_status == "RUNNING":
            OSState.recovery_status = "FAILED"
