# AETHER Platform — Unified Agent Onboarding Guide

> **Classification:** Technical Reference Manual  
> **Target Audience:** IT Administrators, Platform Engineers, Security Architects  
> **Status:** Release Specification (v3.0.0)

This guide provides step-by-step instructions and programmatic payloads to onboard AI workers from all **12 supported platform connectors** in the AETHER system.

---

## 1. Connector Reference Table

AETHER maps every onboarded agent to its runtime connector, determining the authentication flow, API integration scope, and monitoring method.

| Connector ID | Display Name | Connector Category | Target API Endpoint / Domain | Auth Method | Default Monitoring Method | required Scopes / Roles |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ms-copilot` | Microsoft Copilot | Microsoft | `https://graph.microsoft.com/v1.0` | OAuth 2.0 / Entra ID | `api-poll` | `User.Read.All`, `AuditLog.Read.All` |
| `ms-copilot-studio` | Copilot Studio | Microsoft | `https://api.powerplatform.com/v1` | OAuth 2.0 / Entra ID | `api-poll` | `Environment.Read`, `Bot.Read.All` |
| `azure-ai-foundry` | Azure AI Foundry | Microsoft | `https://management.azure.com/...` | Azure Managed Identity / SPN | `api-poll` | `Reader`, `Contributor` |
| `ms-entra-id` | Microsoft Entra ID | Microsoft | `https://graph.microsoft.com/v1.0/identity` | OAuth 2.0 Client Credentials | `api-poll` | `Directory.Read.All`, `Application.Read.All` |
| `openai-assistants` | OpenAI Assistants | OpenAI | `https://api.openai.com/v1` | API Key / Bearer Token | `api-poll` | `assistants.read`, `runs.read` |
| `azure-openai` | Azure OpenAI | Microsoft | `https://{resource}.openai.azure.com` | Managed Identity / API Key | `api-poll` | `Cognitive Services OpenAI User` |
| `langgraph` | LangGraph | Open Source | `https://api.smith.langchain.com/v1` | API Key | `sdk-push` | `runs.read`, `traces.read` |
| `crewai` | CrewAI | Open Source | `https://api.crewai.com/v1` | API Key | `sdk-push` | `crews.read`, `tasks.read` |
| `salesforce-agentforce`| Salesforce Agentforce | Salesforce | `https://{domain}.my.salesforce.com` | OAuth 2.0 / JWT Bearer | `webhook` | `api`, `einstein_analytics` |
| `databricks` | Databricks Agents | Databricks | `https://{workspace}.cloud.databricks.com` | Service Principal / PAT | `api-poll` | `workspace.read`, `serving-endpoints.read` |
| `snowflake-cortex` | Snowflake Cortex | Snowflake | `https://{account}.snowflakecomputing.com` | Key Pair / OAuth | `api-poll` | `CORTEX_USER`, `DATA_READER` |
| `custom-agents` | Custom Enterprise Agents| Custom / SDK | `https://aether-api.contoso.com` | AETHER SDK / API Key | `sdk-push` | `agent.register`, `agent.heartbeat` |

---

## 2. Onboarding Steps for All 12 Connectors

### 1. Microsoft Copilot (`ms-copilot`)
Used for generic Microsoft Copilots deployed across Microsoft 365, SharePoint, or Teams.
* **Endpoint URL:** `https://graph.microsoft.com/v1.0/users/{user-id}/chats`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "M365 Legal Assistant",
    "platform": "Microsoft Copilot",
    "department": "Legal",
    "owner": "Sarah Chen",
    "endpoint": "https://graph.microsoft.com/v1.0/users/legal-bot-id/chats",
    "monthlyCost": 150.00,
    "tasksExecuted": 540,
    "monitoringMethod": "api-poll",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

