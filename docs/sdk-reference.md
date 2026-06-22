# AETHER SDK Reference

> **Version:** 1.0.0 | **Last Updated:** June 2026
> **Platforms:** Python 3.9+ · Node.js 18+ · TypeScript 5.0+

---

## 1. Overview

The **AETHER SDK** provides a unified programmatic interface for AI agents to integrate with the AETHER Enterprise AI Workforce Platform. Through the SDK, agents can:

- **Register** themselves with the platform and receive managed credentials
- **Report health** via periodic heartbeats with system telemetry
- **Emit metrics** such as latency, token usage, cost, and custom KPIs
- **Log activities** including inference calls, tool usage, data access, and user interactions
- **Send governance signals** for data access reporting, decision auditing, tool usage tracking, and approval workflows
- **Subscribe to events** such as policy updates, risk score changes, and compliance alerts

The SDK handles authentication, automatic retries, batching, circuit breaking, and graceful degradation so agent developers can focus on business logic.

---

## 2. Installation

### Python

```bash
pip install aether-sdk
```

For optional async support:

```bash
pip install aether-sdk[async]
```

### TypeScript / Node.js

```bash
npm install @aether-platform/sdk
```

Or with Yarn:

```bash
yarn add @aether-platform/sdk
```

---

## 3. Authentication Setup

The SDK supports two authentication methods:

| Method | Use Case |
|---|---|
| **API Key** | Service-to-service, background agents, CI/CD pipelines |
| **OAuth 2.0 / Entra ID** | Enterprise SSO, user-delegated agents, Azure-integrated workloads |

### Environment Variables

Set the following environment variables before initializing the client:

| Variable | Required | Description |
|---|---|---|
| `AETHER_API_URL` | Yes | Base URL of the AETHER platform API (e.g., `https://api.aether.example.com`) |
| `AETHER_API_KEY` | Yes* | API key for authentication (*not required if using OAuth) |
| `AETHER_TENANT_ID` | Yes | Your organization's tenant identifier |

### Config File (`~/.aether/config.yaml`)

```yaml
# ~/.aether/config.yaml
api_url: "https://api.aether.example.com"
api_key: "aether_sk_live_abc123..."
tenant_id: "tenant-contoso-prod"
timeout: 30
retry_count: 3
enable_batch: true
batch_size: 50
batch_interval_ms: 5000
```

### Python — Authentication Examples

```python
from aether_sdk import AetherClient

# Option 1: API Key via environment variables (recommended)
# Reads AETHER_API_URL, AETHER_API_KEY, AETHER_TENANT_ID automatically
client = AetherClient()

# Option 2: API Key — explicit parameters
client = AetherClient(
    api_url="https://api.aether.example.com",
    api_key="aether_sk_live_abc123...",
    tenant_id="tenant-contoso-prod"
)

# Option 3: OAuth 2.0 / Entra ID token
from aether_sdk.auth import EntraIDProvider

auth_provider = EntraIDProvider(
    client_id="your-app-client-id",
    client_secret="your-app-client-secret",
    tenant_id="your-azure-tenant-id",
    scope="https://aether.example.com/.default"
)

client = AetherClient(
    api_url="https://api.aether.example.com",
    tenant_id="tenant-contoso-prod",
    auth_provider=auth_provider
)

# Option 4: Load from config file
client = AetherClient.from_config("~/.aether/config.yaml")
```

### TypeScript — Authentication Examples

```typescript
import { AetherClient } from "@aether-platform/sdk";
import { EntraIDProvider } from "@aether-platform/sdk/auth";

// Option 1: API Key via environment variables (recommended)
const client = new AetherClient();

// Option 2: API Key — explicit parameters
const client = new AetherClient({
  apiUrl: "https://api.aether.example.com",
  apiKey: "aether_sk_live_abc123...",
  tenantId: "tenant-contoso-prod",
});

// Option 3: OAuth 2.0 / Entra ID token
const authProvider = new EntraIDProvider({
  clientId: "your-app-client-id",
  clientSecret: "your-app-client-secret",
  tenantId: "your-azure-tenant-id",
  scope: "https://aether.example.com/.default",
});

const client = new AetherClient({
  apiUrl: "https://api.aether.example.com",
  tenantId: "tenant-contoso-prod",
  authProvider,
});

// Option 4: Load from config file
const client = await AetherClient.fromConfig("~/.aether/config.yaml");
```

---

## 4. Client Initialization

The client accepts the following initialization options:

| Option | Python Name | TypeScript Name | Type | Default | Description |
|---|---|---|---|---|---|
| API URL | `api_url` | `apiUrl` | `string` | `env:AETHER_API_URL` | Base URL of the AETHER API |
| API Key | `api_key` | `apiKey` | `string` | `env:AETHER_API_KEY` | API key for authentication |
| Tenant ID | `tenant_id` | `tenantId` | `string` | `env:AETHER_TENANT_ID` | Organization tenant ID |
| Timeout | `timeout` | `timeout` | `int` / `number` | `30` (seconds) | Request timeout in seconds |
| Retry Count | `retry_count` | `retryCount` | `int` / `number` | `3` | Max retry attempts on failure |
| Retry Delay | `retry_delay` | `retryDelay` | `float` / `number` | `1.0` (seconds) | Initial delay between retries (exponential backoff) |
| Enable Batch | `enable_batch` | `enableBatch` | `bool` / `boolean` | `false` | Enable batched metric/activity reporting |
| Batch Size | `batch_size` | `batchSize` | `int` / `number` | `50` | Max items per batch flush |
| Batch Interval | `batch_interval_ms` | `batchIntervalMs` | `int` / `number` | `5000` (ms) | Interval between batch flushes |

### Python

```python
from aether_sdk import AetherClient

client = AetherClient(
    api_url="https://api.aether.example.com",
    api_key="aether_sk_live_abc123...",
    tenant_id="tenant-contoso-prod",
    timeout=30,
    retry_count=3,
    retry_delay=1.0,
    enable_batch=True,
    batch_size=50,
    batch_interval_ms=5000
)
```

### TypeScript

```typescript
import { AetherClient } from "@aether-platform/sdk";

const client = new AetherClient({
  apiUrl: "https://api.aether.example.com",
  apiKey: "aether_sk_live_abc123...",
  tenantId: "tenant-contoso-prod",
  timeout: 30,
  retryCount: 3,
  retryDelay: 1.0,
  enableBatch: true,
  batchSize: 50,
  batchIntervalMs: 5000,
});
```

---

## 5. Agent Registration

Register an AI agent with the AETHER platform to receive a managed identity, API credentials, and webhook endpoint.

