/* ═══════════════════════════════════════════════════════════════
   AETHER Page Renderers — Governance, Compliance & Risk
   Enterprise AI Workforce Platform
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};


/* ───────────────────────────────────────────────────────────────
   PAGE 1 — Governance Engine
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.governance = {

  render: function () {
    var d = AETHER.data;
    var policies = d.policies;
    var govData = d.computeViolations();
    var violations = govData.violations;
    var actions = govData.actions;
    var k = d.computeKPIs();

    /* ── Policy Rules ─────────────────────────────────────────── */
    function badgeClass(type) {
      if (type === 'danger') return 'badge badge-danger';
      if (type === 'warning') return 'badge badge-warning';
      return 'badge badge-info';
    }

    var policyCards = policies.map(function (p) {
      return '<div class="policy-rule">' +
        '<div class="policy-rule-condition"><code class="font-mono">' + p.condition + '</code></div>' +
        '<div class="policy-rule-arrow">→</div>' +
        '<div class="policy-rule-action"><span class="' + badgeClass(p.actionType) + '">' + p.action + '</span></div>' +
        '<div style="margin-left:auto;display:flex;align-items:center;gap:16px;">' +
          '<span class="text-secondary" style="font-size:12px;cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + p.violations + ' violations</span>' +
          '<span class="text-tertiary" style="font-size:12px;cursor:pointer;" onclick="window.location.hash=\'#rationale/activePolicies\'" title="Click to view active policies rationale">Last: ' + p.lastTriggered + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    /* ── Violations Table ─────────────────────────────────────── */
    var violationRows = violations.map(function (v) {
      var sevBadge = v.severity === 'Critical' ? 'badge badge-danger' :
                     v.severity === 'High' ? 'badge badge-danger' :
                     v.severity === 'Medium' ? 'badge badge-warning' : 'badge badge-info';
      var statusBadge = v.status === 'Open' ? 'badge badge-danger' :
                        v.status === 'Investigating' ? 'badge badge-warning' :
                        'badge badge-success';
      return '<tr>' +
        '<td><span class="font-mono" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.id + '</span></td>' +
        '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.policy + '</td>' +
        '<td><a href="javascript:void(0)" class="table-agent-name" onclick="window.location.hash=\'#profile/' + v.agentId + '\'">' + v.agent + '</a></td>' +
        '<td><span class="' + sevBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.severity + '</span></td>' +
        '<td><span class="' + statusBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.status + '</span></td>' +
        '<td class="text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.timestamp + '</td>' +
        '<td class="truncate" style="max-width:240px;cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + v.details + '</td>' +
      '</tr>';
    }).join('');

    /* ── Timeline ─────────────────────────────────────────────── */
    var dotColor = { warning: 'yellow', danger: 'red', info: 'blue', success: 'green' };
    var timelineItems = actions.map(function (a) {
      return '<div class="timeline-item" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/autoActionsToday\'" title="Click to view auto-actions rationale">' +
        '<div class="timeline-dot ' + (dotColor[a.type] || 'blue') + '"></div>' +
        '<div class="timeline-content">' +
          '<div class="timeline-title">' + a.action + '</div>' +
          '<div class="timeline-desc">' + a.agent + '</div>' +
          '<div class="timeline-time">' + a.time + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Governance Engine</h1>' +
          '<p class="page-subtitle">Policy enforcement and automated governance for AI agents</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="btn-run-all-governance"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg> Run All Governance</button>' +
          '<button class="btn btn-secondary" id="btn-audit-log"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 11l4 4 8-8"/></svg> Audit Log</button>' +
        '</div>' +
      '</div>' +

      /* Alert Banner */
      '<div class="alert-banner ' + (violations.length > 0 ? 'danger' : 'success') + ' animate-fade-in-up stagger-1">' +
        (violations.length > 0 ? '🚨 ' + violations.length + ' active policy violation' + (violations.length !== 1 ? 's' : '') + ' require attention' : '✅ No policy violations detected') +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid animate-fade-in-up stagger-2">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/activePolicies\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
            '<span class="kpi-trend neutral">—</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.policies.length + '</div>' +
          '<div class="kpi-label">Active Policies</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/policyViolations\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>' +
            '<span class="kpi-trend ' + (violations.length > 0 ? 'up' : 'neutral') + '">' + (violations.length > 0 ? violations.length + ' active' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + violations.length + '</div>' +
          '<div class="kpi-label">Policy Violations</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/autoActionsToday\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>' +
            '<span class="kpi-trend ' + (actions.length > 0 ? 'up' : 'neutral') + '">' + (actions.length > 0 ? actions.length + ' today' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + actions.length + '</div>' +
          '<div class="kpi-label">Auto-Actions Today</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/policyAdherence\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? '↑ live' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (d.getTotalAgentCount() > 0 ? (100 - (violations.length / Math.max(d.getTotalAgentCount(), 1) * 100)).toFixed(1) : '0') + '%</div>' +
          '<div class="kpi-label">Policy Adherence</div>' +
        '</div>' +

      '</div>' +

      /* Policy Rules */
      '<h3 class="section-title animate-fade-in-up stagger-3">Policy Rules</h3>' +
      '<div class="animate-fade-in-up stagger-4">' + policyCards + '</div>' +

      /* Violations Table */
      '<h3 class="section-title animate-fade-in-up stagger-5">Active Violations</h3>' +
      '<div class="table-container animate-fade-in-up stagger-6">' +
        '<div class="table-header">' +
          '<div class="table-title">Policy Violations</div>' +
          '<div class="table-count">' + violations.length + ' active</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>ID</th><th>Policy</th><th>Agent</th><th>Severity</th><th>Status</th><th>Timestamp</th><th>Details</th>' +
            '</tr></thead>' +
            '<tbody>' + violationRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* Governance Actions Timeline */
      '<h3 class="section-title animate-fade-in-up stagger-7">Recent Governance Actions</h3>' +
      '<div class="card animate-fade-in-up stagger-8">' +
        '<div class="card-body">' +
          '<div class="timeline">' + timelineItems + '</div>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();

    /* Wire up Run All Governance button */
    var runAllBtn = document.getElementById('btn-run-all-governance');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAllAgents) { AETHER.app.showToast('Backend not connected', 'error'); return; }
        runAllBtn.disabled = true;
        runAllBtn.textContent = '\u23F3 Running all 6 agents...';
        AETHER.runtime.runAllAgents(function (err, data) {
          runAllBtn.disabled = false;
          runAllBtn.textContent = '\u2705 Run All Governance';
          if (err) { AETHER.app.showToast('Agent run failed: ' + (err.message || err), 'error'); return; }
          var count = data ? Object.keys(data).length : 0;
          AETHER.app.showToast('All ' + count + ' agents completed!', 'success');
          AETHER.app.navigateTo('governance');
        });
      });
    }

    /* Wire up Audit Log button */
    var auditBtn = document.getElementById('btn-audit-log');
    if (auditBtn) {
      auditBtn.addEventListener('click', function () {
        if (AETHER.app && AETHER.app.navigateTo) {
          AETHER.app.navigateTo('audit');
        } else {
          window.location.hash = '#audit';
        }
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 2 — Compliance Center
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.compliance = {

  render: function () {
    var d = AETHER.data;
    var compData = d.computeCompliance();
    var frameworks = compData.frameworks;
    var findings = compData.findings;

    /* ── Framework Cards ──────────────────────────────────────── */
    var frameworkCards = frameworks.map(function (fw) {
      var pct = Math.round((fw.passedControls / fw.controls) * 100);
      var scoreColor = fw.score >= 97 ? '#10b981' : fw.score >= 94 ? '#f59e0b' : '#ef4444';
      var progressClass = fw.score >= 97 ? 'green' : fw.score >= 94 ? 'yellow' : 'red';
      return '<div class="framework-card" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceScore\'" title="Click to view compliance score rationale">' +
        '<div class="framework-card-icon" style="background:' + fw.color + '20;color:' + fw.color + ';font-size:28px;">' + fw.icon + '</div>' +
        '<div class="framework-card-name">' + fw.name + '</div>' +
        '<div class="framework-card-score" style="color:' + scoreColor + ';">' + fw.score + '<span style="font-size:16px;opacity:.7;">%</span></div>' +
        '<div class="progress-bar" style="margin:8px 0;"><div class="progress-fill ' + progressClass + '" style="width:' + pct + '%;"></div></div>' +
        '<div class="text-tertiary" style="font-size:11px;margin-bottom:6px;cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceScore\'" title="Click to view controls passed rationale">' + fw.passedControls + '/' + fw.controls + ' controls passed</div>' +
        '<span class="badge badge-warning" style="font-size:10px;cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + fw.findings + ' findings</span>' +
      '</div>';
    }).join('');

    /* ── Findings Table ───────────────────────────────────────── */
    var fwColorMap = {};
    frameworks.forEach(function (fw) { fwColorMap[fw.name] = fw.color; });

    var findingRows = findings.map(function (f) {
      var sevBadge = f.severity === 'High' ? 'badge badge-danger' :
                     f.severity === 'Medium' ? 'badge badge-warning' : 'badge badge-info';
      var statusBadge = f.status === 'Open' ? 'badge badge-danger' : 'badge badge-warning';
      var fwColor = fwColorMap[f.framework] || '#3b82f6';
      return '<tr>' +
        '<td><span class="font-mono" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.id + '</span></td>' +
        '<td><span class="badge" style="background:' + fwColor + '22;color:' + fwColor + ';border:1px solid ' + fwColor + '44;cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceScore\'" title="Click to view compliance score rationale">' + f.framework + '</span></td>' +
        '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.control + '</td>' +
        '<td><span class="' + sevBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.severity + '</span></td>' +
        '<td><span class="' + statusBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.status + '</span></td>' +
        '<td class="truncate" style="max-width:220px;cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.description + '</td>' +
        '<td class="text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + f.dueDate + '</td>' +
      '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Compliance Center</h1>' +
          '<p class="page-subtitle">Multi-framework compliance monitoring and audit readiness</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="btn-run-compliance"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H2v12h12V2z"/><path d="M5 8h6"/><path d="M8 5v6"/></svg> Run Compliance</button>' +
          '<button class="btn btn-secondary" id="btn-export-compliance"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12V2m0 0L1 5m3-3l3 3M12 4v10m0 0l3-3m-3 3l-3-3"/></svg> Export Report</button>' +
        '</div>' +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid animate-fade-in-up stagger-1">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? '↑ computed' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (d.getTotalAgentCount() > 0 ? Math.round(frameworks.reduce(function(s,f){return s+f.score;},0)/Math.max(frameworks.length,1)) : 0) + '%</div>' +
          '<div class="kpi-label">Overall Score</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/complianceFindings\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
            '<span class="kpi-trend ' + (findings.length > 0 ? 'up' : 'neutral') + '">' + (findings.length > 0 ? findings.length + ' open' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + findings.length + '</div>' +
          '<div class="kpi-label">Open Findings</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>' +
            '<span class="kpi-trend neutral">—</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + frameworks.length + '</div>' +
          '<div class="kpi-label">Frameworks Monitored</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? '↑ live' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (d.getTotalAgentCount() > 0 ? Math.round(frameworks.reduce(function(s,f){return s+f.score;},0)/Math.max(frameworks.length,1)) : 0) + '%</div>' +
          '<div class="kpi-label">Audit Readiness</div>' +
        '</div>' +

      '</div>' +

      /* Framework Cards */
      '<h3 class="section-title animate-fade-in-up stagger-2">Compliance Frameworks</h3>' +
      '<div class="grid-5 animate-fade-in-up stagger-3">' + frameworkCards + '</div>' +

      /* Charts */
      '<div class="charts-grid animate-fade-in-up stagger-4">' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div><div class="chart-card-title">Compliance Score Trend</div><div class="chart-card-subtitle">12-month trend across all frameworks</div></div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-compliance-trend" style="height:280px;"></canvas></div>' +
        '</div>' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div><div class="chart-card-title">Findings by Framework</div><div class="chart-card-subtitle">Open compliance findings per framework</div></div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-findings-framework" style="height:280px;"></canvas></div>' +
        '</div>' +
      '</div>' +

      /* Findings Table */
      '<h3 class="section-title animate-fade-in-up stagger-5">Open Findings</h3>' +
      '<div class="table-container animate-fade-in-up stagger-6">' +
        '<div class="table-header">' +
          '<div class="table-title">Compliance Findings</div>' +
          '<div class="table-count">' + findings.length + ' findings</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>ID</th><th>Framework</th><th>Control</th><th>Severity</th><th>Status</th><th>Description</th><th>Due Date</th>' +
            '</tr></thead>' +
            '<tbody>' + findingRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;

    /* Compliance Score Trend */
    AETHER.charts.createLineChart('chart-compliance-trend',
      d.trends.compliance.labels,
      [{ label: 'Compliance Score', data: d.trends.compliance.data, color: '#10b981', fill: true, points: true }]
    );

    /* Findings by Framework */
    var compData2 = d.computeCompliance();
    var frameworks = compData2.frameworks;
    AETHER.charts.createBarChart('chart-findings-framework',
      frameworks.map(function (fw) { return fw.name; }),
      [{ label: 'Findings', data: frameworks.map(function (fw) { return fw.findings; }), colors: frameworks.map(function (fw) { return fw.color; }), radius: 6 }]
    );

    /* Wire up Run Compliance button */
    var compBtn = document.getElementById('btn-run-compliance');
    if (compBtn) {
      compBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAgentAnalysis) { AETHER.app.showToast('Backend not connected', 'error'); return; }
        compBtn.disabled = true;
        compBtn.textContent = '\u23F3 Running compliance analysis...';
        AETHER.runtime.runAgentAnalysis('compliance', function (err, data) {
          compBtn.disabled = false;
          compBtn.textContent = '\u2705 Run Compliance';
          if (err) { AETHER.app.showToast('Compliance agent failed: ' + err.message, 'error'); return; }
          AETHER.app.showToast('Compliance analysis complete \u2014 ' + (data.total_findings || 0) + ' findings detected', 'success');
          AETHER.app.navigateTo('compliance');
        });
      });
    }

    /* Wire up Export Report button */
    var exportCompBtn = document.getElementById('btn-export-compliance');
    if (exportCompBtn) {
      exportCompBtn.addEventListener('click', function () {
        exportCompBtn.disabled = true;
        exportCompBtn.textContent = '\u23F3 Exporting...';
        fetch('http://localhost:3000/api/results/compliance')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          exportCompBtn.disabled = false;
          exportCompBtn.textContent = 'Export Report';
          if (data.error) { AETHER.app.showToast('No compliance data. Run compliance first.', 'warning'); return; }
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'aether_compliance_report_' + new Date().toISOString().slice(0, 10) + '.json';
          link.click();
          URL.revokeObjectURL(url);
          AETHER.app.showToast('Compliance report downloaded!', 'success');
        })
        .catch(function () {
          exportCompBtn.disabled = false;
          exportCompBtn.textContent = 'Export Report';
          AETHER.app.showToast('Backend offline.', 'error');
        });
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 3 — Risk Engine
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.risk = {

  render: function () {
    var d = AETHER.data;
    var k = d.computeKPIs();
    var agents = d.getAllAgents();
    var highRisk = d.getHighRiskAgents().slice(0, 10);
    var financialCount = k.financialAccess;
    var piiCount = k.piiExposure;
    var criticalCount = agents.filter(function (a) { return a.criticality === 'Critical'; }).length;
    var avgRiskScore = k.avgRiskScore;

    /* ── Heatmap Cells ────────────────────────────────────────── */
    var heatmapCells = '';
    var first100 = agents.slice(0, 100);
    for (var i = 0; i < first100.length; i++) {
      var a = first100[i];
      var heatClass = a.riskLevel === 'Critical' ? 'critical' :
                      a.riskLevel === 'High' ? 'high' :
                      a.riskLevel === 'Medium' ? 'medium' : 'low';
      heatmapCells += '<div class="heatmap-cell ' + heatClass + '" style="cursor:pointer;" onclick="window.location.hash=\'#profile/' + a.id + '\'" title="' + a.name + ' — Risk: ' + a.riskScore + ' (Click to view profile)"></div>';
    }

    /* ── High Risk Table ──────────────────────────────────────── */
    var riskRows = highRisk.map(function (a) {
      var scoreColor = a.riskScore >= 80 ? '#ef4444' : a.riskScore >= 60 ? '#f59e0b' : '#10b981';
      var riskBadge = a.riskLevel === 'Critical' ? 'badge badge-danger' :
                      a.riskLevel === 'High' ? 'badge badge-danger' : 'badge badge-warning';
      var critBadge = a.criticality === 'Critical' ? 'badge badge-danger' :
                      a.criticality === 'High' ? 'badge badge-warning' :
                      a.criticality === 'Medium' ? 'badge badge-info' : 'badge badge-neutral';
      return '<tr>' +
        '<td class="font-mono" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#profile/' + a.id + '\'" title="Click to view agent profile">' + a.id + '</td>' +
        '<td><a href="javascript:void(0)" class="table-agent-name" onclick="window.location.hash=\'#profile/' + a.id + '\'">' + a.name + '</a></td>' +
        '<td><span style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view platform discovery coverage rationale">' + a.platform + '</span></td>' +
        '<td><span style="font-size:18px;font-weight:700;color:' + scoreColor + ';cursor:pointer;" class="tabular-nums" onclick="window.location.hash=\'#rationale/avgRiskScore\'" title="Click to view risk score rationale">' + a.riskScore + '</span></td>' +
        '<td><span class="' + riskBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agents rationale">' + a.riskLevel + '</span></td>' +
        '<td><span class="badge ' + (a.piiAccess ? 'badge-danger' : 'badge-success') + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/piiExposure\'" title="Click to view PII exposure rationale">' + (a.piiAccess ? 'Yes' : 'No') + '</span></td>' +
        '<td><span class="badge ' + (a.financialAccess ? 'badge-danger' : 'badge-success') + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/financialAccess\'" title="Click to view financial access rationale">' + (a.financialAccess ? 'Yes' : 'No') + '</span></td>' +
        '<td><span class="' + critBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agents rationale">' + a.criticality + '</span></td>' +
      '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Risk Engine</h1>' +
          '<p class="page-subtitle">AI agent risk assessment, scoring, and monitoring</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="btn-run-risk"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 14l6-12 6 12H2z"/><path d="M8 6v4"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg> Run Assessment</button>' +
          '<button class="btn btn-secondary" id="btn-export-risk"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12V2m0 0L1 5m3-3l3 3M12 4v10m0 0l3-3m-3 3l-3-3"/></svg> Export</button>' +
        '</div>' +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid animate-fade-in-up stagger-1">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/highRiskAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
            '<span class="kpi-trend ' + (k.highRiskAgents > 0 ? 'up' : 'neutral') + '">' + (k.highRiskAgents > 0 ? k.highRiskAgents + ' flagged' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.highRiskAgents + '</div>' +
          '<div class="kpi-label">High Risk Agents</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/avgRiskScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>' +
            '<span class="kpi-trend ' + (avgRiskScore > 50 ? 'up' : 'neutral') + '">' + (agents.length > 0 ? 'of 100' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + avgRiskScore + '</div>' +
          '<div class="kpi-label">Avg Risk Score</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/piiExposure\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>' +
            '<span class="kpi-trend ' + (piiCount > 0 ? 'up' : 'neutral') + '">' + (piiCount > 0 ? piiCount + ' at risk' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + piiCount + '</div>' +
          '<div class="kpi-label">PII Exposure</div>' +
          '<div class="text-tertiary" style="font-size:11px;margin-top:2px;">agents at risk</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/financialAccess\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M12 4v16"/></svg></div>' +
            '<span class="kpi-trend neutral">—</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + financialCount + '</div>' +
          '<div class="kpi-label">Financial Access</div>' +
          '<div class="text-tertiary" style="font-size:11px;margin-top:2px;">agents with access</div>' +
        '</div>' +

      '</div>' +

      /* Charts Grid */
      '<div class="charts-grid animate-fade-in-up stagger-2">' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div><div class="chart-card-title">Risk Distribution</div><div class="chart-card-subtitle">Agent count by risk classification</div></div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-risk-distribution" style="height:280px;"></canvas></div>' +
        '</div>' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div><div class="chart-card-title">Risk Score Trend</div><div class="chart-card-subtitle">High-risk agent count over 12 months</div></div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-risk-trend" style="height:280px;"></canvas></div>' +
        '</div>' +
      '</div>' +

      /* Heatmap */
      '<h3 class="section-title animate-fade-in-up stagger-3">Risk Heatmap</h3>' +
      '<div class="card animate-fade-in-up stagger-4">' +
        '<div class="card-body">' +
          '<div class="heatmap-grid" style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px;">' + heatmapCells + '</div>' +
          '<div style="display:flex;align-items:center;gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(30,37,69,0.4);">' +
            '<span class="text-tertiary" style="font-size:11px;font-weight:600;">LEGEND:</span>' +
            '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;border-radius:3px;background:#10b981;"></div><span class="text-secondary" style="font-size:11px;">Low</span></div>' +
            '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;border-radius:3px;background:#f59e0b;"></div><span class="text-secondary" style="font-size:11px;">Medium</span></div>' +
            '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;border-radius:3px;background:#ef4444;"></div><span class="text-secondary" style="font-size:11px;">High</span></div>' +
            '<div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;border-radius:3px;background:#dc2626;"></div><span class="text-secondary" style="font-size:11px;">Critical</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* High Risk Agents Table */
      '<h3 class="section-title animate-fade-in-up stagger-5">Highest Risk Agents</h3>' +
      '<div class="table-container animate-fade-in-up stagger-6">' +
        '<div class="table-header">' +
          '<div class="table-title">Top 10 Agents by Risk Score</div>' +
          '<div class="table-count">10 agents</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>Agent ID</th><th>Agent Name</th><th>Platform</th><th>Risk Score</th><th>Risk Level</th><th>PII Access</th><th>Financial Access</th><th>Criticality</th>' +
            '</tr></thead>' +
            '<tbody>' + riskRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* Risk Factor Analysis */
      '<h3 class="section-title animate-fade-in-up stagger-7">Risk Factor Analysis</h3>' +
      '<div class="card animate-fade-in-up stagger-8">' +
        '<div class="card-body">' +
          '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/piiExposure\'" title="Click to view PII exposure rationale">' +
            '<div class="metric-row-label"><span style="color:#ef4444;margin-right:8px;">●</span> PII Access Risk</div>' +
            '<div class="metric-row-value tabular-nums">' + piiCount + ' agents with PII access</div>' +
          '</div>' +
          '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/financialAccess\'" title="Click to view financial access rationale">' +
            '<div class="metric-row-label"><span style="color:#f59e0b;margin-right:8px;">●</span> Financial Access Risk</div>' +
            '<div class="metric-row-value tabular-nums">' + financialCount + ' agents with financial access</div>' +
          '</div>' +
          '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agents rationale">' +
            '<div class="metric-row-label"><span style="color:#8b5cf6;margin-right:8px;">●</span> Critical Systems</div>' +
            '<div class="metric-row-value tabular-nums">' + criticalCount + ' agents with Critical criticality</div>' +
          '</div>' +
          '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' +
            '<div class="metric-row-label"><span style="color:#06b6d4;margin-right:8px;">●</span> Behavioral Anomalies</div>' +
            '<div class="metric-row-value tabular-nums">' + highRisk.length + ' anomalies detected</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;

    var riskDist = d.computeRiskDistribution();
    AETHER.charts.createDoughnutChart('chart-risk-distribution',
      riskDist.labels,
      riskDist.data,
      riskDist.colors,
      { legend: true, legendPosition: 'bottom' }
    );

    /* Risk Score Trend */
    AETHER.charts.createAreaChart('chart-risk-trend',
      d.trends.riskTrend.labels,
      [{ label: 'High-Risk Agents', data: d.trends.riskTrend.data, color: '#ef4444', fill: true, points: true }]
    );

    /* Wire up Run Assessment button */
    var riskBtn = document.getElementById('btn-run-risk');
    if (riskBtn) {
      riskBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAgentAnalysis) { AETHER.app.showToast('Backend not connected', 'error'); return; }
        riskBtn.disabled = true;
        riskBtn.textContent = '\u23F3 Running risk analysis...';
        AETHER.runtime.runAgentAnalysis('risk', function (err, data) {
          riskBtn.disabled = false;
          riskBtn.textContent = '\u2705 Run Assessment';
          if (err) { AETHER.app.showToast('Risk agent failed: ' + err.message, 'error'); return; }
          AETHER.app.showToast('Risk analysis complete \u2014 ' + (data.high_risk_count || 0) + ' high-risk agents, avg score: ' + (data.avg_risk_score || 0), 'success');
          AETHER.app.navigateTo('risk');
        });
      });
    }

    /* Wire up Export button */
    var exportRiskBtn = document.getElementById('btn-export-risk');
    if (exportRiskBtn) {
      exportRiskBtn.addEventListener('click', function () {
        exportRiskBtn.disabled = true;
        exportRiskBtn.textContent = '\u23F3 Exporting...';
        fetch('http://localhost:3000/api/results/risk')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          exportRiskBtn.disabled = false;
          exportRiskBtn.textContent = 'Export';
          if (data.error) { AETHER.app.showToast('No risk data. Run assessment first.', 'warning'); return; }
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'aether_risk_report_' + new Date().toISOString().slice(0, 10) + '.json';
          link.click();
          URL.revokeObjectURL(url);
          AETHER.app.showToast('Risk report downloaded!', 'success');
        })
        .catch(function () {
          exportRiskBtn.disabled = false;
          exportRiskBtn.textContent = 'Export';
          AETHER.app.showToast('Backend offline.', 'error');
        });
      });
    }
  }
};
