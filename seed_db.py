"""
AETHER Database Seeder
======================
Populates the SQLite database with realistic agents and tasks 
using model-specific LLM pricing for accurate cost calculations.

Run: python seed_db.py  (or anaconda3/python.exe seed_db.py)
"""

import sqlite3
import uuid
import random
from datetime import datetime, timedelta, timezone

DB_FILE = 'aether.db'

# ── LLM Model Pricing Profiles ────────────────────────────────

MODEL_PROFILES = {
    'gpt-4o': {
        'input_rate':  0.0000025,   # $2.50 / M tokens
        'output_rate': 0.000010,    # $10.00 / M tokens
        'tpm_limit':   450000,
        'rpm_limit':   3000,
        'display':     'GPT-4o (OpenAI)',
    },
    'gpt-4': {
        'input_rate':  0.000030,    # $30.00 / M tokens
        'output_rate': 0.000060,    # $60.00 / M tokens
        'tpm_limit':   150000,
        'rpm_limit':   1000,
        'display':     'GPT-4 (Microsoft Copilot)',
    },
    'claude-3-5-sonnet': {
        'input_rate':  0.000003,    # $3.00 / M tokens
        'output_rate': 0.000015,    # $15.00 / M tokens
        'tpm_limit':   200000,
        'rpm_limit':   1500,
        'display':     'Claude 3.5 Sonnet (Anthropic)',
    },
    'snowflake-cortex': {
        'input_rate':  0.0000007,   # $0.70 / M tokens
        'output_rate': 0.0000028,   # $2.80 / M tokens
        'tpm_limit':   300000,
        'rpm_limit':   2000,
        'display':     'Snowflake Cortex (Arctic)',
    },
    'databricks-dbrx': {
        'input_rate':  0.0000015,   # $1.50 / M tokens
        'output_rate': 0.0000045,   # $4.50 / M tokens
        'tpm_limit':   250000,
        'rpm_limit':   1800,
        'display':     'Databricks DBRX',
    },
}

# ── Agents to seed ────────────────────────────────────────────

