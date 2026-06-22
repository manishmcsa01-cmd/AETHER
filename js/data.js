/* ═══════════════════════════════════════════════════════════════
   AETHER Data Module
   Enterprise AI Workforce Platform — Mock Data
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};

AETHER.data = (function () {
  // ─── Seeded Random ────────────────────────────────────────
  let _seed = 42;
  function seededRandom() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
  }
  function randInt(min, max) { return Math.floor(seededRandom() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  // ─── Constants ────────────────────────────────────────────
  const PLATFORMS = [
    { name: 'Microsoft Copilot', count: 0, color: '#3b82f6', icon: '🔷' },
    { name: 'Salesforce Agentforce', count: 0, color: '#06b6d4', icon: '☁️' },
    { name: 'Databricks', count: 0, color: '#8b5cf6', icon: '🔶' },
    { name: 'Snowflake Cortex', count: 0, color: '#10b981', icon: '❄️' },
    { name: 'OpenAI', count: 0, color: '#f59e0b', icon: '🟢' },
    { name: 'Custom Agents', count: 0, color: '#ef4444', icon: '⚙️' }
  ];

  const DEPARTMENTS = [
    'Engineering', 'Sales', 'Finance', 'HR', 'Operations',
    'Legal', 'Marketing', 'Customer Success', 'IT', 'Risk & Compliance'
  ];

  const PREFIXES = [
    'Procurement', 'Sales', 'Claims', 'Compliance', 'Finance',
    'HR', 'Legal', 'Customer', 'Data', 'Security',
    'Marketing', 'Operations', 'Analytics', 'Support', 'Billing',
    'Inventory', 'Shipping', 'Quality', 'Risk', 'Audit',
    'Tax', 'Payroll', 'Recruiting', 'Training', 'Budget'
  ];

  const SUFFIXES = [
    'Assistant', 'Analyzer', 'Processor', 'Agent', 'Coordinator',
    'Manager', 'Optimizer', 'Monitor', 'Validator', 'Reviewer',
    'Router', 'Classifier', 'Extractor', 'Generator', 'Recommender'
  ];

  const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Lisa', 'David', 'Emma', 'Robert', 'Anna', 'John', 'Maria', 'Alex', 'Priya', 'Wei', 'Carlos', 'Yuki'];
  const LAST_NAMES = ['Smith', 'Chen', 'Patel', 'Williams', 'Garcia', 'Johnson', 'Kim', 'Taylor', 'Brown', 'Lee', 'Singh', 'Müller', 'Tanaka', 'Rodriguez', 'Nguyen'];

  const PURPOSES = {
    'Procurement': 'Automates purchase order processing and vendor management',
    'Sales': 'Manages pipeline, lead scoring, and opportunity tracking',
    'Claims': 'Processes insurance claims and manages adjudication workflows',
    'Compliance': 'Monitors regulatory compliance and generates audit reports',
    'Finance': 'Handles financial reconciliation and reporting automation',
    'HR': 'Manages employee onboarding and HR workflow automation',
    'Legal': 'Reviews contracts and manages legal document workflows',
    'Customer': 'Provides intelligent customer support and case routing',
    'Data': 'Performs data quality analysis and pipeline monitoring',
    'Security': 'Monitors security events and manages threat detection',
    'Marketing': 'Automates campaign management and analytics reporting',
    'Operations': 'Optimizes operational workflows and resource allocation',
    'Analytics': 'Generates business intelligence and predictive analytics',
    'Support': 'Handles tier-1 support tickets and knowledge management',
    'Billing': 'Processes invoices and manages payment workflows',
    'Inventory': 'Manages inventory tracking and demand forecasting',
    'Shipping': 'Optimizes shipping routes and logistics management',
    'Quality': 'Performs quality assurance and defect tracking',
    'Risk': 'Assesses and monitors enterprise risk factors',
    'Audit': 'Conducts automated audit procedures and evidence collection',
    'Tax': 'Manages tax compliance and filing automation',
    'Payroll': 'Processes payroll calculations and disbursements',
    'Recruiting': 'Screens candidates and manages recruitment pipeline',
    'Training': 'Delivers personalized training and tracks completion',
    'Budget': 'Manages budget planning and variance analysis'
  };

  // ─── Agent Generation ────────────────────────────────────
  function generateAgents(count) {
    const agents = [];
    let platformIdx = 0;
    let platformUsed = 0;

    for (let i = 0; i < count; i++) {
      while (platformUsed >= PLATFORMS[platformIdx].count) {
        platformIdx++;
        platformUsed = 0;
      }
      platformUsed++;

      const prefix = PREFIXES[i % PREFIXES.length];
      const suffix = SUFFIXES[Math.floor(i / PREFIXES.length) % SUFFIXES.length];
      const variant = Math.floor(i / (PREFIXES.length * SUFFIXES.length)) + 1;
      const riskScore = randInt(5, 98);
      const riskLevel = riskScore >= 80 ? 'Critical' : riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';
      const isActive = seededRandom() > 0.04;
      const daysAgo = randInt(0, 2);
      const hoursAgo = randInt(0, 23);

      agents.push({
        id: 'AGT-' + String(i + 1).padStart(4, '0'),
        name: prefix + ' ' + suffix + (variant > 1 ? ' v' + variant : ''),
        platform: PLATFORMS[platformIdx].name,
        platformColor: PLATFORMS[platformIdx].color,
        owner: pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES),
        department: pick(DEPARTMENTS),
        status: isActive ? 'Active' : 'Inactive',
        riskScore: riskScore,
        riskLevel: riskLevel,
        criticality: pick(['Low', 'Medium', 'High', 'Critical']),
        certificationStatus: seededRandom() > 0.12 ? 'Certified' : 'Pending',
        lastSeen: daysAgo === 0 ? hoursAgo + 'h ago' : daysAgo + 'd ago',
        createdDate: '2024-' + String(randInt(1, 12)).padStart(2, '0') + '-' + String(randInt(1, 28)).padStart(2, '0'),
        monthlyCost: randInt(200, 5200),
        tasksExecuted: randInt(1000, 95000),
        successRate: (94 + seededRandom() * 6).toFixed(1),
        purpose: PURPOSES[prefix] || 'General-purpose enterprise automation agent',
        piiAccess: seededRandom() > 0.6,
        financialAccess: seededRandom() > 0.65,
        availability: (98 + seededRandom() * 2).toFixed(2),
        avgLatency: randInt(50, 500),
        connectedSystems: randInt(2, 12),
        tokenUsage: randInt(100000, 5000000)
      });
    }

    return agents;
  }

  const agents = generateAgents(0); // Start empty — add agents via onboarding

  // ─── Time Series Data ────────────────────────────────────
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  const trends = {
    agentGrowth: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    aiSpend: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      budget: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    reliability: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      sla: Array(12).fill(99.0)
    },
    compliance: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    costPerAgent: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    riskTrend: {
      labels: MONTHS,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  // ─── Risk Distribution ───────────────────────────────────
  const riskDistribution = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    data: [0, 0, 0, 0],
    colors: ['#10b981', '#f59e0b', '#ef4444', '#dc2626']
  };

  // ─── Platform Distribution ───────────────────────────────
  const platformDistribution = {
    labels: PLATFORMS.map(p => p.name),
    data: [0, 0, 0, 0, 0, 0],
    colors: PLATFORMS.map(p => p.color)
  };

  // ─── KPIs ────────────────────────────────────────────────
  const kpis = {
    totalAgents: 0,
    discoveryCoverage: 0,
    complianceScore: 0,
    avgReliability: 0,
    monthlySpend: 0,
    workforceROI: 0,
    highRiskAgents: 0,
    policyViolations: 0,
    unknownAgents: 0,
    discoverySLA: '< 24h',
    costPerAgent: 0,
    costPerTask: 0,
    tokenSpend: 0,
    infraCost: 0,
    availability: 0,
    successRate: 0,
    failureRate: 0,
    avgLatency: 0,
    piiExposure: 0,
    criticalIncidents: 0,
    budgetEfficiency: 0,
    avgRiskScore: 0,
    complianceAssessed: false,
    riskAssessed: false,
    activePolicies: 8,
    autoActionsToday: 0,
    policyAdherence: 100,
    certifiedAgents: 0,
    pendingCertification: 0,
    complianceFindings: 0,
    financialAccess: 0
  };

  // ─── Governance Policies (definitions only — no violations) ──
  const policies = [
    { id: 'POL-001', name: 'Payment Threshold', condition: 'payment.amount > $100,000', action: 'Escalate', actionType: 'warning', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-002', name: 'Missing Approval', condition: 'approval.status == null', action: 'Reject', actionType: 'danger', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-003', name: 'PII Access Control', condition: 'pii.access && !approval.granted', action: 'Block', actionType: 'danger', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-004', name: 'Cost Limit', condition: 'task.cost > $1,000', action: 'Review', actionType: 'warning', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-005', name: 'Data Export Restriction', condition: 'export.target == external', action: 'Block', actionType: 'danger', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-006', name: 'After Hours Execution', condition: 'time.hour < 6 || time.hour > 22', action: 'Log & Alert', actionType: 'info', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-007', name: 'Model Version Control', condition: 'model.version != approved_version', action: 'Reject', actionType: 'danger', status: 'Active', violations: 0, lastTriggered: 'Never' },
    { id: 'POL-008', name: 'Cross-Region Transfer', condition: 'data.region != agent.region', action: 'Escalate', actionType: 'warning', status: 'Active', violations: 0, lastTriggered: 'Never' }
  ];

  const policyViolations = [];

  const governanceActions = [];

  // ─── Compliance Frameworks (definitions only — zero scores) ──
  const complianceFrameworks = [
    { name: 'SOC 2', score: 0, findings: 0, controls: 87, passedControls: 0, icon: '🛡️', color: '#3b82f6', trend: 'stable' },
    { name: 'ISO 27001', score: 0, findings: 0, controls: 114, passedControls: 0, icon: '📋', color: '#8b5cf6', trend: 'stable' },
    { name: 'GDPR', score: 0, findings: 0, controls: 52, passedControls: 0, icon: '🇪🇺', color: '#06b6d4', trend: 'stable' },
    { name: 'SOX', score: 0, findings: 0, controls: 68, passedControls: 0, icon: '📊', color: '#f59e0b', trend: 'stable' },
    { name: 'HIPAA', score: 0, findings: 0, controls: 45, passedControls: 0, icon: '🏥', color: '#10b981', trend: 'stable' }
  ];

  const complianceFindings = [];

  // ─── Benchmark Data ──────────────────────────────────────
  const benchmarks = [
    { metric: 'Agent Reliability', company: 0, industry: 97.2, unit: '%' },
    { metric: 'Agent Utilization', company: 0, industry: 72.0, unit: '%' },
    { metric: 'Cost Per Task', company: 0, industry: 0.18, unit: '$' },
    { metric: 'Compliance Score', company: 0, industry: 89.0, unit: '%' },
    { metric: 'Mean Time to Resolve', company: 0, industry: 8.5, unit: 'hrs' },
    { metric: 'Discovery Coverage', company: 0, industry: 82.0, unit: '%' },
    { metric: 'Policy Adherence', company: 0, industry: 91.0, unit: '%' },
    { metric: 'Avg Response Time', company: 0, industry: 285, unit: 'ms' }
  ];

  // ─── Business Impact ─────────────────────────────────────
  const businessImpact = [];

  // ─── Cost Breakdown ──────────────────────────────────────
  const costBreakdown = {
    byPlatform: {
      labels: PLATFORMS.map(p => p.name),
      data: [0, 0, 0, 0, 0, 0],
      colors: PLATFORMS.map(p => p.color)
    },
    topAgents: [],
    recommendations: []
  };

  // ─── Reliability Data ────────────────────────────────────
  const reliabilityData = {
    topFailing: [],
    incidents: [],
    reliabilityByPlatform: {
      labels: PLATFORMS.map(p => p.name),
      data: [0, 0, 0, 0, 0, 0],
      colors: PLATFORMS.map(p => p.color)
    }
  };

  // ─── Identity Data ───────────────────────────────────────
  const identityData = {
    summary: {
      totalIdentities: 0,
      activeCredentials: 0,
      pendingRotation: 0,
      expiringSoon: 0,
      revokedThisMonth: 0
    },
    credentials: []
  };

  // ─── Days for 30-day charts ──────────────────────────────
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return (d.getMonth() + 1) + '/' + d.getDate();
  });

  const reliabilityDaily = last30Days.map(() => 0);
  const latencyDaily = last30Days.map(() => 0);

  // ─── Lookup helpers for LLM results ──────────────────────
  // Pull real data from backend agent results (AETHER.runtime.getResults)
  function _getAgentRisk(agentId, agentName) {
    if (!AETHER.runtime || !AETHER.runtime.getResults) return null;
    var riskData = AETHER.runtime.getResults('risk');
    if (!riskData || !riskData.agents) return null;
    for (var i = 0; i < riskData.agents.length; i++) {
      var ra = riskData.agents[i];
      if (ra.id === agentId || ra.name === agentName) return ra;
    }
    return null;
  }

  function _getAgentCost(agentId, agentName) {
    if (!AETHER.runtime || !AETHER.runtime.getResults) return null;
    var costData = AETHER.runtime.getResults('cost');
    if (!costData || !costData.top_spenders) return null;
    var spenders = costData.all_agents_summary || costData.top_spenders || [];
    for (var i = 0; i < spenders.length; i++) {
      var sp = spenders[i];
      if (sp.name === agentName || sp.id === agentId) return sp;
    }
    return null;
  }

  function _getAgentHealth(agentId, agentName) {
    if (!AETHER.runtime || !AETHER.runtime.getResults) return null;
    var healthData = AETHER.runtime.getResults('health');
    if (!healthData || !healthData.agents) return null;
    for (var i = 0; i < healthData.agents.length; i++) {
      var ha = healthData.agents[i];
      if (ha.id === agentId || ha.name === agentName) return ha;
    }
    return null;
  }

  function _getAgentCompliance(agentId, agentName) {
    if (!AETHER.runtime || !AETHER.runtime.getResults) return null;
    var compData = AETHER.runtime.getResults('compliance');
    if (!compData || !compData.agent_results) return null;
    for (var i = 0; i < compData.agent_results.length; i++) {
      var ca = compData.agent_results[i];
      if (ca.agent_id === agentId || ca.agent_name === agentName) return ca;
    }
    return null;
  }

  // ─── Onboarded Agent Converter ───────────────────────────
  // Converts a config-onboarded entry using REAL LLM agent results.
  // Falls back to onboarding config values if no LLM results exist yet.
  function convertOnboardedAgent(entry) {
    var agentId = entry.id || 'AGT-NEW';
    var agentName = entry.name || 'Unnamed Agent';

    // Look up real results from backend LLM agents
    var riskInfo = _getAgentRisk(agentId, agentName);
    var costInfo = _getAgentCost(agentId, agentName);
    var healthInfo = _getAgentHealth(agentId, agentName);
    var compInfo = _getAgentCompliance(agentId, agentName);

    // Risk: LLM risk_score > onboarding config > 0
    // If not assessed, default to 0 and Low risk level to keep everything in sync
    var riskScore = riskInfo ? (riskInfo.risk_score || 0) : 0;
    var riskLevel = riskInfo ? (riskInfo.risk_level || 'Low') : 'Low';
    var criticality = riskInfo ? (riskScore >= 80 ? 'Critical' : riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low') : (entry.criticality || 'Low');

    // Cost: LLM cost data > onboarding config values
    var monthlyCost = costInfo ? (costInfo.cost || 0) : (parseFloat(entry.monthlyCost) || 0);
    var tasksExecuted = costInfo ? (costInfo.tasks || 0) : (parseInt(entry.tasksExecuted) || 0);
    var tokenUsage = costInfo ? (costInfo.tokenUsage || 0) : (parseInt(entry.tokenUsage) || 0);

    // Health: LLM health > onboarding config
    var availability = healthInfo ? (healthInfo.health_score || 0).toFixed(1) : (entry.availability || '99.9');
    var avgLatency = healthInfo ? (healthInfo.response_time_ms || 0) : (parseFloat(entry.avgLatency) || 0);
    var healthStatus = healthInfo ? (healthInfo.health_status || 'Active') : 'Active';

    // Success rate: operational metric from onboarding config (NOT compliance)
    var successRate = entry.successRate || '99.5';

    // Compliance: separate concept — LLM compliance overall_score
    var complianceOverall = compInfo ? (compInfo.overall_score || 0) : -1; // -1 = not assessed

    // Certification: based on compliance score
    var certStatus = 'Not Assessed';
    if (compInfo) {
      certStatus = (compInfo.overall_score || 0) >= 80 ? 'Certified' : 'Pending';
    }

    return {
      id: agentId,
      name: agentName,
      platform: entry.platform || 'Custom',
      platformColor: '#ef4444',
      owner: entry.owner || 'Unknown',
      department: entry.department || 'Engineering',
      status: healthStatus === 'Unhealthy' || healthStatus === 'Unreachable' ? 'Inactive' : 'Active',
      riskScore: riskScore,
      riskLevel: riskLevel,
      criticality: criticality,
      certificationStatus: certStatus,
      lastSeen: '0h ago',
      createdDate: new Date().toISOString().slice(0, 10),
      monthlyCost: monthlyCost,
      tasksExecuted: tasksExecuted,
      successRate: successRate,
      purpose: entry.purpose || 'Custom agent registered via AETHER onboarding',
      piiAccess: entry.piiAccess || false,
      financialAccess: entry.financialAccess || false,
      availability: availability,
      avgLatency: Math.round(avgLatency),
      connectedSystems: 0,
      tokenUsage: tokenUsage,
      // Extra fields from onboarding
      endpoint: entry.endpoint || '',
      environment: entry.environment || 'Production',
      region: entry.region || 'us-east-1',
      runtime: entry.runtime || '',
      monitoringMethod: entry.monitoringMethod || 'sdk-push',
      _isOnboarded: true,
      // LLM result flags
      _hasRiskData: !!riskInfo,
      _hasCostData: !!costInfo,
      _hasHealthData: !!healthInfo,
      _hasComplianceData: !!compInfo,
      _complianceScore: complianceOverall,
      _riskFactors: riskInfo ? (riskInfo.risk_factors || []) : [],
      _riskReasoning: riskInfo ? (riskInfo.reasoning || '') : '',
      _healthAssessment: healthInfo ? (healthInfo.assessment || '') : ''
    };
  }

  // Returns all onboarded agents from AETHER.config
  function getAllAgents() {
    var all = agents.slice(); // copy mock agents
    if (AETHER.config && typeof AETHER.config.getOnboardedAgents === 'function') {
      var onboarded = AETHER.config.getOnboardedAgents();
      for (var i = 0; i < onboarded.length; i++) {
        // Avoid duplicates by ID
        var exists = false;
        for (var j = 0; j < all.length; j++) {
          if (all[j].id === onboarded[i].id) { exists = true; break; }
        }
        if (!exists) {
          all.push(convertOnboardedAgent(onboarded[i]));
        }
      }
    }
    return all;
  }

  function computeDynamicTrends() {
    var all = getAllAgents();
    var n = all.length;
    var k = kpis;
    try {
      if (AETHER.data && typeof AETHER.data.computeKPIs === 'function') {
        k = AETHER.data.computeKPIs();
      }
    } catch(e) {}

    var totalAgents = k.totalAgents || 0;
    var monthlySpend = k.monthlySpend || 0;
    var avgReliability = parseFloat(k.avgReliability) || 0;
    var complianceScore = k.complianceScore || 0;
    var costPerAgent = k.costPerAgent || 0;
    var highRiskAgents = k.highRiskAgents || 0;

    var growthData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (totalAgents > 0) {
      growthData = [
        Math.max(1, Math.round(totalAgents * 0.2)),
        Math.max(1, Math.round(totalAgents * 0.3)),
        Math.max(1, Math.round(totalAgents * 0.3)),
        Math.max(1, Math.round(totalAgents * 0.4)),
        Math.max(2, Math.round(totalAgents * 0.5)),
        Math.max(2, Math.round(totalAgents * 0.5)),
        Math.max(3, Math.round(totalAgents * 0.6)),
        Math.max(3, Math.round(totalAgents * 0.7)),
        Math.max(4, Math.round(totalAgents * 0.8)),
        Math.max(4, Math.round(totalAgents * 0.9)),
        Math.max(4, Math.round(totalAgents * 0.9)),
        totalAgents
      ];
    }

    var spendData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var budgetData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (monthlySpend > 0) {
      spendData = [
        Math.round(monthlySpend * 0.3),
        Math.round(monthlySpend * 0.45),
        Math.round(monthlySpend * 0.4),
        Math.round(monthlySpend * 0.55),
        Math.round(monthlySpend * 0.6),
        Math.round(monthlySpend * 0.5),
        Math.round(monthlySpend * 0.7),
        Math.round(monthlySpend * 0.8),
        Math.round(monthlySpend * 0.75),
        Math.round(monthlySpend * 0.85),
        Math.round(monthlySpend * 0.9),
        Math.round(monthlySpend)
      ];
      budgetData = spendData.map(function(s) {
        return Math.max(Math.round(s * 1.15), 1000);
      });
    }

    var reliabilityData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (totalAgents > 0) {
      reliabilityData = [98.2, 98.5, 99.0, 98.7, 99.1, 99.3, 98.9, 99.2, 99.5, 99.0, 99.4, avgReliability];
    }

    var complianceData = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    if (totalAgents > 0) {
      complianceData = [
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.85))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.88))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.87))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.90))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.92))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.91))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.93))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.95))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.94))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.97))),
        Math.min(100, Math.max(70, Math.round(complianceScore * 0.98))),
        complianceScore
      ];
    }

    var cpaData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (costPerAgent > 0) {
      cpaData = [
        Math.round(costPerAgent * 1.3),
        Math.round(costPerAgent * 1.25),
        Math.round(costPerAgent * 1.2),
        Math.round(costPerAgent * 1.15),
        Math.round(costPerAgent * 1.1),
        Math.round(costPerAgent * 1.15),
        Math.round(costPerAgent * 1.05),
        Math.round(costPerAgent * 1.1),
        Math.round(costPerAgent * 1.02),
        Math.round(costPerAgent * 1.0),
        Math.round(costPerAgent * 0.98),
        Math.round(costPerAgent)
      ];
    }

    var riskTrendData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (totalAgents > 0) {
      riskTrendData = [
        Math.round(highRiskAgents * 0.2),
        Math.round(highRiskAgents * 0.4),
        Math.round(highRiskAgents * 0.3),
        Math.round(highRiskAgents * 0.5),
        Math.round(highRiskAgents * 0.5),
        Math.round(highRiskAgents * 0.4),
        Math.round(highRiskAgents * 0.6),
        Math.round(highRiskAgents * 0.7),
        Math.round(highRiskAgents * 0.6),
        Math.round(highRiskAgents * 0.8),
        Math.round(highRiskAgents * 0.9),
        highRiskAgents
      ];
    }

    return {
      agentGrowth: { labels: MONTHS, data: growthData },
      aiSpend: { labels: MONTHS, data: spendData, budget: budgetData },
      reliability: { labels: MONTHS, data: reliabilityData, sla: Array(12).fill(99.0) },
      compliance: { labels: MONTHS, data: complianceData },
      costPerAgent: { labels: MONTHS, data: cpaData },
      riskTrend: { labels: MONTHS, data: riskTrendData }
    };
  }

  // ─── Public API ──────────────────────────────────────────
  return {
    kpis,
    agents,
    platforms: PLATFORMS,
    departments: DEPARTMENTS,
    get trends() { return computeDynamicTrends(); },
    get dbStats() {
      if (AETHER.runtime && typeof AETHER.runtime.getDbStats === 'function') {
        return AETHER.runtime.getDbStats();
      }
      return {
        active_count: 0,
        deboarded_count: 0,
        cumulative_onboarded: 0,
        cumulative_tasks: 0,
        cumulative_spend: 0,
        cumulative_roi: 0,
        deboarded_agents: []
      };
    },
    riskDistribution,
    platformDistribution,
    policies,
    policyViolations,
    governanceActions,
    complianceFrameworks,
    complianceFindings,
    benchmarks,
    businessImpact,
    costBreakdown,
    reliabilityData,
    identityData,
    last30Days,
    reliabilityDaily,
    latencyDaily,
    months: MONTHS,

    // ─── Agent Accessors ──────────────────────────────────
    getAllAgents: getAllAgents,

    getAgent: function (id) {
      return getAllAgents().find(function (a) { return a.id === id; });
    },

    getHighRiskAgents: function () {
      return getAllAgents().filter(function (a) { return a.riskScore >= 60; })
        .sort(function (a, b) { return b.riskScore - a.riskScore; });
    },

    getTopAgentsByCost: function (n) {
      return getAllAgents().slice().sort(function (a, b) { return b.monthlyCost - a.monthlyCost; })
        .slice(0, n || 10);
    },

    getAgentsByPlatform: function (platform) {
      return getAllAgents().filter(function (a) { return a.platform === platform; });
    },

    getOnboardedAgents: function () {
      return getAllAgents().filter(function (a) { return a._isOnboarded; });
    },

    getTotalAgentCount: function () {
      return getAllAgents().length;
    },

    // ═══════════════════════════════════════════════════════
    // LIVE COMPUTATION ENGINE
    // All metrics computed from onboarded agents only
    // ═══════════════════════════════════════════════════════

    // ─── Compute KPIs from live agents ────────────────────
    computeKPIs: function () {
      var all = getAllAgents();
      var n = all.length;
      if (n === 0) return kpis; // return zeros

      // Pull aggregate LLM results if available
      var costResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('cost') : null;
      var riskResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('risk') : null;
      var healthResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('health') : null;
      var compResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('compliance') : null;

      // ── Cost ──────────────────────────────────────
      // LLM cost agent total > sum of per-agent config values
      var totalCost = 0, totalTasks = 0;
      if (costResults && costResults.total_monthly_spend && costResults.all_agents_summary && costResults.all_agents_summary.length === n) {
        totalCost = costResults.total_monthly_spend;
        totalTasks = costResults.total_tasks || 0;
      } else {
        for (var i = 0; i < n; i++) {
          totalCost += (parseFloat(all[i].monthlyCost) || 0);
          totalTasks += (parseInt(all[i].tasksExecuted) || 0);
        }
      }

      // ── Risk ──────────────────────────────────────
      // LLM risk agent counts > per-agent riskScore
      var highRisk = 0, incidents = 0, avgRiskScore = 0;
      if (riskResults && riskResults.agents && riskResults.agents.length === n) {
        highRisk = riskResults.high_risk_count || 0;
        avgRiskScore = riskResults.avg_risk_score || 0;
        for (var r = 0; r < riskResults.agents.length; r++) {
          if ((riskResults.agents[r].risk_score || 0) >= 80) incidents++;
        }
      } else {
        var totalRisk = 0;
        for (var ri = 0; ri < n; ri++) {
          var rs = all[ri].riskScore || 0;
          totalRisk += rs;
          if (rs >= 60) highRisk++;
          if (rs >= 80) incidents++;
        }
        avgRiskScore = n > 0 ? Math.round(totalRisk / n) : 0;
      }

      // ── Health / Availability ─────────────────────
      // LLM health agent scores > per-agent config values
      var totalAvail = 0, totalLatency = 0, healthN = n;
      if (healthResults && healthResults.agents && healthResults.agents.length === n) {
        healthN = healthResults.agents.length;
        for (var h = 0; h < healthN; h++) {
          totalAvail += (healthResults.agents[h].health_score || 0);
          totalLatency += (healthResults.agents[h].response_time_ms || 0);
        }
      } else {
        for (var hi = 0; hi < n; hi++) {
          totalAvail += parseFloat(all[hi].availability || 0);
          totalLatency += (parseFloat(all[hi].avgLatency) || 0);
        }
      }

      // ── Compliance Score ──────────────────────────
      // ONLY from LLM compliance agent. If not run, show local rule-based fallback
      var complianceScore = -1; // -1 means not assessed
      if (compResults && compResults.agent_results && compResults.agent_results.length === n) {
        var totalCompScore = 0;
        for (var c = 0; c < compResults.agent_results.length; c++) {
          totalCompScore += (compResults.agent_results[c].overall_score || 0);
        }
        complianceScore = Math.round(totalCompScore / compResults.agent_results.length);
      } else if (compResults && compResults.frameworks && compResults.frameworks.length > 0 && compResults.agent_results && compResults.agent_results.length === n) {
        // Fallback to framework average
        var fwTotal = 0;
        for (var fw = 0; fw < compResults.frameworks.length; fw++) {
          fwTotal += (compResults.frameworks[fw].avg_score || 0);
        }
        complianceScore = Math.round(fwTotal / compResults.frameworks.length);
      }

      if (complianceScore === -1) {
        var localComp = AETHER.data && typeof AETHER.data.computeCompliance === 'function' ? AETHER.data.computeCompliance() : null;
        if (localComp && localComp.frameworks && localComp.frameworks.length > 0) {
          var localSum = 0;
          for (var lf = 0; lf < localComp.frameworks.length; lf++) {
            localSum += localComp.frameworks[lf].score;
          }
          complianceScore = Math.round(localSum / localComp.frameworks.length);
        } else {
          complianceScore = 100;
        }
      }

      // ── Success Rate (operational, separate from compliance) ─
      var totalSuccess = 0;
      for (var si = 0; si < n; si++) {
        totalSuccess += parseFloat(all[si].successRate || 0);
      }
      var avgSuccessRate = n > 0 ? (totalSuccess / n) : 0;

      // ── PII count ─────────────────────────────────
      var piiCount = 0;
      for (var p = 0; p < n; p++) {
        if (all[p].piiAccess) piiCount++;
      }

      // ── Financial Access count ────────────────────
      var financialCount = 0;
      for (var fi = 0; fi < n; fi++) {
        if (all[fi].financialAccess) financialCount++;
      }

      // ── Certification status counts ───────────────
      var certifiedCount = 0;
      var pendingCount = 0;
      for (var ci = 0; ci < n; ci++) {
        if (all[ci].certificationStatus === 'Certified') {
          certifiedCount++;
        } else {
          pendingCount++;
        }
      }

      // ── Governance Violations & Actions ───────────
      var govData = AETHER.data && typeof AETHER.data.computeViolations === 'function' ? AETHER.data.computeViolations() : { violations: [], actions: [] };
      var violationsN = govData.violations.length;
      var actionsN = govData.actions.length;

      // ── Compliance Findings ───────────────────────
      var compData = AETHER.data && typeof AETHER.data.computeCompliance === 'function' ? AETHER.data.computeCompliance() : { frameworks: [], findings: [] };
      var complianceFindingsN = compData.findings.length;

      var avgAvail = healthN > 0 ? (totalAvail / healthN).toFixed(1) : 0;
      var avgLat = healthN > 0 ? Math.round(totalLatency / healthN) : 0;

      // Budget efficiency: based on ROI, not compliance
      var budgetEff = totalCost > 0 ? Math.min(100, Math.round((totalTasks * 0.1) / totalCost * 100)) : 0;

      return {
        totalAgents: n,
        discoveryCoverage: 100,
        complianceScore: complianceScore >= 0 ? complianceScore : 0,
        complianceAssessed: complianceScore >= 0,
        avgRiskScore: avgRiskScore,
        riskAssessed: !!(riskResults && riskResults.agents),
        avgReliability: avgAvail,
        monthlySpend: totalCost,
        workforceROI: n > 0 ? Math.round((totalTasks * 0.1) / Math.max(totalCost, 1) * 100) : 0,
        highRiskAgents: highRisk,
        policyViolations: violationsN,
        unknownAgents: 0,
        discoverySLA: '< 24h',
        costPerAgent: n > 0 ? Math.round(totalCost / n) : 0,
        costPerTask: totalTasks > 0 ? (totalCost / totalTasks).toFixed(2) : 0,
        tokenSpend: Math.round(totalCost * 0.75),
        infraCost: Math.round(totalCost * 0.25),
        availability: avgAvail,
        successRate: avgSuccessRate.toFixed(1),
        failureRate: (100 - avgSuccessRate).toFixed(1),
        avgLatency: avgLat,
        piiExposure: piiCount,
        criticalIncidents: incidents,
        budgetEfficiency: budgetEff,
        // New governance & registry KPIs
        activePolicies: policies.length,
        autoActionsToday: actionsN,
        policyAdherence: n > 0 ? parseFloat(Math.max(0, 100 - (violationsN / n * 100)).toFixed(1)) : 100,
        certifiedAgents: certifiedCount,
        pendingCertification: pendingCount,
        complianceFindings: complianceFindingsN,
        financialAccess: financialCount
      };
    },

    // ─── Compute risk distribution from live agents ───────
    computeRiskDistribution: function () {
      // Try to use LLM risk results
      var riskResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('risk') : null;

      if (riskResults && riskResults.distribution && riskResults.agents && riskResults.agents.length === getAllAgents().length) {
        return {
          labels: ['Low', 'Medium', 'High', 'Critical'],
          data: [
            riskResults.distribution.Low || 0,
            riskResults.distribution.Medium || 0,
            riskResults.distribution.High || 0,
            riskResults.distribution.Critical || 0
          ],
          colors: ['#10b981', '#f59e0b', '#ef4444', '#dc2626']
        };
      }

      // Fallback: compute from agent-level data
      var all = getAllAgents();
      var low = 0, med = 0, high = 0, crit = 0;
      for (var i = 0; i < all.length; i++) {
        var s = all[i].riskScore || 0;
        if (s >= 80) crit++;
        else if (s >= 60) high++;
        else if (s >= 30) med++;
        else low++;
      }
      return { labels: ['Low', 'Medium', 'High', 'Critical'], data: [low, med, high, crit], colors: ['#10b981', '#f59e0b', '#ef4444', '#dc2626'] };
    },

    // ─── Compute platform distribution from live agents ───
    computePlatformDistribution: function () {
      var all = getAllAgents();
      var counts = {};
      PLATFORMS.forEach(function (p) { counts[p.name] = 0; });
      for (var i = 0; i < all.length; i++) {
        var plat = all[i].platform || 'Custom Agents';
        if (counts[plat] !== undefined) counts[plat]++;
        else {
          // Add new platform if not in list
          counts[plat] = (counts[plat] || 0) + 1;
        }
      }
      var labels = Object.keys(counts);
      var data = labels.map(function (l) { return counts[l]; });
      var colors = labels.map(function (l) {
        var p = PLATFORMS.find(function (pp) { return pp.name === l; });
        return p ? p.color : '#ef4444';
      });
      return { labels: labels, data: data, colors: colors };
    },

    // ─── Evaluate governance violations for live agents ───
    computeViolations: function () {
      var all = getAllAgents();
      var violations = [];
      var actions = [];

      for (var i = 0; i < all.length; i++) {
        var a = all[i];
        // Check PII access without proper controls
        if (a.piiAccess) {
          violations.push({
            id: 'VIO-' + String(violations.length + 1).padStart(3, '0'),
            policy: 'PII Access Control',
            agent: a.name,
            agentId: a.id,
            timestamp: 'On onboard',
            severity: 'High',
            details: a.name + ' has PII access enabled — verify DLP controls',
            status: 'Open'
          });
          actions.push({ time: 'On onboard', action: 'PII access flagged for review', agent: a.name, type: 'warning' });
        }
        // Check financial access
        if (a.financialAccess) {
          violations.push({
            id: 'VIO-' + String(violations.length + 1).padStart(3, '0'),
            policy: 'Payment Threshold',
            agent: a.name,
            agentId: a.id,
            timestamp: 'On onboard',
            severity: 'Medium',
            details: a.name + ' has financial data access — monitor for threshold violations',
            status: 'Investigating'
          });
          actions.push({ time: 'On onboard', action: 'Financial access flagged', agent: a.name, type: 'warning' });
        }
        // High risk agents
        if (a.riskScore >= 60) {
          violations.push({
            id: 'VIO-' + String(violations.length + 1).padStart(3, '0'),
            policy: 'Cost Limit',
            agent: a.name,
            agentId: a.id,
            timestamp: 'On onboard',
            severity: a.riskScore >= 80 ? 'Critical' : 'High',
            details: a.name + ' has risk score ' + a.riskScore + ' — requires review',
            status: 'Open'
          });
          actions.push({ time: 'On onboard', action: 'High risk agent flagged', agent: a.name, type: 'danger' });
        }
        // Agents onboarded
        actions.push({ time: a.createdDate || 'Recently', action: 'Agent onboarded and registered', agent: a.name, type: 'success' });
      }
      return { violations: violations, actions: actions };
    },

    // ─── Compute compliance from live agents ──────────────
    computeCompliance: function () {
      var all = getAllAgents();
      var n = all.length;
      if (n === 0) return { frameworks: complianceFrameworks, findings: [] };

      // Try to use LLM compliance results
      var compResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('compliance') : null;

      if (compResults && compResults.frameworks && compResults.frameworks.length > 0 && compResults.agent_results && compResults.agent_results.length === n) {
        // Use real LLM compliance data
        var llmFrameworks = compResults.frameworks.map(function (fw) {
          var matchedBase = complianceFrameworks.find(function (bf) { return bf.name === fw.name; });
          var totalControls = matchedBase ? matchedBase.controls : 50;
          return {
            name: fw.name,
            score: Math.round(fw.avg_score || 0),
            findings: fw.findings ? fw.findings.length : 0,
            controls: totalControls,
            passedControls: Math.round(totalControls * ((fw.avg_score || 0) / 100)),
            icon: matchedBase ? matchedBase.icon : '\u2705',
            color: matchedBase ? matchedBase.color : '#3b82f6',
            trend: 'stable'
          };
        });

        // Build findings from LLM data
        var llmFindings = (compResults.findings || []).map(function (f, idx) {
          return {
            id: 'FND-' + String(idx + 1).padStart(3, '0'),
            framework: f.framework || 'Unknown',
            control: f.framework + ' Control',
            severity: f.severity || 'Medium',
            status: 'Open',
            description: (f.agent_name || f.agent || '') + ' \u2014 ' + (f.finding || f.description || 'Non-compliant'),
            dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        });

        return { frameworks: llmFrameworks, findings: llmFindings };
      }

      // Fallback: rule-based compliance evaluation
      var findings = [];
      var frameworks = complianceFrameworks.map(function (f) {
        var passed = 0;
        var fFindings = 0;
        for (var i = 0; i < all.length; i++) {
          var a = all[i];
          var compliant = true;
          if (f.name === 'GDPR' && a.piiAccess && !a.endpoint) { compliant = false; }
          if (f.name === 'SOX' && a.financialAccess && a.riskScore > 50) { compliant = false; }
          if (f.name === 'HIPAA' && a.piiAccess && a.riskScore > 40) { compliant = false; }
          if (f.name === 'SOC 2' && (!a.endpoint || a.riskScore > 70)) { compliant = false; }
          if (f.name === 'ISO 27001' && a.riskScore > 60) { compliant = false; }

          if (compliant) passed++;
          else {
            fFindings++;
            findings.push({
              id: 'FND-' + String(findings.length + 1).padStart(3, '0'),
              framework: f.name,
              control: f.name + ' Control',
              severity: a.riskScore >= 80 ? 'Critical' : a.riskScore >= 60 ? 'High' : 'Medium',
              status: 'Open',
              description: a.name + ' \u2014 non-compliant: risk=' + a.riskScore + (a.piiAccess ? ', PII access' : '') + (a.financialAccess ? ', financial access' : ''),
              dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });
          }
        }
        return {
          name: f.name,
          score: n > 0 ? Math.round((passed / n) * 100) : 0,
          findings: fFindings,
          controls: f.controls,
          passedControls: Math.round(f.controls * (passed / Math.max(n, 1))),
          icon: f.icon,
          color: f.color,
          trend: 'stable'
        };
      });
      return { frameworks: frameworks, findings: findings };
    },

    // ─── Compute cost breakdown from live agents ──────────
    computeCostBreakdown: function () {
      var all = getAllAgents();

      // Try to use LLM cost results
      var costResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('cost') : null;

      if (costResults && costResults.by_platform && costResults.all_agents_summary && costResults.all_agents_summary.length === all.length) {
        // Use real LLM cost data
        var llmTopAgents = (costResults.all_agents_summary || costResults.top_spenders || []).map(function (sp) {
          return {
            name: sp.name || 'Unknown',
            cost: sp.cost || 0,
            tasks: sp.tasks || 0,
            costPerTask: sp.cost_per_task || (sp.tasks > 0 ? (sp.cost / sp.tasks).toFixed(3) : 0)
          };
        });
        llmTopAgents.sort(function (a, b) { return b.cost - a.cost; });

        return {
          byPlatform: {
            labels: costResults.by_platform.labels || [],
            data: costResults.by_platform.data || [],
            colors: (costResults.by_platform.labels || []).map(function (lbl) {
              var p = PLATFORMS.find(function (pp) { return pp.name === lbl; });
              return p ? p.color : '#ef4444';
            })
          },
          topAgents: llmTopAgents.slice(0, 8),
          recommendations: (costResults.recommendations || []).map(function (r) {
            return { title: r.title || 'Recommendation', description: r.description || '', savings: r.savings || 'TBD', priority: r.priority || 'Medium' };
          })
        };
      }

      // Fallback: compute from agent-level data
      var byPlatform = {};
      PLATFORMS.forEach(function (p) { byPlatform[p.name] = 0; });

      var topAgents = [];
      for (var i = 0; i < all.length; i++) {
        var a = all[i];
        var plat = a.platform || 'Custom Agents';
        byPlatform[plat] = (byPlatform[plat] || 0) + (a.monthlyCost || 0);
        topAgents.push({
          name: a.name,
          cost: a.monthlyCost || 0,
          tasks: a.tasksExecuted || 0,
          costPerTask: a.tasksExecuted > 0 ? ((a.monthlyCost || 0) / a.tasksExecuted).toFixed(3) : 0
        });
      }
      topAgents.sort(function (a, b) { return b.cost - a.cost; });

      return {
        byPlatform: {
          labels: Object.keys(byPlatform),
          data: Object.keys(byPlatform).map(function (k) { return byPlatform[k]; }),
          colors: PLATFORMS.map(function (p) { return p.color; })
        },
        topAgents: topAgents.slice(0, 8),
        recommendations: all.length > 0 ? [
          { title: 'Review Agent Costs', description: 'Review monthly costs for ' + all.length + ' onboarded agents to identify optimization opportunities.', savings: 'TBD', priority: 'Medium' }
        ] : []
      };
    },

    // ─── Compute reliability from live agents ─────────────
    computeReliability: function () {
      var all = getAllAgents();
      var failing = all.filter(function (a) { return parseFloat(a.successRate || 100) < 97; });
      failing.sort(function (a, b) { return parseFloat(a.successRate || 100) - parseFloat(b.successRate || 100); });

      return {
        topFailing: failing.slice(0, 5).map(function (a) {
          return { name: a.name, platform: a.platform, failureRate: (100 - parseFloat(a.successRate || 100)).toFixed(1), lastIncident: a.lastSeen || 'N/A', status: parseFloat(a.successRate || 100) < 95 ? 'Degraded' : 'Intermittent' };
        }),
        incidents: [],
        reliabilityByPlatform: {
          labels: PLATFORMS.map(function (p) { return p.name; }),
          data: PLATFORMS.map(function (p) {
            var platAgents = all.filter(function (a) { return a.platform === p.name; });
            if (platAgents.length === 0) return 0;
            var total = 0;
            platAgents.forEach(function (a) { total += parseFloat(a.availability || 0); });
            return (total / platAgents.length).toFixed(1);
          }),
          colors: PLATFORMS.map(function (p) { return p.color; })
        }
      };
    },

    // ─── Compute identity data from live agents ───────────
    computeIdentity: function () {
      var all = getAllAgents();
      return {
        summary: {
          totalIdentities: all.length,
          activeCredentials: all.filter(function (a) { return a.status === 'Active'; }).length,
          pendingRotation: 0,
          expiringSoon: 0,
          revokedThisMonth: 0
        },
        credentials: all.map(function (a) {
          return {
            agentId: a.id,
            agent: a.name,
            type: a.monitoringMethod === 'sdk-push' ? 'SDK Token' : a.monitoringMethod === 'webhook' ? 'Webhook Secret' : 'API Key',
            status: 'Active',
            lastRotated: 'On onboard',
            expiresIn: '90 days',
            scope: a.piiAccess ? 'admin' : 'read/write'
          };
        })
      };
    },

    // ─── Generate audit report from live agents ───────────
    computeAudit: function () {
      var all = getAllAgents();
      var n = all.length;
      var comp = this.computeCompliance();
      var violations = this.computeViolations();

      return {
        auditsCompleted: n,
        openFindings: comp.findings.length,
        criticalFindings: comp.findings.filter(function (f) { return f.severity === 'Critical'; }).length,
        avgRemediation: comp.findings.length > 0 ? '4.2 days' : 'N/A',
        findings: comp.findings,
        executiveSummary: n === 0
          ? 'No agents have been onboarded yet. Add agents using the onboarding flow to begin audit and compliance monitoring.'
          : 'The AETHER Auditor Agent has evaluated ' + n + ' onboarded agent' + (n > 1 ? 's' : '') + '. ' +
            'Current compliance posture: ' + comp.findings.length + ' finding' + (comp.findings.length !== 1 ? 's' : '') + ' detected. ' +
            violations.violations.length + ' governance violation' + (violations.violations.length !== 1 ? 's' : '') + ' flagged. ' +
            (comp.findings.filter(function (f) { return f.severity === 'Critical'; }).length > 0
              ? 'CRITICAL: ' + comp.findings.filter(function (f) { return f.severity === 'Critical'; }).length + ' critical finding(s) require immediate attention. '
              : '') +
            'All policies are being actively monitored.',
        reports: n > 0 ? [
          { title: 'Agent Audit Report', generated: new Date().toLocaleDateString(), pages: n * 2, status: 'Generated', color: '#3b82f6' }
        ] : [],
        timeline: violations.actions.slice(0, 6).map(function (a) {
          return { time: a.time, description: a.action + ' — ' + a.agent, type: a.type === 'danger' ? 'red' : a.type === 'warning' ? 'yellow' : 'green' };
        })
      };
    },

    // ─── Formatters ──────────────────────────────────────────
    formatCurrency: function (val) {
      if (val >= 1000000000) return '$' + (val / 1000000000).toFixed(1) + 'B';
      if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'K';
      return '$' + Number(val).toFixed(2);
    },

    formatNumber: function (val) {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return String(val);
    }
  };
})();
