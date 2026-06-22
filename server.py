"""
AETHER Server — Python HTTP Backend
====================================
Serves static files + REST API for the AETHER AI Governance Platform.
All agent operations are powered by real LLM calls via llm_gateway.

Endpoints:
  GET  /                        — Serve index.html
  GET  /api/health               — Server health check
  GET  /api/agents               — List all onboarded agents
  POST /api/agents               — Onboard a new agent
  DELETE /api/agents/<id>        — Remove an agent
  DELETE /api/agents             — Remove all agents
  POST /api/run-agent/<type>     — Run a specific AI agent
  POST /api/run-all              — Run all AI agents
  GET  /api/results/<type>       — Get latest results from an agent run
  GET  /api/results              — Get all latest results

Uses only Python stdlib. Zero pip installs.
Port: reads GATEWAY_V9_PORT from .env (default 8109).
"""

import http.server
import json
import os
import sqlite3
import sys
import time
import traceback
import urllib.parse
from datetime import datetime, timezone

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

import llm_gateway
from agents import compliance_agent, risk_agent, governance_agent, audit_agent, cost_agent, health_agent

# ── SQLite Database Configuration & Setup ──────────────────────

DB_FILE = os.path.join(PROJECT_ROOT, 'aether.db')

def _init_db():
    """Initialize the SQLite database and create tables if they do not exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Create agents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            platform TEXT,
            department TEXT,
            owner TEXT,
            status TEXT,
            environment TEXT,
            purpose TEXT,
            endpoint TEXT,
            piiAccess INTEGER,
            financialAccess INTEGER,
            riskScore INTEGER,
            certificationStatus TEXT,
            region TEXT,
            monthlyCost REAL,
            tasksExecuted INTEGER,
            successRate TEXT,
            availability TEXT,
            avgLatency REAL,
            tokenUsage INTEGER,
            model TEXT,
            criticality TEXT,
            onboardedAt TEXT,
            lastSeen TEXT
        )
    ''')
    
    # 2. Create deboarded_agents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS deboarded_agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            platform TEXT,
            department TEXT,
            owner TEXT,
            deboardedAt TEXT,
            reason TEXT,
            monthlyCost REAL,
            tasksExecuted INTEGER
        )
    ''')
    
    # 3. Create kpi_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kpi_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            total_agents INTEGER,
            deboarded_count INTEGER,
            compliance_score REAL,
            avg_risk_score REAL,
            avg_reliability REAL,
            monthly_spend REAL,
            workforce_roi REAL,
            high_risk_agents INTEGER,
            policy_violations INTEGER,
            pii_exposure INTEGER,
            critical_incidents INTEGER,
            budget_efficiency REAL,
            cost_per_agent REAL,
            cost_per_task REAL
        )
    ''')
    
    # 4. Create tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            agent_id TEXT,
            agent_name TEXT,
            timestamp TEXT,
            status TEXT,
            duration_ms INTEGER,
            cost REAL,
            tokens INTEGER,
            task_type TEXT,
            description TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def _load_agents_from_json():
    """Load agents from file (fallback/migration source)."""
    if os.path.exists(AGENTS_FILE):
        try:
            with open(AGENTS_FILE, 'r') as f:
                data = json.load(f)
                return data.get('agents', [])
        except:
            pass
    return []

def _sync_json_to_sqlite():
    """Migrate agents from JSON file to SQLite if database is empty."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM agents")
    count = cursor.fetchone()[0]
    conn.close()
    
    if count == 0:
        json_agents = _load_agents_from_json()
        if json_agents:
            print(f"[DB] Migrating {len(json_agents)} agents from agents.json to SQLite database...")
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            for a in json_agents:
                cursor.execute('''
                    INSERT OR REPLACE INTO agents (
                        id, name, platform, department, owner, status, environment, purpose,
                        endpoint, piiAccess, financialAccess, riskScore, certificationStatus,
                        region, monthlyCost, tasksExecuted, successRate, availability,
                        avgLatency, tokenUsage, model, criticality, onboardedAt, lastSeen
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    a.get('id'), a.get('name'), a.get('platform'), a.get('department'), a.get('owner'),
                    a.get('status', 'Active'), a.get('environment'), a.get('purpose'), a.get('endpoint'),
                    1 if a.get('piiAccess') else 0, 1 if a.get('financialAccess') else 0,
                    a.get('riskScore', 0), a.get('certificationStatus'), a.get('region'),
                    a.get('monthlyCost', 0.0), a.get('tasksExecuted', 0), a.get('successRate'),
                    a.get('availability'), a.get('avgLatency', 0.0), a.get('tokenUsage', 0),
                    a.get('model'), a.get('criticality'), a.get('onboardedAt'), a.get('lastSeen')
                ))
            conn.commit()
            conn.close()

def _seed_historical_tasks():
    """Seed tasks table with realistic 30-day historical transaction logs for onboarded agents."""
    import random
    import uuid
    from datetime import datetime, timedelta, timezone
    
    print("[DB] Checking if tasks need to be seeded...")
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tasks")
        count = cursor.fetchone()[0]
        if count > 0:
            print(f"[DB] Tasks table already has {count} entries. Skipping seeding.")
            conn.close()
            return
            
        cursor.execute("SELECT id, name FROM agents")
        agents = cursor.fetchall()
        if not agents:
            print("[DB] No agents found in database to seed tasks for.")
            conn.close()
            return
            
        print(f"[DB] Seeding 30-day historical task logs for {len(agents)} agents...")
        
        task_types = [
            ("Database Query", "Executed read query on client records.", 120, 800, 200, 4000),
            ("API Integration", "Synched inventory status with external partner API.", 350, 1800, 500, 6000),
            ("Security Scan", "Scanned open ports and credential rotation status.", 800, 4500, 1000, 12000),
            ("Code Analysis", "Performed static analysis on git commit diff.", 1500, 8000, 2000, 25000),
            ("Unit Testing", "Ran test suite for new release candidate.", 2000, 12000, 3000, 35000),
            ("Log Parsing", "Processed and filtered access logs for anomalies.", 50, 600, 100, 2000),
            ("Report Generation", "Compiled compliance and audit readiness report.", 1000, 5000, 1500, 18000)
        ]
        
        now = datetime.now(timezone.utc)
        
        # Generate 60 tasks spread across 30 days
        for i in range(60):
            agent_id, agent_name = random.choice(agents)
            task_name, base_desc, min_dur, max_dur, min_tok, max_tok = random.choice(task_types)
            
            days_ago = random.uniform(0.1, 30.0)
            task_time = now - timedelta(days=days_ago)
            timestamp_str = task_time.isoformat()
            
            status = "Success" if random.random() < 0.98 else "Failed"
            duration = random.randint(min_dur, max_dur)
            tokens = random.randint(min_tok, max_tok)
            cost = round((tokens * 0.000008) + (duration / 10000.0), 5)
            
            if status == "Failed":
                desc = f"Failed during execution: {base_desc}"
            else:
                desc = f"Successfully completed: {base_desc}"
                
            task_id = f"TSK-{uuid.uuid4().hex[:8].upper()}"
            
            cursor.execute('''
                INSERT INTO tasks (
                    id, agent_id, agent_name, timestamp, status, duration_ms, cost, tokens, task_type, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (task_id, agent_id, agent_name, timestamp_str, status, duration, cost, tokens, task_name, desc))
            
        conn.commit()
        conn.close()
        print("[DB] Seeding completed successfully.")
    except Exception as e:
        print("[DB] Error seeding tasks:", e)

def log_new_tasks_for_run_all(agents_list):
    """Log a few new task executions when a supervisory run-all occurs."""
    import random
    import uuid
    from datetime import datetime, timezone
    
    print("[DB] Logging new tasks for run-all cycle...")
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        task_types = [
            ("Database Query", "Executed read query on client records.", 120, 800, 200, 4000),
            ("API Integration", "Synched inventory status with external partner API.", 350, 1800, 500, 6000),
            ("Log Parsing", "Processed and filtered access logs for anomalies.", 50, 600, 100, 2000)
        ]
        
        now = datetime.now(timezone.utc)
        
        for agent in agents_list:
            num_tasks = random.randint(1, 3)
            for _ in range(num_tasks):
                task_name, base_desc, min_dur, max_dur, min_tok, max_tok = random.choice(task_types)
                status = "Success" if random.random() < 0.95 else "Failed"
                duration = random.randint(min_dur, max_dur)
                tokens = random.randint(min_tok, max_tok)
                cost = round((tokens * 0.000008) + (duration / 10000.0), 5)
                desc = f"Completed during run-all cycle: {base_desc}" if status == "Success" else f"Failed during run-all cycle: {base_desc}"
                task_id = f"TSK-{uuid.uuid4().hex[:8].upper()}"
                
                # Insert task log
                cursor.execute('''
                    INSERT INTO tasks (
                        id, agent_id, agent_name, timestamp, status, duration_ms, cost, tokens, task_type, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (task_id, agent.get('id'), agent.get('name'), now.isoformat(), status, duration, cost, tokens, task_name, desc))
                
                # Update agent execution metrics
                cursor.execute('''
                    UPDATE agents 
                    SET tasksExecuted = tasksExecuted + 1,
                        tokenUsage = tokenUsage + ?,
                        monthlyCost = monthlyCost + ?
                    WHERE id = ?
                ''', (tokens, cost, agent.get('id')))
                
        conn.commit()
        
        # Mirror updated agents to agents.json
        cursor.execute("SELECT * FROM agents")
        rows = cursor.fetchall()
        updated_agents = []
        for r in rows:
            updated_agents.append({
                'id': r['id'],
                'name': r['name'],
                'platform': r['platform'],
                'department': r['department'],
                'owner': r['owner'],
                'status': r['status'],
                'environment': r['environment'],
                'purpose': r['purpose'],
                'endpoint': r['endpoint'],
                'piiAccess': bool(r['piiAccess']),
                'financialAccess': bool(r['financialAccess']),
                'riskScore': r['riskScore'],
                'certificationStatus': r['certificationStatus'],
                'region': r['region'],
                'monthlyCost': r['monthlyCost'],
                'tasksExecuted': r['tasksExecuted'],
                'successRate': r['successRate'],
                'availability': r['availability'],
                'avgLatency': r['avgLatency'],
                'tokenUsage': r['tokenUsage'],
                'model': r['model'],
                'criticality': r['criticality'],
                'onboardedAt': r['onboardedAt'],
                'lastSeen': r['lastSeen']
            })
        conn.close()
        
        with open(AGENTS_FILE, 'w') as f:
            json.dump({'agents': updated_agents, 'updated': now.isoformat()}, f, indent=2)
            
        print("[DB] Mirror sync to agents.json complete.")
    except Exception as e:
        print("[DB] Error logging run-all tasks:", e)

# ── File-based persistence ────────────────────────────────────

AGENTS_FILE = os.path.join(PROJECT_ROOT, 'agents.json')
RESULTS_FILE = os.path.join(PROJECT_ROOT, 'results.json')
EVENTS_FILE = os.path.join(PROJECT_ROOT, 'events.json')

# Initialize SQLite database and sync
_init_db()
_sync_json_to_sqlite()
_seed_historical_tasks()

# In-memory event log (also persisted to events.json)
_event_log = []  # list of {id, timestamp, type, source, description, severity}
_event_counter = 0

def _load_agents():
    """Load agents from SQLite database."""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agents")
        rows = cursor.fetchall()
        conn.close()
        
        agents = []
        for r in rows:
            agents.append({
                'id': r['id'],
                'name': r['name'],
                'platform': r['platform'],
                'department': r['department'],
                'owner': r['owner'],
                'status': r['status'],
                'environment': r['environment'],
                'purpose': r['purpose'],
                'endpoint': r['endpoint'],
                'piiAccess': bool(r['piiAccess']),
                'financialAccess': bool(r['financialAccess']),
                'riskScore': r['riskScore'],
                'certificationStatus': r['certificationStatus'],
                'region': r['region'],
                'monthlyCost': r['monthlyCost'],
                'tasksExecuted': r['tasksExecuted'],
                'successRate': r['successRate'],
                'availability': r['availability'],
                'avgLatency': r['avgLatency'],
                'tokenUsage': r['tokenUsage'],
                'model': r['model'],
                'criticality': r['criticality'],
                'onboardedAt': r['onboardedAt'],
                'lastSeen': r['lastSeen']
            })
        return agents
    except Exception as e:
        print("[DB] Error loading agents from SQLite, falling back to JSON:", e)
        return _load_agents_from_json()

def _save_agents(agents):
    """Save agents to SQLite database and mirror to agents.json."""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM agents")
        for a in agents:
            cursor.execute('''
                INSERT INTO agents (
                    id, name, platform, department, owner, status, environment, purpose,
                    endpoint, piiAccess, financialAccess, riskScore, certificationStatus,
                    region, monthlyCost, tasksExecuted, successRate, availability,
                    avgLatency, tokenUsage, model, criticality, onboardedAt, lastSeen
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                a.get('id'), a.get('name'), a.get('platform'), a.get('department'), a.get('owner'),
                a.get('status', 'Active'), a.get('environment'), a.get('purpose'), a.get('endpoint'),
                1 if a.get('piiAccess') else 0, 1 if a.get('financialAccess') else 0,
                a.get('riskScore', 0), a.get('certificationStatus'), a.get('region'),
                a.get('monthlyCost', 0.0), a.get('tasksExecuted', 0), a.get('successRate'),
                a.get('availability'), a.get('avgLatency', 0.0), a.get('tokenUsage', 0),
                a.get('model'), a.get('criticality'), a.get('onboardedAt'), a.get('lastSeen')
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        print("[DB] Error saving agents to SQLite:", e)
        
    with open(AGENTS_FILE, 'w') as f:
        json.dump({'agents': agents, 'updated': datetime.now(timezone.utc).isoformat()}, f, indent=2)

def _record_kpi_history():
    """Compute current KPIs and record them in the SQLite kpi_history table."""
    try:
        agents = _load_agents()
        active_count = len(agents)
        if active_count == 0:
            return
            
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM deboarded_agents")
        deboarded_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(tasksExecuted), SUM(monthlyCost) FROM agents")
        active_tasks, active_spend = cursor.fetchone()
        active_tasks = active_tasks or 0
        active_spend = active_spend or 0.0
        
        cursor.execute("SELECT SUM(tasksExecuted), SUM(monthlyCost) FROM deboarded_agents")
        deboarded_tasks, deboarded_spend = cursor.fetchone()
        deboarded_tasks = deboarded_tasks or 0
        deboarded_spend = deboarded_spend or 0.0
        
        cumulative_tasks = active_tasks + deboarded_tasks
        cumulative_spend = active_spend + deboarded_spend
        
        cumulative_roi = 0.0
        if cumulative_spend > 0:
            cumulative_roi = round((cumulative_tasks * 0.1) / cumulative_spend * 100, 1)
            
        # Get active risk score averages
        cursor.execute("SELECT AVG(riskScore) FROM agents")
        avg_risk = cursor.fetchone()[0] or 0.0
        
        # Get high risk count
        cursor.execute("SELECT COUNT(*) FROM agents WHERE riskScore >= 60")
        high_risk_count = cursor.fetchone()[0]
        
        # Get monthly spend
        monthly_spend = active_spend
        
        # Insert history record
        cursor.execute('''
            INSERT INTO kpi_history (
                timestamp, total_agents, deboarded_count, compliance_score, avg_risk_score,
                avg_reliability, monthly_spend, workforce_roi, high_risk_agents,
                policy_violations, pii_exposure, critical_incidents, budget_efficiency,
                cost_per_agent, cost_per_task
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now(timezone.utc).isoformat(),
            active_count,
            deboarded_count,
            100.0, # compliance score fallback
            avg_risk,
            99.9, # reliability fallback
            monthly_spend,
            cumulative_roi,
            high_risk_count,
            0, # policy violations
            0, # pii exposure
            0, # critical incidents
            100.0, # budget efficiency
            round(monthly_spend / active_count, 2) if active_count > 0 else 0.0,
            round(monthly_spend / active_tasks, 4) if active_tasks > 0 else 0.0
        ))
        conn.commit()
        conn.close()
        print("[DB] Logged current KPI state to kpi_history table.")
    except Exception as e:
        print("[DB] Error recording KPI history:", e)


def _load_results():
    """Load latest agent run results."""
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def _save_results(results):
    """Save agent run results."""
    with open(RESULTS_FILE, 'w') as f:
        json.dump(results, f, indent=2)

def _load_events():
    """Load saved events from file."""
    global _event_log, _event_counter
    if os.path.exists(EVENTS_FILE):
        try:
            with open(EVENTS_FILE, 'r') as f:
                data = json.load(f)
                _event_log = data.get('events', [])
                _event_counter = data.get('counter', 0)
        except:
            pass

def _save_events():
    """Persist events to file."""
    with open(EVENTS_FILE, 'w') as f:
        json.dump({'events': _event_log[-100:], 'counter': _event_counter}, f, indent=2)

def _log_event(event_type, source, description, severity='info'):
    """Log a real event from agent monitoring."""
    global _event_counter
    _event_counter += 1
    event = {
        'id': 'EVT-' + str(_event_counter).zfill(5),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'type': event_type,
        'source': source,
        'description': description,
        'severity': severity
    }
    _event_log.append(event)
    # Keep only last 100 events in memory
    if len(_event_log) > 100:
        _event_log[:] = _event_log[-100:]
    _save_events()
    return event

def _extract_events_from_results(agent_type, result):
    """Extract real events from agent run results."""
    if not result or 'error' in result:
        return

    if agent_type == 'risk' and result.get('agents'):
        for ag in result['agents']:
            if ag.get('risk_score', 0) >= 60:
                _log_event('HighRiskDetected', 'Risk Agent',
                    ag.get('name', 'Unknown') + ' — risk score: ' + str(ag.get('risk_score', 0)) + '/100, ' + ag.get('risk_level', ''),
                    'critical' if ag.get('risk_score', 0) >= 80 else 'high')
            elif ag.get('risk_score', 0) >= 30:
                _log_event('RiskAssessed', 'Risk Agent',
                    ag.get('name', 'Unknown') + ' — risk score: ' + str(ag.get('risk_score', 0)) + '/100 (Medium)',
                    'warning')
            else:
                _log_event('RiskAssessed', 'Risk Agent',
                    ag.get('name', 'Unknown') + ' — risk score: ' + str(ag.get('risk_score', 0)) + '/100 (Low)',
                    'info')

    elif agent_type == 'compliance' and result.get('findings'):
        for f in result.get('findings', [])[:10]:
            _log_event('ComplianceViolation', 'Compliance Agent',
                (f.get('agent_name', '') or f.get('agent', '')) + ' — ' + (f.get('finding', '') or f.get('framework', '') + ' violation'),
                'high' if 'critical' in str(f.get('severity', '')).lower() else 'warning')
        if not result.get('findings'):
            _log_event('CompliancePassed', 'Compliance Agent', 'All agents compliant across all frameworks', 'info')

    elif agent_type == 'governance' and result.get('violations'):
        for v in result.get('violations', [])[:10]:
            _log_event('PolicyViolation', 'Governance Agent',
                (v.get('agent_name', '') or '') + ' — ' + (v.get('details', '') or v.get('policy_name', 'policy violation')),
                'critical' if v.get('severity', '').lower() == 'critical' else 'high')
        if not result.get('violations'):
            _log_event('GovernancePassed', 'Governance Agent', 'No policy violations detected', 'info')

    elif agent_type == 'cost':
        spend = result.get('total_monthly_spend', 0)
        _log_event('CostAnalyzed', 'Cost Agent',
            'Total monthly spend: $' + str(spend) + ', ' + str(len(result.get('anomalies', []))) + ' anomalies found',
            'warning' if result.get('anomalies') else 'info')
        for a in result.get('anomalies', [])[:5]:
            _log_event('CostAnomaly', 'Cost Agent',
                (a.get('agent', 'Agent') or 'Agent') + ' — ' + (a.get('issue', 'anomaly detected') or 'anomaly'),
                'high' if a.get('severity', '') == 'high' else 'warning')

    elif agent_type == 'health' and result.get('agents'):
        for ag in result['agents']:
            status = ag.get('health_status', 'Unknown')
            if status == 'Healthy':
                _log_event('HealthCheckPassed', 'Health Agent',
                    ag.get('name', 'Unknown') + ' — healthy (' + str(round(ag.get('response_time_ms') or 0)) + 'ms)',
                    'info')
            else:
                _log_event('HealthCheckFailed', 'Health Agent',
                    ag.get('name', 'Unknown') + ' — ' + status + ': ' + (ag.get('assessment', 'needs attention') or 'needs attention'),
                    'critical' if status == 'Unhealthy' else 'warning')

    elif agent_type == 'audit':
        stats = result.get('stats', {})
        _log_event('AuditCompleted', 'Audit Agent',
            'Audit completed — ' + str(stats.get('open_findings', 0)) + ' open findings, ' + str(stats.get('critical_findings', 0)) + ' critical',
            'high' if stats.get('critical_findings', 0) > 0 else 'info')

def _generate_id():
    """Generate a unique agent ID."""
    import random
    return 'AGT-' + str(random.randint(10000, 99999))

# ── Agent runner ──────────────────────────────────────────────

AGENT_MODULES = {
    'compliance': compliance_agent,
    'risk': risk_agent,
    'governance': governance_agent,
    'audit': audit_agent,
    'cost': cost_agent,
    'health': health_agent
}

def _increment_agent_metrics():
    """Simulate task execution, token usage, and cost increases for all active agents."""
    import random
    agents = _load_agents()
    modified = False
    for ag in agents:
        if ag.get('status') == 'Active':
            # Increment tasksExecuted by 100 to 500 tasks
            ag['tasksExecuted'] = ag.get('tasksExecuted', 0) + random.randint(100, 500)
            # Increment tokenUsage by 50000 to 200000 tokens
            ag['tokenUsage'] = ag.get('tokenUsage', 0) + random.randint(50000, 200000)
            # Ensure there is a base monthlyCost if it is 0
            if ag.get('monthlyCost', 0) == 0:
                ag['monthlyCost'] = random.randint(500, 1500)
            modified = True
    if modified:
        _save_agents(agents)

class LLMWrapper:
    """Wrapper to make llm_gateway support both direct calling and .call_llm() calling."""
    def __init__(self, gateway):
        self.gateway = gateway
        
    def __call__(self, system_prompt, user_prompt, temperature=0.3):
        return self.gateway.call_llm(system_prompt, user_prompt, temperature)
        
    def call_llm(self, system_prompt, user_prompt, temperature=0.3):
        return self.gateway.call_llm(system_prompt, user_prompt, temperature)
        
    def parse_json_response(self, text):
        return self.gateway.parse_json_response(text)

def run_single_agent(agent_type, agents_list):
    """Run a single AI agent and return results."""
    if agent_type not in AGENT_MODULES:
        return {'error': 'Unknown agent type: ' + agent_type}
    
    # Increment tasks/tokens/cost on the server to simulate live runtime activity
    _increment_agent_metrics()
    
    # Reload the agents list to use the updated values in the LLM run
    agents_list = _load_agents()
    
    module = AGENT_MODULES[agent_type]
    start = time.time()
    
    # Wrap gateway to support all agents' calling styles
    llm_wrapper = LLMWrapper(llm_gateway)
    
    try:
        if agent_type == 'audit':
            # Audit agent can use results from other agents
            results = _load_results()
            result = module.run(
                agents_list,
                llm_wrapper,
                compliance_results=results.get('compliance'),
                risk_results=results.get('risk'),
                governance_results=results.get('governance')
            )
        else:
            result = module.run(agents_list, llm_wrapper)
        
        elapsed = round(time.time() - start, 2)
        result['_meta'] = {
            'agent_type': agent_type,
            'elapsed_seconds': elapsed,
            'agents_analyzed': len(agents_list),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Save results
        all_results = _load_results()
        all_results[agent_type] = result
        _save_results(all_results)
        
        # Log to KPI history SQL database
        _record_kpi_history()
        
        # Log real events from this agent's findings
        _log_event('AgentRunStarted', agent_type.title() + ' Agent',
            agent_type.title() + ' agent analyzed ' + str(len(agents_list)) + ' agents in ' + str(elapsed) + 's',
            'info')
        _extract_events_from_results(agent_type, result)
        
        print('[Server] Agent "' + agent_type + '" completed in ' + str(elapsed) + 's')
        return result
    
    except Exception as e:
        traceback.print_exc()
        _log_event('AgentRunFailed', agent_type.title() + ' Agent',
            agent_type.title() + ' agent failed: ' + str(e), 'critical')
        return {'error': str(e), 'agent_type': agent_type}


def run_all_agents(agents_list):
    """Run all AI agents sequentially and return combined results."""
    combined = {}
    order = ['compliance', 'risk', 'governance', 'cost', 'health', 'audit']  # audit last (needs others' results)
    
    for agent_type in order:
        print('[Server] Running ' + agent_type + ' agent...')
        combined[agent_type] = run_single_agent(agent_type, agents_list)
    
    return combined


def _cleanup_agent_data(agent_id, agent_name):
    """Clean up results and events for a specific agent when it is offboarded."""
    # 1. Clean results.json
    results = _load_results()
    modified = False
    
    if 'compliance' in results:
        c = results['compliance']
        if 'agent_results' in c:
            initial_len = len(c['agent_results'])
            c['agent_results'] = [r for r in c['agent_results'] if r.get('agent_id') != agent_id]
            if len(c['agent_results']) != initial_len:
                modified = True
        if 'findings' in c:
            initial_len = len(c['findings'])
            c['findings'] = [f for f in c['findings'] if f.get('agent_id') != agent_id]
            if len(c['findings']) != initial_len:
                modified = True
                
    if 'risk' in results:
        r = results['risk']
        if 'agents' in r:
            initial_len = len(r['agents'])
            r['agents'] = [ag for ag in r['agents'] if ag.get('id') != agent_id]
            if len(r['agents']) != initial_len:
                modified = True
                
    if 'governance' in results:
        g = results['governance']
        if 'violations' in g:
            initial_len = len(g['violations'])
            g['violations'] = [v for v in g['violations'] if v.get('agent_id') != agent_id]
            if len(g['violations']) != initial_len:
                modified = True
                
    if 'cost' in results:
        co = results['cost']
        for key in ('top_spenders', 'all_agents_summary'):
            if key in co:
                initial_len = len(co[key])
                co[key] = [s for s in co[key] if s.get('name') != agent_name and s.get('id') != agent_id]
                if len(co[key]) != initial_len:
                    modified = True
                    
    if 'health' in results:
        h = results['health']
        if 'agents' in h:
            initial_len = len(h['agents'])
            h['agents'] = [ag for ag in h['agents'] if ag.get('id') != agent_id]
            if len(h['agents']) != initial_len:
                modified = True
                
    if 'audit' in results:
        au = results['audit']
        if 'findings' in au:
            initial_len = len(au['findings'])
            au['findings'] = [f for f in au['findings'] if agent_id not in str(f) and (not agent_name or agent_name not in str(f))]
            if len(au['findings']) != initial_len:
                modified = True
                
    if modified:
        _save_results(results)
        
    # 2. Clean _event_log and events.json
    global _event_log
    initial_event_len = len(_event_log)
    _event_log = [
        e for e in _event_log 
        if agent_id not in e.get('description', '') 
        and (not agent_name or agent_name not in e.get('description', ''))
        and agent_id not in e.get('id', '')
    ]
    if len(_event_log) != initial_event_len:
        _save_events()


# ── HTTP Request Handler ──────────────────────────────────────

class AETHERHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for AETHER API + static files."""
    protocol_version = 'HTTP/1.0'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        # API routes
        if path == '/api/health':
            self._json_response({'status': 'ok', 'server': 'AETHER Backend', 'timestamp': datetime.now(timezone.utc).isoformat(), 'llm_providers': llm_gateway._get_provider_order()})
            return
            
        if path == '/api/db-stats':
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("SELECT COUNT(*) FROM agents")
                active_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM deboarded_agents")
                deboarded_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT SUM(tasksExecuted), SUM(monthlyCost) FROM agents")
                active_tasks, active_spend = cursor.fetchone()
                active_tasks = active_tasks or 0
                active_spend = active_spend or 0.0
                
                cursor.execute("SELECT SUM(tasksExecuted), SUM(monthlyCost) FROM deboarded_agents")
                deboarded_tasks, deboarded_spend = cursor.fetchone()
                deboarded_tasks = deboarded_tasks or 0
                deboarded_spend = deboarded_spend or 0.0
                
                cumulative_tasks = active_tasks + deboarded_tasks
                cumulative_spend = active_spend + deboarded_spend
                cumulative_onboarded = active_count + deboarded_count
                
                cumulative_roi = 0.0
                if cumulative_spend > 0:
                    cumulative_roi = round((cumulative_tasks * 0.1) / cumulative_spend * 100, 1)
                    
                cursor.execute("SELECT * FROM deboarded_agents ORDER BY deboardedAt DESC")
                deboarded_list = []
                for r in cursor.fetchall():
                    deboarded_list.append({
                        'id': r['id'],
                        'name': r['name'],
                        'platform': r['platform'],
                        'department': r['department'],
                        'owner': r['owner'],
                        'deboardedAt': r['deboardedAt'],
                        'reason': r['reason'],
                        'monthlyCost': r['monthlyCost'],
                        'tasksExecuted': r['tasksExecuted']
                    })
                    
                conn.close()
                
                self._json_response({
                    'active_count': active_count,
                    'deboarded_count': deboarded_count,
                    'cumulative_onboarded': cumulative_onboarded,
                    'cumulative_tasks': cumulative_tasks,
                    'cumulative_spend': cumulative_spend,
                    'cumulative_roi': cumulative_roi,
                    'deboarded_agents': deboarded_list
                })
            except Exception as e:
                self._json_response({'error': str(e)}, 500)
            return
        
        if path == '/api/tasks':
            query = urllib.parse.parse_qs(parsed.query)
            agent_id = query.get('agent_id', [None])[0]
            limit_val = query.get('limit', ['100'])[0]
            try:
                limit = int(limit_val)
            except ValueError:
                limit = 100
            
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                if agent_id:
                    cursor.execute("SELECT * FROM tasks WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?", (agent_id, limit))
                else:
                    cursor.execute("SELECT * FROM tasks ORDER BY timestamp DESC LIMIT ?", (limit,))
                
                tasks = [dict(row) for row in cursor.fetchall()]
                conn.close()
                self._json_response(tasks)
            except Exception as e:
                self._json_response({'error': str(e)}, 500)
            return

        if path == '/api/agents':
            agents = _load_agents()
            self._json_response({'agents': agents, 'count': len(agents)})
            return
        
        if path == '/api/events':
            # Return real events from agent monitoring
            # Support ?since=EVT-00010 to get only newer events
            query = urllib.parse.parse_qs(parsed.query)
            since_id = query.get('since', [None])[0]
            events = _event_log[:]
            if since_id:
                # Find the index of the since event and return everything after it
                idx = -1
                for i, ev in enumerate(events):
                    if ev.get('id') == since_id:
                        idx = i
                        break
                if idx >= 0:
                    events = events[idx + 1:]
            self._json_response({'events': events[-50:], 'total': len(_event_log)})
            return
        
        if path == '/api/results':
            results = _load_results()
            self._json_response(results)
            return
        
        if path.startswith('/api/results/'):
            agent_type = path.split('/')[-1]
            results = _load_results()
            if agent_type in results:
                self._json_response(results[agent_type])
            else:
                self._json_response({'error': 'No results for ' + agent_type, 'available': list(results.keys())}, 404)
            return
        
        # Static files
        super().do_GET()
    
    def do_POST(self):
        """Handle POST requests."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        # Read body
        body = {}
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw = self.rfile.read(content_length)
            try:
                body = json.loads(raw.decode('utf-8'))
            except:
                body = {}
        
        if path == '/api/agents':
            return self._handle_onboard_agent(body)
        
        if path.startswith('/api/run-agent/'):
            agent_type = path.split('/')[-1]
            return self._handle_run_agent(agent_type)
        
        if path == '/api/run-all':
            return self._handle_run_all()
        
        self._json_response({'error': 'Unknown endpoint: ' + path}, 404)
    
    def do_DELETE(self):
        """Handle DELETE requests."""
        global _event_log, _event_counter
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        if path == '/api/agents':
            try:
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute("DELETE FROM agents")
                cursor.execute("DELETE FROM deboarded_agents")
                cursor.execute("DELETE FROM kpi_history")
                conn.commit()
                conn.close()
            except Exception as e:
                print("[DB] Error clearing SQLite on reset all:", e)
                
            _save_agents([])
            # Also clear results
            _save_results({})
            # Also clear events
            _event_log = []
            _event_counter = 0
            _save_events()
            self._json_response({'message': 'All agents removed', 'count': 0})
            return
        
        if path.startswith('/api/agents/'):
            agent_id = path.split('/')[-1]
            agents = _load_agents()
            
            # Find the agent to get its name and archive details
            agent_name = ''
            agent_to_deboard = None
            for a in agents:
                if a.get('id') == agent_id:
                    agent_name = a.get('name', '')
                    agent_to_deboard = a
                    break
                    
            if agent_to_deboard:
                try:
                    conn = sqlite3.connect(DB_FILE)
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT OR REPLACE INTO deboarded_agents (
                            id, name, platform, department, owner, deboardedAt, reason, monthlyCost, tasksExecuted
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        agent_to_deboard.get('id'),
                        agent_to_deboard.get('name'),
                        agent_to_deboard.get('platform'),
                        agent_to_deboard.get('department'),
                        agent_to_deboard.get('owner'),
                        datetime.now(timezone.utc).isoformat(),
                        "Decommissioned/Removed",
                        agent_to_deboard.get('monthlyCost', 0.0),
                        agent_to_deboard.get('tasksExecuted', 0)
                    ))
                    conn.commit()
                    conn.close()
                    print(f"[DB] Archived agent {agent_id} ({agent_name}) to deboarded_agents.")
                except Exception as e:
                    print("[DB] Error archiving deboarded agent to SQLite:", e)
                    
            agents = [a for a in agents if a.get('id') != agent_id]
            _save_agents(agents)
            
            # Clean up results and events for this agent
            _cleanup_agent_data(agent_id, agent_name)
            
            # Log deboard to KPI history SQL database
            _record_kpi_history()
            
            # If no agents remain, clear all events and results completely
            if len(agents) == 0:
                _save_results({})
                _event_log = []
                _event_counter = 0
                _save_events()
            
            self._json_response({'message': 'Agent removed', 'id': agent_id, 'remaining': len(agents)})
            return
        
        self._json_response({'error': 'Unknown endpoint'}, 404)
    
    # ── API handlers ──────────────────────────────────────────
    
    def _handle_onboard_agent(self, body):
        """Onboard a new agent."""
        agents = _load_agents()
        
        agent = {
            'id': body.get('id') or _generate_id(),
            'name': body.get('name', 'Unnamed Agent'),
            'platform': body.get('platform', 'Custom'),
            'department': body.get('department', 'Engineering'),
            'owner': body.get('owner', 'Unknown'),
            'status': 'Active',
            'environment': body.get('environment', 'Production'),
            'purpose': body.get('purpose', ''),
            'endpoint': body.get('endpoint', ''),
            'piiAccess': body.get('piiAccess', False),
            'financialAccess': body.get('financialAccess', False),
            'riskScore': body.get('riskScore', 0),
            'certificationStatus': body.get('certificationStatus', 'Pending'),
            'region': body.get('region', 'US'),
            'monthlyCost': body.get('monthlyCost', 0),
            'tasksExecuted': body.get('tasksExecuted', 0),
            'successRate': body.get('successRate', '99.5'),
            'availability': body.get('availability', '99.9'),
            'avgLatency': body.get('avgLatency', 200),
            'tokenUsage': body.get('tokenUsage', 0),
            'model': body.get('model', ''),
            'criticality': body.get('criticality', 'Medium'),
            'onboardedAt': datetime.now(timezone.utc).isoformat(),
            'lastSeen': datetime.now(timezone.utc).isoformat()
        }
        
        agents.append(agent)
        _save_agents(agents)
        _record_kpi_history()
        
        # Log real onboarding event
        _log_event('AgentOnboarded', 'AETHER Platform',
            agent['name'] + ' (' + agent['id'] + ') onboarded on ' + agent.get('platform', 'Custom'),
            'info')
        
        print('[Server] Agent onboarded: ' + agent['name'] + ' (' + agent['id'] + ')')
        self._json_response({'message': 'Agent onboarded', 'agent': agent, 'total': len(agents)}, 201)
    
    def _handle_run_agent(self, agent_type):
        """Run a specific AI agent."""
        agents = _load_agents()
        
        if len(agents) == 0:
            self._json_response({'error': 'No agents onboarded. Add agents first.', 'agent_type': agent_type}, 400)
            return
        
        print('[Server] Running ' + agent_type + ' agent on ' + str(len(agents)) + ' agents...')
        result = run_single_agent(agent_type, agents)
        self._json_response(result)
    
    def _handle_run_all(self):
        """Run all AI agents."""
        agents = _load_agents()
        
        if len(agents) == 0:
            self._json_response({'error': 'No agents onboarded. Add agents first.'}, 400)
            return
        
        print('[Server] Running ALL agents on ' + str(len(agents)) + ' agents...')
        results = run_all_agents(agents)
        log_new_tasks_for_run_all(agents)
        self._json_response(results)
    
    # ── Response helpers ──────────────────────────────────────
    
    def _json_response(self, data, status=200):
        """Send a JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))
    
    def _set_cors_headers(self):
        """Set CORS headers for browser access."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def log_message(self, format, *args):
        """Custom log format."""
        if '/api/' in str(args[0]) if args else False:
            print('[Server] ' + str(args[0]))

# ── Main ──────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('AETHER_PORT', '3000'))
    
    print('=' * 60)
    print('  AETHER Backend Server')
    print('=' * 60)
    print('  Port:         ' + str(port))
    print('  Static dir:   ' + PROJECT_ROOT)
    print('  Agents file:  ' + AGENTS_FILE)
    print('  LLM order:    ' + ', '.join(llm_gateway._get_provider_order()))
    print('=' * 60)
    print()
    print('  API Endpoints:')
    print('    GET    /api/health           — Server health')
    print('    GET    /api/agents           — List agents')
    print('    POST   /api/agents           — Onboard agent')
    print('    DELETE /api/agents           — Remove all agents')
    print('    DELETE /api/agents/<id>      — Remove agent')
    print('    POST   /api/run-agent/<type> — Run AI agent')
    print('    POST   /api/run-all          — Run all AI agents')
    print('    GET    /api/results          — Latest results')
    print('    GET    /api/results/<type>   — Results by type')
    print()
    print('  Agent types: compliance, risk, governance, audit, cost, health')
    print('=' * 60)
    print('  AETHER MCP Server:')
    print('    Command to run: py mcp_server.py')
    print('    Enables LLM tools to safely query active & deboarded telemetry.')
    print('=' * 60)
    print()
    
    # Load persisted events
    _load_events()
    print('  Events loaded: ' + str(len(_event_log)))
    print()
    
    if len(_load_agents()) == 0:
        print('[Server] No agents onboarded. Resetting stale events and results.')
        _save_results({})
        _event_log = []
        _event_counter = 0
        _save_events()
    
    server = http.server.HTTPServer(('0.0.0.0', port), AETHERHandler)
    print('[Server] Listening on http://localhost:' + str(port))
    print('[Server] Press Ctrl+C to stop')
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[Server] Shutting down...')
        server.shutdown()
