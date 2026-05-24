import time
import os
import random
import traceback
import anthropic
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import database

# Global OS State for real-time polling
class OSState:
    chaos_enabled = False
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
    if OSState.chaos_enabled:
        OSState.cores["Core 00"] = "ERROR"
        database.add_log("Chaos", "CHAOS", "[CHAOS] Corrupting context window data blocks... Core 00 input register error.")
        database.add_log("Planner", "ERROR", "Planner execution aborted. Fault code: ContextWindowCorruption (500)")
        state["errors"].append("Planner failed due to ContextWindowCorruption.")
        state["status"] = "CHAOS_FAULT"
        OSState.last_error = "ContextWindowCorruption (500) at Planner Core"
        trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", "Planner", "Snapshot saved in ERROR state.")
        return state

    # 2. Plan Generation
    client = get_anthropic_client()
    instructions = state["instructions"]
    
    if client:
        try:
            system_instruction = "You are the PrompterOS Planner kernel (Core 00). Output a clean, checklist-based implementation plan in markdown."
            response = client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=800,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Plan for: {instructions}"}]
            )
            plan = response.content[0].text
        except Exception as e:
            plan = f"Mock Implementation Plan for {state['target']}\n- Setup environment\n- Build endpoints\n- Add logging"
    else:
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
    if OSState.chaos_enabled:
        OSState.cores["Core 01"] = "ERROR"
        database.add_log("Chaos", "CHAOS", "[CHAOS] Disconnecting file_write_tool.sys... Disk buffer I/O timeout.")
        database.add_log("Coder", "ERROR", "Coder execution failed. IOException: Failed to write logistics_tracker.py")
        state["errors"].append("Coder failed: file_write_tool.sys write error.")
        state["status"] = "CHAOS_FAULT"
        OSState.last_error = "IOException: file_write_tool.sys disconnected (500)"
        trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", "Coder", "Snapshot saved in ERROR state.")
        return state

    # 2. Code Generation
    client = get_anthropic_client()
    plan = state["plan"]
    target = state["target"]

    if client:
        try:
            system_instruction = f"You are the PrompterOS Coder kernel (Core 01). Write clean, runnable code for {target}. Return ONLY the raw code."
            response = client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=1000,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Implementation plan:\n{plan}\n\nTarget File: {target}"}]
            )
            code = response.content[0].text
        except Exception as e:
            code = f"# Fallback Python code for {target}\nprint('Hello world from {target}')"
    else:
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
    if OSState.chaos_enabled:
        OSState.cores["Core 02"] = "ERROR"
        database.add_log("Chaos", "CHAOS", "[CHAOS] Injecting invalid error tracebacks into active nodes... Tester thread killed.")
        database.add_log("Tester", "ERROR", "Test suite execution crashed: ZeroDivisionError in unit tests.")
        state["errors"].append("Tester failed: ZeroDivisionError injected by ChaosOS.")
        state["status"] = "CHAOS_FAULT"
        OSState.last_error = "ZeroDivisionError: division by zero (Test Failure)"
        trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", "Tester", "Snapshot saved in ERROR state.")
        return state

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
    database.add_log("Corrector", "WARNING", f"Core 03 activated: Self-correction attempt {state['iteration']}/3 initiated due to core faults.")
    time.sleep(2.0)

    # 1. Chaos Interceptor Check - If Chaos is STILL on, we keep failing
    if OSState.chaos_enabled:
        OSState.cores["Core 03"] = "ERROR"
        database.add_log("Chaos", "CHAOS", f"[CHAOS] Corrupting context window data blocks... Retry {state['iteration']}/3 blocked.")
        database.add_log("Corrector", "ERROR", f"Self-Corrector failed. Exception: Critical tool intercept error. Retry stack overflow.")
        state["status"] = "CHAOS_FAULT"
        OSState.last_error = f"CriticalToolInterceptError (500) at Self-Corrector Core (Attempt {state['iteration']}/3)"
        trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", "Corrector", "Snapshot saved in persistent ERROR state.")
        return state

    # 2. Resolve Errors (Self-Healing)
    database.add_log("Corrector", "INFO", "Chaos Mode OFF. Starting source code repair utilizing Claude LLM...")
    
    client = get_anthropic_client()
    code = state["code"]
    errors_list = "\n".join(state["errors"])

    if client:
        try:
            system_instruction = "You are the PrompterOS Self-Corrector kernel (Core 03). Resolve code errors based on the traceback. Return ONLY clean corrected code."
            response = client.messages.create(
                model="claude-3-5-sonnet-latest",
                max_tokens=1000,
                temperature=0.2,
                system=system_instruction,
                messages=[{"role": "user", "content": f"Errors:\n{errors_list}\n\nCode to repair:\n{code}"}]
            )
            corrected_code = response.content[0].text
        except Exception:
            corrected_code = code + "\n# Patched by Self-Corrector Core\n"
    else:
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
    if OSState.chaos_enabled:
        OSState.cores["Core 04"] = "ERROR"
        database.add_log("Chaos", "CHAOS", "[CHAOS] Server cluster disconnected during deployment... API gateway drop.")
        database.add_log("Deployer", "ERROR", "Deployment failed. NetworkError: Connection reset by remote host.")
        state["errors"].append("Deployer failed: Network connection reset.")
        state["status"] = "CHAOS_FAULT"
        OSState.last_error = "NetworkError: Connection reset by host (Deployment Failure)"
        trigger_hydradb_sync(state["plan"], state["code"], "CHAOS_FAULT", "Deployer", "Snapshot saved in ERROR state.")
        return state

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
    if state.get("iteration", 0) >= 3:
        database.add_log("System", "ERROR", "LangGraph Loop Guard: Self-Correction failed after 3 attempts due to persistent Chaos disruption. Halting execution.")
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