### Registration Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Unique agent name within the tenant |
| `description` | `string` | No | Human-readable description of the agent's purpose |
| `owner` | `string` | No | Email or identity of the agent owner |
| `department` | `string` | No | Owning department or business unit |
| `platform` | `enum` | No | Source platform — one of: `copilot_studio`, `agentforce`, `databricks`, `aws_bedrock`, `google_vertex`, `langchain`, `langgraph`, `autogen`, `custom` |
| `environment` | `enum` | No | Deployment environment — one of: `production`, `staging`, `development`, `testing` |
| `endpoint_url` | `string` | No | Agent's callable endpoint URL |
| `region` | `string` | No | Deployment region (e.g., `us-east-1`, `westeurope`) |
| `runtime` | `string` | No | Runtime environment (e.g., `python-3.11`, `node-20`) |
| `version` | `string` | No | Agent version string (e.g., `1.2.0`) |
| `monitoring_method` | `enum` | No | Monitoring approach — currently: `sdk_push` |
| `tags` | `string[]` | No | Searchable tags for categorization |
| `metadata` | `object` | No | Arbitrary key-value metadata |
| `capabilities` | `string[]` | No | List of agent capabilities (e.g., `chat`, `summarization`, `code_generation`) |
| `data_access` | `boolean` | No | Whether the agent accesses enterprise data |
| `pii_access` | `boolean` | No | Whether the agent processes PII |
| `financial_access` | `boolean` | No | Whether the agent accesses financial systems |
| `external_access` | `boolean` | No | Whether the agent makes external API calls |

### Registration Response

| Field | Type | Description |
|---|---|---|
| `agent_id` | `string` | Unique AETHER-managed agent identifier |
| `api_credentials` | `object` | Contains `client_id` and `client_secret` for agent-to-platform auth |
| `webhook_url` | `string` | Webhook URL for receiving governance signals and events |

### Python

```python
from aether_sdk import AetherClient

client = AetherClient()

registration = client.register_agent(
    name="finance-reconciliation-agent",
    description="Automates monthly financial reconciliation using AI-driven matching",
    owner="finance-ml-team@contoso.com",
    department="Finance",
    platform="langchain",
    environment="production",
    endpoint_url="https://agents.contoso.com/finance-recon",
    region="us-east-1",
    runtime="python-3.11",
    version="2.1.0",
    monitoring_method="sdk_push",
    tags=["finance", "reconciliation", "production", "critical"],
    metadata={
        "cost_center": "CC-4200",
        "jira_project": "FIN-AI",
        "model": "gpt-4o"
    },
    capabilities=["data_analysis", "report_generation", "anomaly_detection"],
    data_access=True,
    pii_access=False,
    financial_access=True,
    external_access=False
)

print(f"Agent ID: {registration.agent_id}")
print(f"Client ID: {registration.api_credentials.client_id}")
print(f"Client Secret: {registration.api_credentials.client_secret}")
print(f"Webhook URL: {registration.webhook_url}")
```

### TypeScript

```typescript
import { AetherClient } from "@aether-platform/sdk";

const client = new AetherClient();

const registration = await client.registerAgent({
  name: "finance-reconciliation-agent",
  description:
    "Automates monthly financial reconciliation using AI-driven matching",
  owner: "finance-ml-team@contoso.com",
  department: "Finance",
  platform: "langchain",
  environment: "production",
  endpointUrl: "https://agents.contoso.com/finance-recon",
  region: "us-east-1",
  runtime: "python-3.11",
  version: "2.1.0",
  monitoringMethod: "sdk_push",
  tags: ["finance", "reconciliation", "production", "critical"],
  metadata: {
    costCenter: "CC-4200",
    jiraProject: "FIN-AI",
    model: "gpt-4o",
  },
  capabilities: ["data_analysis", "report_generation", "anomaly_detection"],
  dataAccess: true,
  piiAccess: false,
  financialAccess: true,
  externalAccess: false,
});

console.log(`Agent ID: ${registration.agentId}`);
console.log(`Client ID: ${registration.apiCredentials.clientId}`);
console.log(`Client Secret: ${registration.apiCredentials.clientSecret}`);
console.log(`Webhook URL: ${registration.webhookUrl}`);
```

---

## 6. Health Reporting (Heartbeat)

Heartbeats let the platform know an agent is alive and healthy. Each heartbeat can include system telemetry and custom metrics.

### Heartbeat Payload

| Field | Type | Default | Description |
|---|---|---|---|
| `status` | `enum` | `healthy` | One of: `healthy`, `degraded`, `unhealthy` |
| `latency_ms` | `float` | — | Current request processing latency (ms) |
| `memory_usage_mb` | `float` | — | Current memory consumption (MB) |
| `cpu_usage_percent` | `float` | — | Current CPU utilization (%) |
| `active_sessions` | `int` | — | Number of active user/request sessions |
| `custom_metrics` | `object` | — | Arbitrary key-value pairs for custom telemetry |

### Python — Manual Heartbeat

```python
client.heartbeat(
    agent_id=registration.agent_id,
    status="healthy",
    latency_ms=45.2,
    memory_usage_mb=512.8,
    cpu_usage_percent=23.5,
    active_sessions=12,
    custom_metrics={
        "queue_depth": 3,
        "cache_hit_rate": 0.89,
        "pending_tasks": 7
    }
)
```

### Python — Automatic Heartbeat

```python
# Start automatic heartbeat every 60 seconds (default)
heartbeat_handle = client.start_heartbeat(
    agent_id=registration.agent_id,
    interval_seconds=60,
    collect_system_metrics=True   # auto-collect CPU, memory, etc.
)

# The heartbeat runs in a background thread.
# Custom metrics can be updated dynamically:
heartbeat_handle.update_custom_metrics({
    "queue_depth": 5,
    "model_version": "v2.1"
})

# Stop the automatic heartbeat when shutting down
heartbeat_handle.stop()
```

### TypeScript — Manual Heartbeat

```typescript
await client.heartbeat({
  agentId: registration.agentId,
  status: "healthy",
  latencyMs: 45.2,
  memoryUsageMb: 512.8,
  cpuUsagePercent: 23.5,
  activeSessions: 12,
  customMetrics: {
    queueDepth: 3,
    cacheHitRate: 0.89,
    pendingTasks: 7,
  },
});
```

### TypeScript — Automatic Heartbeat

```typescript
// Start automatic heartbeat every 60 seconds (default)
const heartbeatHandle = client.startHeartbeat({
  agentId: registration.agentId,
  intervalSeconds: 60,
  collectSystemMetrics: true,
});

// Update custom metrics dynamically
heartbeatHandle.updateCustomMetrics({
  queueDepth: 5,
  modelVersion: "v2.1",
});

// Stop the automatic heartbeat when shutting down
heartbeatHandle.stop();
```

---

## 7. Metrics Reporting

