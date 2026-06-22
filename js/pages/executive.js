/* ═══════════════════════════════════════════════════════════════
   AETHER Executive Pages
   CIO · CISO · CFO · Settings
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.executiveViewMode = AETHER.pages.executiveViewMode || 'cumulative';

AETHER.pages.renderViewModeToggle = function (currentMode) {
  var activeClass = currentMode !== 'cumulative' ? 'btn-primary' : 'btn-secondary';
  var cumClass = currentMode === 'cumulative' ? 'btn-primary' : 'btn-secondary';
  return '<div class="view-mode-toggle" style="display:inline-flex;background:var(--bg-topbar);border:1px solid var(--border-primary);border-radius:var(--radius-md);padding:2px;margin-left:16px;vertical-align:middle;box-shadow:inset 0 1px 2px rgba(0,0,0,0.2);">' +
           '<button id="btn-toggle-active" class="btn btn-xs ' + activeClass + '" style="padding:4px 10px;font-size:11px;border:none;cursor:pointer;border-radius:var(--radius-sm);line-height:1.2;">Active Fleet</button>' +
           '<button id="btn-toggle-cumulative" class="btn btn-xs ' + cumClass + '" style="padding:4px 10px;font-size:11px;border:none;cursor:pointer;border-radius:var(--radius-sm);line-height:1.2;">Cumulative (SQL)</button>' +
         '</div>';
};

AETHER.pages.executiveShowDeboardedModal = function() {
  var d = AETHER.data;
  var dbStats = d.dbStats;
  var list = dbStats.deboarded_agents || [];
  
  // Remove any existing modal first
  var old = document.getElementById('deboarded-modal-backdrop');
  if (old) old.remove();
  
  var rows = '';
  if (list.length === 0) {
    rows = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-secondary);">No agents have been deboarded from the system.</td></tr>';
  } else {
    list.forEach(function(ag) {
      var date = new Date(ag.deboardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      rows += '<tr>' +
                '<td class="font-mono">' + ag.id + '</td>' +
                '<td>' + ag.name + '</td>' +
                '<td>' + ag.platform + '</td>' +
                '<td>' + ag.department + '</td>' +
                '<td class="text-secondary">' + date + '</td>' +
                '<td><span class="badge badge-neutral">' + ag.reason + '</span></td>' +
              '</tr>';
    });
  }
  
  var modalHTML = 
    '<div class="modal-backdrop" id="deboarded-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.2s ease;">' +
      '<div class="modal" style="background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);width:800px;max-width:90%;max-height:85vh;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;">' +
        '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-primary);">' +
          '<div class="modal-title" style="font-size:15px;font-weight:700;color:var(--text-primary);">🚫 Deboarded Agent Archive (SQL Database)</div>' +
          '<button class="modal-close" onclick="document.getElementById(\'deboarded-modal-backdrop\').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px;">✕</button>' +
        '</div>' +
        '<div class="modal-body" style="padding:20px;overflow-y:auto;flex-grow:1;">' +
          '<div style="display:flex;gap:16px;margin-bottom:20px;">' +
            '<div class="card" style="flex:1;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);">' +
              '<div class="card-body" style="padding:12px 16px;">' +
                '<div style="font-size:24px;font-weight:700;color:var(--color-danger);">' + dbStats.deboarded_count + '</div>' +
                '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Total Deboarded Agents</div>' +
              '</div>' +
            '</div>' +
            '<div class="card" style="flex:1;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);">' +
              '<div class="card-body" style="padding:12px 16px;">' +
                '<div style="font-size:24px;font-weight:700;color:var(--color-info);">' + d.formatNumber(dbStats.cumulative_tasks) + '</div>' +
                '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Cumulative Task Volume (All-Time)</div>' +
              '</div>' +
            '</div>' +
            '<div class="card" style="flex:1;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.15);">' +
              '<div class="card-body" style="padding:12px 16px;">' +
                '<div style="font-size:24px;font-weight:700;color:var(--color-warning);">' + d.formatCurrency(dbStats.cumulative_spend) + '</div>' +
                '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Cumulative Spend (All-Time)</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--text-primary);">Archived Deboard Records</div>' +
          '<div class="table-container" style="margin:0;">' +
            '<div class="table-scroll" style="max-height:300px;">' +
              '<table class="data-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Agent ID</th>' +
                    '<th>Name</th>' +
                    '<th>Platform</th>' +
                    '<th>Department</th>' +
                    '<th>Deboarded Date</th>' +
                    '<th>Reason</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' + rows + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer" style="padding:12px 20px;border-top:1px solid var(--border-primary);display:flex;justify-content:flex-end;background:var(--bg-header);">' +
          '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'deboarded-modal-backdrop\').remove()">Close Archive</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};


/* ───────────────────────────────────────────────────────────────
   PAGE 1 — CIO Dashboard
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.cio = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var totalAgents = d.getTotalAgentCount();
    var viewMode = AETHER.pages.executiveViewMode || 'cumulative';
    var isCum = viewMode === 'cumulative';

    var showAgents = isCum ? d.dbStats.cumulative_onboarded : kpis.totalAgents;
    var agentsBadge = isCum ? 'Active: ' + kpis.totalAgents : 'Total Onboarded: ' + d.dbStats.cumulative_onboarded;

    var showSpend = isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend;
    var spendBadge = isCum ? 'Active: ' + d.formatCurrency(kpis.monthlySpend) : 'All-Time: ' + d.formatCurrency(d.dbStats.cumulative_spend);

    var showROI = isCum ? d.dbStats.cumulative_roi : kpis.workforceROI;
    var roiBadge = isCum ? 'Active: ' + kpis.workforceROI + '%' : 'All-Time: ' + d.dbStats.cumulative_roi + '%';

    var html = '<div class="page-content">';

    /* ── Header ──────────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left" style="display:flex;align-items:center;gap:16px;">' +
        '<div>' +
          '<h1 class="page-title">CIO Dashboard</h1>' +
          '<p class="page-subtitle">Single pane of glass — enterprise AI workforce overview</p>' +
        '</div>' +
        AETHER.pages.renderViewModeToggle(viewMode) +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-secondary btn-sm" id="cio-export-report">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3M5 6l3-3 3 3M8 3v8"/></svg>' +
          ' Export Report' +
        '</button>' +
        '<button class="btn btn-primary btn-sm" id="cio-schedule-briefing">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v10M3 8h10"/></svg>' +
          ' Schedule Briefing' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── Empty State ─────────────────────────────────────── */
    if (d.dbStats.cumulative_onboarded === 0) {
      html += '<div class="card animate-fade-in-up stagger-1">' +
        '<div class="card-body" style="text-align: center; padding: 60px 20px;">' +
          '<div style="font-size: 48px; margin-bottom: 16px;">📊</div>' +
          '<h3 style="color: #e8ecf4; margin: 0 0 8px 0;">No Agents Onboarded</h3>' +
          '<p style="color: #7a85a0; margin: 0;">No agents onboarded. Add agents to see CIO metrics and analytics.</p>' +
        '</div>' +
      '</div>';
      html += '</div>';
      return html;
    }

    /* ── KPI Grid ────────────────────────────────────────── */
    html += '<div class="kpi-grid">' +

      '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M7 10l2 2 4-4"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + agentsBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.formatNumber(showAgents) + '</div>' +
        '<div class="kpi-label">Total AI Agents' + (isCum ? ' (All-Time)' : '') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-agents" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon cyan">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.discoveryCoverage + '%</div>' +
        '<div class="kpi-label">Inventory Coverage</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-coverage" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon green">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6L5.1 18l.9-5.3-4-3.9 5.5-.8z"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.complianceScore + '%</div>' +
        '<div class="kpi-label">Compliance Score</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-compliance" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/avgReliability\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon purple">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17V7l7-4 7 4v10"/><path d="M7 17v-5h6v5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.avgReliability + '%</div>' +
        '<div class="kpi-label">Avg Reliability</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-reliability" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-5" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon yellow">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14l4-8 4 5 4-7"/><path d="M2 17h16"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view cumulative spend details">' + spendBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.formatCurrency(showSpend) + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative Spend' : 'Monthly AI Spend') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-spend" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-6" onclick="window.location.hash=\'#rationale/workforceROI\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon indigo">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v14M6 7l4-4 4 4M6 13l4 4 4-4"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view cumulative ROI details">' + roiBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + showROI + '%</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative ROI' : 'Business Impact ROI') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cio-spark-roi" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-7" onclick="AETHER.pages.executiveShowDeboardedModal()" style="cursor: pointer;" title="Click to view deboarded agents archive (SQL Database)">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="5" y1="5" x2="15" y2="15"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">SQL Database</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.dbStats.deboarded_count + '</div>' +
        '<div class="kpi-label">Deboarded Agents</div>' +
      '</div>' +

    '</div>';

    /* ── Charts Row 1 ────────────────────────────────────── */
    html += '<div class="charts-grid animate-fade-in-up stagger-3">' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Agent Growth (12 Months)</div>' +
            '<div class="chart-card-subtitle">Enterprise AI workforce expansion</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cio-agent-growth" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Platform Distribution</div>' +
            '<div class="chart-card-subtitle">Agents by platform</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cio-platform-dist" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Charts Row 2 ────────────────────────────────────── */
    html += '<div class="charts-grid animate-fade-in-up stagger-4">' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Compliance Trend</div>' +
            '<div class="chart-card-subtitle">Overall compliance score over 12 months</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cio-compliance-trend" style="height:250px"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Cost Per Agent Trend</div>' +
            '<div class="chart-card-subtitle">Monthly cost efficiency</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cio-cost-per-agent" style="height:250px"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Key Highlights ──────────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-5">Key Highlights</div>';

    html += '<div class="alert-banner success animate-fade-in-up stagger-6">' +
      '✅ ' + totalAgents + ' agent' + (totalAgents !== 1 ? 's' : '') + ' discovered and registered — ' + kpis.discoveryCoverage + '% coverage' +
    '</div>';
    html += '<div class="alert-banner info animate-fade-in-up stagger-7">' +
      '📊 Average cost per agent: ' + d.formatCurrency(kpis.costPerAgent) +
    '</div>';

    if (kpis.highRiskAgents > 0) {
      html += '<div class="alert-banner warning animate-fade-in-up stagger-8">' +
        '⚠️ ' + kpis.highRiskAgents + ' high-risk agent' + (kpis.highRiskAgents !== 1 ? 's' : '') + ' require attention' +
      '</div>';
    }

    html += '</div>';
    return html;
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;

    if (d.dbStats.cumulative_onboarded === 0) return;

    var kpis = d.computeKPIs();
    var platDist = d.computePlatformDistribution();

    // Sparklines — use single-value arrays from current KPIs
    AETHER.charts.createSparkline('cio-spark-agents', d.trends.agentGrowth.data, '#3b82f6');
    AETHER.charts.createSparkline('cio-spark-coverage', d.trends.compliance.data, '#06b6d4');
    AETHER.charts.createSparkline('cio-spark-compliance', d.trends.compliance.data, '#10b981');
    AETHER.charts.createSparkline('cio-spark-reliability', d.trends.reliability.data, '#8b5cf6');
    AETHER.charts.createSparkline('cio-spark-spend', d.trends.aiSpend.data, '#f59e0b');
    AETHER.charts.createSparkline('cio-spark-roi', d.trends.agentGrowth.data, '#6366f1');

    // Agent Growth — Area
    AETHER.charts.createAreaChart('cio-agent-growth',
      d.trends.agentGrowth.labels,
      [{ label: 'Total Agents', data: d.trends.agentGrowth.data, color: '#3b82f6', fill: true }]
    );

    // Platform Distribution — Doughnut
    AETHER.charts.createDoughnutChart('cio-platform-dist',
      platDist.labels,
      platDist.data,
      platDist.colors,
      { legend: true, legendPosition: 'right' }
    );

    // Compliance Trend — Line
    AETHER.charts.createLineChart('cio-compliance-trend',
      d.trends.compliance.labels,
      [{ label: 'Compliance %', data: d.trends.compliance.data, color: '#10b981', points: true }],
      { yFormat: function (v) { return v + '%'; } }
    );

    // Cost Per Agent — Line
    AETHER.charts.createLineChart('cio-cost-per-agent',
      d.trends.costPerAgent.labels,
      [{ label: 'Cost/Agent', data: d.trends.costPerAgent.data, color: '#f59e0b', points: true }],
      { yFormat: function (v) { return '$' + v.toLocaleString(); } }
    );

    /* View mode toggles */
    var toggleActive = document.getElementById('btn-toggle-active');
    var toggleCumulative = document.getElementById('btn-toggle-cumulative');
    if (toggleActive && toggleCumulative) {
      toggleActive.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'active';
        AETHER.app.navigate();
      });
      toggleCumulative.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'cumulative';
        AETHER.app.navigate();
      });
    }

    /* Button handlers */
    var exportBtn = document.getElementById('cio-export-report');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        alert('Export feature coming soon. Data available via API.');
      });
    }
    var briefingBtn = document.getElementById('cio-schedule-briefing');
    if (briefingBtn) {
      briefingBtn.addEventListener('click', function () {
        alert('Schedule Briefing feature coming soon. Contact your admin for manual scheduling.');
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 2 — CISO Dashboard
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.ciso = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var totalAgents = d.getTotalAgentCount();
    var viewMode = AETHER.pages.executiveViewMode || 'cumulative';
    var isCum = viewMode === 'cumulative';

    var html = '<div class="page-content">';

    /* ── Header ──────────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left" style="display:flex;align-items:center;gap:16px;">' +
        '<div>' +
          '<h1 class="page-title">CISO Dashboard</h1>' +
          '<p class="page-subtitle">Security posture, risk management, and compliance overview</p>' +
        '</div>' +
        AETHER.pages.renderViewModeToggle(viewMode) +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-secondary btn-sm" id="ciso-export-report">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3M5 6l3-3 3 3M8 3v8"/></svg>' +
          ' Export Report' +
        '</button>' +
        '<button class="btn btn-danger btn-sm" id="ciso-incident-response">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3v5M8 11v1"/><circle cx="8" cy="8" r="6"/></svg>' +
          ' Incident Response' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── Empty State ─────────────────────────────────────── */
    if (d.dbStats.cumulative_onboarded === 0) {
      html += '<div class="card animate-fade-in-up stagger-1">' +
        '<div class="card-body" style="text-align: center; padding: 60px 20px;">' +
          '<div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>' +
          '<h3 style="color: #e8ecf4; margin: 0 0 8px 0;">No Security Data</h3>' +
          '<p style="color: #7a85a0; margin: 0;">No agents onboarded. Security monitoring will begin when agents are added.</p>' +
        '</div>' +
      '</div>';
      html += '</div>';
      return html;
    }

    /* ── Compute violations and compliance ───────────────── */
    var computed = d.computeViolations();
    var violations = computed.violations;
    var comp = d.computeCompliance();
    var frameworks = comp.frameworks;

    /* ── KPI Grid ────────────────────────────────────────── */
    var riskBadge = isCum ? 'Active: ' + kpis.totalAgents : 'Total Onboarded: ' + d.dbStats.cumulative_onboarded;
    var piiBadge = isCum ? 'Active: ' + kpis.totalAgents : 'SQL Deboarded: ' + d.dbStats.deboarded_count;

    html += '<div class="kpi-grid">' +

      '<div class="kpi-card kpi-card-accent animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/highRiskAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3l7 12H3z"/><path d="M10 9v3M10 14.5v.5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + riskBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.highRiskAgents + '</div>' +
        '<div class="kpi-label">High Risk Agents</div>' +
        '<div class="kpi-sparkline"><canvas id="ciso-spark-risk" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/policyViolations\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon yellow">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 7h6M7 10h4M7 13h5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + violations.length + '</div>' +
        '<div class="kpi-label">Policy Violations</div>' +
        '<div class="kpi-sparkline"><canvas id="ciso-spark-violations" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/piiExposure\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="7" r="4"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + piiBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.piiExposure + '</div>' +
        '<div class="kpi-label">PII Exposure</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/complianceFindings\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon yellow">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h12M4 10h12M4 15h8"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + comp.findings.length + '</div>' +
        '<div class="kpi-label">Compliance Findings</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-5" onclick="window.location.hash=\'#rationale/criticalIncidents\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v14M5 8l5-5 5 5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.criticalIncidents + '</div>' +
        '<div class="kpi-label">Critical Incidents (30d)</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-6" onclick="AETHER.pages.executiveShowDeboardedModal()" style="cursor: pointer;" title="Click to view deboarded agents archive (SQL Database)">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="5" y1="5" x2="15" y2="15"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">SQL Database</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.dbStats.deboarded_count + '</div>' +
        '<div class="kpi-label">Deboarded Agents</div>' +
      '</div>' +

    '</div>';

    /* ── Charts ──────────────────────────────────────────── */
    html += '<div class="charts-grid animate-fade-in-up stagger-3">' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Risk Distribution</div>' +
            '<div class="chart-card-subtitle">Agents by risk level</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="ciso-risk-dist" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Risk Score Trend</div>' +
            '<div class="chart-card-subtitle">High-risk agent count over 12 months</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="ciso-risk-trend" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Active Violations ───────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-4">Active Violations</div>';

    html += '<div class="table-container animate-fade-in-up stagger-5">' +
      '<div class="table-header">' +
        '<div class="table-title">Policy Violations</div>' +
        '<div class="table-count">' + violations.length + ' active</div>' +
      '</div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>ID</th>' +
              '<th>Policy</th>' +
              '<th>Agent</th>' +
              '<th>Severity</th>' +
              '<th>Status</th>' +
              '<th>Timestamp</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    if (violations.length === 0) {
      html += '<tr><td colspan="6" style="text-align: center; color: #7a85a0; padding: 20px;">No policy violations detected.</td></tr>';
    } else {
      for (var v = 0; v < violations.length; v++) {
        var viol = violations[v];
        var sevClass = viol.severity === 'Critical' ? 'badge-danger' :
                       viol.severity === 'High' ? 'badge-warning' :
                       viol.severity === 'Medium' ? 'badge-info' : 'badge-neutral';
        var statusClass = viol.status === 'Open' ? 'badge-danger' :
                          viol.status === 'Investigating' ? 'badge-warning' : 'badge-success';
        html += '<tr>' +
          '<td class="font-mono tabular-nums" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + viol.id + '</td>' +
          '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + viol.policy + '</td>' +
          '<td class="table-agent-name" style="cursor:pointer" onclick="window.location.hash=\'#profile/' + viol.agentId + '\'">' + viol.agent + '</td>' +
          '<td><span class="badge ' + sevClass + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + viol.severity + '</span></td>' +
          '<td><span class="badge ' + statusClass + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + viol.status + '</span></td>' +
          '<td class="text-secondary" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + viol.timestamp + '</td>' +
        '</tr>';
      }
    }

    html += '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    /* ── Compliance Overview ─────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-5">Compliance Overview</div>';
    html += '<div class="grid-3">';

    for (var i = 0; i < frameworks.length; i++) {
      var fw = frameworks[i];
      var scoreColor = fw.score >= 97 ? '#10b981' : fw.score >= 95 ? '#f59e0b' : '#ef4444';
      html += '<div class="card animate-fade-in-up stagger-' + Math.min(i + 3, 8) + '" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view compliance score rationale">' +
        '<div class="card-body">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span style="font-size:20px">' + fw.icon + '</span>' +
              '<span style="font-weight:600;color:#e8ecf4">' + fw.name + '</span>' +
            '</div>' +
            '<span style="font-size:24px;font-weight:700;color:' + scoreColor + '" class="tabular-nums">' + fw.score + '%</span>' +
          '</div>' +
          '<div class="metric-row" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceScore\'" title="Click to view compliance score rationale"><span class="metric-row-label">Controls Passed</span><span class="metric-row-value tabular-nums">' + fw.passedControls + ' / ' + fw.controls + '</span></div>' +
          '<div class="metric-row" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale"><span class="metric-row-label">Open Findings</span><span class="metric-row-value tabular-nums">' + fw.findings + '</span></div>' +
        '</div>' +
      '</div>';
    }

    html += '</div>';

    /* ── Security Alerts ─────────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-6">Security Alerts</div>';

    html += '<div class="card animate-fade-in-up stagger-7">' +
      '<div class="card-body">' +
        '<div class="timeline">';

    var actions = computed.actions.slice(0, 4);
    if (actions.length === 0) {
      html += '<p style="color: #7a85a0; text-align: center; padding: 20px 0; margin: 0;">No security alerts.</p>';
    } else {
      for (var a = 0; a < actions.length; a++) {
        var act = actions[a];
        var dotColor = act.type === 'danger' ? 'red' : act.type === 'warning' ? 'yellow' : act.type === 'success' ? 'green' : 'blue';
        var alertHash = act.type === 'danger' ? '#rationale/criticalIncidents' : '#rationale/policyViolations';
        html += '<div class="timeline-item" style="cursor: pointer;" onclick="window.location.hash=\'' + alertHash + '\'" title="Click to view alert details and rationale">' +
            '<div class="timeline-dot ' + dotColor + '"></div>' +
            '<div class="timeline-content">' +
              '<div class="timeline-title">' + act.action + ' — ' + act.agent + '</div>' +
              '<div class="timeline-time">' + act.time + '</div>' +
            '</div>' +
          '</div>';
      }
    }

    html += '</div>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;

    if (d.dbStats.cumulative_onboarded === 0) return;

    var riskDist = d.computeRiskDistribution();

    // Sparklines
    AETHER.charts.createSparkline('ciso-spark-risk', d.trends.riskTrend.data, '#ef4444');
    AETHER.charts.createSparkline('ciso-spark-violations', d.trends.compliance.data, '#f59e0b');

    // Risk Distribution - Doughnut
    AETHER.charts.createDoughnutChart('ciso-risk-dist',
      riskDist.labels,
      riskDist.data,
      riskDist.colors,
      { legend: true, legendPosition: 'right' }
    );

    // Risk Trend - Line
    AETHER.charts.createLineChart('ciso-risk-trend',
      d.trends.riskTrend.labels,
      [{ label: 'High-Risk Agents', data: d.trends.riskTrend.data, color: '#ef4444', points: true }]
    );

    /* View mode toggles */
    var toggleActive = document.getElementById('btn-toggle-active');
    var toggleCumulative = document.getElementById('btn-toggle-cumulative');
    if (toggleActive && toggleCumulative) {
      toggleActive.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'active';
        AETHER.app.navigate();
      });
      toggleCumulative.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'cumulative';
        AETHER.app.navigate();
      });
    }

    /* Button handlers */
    var exportBtn = document.getElementById('ciso-export-report');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        alert('Export Report feature coming soon. Data available via API.');
      });
    }
    var incidentBtn = document.getElementById('ciso-incident-response');
    if (incidentBtn) {
      incidentBtn.addEventListener('click', function () {
        alert('Incident Response playbooks are automated. Check the Operations page for active alerts.');
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 3 — CFO Dashboard
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.cfo = {
  render: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var totalAgents = d.getTotalAgentCount();
    var viewMode = AETHER.pages.executiveViewMode || 'cumulative';
    var isCum = viewMode === 'cumulative';

    var showSpend = isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend;
    var spendBadge = isCum ? 'Active: ' + d.formatCurrency(kpis.monthlySpend) + '/mo' : 'All-Time: ' + d.formatCurrency(d.dbStats.cumulative_spend);

    var showCPA = isCum ? (d.dbStats.cumulative_spend / Math.max(d.dbStats.cumulative_onboarded, 1)) : kpis.costPerAgent;
    var cpaBadge = isCum ? 'Active CPA: $' + Number(kpis.costPerAgent).toLocaleString() : 'Active Agents: ' + kpis.totalAgents;

    var showCPT = isCum ? (d.dbStats.cumulative_spend / Math.max(d.dbStats.cumulative_tasks, 1)) : kpis.costPerTask;
    var cptBadge = isCum ? 'Active CPT: $' + Number(kpis.costPerTask).toFixed(2) : 'Active Tasks: ' + d.formatNumber(kpis.tasksExecuted || 0);

    var showROI = isCum ? d.dbStats.cumulative_roi : kpis.workforceROI;
    var roiBadge = isCum ? 'Active ROI: ' + kpis.workforceROI + '%' : 'All-Time: ' + d.dbStats.cumulative_roi + '%';

    var showBudgetEff = isCum ? (d.dbStats.cumulative_spend > 0 ? Math.min(100, Math.round((d.dbStats.cumulative_tasks * 0.1) / d.dbStats.cumulative_spend * 100)) : 0) : kpis.budgetEfficiency;

    var html = '<div class="page-content">';

    /* ── Header ──────────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left" style="display:flex;align-items:center;gap:16px;">' +
        '<div>' +
          '<h1 class="page-title">CFO Dashboard</h1>' +
          '<p class="page-subtitle">AI workforce financial overview, budget tracking, and ROI analysis</p>' +
        '</div>' +
        AETHER.pages.renderViewModeToggle(viewMode) +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-secondary btn-sm" id="cfo-export-financials">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3M5 6l3-3 3 3M8 3v8"/></svg>' +
          ' Export Financials' +
        '</button>' +
        '<button class="btn btn-primary btn-sm" id="cfo-budget-planner">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M8 5v6"/></svg>' +
          ' Budget Planner' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── Empty State ─────────────────────────────────────── */
    if (d.dbStats.cumulative_onboarded === 0) {
      html += '<div class="card animate-fade-in-up stagger-1">' +
        '<div class="card-body" style="text-align: center; padding: 60px 20px;">' +
          '<div style="font-size: 48px; margin-bottom: 16px;">💰</div>' +
          '<h3 style="color: #e8ecf4; margin: 0 0 8px 0;">No Financial Data</h3>' +
          '<p style="color: #7a85a0; margin: 0;">No agents onboarded. Financial tracking will begin when agents are added.</p>' +
        '</div>' +
      '</div>';
      html += '</div>';
      return html;
    }

    var costData = d.computeCostBreakdown();

    /* ── KPI Grid ────────────────────────────────────────── */
    html += '<div class="kpi-grid">' +

      '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v14M6 7h8M6 11h6M7 15h6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view cumulative spend details">' + spendBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.formatCurrency(showSpend) + (isCum ? '' : '/mo') + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative AI Spend' : 'Total AI Spend') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cfo-spark-spend" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/costPerAgent\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon cyan">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6v8M7 10h6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + cpaBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">$' + Number(showCPA).toLocaleString(undefined, {maximumFractionDigits:0}) + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Avg Cost Per Agent (All-Time)' : 'Cost Per Agent') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cfo-spark-cpa" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/costPerTask\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon green">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14l4-8 4 5 4-7"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + cptBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">$' + Number(showCPT).toFixed(isCum ? 4 : 2) + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Avg Cost Per Task (All-Time)' : 'Cost Per Task') + '</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/workforceROI\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon purple">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v14M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view cumulative ROI details">' + roiBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + showROI + '%</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative ROI' : 'AI Workforce ROI') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cfo-spark-roi" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-5" onclick="window.location.hash=\'#rationale/budgetEfficiency\'" style="cursor: pointer;" title="Click to view rationale">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon yellow">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M7 10l2 2 4-4"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + showBudgetEff + '%</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative Budget Efficiency' : 'Budget Efficiency') + '</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-6" onclick="AETHER.pages.executiveShowDeboardedModal()" style="cursor: pointer;" title="Click to view deboarded agents archive (SQL Database)">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><line x1="5" y1="5" x2="15" y2="15"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">SQL Database</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.dbStats.deboarded_count + '</div>' +
        '<div class="kpi-label">Deboarded Agents</div>' +
      '</div>' +

    '</div>';

    /* ── Charts Row 1 ────────────────────────────────────── */
    html += '<div class="charts-grid animate-fade-in-up stagger-3">' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">AI Spend vs Budget</div>' +
            '<div class="chart-card-subtitle">Monthly actual spend vs allocated budget ($M)</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cfo-spend-chart" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Cost Per Agent Trend</div>' +
            '<div class="chart-card-subtitle">Monthly cost per agent efficiency</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cfo-cpa-trend" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Cost Breakdown ──────────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-4">Cost Breakdown by Platform</div>';

    html += '<div class="chart-card animate-fade-in-up stagger-5">' +
      '<div class="chart-card-body">' +
        '<canvas id="cfo-platform-cost" style="height:250px"></canvas>' +
      '</div>' +
    '</div>';

    /* ── Budget Summary ──────────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-5">Budget Summary</div>';

    var annualSpend = (isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend) * 12;
    var ytdSpend = (isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend) * 6;
    var summaryAgentsCount = isCum ? d.dbStats.cumulative_onboarded : totalAgents;
    html += '<div class="card animate-fade-in-up stagger-6">' +
      '<div class="card-body">' +
        '<div class="metric-row" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor:pointer;" title="Click to view rationale">' +
          '<span class="metric-row-label">' + (isCum ? 'Cumulative AI Spend' : 'Monthly AI Spend') + '</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor:pointer;" title="Click to view rationale">' +
          '<span class="metric-row-label">Projected Annual</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(annualSpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor:pointer;" title="Click to view rationale">' +
          '<span class="metric-row-label">YTD Spend (est.)</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(ytdSpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#rationale/costPerAgent\'" style="cursor:pointer;" title="Click to view rationale">' +
          '<span class="metric-row-label">' + (isCum ? 'Avg Cost Per Agent (All-Time)' : 'Cost Per Agent') + '</span>' +
          '<span class="metric-row-value tabular-nums">$' + Number(showCPA).toLocaleString(undefined, {maximumFractionDigits: 0}) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor:pointer;" title="Click to view rationale">' +
          '<span class="metric-row-label">' + (isCum ? 'Total Agents (All-Time)' : 'Total Agents') + '</span>' +
          '<span class="metric-row-value tabular-nums">' + summaryAgentsCount + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Top Cost Optimization ───────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-6">Top Cost Optimization Opportunities</div>';

    var recos = costData.recommendations;
    if (recos.length === 0) {
      html += '<div class="card animate-fade-in-up stagger-7">' +
        '<div class="card-body" style="text-align: center; padding: 20px; color: #7a85a0;">No optimization recommendations at this time.</div>' +
      '</div>';
    } else {
      for (var ri = 0; ri < recos.length && ri < 3; ri++) {
        var rec = recos[ri];
        var recIcon = rec.priority === 'High' ? '🔴' : '🟡';
        html += '<div class="recommendation-card animate-fade-in-up stagger-' + Math.min(ri + 5, 8) + '">' +
          '<div class="recommendation-icon">' + recIcon + '</div>' +
          '<div class="recommendation-content">' +
            '<div class="recommendation-title">' + rec.title + '</div>' +
            '<div class="recommendation-desc">' + rec.description + '</div>' +
          '</div>' +
          '<div class="recommendation-savings">' + rec.savings + '</div>' +
        '</div>';
      }
    }

    html += '</div>';
    return html;
  },

  init: function () {
    AETHER.charts.destroyAll();
    var d = AETHER.data;

    if (d.dbStats.cumulative_onboarded === 0) return;

    var costData = d.computeCostBreakdown();

    // Sparklines
    AETHER.charts.createSparkline('cfo-spark-spend', d.trends.aiSpend.data, '#3b82f6');
    AETHER.charts.createSparkline('cfo-spark-cpa', d.trends.costPerAgent.data, '#06b6d4');
    AETHER.charts.createSparkline('cfo-spark-roi', d.trends.agentGrowth.data, '#8b5cf6');

    // Mixed Chart — AI Spend vs Budget
    AETHER.charts.destroy('cfo-spend-chart');
    var spendCanvas = document.getElementById('cfo-spend-chart');
    if (spendCanvas) {
      new Chart(spendCanvas, {
        type: 'bar',
        data: {
          labels: d.trends.aiSpend.labels,
          datasets: [
            {
              type: 'bar',
              label: 'Actual Spend ($M)',
              data: d.trends.aiSpend.data,
              backgroundColor: '#3b82f6',
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 36,
              order: 2
            },
            {
              type: 'line',
              label: 'Budget ($M)',
              data: d.trends.aiSpend.budget,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              borderDash: [5, 5],
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: '#f59e0b',
              pointBorderColor: '#111631',
              pointBorderWidth: 2,
              tension: 0.4,
              fill: false,
              order: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: 'rgba(30, 37, 69, 0.4)', drawBorder: false },
              ticks: { color: '#4a5470', font: { size: 10 }, maxRotation: 0 },
              border: { display: false }
            },
            y: {
              grid: { color: 'rgba(30, 37, 69, 0.4)', drawBorder: false },
              ticks: {
                color: '#4a5470',
                font: { size: 10 },
                callback: function (v) { return '$' + v.toFixed(1) + 'M'; }
              },
              border: { display: false },
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle', padding: 16, color: '#7a85a0', font: { size: 11 } }
            },
            tooltip: { mode: 'index', intersect: false }
          },
          interaction: { mode: 'index', intersect: false }
        }
      });
    }

    // Cost Per Agent Trend — Line
    AETHER.charts.createLineChart('cfo-cpa-trend',
      d.trends.costPerAgent.labels,
      [{ label: 'Cost/Agent', data: d.trends.costPerAgent.data, color: '#06b6d4', points: true }],
      { yFormat: function (v) { return '$' + v.toLocaleString(); } }
    );

    // Cost Breakdown by Platform — Horizontal Bar
    var cb = costData.byPlatform;
    AETHER.charts.createHorizontalBar('cfo-platform-cost',
      cb.labels,
      cb.data,
      cb.colors,
      { yFormat: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } }
    );

    /* View mode toggles */
    var toggleActive = document.getElementById('btn-toggle-active');
    var toggleCumulative = document.getElementById('btn-toggle-cumulative');
    if (toggleActive && toggleCumulative) {
      toggleActive.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'active';
        AETHER.app.navigate();
      });
      toggleCumulative.addEventListener('click', function(e) {
        e.stopPropagation();
        AETHER.pages.executiveViewMode = 'cumulative';
        AETHER.app.navigate();
      });
    }

    /* Button handlers */
    var exportBtn = document.getElementById('cfo-export-financials');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        alert('Export Financials feature coming soon. Data available via API.');
      });
    }
    var budgetBtn = document.getElementById('cfo-budget-planner');
    if (budgetBtn) {
      budgetBtn.addEventListener('click', function () {
        alert('Budget Planner feature coming soon. Use the Cost Optimization page for current recommendations.');
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 4 — Settings
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.settings = {
  render: function () {
    var html = '<div class="page-content">';

    /* ── Header ──────────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left">' +
        '<h1 class="page-title">Settings</h1>' +
        '<p class="page-subtitle">Platform configuration and preferences</p>' +
      '</div>' +
    '</div>';

    /* ── General Settings ────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-1">' +
      '<div class="card-header">' +
        '<div class="card-title">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-3px;margin-right:6px;opacity:.6"><circle cx="9" cy="9" r="3"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M3.3 14.7l1.4-1.4M13.3 4.7l1.4-1.4"/></svg>' +
          'General Settings' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Organization</span>' +
          '<span class="metric-row-value">Acme Corporation</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Environment</span>' +
          '<span class="metric-row-value">Production</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Data Region</span>' +
          '<span class="metric-row-value font-mono">US-East-1</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">API Version</span>' +
          '<span class="metric-row-value font-mono">v2.4.1</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Last Updated</span>' +
          '<span class="metric-row-value">' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Integrations ────────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-2">' +
      '<div class="card-header">' +
        '<div class="card-title">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-3px;margin-right:6px;opacity:.6"><path d="M6 3h6v4H6zM6 11h6v4H6zM9 7v4"/></svg>' +
          'Integrations' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">🔷 Microsoft Copilot</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">☁️ Salesforce Agentforce</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">🔶 Databricks</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">❄️ Snowflake Cortex</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">🟢 OpenAI</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">⚙️ Custom Agents</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Connected</span></span>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Notification Preferences ────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-3">' +
      '<div class="card-header">' +
        '<div class="card-title">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-3px;margin-right:6px;opacity:.6"><path d="M13.73 13a2 2 0 0 1-1.46.63H5.73A2 2 0 0 1 4.27 13 7.001 7.001 0 0 1 3 9c0-3.3 2.7-6 6-6s6 2.7 6 6c0 1.6-.5 3-1.27 4z"/><path d="M7 14v1a2 2 0 1 0 4 0v-1"/></svg>' +
          'Notification Preferences' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Policy Violations</span>' +
          '<span class="metric-row-value"><span class="badge badge-info">Email + Slack</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Risk Alerts</span>' +
          '<span class="metric-row-value"><span class="badge badge-warning">Email + Slack + PagerDuty</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Compliance Updates</span>' +
          '<span class="metric-row-value"><span class="badge badge-info">Email</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Cost Alerts</span>' +
          '<span class="metric-row-value"><span class="badge badge-info">Email + Slack</span></span>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Security ────────────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-4">' +
      '<div class="card-header">' +
        '<div class="card-title">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-3px;margin-right:6px;opacity:.6"><path d="M9 2l6 3v4c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V5z"/></svg>' +
          'Security' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">SSO Provider</span>' +
          '<span class="metric-row-value">Okta</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">MFA</span>' +
          '<span class="metric-row-value"><span class="badge badge-success">Enabled</span></span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Session Timeout</span>' +
          '<span class="metric-row-value tabular-nums">30 minutes</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">API Key Rotation</span>' +
          '<span class="metric-row-value tabular-nums">Every 90 days</span>' +
        '</div>' +
        '<div class="metric-row">' +
          '<span class="metric-row-label">Audit Log Retention</span>' +
          '<span class="metric-row-value tabular-nums">365 days</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  init: function () {
    AETHER.charts.destroyAll();
    // Settings page has no charts — nothing to initialize
  }
};