AGENTS = [
    {
        'id':                 'AGT-10001',
        'name':               'Procurement Intelligence Agent',
        'platform':           'OpenAI GPT',
        'department':         'Procurement',
        'owner':              'Sarah Chen',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Automates procurement analysis, vendor evaluation, and purchase order workflows using GPT-4o.',
        'endpoint':           'https://api.openai.com/v1/chat/completions',
        'piiAccess':          0,
        'financialAccess':    1,
        'riskScore':          42,
        'certificationStatus':'Certified',
        'region':             'us-east-1',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        98.2,
        'availability':       99.7,
        'avgLatency':         312,
        'tokenUsage':         0,
        'model':              'gpt-4o',
        'criticality':        'High',
        'onboardedAt':        '2026-01-15T09:00:00Z',
        'lastSeen':           '2026-06-22T18:30:00Z',
    },
    {
        'id':                 'AGT-10002',
        'name':               'Compliance Monitor Agent',
        'platform':           'Microsoft Copilot',
        'department':         'Legal & Compliance',
        'owner':              'James Patel',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Monitors regulatory compliance across SOC 2, GDPR, HIPAA, and SOX frameworks using GPT-4.',
        'endpoint':           'https://api.openai.com/v1/chat/completions',
        'piiAccess':          1,
        'financialAccess':    1,
        'riskScore':          71,
        'certificationStatus':'Pending Review',
        'region':             'eu-west-1',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        96.4,
        'availability':       98.9,
        'avgLatency':         580,
        'tokenUsage':         0,
        'model':              'gpt-4',
        'criticality':        'Critical',
        'onboardedAt':        '2026-02-01T10:30:00Z',
        'lastSeen':           '2026-06-22T17:45:00Z',
    },
    {
        'id':                 'AGT-10003',
        'name':               'Customer Insights Agent',
        'platform':           'Anthropic Claude',
        'department':         'Marketing',
        'owner':              'Priya Sharma',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Analyzes customer sentiment, behavior patterns, and generates personalized content recommendations.',
        'endpoint':           'https://api.anthropic.com/v1/messages',
        'piiAccess':          1,
        'financialAccess':    0,
        'riskScore':          55,
        'certificationStatus':'Certified',
        'region':             'us-west-2',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        97.8,
        'availability':       99.1,
        'avgLatency':         420,
        'tokenUsage':         0,
        'model':              'claude-3-5-sonnet',
        'criticality':        'Medium',
        'onboardedAt':        '2026-02-15T08:00:00Z',
        'lastSeen':           '2026-06-22T19:00:00Z',
    },
    {
        'id':                 'AGT-10004',
        'name':               'Data Warehouse Analyst Agent',
        'platform':           'Snowflake Cortex',
        'department':         'Data Engineering',
        'owner':              'Michael Torres',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Runs analytics queries, generates reports, and summarizes data warehouse insights using Snowflake Cortex.',
        'endpoint':           'https://cortex.snowflake.com/v1/complete',
        'piiAccess':          0,
        'financialAccess':    1,
        'riskScore':          28,
        'certificationStatus':'Certified',
        'region':             'us-central-1',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        99.0,
        'availability':       99.9,
        'avgLatency':         220,
        'tokenUsage':         0,
        'model':              'snowflake-cortex',
        'criticality':        'High',
        'onboardedAt':        '2026-03-01T11:00:00Z',
        'lastSeen':           '2026-06-22T20:00:00Z',
    },
    {
        'id':                 'AGT-10005',
        'name':               'MLOps Pipeline Agent',
        'platform':           'Databricks AI',
        'department':         'AI / ML',
        'owner':              'Anita Kumar',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Orchestrates ML model training, evaluation, and deployment pipelines using Databricks DBRX.',
        'endpoint':           'https://adb-001.azuredatabricks.net/serving-endpoints/dbrx-instruct/invocations',
        'piiAccess':          0,
        'financialAccess':    0,
        'riskScore':          38,
        'certificationStatus':'Certified',
        'region':             'us-east-2',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        97.2,
        'availability':       98.6,
        'avgLatency':         890,
        'tokenUsage':         0,
        'model':              'databricks-dbrx',
        'criticality':        'High',
        'onboardedAt':        '2026-03-10T14:00:00Z',
        'lastSeen':           '2026-06-22T16:30:00Z',
    },
    {
        'id':                 'AGT-10006',
        'name':               'Security Threat Analyst Agent',
        'platform':           'OpenAI GPT',
        'department':         'Security Operations',
        'owner':              'David Kim',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Detects anomalous behaviors, classifies threats, and generates incident response playbooks.',
        'endpoint':           'https://api.openai.com/v1/chat/completions',
        'piiAccess':          1,
        'financialAccess':    0,
        'riskScore':          65,
        'certificationStatus':'Certified',
        'region':             'us-east-1',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        99.5,
        'availability':       99.8,
        'avgLatency':         280,
        'tokenUsage':         0,
        'model':              'gpt-4o',
        'criticality':        'Critical',
        'onboardedAt':        '2026-01-20T07:30:00Z',
        'lastSeen':           '2026-06-22T21:00:00Z',
    },
    {
        'id':                 'AGT-10007',
        'name':               'HR Policy Assistant Agent',
        'platform':           'Anthropic Claude',
        'department':         'Human Resources',
        'owner':              'Lisa Wong',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Answers HR policy queries, generates offer letters, and summarizes performance reviews.',
        'endpoint':           'https://api.anthropic.com/v1/messages',
        'piiAccess':          1,
        'financialAccess':    0,
        'riskScore':          48,
        'certificationStatus':'Certified',
        'region':             'us-west-2',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        98.7,
        'availability':       99.3,
        'avgLatency':         350,
        'tokenUsage':         0,
        'model':              'claude-3-5-sonnet',
        'criticality':        'Medium',
        'onboardedAt':        '2026-04-01T09:00:00Z',
        'lastSeen':           '2026-06-22T15:00:00Z',
    },
    {
        'id':                 'AGT-10008',
        'name':               'Finance Reporting Agent',
        'platform':           'Microsoft Copilot',
        'department':         'Finance',
        'owner':              'Robert Hall',
        'status':             'Active',
        'environment':        'Production',
        'purpose':            'Generates financial reports, budget variance analysis, and executive summaries using GPT-4.',
        'endpoint':           'https://api.openai.com/v1/chat/completions',
        'piiAccess':          0,
        'financialAccess':    1,
        'riskScore':          62,
        'certificationStatus':'Certified',
        'region':             'eu-west-1',
        'monthlyCost':        0,
        'tasksExecuted':      0,
        'successRate':        97.9,
        'availability':       99.4,
        'avgLatency':         510,
        'tokenUsage':         0,
        'model':              'gpt-4',
        'criticality':        'Critical',
        'onboardedAt':        '2026-02-20T10:00:00Z',
        'lastSeen':           '2026-06-22T14:00:00Z',
    },
]