Report operational metrics to the AETHER platform for dashboards, alerting, and cost tracking.

### `report_metric` Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Metric name (e.g., `latency_ms`, `token_usage`) |
| `value` | `number` | Yes | Metric value |
| `unit` | `string` | No | Unit of measurement (e.g., `ms`, `count`, `percent`, `usd`) |
| `dimensions` | `object` | No | Key-value dimensions for grouping/filtering |

### Common Metrics

| Metric Name | Unit | Description |
|---|---|---|
| `latency_ms` | `ms` | End-to-end request processing time |
| `success_rate` | `percent` | Percentage of successful requests |
| `token_usage` | `count` | Total tokens consumed (input + output) |
| `cost_usd` | `usd` | Estimated cost per request or batch |
| `error_count` | `count` | Number of errors encountered |

### Python

```python
# Report a single metric
client.report_metric(
    agent_id=registration.agent_id,
    name="latency_ms",
    value=142.5,
    unit="ms",
    dimensions={
        "model": "gpt-4o",
        "endpoint": "/api/summarize",
        "region": "us-east-1"
    }
)

# Report multiple metrics at once (batch)
client.report_metrics(
    agent_id=registration.agent_id,
    metrics=[
        {"name": "latency_ms", "value": 142.5, "unit": "ms"},
        {"name": "token_usage", "value": 1580, "unit": "count"},
        {"name": "cost_usd", "value": 0.0237, "unit": "usd"},
        {"name": "success_rate", "value": 99.2, "unit": "percent"},
        {"name": "error_count", "value": 1, "unit": "count"}
    ],
    dimensions={"model": "gpt-4o", "environment": "production"}
)
```

### TypeScript

```typescript
// Report a single metric
await client.reportMetric({
  agentId: registration.agentId,
  name: "latency_ms",
  value: 142.5,
  unit: "ms",
  dimensions: {
    model: "gpt-4o",
    endpoint: "/api/summarize",
    region: "us-east-1",
  },
});

// Report multiple metrics at once (batch)
await client.reportMetrics({
  agentId: registration.agentId,
  metrics: [
    { name: "latency_ms", value: 142.5, unit: "ms" },
    { name: "token_usage", value: 1580, unit: "count" },
    { name: "cost_usd", value: 0.0237, unit: "usd" },
    { name: "success_rate", value: 99.2, unit: "percent" },
    { name: "error_count", value: 1, unit: "count" },
  ],
  dimensions: { model: "gpt-4o", environment: "production" },
});
```

---

## 8. Activity Logging

Log structured activity records for every significant action an agent performs. Activities are the foundation for audit trails, compliance reporting, and observability.

### `log_activity` Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `activity_type` | `enum` | Yes | Type of activity (see below) |
| `description` | `string` | Yes | Human-readable description of the activity |
| `input_summary` | `string` | No | Summary of input data (redact PII) |
| `output_summary` | `string` | No | Summary of output data (redact PII) |
| `tokens_used` | `int` | No | Total tokens consumed |
| `latency_ms` | `float` | No | Time taken to complete the activity (ms) |
| `was_successful` | `bool` | No | Whether the activity succeeded |
| `error_message` | `string` | No | Error message if the activity failed |
| `metadata` | `object` | No | Arbitrary key-value pairs |

### Activity Types

| Type | Description |
|---|---|
| `inference` | LLM inference or model prediction call |
| `tool_call` | Invocation of an external tool or function |
| `data_access` | Read or write to a database, file system, or data store |
| `api_call` | External HTTP/gRPC API call |
| `file_operation` | File read, write, upload, or download |
| `user_interaction` | Direct interaction with a human user |

### Python

```python
# Log a single activity
client.log_activity(
    agent_id=registration.agent_id,
    activity_type="inference",
    description="Generated financial reconciliation summary for Q2 2026",
    input_summary="Transaction records: 2,847 rows from SAP ERP",
    output_summary="Reconciliation report with 12 flagged discrepancies",
    tokens_used=3420,
    latency_ms=2150.0,
    was_successful=True,
    metadata={
        "model": "gpt-4o",
        "temperature": 0.1,
        "quarter": "Q2-2026"
    }
)

# Log a failed activity
client.log_activity(
    agent_id=registration.agent_id,
    activity_type="api_call",
    description="Attempted to fetch exchange rates from ECB API",
    input_summary="GET /rates/latest?base=USD",
    output_summary=None,
    latency_ms=5023.0,
    was_successful=False,
    error_message="ConnectionTimeout: ECB API did not respond within 5000ms"
)
```

### Python — Decorator for Automatic Logging

```python
from aether_sdk.decorators import log_activity

@log_activity(client, agent_id=registration.agent_id, activity_type="inference")
def summarize_document(document_text: str) -> str:
    """The decorator automatically logs input/output summaries,
    latency, success/failure, and token usage."""
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Summarize the following document."},
            {"role": "user", "content": document_text}
        ]
    )
    return response.choices[0].message.content

# The decorator intercepts the call and logs the activity automatically.
summary = summarize_document("This quarter's revenue grew 15%...")
```

### TypeScript

```typescript
// Log a single activity
await client.logActivity({
  agentId: registration.agentId,
  activityType: "inference",
  description: "Generated financial reconciliation summary for Q2 2026",
  inputSummary: "Transaction records: 2,847 rows from SAP ERP",
  outputSummary: "Reconciliation report with 12 flagged discrepancies",
  tokensUsed: 3420,
  latencyMs: 2150.0,
  wasSuccessful: true,
  metadata: {
    model: "gpt-4o",
    temperature: 0.1,
    quarter: "Q2-2026",
  },
});

// Log a failed activity
await client.logActivity({
  agentId: registration.agentId,
  activityType: "api_call",
  description: "Attempted to fetch exchange rates from ECB API",
  inputSummary: "GET /rates/latest?base=USD",
  latencyMs: 5023.0,
  wasSuccessful: false,
  errorMessage:
    "ConnectionTimeout: ECB API did not respond within 5000ms",
});
```

### TypeScript — Wrapper for Automatic Logging

```typescript
import { withActivityLogging } from "@aether-platform/sdk/middleware";

const summarizeDocument = withActivityLogging(
  client,
  {
    agentId: registration.agentId,
    activityType: "inference",
  },
  async (documentText: string): Promise<string> => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Summarize the following document." },
        { role: "user", content: documentText },
      ],
    });
    return response.choices[0].message.content!;
  }
);

// The wrapper intercepts the call and logs the activity automatically.
const summary = await summarizeDocument("This quarter's revenue grew 15%...");
```

---

## 9. Governance Signals

Governance signals allow agents to report sensitive operations, record auditable decisions, track tool usage, and request human approvals.

### 9.1 Report Data Access

