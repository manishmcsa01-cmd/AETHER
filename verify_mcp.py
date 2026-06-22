import json
import mcp_server

def run_tests():
    print("==========================================================")
    print(" AETHER Database MCP Server Verification Run")
    print("==========================================================")
    
    # Test 1: SQL Sandbox Safety Checker
    print("\n[Test 1] Testing SQL read-only validation check...")
    valid_queries = [
        "SELECT * FROM agents",
        "SELECT COUNT(*) FROM deboarded_agents",
        "EXPLAIN QUERY PLAN SELECT name FROM agents WHERE riskScore > 50",
        "PRAGMA table_info(deboarded_agents)"
    ]
    invalid_queries = [
        "INSERT INTO agents (name) VALUES ('Hacker')",
        "UPDATE agents SET monthlyCost = 0 WHERE id = 'AGT-0001'",
        "DELETE FROM agents WHERE id = 'AGT-0001'",
        "DROP TABLE agents",
        "CREATE TABLE hack (id INTEGER)",
        "ALTER TABLE agents ADD COLUMN token_usage INTEGER",
        "SELECT * FROM agents; DROP TABLE agents"  # Multi-statement injection attempt
    ]
    
    passed_valid = True
    for vq in valid_queries:
        safe = mcp_server.is_safe_read_only(vq)
        print(f"  Query: '{vq}' -> {'SAFE (Pass)' if safe else 'BLOCKED (Fail)'}")
        if not safe:
            passed_valid = False
            
    passed_invalid = True
    for iq in invalid_queries:
        safe = mcp_server.is_safe_read_only(iq)
        print(f"  Query: '{iq}' -> {'SAFE (Fail)' if safe else 'BLOCKED (Pass)'}")
        if safe:
            passed_invalid = False
            
    print(f"Read-only validation check outcome: {'SUCCESS' if (passed_valid and passed_invalid) else 'FAILURE'}")
    
    # Test 2: Pre-Aggregated KPI Summary Tool
    print("\n[Test 2] Testing get_kpi_summary() tool...")
    kpi_summary_json = mcp_server.get_kpi_summary()
    kpi_data = json.loads(kpi_summary_json)
    
    if "error" in kpi_data:
        print(f"  FAILED: {kpi_data['error']}")
    else:
        print("  SUCCESS: Received aggregated KPIs:")
        print(f"    - Active Fleet Count:      {kpi_data['active_fleet']['count']}")
        print(f"    - Active Fleet Spend:      ${kpi_data['active_fleet']['spend']}")
        print(f"    - Active Fleet ROI:        {kpi_data['active_fleet']['roi_percentage']}%")
        print(f"    - Cumulative Onboarded:    {kpi_data['cumulative_all_time']['onboarded_count']}")
        print(f"    - Cumulative Tasks:        {kpi_data['cumulative_all_time']['tasks']}")
        print(f"    - Cumulative Spend:        ${kpi_data['cumulative_all_time']['spend']}")
        print(f"    - Cumulative ROI:          {kpi_data['cumulative_all_time']['roi_percentage']}%")
        
    # Test 3: SQL Query Database Tool
    print("\n[Test 3] Testing query_database() tool with valid SELECT query...")
    query_json = mcp_server.query_database("SELECT id, name, platform, monthlyCost FROM agents LIMIT 2")
    query_data = json.loads(query_json)
    
    if "error" in query_data:
        print(f"  FAILED: {query_data['error']}")
    else:
        print("  SUCCESS: Executed SELECT query:")
        print(json.dumps(query_data, indent=4))
        
    # Test 4: SQL Query Database Tool Write Block
    print("\n[Test 4] Testing query_database() tool blocking write query...")
    block_json = mcp_server.query_database("DROP TABLE agents")
    block_data = json.loads(block_json)
    
    if "error" in block_data and "Access Denied" in block_data["error"]:
        print(f"  SUCCESS: Correctly blocked drop table query: '{block_data['error']}'")
    else:
        print("  FAILED: Failed to block write query!")
        
    # Test 5: Agent Profile Retrieval Tool
    print("\n[Test 5] Testing get_agent_profile() tool...")
    # Fetch first active agent ID dynamically to avoid hardcoded mismatch
    conn = mcp_server.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM agents LIMIT 1")
    row = c.fetchone()
    conn.close()
    
    if row:
        agent_id = row[0]
        profile_json = mcp_server.get_agent_profile(agent_id)
        profile_data = json.loads(profile_json)
        if "error" in profile_data:
            print(f"  FAILED: {profile_data['error']}")
        else:
            print(f"  SUCCESS: Fetched profile for {agent_id} ({profile_data['name']}):")
            print(f"    - Registry Status: {profile_data['registry_status']}")
            print(f"    - Platform:        {profile_data['platform']}")
            print(f"    - Monthly Cost:    ${profile_data['monthlyCost']}")
            print(f"    - Risk Score:      {profile_data['riskScore']}")
    else:
        print("  SKIPPED: No active agents in database to query.")
        
    print("\n==========================================================")
    print(" Verification Run Completed")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()
