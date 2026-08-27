/* ═══════════════════════════════════════════════════════════════
   AETHER Operations Pages
   Reliability · Cost · Benchmark · Impact
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

/* ─────────────────────────────────────────────────────────────
   PAGE 1 — Reliability Dashboard
   ───────────────────────────────────────────────────────────── */
AETHER.pages.reliability = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var rel = d.computeReliability();
    var failing = rel.topFailing;
    var incidents = rel.incidents;

    if (d.getTotalAgentCount() === 0) {
      return '' +
        '<div class="page-content">' +
          '<div class="page-header animate-fade-in-up">' +
            '<div class="page-header-left">' +
              '<h1 class="page-title">Reliability Dashboard</h1>' +
              '<p class="page-subtitle">Agent availability, performance, and incident management</p>' +
            '</div>' +
          '</div>' +
          '<div class="empty-state animate-fade-in-up stagger-1">' +
            '<div class="empty-state-icon">📡</div>' +
            '<div class="empty-state-title">No Agents Registered</div>' +
            '<div class="empty-state-desc">Onboard agents to begin monitoring reliability, availability, and incident data.</div>' +
          '</div>' +
        '</div>';
    }

    /* ── KPI Cards ───────────────────────────────── */
    var kpiHTML = '' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/availability\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>' +
            '<span class="kpi-trend up">↑ +0.3%</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + kpis.availability + '%</div>' +
          '<div class="kpi-label">Availability</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-avail" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/successRate\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/></svg></div>' +
            '<span class="kpi-trend up">↑ +0.5%</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + kpis.successRate + '%</div>' +
          '<div class="kpi-label">Success Rate</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-success" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/failureRate\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/><path d="M13 7l-6 6M7 7l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>' +
            '<span class="kpi-trend up">↓ -0.5%</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + kpis.failureRate + '%</div>' +
          '<div class="kpi-label">Failure Rate</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-failure" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/avgLatency\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg></div>' +
            '<span class="kpi-trend up">↓ -18ms</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + kpis.avgLatency + 'ms</div>' +
          '<div class="kpi-label">Avg Latency</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-latency" style="height:32px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Charts ──────────────────────────────────── */
    var chartsHTML = '' +
      '<div class="charts-grid animate-fade-in-up stagger-5">' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Reliability Trend (30-Day)</div>' +
              '<div class="chart-card-subtitle">Daily availability vs SLA target</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-reliability-trend" style="height:280px"></canvas></div>' +
        '</div>' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Latency Trend (30-Day)</div>' +
              '<div class="chart-card-subtitle">Average response time in milliseconds</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-latency-trend" style="height:280px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Top Failing Table ────────────────────────── */
    var failRows = '';
    for (var i = 0; i < failing.length; i++) {
      var f = failing[i];
      var rateColor = f.failureRate > 5 ? 'text-danger' : 'text-warning';
      var statusBadge = f.status === 'Degraded' ? 'badge badge-danger' : 'badge badge-warning';
      failRows += '' +
        '<tr>' +
          '<td style="cursor:pointer;text-decoration:underline;" onclick="var found=AETHER.data.getAllAgents().find(function(a){return a.name===\'' + f.name.replace(/'/g, "\\'") + '\'}); if(found) window.location.hash=\'#profile/\'+found.id;" title="Click to view agent profile"><span class="table-agent-name">' + f.name + '</span></td>' +
          '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale">' + f.platform + '</td>' +
          '<td class="tabular-nums ' + rateColor + '" style="font-weight:600;cursor:pointer;" onclick="window.location.hash=\'#rationale/failureRate\'" title="Click to view failure rate rationale">' + f.failureRate + '%</td>' +
          '<td class="text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/criticalIncidents\'" title="Click to view critical incidents rationale">' + f.lastIncident + '</td>' +
          '<td><span class="' + statusBadge + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgReliability\'" title="Click to view reliability rationale">' + f.status + '</span></td>' +
        '</tr>';
    }

    var failingHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-6">Top Failing Agents</div>' +
      '<div class="table-container animate-fade-in-up stagger-6">' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/totalAgents\'" title="Click to view total agents rationale">Agent Name</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view platform coverage rationale">Platform</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/failureRate\'" title="Click to view failure rate rationale">Failure Rate</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/criticalIncidents\'" title="Click to view critical incidents rationale">Last Incident</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgReliability\'" title="Click to view reliability rationale">Status</th>' +
            '</tr></thead>' +
            '<tbody>' + failRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    /* ── Incident Timeline ────────────────────────── */
    var timelineItems = '';
    for (var j = 0; j < incidents.length; j++) {
      var inc = incidents[j];
      var dotColor = inc.type === 'red' ? 'red' : inc.type === 'yellow' ? 'yellow' : 'blue';
      var sevBadge = inc.severity === 'Critical' ? 'badge badge-danger' :
                     inc.severity === 'High' ? 'badge badge-danger' :
                     inc.severity === 'Medium' ? 'badge badge-warning' : 'badge badge-info';
      timelineItems += '' +
        '<div class="timeline-item" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/criticalIncidents\'" title="Click to view critical incidents rationale">' +
          '<div class="timeline-dot ' + dotColor + '"></div>' +
          '<div class="timeline-content">' +
            '<div class="timeline-title">' + inc.title + ' <span class="' + sevBadge + '">' + inc.severity + '</span></div>' +
            '<div class="timeline-desc">Duration: ' + inc.duration + ' · Affected agents: ' + inc.affected + '</div>' +
            '<div class="timeline-time">' + inc.time + '</div>' +
          '</div>' +
        '</div>';
    }

    var timelineHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-7">Incident Timeline</div>' +
      '<div class="card animate-fade-in-up stagger-7">' +
        '<div class="card-body">' +
          '<div class="timeline">' + timelineItems + '</div>' +
        '</div>' +
      '</div>';

    return '' +
      '<div class="page-content">' +
        '<div class="page-header animate-fade-in-up">' +
          '<div class="page-header-left">' +
            '<h1 class="page-title">Reliability Dashboard</h1>' +
            '<p class="page-subtitle">Agent availability, performance, and incident management</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button class="btn btn-secondary btn-sm" id="btn-run-health">Run Health Check</button>' +
            '<button class="btn btn-secondary btn-sm" id="btn-rel-export">Export Report</button>' +
            '<button class="btn btn-primary btn-sm" id="btn-rel-alerts">Configure Alerts</button>' +
          '</div>' +
        '</div>' +
        kpiHTML +
        chartsHTML +
        failingHTML +
        timelineHTML +
      '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    if (d.getTotalAgentCount() === 0) return;

    var kpis = d.computeKPIs();
    var avail = parseFloat(kpis.availability) || 0;
    var succ = parseFloat(kpis.successRate) || 0;
    var fail = parseFloat(kpis.failureRate) || 0;
    var lat = kpis.avgLatency || 0;

    /* Sparklines — generate from computed value with slight variance */
    var sparkAvail = [];
    var sparkSuccess = [];
    var sparkFailure = [];
    var sparkLatency = [];
    for (var i = 0; i < 12; i++) {
      var jitter = (i - 6) * 0.05;
      sparkAvail.push(+(avail + jitter).toFixed(2));
      sparkSuccess.push(+(succ + jitter).toFixed(2));
      sparkFailure.push(+(fail - jitter).toFixed(2));
      sparkLatency.push(Math.round(lat + (6 - i) * 2));
    }
    AETHER.charts.createSparkline('spark-avail', sparkAvail, '#10b981');
    AETHER.charts.createSparkline('spark-success', sparkSuccess, '#3b82f6');
    AETHER.charts.createSparkline('spark-failure', sparkFailure, '#ef4444');
    AETHER.charts.createSparkline('spark-latency', sparkLatency, '#06b6d4');

    /* Reliability 30-day line chart — generate from computed availability */
    var reliabilityDaily = [];
    var latencyDaily = [];
    for (var j = 0; j < 30; j++) {
      var dayJitter = (Math.sin(j * 0.5) * 0.3);
      reliabilityDaily.push(+(avail + dayJitter).toFixed(2));
      latencyDaily.push(Math.round(lat + (Math.cos(j * 0.4) * 15)));
    }
    AETHER.charts.createLineChart('chart-reliability-trend', d.last30Days, [
      { label: 'Availability', data: reliabilityDaily, color: '#10b981', fill: true, points: false, width: 2.5 },
      { label: 'SLA Target (99.0%)', data: Array(30).fill(99.0), color: '#ef4444', dashed: true, points: false, width: 1.5, fill: false }
    ], {
      y: { min: 97.5, max: 100 },
      beginAtZero: false,
      yFormat: function (v) { return v + '%'; }
    });

    /* Latency 30-day bar chart */
    AETHER.charts.createBarChart('chart-latency-trend', d.last30Days, [
      { label: 'Avg Latency (ms)', data: latencyDaily, color: '#3b82f6', radius: 4, maxWidth: 16 }
    ], {
      yFormat: function (v) { return v + 'ms'; }
    });

    /* Button handlers */
    var healthBtn = document.getElementById('btn-run-health');
    if (healthBtn) {
      healthBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAgentAnalysis) { AETHER.app.showToast('Backend not connected.', 'error'); return; }
        healthBtn.disabled = true;
        healthBtn.textContent = '\u23F3 Running health check...';
        AETHER.runtime.runAgentAnalysis('health', function (err, data) {
          healthBtn.disabled = false;
          healthBtn.textContent = '\u2705 Run Health Check';
          if (err) { AETHER.app.showToast('Health agent failed: ' + err.message, 'error'); return; }
          var summary = data.summary || {};
          AETHER.app.showToast('Health check complete \u2014 Healthy: ' + (summary.healthy || 0) + ', Degraded: ' + (summary.degraded || 0) + ', Unhealthy: ' + (summary.unhealthy || 0), 'success');
          AETHER.app.navigateTo('reliability');
        });
      });
    }
    var relExport = document.getElementById('btn-rel-export');
    if (relExport) {
      relExport.addEventListener('click', function () {
        relExport.disabled = true;
        relExport.textContent = '\u23F3 Exporting...';
        fetch('http://localhost:3000/api/results/health')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          relExport.disabled = false;
          relExport.textContent = 'Export Report';
          if (data.error) { AETHER.app.showToast('No health data. Run health check first.', 'warning'); return; }
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'aether_health_report_' + new Date().toISOString().slice(0, 10) + '.json';
          link.click();
          URL.revokeObjectURL(url);
          AETHER.app.showToast('Health report downloaded!', 'success');
        })
        .catch(function () {
          relExport.disabled = false;
          relExport.textContent = 'Export Report';
          AETHER.app.showToast('Backend offline.', 'error');
        });
      });
    }
    var relAlerts = document.getElementById('btn-rel-alerts');
    if (relAlerts) {
      relAlerts.addEventListener('click', function () { AETHER.app.showToast('Alert configuration coming soon.', 'info'); });
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   PAGE 2 — Cost Optimization
   ───────────────────────────────────────────────────────────── */
AETHER.pages.cost = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var costData = d.computeCostBreakdown();
    var topAgents = costData.topAgents;
    var recs = costData.recommendations;

    if (d.getTotalAgentCount() === 0) {
      return '' +
        '<div class="page-content">' +
          '<div class="page-header animate-fade-in-up">' +
            '<div class="page-header-left">' +
              '<h1 class="page-title">Cost Optimization</h1>' +
              '<p class="page-subtitle">AI spending analysis, optimization, and budget management</p>' +
            '</div>' +
          '</div>' +
          '<div class="empty-state animate-fade-in-up stagger-1">' +
            '<div class="empty-state-icon">💰</div>' +
            '<div class="empty-state-title">No Cost Data Available</div>' +
            '<div class="empty-state-desc">Onboard agents to begin tracking costs, spending, and optimization opportunities.</div>' +
          '</div>' +
        '</div>';
    }

    var maxCost = 0;
    for (var m = 0; m < topAgents.length; m++) {
      if (topAgents[m].cost > maxCost) maxCost = topAgents[m].cost;
    }

    /* ── KPIs ────────────────────────────────────── */
    var kpiHTML = '' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/costPerAgent\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6h5.5a2.5 2.5 0 010 5H6m0 0h6.5a2.5 2.5 0 010 5H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<span class="kpi-trend up">↓ -$80</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">$' + d.formatNumber(kpis.costPerAgent) + '/mo</div>' +
          '<div class="kpi-label">Cost Per Agent</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-cost-agent" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/costPerTask\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l4-4m0 0l4 4m-4-4V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 3h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<span class="kpi-trend up">↓ -$0.02</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">$' + Number(kpis.costPerTask).toFixed(2) + '</div>' +
          '<div class="kpi-label">Cost Per Task</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-cost-task" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/tokenSpend\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon purple"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>' +
            '<span class="kpi-trend down">↑ +$200K</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatCurrency(kpis.tokenSpend) + '</div>' +
          '<div class="kpi-label">Token Spend</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-token" style="height:32px"></canvas></div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/infraCost\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 7h14M7 3v14" stroke="currentColor" stroke-width="1.5"/></svg></div>' +
            '<span class="kpi-trend up">↓ -$50K</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatCurrency(kpis.infraCost) + '</div>' +
          '<div class="kpi-label">Infrastructure Cost</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-infra" style="height:32px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Charts ──────────────────────────────────── */
    var chartsHTML = '' +
      '<div class="charts-grid animate-fade-in-up stagger-5">' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Cost Per Agent Trend</div>' +
              '<div class="chart-card-subtitle">Monthly average cost declining through optimization</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-cost-trend" style="height:280px"></canvas></div>' +
        '</div>' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Cost Breakdown by Platform</div>' +
              '<div class="chart-card-subtitle">Monthly spending distribution across platforms</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-cost-platform" style="height:280px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Top Agents Table ─────────────────────────── */
    var agentRows = '';
    for (var i = 0; i < topAgents.length; i++) {
      var a = topAgents[i];
      var pct = Math.round((a.cost / maxCost) * 100);
      agentRows += '' +
        '<tr>' +
          '<td style="cursor:pointer;text-decoration:underline;" onclick="var found=AETHER.data.getAllAgents().find(function(x){return x.name===\'' + a.name.replace(/'/g, "\\'") + '\'}); if(found) window.location.hash=\'#profile/\'+found.id;" title="Click to view agent profile"><span class="table-agent-name">' + a.name + '</span></td>' +
          '<td class="tabular-nums" style="font-weight:700;color:var(--text-primary);cursor:pointer;" onclick="window.location.hash=\'#rationale/monthlySpend\'" title="Click to view spend rationale">$' + a.cost.toLocaleString() + '</td>' +
          '<td class="tabular-nums" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/workforceROI\'" title="Click to view workforce ROI rationale">' + d.formatNumber(a.tasks) + '</td>' +
          '<td class="tabular-nums" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/costPerTask\'" title="Click to view cost per task rationale">$' + a.costPerTask.toFixed(3) + '</td>' +
          '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/monthlySpend\'" title="Click to view monthly spend rationale">' +
            '<div class="progress-bar" style="width:120px;height:6px">' +
              '<div class="progress-fill blue" style="width:' + pct + '%"></div>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }

    var tableHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-6">Most Expensive Agents</div>' +
      '<div class="table-container animate-fade-in-up stagger-6">' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/totalAgents\'" title="Click to view total agents rationale">Agent Name</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/monthlySpend\'" title="Click to view monthly spend rationale">Monthly Cost</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/workforceROI\'" title="Click to view workforce ROI rationale">Tasks/Month</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/costPerTask\'" title="Click to view cost per task rationale">Cost Per Task</th>' +
              '<th style="cursor:pointer;" onclick="window.location.hash=\'#rationale/monthlySpend\'" title="Click to view monthly spend rationale">Relative Cost</th>' +
            '</tr></thead>' +
            '<tbody>' + agentRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    /* ── Recommendations ──────────────────────────── */
    var recCards = '';
    for (var r = 0; r < recs.length; r++) {
      var rec = recs[r];
      var priBadge = rec.priority === 'High' ? 'badge badge-danger' : 'badge badge-warning';
      recCards += '' +
        '<div class="recommendation-card">' +
          '<div class="recommendation-icon">💡</div>' +
          '<div class="recommendation-content">' +
            '<div class="recommendation-title">' + rec.title + ' <span class="' + priBadge + '">' + rec.priority + '</span></div>' +
            '<div class="recommendation-desc">' + rec.description + '</div>' +
            '<div class="recommendation-savings">' + rec.savings + ' estimated savings</div>' +
          '</div>' +
        '</div>';
    }

    var recsHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-7">Optimization Recommendations</div>' +
      '<div class="flex-col gap-4 animate-fade-in-up stagger-7">' + recCards + '</div>';

    return '' +
      '<div class="page-content">' +
        '<div class="page-header animate-fade-in-up">' +
          '<div class="page-header-left">' +
            '<h1 class="page-title">Cost Optimization</h1>' +
            '<p class="page-subtitle">AI spending analysis, optimization, and budget management</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button class="btn btn-secondary btn-sm" id="btn-run-cost">Run Cost Analysis</button>' +
            '<button class="btn btn-secondary btn-sm" id="btn-cost-export">Download Report</button>' +
            '<button class="btn btn-primary btn-sm" id="btn-cost-budget">Set Budget Alert</button>' +
          '</div>' +
        '</div>' +
        kpiHTML +
        chartsHTML +
        tableHTML +
        recsHTML +
      '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    if (d.getTotalAgentCount() === 0) return;

    var kpis = d.computeKPIs();
    var costData = d.computeCostBreakdown();
    var cpa = kpis.costPerAgent || 0;
    var cpt = Number(kpis.costPerTask) || 0;
    var tok = kpis.tokenSpend || 0;
    var infra = kpis.infraCost || 0;

    /* Sparklines — generate from computed values */
    var sparkCPA = [];
    var sparkCPT = [];
    var sparkTok = [];
    var sparkInfra = [];
    for (var i = 0; i < 12; i++) {
      var frac = (12 - i) / 12;
      sparkCPA.push(Math.round(cpa * (1 + frac * 0.15)));
      sparkCPT.push(+(cpt * (1 + frac * 0.1)).toFixed(3));
      sparkTok.push(Math.round(tok * (0.85 + i * 0.015)));
      sparkInfra.push(Math.round(infra * (1 + frac * 0.1)));
    }
    AETHER.charts.createSparkline('spark-cost-agent', sparkCPA, '#3b82f6');
    AETHER.charts.createSparkline('spark-cost-task', sparkCPT, '#06b6d4');
    AETHER.charts.createSparkline('spark-token', sparkTok, '#8b5cf6');
    AETHER.charts.createSparkline('spark-infra', sparkInfra, '#f59e0b');

    /* Cost Per Agent Trend line chart */
    AETHER.charts.createLineChart('chart-cost-trend', d.months, [
      { label: 'Cost Per Agent', data: sparkCPA, color: '#3b82f6', fill: true, width: 2.5 }
    ], {
      yFormat: function (v) { return '$' + v.toLocaleString(); }
    });

    /* Cost Breakdown doughnut */
    var bp = costData.byPlatform;
    AETHER.charts.createDoughnutChart('chart-cost-platform', bp.labels, bp.data, bp.colors, {
      legend: true,
      legendPosition: 'bottom'
    });

    /* Button handlers */
    var costRunBtn = document.getElementById('btn-run-cost');
    if (costRunBtn) {
      costRunBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAgentAnalysis) { AETHER.app.showToast('Backend not connected.', 'error'); return; }
        costRunBtn.disabled = true;
        costRunBtn.textContent = '\u23F3 Running cost analysis...';
        AETHER.runtime.runAgentAnalysis('cost', function (err, data) {
          costRunBtn.disabled = false;
          costRunBtn.textContent = '\u2705 Run Cost Analysis';
          if (err) { AETHER.app.showToast('Cost agent failed: ' + err.message, 'error'); return; }
          AETHER.app.showToast('Cost analysis complete \u2014 Total: $' + (data.total_monthly_spend || 0) + '/mo, ' + ((data.recommendations || []).length || 0) + ' recommendations', 'success');
          AETHER.app.navigateTo('cost');
        });
      });
    }
    var costExport = document.getElementById('btn-cost-export');
    if (costExport) {
      costExport.addEventListener('click', function () {
        costExport.disabled = true;
        costExport.textContent = '\u23F3 Exporting...';
        fetch('http://localhost:3000/api/results/cost')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          costExport.disabled = false;
          costExport.textContent = 'Download Report';
          if (data.error) { AETHER.app.showToast('No cost data. Run cost analysis first.', 'warning'); return; }
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'aether_cost_report_' + new Date().toISOString().slice(0, 10) + '.json';
          link.click();
          URL.revokeObjectURL(url);
          AETHER.app.showToast('Cost report downloaded!', 'success');
        })
        .catch(function () {
          costExport.disabled = false;
          costExport.textContent = 'Download Report';
          AETHER.app.showToast('Backend offline.', 'error');
        });
      });
    }
    var costBudget = document.getElementById('btn-cost-budget');
    if (costBudget) {
      costBudget.addEventListener('click', function () { AETHER.app.showToast('Budget alert configuration coming soon.', 'info'); });
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   PAGE 3 — Benchmark Network
   ───────────────────────────────────────────────────────────── */
AETHER.pages.benchmark = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();

    if (d.getTotalAgentCount() === 0) {
      return '' +
        '<div class="page-content">' +
          '<div class="page-header animate-fade-in-up">' +
            '<div class="page-header-left">' +
              '<h1 class="page-title">Benchmark Network</h1>' +
              '<p class="page-subtitle">Compare your AI workforce performance against industry standards</p>' +
            '</div>' +
          '</div>' +
          '<div class="empty-state animate-fade-in-up stagger-1">' +
            '<div class="empty-state-icon">📊</div>' +
            '<div class="empty-state-title">No Benchmark Data</div>' +
            '<div class="empty-state-desc">Onboard agents to compare your AI workforce performance against industry benchmarks.</div>' +
          '</div>' +
        '</div>';
    }

    /* Build benchmarks from live computed KPIs — single source of truth
       shared with init()'s radar chart and the rationale drill-downs. */
    var benchmarks = d.computeBenchmarks();

    /* ── Derived hero-card metrics (computed once, reused below so the
       label always matches the number) ──────────────────────────── */
    var lowerIsBetterMap = { 'Cost Per Task': true, 'Mean Time to Resolve': true, 'Avg Response Time': true, 'Avg Risk Score': true };
    var assessedBenchmarks = benchmarks.filter(function (b) { return !b.notAssessed; });
    var metricsAboveCount = 0;
    for (var mai = 0; mai < assessedBenchmarks.length; mai++) {
      var mab = assessedBenchmarks[mai];
      if (lowerIsBetterMap[mab.metric] ? mab.company < mab.industry : mab.company > mab.industry) metricsAboveCount++;
    }
    var biggestGapMetric = 'N/A', biggestGapPct = 0, biggestGapFavorsUs = true;
    for (var bgi = 0; bgi < assessedBenchmarks.length; bgi++) {
      var bg = assessedBenchmarks[bgi];
      var gapPct = Math.abs(((bg.company - bg.industry) / Math.max(bg.industry, 0.01)) * 100);
      if (gapPct > biggestGapPct) {
        biggestGapPct = gapPct;
        biggestGapMetric = bg.metric;
        biggestGapFavorsUs = lowerIsBetterMap[bg.metric] ? bg.company < bg.industry : bg.company > bg.industry;
      }
    }
    // Cost Advantage: positive means our cost/task is BELOW the $0.18 industry benchmark (good);
    // negative means we are above it. Both directions are rendered correctly below.
    var costAdvantagePct = parseFloat(kpis.costPerTask) > 0 ? Math.round((1 - parseFloat(kpis.costPerTask) / 0.18) * 100) : null;
    // Reliability gap vs the industry benchmark used in the "Agent Reliability" row above.
    var reliabilityVal = parseFloat(kpis.availability) || 0;
    var reliabilityIndustry = 97.2;
    var reliabilityGapPts = reliabilityVal - reliabilityIndustry;

    /* ── KPIs ────────────────────────────────────── */
    var kpiHTML = '' +
      '<div class="kpi-grid">' +
        '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/overallRanking\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8L18 7.6l-4 3.9.9 5.5L10 14.5 5.1 17l.9-5.5-4-3.9 5.6-.8L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></div>' +
            '<span class="kpi-trend up">↑</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (parseFloat(kpis.availability) > 99 ? 'Top 5%' : parseFloat(kpis.availability) > 98 ? 'Top 15%' : 'Top 30%') + '</div>' +
          '<div class="kpi-label">Overall Ranking</div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/metricsAboveBenchmark\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="1.5"/></svg></div>' +
            '<span class="kpi-trend ' + (metricsAboveCount >= assessedBenchmarks.length / 2 ? 'up' : 'down') + '">' + (metricsAboveCount >= assessedBenchmarks.length / 2 ? '↑' : '↓') + ' ' + metricsAboveCount + '/' + assessedBenchmarks.length + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + metricsAboveCount + '/' + assessedBenchmarks.length + '</div>' +
          '<div class="kpi-label">Metrics Above Benchmark</div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/biggestGap\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17l5-5m0 0l5 5m-5-5V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<span class="kpi-trend ' + (biggestGapFavorsUs ? 'up' : 'down') + '">' + (biggestGapFavorsUs ? '↑' : '↓') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (biggestGapFavorsUs ? '+' : '-') + biggestGapPct.toFixed(1) + '%</div>' +
          '<div class="kpi-label">Biggest Gap: ' + biggestGapMetric + '</div>' +
        '</div>' +
        '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/costAdvantage\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon ' + (costAdvantagePct === null ? 'green' : (costAdvantagePct >= 0 ? 'green' : 'red')) + '"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v16M6 6h5.5a2.5 2.5 0 010 5H6m0 0h6.5a2.5 2.5 0 010 5H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<span class="kpi-trend ' + (costAdvantagePct === null ? 'neutral' : (costAdvantagePct >= 0 ? 'up' : 'down')) + '">' + (costAdvantagePct === null ? '—' : (costAdvantagePct >= 0 ? '↑' : '↓')) + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (costAdvantagePct === null ? 'N/A' : (costAdvantagePct >= 0 ? costAdvantagePct + '% lower' : Math.abs(costAdvantagePct) + '% higher')) + '</div>' +
          '<div class="kpi-label">Cost Advantage</div>' +
        '</div>' +
      '</div>';

    /* ── Benchmark Table ──────────────────────────── */
    var lowerIsBetter = { 'Cost Per Task': true, 'Mean Time to Resolve': true, 'Avg Response Time': true, 'Avg Risk Score': true };
    var benchRows = '';
    var hashMap = {
      'Agent Reliability': '#rationale/availability',
      'Agent Utilization': '#rationale/agentUtilization',
      'Cost Per Task': '#rationale/costPerTask',
      'Compliance Score': '#rationale/complianceScore',
      'Avg Risk Score': '#rationale/avgRiskScore',
      'Discovery Coverage': '#rationale/discoveryCoverage',
      'Policy Adherence': '#rationale/policyAdherence',
      'Avg Response Time': '#rationale/avgLatency',
      'Mean Time to Resolve': '#rationale/criticalIncidents'
    };
    for (var i = 0; i < benchmarks.length; i++) {
      var b = benchmarks[i];
      var targetHash = hashMap[b.metric] || '#rationale/totalAgents';

      // Handle unassessed metrics
      if (b.notAssessed) {
        benchRows += '' +
          '<div class="benchmark-row">' +
            '<div style="font-weight:500;color:var(--text-primary);cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + b.metric + '</div>' +
            '<div class="tabular-nums" style="font-weight:700;color:var(--text-secondary);cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">N/A</div>' +
            '<div class="tabular-nums text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + b.industry + '' + b.unit + '</div>' +
            '<div class="tabular-nums text-secondary" style="font-weight:600;cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">—</div>' +
            '<div class="benchmark-bar-container" style="cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' +
              '<div class="benchmark-bar" style="width:0%;background:#3b82f6"></div>' +
              '<div class="benchmark-bar" style="width:100%;background:rgba(122,133,160,0.3)"></div>' +
            '</div>' +
          '</div>';
        continue;
      }

      var diff = b.company - b.industry;
      var variance = ((diff / b.industry) * 100).toFixed(1);
      var isBetter;
      if (lowerIsBetter[b.metric]) {
        isBetter = b.company < b.industry;
        variance = (((b.industry - b.company) / b.industry) * 100).toFixed(1);
      } else {
        isBetter = b.company > b.industry;
      }
      var varColor = isBetter ? 'text-success' : 'text-danger';
      var varSign = isBetter ? '+' : '-';
      var companyColor = isBetter ? 'color:var(--color-success)' : 'color:var(--color-danger)';

      var maxVal = Math.max(b.company, b.industry);
      var companyPct = maxVal > 0 ? Math.round((b.company / maxVal) * 100) : 0;
      var industryPct = maxVal > 0 ? Math.round((b.industry / maxVal) * 100) : 0;

      benchRows += '' +
        '<div class="benchmark-row">' +
          '<div style="font-weight:500;color:var(--text-primary);cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + b.metric + '</div>' +
          '<div class="tabular-nums" style="font-weight:700;' + companyColor + ';cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + b.company + '' + b.unit + '</div>' +
          '<div class="tabular-nums text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + b.industry + '' + b.unit + '</div>' +
          '<div class="tabular-nums ' + varColor + '" style="font-weight:600;cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' + varSign + variance + '%</div>' +
          '<div class="benchmark-bar-container" style="cursor:pointer;" onclick="window.location.hash=\'' + targetHash + '\'" title="Click to view metric rationale">' +
            '<div class="benchmark-bar" style="width:' + companyPct + '%;background:#3b82f6"></div>' +
            '<div class="benchmark-bar" style="width:' + industryPct + '%;background:rgba(122,133,160,0.3)"></div>' +
          '</div>' +
        '</div>';
    }

    var benchTableHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-5">Performance Comparison</div>' +
      '<div class="card animate-fade-in-up stagger-5">' +
        '<div class="card-body" style="padding:0">' +
          '<div class="benchmark-row" style="border-bottom:1px solid var(--border-primary);background:var(--bg-elevated);border-radius:var(--radius-lg) var(--radius-lg) 0 0">' +
            '<div style="font-weight:600;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Metric</div>' +
            '<div style="font-weight:600;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Company</div>' +
            '<div style="font-weight:600;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Industry Avg</div>' +
            '<div style="font-weight:600;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Variance</div>' +
            '<div style="font-weight:600;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary)">Comparison</div>' +
          '</div>' +
          benchRows +
        '</div>' +
      '</div>';

    /* ── Radar Chart ──────────────────────────────── */
    var radarHTML = '' +
      '<div class="charts-grid full animate-fade-in-up stagger-6" style="grid-template-columns:1fr">' +
        '<div class="chart-card" style="max-width:600px;margin:0 auto;width:100%">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Company vs Industry Benchmark</div>' +
              '<div class="chart-card-subtitle">Normalized scores across all performance metrics</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-benchmark-radar" style="height:350px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Recommendations ──────────────────────────── */
    var recsHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-7">Key Recommendations</div>' +
      '<div class="flex-col gap-4 animate-fade-in-up stagger-7">' +
        '<div class="recommendation-card">' +
          '<div class="recommendation-icon">' + (reliabilityGapPts >= 0 ? '🏆' : '⚠️') + '</div>' +
          '<div class="recommendation-content">' +
            '<div class="recommendation-title">' + (reliabilityGapPts >= 0 ? 'Maintain Reliability Lead' : 'Close Reliability Gap') + '</div>' +
            '<div class="recommendation-desc">' + (reliabilityGapPts >= 0 ?
              'Your ' + reliabilityVal.toFixed(1) + '% reliability exceeds the industry average by ' + reliabilityGapPts.toFixed(1) + ' percentage points. Continue investing in monitoring and incident response to sustain this competitive advantage.' :
              'Your ' + reliabilityVal.toFixed(1) + '% reliability is ' + Math.abs(reliabilityGapPts).toFixed(1) + ' percentage points below the ' + reliabilityIndustry + '% industry average. Investigate recurring failures and invest in monitoring and incident response to close the gap.'
            ) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="recommendation-card">' +
          '<div class="recommendation-icon">💰</div>' +
          '<div class="recommendation-content">' +
            '<div class="recommendation-title">' + (costAdvantagePct === null || costAdvantagePct >= 0 ? 'Expand Cost Advantage' : 'Close Cost Gap') + '</div>' +
            '<div class="recommendation-desc">' + (costAdvantagePct === null ?
              'No task volume recorded yet, so cost per task cannot be compared to the $0.18 industry average.' :
              costAdvantagePct >= 0 ?
              'Cost per task is ' + costAdvantagePct + '% below industry average at $' + parseFloat(kpis.costPerTask).toFixed(2) + ' vs $0.18. Continue optimization strategies including token reduction and batch processing to widen the gap.' :
              'Cost per task is ' + Math.abs(costAdvantagePct) + '% above industry average at $' + parseFloat(kpis.costPerTask).toFixed(2) + ' vs $0.18. Investigate token usage and consider batch processing to close the gap.'
            ) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="recommendation-card">' +
          '<div class="recommendation-icon">⚡</div>' +
          '<div class="recommendation-content">' +
            '<div class="recommendation-title">' + (kpis.agentUtilization >= 72 ? 'Manage Utilization Headroom' : 'Close Utilization Gap') + '</div>' +
            '<div class="recommendation-desc">' + (kpis.agentUtilization >= 72 ?
              'Agent utilization at ' + kpis.agentUtilization + '% is ' + (kpis.agentUtilization - 72) + ' points above the industry average of 72%. Consider workload balancing and capacity planning to maintain optimal throughput without burnout.' :
              'Agent utilization at ' + kpis.agentUtilization + '% is ' + (72 - kpis.agentUtilization) + ' points below the industry average of 72%. Investigate idle or underused agents and consider consolidating or retiring them.'
            ) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return '' +
      '<div class="page-content">' +
        '<div class="page-header animate-fade-in-up">' +
          '<div class="page-header-left">' +
            '<h1 class="page-title">Benchmark Network</h1>' +
            '<p class="page-subtitle">Compare your AI workforce performance against industry standards</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button class="btn btn-secondary btn-sm" id="btn-bench-export">Download Benchmark</button>' +
          '</div>' +
        '</div>' +
        kpiHTML +
        benchTableHTML +
        radarHTML +
        recsHTML +
      '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    if (d.getTotalAgentCount() === 0) return;

    /* Build benchmarks from live computed KPIs — same source of truth as
       render() above, so the radar chart never drifts from the table. */
    var benchmarks = d.computeBenchmarks().filter(function (b) { return !b.notAssessed; });

    /* Normalize values to 0-100 scale for radar */
    var lowerIsBetter = { 'Cost Per Task': true, 'Avg Risk Score': true, 'Avg Response Time': true };
    var labels = [];
    var companyData = [];
    var industryData = [];
    for (var i = 0; i < benchmarks.length; i++) {
      var b = benchmarks[i];
      labels.push(b.metric);

      var maxVal = Math.max(b.company, b.industry) * 1.2;
      if (lowerIsBetter[b.metric]) {
        /* Invert: lower value -> higher score */
        companyData.push(Math.round((1 - b.company / maxVal) * 100));
        industryData.push(Math.round((1 - b.industry / maxVal) * 100));
      } else {
        companyData.push(Math.round((b.company / maxVal) * 100));
        industryData.push(Math.round((b.industry / maxVal) * 100));
      }
    }

    AETHER.charts.createRadarChart('chart-benchmark-radar', labels, [
      { label: 'Your Company', data: companyData, color: '#3b82f6' },
      { label: 'Industry Average', data: industryData, color: '#8b5cf6' }
    ]);

    /* Button handler */
    var benchExport = document.getElementById('btn-bench-export');
    if (benchExport) {
      benchExport.addEventListener('click', function () { alert('Benchmark data export coming soon.'); });
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   PAGE 4 — Business Impact
   ───────────────────────────────────────────────────────────── */
AETHER.pages.impact = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var totalAgents = d.getTotalAgentCount();

    if (totalAgents === 0) {
      return '' +
        '<div class="page-content">' +
          '<div class="page-header animate-fade-in-up">' +
            '<div class="page-header-left">' +
              '<h1 class="page-title">Business Impact</h1>' +
              '<p class="page-subtitle">Quantified business outcomes and ROI from your AI workforce</p>' +
            '</div>' +
          '</div>' +
          '<div class="empty-state animate-fade-in-up stagger-1">' +
            '<div class="empty-state-icon">📈</div>' +
            '<div class="empty-state-title">No Impact Data</div>' +
            '<div class="empty-state-desc">Onboard agents to track business outcomes, ROI, and workforce impact.</div>' +
          '</div>' +
        '</div>';
    }

    /* Compute business impact from live agent data */
    var allAgents = d.getAllAgents();
    var impacts = [];
    var deptMap = {};
    for (var ai = 0; ai < allAgents.length; ai++) {
      var ag = allAgents[ai];
      var dept = ag.department || 'Other';
      if (!deptMap[dept]) deptMap[dept] = { tasks: 0, cost: 0, count: 0 };
      deptMap[dept].tasks += (ag.tasksExecuted || 0);
      deptMap[dept].cost += (ag.monthlyCost || 0);
      deptMap[dept].count++;
    }
    var impactIcons = ['⚡', '💰', '📊', '🛡️', '🎯', '🔧', '📋', '🚀', '🔍', '📡'];
    var impactColors = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
    var deptKeys = Object.keys(deptMap);
    for (var di = 0; di < deptKeys.length; di++) {
      var dk = deptKeys[di];
      var dd = deptMap[dk];
      impacts.push({
        icon: impactIcons[di % impactIcons.length],
        agent: dk + ' (' + dd.count + ' agents)',
        value: d.formatNumber(dd.tasks) + ' tasks processed',
        description: d.formatCurrency(dd.cost) + ' monthly spend across ' + dd.count + ' agent' + (dd.count > 1 ? 's' : ''),
        color: impactColors[di % impactColors.length]
      });
    }

    /* ── Hero ROI Card ────────────────────────────── */
    var heroHTML = '' +
      '<div class="animate-fade-in-up stagger-1" style="' +
        'background:linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.05) 100%);' +
        'border:1px solid rgba(59,130,246,0.15);' +
        'border-radius:var(--radius-lg);' +
        'padding:var(--space-16) var(--space-8);' +
        'text-align:center;' +
        'position:relative;' +
        'overflow:hidden;' +
        'margin-bottom:var(--space-8)' +
      '">' +
        '<div style="position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(59,130,246,0.06),transparent 70%);pointer-events:none"></div>' +
        '<div style="position:relative;z-index:1">' +
          '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:0.12em;color:var(--accent-cyan);margin-bottom:var(--space-4)">AI Workforce ROI</div>' +
          '<div style="font-size:var(--text-5xl);font-weight:var(--weight-extrabold);line-height:1;margin-bottom:var(--space-4);background:linear-gradient(135deg,#3b82f6,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text" class="tabular-nums">' + kpis.workforceROI + '%</div>' +
          '<div style="font-size:var(--text-base);color:var(--text-secondary);margin-bottom:var(--space-8)">Return on Investment across all AI agents</div>' +
          '<div style="display:flex;justify-content:center;gap:var(--space-10);flex-wrap:wrap">' +
            '<div style="text-align:center">' +
              '<div class="tabular-nums" style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--text-primary)">' + d.formatCurrency(kpis.monthlySpend) + '</div>' +
              '<div style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-1)">Monthly Spend</div>' +
            '</div>' +
            '<div style="width:1px;background:var(--border-primary);align-self:stretch"></div>' +
            '<div style="text-align:center">' +
              '<div class="tabular-nums" style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--color-success)">' + d.formatCurrency(Math.round(kpis.monthlySpend * (1 + kpis.workforceROI / 100))) + '</div>' +
              '<div style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-1)">Monthly Value</div>' +
            '</div>' +
            '<div style="width:1px;background:var(--border-primary);align-self:stretch"></div>' +
            '<div style="text-align:center">' +
              '<div class="tabular-nums" style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--accent-cyan)">' + d.formatCurrency(Math.round(kpis.monthlySpend * kpis.workforceROI / 100)) + '</div>' +
              '<div style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-1)">Net Impact</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* ── Impact Cards Grid ────────────────────────── */
    var impactCards = '';
    for (var i = 0; i < impacts.length; i++) {
      var imp = impacts[i];
      var stagger = (i % 3) + 2;
      impactCards += '' +
        '<div class="impact-card animate-fade-in-up stagger-' + stagger + '" style="position:relative">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:' + imp.color + ';border-radius:var(--radius-lg) var(--radius-lg) 0 0"></div>' +
          '<div style="font-size:var(--text-2xl);margin-bottom:var(--space-3)">' + imp.icon + '</div>' +
          '<div class="impact-card-agent">' + imp.agent + '</div>' +
          '<div class="impact-card-value">' + imp.value + '</div>' +
          '<div class="impact-card-desc">' + imp.description + '</div>' +
        '</div>';
    }

    var impactGridHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-2">Business Outcomes</div>' +
      '<div class="grid-3" style="margin-bottom:var(--space-8)">' + impactCards + '</div>';

    /* ── Charts ──────────────────────────────────── */
    var chartsHTML = '' +
      '<div class="charts-grid animate-fade-in-up stagger-5">' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Spend by Department</div>' +
              '<div class="chart-card-subtitle">Total AI workforce spend ($K)</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-impact-dept" style="height:280px"></canvas></div>' +
        '</div>' +
        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">ROI Trend (12 Months)</div>' +
              '<div class="chart-card-subtitle">Return on investment growth trajectory</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="chart-roi-trend" style="height:280px"></canvas></div>' +
        '</div>' +
      '</div>';

    /* ── Executive Summary ─────────────────────────── */
    var summaryHTML = '' +
      '<div class="section-title animate-fade-in-up stagger-6">Executive Summary</div>' +
      '<div class="card animate-fade-in-up stagger-6">' +
        '<div class="card-body">' +
          '<blockquote style="' +
            'border-left:4px solid var(--accent-blue);' +
            'padding-left:var(--space-6);' +
            'margin:0;' +
            'font-size:var(--text-md);' +
            'line-height:var(--leading-relaxed);' +
            'color:var(--text-secondary)' +
          '">' +
            'AETHER manages <strong style="color:var(--text-primary)">' + d.formatNumber(totalAgents) + ' AI agents</strong> across <strong style="color:var(--text-primary)">' + (function() { var ps = {}; for (var pi = 0; pi < allAgents.length; pi++) { ps[allAgents[pi].platform] = true; } return Object.keys(ps).length; })() + ' enterprise platforms</strong>, delivering a <strong style="color:var(--color-success)">' + kpis.workforceROI + '% ROI</strong>. ' +
            'The AI workforce is operating at <strong style="color:var(--text-primary)">' + d.formatCurrency(kpis.monthlySpend) + '/month</strong> with <strong style="color:var(--text-primary)">' + d.formatNumber(kpis.totalAgents) + ' active agents</strong>. ' +
            'With <strong style="color:var(--color-success)">' + kpis.availability + '% reliability</strong> and <strong style="color:var(--color-success)">' + kpis.complianceScore + '% compliance</strong>, AETHER ensures enterprise-grade governance while maximizing business impact.' +
          '</blockquote>' +
        '</div>' +
      '</div>';

    /* ── Tagline Card ─────────────────────────────── */
    var taglineHTML = '' +
      '<div class="animate-fade-in-up stagger-8" style="' +
        'text-align:center;' +
        'margin-top:var(--space-8);' +
        'padding:var(--space-10) var(--space-8);' +
        'background:var(--bg-card);' +
        'border:1px solid rgba(59,130,246,0.15);' +
        'border-radius:var(--radius-lg);' +
        'position:relative;' +
        'overflow:hidden;' +
        'box-shadow:0 0 40px rgba(59,130,246,0.06),0 0 80px rgba(139,92,246,0.04)' +
      '">' +
        '<div style="position:absolute;inset:0;border-radius:var(--radius-lg);box-shadow:inset 0 0 30px rgba(59,130,246,0.05);pointer-events:none"></div>' +
        '<div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(ellipse at center,rgba(59,130,246,0.04),transparent 60%);pointer-events:none;animation:pulse 4s ease-in-out infinite"></div>' +
        '<div style="' +
          'font-size:var(--text-xl);' +
          'font-weight:var(--weight-bold);' +
          'letter-spacing:var(--tracking-wide);' +
          'background:linear-gradient(135deg,#e8ecf4,#3b82f6,#8b5cf6,#06b6d4,#e8ecf4);' +
          'background-size:200% auto;' +
          '-webkit-background-clip:text;' +
          '-webkit-text-fill-color:transparent;' +
          'background-clip:text;' +
          'position:relative;' +
          'z-index:1' +
        '">AETHER is the System of Record for Enterprise AI Workforces.</div>' +
      '</div>';

    return '' +
      '<div class="page-content">' +
        '<div class="page-header animate-fade-in-up">' +
          '<div class="page-header-left">' +
            '<h1 class="page-title">Business Impact</h1>' +
            '<p class="page-subtitle">Quantified business outcomes and ROI from your AI workforce</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button class="btn btn-secondary btn-sm" id="btn-impact-export">Export to PDF</button>' +
            '<button class="btn btn-primary btn-sm" id="btn-impact-share">Share with Board</button>' +
          '</div>' +
        '</div>' +
        heroHTML +
        impactGridHTML +
        chartsHTML +
        summaryHTML +
        taglineHTML +
      '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    if (d.getTotalAgentCount() === 0) return;

    var kpis = d.computeKPIs();
    var allAgents = d.getAllAgents();

    /* Impact by Department — compute from live agents */
    var deptCosts = {};
    for (var i = 0; i < allAgents.length; i++) {
      var ag = allAgents[i];
      var dept = ag.department || 'Other';
      deptCosts[dept] = (deptCosts[dept] || 0) + (ag.monthlyCost || 0);
    }
    var deptKeys = Object.keys(deptCosts).sort(function (a, b) { return deptCosts[b] - deptCosts[a]; }).slice(0, 6);
    var deptValues = deptKeys.map(function (k) { return Math.round(deptCosts[k] / 1000); });
    var deptColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

    AETHER.charts.createHorizontalBar(
      'chart-impact-dept',
      deptKeys,
      deptValues,
      deptColors.slice(0, deptKeys.length),
      {
        yFormat: function (v) { return '$' + v + 'K'; }
      }
    );

    /* ROI Trend — generate from computed ROI with growth trajectory */
    var roi = kpis.workforceROI || 0;
    var roiData = [];
    for (var j = 0; j < 12; j++) {
      roiData.push(Math.round(roi * (0.5 + j * 0.05)));
    }
    AETHER.charts.createAreaChart('chart-roi-trend', d.months, [
      { label: 'ROI %', data: roiData, color: '#10b981', fill: true, width: 2.5, points: false }
    ], {
      yFormat: function (v) { return v + '%'; }
    });

    /* Button handlers */
    var impactExport = document.getElementById('btn-impact-export');
    if (impactExport) {
      impactExport.addEventListener('click', function () { alert('Business impact report export coming soon.'); });
    }
    var impactShare = document.getElementById('btn-impact-share');
    if (impactShare) {
      impactShare.addEventListener('click', function () { alert('Board sharing feature coming soon.'); });
    }
  }
};