```python
# Python
client.report_data_access(
    agent_id=registration.agent_id,
    data_source="SAP ERP — GL Accounts",
    access_type="read",
    records_accessed=2847,
    contains_pii=False,
    contains_financial=True,
    purpose="Monthly reconciliation for Q2 2026",
    retention_policy="90_days"
)
```

```typescript
// TypeScript
await client.reportDataAccess({
  agentId: registration.agentId,
  dataSource: "SAP ERP — GL Accounts",
  accessType: "read",
  recordsAccessed: 2847,
  containsPii: false,
  containsFinancial: true,
  purpose: "Monthly reconciliation for Q2 2026",
  retentionPolicy: "90_days",
});
```

### 9.2 Report Decision

```python
# Python
client.report_decision(
    agent_id=registration.agent_id,
    decision_type="classification",
    description="Classified 12 transactions as discrepancies requiring review",
    confidence=0.94,
    input_factors=["amount_mismatch", "date_variance", "vendor_inconsistency"],
    outcome="flagged_for_review",
    impact_level="high",
    reversible=True,
    explanation="Transactions exceeded 5% variance threshold on amount matching"
)
```

```typescript
// TypeScript
await client.reportDecision({
  agentId: registration.agentId,
  decisionType: "classification",
  description:
    "Classified 12 transactions as discrepancies requiring review",
  confidence: 0.94,
  inputFactors: [
    "amount_mismatch",
    "date_variance",
    "vendor_inconsistency",
  ],
  outcome: "flagged_for_review",
  impactLevel: "high",
  reversible: true,
  explanation:
    "Transactions exceeded 5% variance threshold on amount matching",
});
```

### 9.3 Report Tool Usage

```python
# Python
client.report_tool_usage(
    agent_id=registration.agent_id,
    tool_name="sql_query_executor",
    tool_version="1.3.0",
    input_parameters={"query": "SELECT * FROM gl_accounts WHERE period='Q2-2026'"},
    output_summary="Returned 2,847 rows in 340ms",
    was_successful=True,
    risk_level="medium",
    data_accessed=True
)
```

```typescript
// TypeScript
await client.reportToolUsage({
  agentId: registration.agentId,
  toolName: "sql_query_executor",
  toolVersion: "1.3.0",
  inputParameters: {
    query: "SELECT * FROM gl_accounts WHERE period='Q2-2026'",
  },
  outputSummary: "Returned 2,847 rows in 340ms",
  wasSuccessful: true,
  riskLevel: "medium",
  dataAccessed: true,
});
```

### 9.4 Request Approval

For high-impact operations, request human-in-the-loop approval before proceeding.

```python
# Python
approval = client.request_approval(
    agent_id=registration.agent_id,
    action="write_back_adjustments",
    description="Write 12 reconciliation adjustments totaling $47,230 to SAP ERP",
    risk_level="critical",
    impact_summary="Modifies GL account balances for Q2 2026",
    timeout_seconds=3600,       # Wait up to 1 hour for approval
    approvers=["cfo@contoso.com", "finance-leads@contoso.com"],
    context={
        "total_adjustments": 12,
        "total_amount_usd": 47230.00,
        "affected_accounts": ["4100", "4200", "5100"]
    }
)

if approval.status == "approved":
    print(f"Approved by {approval.approved_by} at {approval.approved_at}")
    # Proceed with the write-back
elif approval.status == "denied":
    print(f"Denied: {approval.denial_reason}")
elif approval.status == "timeout":
    print("Approval request timed out — escalating to fallback workflow")
```

```typescript
// TypeScript
const approval = await client.requestApproval({
  agentId: registration.agentId,
  action: "write_back_adjustments",
  description:
    "Write 12 reconciliation adjustments totaling $47,230 to SAP ERP",
  riskLevel: "critical",
  impactSummary: "Modifies GL account balances for Q2 2026",
  timeoutSeconds: 3600,
  approvers: ["cfo@contoso.com", "finance-leads@contoso.com"],
  context: {
    totalAdjustments: 12,
    totalAmountUsd: 47230.0,
    affectedAccounts: ["4100", "4200", "5100"],
  },
});

if (approval.status === "approved") {
  console.log(`Approved by ${approval.approvedBy} at ${approval.approvedAt}`);
} else if (approval.status === "denied") {
  console.log(`Denied: ${approval.denialReason}`);
} else if (approval.status === "timeout") {
  console.log("Approval request timed out — escalating to fallback workflow");
}
```

---

## 10. Event Subscription

Subscribe to real-time governance and operational events from the AETHER platform.

### Event Types

| Event Type | Description |
|---|---|
| `policy_updated` | An organizational policy affecting the agent has been modified |
| `risk_score_changed` | The agent's risk score has been recalculated |
| `compliance_alert` | A compliance violation or warning has been raised |
| `credential_rotation_required` | Agent credentials are expiring and must be rotated |

### Python

```python
from aether_sdk.events import EventType

def on_policy_update(event):
    print(f"Policy updated: {event.policy_name}")
    print(f"Changes: {event.changes}")
    # Reload agent configuration or adjust behavior
    reload_agent_config(event.policy_name)

def on_risk_change(event):
    print(f"Risk score changed: {event.previous_score} → {event.new_score}")
    if event.new_score > 0.8:
        # Activate additional safeguards
        enable_enhanced_monitoring()

def on_compliance_alert(event):
    print(f"Compliance alert [{event.severity}]: {event.message}")
    # Pause operations if critical
    if event.severity == "critical":
        pause_agent_operations()

def on_credential_rotation(event):
    print(f"Credential rotation required by {event.deadline}")
    rotate_credentials(event.new_credentials)

# Subscribe to events
client.subscribe(
    agent_id=registration.agent_id,
    event_types=[
        EventType.POLICY_UPDATED,
        EventType.RISK_SCORE_CHANGED,
        EventType.COMPLIANCE_ALERT,
        EventType.CREDENTIAL_ROTATION_REQUIRED
    ],
    callbacks={
        EventType.POLICY_UPDATED: on_policy_update,
        EventType.RISK_SCORE_CHANGED: on_risk_change,
        EventType.COMPLIANCE_ALERT: on_compliance_alert,
        EventType.CREDENTIAL_ROTATION_REQUIRED: on_credential_rotation
    }
)
```

### TypeScript