# ── Task Templates ────────────────────────────────────────────

TASK_TYPES = [
    ('Database Query',     'Executed structured read query on operational data store.',            80,   600,   500,   4000),
    ('API Integration',    'Synched external partner API for inventory and order status.',         200,  1200,  800,   6000),
    ('Document Analysis',  'Extracted key clauses and risks from vendor contract documents.',      600,  3000,  2000,  15000),
    ('LLM Reasoning',      'Generated executive summary and recommendations from analysis.',       800,  5000,  3000,  25000),
    ('Security Scan',      'Scanned credential rotation status and open port inventory.',         400,  2500,  1000,  12000),
    ('Report Generation',  'Compiled compliance readiness and audit summary report.',             500,  3500,  1500,  18000),
    ('Code Analysis',      'Performed static analysis on git commit diff for quality gate.',     1000,  8000,  2500,  30000),
    ('Data Validation',    'Validated pipeline outputs against regulatory schema requirements.',   150,   900,   600,   5000),
    ('Log Parsing',        'Processed access logs for anomaly detection and alert triaging.',      50,   400,   200,   2500),
    ('Risk Assessment',    'Scored third-party vendor risk factors against internal policy.',     700,  4000,  2000,  20000),
]


def compute_cost(model_key, tokens):
    profile = MODEL_PROFILES[model_key]
    in_tok = int(tokens * 0.75)
    out_tok = int(tokens * 0.25)
    cost = (in_tok * profile['input_rate']) + (out_tok * profile['output_rate'])
    return round(cost, 6), in_tok, out_tok