### 2. Copilot Studio (`ms-copilot-studio`)
Used for customized conversational agents built inside the Microsoft Copilot Studio authoring environment.
* **Endpoint URL:** `https://api.powerplatform.com/v1/environments/{env-id}/bots/{bot-id}`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "HR Benefits Copilot",
    "platform": "Copilot Studio",
    "department": "HR",
    "owner": "Marcus Aurelius",
    "endpoint": "https://api.powerplatform.com/v1/environments/prod-env-123/bots/hr-bot-456",
    "monthlyCost": 250.00,
    "tasksExecuted": 1420,
    "monitoringMethod": "api-poll",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

### 3. Azure AI Foundry (`azure-ai-foundry`)
For agents built, hosted, and managed using Azure's AI Foundry dashboard.
* **Endpoint URL:** `https://management.azure.com/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.MachineLearningServices/workspaces/{ws}`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Azure Support Classifier",
    "platform": "Azure AI Foundry",
    "department": "Customer Success",
    "owner": "Sarah Chen",
    "endpoint": "https://management.azure.com/subscriptions/sub-999/resourceGroups/ai-rg/providers/Microsoft.MachineLearningServices/workspaces/support-ws",
    "monthlyCost": 480.00,
    "tasksExecuted": 8900,
    "monitoringMethod": "api-poll",
    "piiAccess": false,
    "financialAccess": false
  }
  ```

### 4. Microsoft Entra ID (`ms-entra-id`)
For identity synchronization agents and autonomous directory access accounts running in Azure.
* **Endpoint URL:** `https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Entra ID Credential Rotator",
    "platform": "Microsoft Entra ID",
    "department": "Security",
    "owner": "Manish Kapoor",
    "endpoint": "https://graph.microsoft.com/v1.0/identity/credential-rotator-agent",
    "monthlyCost": 120.00,
    "tasksExecuted": 250,
    "monitoringMethod": "api-poll",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

### 5. OpenAI Assistants (`openai-assistants`)
For custom agents built using the OpenAI Assistants API (v1 or v2).
* **Endpoint URL:** `https://api.openai.com/v1/assistants/{assistant-id}`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Product Recommendation Assistant",
    "platform": "OpenAI",
    "department": "Marketing",
    "owner": "Elena Rostova",
    "endpoint": "https://api.openai.com/v1/assistants/asst_xyz123abc",
    "monthlyCost": 350.00,
    "tasksExecuted": 6800,
    "monitoringMethod": "api-poll",
    "piiAccess": false,
    "financialAccess": false
  }
  ```

### 6. Azure OpenAI (`azure-openai`)
For enterprise deployments accessing OpenAI models via secure Azure endpoints.
* **Endpoint URL:** `https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Azure Summarization Model",
    "platform": "Azure OpenAI",
    "department": "Engineering",
    "owner": "Sarah Chen",
    "endpoint": "https://aether-openai-eastus.openai.azure.com/openai/deployments/gpt-4o-summarizer",
    "monthlyCost": 950.00,
    "tasksExecuted": 12500,
    "monitoringMethod": "api-poll",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

### 7. LangGraph (`langgraph`)
For stateful, multi-agent workflows running on LangGraph Cloud or locally.
* **Endpoint URL:** `https://api.smith.langchain.com/v1/projects/{project-id}`
* **Default Monitoring:** `sdk-push`
* **JSON API Payload:**
  ```json
  {
    "name": "Software Engineer Graph",
    "platform": "LangGraph",
    "department": "Engineering",
    "owner": "Alex Mercer",
    "endpoint": "https://api.smith.langchain.com/v1/projects/langgraph-eng-project",
    "monthlyCost": 150.00,
    "tasksExecuted": 850,
    "monitoringMethod": "sdk-push",
    "piiAccess": false,
    "financialAccess": false
  }
  ```

### 8. CrewAI (`crewai`)
For cooperative multi-agent crews executing sequential or hierarchical tasks.
* **Endpoint URL:** `https://api.crewai.com/v1/crews/{crew-id}`
* **Default Monitoring:** `sdk-push`
* **JSON API Payload:**
  ```json
  {
    "name": "Market Analysis Crew",
    "platform": "CrewAI",
    "department": "Marketing",
    "owner": "Lisa Williams",
    "endpoint": "https://api.crewai.com/v1/crews/crew-market-101",
    "monthlyCost": 180.00,
    "tasksExecuted": 400,
    "monitoringMethod": "sdk-push",
    "piiAccess": false,
    "financialAccess": false
  }
  ```