```typescript
import { EventType } from "@aether-platform/sdk/events";

client.subscribe({
  agentId: registration.agentId,
  eventTypes: [
    EventType.PolicyUpdated,
    EventType.RiskScoreChanged,
    EventType.ComplianceAlert,
    EventType.CredentialRotationRequired,
  ],
  callbacks: {
    [EventType.PolicyUpdated]: (event) => {
      console.log(`Policy updated: ${event.policyName}`);
      console.log(`Changes: ${JSON.stringify(event.changes)}`);
      reloadAgentConfig(event.policyName);
    },

    [EventType.RiskScoreChanged]: (event) => {
      console.log(
        `Risk score changed: ${event.previousScore} → ${event.newScore}`
      );
      if (event.newScore > 0.8) {
        enableEnhancedMonitoring();
      }
    },

    [EventType.ComplianceAlert]: (event) => {
      console.log(`Compliance alert [${event.severity}]: ${event.message}`);
      if (event.severity === "critical") {
        pauseAgentOperations();
      }
    },

    [EventType.CredentialRotationRequired]: (event) => {
      console.log(`Credential rotation required by ${event.deadline}`);
      rotateCredentials(event.newCredentials);
    },
  },
});
```

---

## 11. Error Handling

The SDK defines a hierarchy of typed errors for precise error handling and recovery strategies.

### Error Types

| Error Class (Python) | Error Class (TypeScript) | HTTP Status | Description |
|---|---|---|---|
| `AetherConnectionError` | `AetherConnectionError` | — | Network connectivity failure |
| `AetherAuthenticationError` | `AetherAuthenticationError` | `401`, `403` | Invalid or expired credentials |
| `AetherValidationError` | `AetherValidationError` | `400`, `422` | Invalid request payload |
| `AetherRateLimitError` | `AetherRateLimitError` | `429` | Rate limit exceeded |
| `AetherServerError` | `AetherServerError` | `500`, `502`, `503` | Server-side failure |

### Python — Error Handling

```python
from aether_sdk.exceptions import (
    AetherConnectionError,
    AetherAuthenticationError,
    AetherValidationError,
    AetherRateLimitError,
    AetherServerError
)

try:
    client.heartbeat(
        agent_id=registration.agent_id,
        status="healthy",
        latency_ms=50.0
    )
except AetherConnectionError as e:
    print(f"Connection failed: {e.message}")
    print(f"Retry after: {e.retry_after_seconds}s")
    # SDK will auto-retry based on retry_count config

except AetherAuthenticationError as e:
    print(f"Authentication error: {e.message}")
    print(f"Error code: {e.error_code}")
    # Refresh credentials or re-authenticate
    client.refresh_credentials()

except AetherValidationError as e:
    print(f"Validation error: {e.message}")
    print(f"Invalid fields: {e.field_errors}")
    # Fix the payload and retry

except AetherRateLimitError as e:
    print(f"Rate limited: {e.message}")
    print(f"Retry after: {e.retry_after_seconds}s")
    print(f"Limit: {e.rate_limit} requests per {e.rate_limit_window}")
    # Wait and retry — SDK handles this automatically with backoff

except AetherServerError as e:
    print(f"Server error [{e.status_code}]: {e.message}")
    print(f"Request ID: {e.request_id}")
    # Contact support with request_id for debugging
```

### TypeScript — Error Handling

```typescript
import {
  AetherConnectionError,
  AetherAuthenticationError,
  AetherValidationError,
  AetherRateLimitError,
  AetherServerError,
} from "@aether-platform/sdk/errors";

try {
  await client.heartbeat({
    agentId: registration.agentId,
    status: "healthy",
    latencyMs: 50.0,
  });
} catch (error) {
  if (error instanceof AetherConnectionError) {
    console.error(`Connection failed: ${error.message}`);
    console.error(`Retry after: ${error.retryAfterSeconds}s`);
  } else if (error instanceof AetherAuthenticationError) {
    console.error(`Auth error: ${error.message}`);
    await client.refreshCredentials();
  } else if (error instanceof AetherValidationError) {
    console.error(`Validation error: ${error.message}`);
    console.error(`Invalid fields:`, error.fieldErrors);
  } else if (error instanceof AetherRateLimitError) {
    console.error(`Rate limited — retry after ${error.retryAfterSeconds}s`);
  } else if (error instanceof AetherServerError) {
    console.error(`Server error [${error.statusCode}]: ${error.message}`);
    console.error(`Request ID: ${error.requestId}`);
  } else {
    throw error;
  }
}
```

### Retry Strategy Configuration

```python
# Python — Custom retry strategy
from aether_sdk.retry import RetryStrategy, CircuitBreaker

client = AetherClient(
    api_url="https://api.aether.example.com",
    api_key="aether_sk_live_abc123...",
    tenant_id="tenant-contoso-prod",
    retry_strategy=RetryStrategy(
        max_retries=5,
        initial_delay=0.5,          # seconds
        max_delay=30.0,             # seconds
        backoff_multiplier=2.0,     # exponential backoff
        retryable_errors=[
            AetherConnectionError,
            AetherRateLimitError,
            AetherServerError
        ]
    ),
    circuit_breaker=CircuitBreaker(
        failure_threshold=5,        # open circuit after 5 consecutive failures
        recovery_timeout=60.0,      # attempt recovery after 60 seconds
        half_open_max_calls=2       # allow 2 test calls in half-open state
    )
)
```

```typescript
// TypeScript — Custom retry strategy
import { RetryStrategy, CircuitBreaker } from "@aether-platform/sdk/retry";

const client = new AetherClient({
  apiUrl: "https://api.aether.example.com",
  apiKey: "aether_sk_live_abc123...",
  tenantId: "tenant-contoso-prod",
  retryStrategy: new RetryStrategy({
    maxRetries: 5,
    initialDelay: 0.5,
    maxDelay: 30.0,
    backoffMultiplier: 2.0,
    retryableErrors: [
      AetherConnectionError,
      AetherRateLimitError,
      AetherServerError,
    ],
  }),
  circuitBreaker: new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60.0,
    halfOpenMaxCalls: 2,
  }),
});
```

---

## 12. Configuration Reference

Complete table of all SDK configuration options:

| Python Name | TypeScript Name | Type | Default | Description |
|---|---|---|---|---|
| `api_url` | `apiUrl` | `string` | `env:AETHER_API_URL` | Base URL of the AETHER platform API |
| `api_key` | `apiKey` | `string` | `env:AETHER_API_KEY` | API key for authentication |
| `tenant_id` | `tenantId` | `string` | `env:AETHER_TENANT_ID` | Organization tenant identifier |
| `auth_provider` | `authProvider` | `AuthProvider` | `None` / `undefined` | OAuth / Entra ID authentication provider |
| `timeout` | `timeout` | `int` / `number` | `30` | Request timeout in seconds |
| `retry_count` | `retryCount` | `int` / `number` | `3` | Maximum number of retry attempts |
| `retry_delay` | `retryDelay` | `float` / `number` | `1.0` | Initial delay between retries (seconds) |
| `retry_strategy` | `retryStrategy` | `RetryStrategy` | Auto-configured | Custom retry strategy object |
| `circuit_breaker` | `circuitBreaker` | `CircuitBreaker` | `None` / `undefined` | Circuit breaker configuration |
| `enable_batch` | `enableBatch` | `bool` / `boolean` | `false` | Enable batched reporting |
| `batch_size` | `batchSize` | `int` / `number` | `50` | Maximum items per batch flush |
| `batch_interval_ms` | `batchIntervalMs` | `int` / `number` | `5000` | Milliseconds between batch flushes |
| `log_level` | `logLevel` | `string` | `"info"` | SDK log level: `debug`, `info`, `warn`, `error` |
| `http_proxy` | `httpProxy` | `string` | `None` / `undefined` | HTTP proxy URL |
| `ssl_verify` | `sslVerify` | `bool` / `boolean` | `true` | Verify SSL certificates |
| `custom_headers` | `customHeaders` | `dict` / `Record<string, string>` | `{}` | Additional HTTP headers for every request |
| `user_agent_suffix` | `userAgentSuffix` | `string` | `""` | Appended to the default `User-Agent` header |

---

## 13. Complete Examples

### Example 1: Microsoft Copilot Studio Agent

Register and monitor a Microsoft Copilot Studio agent deployed in Azure.

```python
# copilot_agent_monitor.py
from aether_sdk import AetherClient
from aether_sdk.events import EventType

# Initialize the client
client = AetherClient.from_config("~/.aether/config.yaml")

# Register the Copilot Studio agent
registration = client.register_agent(
    name="hr-onboarding-copilot",
    description="Copilot Studio agent for employee onboarding workflows",
    owner="hr-digital@contoso.com",
    department="Human Resources",
    platform="copilot_studio",
    environment="production",
    endpoint_url="https://copilot.contoso.com/hr-onboarding",
    region="westeurope",
    runtime="copilot-studio-runtime",
    version="3.0.1",
    monitoring_method="sdk_push",
    tags=["hr", "onboarding", "copilot", "production"],
    metadata={
        "azure_resource_group": "rg-hr-copilots-prod",
        "copilot_id": "cpt-hr-onboard-001",
        "power_platform_env": "contoso-prod"
    },
    capabilities=["chat", "form_filling", "document_generation", "workflow_trigger"],
    data_access=True,
    pii_access=True,
    financial_access=False,
    external_access=True
)

print(f"Registered Copilot agent: {registration.agent_id}")

# Start automatic heartbeat
heartbeat = client.start_heartbeat(
    agent_id=registration.agent_id,
    interval_seconds=60,
    collect_system_metrics=True
)

# Subscribe to governance events
client.subscribe(
    agent_id=registration.agent_id,
    event_types=[EventType.POLICY_UPDATED, EventType.COMPLIANCE_ALERT],
    callbacks={
        EventType.POLICY_UPDATED: lambda e: print(f"Policy updated: {e.policy_name}"),
        EventType.COMPLIANCE_ALERT: lambda e: print(f"Alert: {e.message}")
    }
)

# Report a user interaction activity
client.log_activity(
    agent_id=registration.agent_id,
    activity_type="user_interaction",
    description="Guided new hire through benefits enrollment form",
    input_summary="User selected: Health Plan A, Dental Plan B, 401k 6%",
    output_summary="Generated enrollment confirmation PDF and submitted to BenefitConnect",
    tokens_used=850,
    latency_ms=3200.0,
    was_successful=True,
    metadata={"interaction_channel": "teams", "user_department": "engineering"}
)

# Report PII governance signal
client.report_data_access(
    agent_id=registration.agent_id,
    data_source="Azure AD — Employee Records",
    access_type="read",
    records_accessed=1,
    contains_pii=True,
    contains_financial=False,
    purpose="Retrieve new hire profile for onboarding workflow",
    retention_policy="30_days"
)

print("Copilot agent monitoring active.")
```

---

### Example 2: Custom Python Agent

A complete, production-ready Python agent with registration, heartbeat, activity logging, metrics, governance signals, error handling, and graceful shutdown.

```python
# custom_agent.py
import signal
import sys
import time
from aether_sdk import AetherClient
from aether_sdk.exceptions import (
    AetherConnectionError,
    AetherAuthenticationError,
    AetherRateLimitError,
    AetherServerError
)
from aether_sdk.retry import RetryStrategy, CircuitBreaker
from aether_sdk.decorators import log_activity

# --- Initialize client with production-grade configuration ---
client = AetherClient(
    api_url="https://api.aether.example.com",
    api_key="aether_sk_live_abc123...",
    tenant_id="tenant-contoso-prod",
    timeout=30,
    retry_strategy=RetryStrategy(
        max_retries=5,
        initial_delay=0.5,
        max_delay=30.0,
        backoff_multiplier=2.0
    ),
    circuit_breaker=CircuitBreaker(
        failure_threshold=5,
        recovery_timeout=60.0
    ),
    enable_batch=True,
    batch_size=100,
    batch_interval_ms=3000
)

# --- Register the agent ---
registration = client.register_agent(
    name="data-quality-analyzer",
    description="Analyzes data quality across enterprise data lakes",
    owner="data-platform@contoso.com",
    department="Data Engineering",
    platform="custom",
    environment="production",
    region="us-east-1",
    runtime="python-3.11",
    version="1.5.0",
    tags=["data-quality", "analytics", "production"],
    capabilities=["data_analysis", "anomaly_detection", "report_generation"],
    data_access=True,
    pii_access=True,
    financial_access=False,
    external_access=False
)

agent_id = registration.agent_id
print(f"Agent registered: {agent_id}")

# --- Start automatic heartbeat ---
heartbeat = client.start_heartbeat(
    agent_id=agent_id,
    interval_seconds=60,
    collect_system_metrics=True
)

# --- Define instrumented functions ---
@log_activity(client, agent_id=agent_id, activity_type="data_access")
def load_dataset(source: str, query: str) -> dict:
    """Load data from warehouse with automatic activity logging."""
    # Simulate data loading
    time.sleep(0.5)
    return {"rows": 10000, "columns": 45, "source": source}

@log_activity(client, agent_id=agent_id, activity_type="inference")
def analyze_quality(dataset: dict) -> dict:
    """Run data quality analysis with automatic activity logging."""
    # Simulate analysis
    time.sleep(1.0)
    return {
        "completeness_score": 0.94,
        "accuracy_score": 0.97,
        "consistency_score": 0.91,
        "anomalies_detected": 23
    }

# --- Main processing loop ---
def run_analysis_cycle():
    try:
        # Step 1: Load data
        dataset = load_dataset(
            source="snowflake://warehouse/analytics.customer_data",
            query="SELECT * FROM customer_data WHERE updated_at > CURRENT_DATE - 1"
        )

        # Step 2: Report data access governance signal
        client.report_data_access(
            agent_id=agent_id,
            data_source="Snowflake — analytics.customer_data",
            access_type="read",
            records_accessed=dataset["rows"],
            contains_pii=True,
            contains_financial=False,
            purpose="Daily data quality analysis"
        )

        # Step 3: Analyze quality
        results = analyze_quality(dataset)

        # Step 4: Report decision
        client.report_decision(
            agent_id=agent_id,
            decision_type="assessment",
            description=f"Data quality assessment: {results['anomalies_detected']} anomalies detected",
            confidence=0.92,
            input_factors=["completeness", "accuracy", "consistency"],
            outcome="anomalies_flagged",
            impact_level="medium",
            reversible=True
        )

        # Step 5: Report metrics
        client.report_metrics(
            agent_id=agent_id,
            metrics=[
                {"name": "completeness_score", "value": results["completeness_score"], "unit": "percent"},
                {"name": "accuracy_score", "value": results["accuracy_score"], "unit": "percent"},
                {"name": "anomalies_detected", "value": results["anomalies_detected"], "unit": "count"}
            ]
        )

        print(f"Analysis complete: {results['anomalies_detected']} anomalies detected")

    except AetherConnectionError as e:
        print(f"AETHER connection issue (non-fatal): {e.message}")
    except AetherRateLimitError as e:
        print(f"Rate limited, backing off for {e.retry_after_seconds}s")
        time.sleep(e.retry_after_seconds)
    except AetherServerError as e:
        print(f"AETHER server error (request_id={e.request_id}): {e.message}")
    except Exception as e:
        client.log_activity(
            agent_id=agent_id,
            activity_type="inference",
            description="Analysis cycle failed with unexpected error",
            was_successful=False,
            error_message=str(e)
        )
        raise

# --- Graceful shutdown ---
def shutdown(signum, frame):
    print("\nShutting down gracefully...")
    heartbeat.stop()
    client.flush()          # Flush any batched metrics/activities
    client.close()          # Close connections
    print("Shutdown complete.")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

# --- Run ---
if __name__ == "__main__":
    print("Starting data quality analysis agent...")
    while True:
        run_analysis_cycle()
        time.sleep(3600)  # Run hourly
```