def seed():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # ── 1. Clear stale data ───────────────────────────────────
    print('[Seed] Clearing stale agents and tasks...')
    cursor.execute('DELETE FROM agents')
    cursor.execute('DELETE FROM tasks')

    # ── 2. Insert agents ──────────────────────────────────────
    print(f'[Seed] Inserting {len(AGENTS)} agents...')
    for a in AGENTS:
        cursor.execute('''
            INSERT OR REPLACE INTO agents (
                id, name, platform, department, owner, status, environment, purpose,
                endpoint, piiAccess, financialAccess, riskScore, certificationStatus,
                region, monthlyCost, tasksExecuted, successRate, availability,
                avgLatency, tokenUsage, model, criticality, onboardedAt, lastSeen
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            a['id'], a['name'], a['platform'], a['department'], a['owner'],
            a['status'], a['environment'], a['purpose'], a['endpoint'],
            a['piiAccess'], a['financialAccess'], a['riskScore'],
            a['certificationStatus'], a['region'],
            a['monthlyCost'], a['tasksExecuted'], a['successRate'],
            a['availability'], a['avgLatency'], a['tokenUsage'],
            a['model'], a['criticality'], a['onboardedAt'], a['lastSeen']
        ))

    # ── 3. Seed 30-day task history ───────────────────────────
    print('[Seed] Seeding 30-day task history...')
    now = datetime.now(timezone.utc)
    total_tasks = 0

    for agent in AGENTS:
        model_key = agent['model']
        total_tokens = 0
        total_cost   = 0.0
        task_count   = 0

        # Each agent gets 10-20 tasks spread over 30 days
        num_tasks = random.randint(10, 20)
        for _ in range(num_tasks):
            task_name, base_desc, min_dur, max_dur, min_tok, max_tok = random.choice(TASK_TYPES)

            days_ago = random.uniform(0.05, 30.0)
            task_time = now - timedelta(days=days_ago)
            timestamp_str = task_time.isoformat()

            status = 'Success' if random.random() < 0.96 else 'Failed'
            duration = random.randint(min_dur, max_dur)
            tokens = random.randint(min_tok, max_tok)

            cost, in_tok, out_tok = compute_cost(model_key, tokens)

            if status == 'Failed':
                desc = f'Failed during execution: {base_desc}'
                # Failed tasks still consume tokens
            else:
                desc = f'Successfully completed: {base_desc}'

            task_id = 'TSK-' + uuid.uuid4().hex[:8].upper()

            cursor.execute('''
                INSERT INTO tasks (
                    id, agent_id, agent_name, timestamp, status, duration_ms, cost, tokens,
                    task_type, description, model, input_tokens, output_tokens
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                task_id, agent['id'], agent['name'], timestamp_str,
                status, duration, cost, tokens,
                task_name, desc,
                model_key, in_tok, out_tok
            ))

            total_tokens += tokens
            total_cost   += cost
            task_count   += 1
            total_tasks  += 1

        # Update agent metrics from seeded tasks
        cursor.execute('''
            UPDATE agents
            SET tasksExecuted = ?,
                tokenUsage    = ?,
                monthlyCost   = ?
            WHERE id = ?
        ''', (task_count, total_tokens, round(total_cost, 4), agent['id']))

        profile = MODEL_PROFILES[model_key]
        print(f'  {agent["name"]:45s} | {model_key:20s} | {task_count:3d} tasks | '
              f'{total_tokens:8,} tokens | ${total_cost:.4f}')

    # ── 4. Seed A2A Transactions ──────────────────────────────
    print('\n[Seed] Seeding A2A clearing transactions...')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS a2a_transactions (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            sender_id TEXT,
            receiver_id TEXT,
            tokens_requested INTEGER,
            cost REAL,
            status TEXT,
            decline_reason TEXT,
            compliance_check TEXT
        )
    ''')
    cursor.execute('DELETE FROM a2a_transactions')
    
    a2a_scenarios = [
        # (sender, receiver, tokens, status, decline_reason, compliance_check)
        ('AGT-10001', 'AGT-10004', 125000, 'Approved', '', 'Passed'),
        ('AGT-10008', 'AGT-10002', 85000, 'Approved', '', 'Passed'),
        ('AGT-10003', 'AGT-10005', 45000, 'Approved', '', 'Passed'),
        ('AGT-10001', 'AGT-10003', 600000, 'Declined', 'GOV-COST-001 Violation: Requested tokens (600000) exceed transaction threshold (500k)', 'Failed'),
        ('AGT-10006', 'AGT-10002', 150000, 'Refunded', '', 'Passed'),
    ]
    
    for i, (sender_id, receiver_id, tokens, status, decline_reason, compliance) in enumerate(a2a_scenarios):
        tx_id = f"TX-900{i+1}0"
        tx_time = now - timedelta(days=random.uniform(1.0, 15.0))
        timestamp_str = tx_time.isoformat()
        cost = round((tokens * 0.00002), 4)
        
        cursor.execute('''
            INSERT INTO a2a_transactions (id, timestamp, sender_id, receiver_id, tokens_requested, cost, status, decline_reason, compliance_check)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (tx_id, timestamp_str, sender_id, receiver_id, tokens, cost, status, decline_reason, compliance))
        
        if status in ['Approved', 'Refunded']:
            cursor.execute("UPDATE agents SET tasksExecuted = tasksExecuted + 1, tokenUsage = tokenUsage + ? WHERE id=?", (tokens, sender_id))
            cursor.execute("UPDATE agents SET tasksExecuted = tasksExecuted + 1, tokenUsage = tokenUsage + ? WHERE id=?", (tokens, receiver_id))

    conn.commit()
    conn.close()

    print(f'\n[Seed] Done! {total_tasks} tasks seeded across {len(AGENTS)} agents.')
    print('\nModel Pricing Reference:')
    print(f'  {"Model":<22} {"Input $/M":>10}  {"Output $/M":>10}  {"TPM Limit":>12}  {"RPM Limit":>10}')
    print('  ' + '-' * 70)
    for model, p in MODEL_PROFILES.items():
        print(f'  {model:<22} ${p["input_rate"]*1_000_000:>9.2f}  ${p["output_rate"]*1_000_000:>9.2f}  {p["tpm_limit"]:>12,}  {p["rpm_limit"]:>10,}')


if __name__ == '__main__':
    seed()