### 9. Salesforce Agentforce (`salesforce-agentforce`)
For Einstein-powered transactional agents running inside Salesforce CRM.
* **Endpoint URL:** `https://{subdomain}.my.salesforce.com/services/data/v62.0`
* **Default Monitoring:** `webhook`
* **JSON API Payload:**
  ```json
  {
    "name": "Sales Lead Qualifier",
    "platform": "Salesforce Agentforce",
    "department": "Sales",
    "owner": "Lisa Williams",
    "endpoint": "https://contoso.my.salesforce.com/services/data/v62.0",
    "monthlyCost": 300.00,
    "tasksExecuted": 2500,
    "monitoringMethod": "webhook",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

### 10. Databricks Agents (`databricks`)
For data analytics and machine learning retrieval agents hosted on Databricks serving endpoints.
* **Endpoint URL:** `https://{workspace-id}.cloud.databricks.com/api/2.0/serving-endpoints/{endpoint-name}`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Warehouse Inventory Analyst",
    "platform": "Databricks",
    "department": "Operations",
    "owner": "David Miller",
    "endpoint": "https://dbc-1234abcd-1234.cloud.databricks.com/api/2.0/serving-endpoints/inventory-endpoint",
    "monthlyCost": 550.00,
    "tasksExecuted": 3120,
    "monitoringMethod": "api-poll",
    "piiAccess": false,
    "financialAccess": false
  }
  ```

### 11. Snowflake Cortex (`snowflake-cortex`)
For database agents accessing LLMs and search functions natively inside Snowflake.
* **Endpoint URL:** `https://{account-id}.snowflakecomputing.com/api/v2`
* **Default Monitoring:** `api-poll`
* **JSON API Payload:**
  ```json
  {
    "name": "Financial Fraud Detector",
    "platform": "Snowflake Cortex",
    "department": "Finance",
    "owner": "David Miller",
    "endpoint": "https://contoso.snowflakecomputing.com/api/v2",
    "monthlyCost": 450.00,
    "tasksExecuted": 5200,
    "monitoringMethod": "api-poll",
    "piiAccess": true,
    "financialAccess": true
  }
  ```

### 12. Custom Enterprise Agents (`custom-agents`)
For custom in-house Python, Node, or Go agents utilizing the AETHER Monitoring SDK.
* **Endpoint URL:** `https://{your-internal-domain}/api/v1/agents/{agent-name}`
* **Default Monitoring:** `sdk-push`
* **JSON API Payload:**
  ```json
  {
    "name": "Enterprise Document Searcher",
    "platform": "Custom Agents",
    "department": "Engineering",
    "owner": "Alex Mercer",
    "endpoint": "https://document-search.internal.contoso.com/api/v1/probe",
    "monthlyCost": 80.00,
    "tasksExecuted": 150,
    "monitoringMethod": "sdk-push",
    "piiAccess": true,
    "financialAccess": false
  }
  ```

---

## 3. General Onboarding Verification Workflow

Once an agent is onboarded using the wizard or REST API:

1. **SQLite Insertion:** The backend writes the agent properties to the `agents` table in `aether.db`.
2. **Onboarding Event Broadcast:** An `AgentOnboarded` event is dispatched to the AETHER Event Bus.
3. **Supervisory Execution:** When you click the **"Run All Agents"** button in the Command Center:
   * **Compliance Agent** audits the agent's PII and financial access against regulatory standards.
   * **Risk Agent** calculates the risk score and evaluates threat levels.
   * **Governance Agent** flags violations (e.g. `GOV-MODEL-001` if running on unapproved foundation models).
   * **Cost Agent** reviews token and monthly spend efficiency.
   * **Health Agent** performs an HTTP probe on the registry endpoint URL to verify latency and uptime.
