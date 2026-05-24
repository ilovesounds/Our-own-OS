import os
from hydradb import Client

# Global HydraDB Client Instance
hydra_client = None
DB_TYPE = "sqlite"  # Fallback to local SQLite file under the hood

def init_db():
    global hydra_client, DB_TYPE
    
    # Read Tenant Credentials from Environment Variables
    api_key = os.getenv("HYDRADB_API_KEY", "demo_api_key_xyz")
    tenant_id = os.getenv("HYDRADB_TENANT_ID", "tenant_chaos_os")
    
    try:
        # Initialize client exactly as specified:
        # from hydradb import Client
        # client = Client(api_key="YOUR_API_KEY", tenant="YOUR_TENANT_ID")
        hydra_client = Client(
            api_key=api_key,
            tenant=tenant_id
        )
        DB_TYPE = "hydradb_client"
    except Exception as e:
        print(f"HydraDB Critical: Failed to instantiate client. Error: {e}")

def add_log(source: str, level: str, message: str):
    if hydra_client:
        hydra_client.add_log(source, level, message)
    else:
        print(f"Database offline: [{source}] {level} - {message}")

def get_logs(limit=100):
    if hydra_client:
        return hydra_client.get_logs(limit)
    return []

def create_snapshot(plan: str, code: str, status: str) -> int:
    if hydra_client:
        return hydra_client.create_snapshot(plan, code, status)
    return -1

def get_snapshots():
    if hydra_client:
        return hydra_client.get_snapshots()
    return []

def get_snapshot(snapshot_id: int):
    if hydra_client:
        return hydra_client.get_snapshot(snapshot_id)
    return None

def clear_db():
    if hydra_client:
        hydra_client.clear_all()
