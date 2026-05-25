import sqlite3
from datetime import datetime

class Client:
    def __init__(self, api_key: str, tenant: str):
        self.api_key = api_key
        self.tenant = tenant
        import os
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            self.db_file = "/tmp/hydradb.db"
        else:
            self.db_file = "hydradb.db"
        self._init_db()
        print("--------------------------------------------------")
        print(f"HYDRADB SECURE DATA LINK INITIALIZED")
        print(f"Tenant ID:  {self.tenant}")
        print(f"API Key:    {self.api_key[:6]}...{self.api_key[-6:] if len(self.api_key) > 12 else ''}")
        print("--------------------------------------------------")

    def _init_db(self):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                source TEXT,
                level TEXT,
                message TEXT
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                plan TEXT,
                code TEXT,
                status TEXT
            );
        """)
        conn.commit()
        conn.close()

    def add_log(self, source: str, level: str, message: str):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO system_logs (source, level, message) VALUES (?, ?, ?);",
                (source, level, message)
            )
            conn.commit()
        except Exception as e:
            print(f"HydraDB Error adding log: {e}")
        finally:
            conn.close()

    def get_logs(self, limit=100):
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        logs = []
        try:
            cursor.execute(
                "SELECT id, timestamp, source, level, message FROM system_logs ORDER BY id DESC LIMIT ?;",
                (limit,)
            )
            rows = cursor.fetchall()
            for r in rows:
                logs.append({
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "source": r["source"],
                    "level": r["level"],
                    "message": r["message"]
                })
        except Exception as e:
            print(f"HydraDB Error getting logs: {e}")
        finally:
            conn.close()
        return list(reversed(logs))

    def create_snapshot(self, plan: str, code: str, status: str) -> int:
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        snapshot_id = -1
        try:
            cursor.execute(
                "INSERT INTO system_snapshots (plan, code, status) VALUES (?, ?, ?);",
                (plan, code, status)
            )
            snapshot_id = cursor.lastrowid
            conn.commit()
        except Exception as e:
            print(f"HydraDB Error creating snapshot: {e}")
        finally:
            conn.close()
        return snapshot_id

    def get_snapshots(self):
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        snapshots = []
        try:
            cursor.execute("SELECT id, timestamp, status FROM system_snapshots ORDER BY id ASC;")
            rows = cursor.fetchall()
            for r in rows:
                snapshots.append({
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "status": r["status"]
                })
        except Exception as e:
            print(f"HydraDB Error listing snapshots: {e}")
        finally:
            conn.close()
        return snapshots

    def get_snapshot(self, snapshot_id: int):
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        snapshot = None
        try:
            cursor.execute(
                "SELECT id, timestamp, plan, code, status FROM system_snapshots WHERE id = ?;",
                (snapshot_id,)
            )
            row = cursor.fetchone()
            if row:
                snapshot = {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "plan": row["plan"],
                    "code": row["code"],
                    "status": row["status"]
                }
        except Exception as e:
            print(f"HydraDB Error fetching snapshot details: {e}")
        finally:
            conn.close()
        return snapshot

    def clear_all(self):
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM system_logs;")
            cursor.execute("DELETE FROM system_snapshots;")
            conn.commit()
        except Exception as e:
            print(f"HydraDB Error clearing tables: {e}")
        finally:
            conn.close()