---

### Example 3: LangGraph Agent Integration

Integrate the AETHER SDK with a LangGraph agent for node-level observability, token tracking, and governance.

```python
# langgraph_agent.py
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
import operator
from aether_sdk import AetherClient
from aether_sdk.integrations.langgraph import AetherNodeWrapper

# --- Initialize AETHER client ---
client = AetherClient()

registration = client.register_agent(
    name="research-assistant-langgraph",
    description="Multi-step research assistant built with LangGraph",
    platform="langgraph",
    environment="production",
    runtime="python-3.11",
    version="1.0.0",
    tags=["research", "langgraph", "multi-step"],
    capabilities=["research", "summarization", "fact_checking"],
    data_access=True,
    pii_access=False,
    external_access=True
)

agent_id = registration.agent_id

# Start heartbeat
heartbeat = client.start_heartbeat(agent_id=agent_id, interval_seconds=60)

# --- Define graph state ---
class ResearchState(TypedDict):
    query: str
    search_results: list[str]
    analysis: str
    summary: str
    total_tokens: Annotated[int, operator.add]

# --- Initialize LLM ---
llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

# --- Wrap LangGraph nodes with AETHER observability ---
aether_wrap = AetherNodeWrapper(client, agent_id)

@aether_wrap.node(activity_type="tool_call", name="search")
def search_node(state: ResearchState) -> dict:
    """Search for information — wrapped with AETHER activity logging."""
    # Simulate search
    results = [
        "Result 1: Key findings on the topic...",
        "Result 2: Supporting data from research paper...",
        "Result 3: Expert analysis suggests..."
    ]
    client.report_tool_usage(
        agent_id=agent_id,
        tool_name="web_search",
        tool_version="2.0",
        input_parameters={"query": state["query"]},
        output_summary=f"Found {len(results)} results",
        was_successful=True,
        risk_level="low"
    )
    return {"search_results": results, "total_tokens": 0}

@aether_wrap.node(activity_type="inference", name="analyze")
def analyze_node(state: ResearchState) -> dict:
    """Analyze search results — wrapped with AETHER activity logging."""
    response = llm.invoke(
        f"Analyze these research results for the query '{state['query']}':\n"
        + "\n".join(state["search_results"])
    )
    tokens = response.response_metadata.get("token_usage", {})
    total = tokens.get("total_tokens", 0)

    # Report token metrics
    client.report_metric(
        agent_id=agent_id,
        name="token_usage",
        value=total,
        unit="count",
        dimensions={"node": "analyze", "model": "gpt-4o"}
    )

    return {"analysis": response.content, "total_tokens": total}

@aether_wrap.node(activity_type="inference", name="summarize")
def summarize_node(state: ResearchState) -> dict:
    """Summarize findings — wrapped with AETHER activity logging."""
    response = llm.invoke(f"Summarize this analysis:\n{state['analysis']}")
    tokens = response.response_metadata.get("token_usage", {})
    total = tokens.get("total_tokens", 0)

    # Report decision governance signal
    client.report_decision(
        agent_id=agent_id,
        decision_type="synthesis",
        description="Generated research summary from analyzed sources",
        confidence=0.88,
        input_factors=["search_results", "analysis"],
        outcome="summary_generated",
        impact_level="low",
        reversible=True
    )

    return {"summary": response.content, "total_tokens": total}

# --- Build the graph ---
graph = StateGraph(ResearchState)
graph.add_node("search", search_node)
graph.add_node("analyze", analyze_node)
graph.add_node("summarize", summarize_node)

graph.set_entry_point("search")
graph.add_edge("search", "analyze")
graph.add_edge("analyze", "summarize")
graph.add_edge("summarize", END)

app = graph.compile()

# --- Run the agent ---
result = app.invoke({"query": "Impact of generative AI on enterprise productivity", "total_tokens": 0})
print(f"Summary: {result['summary']}")
print(f"Total tokens used: {result['total_tokens']}")

# Report final metrics
client.report_metrics(
    agent_id=agent_id,
    metrics=[
        {"name": "total_tokens", "value": result["total_tokens"], "unit": "count"},
        {"name": "cost_usd", "value": result["total_tokens"] * 0.000015, "unit": "usd"}
    ]
)
```

---

### Example 4: FastAPI Integration

Use the AETHER SDK as FastAPI middleware for automatic activity logging on every endpoint.

