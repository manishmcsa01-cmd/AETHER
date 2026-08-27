/* ═══════════════════════════════════════════════════════════════
   AETHER Agents Configuration
   ═══════════════════════════════════════════════════════════════
   Central registry & config for ALL monitored agents.
   This file is the single source of truth for:
   - Platform connector configurations (12 integrations)
   - AETHER supervisory agent definitions (11 agents)
   - Microsoft Copilot integration config
   - Monitoring defaults & thresholds
   - Onboarded agent registry (auto-updated on onboard)

   When any agent is onboarded to the solution, this config
   is updated with all monitoring details automatically.
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};

AETHER.config = (function () {
  'use strict';

  var STORAGE_KEY = 'aether_agents_config_v3';
  var CONFIG_VERSION = '3.0.0';
  var API_BASE = '/api';  // Backend API base path

  // ─── Platform Connectors ─────────────────────────────────
  // All 12 supported integrations from the MVP spec
  var platformConnectors = [
    {
      id: 'ms-copilot',
      name: 'Microsoft Copilot',
      type: 'microsoft',
      status: 'connected',
      icon: '🔷',
      color: '#3b82f6',
      apiEndpoint: 'https://graph.microsoft.com/v1.0',
      authMethod: 'OAuth 2.0 / Microsoft Entra ID',
      scopes: [
        'User.Read.All',
        'Application.Read.All',
        'AuditLog.Read.All',
        'Reports.Read.All',
        'ServiceHealth.Read.All'
      ],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:22:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        tenantId: 'contoso.onmicrosoft.com',
        clientId: 'aether-copilot-connector-001',
        graphApiVersion: 'v1.0',
        discoveryScope: ['copilot-agents', 'copilot-studio', 'copilot-plugins', 'm365-copilot'],
        usageTracking: true,
        permissionMonitoring: true,
        activityLogging: true,
        syncInterval: 300
      }
    },
    {
      id: 'ms-copilot-studio',
      name: 'Copilot Studio',
      type: 'microsoft',
      status: 'connected',
      icon: '🟦',
      color: '#2563eb',
      apiEndpoint: 'https://api.powerplatform.com/v1',
      authMethod: 'OAuth 2.0 / Microsoft Entra ID',
      scopes: ['Environment.Read', 'Bot.Read.All', 'Flow.Read.All'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:20:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        environmentId: 'default-contoso',
        region: 'unitedstates',
        discoveryScope: ['chatbots', 'copilot-agents', 'power-automate-flows'],
        syncInterval: 600
      }
    },
    {
      id: 'azure-ai-foundry',
      name: 'Azure AI Foundry',
      type: 'microsoft',
      status: 'connected',
      icon: '🔹',
      color: '#0ea5e9',
      apiEndpoint: 'https://management.azure.com/subscriptions/{subId}/resourceGroups/{rg}/providers/Microsoft.MachineLearningServices',
      authMethod: 'Azure Managed Identity / Service Principal',
      scopes: ['Reader', 'Contributor'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:18:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        subscriptionId: 'sub-contoso-ai-001',
        resourceGroup: 'rg-aether-prod',
        workspaceName: 'aether-ai-workspace',
        discoveryScope: ['endpoints', 'deployments', 'prompt-flows', 'agents'],
        syncInterval: 600
      }
    },
    {
      id: 'ms-entra-id',
      name: 'Microsoft Entra ID',
      type: 'microsoft',
      status: 'connected',
      icon: '🔐',
      color: '#6366f1',
      apiEndpoint: 'https://graph.microsoft.com/v1.0/identity',
      authMethod: 'OAuth 2.0 / Microsoft Entra ID',
      scopes: ['Directory.Read.All', 'Application.Read.All', 'AuditLog.Read.All'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:25:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        tenantId: 'contoso.onmicrosoft.com',
        identityProvider: 'AzureAD',
        ssoEnabled: true,
        mfaEnforced: true,
        conditionalAccessPolicies: 12,
        servicePrincipals: 48,
        syncInterval: 300
      }
    },
    {
      id: 'openai-assistants',
      name: 'OpenAI Assistants',
      type: 'openai',
      status: 'connected',
      icon: '🟢',
      color: '#10b981',
      apiEndpoint: 'https://api.openai.com/v1',
      authMethod: 'API Key / Bearer Token',
      scopes: ['assistants.read', 'threads.read', 'runs.read'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:15:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        organizationId: 'org-contoso-001',
        apiVersion: '2024-12-01',
        discoveryScope: ['assistants', 'threads', 'fine-tuned-models'],
        rateLimitMonitoring: true,
        tokenUsageTracking: true,
        syncInterval: 300
      }
    },
    {
      id: 'azure-openai',
      name: 'Azure OpenAI',
      type: 'microsoft',
      status: 'connected',
      icon: '🔮',
      color: '#8b5cf6',
      apiEndpoint: 'https://{resource}.openai.azure.com/openai',
      authMethod: 'Azure Managed Identity / API Key',
      scopes: ['Cognitive Services OpenAI User'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:19:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        resourceName: 'contoso-aoai-prod',
        apiVersion: '2024-10-21',
        deployments: ['gpt-4o', 'gpt-4o-mini', 'text-embedding-ada-002'],
        discoveryScope: ['deployments', 'fine-tunes', 'assistants'],
        contentFilterMonitoring: true,
        syncInterval: 300
      }
    },
    {
      id: 'langgraph',
      name: 'LangGraph',
      type: 'opensource',
      status: 'connected',
      icon: '🦜',
      color: '#f59e0b',
      apiEndpoint: 'https://api.smith.langchain.com/v1',
      authMethod: 'API Key',
      scopes: ['runs.read', 'projects.read', 'traces.read'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:10:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        projectId: 'contoso-langgraph-prod',
        langsmithApiKey: '***masked***',
        discoveryScope: ['graphs', 'agents', 'chains', 'tools'],
        tracingEnabled: true,
        syncInterval: 600
      }
    },
    {
      id: 'crewai',
      name: 'CrewAI',
      type: 'opensource',
      status: 'connected',
      icon: '🚀',
      color: '#ec4899',
      apiEndpoint: 'https://api.crewai.com/v1',
      authMethod: 'API Key',
      scopes: ['crews.read', 'agents.read', 'tasks.read'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:12:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        organizationId: 'contoso-crewai',
        discoveryScope: ['crews', 'agents', 'tasks', 'processes'],
        memoryTracking: true,
        syncInterval: 600
      }
    },
    {
      id: 'salesforce-agentforce',
      name: 'Salesforce Agentforce',
      type: 'salesforce',
      status: 'connected',
      icon: '☁️',
      color: '#06b6d4',
      apiEndpoint: 'https://contoso.my.salesforce.com/services/data/v62.0',
      authMethod: 'OAuth 2.0 / JWT Bearer',
      scopes: ['api', 'chatter_api', 'einstein_analytics'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:16:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        instanceUrl: 'https://contoso.my.salesforce.com',
        apiVersion: 'v62.0',
        discoveryScope: ['einstein-bots', 'agentforce-agents', 'flow-orchestrations'],
        caseRoutingMonitoring: true,
        syncInterval: 600
      }
    },
    {
      id: 'databricks',
      name: 'Databricks Agents',
      type: 'databricks',
      status: 'connected',
      icon: '🔶',
      color: '#ef4444',
      apiEndpoint: 'https://contoso.cloud.databricks.com/api/2.0',
      authMethod: 'Service Principal / PAT',
      scopes: ['workspace.read', 'clusters.read', 'serving-endpoints.read'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:14:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        workspaceUrl: 'https://contoso.cloud.databricks.com',
        discoveryScope: ['serving-endpoints', 'model-serving', 'feature-serving', 'agents'],
        unityCatalogEnabled: true,
        mlflowTracking: true,
        syncInterval: 600
      }
    },
    {
      id: 'snowflake-cortex',
      name: 'Snowflake Cortex',
      type: 'snowflake',
      status: 'connected',
      icon: '❄️',
      color: '#38bdf8',
      apiEndpoint: 'https://contoso.snowflakecomputing.com/api/v2',
      authMethod: 'Key Pair / OAuth',
      scopes: ['CORTEX_USER', 'DATA_READER'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:13:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        account: 'contoso.us-east-1',
        warehouse: 'AETHER_WH',
        discoveryScope: ['cortex-search', 'cortex-analyst', 'cortex-functions', 'streamlit-apps'],
        queryHistoryTracking: true,
        syncInterval: 600
      }
    },
    {
      id: 'custom-agents',
      name: 'Custom Enterprise Agents',
      type: 'custom',
      status: 'connected',
      icon: '⚙️',
      color: '#a855f7',
      apiEndpoint: 'https://aether-api.contoso.com/v1/agents',
      authMethod: 'AETHER SDK / API Key',
      scopes: ['agent.register', 'agent.heartbeat', 'agent.metrics'],
      discoveryEnabled: true,
      lastSync: '2026-06-15T14:24:00Z',
      agentsDiscovered: 0,
      healthStatus: 'healthy',
      config: {
        sdkVersions: { python: '1.2.0', typescript: '1.1.0' },
        registrationEndpoint: '/api/v1/agents/register',
        heartbeatEndpoint: '/api/v1/agents/heartbeat',
        metricsEndpoint: '/api/v1/agents/metrics',
        webhookUrl: 'https://aether-api.contoso.com/webhooks/agent-events',
        autoDiscovery: true,
        syncInterval: 60
      }
    }
  ];

  // ─── Microsoft Copilot Integration (Highest Priority) ────
  var microsoftCopilotConfig = {
    enabled: true,
    priority: 'highest',
    tenant: {
      id: 'contoso.onmicrosoft.com',
      displayName: 'Contoso Corporation',
      region: 'US',
      subscriptionTier: 'E5'
    },
    graphApi: {
      version: 'v1.0',
      baseUrl: 'https://graph.microsoft.com/v1.0',
      batchSize: 100,
      throttleRetries: 3,
      endpoints: {
        copilotAgents: '/solutions/virtualAgents',
        copilotUsage: '/reports/getCopilotUsageDetail',
        copilotActivity: '/auditLogs/signIns',
        servicePrincipals: '/servicePrincipals',
        applications: '/applications',
        users: '/users'
      }
    },
    discovery: {
      copilotAgents: true,
      copilotStudioAgents: true,
      copilotPlugins: true,
      copilotUsageMetrics: true,
      copilotPermissions: true,
      copilotActivityLogs: true,
      m365CopilotInteractions: true,
      teamsBotsAndApps: true
    },
    monitoring: {
      usageThreshold: { daily: 1000, weekly: 5000 },
      permissionAlerts: true,
      dataAccessAuditing: true,
      sensitivityLabelTracking: true,
      dlpPolicyEnforcement: true,
      conditionalAccessCompliance: true
    },
    entraId: {
      ssoEnabled: true,
      mfaRequired: true,
      conditionalAccessPolicies: [
        { name: 'Require MFA for AI agents', status: 'enabled' },
        { name: 'Block legacy auth for agents', status: 'enabled' },
        { name: 'Restrict AI agent sign-in locations', status: 'enabled' }
      ],
      appRegistrations: 48,
      servicePrincipals: 52,
      managedIdentities: 15
    }
  };

  // ─── AETHER Supervisory Agents ───────────────────────────
  // These are AETHER's own AI workforce — the agents that
  // monitor, govern, and optimize enterprise AI agents
  var supervisoryAgents = [
    {
      id: 'sa-discovery',
      name: 'Discovery Agent',
      purpose: 'Continuously discover AI agents across all enterprise platforms',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '🔍',
      color: '#3b82f6',
      config: {
        scanInterval: 300,
        platforms: platformConnectors.map(function(p) { return p.id; }),
        alertOnNewAgent: true,
        alertOnRemovedAgent: true,
        alertOnConfigChange: true,
        alertOnOwnershipChange: true,
        parallelScans: 4,
        retryAttempts: 3,
        timeoutSeconds: 30
      },
      outputs: ['Agent Inventory', 'Discovery Coverage Score', 'Agent Registration Events'],
      metrics: {
        lastRun: null,
        nextRun: null,
        totalScans: 0,
        agentsDiscovered: 0,
        newAgentsToday: 0,
        removedAgentsToday: 0,
        configChangesToday: 0,
        scanCoverage: 0,
        avgScanDuration: '0s',
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-identity',
      name: 'Identity Agent',
      purpose: 'Validate ownership, accountability, and identity for every AI worker',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '🪪',
      color: '#6366f1',
      config: {
        validationInterval: 600,
        requireOwner: true,
        requireDepartment: true,
        requireSponsor: true,
        requireCostCenter: true,
        requireDocumentation: true,
        requireApprovals: true,
        orphanDetectionEnabled: true,
        orphanThresholdDays: 30,
        credentialRotationDays: 90
      },
      outputs: ['Identity Score (0-100)', 'Orphan Agent Alerts', 'Credential Rotation Alerts'],
      metrics: {
        lastRun: null,
        nextRun: null,
        totalValidations: 0,
        avgIdentityScore: 0,
        orphanAgents: 0,
        unknownAgents: 0,
        unauthorizedAgents: 0,
        pendingRotation: 0,
        expiringSoon: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-governance',
      name: 'Governance Agent',
      purpose: 'Enforce enterprise AI policies and approval workflows',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '🛡️',
      color: '#f59e0b',
      config: {
        evaluationInterval: 60,
        activePolicies: 8,
        autoEnforce: true,
        escalationEnabled: true,
        escalationChain: ['Agent Owner', 'Department Head', 'VP', 'CISO'],
        blockOnViolation: true,
        notifyOnViolation: true,
        auditTrailEnabled: true,
        realTimePolicyEval: true
      },
      outputs: ['Governance Score', 'Policy Violations', 'Enforcement Actions'],
      metrics: {
        lastRun: null,
        nextRun: null,
        policiesEvaluated: 0,
        activeViolations: 0,
        autoActionsToday: 0,
        escalationsToday: 0,
        policyAdherence: 0,
        avgEvalTime: '0ms',
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-compliance',
      name: 'Compliance Agent',
      purpose: 'Continuously evaluate compliance posture across regulatory frameworks',
      status: 'idle',
      type: 'supervisory',
      schedule: 'hourly',
      icon: '✅',
      color: '#10b981',
      config: {
        scanInterval: 3600,
        frameworks: ['SOC2', 'ISO27001', 'GDPR', 'SOX', 'HIPAA'],
        controlMapping: true,
        gapAnalysis: true,
        auditReadinessCheck: true,
        evidenceCollection: true,
        continuousMonitoring: true,
        complianceThreshold: 90
      },
      outputs: ['Compliance Score', 'Audit Readiness', 'Gap Analysis Reports'],
      metrics: {
        lastRun: null,
        nextRun: null,
        controlsEvaluated: 0,
        controlsPassed: 0,
        openFindings: 0,
        overallScore: 0,
        frameworkScores: { SOC2: 0, ISO27001: 0, GDPR: 0, SOX: 0, HIPAA: 0 },
        auditReadiness: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-risk',
      name: 'Risk Agent',
      purpose: 'Calculate and monitor AI workforce risk continuously',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '⚠️',
      color: '#ef4444',
      config: {
        assessmentInterval: 300,
        riskFactors: {
          piiAccess: { weight: 25, enabled: true },
          financialAccess: { weight: 20, enabled: true },
          criticality: { weight: 15, enabled: true },
          privilegedActions: { weight: 15, enabled: true },
          externalToolUsage: { weight: 10, enabled: true },
          incidentHistory: { weight: 15, enabled: true }
        },
        thresholds: {
          low: { min: 0, max: 29 },
          medium: { min: 30, max: 59 },
          high: { min: 60, max: 79 },
          critical: { min: 80, max: 100 }
        },
        autoEscalateCritical: true,
        riskTrendAnalysis: true,
        anomalyDetection: true
      },
      outputs: ['Risk Score (0-100)', 'Risk Level', 'Risk Trend', 'Anomaly Alerts'],
      metrics: {
        lastRun: null,
        nextRun: null,
        agentsAssessed: 0,
        criticalRisk: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        avgRiskScore: 0,
        riskTrend: '',
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-cost',
      name: 'Cost Agent',
      purpose: 'Track AI economics — token usage, LLM costs, infrastructure, utilization',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '💰',
      color: '#f59e0b',
      config: {
        trackingInterval: 300,
        trackTokenUsage: true,
        trackLLMCosts: true,
        trackInfraCosts: true,
        trackCopilotLicenses: true,
        trackAgentUtilization: true,
        budgetAlerts: true,
        budgetThresholdPercent: 80,
        costOptimizationRecommendations: true,
        forecastHorizonDays: 90
      },
      outputs: ['Cost Per Agent', 'Cost Per Task', 'Department Spend', 'Enterprise AI Spend', 'Optimization Recommendations'],
      metrics: {
        lastRun: null,
        nextRun: null,
        totalMonthlySpend: 0,
        avgCostPerAgent: 0,
        avgCostPerTask: 0,
        tokenSpend: 0,
        infraCost: 0,
        budgetUtilization: 0,
        savingsIdentified: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-reliability',
      name: 'Reliability Agent',
      purpose: 'Monitor operational health — uptime, latency, success rates, retries',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '💓',
      color: '#06b6d4',
      config: {
        healthCheckInterval: 60,
        metrics: ['successRate', 'failureRate', 'availability', 'latency', 'retries', 'errorRate'],
        slaTarget: 99.0,
        latencyThresholdMs: 500,
        failureRateThreshold: 5.0,
        incidentAutoDetection: true,
        incidentAutoEscalation: true,
        degradedThreshold: 95.0,
        outageThreshold: 90.0
      },
      outputs: ['Reliability Score', 'Incident Alerts', 'SLA Compliance', 'Health Dashboard'],
      metrics: {
        lastRun: null,
        nextRun: null,
        agentsMonitored: 0,
        avgAvailability: 0,
        avgSuccessRate: 0,
        avgLatency: 0,
        activeIncidents: 0,
        degradedAgents: 0,
        slaCompliant: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-observability',
      name: 'Observability Agent',
      purpose: 'Collect telemetry — logs, events, metrics, traces across all agents',
      status: 'idle',
      type: 'supervisory',
      schedule: 'continuous',
      icon: '📊',
      color: '#8b5cf6',
      config: {
        collectionInterval: 30,
        collectLogs: true,
        collectEvents: true,
        collectMetrics: true,
        collectTraces: true,
        logRetentionDays: 90,
        metricsRetentionDays: 365,
        traceRetentionDays: 30,
        samplingRate: 1.0,
        correlationEnabled: true,
        anomalyDetection: true
      },
      outputs: ['Agent Health Graph', 'Telemetry Dashboard', 'Anomaly Alerts'],
      metrics: {
        lastRun: null,
        nextRun: null,
        eventsCollected: 0,
        logsProcessed: 0,
        tracesAnalyzed: 0,
        metricsStored: 0,
        anomaliesDetected: 0,
        dataIngestionRate: '0 events/sec',
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-benchmarking',
      name: 'Benchmarking Agent',
      purpose: 'Compare agent performance across departments and against industry benchmarks',
      status: 'idle',
      type: 'supervisory',
      schedule: 'daily',
      icon: '📈',
      color: '#14b8a6',
      config: {
        benchmarkInterval: 86400,
        dimensions: ['cost', 'reliability', 'utilization', 'performance', 'compliance'],
        departmentComparison: true,
        industryBenchmarks: true,
        peerComparison: true,
        optimizationRecommendations: true,
        trendAnalysis: true
      },
      outputs: ['Benchmark Scores', 'Department Rankings', 'Optimization Recommendations'],
      metrics: {
        lastRun: null,
        nextRun: null,
        agentsBenchmarked: 0,
        departmentsRanked: 0,
        metricsAboveBenchmark: 0,
        metricsAtBenchmark: 0,
        metricsBelowBenchmark: 0,
        recommendationsGenerated: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-auditor',
      name: 'Auditor Agent',
      purpose: 'Autonomous internal auditor — who, what, risks, compliance, value',
      status: 'idle',
      type: 'supervisory',
      schedule: 'daily',
      icon: '🔎',
      color: '#d946ef',
      config: {
        auditInterval: 86400,
        auditQuestions: [
          'Who owns this agent?',
          'What does it do?',
          'What risks exist?',
          'Is it compliant?',
          'What value does it provide?',
          'Is it authorized?',
          'When was it last reviewed?'
        ],
        autoGenerateReports: true,
        reportTypes: ['weekly-governance', 'monthly-workforce', 'quarterly-optimization'],
        evidenceCollection: true,
        findingsPrioritization: true,
        executiveSummary: true
      },
      outputs: ['Audit Reports', 'Executive Findings', 'Risk Reports', 'Remediation Plans'],
      metrics: {
        lastRun: null,
        nextRun: null,
        auditsCompleted: 0,
        openFindings: 0,
        closedFindings: 0,
        criticalFindings: 0,
        avgRemediationDays: 0,
        reportsGenerated: 0,
        eventsGenerated: 0
      }
    },
    {
      id: 'sa-workforce-manager',
      name: 'AI Workforce Manager',
      purpose: 'Chief AI Workforce Officer — executive briefings, strategic oversight',
      status: 'idle',
      type: 'supervisory',
      schedule: 'daily',
      icon: '👔',
      color: '#0891b2',
      config: {
        briefingSchedule: {
          daily: { enabled: true, time: '08:00', recipients: ['CIO', 'CAIO'] },
          weekly: { enabled: true, day: 'Monday', time: '09:00', recipients: ['CIO', 'CISO', 'CFO', 'CAIO'] },
          monthly: { enabled: true, day: 1, time: '09:00', recipients: ['Executive Committee'] },
          quarterly: { enabled: true, months: [1, 4, 7, 10], recipients: ['Board of Directors'] }
        },
        reviewAreas: ['workforce-health', 'compliance-posture', 'enterprise-costs', 'risks', 'governance', 'business-impact'],
        strategicRecommendations: true,
        workforceOptimization: true,
        budgetForecasting: true
      },
      outputs: ['Daily Executive Briefings', 'Weekly Governance Reports', 'Monthly AI Workforce Reviews', 'Quarterly Optimization Reports'],
      metrics: {
        lastRun: null,
        nextRun: null,
        briefingsGenerated: 0,
        reportsGenerated: 0,
        recommendationsIssued: 0,
        recommendationsImplemented: 0,
        implementationRate: 0,
        costSavingsInfluenced: 0,
        eventsGenerated: 0
      }
    }
  ];

  // ─── Monitoring Methods ───────────────────────────────────
  // Defines HOW AETHER connects to and monitors each agent
  var MONITORING_METHODS = {
    'connector-pull': {
      id: 'connector-pull',
      name: 'Platform Connector (Pull)',
      description: 'AETHER connects to the platform API and pulls agent data at configured intervals',
      howItWorks: 'Discovery Agent calls platform API → retrieves agent list, status, usage, permissions → stores in config',
      requiredFields: ['platformConnectorId'],
      optionalFields: ['apiEndpoint', 'apiKey'],
      supportedPlatforms: ['Microsoft Copilot', 'Copilot Studio', 'Azure AI Foundry', 'Salesforce Agentforce', 'Databricks Agents', 'Snowflake Cortex', 'Azure OpenAI', 'OpenAI Assistants']
    },
    'sdk-push': {
      id: 'sdk-push',
      name: 'AETHER SDK (Push)',
      description: 'Agent includes AETHER SDK which pushes heartbeats, metrics, and logs to AETHER',
      howItWorks: 'Agent SDK sends heartbeat every N seconds → pushes metrics, activity logs, cost data → AETHER ingests and evaluates',
      requiredFields: ['endpoint', 'sdkLanguage'],
      optionalFields: ['healthCheckEndpoint', 'metricsEndpoint', 'sdkVersion'],
      supportedPlatforms: ['Custom Enterprise Agents', 'LangGraph', 'CrewAI']
    },
    'webhook': {
      id: 'webhook',
      name: 'Webhook (Event-Driven)',
      description: 'Platform pushes events to AETHER webhook endpoint when agent state changes',
      howItWorks: 'Platform sends POST to AETHER webhook URL → event contains agent state change → AETHER processes and evaluates',
      requiredFields: ['webhookUrl'],
      optionalFields: ['webhookSecret', 'eventTypes'],
      supportedPlatforms: ['Salesforce Agentforce', 'Databricks Agents', 'Custom Enterprise Agents']
    },
    'hybrid': {
      id: 'hybrid',
      name: 'Hybrid (Pull + Push)',
      description: 'Combination of connector pull for discovery and SDK push for real-time telemetry',
      howItWorks: 'Connector discovers agent → SDK provides real-time health, metrics → both channels feed supervisory agents',
      requiredFields: ['platformConnectorId', 'endpoint'],
      optionalFields: ['healthCheckEndpoint', 'metricsEndpoint'],
      supportedPlatforms: ['All']
    }
  };

  // ─── Monitoring Defaults ─────────────────────────────────
  // Applied to every onboarded agent unless overridden
  var monitoringDefaults = {
    // HOW to monitor — auto-selected based on platform
    monitoringMethod: 'connector-pull',
    // WHERE the agent runs — deployment topology
    deployment: {
      endpoint: null,               // Agent API/service endpoint URL
      healthCheckEndpoint: '/health', // Health check path (appended to endpoint)
      metricsEndpoint: '/metrics',    // Metrics endpoint path
      environment: 'Production',      // Production, Staging, Development, Test
      region: 'us-east-1',            // Cloud region / datacenter
      runtime: 'Azure Kubernetes Service', // Runtime platform (AKS, ECS, Lambda, VM, etc.)
      namespace: 'default',           // K8s namespace or equivalent
      hostInfo: null                  // Hostname, IP, or cloud resource ID
    },
    healthCheck: {
      enabled: true,
      interval: 60,
      timeout: 10,
      retries: 3,
      method: 'heartbeat',
      expectedStatusCode: 200,
      failureAction: 'alert'
    },
    metrics: {
      collectionInterval: 300,
      retention: 365,
      dimensions: ['latency', 'successRate', 'failureRate', 'tokenUsage', 'cost', 'availability']
    },
    alerts: {
      enabled: true,
      channels: ['email', 'slack', 'teams'],
      thresholds: {
        riskScore: { warning: 60, critical: 80 },
        failureRate: { warning: 3.0, critical: 5.0 },
        costPerTask: { warning: 0.30, critical: 0.50 },
        latency: { warning: 300, critical: 500 },
        availability: { warning: 99.0, critical: 95.0 }
      }
    },
    governance: {
      requireOwner: true,
      requireDepartment: true,
      requireCostCenter: true,
      requireDocumentation: true,
      requireApproval: true,
      piiAccessApprovalRequired: true,
      financialAccessApprovalRequired: true,
      certificationRequired: true,
      certificationRenewalDays: 90,
      maxTokenBudget: null,
      maxCostBudget: null
    },
    compliance: {
      frameworks: ['SOC2', 'ISO27001', 'GDPR'],
      autoScan: true,
      scanInterval: 86400,
      reportingEnabled: true
    },
    logging: {
      activityLogging: true,
      auditTrailEnabled: true,
      logLevel: 'info',
      logRetentionDays: 90
    }
  };

  // ─── Governance Policy Templates ─────────────────────────
  var governancePolicies = [
    {
      id: 'GOV-PII-001',
      name: 'PII Access Control',
      condition: 'agent.piiAccess === true && agent.certificationStatus !== "Certified"',
      action: 'block',
      severity: 'critical',
      autoEnforce: true,
      notifyOwner: true,
      notifyCISO: true
    },
    {
      id: 'GOV-FIN-001',
      name: 'Financial Transaction Limit',
      condition: 'transaction.amount > 100000',
      action: 'escalate',
      severity: 'high',
      autoEnforce: true,
      escalationChain: ['Owner', 'VP Finance', 'CFO']
    },
    {
      id: 'GOV-COST-001',
      name: 'Cost Anomaly Detection',
      condition: 'agent.dailyCost > agent.avgDailyCost * 2',
      action: 'alert',
      severity: 'medium',
      autoEnforce: false,
      notifyOwner: true
    },
    {
      id: 'GOV-AUTH-001',
      name: 'Unauthorized Agent Detection',
      condition: 'agent.owner === null || agent.approvalStatus !== "approved"',
      action: 'quarantine',
      severity: 'critical',
      autoEnforce: true,
      notifyCISO: true
    },
    {
      id: 'GOV-MODEL-001',
      name: 'Model Version Control',
      condition: 'agent.modelVersion !== approvedVersions[agent.model]',
      action: 'block',
      severity: 'high',
      autoEnforce: true,
      notifyOwner: true
    },
    {
      id: 'GOV-DATA-001',
      name: 'Cross-Region Data Transfer',
      condition: 'data.region !== agent.region && data.classification === "sensitive"',
      action: 'block',
      severity: 'critical',
      autoEnforce: true,
      notifyDPO: true
    },
    {
      id: 'GOV-CERT-001',
      name: 'Certification Expiry',
      condition: 'agent.certificationExpiry < now() + 30d',
      action: 'alert',
      severity: 'medium',
      autoEnforce: false,
      notifyOwner: true
    },
    {
      id: 'GOV-IDLE-001',
      name: 'Idle Agent Detection',
      condition: 'agent.lastActivity > 30d && agent.status === "active"',
      action: 'review',
      severity: 'low',
      autoEnforce: false,
      notifyOwner: true
    }
  ];

  // ─── Onboarded Agents Registry ───────────────────────────
  // This is THE registry. Updated automatically on onboarding.
  // Each entry contains the agent + its monitoring config.
  var _onboardedAgents = [];

  // Load persisted agents from localStorage
  function _loadPersistedAgents() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.onboardedAgents) {
          _onboardedAgents = parsed.onboardedAgents;
          return;
        }
      }
    } catch (e) {
      console.warn('[AETHER Config] Failed to load persisted agents:', e);
    }
    _onboardedAgents = [];
  }

  // Persist current state to localStorage + sync to backend
  function _persist() {
    try {
      var state = {
        version: CONFIG_VERSION,
        lastUpdated: new Date().toISOString(),
        onboardedAgents: _onboardedAgents
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[AETHER Config] Failed to persist agents:', e);
    }
  }

  // Sync a single agent to the backend server
  function _syncAgentToServer(agentEntry) {
    var payload = {
      id: agentEntry.id,
      name: agentEntry.name,
      platform: agentEntry.platform,
      department: agentEntry.department,
      owner: agentEntry.owner,
      environment: agentEntry.environment || 'Production',
      purpose: agentEntry.purpose || '',
      endpoint: agentEntry.endpoint || '',
      piiAccess: agentEntry.piiAccess || false,
      financialAccess: agentEntry.financialAccess || false,
      riskScore: agentEntry.riskScore || 0,
      certificationStatus: agentEntry.certificationStatus || 'Pending',
      region: agentEntry.region || 'US',
      monthlyCost: agentEntry.monthlyCost || 0,
      tasksExecuted: agentEntry.tasksExecuted || 0,
      successRate: agentEntry.successRate || '99.5',
      availability: agentEntry.availability || '99.9',
      avgLatency: agentEntry.avgLatency || 200,
      tokenUsage: agentEntry.tokenUsage || 0,
      model: agentEntry.model || '',
      criticality: agentEntry.criticality || 'Medium'
    };
    fetch(API_BASE + '/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (data) {
      console.log('[AETHER Config] Synced to backend: ' + agentEntry.id);
    }).catch(function (err) {
      console.warn('[AETHER Config] Backend sync failed (offline mode):', err.message);
    });
  }

  // Load agents from backend server
  function _loadFromServer(callback) {
    fetch(API_BASE + '/agents').then(function (r) { return r.json(); }).then(function (data) {
      var serverAgents = (data && data.agents) || [];
      console.log('[AETHER Config] Loaded ' + serverAgents.length + ' agents from backend');
      if (callback) callback(serverAgents);
    }).catch(function (err) {
      console.warn('[AETHER Config] Backend not available (offline mode):', err.message);
      if (callback) callback([]);
    });
  }

  // Auto-import agents from AETHER.data if not yet onboarded
  function _autoImportFromDataLayer() {
    if (!AETHER.data || !AETHER.data.agents) return;
    if (_onboardedAgents.length > 0) return; // Already have onboarded agents

    AETHER.data.agents.forEach(function (agent) {
      _onboardedAgents.push(_createOnboardEntry(agent));
    });
    _persist();
    console.log('[AETHER Config] Auto-imported ' + _onboardedAgents.length + ' agents from data layer');
  }

  // Determine the best monitoring method based on platform
  function _resolveMonitoringMethod(platform) {
    var connectorPlatforms = ['Microsoft Copilot', 'Copilot Studio', 'Azure AI Foundry',
      'Salesforce Agentforce', 'Databricks Agents', 'Snowflake Cortex',
      'Azure OpenAI', 'OpenAI Assistants', 'Microsoft Entra ID'];
    var sdkPlatforms = ['Custom Enterprise Agents'];
    var hybridPlatforms = ['LangGraph', 'CrewAI'];

    if (connectorPlatforms.indexOf(platform) !== -1) return 'connector-pull';
    if (sdkPlatforms.indexOf(platform) !== -1) return 'sdk-push';
    if (hybridPlatforms.indexOf(platform) !== -1) return 'hybrid';
    return 'sdk-push'; // Default for unknown platforms
  }

  // Generate realistic endpoint URLs based on platform
  function _resolveEndpoint(agentData, connector) {
    if (agentData.endpoint) return agentData.endpoint;
    if (!connector) return null;
    var slug = (agentData.name || 'agent').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var endpoints = {
      'ms-copilot': 'https://graph.microsoft.com/v1.0/solutions/virtualAgents/' + slug,
      'ms-copilot-studio': 'https://api.powerplatform.com/v1/agents/' + slug,
      'azure-ai-foundry': 'https://contoso-ai.azure-api.net/agents/' + slug,
      'ms-entra-id': 'https://graph.microsoft.com/v1.0/servicePrincipals/' + slug,
      'openai-assistants': 'https://api.openai.com/v1/assistants/' + slug,
      'azure-openai': 'https://contoso-aoai-prod.openai.azure.com/openai/agents/' + slug,
      'langgraph': 'https://api.smith.langchain.com/v1/agents/' + slug,
      'crewai': 'https://api.crewai.com/v1/crews/' + slug,
      'salesforce-agentforce': 'https://contoso.my.salesforce.com/services/data/v62.0/agents/' + slug,
      'databricks': 'https://contoso.cloud.databricks.com/serving-endpoints/' + slug,
      'snowflake-cortex': 'https://contoso.snowflakecomputing.com/api/v2/cortex/' + slug,
      'custom-agents': 'https://' + slug + '.agents.contoso.com'
    };
    return endpoints[connector.id] || null;
  }

  // Resolve runtime based on platform
  function _resolveRuntime(platform) {
    var runtimes = {
      'Microsoft Copilot': 'Microsoft 365 Cloud',
      'Copilot Studio': 'Power Platform / Dataverse',
      'Azure AI Foundry': 'Azure AI Services',
      'Microsoft Entra ID': 'Azure Active Directory',
      'OpenAI Assistants': 'OpenAI Cloud',
      'Azure OpenAI': 'Azure Cognitive Services',
      'LangGraph': 'Azure Kubernetes Service',
      'CrewAI': 'Azure Kubernetes Service',
      'Salesforce Agentforce': 'Salesforce Hyperforce',
      'Databricks Agents': 'Databricks Runtime',
      'Snowflake Cortex': 'Snowflake Compute',
      'Custom Enterprise Agents': 'Azure Kubernetes Service'
    };
    return runtimes[platform] || 'Azure Kubernetes Service';
  }

  // Create a standardized onboarded agent entry with monitoring config
  function _createOnboardEntry(agentData) {
    var connector = platformConnectors.find(function (c) {
      return c.name === agentData.platform;
    });

    var monitoringMethod = agentData.monitoringMethod || _resolveMonitoringMethod(agentData.platform);
    var endpoint = agentData.endpoint || _resolveEndpoint(agentData, connector);
    var runtime = agentData.runtime || _resolveRuntime(agentData.platform);

    return {
      // ── Identity ──
      id: agentData.id || _generateAgentId(),
      name: agentData.name,
      platform: agentData.platform,
      platformConnectorId: connector ? connector.id : 'custom-agents',
      owner: agentData.owner || null,
      department: agentData.department || null,
      costCenter: agentData.costCenter || agentData.department || null,
      sponsor: agentData.sponsor || null,
      purpose: agentData.purpose || '',
      // Prefer the server's real onboarding timestamp (onboardedAt, e.g. from
      // syncFromServer() pulling /api/agents) over stamping "now" — this is
      // what credential-rotation-age math (js/data.js computeIdentity()) is
      // keyed on, so silently resetting it to today on every sync/reload
      // made every credential look freshly rotated regardless of how long
      // the agent has actually been onboarded.
      createdDate: (agentData.createdDate || (agentData.onboardedAt ? String(agentData.onboardedAt).split('T')[0] : null)) || new Date().toISOString().split('T')[0],
      onboardedDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),

      // ── Deployment Topology (WHERE it runs) ──
      endpoint: endpoint,
      healthCheckEndpoint: agentData.healthCheckEndpoint || (endpoint ? endpoint + '/health' : null),
      metricsEndpoint: agentData.metricsEndpoint || (endpoint ? endpoint + '/metrics' : null),
      webhookUrl: agentData.webhookUrl || null,
      environment: agentData.environment || 'Production',
      region: agentData.region || 'us-east-1',
      runtime: runtime,
      namespace: agentData.namespace || 'default',
      hostInfo: agentData.hostInfo || null,
      status: agentData.status || 'Active',

      // ── Monitoring Method (HOW to monitor) ──
      monitoringMethod: monitoringMethod,
      monitoringMethodDetails: MONITORING_METHODS[monitoringMethod],
      sdkConfig: monitoringMethod === 'sdk-push' || monitoringMethod === 'hybrid' ? {
        language: agentData.sdkLanguage || 'python',
        version: agentData.sdkVersion || '1.2.0',
        heartbeatInterval: agentData.heartbeatInterval || 60,
        metricsInterval: agentData.metricsInterval || 300,
        ingestionEndpoint: 'https://aether-api.contoso.com/v1/agents/ingest'
      } : null,

      // ── Risk & Compliance ──
      riskScore: agentData.riskScore || 0,
      riskLevel: agentData.riskLevel || 'Low',
      criticality: agentData.criticality || 'Low',
      certificationStatus: agentData.certificationStatus || 'Pending',
      piiAccess: agentData.piiAccess || false,
      financialAccess: agentData.financialAccess || false,

      // ── Operational ──
      monthlyCost: agentData.monthlyCost || 0,
      tasksExecuted: agentData.tasksExecuted || 0,
      successRate: agentData.successRate || 0,
      availability: agentData.availability || 0,
      avgLatency: agentData.avgLatency || 0,
      tokenUsage: agentData.tokenUsage || 0,
      connectedSystems: agentData.connectedSystems || 0,
      lastSeen: agentData.lastSeen || 'never',

      // ── Monitoring Configuration (WHAT to monitor) ──
      monitoring: {
        enabled: true,
        healthCheck: {
          enabled: monitoringDefaults.healthCheck.enabled,
          interval: monitoringDefaults.healthCheck.interval,
          endpoint: agentData.healthCheckEndpoint || (endpoint ? endpoint + '/health' : null),
          method: monitoringDefaults.healthCheck.method,
          expectedStatusCode: monitoringDefaults.healthCheck.expectedStatusCode,
          failureAction: monitoringDefaults.healthCheck.failureAction
        },
        metrics: {
          collectionInterval: monitoringDefaults.metrics.collectionInterval,
          dimensions: monitoringDefaults.metrics.dimensions.slice()
        },
        alerts: {
          enabled: monitoringDefaults.alerts.enabled,
          channels: monitoringDefaults.alerts.channels.slice(),
          thresholds: JSON.parse(JSON.stringify(monitoringDefaults.alerts.thresholds))
        },
        governance: {
          policiesApplied: governancePolicies.map(function (p) { return p.id; }),
          complianceFrameworks: monitoringDefaults.compliance.frameworks.slice(),
          certificationRequired: monitoringDefaults.governance.certificationRequired,
          maxTokenBudget: monitoringDefaults.governance.maxTokenBudget,
          maxCostBudget: monitoringDefaults.governance.maxCostBudget
        },
        logging: {
          activityLogging: monitoringDefaults.logging.activityLogging,
          auditTrailEnabled: monitoringDefaults.logging.auditTrailEnabled,
          logLevel: monitoringDefaults.logging.logLevel
        }
      },

      // ── Microsoft Copilot Specific ──
      copilotConfig: connector && connector.type === 'microsoft' ? {
        copilotType: agentData.copilotType || 'standard',
        graphResourceId: agentData.graphResourceId || null,
        servicePrincipalId: agentData.servicePrincipalId || null,
        appRegistrationId: agentData.appRegistrationId || null,
        permissionScopes: agentData.permissionScopes || [],
        sensitivityLabels: agentData.sensitivityLabels || [],
        dlpPolicies: agentData.dlpPolicies || [],
        usageTracking: true,
        activityLogging: true
      } : null,

      // ── LLM Model ── (for cost calculations and token analytics)
      model: agentData.model || null
    };
  }

  function _generateAgentId() {
    var max = 0;
    _onboardedAgents.forEach(function (a) {
      var num = parseInt(a.id.replace('AGT-', ''), 10);
      if (num > max) max = num;
    });
    return 'AGT-' + String(max + 1).padStart(4, '0');
  }

  // ─── Public API ──────────────────────────────────────────

  var api = {
    // Meta
    version: CONFIG_VERSION,
    getLastUpdated: function () {
      try {
        var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return stored.lastUpdated || new Date().toISOString();
      } catch (e) { return new Date().toISOString(); }
    },

    // ── Platform Connectors ──
    platformConnectors: platformConnectors,
    getConnector: function (id) {
      return platformConnectors.find(function (c) { return c.id === id; });
    },
    getConnectorByName: function (name) {
      return platformConnectors.find(function (c) { return c.name === name; });
    },
    getConnectedPlatforms: function () {
      return platformConnectors.filter(function (c) { return c.status === 'connected'; });
    },

    // ── Microsoft Copilot ──
    microsoftCopilot: microsoftCopilotConfig,

    // ── Monitoring Methods ──
    monitoringMethods: MONITORING_METHODS,
    getMonitoringMethod: function (id) { return MONITORING_METHODS[id] || null; },

    // ── Supervisory Agents ──
    supervisoryAgents: supervisoryAgents,
    getSupervisoryAgent: function (id) {
      return supervisoryAgents.find(function (a) { return a.id === id; });
    },
    getActiveSupervisoryAgents: function () {
      return supervisoryAgents.filter(function (a) { return a.status === 'running'; });
    },

    // ── Governance Policies ──
    governancePolicies: governancePolicies,

    // ── Monitoring Defaults ──
    monitoringDefaults: monitoringDefaults,

    // ── Onboarded Agents ──
    getOnboardedAgents: function () {
      return _onboardedAgents;
    },
    getOnboardedAgent: function (id) {
      return _onboardedAgents.find(function (a) { return a.id === id; });
    },
    getAgentsByPlatform: function (platform) {
      return _onboardedAgents.filter(function (a) { return a.platform === platform; });
    },
    getAgentsByDepartment: function (dept) {
      return _onboardedAgents.filter(function (a) { return a.department === dept; });
    },
    getAgentsByRisk: function (level) {
      return _onboardedAgents.filter(function (a) { return a.riskLevel === level; });
    },
    getAgentCount: function () {
      return _onboardedAgents.length;
    },

    // ── Onboarding ──────────────────────────────────────
    // THE key method: onboard an agent, auto-updates config
    onboardAgent: function (agentData) {
      // Validate required fields
      if (!agentData.name) {
        console.error('[AETHER Config] Agent name is required');
        return null;
      }

      // Generate ID if not provided
      if (!agentData.id) {
        agentData.id = _generateAgentId();
      }

      // Check for duplicate
      var existing = _onboardedAgents.find(function (a) { return a.id === agentData.id; });
      if (existing) {
        console.warn('[AETHER Config] Agent ' + agentData.id + ' already onboarded. Use updateAgent() instead.');
        return existing;
      }

      // Create the full onboarded entry with monitoring config
      var entry = _createOnboardEntry(agentData);

      // Add to registry
      _onboardedAgents.push(entry);

      // Persist to storage
      _persist();

      // Sync to backend server
      _syncAgentToServer(entry);

      // Emit event
      if (AETHER.events && AETHER.events.emit) {
        AETHER.events.emit('AgentOnboarded', {
          agentId: entry.id,
          agentName: entry.name,
          platform: entry.platform,
          owner: entry.owner,
          department: entry.department,
          timestamp: new Date().toISOString()
        });
      }

      console.log('[AETHER Config] ✅ Agent onboarded: ' + entry.id + ' — ' + entry.name);
      console.log('[AETHER Config] Monitoring config applied. Health check: ' + entry.monitoring.healthCheck.interval + 's, Metrics: ' + entry.monitoring.metrics.collectionInterval + 's');
      console.log('[AETHER Config] Governance policies applied: ' + entry.monitoring.governance.policiesApplied.length);
      console.log('[AETHER Config] Total onboarded agents: ' + _onboardedAgents.length);

      return entry;
    },

    // ── Offboarding ──
    offboardAgent: function (agentId) {
      var index = -1;
      for (var i = 0; i < _onboardedAgents.length; i++) {
        if (_onboardedAgents[i].id === agentId) { index = i; break; }
      }
      if (index === -1) {
        console.warn('[AETHER Config] Agent ' + agentId + ' not found');
        return false;
      }

      var removed = _onboardedAgents.splice(index, 1)[0];
      _persist();

      // Sync offboard to backend
      fetch(API_BASE + '/agents/' + encodeURIComponent(agentId), {
        method: 'DELETE'
      }).then(function (r) { return r.json(); }).then(function (data) {
        console.log('[AETHER Config] Offboarded agent synced to backend: ' + agentId);
      }).catch(function (err) {
        console.warn('[AETHER Config] Backend offboard sync failed:', err.message);
      });

      if (AETHER.events && AETHER.events.emit) {
        AETHER.events.emit('AgentOffboarded', {
          agentId: removed.id,
          agentName: removed.name,
          timestamp: new Date().toISOString()
        });
      }

      console.log('[AETHER Config] ❌ Agent offboarded: ' + removed.id + ' — ' + removed.name);
      return true;
    },

    // ── Update Agent Config ──
    updateAgentConfig: function (agentId, updates) {
      var agent = _onboardedAgents.find(function (a) { return a.id === agentId; });
      if (!agent) {
        console.warn('[AETHER Config] Agent ' + agentId + ' not found');
        return null;
      }

      // Deep merge updates
      Object.keys(updates).forEach(function (key) {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          agent[key] = Object.assign({}, agent[key] || {}, updates[key]);
        } else {
          agent[key] = updates[key];
        }
      });

      agent.lastModified = new Date().toISOString();
      _persist();

      if (AETHER.events && AETHER.events.emit) {
        AETHER.events.emit('AgentConfigUpdated', {
          agentId: agent.id,
          agentName: agent.name,
          updatedFields: Object.keys(updates),
          timestamp: new Date().toISOString()
        });
      }

      console.log('[AETHER Config] 🔄 Agent config updated: ' + agentId);
      return agent;
    },

    // ── Update Monitoring Thresholds ──
    updateMonitoringThresholds: function (agentId, thresholds) {
      var agent = _onboardedAgents.find(function (a) { return a.id === agentId; });
      if (!agent) return null;

      agent.monitoring.alerts.thresholds = Object.assign(
        {},
        agent.monitoring.alerts.thresholds,
        thresholds
      );
      agent.lastModified = new Date().toISOString();
      _persist();
      return agent;
    },

    // ── Bulk Operations ──
    onboardBulk: function (agentsArray) {
      var results = [];
      agentsArray.forEach(function (agentData) {
        results.push(api.onboardAgent(agentData));
      });
      return results;
    },

    // ── Export/Import ──
    exportConfig: function () {
      return JSON.stringify({
        version: CONFIG_VERSION,
        exportDate: new Date().toISOString(),
        platformConnectors: platformConnectors,
        supervisoryAgents: supervisoryAgents,
        microsoftCopilot: microsoftCopilotConfig,
        monitoringDefaults: monitoringDefaults,
        governancePolicies: governancePolicies,
        onboardedAgents: _onboardedAgents
      }, null, 2);
    },

    importConfig: function (jsonString) {
      try {
        var imported = JSON.parse(jsonString);
        if (imported.onboardedAgents) {
          _onboardedAgents = imported.onboardedAgents;
          _persist();
          console.log('[AETHER Config] Imported ' + _onboardedAgents.length + ' agents');
          return true;
        }
      } catch (e) {
        console.error('[AETHER Config] Import failed:', e);
      }
      return false;
    },

    // ── Clear All Onboarded Agents ──
    clearAllAgents: function () {
      _onboardedAgents = [];
      _persist();
      console.log('[AETHER Config] All onboarded agents cleared.');
      return true;
    },

    // ── Statistics ──
    getStats: function () {
      var byPlatform = {};
      var byDepartment = {};
      var byRisk = { Low: 0, Medium: 0, High: 0, Critical: 0 };

      _onboardedAgents.forEach(function (a) {
        byPlatform[a.platform] = (byPlatform[a.platform] || 0) + 1;
        byDepartment[a.department] = (byDepartment[a.department] || 0) + 1;
        if (byRisk[a.riskLevel] !== undefined) byRisk[a.riskLevel]++;
      });

      return {
        totalAgents: _onboardedAgents.length,
        byPlatform: byPlatform,
        byDepartment: byDepartment,
        byRisk: byRisk,
        activeSupervisoryAgents: supervisoryAgents.filter(function (a) { return a.status === 'running'; }).length,
        connectedPlatforms: platformConnectors.filter(function (c) { return c.status === 'connected'; }).length,
        totalPolicies: governancePolicies.length
      };
    },

    // ── Sync From Server ──
    syncFromServer: function (callback) {
      _loadFromServer(function (serverAgents) {
        serverAgents = serverAgents || [];
        var serverAgentIds = serverAgents.map(function (sa) { return sa.id; });
        var updatedCount = 0;

        // 1. Backend has agents — import or update them
        for (var i = 0; i < serverAgents.length; i++) {
          var sa = serverAgents[i];
          var localAgent = _onboardedAgents.find(function (a) { return a.id === sa.id; });
          if (!localAgent) {
            _onboardedAgents.push(_createOnboardEntry(sa));
            updatedCount++;
          } else {
            // Update existing local agent with backend values if they changed
            var modified = false;
            var fields = ['monthlyCost', 'tasksExecuted', 'tokenUsage', 'riskScore', 'certificationStatus', 'status', 'availability', 'avgLatency', 'model'];
            fields.forEach(function (f) {
              if (sa[f] !== undefined && sa[f] !== localAgent[f]) {
                localAgent[f] = sa[f];
                modified = true;
              }
            });
            if (modified) updatedCount++;
          }
        }

        // 2. Local has agents but backend doesn't — sync them to backend
        var syncedCount = 0;
        for (var j = 0; j < _onboardedAgents.length; j++) {
          var localAgent = _onboardedAgents[j];
          if (serverAgentIds.indexOf(localAgent.id) === -1) {
            _syncAgentToServer(localAgent);
            syncedCount++;
          }
        }

        if (updatedCount > 0) {
          _persist();
        }

        if (callback) callback(null, { updated: updatedCount, synced: syncedCount });
      });
    },

    // ── Initialize ──
    init: function () {
      // Load previously onboarded agents from localStorage
      _loadPersistedAgents();
      // Also try loading from backend (async)
      api.syncFromServer(function (err, stats) {
        if (stats && (stats.updated > 0 || stats.synced > 0)) {
          if (AETHER.app && typeof AETHER.app.navigate === 'function') {
            AETHER.app.navigate();
          }
        }
      });
      console.log('[AETHER Config] Initialized. ' + _onboardedAgents.length + ' agents loaded. ' + supervisoryAgents.length + ' supervisory agents configured.');
    }
  };

  return api;
})();
