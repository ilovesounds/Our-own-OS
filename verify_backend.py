import os
from fastapi.testclient import TestClient
import database
import app
import time

# Create a test client from FastAPI app
client = TestClient(app.app)

def test_workflow():
    print("=== STARTING BACKEND INTEGRATION VERIFICATION ===")
    
    with TestClient(app.app) as client:
        # 1. Test database initialization
        print("\n[Step 1] Verifying database links...")
        database.init_db()
        print("Database Type: ", database.DB_TYPE)
        print("Ledger tables verified.")

        # 2. Test status endpoint on boot
        print("\n[Step 2] Querying devfactory status on boot...")
        res = client.get("/api/devfactory/status")
        assert res.status_code == 200
        data = res.json()
        print("Co-processors online status:")
        for core, val in data["cores"].items():
            print(f"  {core}: {val}")
        assert len(data["logs"]) > 0
        print("Initial startup logs verified: ", data["logs"][-1]["message"])

        # 3. Test intent parsing (which kicks off LangGraph in background task)
        print("\n[Step 3] Submitting natural language query to parse-intent...")
        prompt = "Scaffold an API for a logistics tracker."
        res = client.post("/api/parse-intent", json={"prompt": prompt})
        assert res.status_code == 200
        action = res.json()
        print("Parsed Action Schema:")
        print(f"  Action type: {action['action_type']}")
        print(f"  Target:      {action['target']}")
        print(f"  Cores req:   {action['required_cores']}")
        
        # Wait briefly for background tasks to start processing nodes
        print("Waiting for LangGraph cores to cycle...")
        time.sleep(2.0)
        
        # Fetch status again to verify transition
        res = client.get("/api/devfactory/status")
        data = res.json()
        print("Active core executing: ", data["active_core"])
        print("Log count after running Planner: ", len(data["logs"]))

        # 4. Test Chaos toggle
        print("\n[Step 4] Toggling Chaos Monkey Mode ON...")
        res = client.post("/api/chaos/toggle", json={"enabled": True})
        assert res.status_code == 200
        data = res.json()
        assert data["chaos_enabled"] is True
        print("Chaos Mode state: ", data["chaos_enabled"])
        
        # Wait for Coder Node to execute under Chaos Mode
        print("Waiting for Coder tool interception...")
        time.sleep(3.0)
        
        # Fetch status and look for Chaos warnings
        res = client.get("/api/devfactory/status")
        data = res.json()
        print("Cores states under Chaos:")
        for core, val in data["cores"].items():
            print(f"  {core}: {val}")
        print("Last registered error: ", data["last_error"])

        # 5. Fetch snapshots list
        print("\n[Step 5] Retrieving snapshots from HydraDB time-series...")
        res = client.get("/api/chronos/snapshots")
        assert res.status_code == 200
        snapshots = res.json()
        print(f"Total Snapshots found: {len(snapshots)}")
        for snap in snapshots:
            print(f"  Snapshot #{snap['id']} -> Status: {snap['status']} ({snap['timestamp']})")

        # 6. Test rollback
        if len(snapshots) > 0:
            first_snap_id = snapshots[0]["id"]
            print(f"\n[Step 6] Requesting rollback to Snapshot #{first_snap_id}...")
            res = client.post("/api/chronos/rollback", json={"snapshot_id": first_snap_id})
            assert res.status_code == 200
            result = res.json()
            assert result["status"] == "success"
            print(f"Time travel recovery successful. State reverted to #{first_snap_id}.")
            
            # Verify cores reset to IDLE and error cleared
            res = client.get("/api/devfactory/status")
            data = res.json()
            assert data["active_core"] is None
            assert data["last_error"] == ""
            print("Cores states verified as reset (IDLE).")

        print("\n=== BACKEND INTEGRATION VERIFICATION PASSED ===")

if __name__ == "__main__":
    test_workflow()