```python
# fastapi_integration.py
from fastapi import FastAPI, Request, Response
from aether_sdk import AetherClient
from aether_sdk.integrations.fastapi import AetherMiddleware
import time
import uvicorn

# --- Initialize AETHER client ---
client = AetherClient()

registration = client.register_agent(
    name="document-processing-api",
    description="FastAPI service for AI-powered document processing",
    platform="custom",
    environment="production",
    endpoint_url="https://api.contoso.com/doc-processor",
    runtime="python-3.11",
    version="2.0.0",
    tags=["api", "document-processing", "fastapi"],
    capabilities=["document_parsing", "summarization", "entity_extraction"],
    data_access=True,
    pii_access=True,
    external_access=False
)

agent_id = registration.agent_id

# --- Create FastAPI app ---
app = FastAPI(title="Document Processing API", version="2.0.0")

# --- Add AETHER middleware ---
# This automatically logs every request as an activity
app.add_middleware(
    AetherMiddleware,
    client=client,
    agent_id=agent_id,
    activity_type="api_call",
    exclude_paths=["/health", "/metrics"],  # Skip health checks
    log_request_body=False,                 # Don't log bodies (PII safety)
    log_response_summary=True               # Log response metadata
)

# --- Start heartbeat ---
heartbeat = client.start_heartbeat(
    agent_id=agent_id,
    interval_seconds=30,
    collect_system_metrics=True
)

@app.post("/api/v1/summarize")
async def summarize_document(request: Request):
    """Summarize an uploaded document."""
    body = await request.json()
    start = time.time()

    # Simulate document summarization
    summary = "This document discusses quarterly financial performance..."
    tokens_used = 1200
    latency_ms = (time.time() - start) * 1000

    # Report metrics
    client.report_metrics(
        agent_id=agent_id,
        metrics=[
            {"name": "latency_ms", "value": latency_ms, "unit": "ms"},
            {"name": "token_usage", "value": tokens_used, "unit": "count"},
            {"name": "cost_usd", "value": tokens_used * 0.000015, "unit": "usd"}
        ],
        dimensions={"endpoint": "/api/v1/summarize"}
    )

    # Report data access governance signal
    client.report_data_access(
        agent_id=agent_id,
        data_source="user_upload",
        access_type="read",
        records_accessed=1,
        contains_pii=False,
        purpose="Document summarization"
    )

    return {"summary": summary, "tokens_used": tokens_used}

@app.post("/api/v1/extract-entities")
async def extract_entities(request: Request):
    """Extract named entities from a document."""
    body = await request.json()

    entities = [
        {"text": "Contoso Inc.", "type": "ORG", "confidence": 0.98},
        {"text": "$4.2M", "type": "MONEY", "confidence": 0.95},
        {"text": "Q2 2026", "type": "DATE", "confidence": 0.99}
    ]

    # Report decision
    client.report_decision(
        agent_id=agent_id,
        decision_type="extraction",
        description=f"Extracted {len(entities)} entities from uploaded document",
        confidence=0.97,
        input_factors=["document_text"],
        outcome="entities_extracted",
        impact_level="low",
        reversible=True
    )

    return {"entities": entities, "count": len(entities)}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent_id": agent_id}

@app.on_event("shutdown")
async def shutdown_event():
    """Graceful shutdown: stop heartbeat and flush pending data."""
    heartbeat.stop()
    client.flush()
    client.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 14. API Reference Summary

Quick-reference table of all SDK methods:

| Method | Python Signature | TypeScript Signature | Description |
|---|---|---|---|
| **register_agent** | `register_agent(name, *, description, owner, department, platform, environment, endpoint_url, region, runtime, version, monitoring_method, tags, metadata, capabilities, data_access, pii_access, financial_access, external_access) → Registration` | `registerAgent(options: RegisterAgentOptions): Promise<Registration>` | Register an agent with the platform |
| **heartbeat** | `heartbeat(agent_id, *, status, latency_ms, memory_usage_mb, cpu_usage_percent, active_sessions, custom_metrics) → None` | `heartbeat(options: HeartbeatOptions): Promise<void>` | Send a single health heartbeat |
| **start_heartbeat** | `start_heartbeat(agent_id, *, interval_seconds, collect_system_metrics) → HeartbeatHandle` | `startHeartbeat(options: StartHeartbeatOptions): HeartbeatHandle` | Start automatic periodic heartbeats |
| **report_metric** | `report_metric(agent_id, name, value, *, unit, dimensions) → None` | `reportMetric(options: ReportMetricOptions): Promise<void>` | Report a single metric |
| **report_metrics** | `report_metrics(agent_id, metrics, *, dimensions) → None` | `reportMetrics(options: ReportMetricsOptions): Promise<void>` | Report multiple metrics (batch) |
| **log_activity** | `log_activity(agent_id, activity_type, description, *, input_summary, output_summary, tokens_used, latency_ms, was_successful, error_message, metadata) → None` | `logActivity(options: LogActivityOptions): Promise<void>` | Log a structured activity record |
| **report_data_access** | `report_data_access(agent_id, data_source, access_type, *, records_accessed, contains_pii, contains_financial, purpose, retention_policy) → None` | `reportDataAccess(options: ReportDataAccessOptions): Promise<void>` | Report a data access governance event |
| **report_decision** | `report_decision(agent_id, decision_type, description, *, confidence, input_factors, outcome, impact_level, reversible, explanation) → None` | `reportDecision(options: ReportDecisionOptions): Promise<void>` | Report an auditable AI decision |
| **report_tool_usage** | `report_tool_usage(agent_id, tool_name, *, tool_version, input_parameters, output_summary, was_successful, risk_level, data_accessed) → None` | `reportToolUsage(options: ReportToolUsageOptions): Promise<void>` | Report tool/function invocation |
| **request_approval** | `request_approval(agent_id, action, description, *, risk_level, impact_summary, timeout_seconds, approvers, context) → ApprovalResult` | `requestApproval(options: RequestApprovalOptions): Promise<ApprovalResult>` | Request human-in-the-loop approval |
| **subscribe** | `subscribe(agent_id, event_types, callbacks) → Subscription` | `subscribe(options: SubscribeOptions): Subscription` | Subscribe to platform events |
| **flush** | `flush() → None` | `flush(): Promise<void>` | Flush all batched metrics and activities |
| **close** | `close() → None` | `close(): Promise<void>` | Close all connections and free resources |
| **refresh_credentials** | `refresh_credentials() → None` | `refreshCredentials(): Promise<void>` | Refresh authentication credentials |
| **from_config** | `AetherClient.from_config(path) → AetherClient` | `AetherClient.fromConfig(path): Promise<AetherClient>` | Create client from a config file |

---

> **Need help?** Reach the AETHER platform team at [platform-support@contoso.com](mailto:platform-support@contoso.com) or file an issue in the internal `aether-sdk` repository.
