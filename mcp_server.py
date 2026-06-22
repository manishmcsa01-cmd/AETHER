import sqlite3
import re
import json
import os
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("AETHER Database")

DB_PATH = r"c:\AETHER\prototype\aether.db"

def get_db_connection():
    """Returns a connection to the SQLite database, using read-only mode if supported."""
    try:
        # Enforce read-only at the SQLite engine level using URI connection
        db_uri = f"file:{DB_PATH.replace('\\', '/')}?mode=ro"
        conn = sqlite3.connect(db_uri, uri=True)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception:
        # Fallback to standard connection if URI fails, we still have regex validation
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def is_safe_read_only(sql_query: str) -> bool:
    """Verifies that the SQL query is strictly read-only."""
    query_clean = sql_query.strip().upper()
    
    # Reject queries that don't start with allowed read-only commands
    if not (query_clean.startswith("SELECT") or query_clean.startswith("EXPLAIN") or query_clean.startswith("PRAGMA")):
        return False
        
    # Block writing keywords anywhere in the statement
    forbidden = [
        "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", 
        "REPLACE", "INTO", "SET", "RENAME", "TRUNCATE", "VACUUM"
    ]
    for word in forbidden:
        pattern = r"\b" + re.escape(word) + r"\b"
        if re.search(pattern, query_clean):
            return False
            
    return True

@mcp.tool()
def query_database(sql_query: str) -> str:
    """
    Executes a raw SQL read-only query against the AETHER SQLite database.
    Use this to run custom SELECT, aggregations, or filters on tables.
    Returns results formatted as a JSON string.
    """
    if not is_safe_read_only(sql_query):
        return json.dumps({
            "error": "Access Denied: SQL query failed read-only safety validation. Only SELECT, EXPLAIN, and PRAGMA queries are allowed."
        })
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        
        # Convert sqlite3.Row objects to dictionaries
        results = [dict(row) for row in rows]
        return json.dumps(results, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"SQL Execution Error: {str(e)}"})
    finally:
        conn.close()

@mcp.tool()
def get_kpi_summary() -> str:
    """
    Computes and returns mathematically precise, pre-aggregated key KPIs 
    (Spend, Tasks, ROI, Agent Counts) for both Active and Cumulative (All-Time) fleets.
    Use this to get direct, hallucination-free statistics from the SQLite system of record.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Active metrics
        cursor.execute("SELECT COUNT(*) as count, SUM(monthlyCost) as spend, SUM(tasksExecuted) as tasks FROM agents")
        active_row = dict(cursor.fetchone())
        active_count = active_row["count"] or 0
        active_spend = active_row["spend"] or 0.0
        active_tasks = active_row["tasks"] or 0
        
        # 2. Deboarded metrics
        cursor.execute("SELECT COUNT(*) as count, SUM(monthlyCost) as spend, SUM(tasksExecuted) as tasks FROM deboarded_agents")
        deboard_row = dict(cursor.fetchone())
        deboarded_count = deboard_row["count"] or 0
        deboarded_spend = deboard_row["spend"] or 0.0
        deboarded_tasks = deboard_row["tasks"] or 0
        
        # 3. Cumulative calculations
        cumulative_onboarded = active_count + deboarded_count
        cumulative_spend = active_spend + deboarded_spend
        cumulative_tasks = active_tasks + deboarded_tasks
        
        # Labor savings estimate: offset human labor at $0.10 per task
        cumulative_savings = cumulative_tasks * 0.10
        cumulative_roi = 0.0
        if cumulative_spend > 0:
            cumulative_roi = round(((cumulative_savings - cumulative_spend) / cumulative_spend) * 100, 1)
            
        active_savings = active_tasks * 0.10
        active_roi = 0.0
        if active_spend > 0:
            active_roi = round(((active_savings - active_spend) / active_spend) * 100, 1)

        summary = {
            "active_fleet": {
                "count": active_count,
                "spend": active_spend,
                "tasks": active_tasks,
                "roi_percentage": active_roi,
                "cost_per_agent": round(active_spend / max(1, active_count), 2),
                "cost_per_task": round(active_spend / max(1, active_tasks), 4)
            },
            "deboarded_fleet": {
                "count": deboarded_count,
                "spend": deboarded_spend,
                "tasks": deboarded_tasks
            },
            "cumulative_all_time": {
                "onboarded_count": cumulative_onboarded,
                "spend": cumulative_spend,
                "tasks": cumulative_tasks,
                "roi_percentage": cumulative_roi,
                "cost_per_agent": round(cumulative_spend / max(1, cumulative_onboarded), 2),
                "cost_per_task": round(cumulative_spend / max(1, cumulative_tasks), 4)
            }
        }
        
        return json.dumps(summary, indent=2)
    except Exception as e:
        return json.dumps({"error": f"Failed to compute KPI summary: {str(e)}"})
    finally:
        conn.close()

@mcp.tool()
def get_deboarded_agents() -> str:
    """
    Retrieves the complete historical list of decommissioned AI agents from the database,
    including the deboarding reason, date, and their operational spend/task history.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM deboarded_agents ORDER BY deboardedAt DESC")
        rows = cursor.fetchall()
        results = [dict(row) for row in rows]
        return json.dumps(results, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": f"Failed to retrieve deboarded agents: {str(e)}"})
    finally:
        conn.close()

@mcp.tool()
def get_agent_profile(agent_id: str) -> str:
    """
    Retrieves the complete profile of an agent by its ID from either the 
    active registry or the deboarded archive database tables.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # First, search active registry
        cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
        if row:
            profile = dict(row)
            profile["registry_status"] = "Active"
            return json.dumps(profile, indent=2, default=str)
            
        # Second, search deboarded archive
        cursor.execute("SELECT * FROM deboarded_agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
        if row:
            profile = dict(row)
            profile["registry_status"] = "Deboarded/Archived"
            return json.dumps(profile, indent=2, default=str)
            
        return json.dumps({"error": f"Agent with ID '{agent_id}' was not found in active or archived database records."})
    except Exception as e:
        return json.dumps({"error": f"Failed to retrieve agent profile: {str(e)}"})
    finally:
        conn.close()

if __name__ == "__main__":
    # Start stdio MCP server
    mcp.run()
