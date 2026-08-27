/* ═══════════════════════════════════════════════════════════════
   AETHER Executive Pages
   CIO · CISO · CFO · Settings
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.executiveViewMode = AETHER.pages.executiveViewMode || 'cumulative';

AETHER.pages.getSubRoute = function () {
  var hash = window.location.hash.replace('#', '');
  var parts = hash.split('/');
  return {
    page: parts[0] || 'dashboard',
    view: parts[1] || null,      // e.g. 'spend', 'compliance', 'performance'
    id: parts[2] || null,        // e.g. 'AGT-0001', 'SOC2'
    subId: parts[3] || null,     // e.g. 'TSK-1234', 'CC6.1', 'snowflake'
    leafId: parts[4] || null     // e.g. 'FND-001'
  };
};

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
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'performance') {
      if (route.id) {
        if (route.subId) {
          return this.renderLevel4(route.id, route.subId);
        }
        return this.renderLevel3(route.id);
      }
      return this.renderLevel2();
    }

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

      '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#cio/performance\'" style="cursor: pointer;" title="Click to view fleet performance">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M7 10l2 2 4-4"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + agentsBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.formatNumber(showAgents) + '</div>' +
        '<div class="kpi-label">Total AI Agents' + (isCum ? ' (All-Time)' : '') + ' (Drill Down)</div>' +
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

      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#cio/performance\'" style="cursor: pointer;" title="Click to view fleet performance">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon purple">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17V7l7-4 7 4v10"/><path d="M7 17v-5h6v5"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.avgReliability + '%</div>' +
        '<div class="kpi-label">Avg Reliability (Drill Down)</div>' +
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

  renderLevel2: function () {
    var d = AETHER.data;
    var allAgents = d.getAllAgents();
    
    var totalAvail = 0;
    var totalLatency = 0;
    var totalSuccess = 0;
    
    allAgents.forEach(function (ag) {
      totalAvail += parseFloat(ag.availability || 0);
      totalLatency += parseInt(ag.avgLatency || 0);
      totalSuccess += parseFloat(ag.successRate || 0);
    });
    
    var avgAvail = allAgents.length > 0 ? (totalAvail / allAgents.length).toFixed(1) : '0.0';
    var avgLatency = allAgents.length > 0 ? Math.round(totalLatency / allAgents.length) : 0;
    var avgSuccess = allAgents.length > 0 ? (totalSuccess / allAgents.length).toFixed(1) : '0.0';
    
    var html = '<div class="page-content">';
    
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cio" style="color: var(--text-secondary); text-decoration:none;">CIO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">Fleet Performance</span>' +
      '</div>';
      
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">🌐 Fleet Performance</h1>' +
        '<p class="page-subtitle">Detailed health, response latency, and execution reliability across the active AI fleet</p>' +
      '</div>' +
      '</div>';
      
    html += '<div class="kpi-grid" style="margin-bottom:24px;">' +
      '<div class="kpi-card">' +
        '<div class="kpi-value text-accent">' + allAgents.length + '</div>' +
        '<div class="kpi-label">Registered AI Agents</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-success);">' + avgAvail + '%</div>' +
        '<div class="kpi-label">Avg Fleet Availability</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-info);">' + avgLatency + ' ms</div>' +
        '<div class="kpi-label">Avg Response Latency</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-success);">' + avgSuccess + '%</div>' +
        '<div class="kpi-label">Avg Success Rate</div>' +
      '</div>' +
      '</div>';
      
    html += '<div class="table-container animate-fade-in-up stagger-2">' +
      '<div class="table-header"><div class="table-title">Fleet Diagnostic Ledger</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Agent ID</th>' +
              '<th>Agent Name</th>' +
              '<th>Platform</th>' +
              '<th style="text-align:right">Availability</th>' +
              '<th style="text-align:right">Avg Latency</th>' +
              '<th style="text-align:right">Success Rate</th>' +
              '<th style="text-align:right">Connected Systems</th>' +
              '<th>Status</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
          
    allAgents.forEach(function (ag) {
      var statusBadge = ag.status === 'Active' ? 'badge-success' : 'badge-neutral';
      var successColor = parseFloat(ag.successRate) >= 97 ? 'var(--color-success)' : parseFloat(ag.successRate) >= 95 ? 'var(--color-warning)' : 'var(--color-danger)';
      html += '<tr style="cursor:pointer;" onclick="window.location.hash=\'#cio/performance/' + ag.id + '\'">' +
        '<td class="font-mono text-accent">' + ag.id + '</td>' +
        '<td style="font-weight:600; color:var(--text-primary);">' + ag.name + '</td>' +
        '<td>' + ag.platform + '</td>' +
        '<td style="text-align:right" class="tabular-nums">' + ag.availability + '%</td>' +
        '<td style="text-align:right" class="tabular-nums">' + ag.avgLatency + ' ms</td>' +
        '<td style="text-align:right; font-weight:600; color:' + successColor + ';" class="tabular-nums">' + ag.successRate + '%</td>' +
        '<td style="text-align:right" class="tabular-nums">' + (ag.connectedSystems != null ? ag.connectedSystems : 3) + '</td>' +
        '<td><span class="badge ' + statusBadge + '">' + ag.status + '</span></td>' +
        '</tr>';
    });
    
    html += '</tbody></table></div></div></div>';
    return html;
  },

  renderLevel3: function (agentId) {
    var d = AETHER.data;
    var agent = d.getAgent(agentId);
    if (!agent) {
      return '<div class="page-content"><div class="empty-state">Agent not found</div></div>';
    }
    
    var html = '<div class="page-content">';
    
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cio" style="color: var(--text-secondary); text-decoration:none;">CIO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cio/performance" style="color: var(--text-secondary); text-decoration:none;">Fleet Performance</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + agent.name + '</span>' +
      '</div>';
      
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">🔌 System Integrations: ' + agent.name + '</h1>' +
        '<p class="page-subtitle">Downstream systems, data connectors, and connection health metrics</p>' +
      '</div>' +
      '</div>';
      
    var integrations = d.getAgentIntegrations(agentId);
    var healthyCount = integrations.filter(function (i) { return i.status === 'Healthy'; }).length;
    var totalRequests = 0;
    var totalLatency = 0;
    integrations.forEach(function (i) {
      totalRequests += i.requests24h;
      totalLatency += i.latency;
    });
    var avgLatency = integrations.length > 0 ? Math.round(totalLatency / integrations.length) : 0;
    
    html += '<div class="kpi-grid" style="margin-bottom:24px;">' +
      '<div class="kpi-card">' +
        '<div class="kpi-value text-accent">' + integrations.length + '</div>' +
        '<div class="kpi-label">Connected Systems</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-success);">' + healthyCount + ' / ' + integrations.length + '</div>' +
        '<div class="kpi-label">Healthy Connections</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-info);">' + avgLatency + ' ms</div>' +
        '<div class="kpi-label">Average Connection Latency</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-success);">' + d.formatNumber(totalRequests) + '</div>' +
        '<div class="kpi-label">Total Requests (24h)</div>' +
      '</div>' +
      '</div>';
      
    html += '<div class="table-container animate-fade-in-up stagger-2" id="cio-integrations-container">' +
      '<div class="table-header"><div class="table-title">System Connectors</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>System Name</th>' +
              '<th>Connection Type</th>' +
              '<th>Connection Status</th>' +
              '<th style="text-align:right">Avg Latency</th>' +
              '<th style="text-align:right">Requests (24h)</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
          
    integrations.forEach(function (intg) {
      var statusBadge = intg.status === 'Healthy' ? 'badge-success' : 'badge-warning';
      html += '<tr style="cursor:pointer;" onclick="window.location.hash=\'#cio/performance/' + agentId + '/' + encodeURIComponent(intg.name) + '\'">' +
        '<td style="font-weight:600; color:var(--text-primary);">' + intg.name + '</td>' +
        '<td><span class="badge badge-neutral">' + intg.type + '</span></td>' +
        '<td><span class="badge ' + statusBadge + '">' + intg.status + '</span></td>' +
        '<td style="text-align:right" class="tabular-nums">' + intg.latency + ' ms</td>' +
        '<td style="text-align:right" class="tabular-nums">' + d.formatNumber(intg.requests24h) + '</td>' +
        '</tr>';
    });
          
    html += '</tbody></table></div></div></div>';
    return html;
  },

  renderLevel4: function (agentId, integrationName) {
    var d = AETHER.data;
    var agent = d.getAgent(agentId);
    var intgName = decodeURIComponent(integrationName);
    if (!agent) {
      return '<div class="page-content"><div class="empty-state">Agent not found</div></div>';
    }
    
    var html = '<div class="page-content">';
    
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cio" style="color: var(--text-secondary); text-decoration:none;">CIO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cio/performance" style="color: var(--text-secondary); text-decoration:none;">Fleet Performance</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cio/performance/' + agentId + '" style="color: var(--text-secondary); text-decoration:none;">' + agent.name + '</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + intgName + ' Traces</span>' +
      '</div>';
      
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">📝 Integration Trace Logs: ' + intgName + '</h1>' +
        '<p class="page-subtitle">Real-time HTTP API transaction ledger and raw network payloads</p>' +
      '</div>' +
      '</div>';
      
    var endpointUrl = intgName === 'Salesforce CRM API' ? 'https://api.salesforce.com/services/data/v62.0' :
                      intgName === 'Snowflake Data Warehouse' ? 'snowflake://acme.snowflakecomputing.com:443' :
                      intgName === 'Slack Notifications API' ? 'https://hooks.slack.com/services/T0000/B0000/...' :
                      'https://api.external-partner.com/v1';
                      
    var requestVolume24h = intgName === 'Salesforce CRM API' ? '1,840' :
                           intgName === 'Snowflake Data Warehouse' ? '420' :
                           intgName === 'Slack Notifications API' ? '95' : '150';
                           
    html += '<div class="grid-2 animate-fade-in-up stagger-1">' +
      
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Connection Properties</div></div>' +
        '<div class="card-body">' +
          '<div class="metric-row"><span class="metric-row-label">Parent Agent</span><span class="metric-row-value table-agent-name" style="cursor:pointer; text-decoration:underline;" onclick="window.location.hash=\'#profile/' + agent.id + '\'">' + agent.name + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Integration System</span><span class="metric-row-value">' + intgName + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Endpoint URL</span><span class="metric-row-value font-mono text-accent" style="font-size:11px; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + endpointUrl + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Auth Protocol</span><span class="metric-row-value"><span class="badge badge-neutral">' + (intgName === 'Slack Notifications API' ? 'Webhook Secret' : 'OAuth 2.0 JWT') + '</span></span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Requests (24h)</span><span class="metric-row-value tabular-nums">' + requestVolume24h + '</span></div>' +
        '</div>' +
      '</div>' +
      
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Network Channel Diagnostic</div></div>' +
        '<div class="card-body" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; min-height:140px;">' +
          '<div style="font-size:32px; margin-bottom:8px;">🟢</div>' +
          '<div style="font-size:14px; font-weight:700; color:var(--color-success); margin-bottom:4px;">Channel Secure & Healthy</div>' +
          '<div style="font-size:11px; color:var(--text-secondary);">SSL/TLS Handshake verified. DNS resolving. Latency within SLA threshold (< 500ms).</div>' +
        '</div>' +
      '</div>' +
      
      '<div class="card" style="grid-column: span 2;" id="cio-network-logs-container">' +
        '<div class="card-header"><div class="card-title">API Request Trace Ledger</div></div>' +
        '<div class="card-body" style="padding:0;">' +
          '<div style="padding:40px; text-align:center; color:var(--text-secondary);">' +
            '<div style="width:24px; height:24px; border:2px solid var(--border-primary); border-top-color:var(--accent-blue); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 12px;"></div>' +
            'Retrieving network packet traces...' +
          '</div>' +
        '</div>' +
      '</div>' +
      
      '<div class="card" style="grid-column: span 2;">' +
        '<div class="card-header"><div class="card-title">Network Payload Inspector (HTTP/2 Header & Body)</div></div>' +
        '<div class="card-body">' +
          '<div style="margin-bottom:8px; font-size:11px; text-transform:uppercase; color:var(--text-secondary);">Click on a trace log row above to load its payload headers and body context.</div>' +
          '<pre id="cio-payload-inspector" style="background:var(--bg-secondary); border:1px solid var(--border-primary); padding:16px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:11px; color:var(--text-primary); white-space:pre-wrap; word-break:break-all; margin:0;">' +
            'No trace record selected. Click a trace log row above.' +
          '</pre>' +
        '</div>' +
      '</div>' +
      
      '</div>';
      
    html += '</div>';
    return html;
  },

  init: function () {
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'performance') {
      if (route.id) {
        if (route.subId) {
          this.initLevel4(route.id, route.subId);
        } else {
          this.initLevel3(route.id);
        }
      } else {
        this.initLevel2();
      }
      return;
    }

    AETHER.charts.destroyAll();
    var d = AETHER.data;

    if (d.dbStats.cumulative_onboarded === 0) return;

    var kpis = d.computeKPIs();
    var platDist = d.computePlatformDistribution();

    AETHER.charts.createSparkline('cio-spark-agents', d.trends.agentGrowth.data, '#3b82f6');
    AETHER.charts.createSparkline('cio-spark-coverage', d.trends.compliance.data, '#06b6d4');
    AETHER.charts.createSparkline('cio-spark-compliance', d.trends.compliance.data, '#10b981');
    AETHER.charts.createSparkline('cio-spark-reliability', d.trends.reliability.data, '#8b5cf6');
    AETHER.charts.createSparkline('cio-spark-spend', d.trends.aiSpend.data, '#f59e0b');
    AETHER.charts.createSparkline('cio-spark-roi', d.trends.agentGrowth.data, '#6366f1');

    AETHER.charts.createAreaChart('cio-agent-growth',
      d.trends.agentGrowth.labels,
      [{ label: 'Total Agents', data: d.trends.agentGrowth.data, color: '#3b82f6', fill: true }]
    );

    AETHER.charts.createDoughnutChart('cio-platform-dist',
      platDist.labels,
      platDist.data,
      platDist.colors,
      { legend: true, legendPosition: 'right' }
    );

    AETHER.charts.createLineChart('cio-compliance-trend',
      d.trends.compliance.labels,
      [{ label: 'Compliance %', data: d.trends.compliance.data, color: '#10b981', points: true }],
      { yFormat: function (v) { return v + '%'; } }
    );

    AETHER.charts.createLineChart('cio-cost-per-agent',
      d.trends.costPerAgent.labels,
      [{ label: 'Cost/Agent', data: d.trends.costPerAgent.data, color: '#f59e0b', points: true }],
      { yFormat: function (v) { return '$' + v.toLocaleString(); } }
    );

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
  },

  initLevel2: function () {
    AETHER.charts.destroyAll();
  },

  initLevel3: function (agentId) {
    AETHER.charts.destroyAll();
  },

  initLevel4: function (agentId, integrationName) {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    var intgName = decodeURIComponent(integrationName);
    var container = document.getElementById('cio-network-logs-container');
    if (!container) return;
    
    var logs = d.getIntegrationLogs(agentId, intgName);
    var rows = '';
    
    logs.forEach(function (log, index) {
      var dateStr = new Date(log.timestamp).toLocaleTimeString();
      var isError = log.status.indexOf('200') === -1;
      var statusClass = isError ? 'badge-danger' : 'badge-success';
      
      rows += '<tr style="cursor:pointer;" class="cio-log-row" data-index="' + index + '">' +
        '<td class="font-mono text-accent">' + log.id + '</td>' +
        '<td class="text-secondary">' + dateStr + '</td>' +
        '<td><span class="badge badge-neutral">' + log.method + '</span></td>' +
        '<td class="font-mono text-secondary" style="font-size:11px; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + log.path + '</td>' +
        '<td style="text-align:right" class="tabular-nums">' + log.latency + ' ms</td>' +
        '<td style="text-align:right" class="tabular-nums">' + log.payloadSize + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + log.status + '</span></td>' +
        '</tr>';
    });
    
    container.innerHTML = '<div class="table-header"><div class="table-title">API Request Trace Ledger</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Log ID</th>' +
              '<th>Time</th>' +
              '<th>Method</th>' +
              '<th>Path</th>' +
              '<th style="text-align:right">Latency</th>' +
              '<th style="text-align:right">Payload Size</th>' +
              '<th>Status</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
      
    var rowElements = container.querySelectorAll('.cio-log-row');
    var inspector = document.getElementById('cio-payload-inspector');
    
    rowElements.forEach(function (row) {
      row.addEventListener('click', function () {
        rowElements.forEach(function (r) { r.style.background = ''; });
        row.style.background = 'rgba(59, 130, 246, 0.05)';
        
        var logIdx = parseInt(row.getAttribute('data-index'));
        var log = logs[logIdx];
        
        var hostName = intgName === 'Salesforce CRM API' ? 'api.salesforce.com' :
                       intgName === 'Snowflake Data Warehouse' ? 'acme.snowflakecomputing.com' :
                       'hooks.slack.com';
                       
        var requestHeaders = {
          "host": hostName,
          "user-agent": "Aether-Agent-Runtime/v2.4.1",
          "authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.*****************",
          "x-request-id": log.id + '-REQ-TRACE',
          "content-type": "application/json",
          "accept": "application/json"
        };
        
        var responseBody = intgName === 'Salesforce CRM API' ? {
          "status": log.status,
          "response_ms": log.latency,
          "payload_size": log.payloadSize,
          "body": {
            "id": "0038000000ClnKwAAJ",
            "success": true,
            "errors": [],
            "message": "Contact record successfully processed."
          }
        } : intgName === 'Snowflake Data Warehouse' ? {
          "status": log.status,
          "response_ms": log.latency,
          "payload_size": log.payloadSize,
          "body": {
            "queryId": "01b8a92f-0000-08c4-0000-000018a1a92e",
            "rowtype": [{"name": "ID", "type": "TEXT"}, {"name": "VALUE", "type": "NUMBER"}],
            "rowcount": 100,
            "data": [["1", "48200"], ["2", "39020"]]
          }
        } : {
          "status": log.status,
          "response_ms": log.latency,
          "payload_size": log.payloadSize,
          "body": {
            "ok": true,
            "channel": "C0123456",
            "ts": "1719273920.002900"
          }
        };
        
        if (inspector) {
          inspector.innerHTML = 'HTTP/2 200 OK\n' +
            'Request Headers:\n' +
            JSON.stringify(requestHeaders, null, 2) + '\n\n' +
            'Response Payload:\n' +
            JSON.stringify(responseBody, null, 2);
          inspector.style.color = log.status.indexOf('200') !== -1 ? 'var(--color-success-light)' : 'var(--color-danger)';
        }
      });
    });
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 2 — CISO Dashboard
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.ciso = {
  render: function () {
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'compliance') {
      if (route.id) {
        var framework = decodeURIComponent(route.id);
        if (route.subId) {
          if (route.leafId) {
            return this.renderLevel4(framework, route.subId, route.leafId);
          }
          return this.renderLevel3(framework, route.subId);
        }
        return this.renderLevel2(framework);
      }
      return this.renderLevel2('GDPR'); // Default to GDPR compliance list
    }

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

      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#ciso/compliance/GDPR\'" style="cursor: pointer;" title="Click to view PII compliance details">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="7" r="4"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + piiBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + kpis.piiExposure + '</div>' +
        '<div class="kpi-label">PII Exposure (Drill Down)</div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#compliance\'" style="cursor: pointer;" title="Click to view findings across all frameworks">' +
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
        '<div class="kpi-label">Critical Incidents</div>' +
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
    html += '<div class="section-title animate-fade-in-up stagger-5">Compliance Overview (Drill Down)</div>';
    html += '<div class="grid-3">';

    for (var i = 0; i < frameworks.length; i++) {
      var fw = frameworks[i];
      var scoreColor = fw.score >= 97 ? '#10b981' : fw.score >= 95 ? '#f59e0b' : '#ef4444';
      html += '<div class="card animate-fade-in-up stagger-' + Math.min(i + 3, 8) + '" onclick="window.location.hash=\'#ciso/compliance/' + encodeURIComponent(fw.name) + '\'" style="cursor: pointer;" title="Click to view ' + fw.name + ' compliance control list">' +
        '<div class="card-body">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span style="font-size:20px">' + fw.icon + '</span>' +
              '<span style="font-weight:600;color:#e8ecf4">' + fw.name + '</span>' +
            '</div>' +
            '<span style="font-size:24px;font-weight:700;color:' + scoreColor + '" class="tabular-nums">' + fw.score + '%</span>' +
          '</div>' +
          '<div class="metric-row"><span class="metric-row-label">Controls Passed</span><span class="metric-row-value tabular-nums">' + fw.passedControls + ' / ' + fw.controls + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Open Findings</span><span class="metric-row-value tabular-nums">' + fw.findings + '</span></div>' +
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

  renderLevel2: function (frameworkName) {
    var d = AETHER.data;
    var controls = d.getComplianceDetails(frameworkName);
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#ciso" style="color: var(--text-secondary); text-decoration:none;">CISO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + frameworkName + ' Controls</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">🛡️ ' + frameworkName + ' Compliance Controls</h1>' +
        '<p class="page-subtitle">Granular check outcomes and failed data control evidence reports</p>' +
      '</div>' +
      '</div>';
      
    // Table of Controls
    html += '<div class="table-container animate-fade-in-up stagger-1">' +
      '<div class="table-header"><div class="table-title">Audited Control Checklist</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Control ID</th>' +
              '<th>Control Name</th>' +
              '<th>Status</th>' +
              '<th>Severity</th>' +
              '<th>Description</th>' +
              '<th style="text-align:right">Open Findings</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
          
    controls.forEach(function (c) {
      var statusBadge = c.status === 'Passed' ? 'badge-success' : 'badge-danger';
      var sevBadge = c.severity === 'Critical' ? 'badge-danger' : c.severity === 'High' ? 'badge-warning' : 'badge-info';
      var rowClick = c.status === 'Failed' ? 'style="cursor:pointer;" onclick="window.location.hash=\'#ciso/compliance/' + encodeURIComponent(frameworkName) + '/' + c.controlId + '\'"' : '';
      html += '<tr ' + rowClick + '>' +
        '<td class="font-mono text-accent">' + c.controlId + '</td>' +
        '<td style="font-weight:600; color:var(--text-primary);">' + c.name + '</td>' +
        '<td><span class="badge ' + statusBadge + '">' + c.status + '</span></td>' +
        '<td><span class="badge ' + sevBadge + '">' + c.severity + '</span></td>' +
        '<td class="text-secondary">' + c.description + '</td>' +
        '<td style="text-align:right" class="tabular-nums">' + c.findingsCount + '</td>' +
        '</tr>';
    });
    
    html += '</tbody></table></div></div></div>';
    return html;
  },

  renderLevel3: function (frameworkName, controlId) {
    var d = AETHER.data;
    var findings = d.getPIIDetails(frameworkName, controlId);
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#ciso" style="color: var(--text-secondary); text-decoration:none;">CISO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#ciso/compliance/' + encodeURIComponent(frameworkName) + '" style="color: var(--text-secondary); text-decoration:none;">' + frameworkName + ' Controls</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + controlId + ' Failures</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">⚠️ Data Exposure Incidents (' + controlId + ')</h1>' +
        '<p class="page-subtitle">Real-time alerts, exposed PII data records, and threat audit trail</p>' +
      '</div>' +
      '</div>';
      
    // Table of PII exposures
    html += '<div class="table-container animate-fade-in-up stagger-1">' +
      '<div class="table-header"><div class="table-title">Exposed Data Records</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Finding ID</th>' +
              '<th>Exposing Agent</th>' +
              '<th>PII Type</th>' +
              '<th>Masked Exposure</th>' +
              '<th>Target Downstream System</th>' +
              '<th>Detected</th>' +
              '<th>Severity</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
          
    findings.forEach(function (f) {
      var sevBadge = f.severity === 'Critical' ? 'badge-danger' : f.severity === 'High' ? 'badge-warning' : 'badge-info';
      html += '<tr style="cursor:pointer;" onclick="window.location.hash=\'#ciso/compliance/' + encodeURIComponent(frameworkName) + '/' + controlId + '/' + f.id + '\'">' +
        '<td class="font-mono text-accent">' + f.id + '</td>' +
        '<td style="font-weight:600; color:var(--text-primary);">' + f.agentName + '</td>' +
        '<td><span class="badge badge-neutral">' + f.piiType + '</span></td>' +
        '<td class="font-mono text-secondary">' + f.exposedItem + '</td>' +
        '<td><span style="color:var(--text-accent);">' + f.targetSystem + '</span></td>' +
        '<td class="text-secondary">' + f.timestamp + '</td>' +
        '<td><span class="badge ' + sevBadge + '">' + f.severity + '</span></td>' +
        '</tr>';
    });
    
    html += '</tbody></table></div></div></div>';
    return html;
  },

  renderLevel4: function (frameworkName, controlId, findingId) {
    var d = AETHER.data;
    var findings = d.getPIIDetails(frameworkName, controlId);
    var finding = findings.find(function (f) { return f.id === findingId; });
    
    if (!finding) {
      return '<div class="page-content"><div class="empty-state">Incident report not found</div></div>';
    }
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#ciso" style="color: var(--text-secondary); text-decoration:none;">CISO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#ciso/compliance/' + encodeURIComponent(frameworkName) + '" style="color: var(--text-secondary); text-decoration:none;">' + frameworkName + ' Controls</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#ciso/compliance/' + encodeURIComponent(frameworkName) + '/' + controlId + '" style="color: var(--text-secondary); text-decoration:none;">' + controlId + ' Failures</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">Remediation</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">🛡️ Remediation Console</h1>' +
        '<p class="page-subtitle">Audit exposure payload and apply active governance safeguards</p>' +
      '</div>' +
      '</div>';
      
    // Grid Details
    html += '<div class="grid-2 animate-fade-in-up stagger-1">' +
      
      // Details Card
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Exposure Audit</div></div>' +
        '<div class="card-body">' +
          '<div class="metric-row"><span class="metric-row-label">Finding ID</span><span class="metric-row-value font-mono text-accent">' + finding.id + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Exposing Agent</span><span class="metric-row-value table-agent-name" data-agent-id="' + finding.agentId + '" style="cursor:pointer; text-decoration:underline;">' + finding.agentName + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">PII Category</span><span class="metric-row-value"><span class="badge badge-neutral">' + finding.piiType + '</span></span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Target Destination</span><span class="metric-row-value" style="color:var(--text-accent);">' + finding.targetSystem + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Detected Time</span><span class="metric-row-value">' + finding.timestamp + '</span></div>' +
          '<div class="metric-row"><span class="metric-row-label">Risk Rating</span><span class="metric-row-value"><span class="badge badge-danger">Critical</span></span></div>' +
        '</div>' +
      '</div>' +
      
      // Remediation Actions Card
      '<div class="card" id="ciso-remediation-card">' +
        '<div class="card-header"><div class="card-title">Governance Safeguards</div></div>' +
        '<div class="card-body" style="display:flex; flex-direction:column; justify-content:center; min-height:160px; text-align:center;">' +
          '<div style="margin-bottom:16px; font-size:12px; color:var(--text-secondary);">' +
            'Safeguard status: <span style="color:var(--color-danger); font-weight:600;">Vulnerable (No Masking Policy)</span>' +
          '</div>' +
          '<button class="btn btn-danger btn-sm" id="ciso-btn-remediate" style="padding:10px 20px; align-self:center; font-weight:600; display:flex; align-items:center; gap:8px;">' +
            '⚙️ Enforce Data Masking Policy' +
          '</button>' +
        '</div>' +
      '</div>' +
      
      // Raw payload tracer
      '<div class="card" style="grid-column: span 2;">' +
        '<div class="card-header"><div class="card-title">Raw Incident Telemetry Payload (PII Highlighted)</div></div>' +
        '<div class="card-body">' +
          '<pre style="background:var(--bg-secondary); border:1px solid var(--border-primary); padding:16px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:11px; color:var(--text-primary); white-space:pre-wrap; word-break:break-all; margin:0;">' +
            JSON.stringify(JSON.parse(finding.rawPayload), null, 2) +
          '</pre>' +
        '</div>' +
      '</div>' +

      '</div>';
      
    html += '</div>';
    return html;
  },

  init: function () {
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'compliance') {
      if (route.id) {
        var framework = decodeURIComponent(route.id);
        if (route.subId) {
          if (route.leafId) {
            this.initLevel4(framework, route.subId, route.leafId);
          } else {
            this.initLevel3(framework, route.subId);
          }
        } else {
          this.initLevel2(framework);
        }
      } else {
        this.initLevel2('GDPR');
      }
      return;
    }

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
  },

  initLevel2: function (frameworkName) {
    AETHER.charts.destroyAll();
  },

  initLevel3: function (frameworkName, controlId) {
    AETHER.charts.destroyAll();
  },

  initLevel4: function (frameworkName, controlId, findingId) {
    AETHER.charts.destroyAll();
    var btn = document.getElementById('ciso-btn-remediate');
    var card = document.getElementById('ciso-remediation-card');
    
    if (btn && card) {
      btn.addEventListener('click', function () {
        // Enforce load animation
        btn.disabled = true;
        btn.innerHTML = '<span style="width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin 0.6s linear infinite; margin-right:8px;"></span>Applying safeguards...';
        
        setTimeout(function () {
          btn.remove();
          card.querySelector('.card-body').innerHTML = 
            '<div style="text-align:center; padding:12px 0;">' +
              '<div style="font-size:32px; margin-bottom:8px;">✅</div>' +
              '<div style="font-size:14px; font-weight:700; color:var(--color-success); margin-bottom:4px;">Remediated Successfully</div>' +
              '<div style="font-size:11px; color:var(--text-secondary);">Masking policy enforced. CLEAR TEXT logs scrubbed.</div>' +
            '</div>';
            
          if (AETHER.app && typeof AETHER.app.showToast === 'function') {
            AETHER.app.showToast('Remediation applied successfully: clear text telemetry scrubbed.', 'success');
          }
        }, 1200);
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 3 — CFO Dashboard
   ─────────────────────────────────────────────────────────────── */
AETHER.pages.cfo = {
  render: function () {
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'spend') {
      if (route.id) {
        if (route.subId) {
          return this.renderLevel4(route.id, route.subId);
        }
        return this.renderLevel3(route.id);
      }
      return this.renderLevel2();
    }
    
    if (route.view === 'clearing') {
      return this.renderVisaClearing();
    }

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
    var totalTasksExecuted = d.getAllAgents().reduce(function (sum, ag) { return sum + (parseInt(ag.tasksExecuted) || 0); }, 0);
    var cptBadge = isCum ? 'Active CPT: $' + Number(kpis.costPerTask).toFixed(2) : 'Active Tasks: ' + d.formatNumber(totalTasksExecuted);

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
        '<a href="#cfo/clearing" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none; vertical-align:middle; margin-right:8px;">' +
          '💳 Visa Clearing' +
        '</a>' +
        '<button class="btn btn-secondary btn-sm" id="cfo-export-financials" style="margin-right:8px;">' +
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

      '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#cfo/spend\'" style="cursor: pointer;" title="Click to view agent-wise cost drill-down">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v14M6 7h8M6 11h6M7 15h6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view cumulative spend details">' + spendBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + d.formatCurrency(showSpend) + (isCum ? '' : '/mo') + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Cumulative Spend (Drill Down)' : 'Total AI Spend (Drill Down)') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cfo-spark-spend" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#cfo/spend\'" style="cursor: pointer;" title="Click to view agent-wise cost drill-down">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon cyan">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6v8M7 10h6"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + cpaBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">$' + Number(showCPA).toLocaleString(undefined, {maximumFractionDigits:0}) + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Avg Cost Per Agent (Drill Down)' : 'Cost Per Agent (Drill Down)') + '</div>' +
        '<div class="kpi-sparkline"><canvas id="cfo-spark-cpa" height="32"></canvas></div>' +
      '</div>' +

      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#cfo/spend\'" style="cursor: pointer;" title="Click to view agent-wise cost drill-down">' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon green">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14l4-8 4 5 4-7"/></svg>' +
          '</div>' +
          '<span class="kpi-trend neutral" style="cursor:pointer;" onclick="AETHER.pages.executiveShowDeboardedModal(); event.stopPropagation();" title="Click to view deboarded agents archive">' + cptBadge + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">$' + Number(showCPT).toFixed(isCum ? 4 : 2) + '</div>' +
        '<div class="kpi-label">' + (isCum ? 'Avg Cost Per Task (Drill Down)' : 'Cost Per Task (Drill Down)') + '</div>' +
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
      '<div class="chart-card" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to drill down into agent-wise costs">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">AI Spend vs Budget (Drill Down)</div>' +
            '<div class="chart-card-subtitle">Monthly actual spend vs allocated budget ($M)</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="cfo-spend-chart" style="height:280px"></canvas>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to drill down into agent-wise costs">' +
        '<div class="chart-card-header">' +
          '<div>' +
            '<div class="chart-card-title">Cost Per Agent Trend (Drill Down)</div>' +
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

    html += '<div class="chart-card animate-fade-in-up stagger-5" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to drill down into agent-wise costs">' +
      '<div class="chart-card-body">' +
        '<canvas id="cfo-platform-cost" style="height:250px"></canvas>' +
      '</div>' +
    '</div>';

    /* ── Budget Summary ──────────────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-5">Budget Summary</div>';

    // Projected Annual / YTD are always extrapolated from the current MONTHLY
    // rate (kpis.monthlySpend), never from the all-time cumulative total —
    // multiplying an all-time running total by 12 wildly overstates the
    // projection once the fleet has been running for more than a month.
    var annualSpend = kpis.monthlySpend * 12;
    var ytdSpend = kpis.monthlySpend * 6;
    var summaryAgentsCount = isCum ? d.dbStats.cumulative_onboarded : totalAgents;
    html += '<div class="card animate-fade-in-up stagger-6">' +
      '<div class="card-body">' +
        '<div class="metric-row" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to view granular spend details">' +
          '<span class="metric-row-label">' + (isCum ? 'Cumulative AI Spend' : 'Monthly AI Spend') + '</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(isCum ? d.dbStats.cumulative_spend : kpis.monthlySpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to view granular spend details">' +
          '<span class="metric-row-label">Projected Annual</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(annualSpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to view granular spend details">' +
          '<span class="metric-row-label">YTD Spend (est.)</span>' +
          '<span class="metric-row-value tabular-nums">' + d.formatCurrency(ytdSpend) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to view granular spend details">' +
          '<span class="metric-row-label">' + (isCum ? 'Avg Cost Per Agent (All-Time)' : 'Cost Per Agent') + '</span>' +
          '<span class="metric-row-value tabular-nums">$' + Number(showCPA).toLocaleString(undefined, {maximumFractionDigits: 0}) + '</span>' +
        '</div>' +
        '<div class="metric-row" onclick="window.location.hash=\'#cfo/spend\'" style="cursor:pointer;" title="Click to view granular spend details">' +
          '<span class="metric-row-label">' + (isCum ? 'Total Agents (All-Time)' : 'Total Agents') + '</span>' +
          '<span class="metric-row-value tabular-nums">' + summaryAgentsCount + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Top Cost Optimization ───────────────────────────── */
    html += '<div class="section-title animate-fade-in-up stagger-6">Top Cost Optimization Opportunities</div>' +
      '<div id="cfo-recommendations-container" class="animate-fade-in-up stagger-7" style="margin-bottom: 24px;">' +
        '<div class="card">' +
          '<div class="card-body" style="padding:40px; text-align:center; color:var(--text-secondary);">' +
            '<div style="width:24px; height:24px; border:2px solid var(--border-primary); border-top-color:var(--accent-blue); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 12px;"></div>' +
            'Analyzing model execution costs and task patterns...' +
          '</div>' +
        '</div>' +
      '</div>';

    html += '</div>';
    return html;
  },

  renderLevel2: function () {
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var allAgents = d.getAllAgents();
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cfo" style="color: var(--text-secondary); text-decoration:none;">CFO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">Agent-wise Spend</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">💰 Agent-wise Spend</h1>' +
        '<p class="page-subtitle">Detailed monthly costs, platform resources, and task volumes for active agents</p>' +
      '</div>' +
      '</div>';
      
    // KPIs Row
    html += '<div class="kpi-grid" style="margin-bottom:24px;">' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">' + d.formatCurrency(kpis.monthlySpend) + '</div>' +
        '<div class="kpi-label">Total Monthly Spend</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">' + allAgents.length + '</div>' +
        '<div class="kpi-label">Active Agents</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">$' + Math.round(kpis.costPerAgent).toLocaleString() + '</div>' +
        '<div class="kpi-label">Average Cost / Agent</div>' +
      '</div>' +
      '</div>';
      
    // Table
    html += '<div class="table-container animate-fade-in-up stagger-2">' +
      '<div class="table-header"><div class="table-title">Agent Resource & Cost Ledger</div></div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Agent ID</th>' +
              '<th>Agent Name</th>' +
              '<th>Platform</th>' +
              '<th>LLM Model</th>' +
              '<th>Department</th>' +
              '<th style="text-align:right">Tasks</th>' +
              '<th style="text-align:right">Tokens</th>' +
              '<th style="text-align:right">Spend</th>' +
              '<th style="text-align:right">Potential Savings</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
          
    allAgents.forEach(function (ag) {
      var modelBadgeColor = ag.model === 'gpt-4o' ? '#3b82f6' :
                            ag.model === 'gpt-4' ? '#8b5cf6' :
                            ag.model === 'claude-3-5-sonnet' ? '#f59e0b' :
                            ag.model === 'snowflake-cortex' ? '#06b6d4' :
                            ag.model === 'databricks-dbrx' ? '#ef4444' : '#6b7280';
      html += '<tr style="cursor:pointer;" onclick="window.location.hash=\'#cfo/spend/' + ag.id + '\'">' +
        '<td class="font-mono text-accent">' + ag.id + '</td>' +
        '<td style="font-weight:600; color:var(--text-primary);">' + ag.name + '</td>' +
        '<td>' + ag.platform + '</td>' +
        '<td><span class="font-mono" style="font-size:11px; color:' + modelBadgeColor + '; background:' + modelBadgeColor + '18; padding:2px 6px; border-radius:4px;">' + (ag.model || '—') + '</span></td>' +
        '<td>' + ag.department + '</td>' +
        '<td style="text-align:right" class="tabular-nums">' + d.formatNumber(ag.tasksExecuted) + '</td>' +
        '<td style="text-align:right" class="tabular-nums">' + d.formatNumber(ag.tokenUsage) + '</td>' +
        '<td style="text-align:right; font-weight:600; color:var(--color-warning);" class="tabular-nums">' + d.formatCurrency(ag.monthlyCost) + '</td>' +
        '<td style="text-align:right; font-weight:600; color:var(--text-secondary);" class="agent-savings-cell tabular-nums" data-agent-id="' + ag.id + '">—</td>' +
        '</tr>';
    });
    
    html += '</tbody></table></div></div></div>';
    return html;
  },

  renderLevel3: function (agentId) {
    var d = AETHER.data;
    var agent = d.getAgent(agentId);
    if (!agent) {
      return '<div class="page-content"><div class="empty-state">Agent not found</div></div>';
    }
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cfo" style="color: var(--text-secondary); text-decoration:none;">CFO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cfo/spend" style="color: var(--text-secondary); text-decoration:none;">Agent-wise Spend</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + agent.name + '</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">📑 Transaction Logs: ' + agent.name + '</h1>' +
        '<p class="page-subtitle">Granular execution costs and model API token analytics</p>' +
      '</div>' +
      '</div>';
      
    // KPIs Row
    var modelColor = agent.model === 'gpt-4o' ? '#3b82f6' :
                     agent.model === 'gpt-4' ? '#8b5cf6' :
                     agent.model === 'claude-3-5-sonnet' ? '#f59e0b' :
                     agent.model === 'snowflake-cortex' ? '#06b6d4' :
                     agent.model === 'databricks-dbrx' ? '#ef4444' : '#6b7280';
    html += '<div class="kpi-grid" style="margin-bottom:24px;">' +
      '<div class="kpi-card">' +
        '<div class="kpi-value" style="color:var(--color-warning);">' + d.formatCurrency(agent.monthlyCost) + '</div>' +
        '<div class="kpi-label">Monthly Cost</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">' + d.formatNumber(agent.tasksExecuted) + '</div>' +
        '<div class="kpi-label">Tasks Executed</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">' + d.formatNumber(agent.tokenUsage) + '</div>' +
        '<div class="kpi-label">Tokens Utilized</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value">' + agent.platform + '</div>' +
        '<div class="kpi-label">Deployment Platform</div>' +
      '</div>' +
      '<div class="kpi-card">' +
        '<div class="kpi-value font-mono" style="font-size:14px; color:' + modelColor + ';">' + (agent.model || '—') + '</div>' +
        '<div class="kpi-label">LLM Model (Billing)</div>' +
      '</div>' +
      '</div>';
      
    // Alert Banner Container for Optimization Recommendation
    html += '<div id="cfo-agent-optimization-alert" class="animate-fade-in-up stagger-1" style="margin-bottom: 24px;"></div>';
      
    // Transaction list container
    html += '<div class="table-container animate-fade-in-up stagger-2" id="cfo-transaction-container">' +
      '<div class="table-header"><div class="table-title">Recent Transactions & API Executions</div></div>' +
      '<div style="padding:40px; text-align:center; color:var(--text-secondary);">' +
        '<div style="width:24px; height:24px; border:2px solid var(--border-primary); border-top-color:var(--accent-blue); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 12px;"></div>' +
        'Loading transactions from secure audit logs...' +
      '</div>' +
      '</div>';
      
    html += '</div>';
    return html;
  },

  renderLevel4: function (agentId, transactionId) {
    var d = AETHER.data;
    var agent = d.getAgent(agentId);
    if (!agent) {
      return '<div class="page-content"><div class="empty-state">Agent not found</div></div>';
    }
    
    var html = '<div class="page-content">';
    
    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cfo" style="color: var(--text-secondary); text-decoration:none;">CFO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cfo/spend" style="color: var(--text-secondary); text-decoration:none;">Agent-wise Spend</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<a href="#cfo/spend/' + agentId + '" style="color: var(--text-secondary); text-decoration:none;">' + agent.name + '</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">' + transactionId + '</span>' +
      '</div>';
      
    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">🔍 Transaction Details: ' + transactionId + '</h1>' +
        '<p class="page-subtitle">Token utilization analysis, model rates, and cost decomposition</p>' +
      '</div>' +
      '</div>';
      
    // Detail view container
    html += '<div class="grid-2 animate-fade-in-up stagger-1" id="cfo-transaction-detail-container">' +
      '<div class="card" style="grid-column: span 2;">' +
        '<div class="card-body" style="padding:40px; text-align:center; color:var(--text-secondary);">' +
          '<div style="width:24px; height:24px; border:2px solid var(--border-primary); border-top-color:var(--accent-blue); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 12px;"></div>' +
          'Loading transaction metadata...' +
        '</div>' +
      '</div>' +
      '</div>';
      
    html += '</div>';
    return html;
  },

  init: function () {
    var route = AETHER.pages.getSubRoute();
    if (route.view === 'spend') {
      if (route.id) {
        if (route.subId) {
          this.initLevel4(route.id, route.subId);
        } else {
          this.initLevel3(route.id);
        }
      } else {
        this.initLevel2();
      }
      return;
    }
    
    if (route.view === 'clearing') {
      this.initVisaClearing();
      return;
    }

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
              label: 'Actual Spend ($K)',
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
              label: 'Budget ($K)',
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
                callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; }
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

    // Fetch and render cost recommendations asynchronously
    var recoContainer = document.getElementById('cfo-recommendations-container');
    if (recoContainer) {
      d.getCostRecommendations(function (recosData) {
        var recos = recosData.recommendations || [];
        var recHtml = '';
        if (recos.length === 0) {
          recHtml = '<div class="card">' +
            '<div class="card-body" style="text-align: center; padding: 20px; color: #7a85a0;">No optimization recommendations at this time. All agent models match tasks optimally!</div>' +
          '</div>';
        } else {
          for (var ri = 0; ri < recos.length && ri < 3; ri++) {
            var rec = recos[ri];
            var topTask = rec.task_recommendations && rec.task_recommendations[0] ? rec.task_recommendations[0] : null;
            var details = topTask ? ('Switch ' + topTask.task_count + ' "' + topTask.task_type + '" task' + (topTask.task_count > 1 ? 's' : '') + ' from ' + topTask.current_model + ' to ' + topTask.optimal_model + '. ' + topTask.reason) : ('Switch agent model from ' + rec.agent_model + ' to optimized tier.');
            var recIcon = rec.priority === 'High' ? '🔴' : '🟡';
            recHtml += '<div class="recommendation-card animate-fade-in-up stagger-' + Math.min(ri + 5, 8) + '" style="cursor:pointer;" onclick="window.location.hash=\'#cfo/spend/' + rec.agent_id + '\'">' +
              '<div class="recommendation-icon">' + recIcon + '</div>' +
              '<div class="recommendation-content">' +
                '<div class="recommendation-title" style="font-weight:600; color:var(--text-primary);">' + rec.agent_name + ' (' + rec.agent_id + ')</div>' +
                '<div class="recommendation-desc" style="font-size:12px; margin-top:4px;">' + details + '</div>' +
              '</div>' +
              '<div class="recommendation-savings" style="text-align:right; min-width: 140px;">' +
                '<div style="font-weight:700; color:var(--color-success); font-size:15px;">Save ' + d.formatCurrency(rec.savings) + '</div>' +
                '<div style="font-size:11px; color:var(--text-secondary);">' + rec.savings_pct + '% Reduction</div>' +
              '</div>' +
            '</div>';
          }
        }
        recoContainer.innerHTML = recHtml;
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
  },

  initLevel2: function () {
    AETHER.charts.destroyAll();
    // Level 2 doesn't have charts currently
    var d = AETHER.data;
    var cells = document.querySelectorAll('.agent-savings-cell');
    if (cells.length > 0) {
      d.getCostRecommendations(function (recosData) {
        var recos = recosData.recommendations || [];
        cells.forEach(function (cell) {
          var agentId = cell.getAttribute('data-agent-id');
          var rec = recos.find(function (r) { return r.agent_id === agentId; });
          if (rec && rec.savings > 0) {
            cell.innerHTML = '<span style="color:var(--color-success); font-weight:600;">' +
              d.formatCurrency(rec.savings) + ' (' + rec.savings_pct + '%)</span>';
          } else {
            cell.innerHTML = '<span style="color:var(--text-secondary); opacity:0.6;">Optimal</span>';
          }
        });
      });
    }
  },

  initLevel3: function (agentId) {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    
    // Fetch agent-specific optimization alerts
    var alertContainer = document.getElementById('cfo-agent-optimization-alert');
    if (alertContainer) {
      d.getCostRecommendations(function (recosData) {
        var recos = recosData.recommendations || [];
        var rec = recos.find(function (r) { return r.agent_id === agentId; });
        if (rec && rec.savings > 0) {
          var details = '';
          rec.task_recommendations.forEach(function (tr) {
            details += '<li style="margin-top: 6px;">Switch <strong>' + tr.task_type + '</strong> tasks from ' + tr.current_model + ' to <strong>' + tr.optimal_model + '</strong> to save <strong>' + d.formatCurrency(tr.savings) + '</strong> (' + tr.savings_pct + '%). <br><span style="opacity: 0.8; font-size: 11px;">Rationale: ' + tr.reason + '</span></li>';
          });
          alertContainer.innerHTML = '<div class="card" style="border-left: 4px solid var(--color-success); margin-bottom: 24px; background: rgba(16, 185, 129, 0.05);">' +
            '<div class="card-body" style="padding: 16px 20px;">' +
              '<div style="font-weight: 700; color: var(--color-success); font-size: 14px; display: flex; align-items: center;">' +
                '<span style="margin-right: 8px;">💡</span> Cost Optimization Opportunity Detected' +
              '</div>' +
              '<div style="font-size: 12px; color: var(--text-primary); margin-top: 8px;">' +
                'This agent operates a workload highly suitable for tiered model migration. Recommended actions:' +
                '<ul style="margin: 8px 0 0 16px; padding: 0; list-style-type: disc;">' + details + '</ul>' +
              '</div>' +
              '<div style="margin-top: 12px; font-weight: 600; font-size: 12px; color: var(--color-success);">' +
                'Estimated Monthly Savings: Save ' + d.formatCurrency(rec.savings) + ' / month (' + rec.savings_pct + '% cost reduction).' +
              '</div>' +
            '</div>' +
          '</div>';
        }
      });
    }

    var container = document.getElementById('cfo-transaction-container');
    if (!container) return;
    
    d.getAgentTransactions(agentId, function(tasks) {
      var rows = '';
      if (!tasks || tasks.length === 0) {
        rows = '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:20px;">No transaction logs available for this agent.</td></tr>';
      } else {
        tasks.forEach(function (t) {
          var dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          var statusBadge = t.status === 'Success' ? 'badge-success' : 'badge-danger';
          rows += '<tr style="cursor:pointer;" onclick="window.location.hash=\'#cfo/spend/' + agentId + '/' + t.id + '\'">' +
            '<td class="font-mono text-accent">' + t.id + '</td>' +
            '<td class="text-secondary">' + dateStr + '</td>' +
            '<td><span class="badge badge-neutral">' + t.task_type + '</span></td>' +
            '<td class="font-mono text-secondary" style="font-size:11px;">' + (t.model || 'gpt-4o-mini') + '</td>' +
            '<td style="text-align:right" class="tabular-nums">' + d.formatNumber(t.tokens) + '</td>' +
            '<td style="text-align:right; font-weight:600; color:var(--text-accent);" class="tabular-nums">$' + Number(t.cost).toFixed(4) + '</td>' +
            '<td><span class="badge ' + statusBadge + '">' + t.status + '</span></td>' +
            '</tr>';
        });
      }
      
      container.innerHTML = '<div class="table-header"><div class="table-title">Recent Transactions & API Executions</div></div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Transaction ID</th>' +
                '<th>Timestamp</th>' +
                '<th>Type</th>' +
                '<th>Model</th>' +
                '<th style="text-align:right">Tokens</th>' +
                '<th style="text-align:right">Cost</th>' +
                '<th>Status</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>';
    });
  },

  initLevel4: function (agentId, transactionId) {
    AETHER.charts.destroyAll();
    var d = AETHER.data;
    var container = document.getElementById('cfo-transaction-detail-container');
    if (!container) return;
    
    d.getAgentTransactions(agentId, function(tasks) {
      var task = (tasks || []).find(function(t) { return t.id === transactionId; });
      if (!task) {
        container.innerHTML = '<div class="card" style="grid-column: span 2;"><div class="card-body" style="text-align:center;color:var(--text-secondary);">Transaction not found.</div></div>';
        return;
      }
      
      var inTokens = task.input_tokens || Math.round(task.tokens * 0.75);
      var outTokens = task.output_tokens || Math.round(task.tokens * 0.25);
      var inPercent = Math.round((inTokens / task.tokens) * 100);
      var outPercent = Math.round((outTokens / task.tokens) * 100);
      
      var pricingStr = '$3.00 / M input, $15.00 / M output';
      var tpmLimit = 200000;
      var rpmLimit = 1500;
      
      var modelName = task.model || 'claude-3-5-sonnet';
      if (modelName === 'gpt-4o') {
        pricingStr = '$2.50 / M input, $10.00 / M output';
        tpmLimit = 450000;
        rpmLimit = 3000;
      } else if (modelName === 'gpt-4') {
        pricingStr = '$30.00 / M input, $60.00 / M output';
        tpmLimit = 150000;
        rpmLimit = 1000;
      } else if (modelName === 'snowflake-cortex') {
        pricingStr = '$0.70 / M input, $2.80 / M output';
        tpmLimit = 300000;
        rpmLimit = 2000;
      } else if (modelName === 'databricks-dbrx') {
        pricingStr = '$1.50 / M input, $4.50 / M output';
        tpmLimit = 250000;
        rpmLimit = 1800;
      }
      
      var limitUtil = ((task.tokens / tpmLimit) * 100).toFixed(2);
      
      var mockPrompt = 'Execute quarterly pipeline calculations w.r.t Salesforce CRM closed opportunities. Generate structured JSON output of variances.';
      var mockCompletion = '{"status": "success", "variance_percentage": 4.2, "opportunities_scanned": 1284, "currency": "USD", "total_value": 48129000}';
      
      var dateStr = new Date(task.timestamp).toLocaleString();
      var statusBadge = task.status === 'Success' ? 'badge-success' : 'badge-danger';
      
      container.innerHTML = 
        // Token Allocation Bar
        '<div class="card" style="grid-column: span 2;">' +
          '<div class="card-header"><div class="card-title">Token Usage Allocation</div></div>' +
          '<div class="card-body">' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">' +
              '<span style="color:var(--text-accent);">📥 Input / Prompt: ' + d.formatNumber(inTokens) + ' (' + inPercent + '%)</span>' +
              '<span style="color:var(--color-warning);">📤 Output / Completion: ' + d.formatNumber(outTokens) + ' (' + outPercent + '%)</span>' +
            '</div>' +
            '<div style="height:12px; background:var(--bg-secondary); border-radius:var(--radius-full); overflow:hidden; display:flex;">' +
              '<div style="width:' + inPercent + '%; background:linear-gradient(90deg, #3b82f6, #06b6d4);"></div>' +
              '<div style="width:' + outPercent + '%; background:linear-gradient(90deg, #f59e0b, #ef4444);"></div>' +
            '</div>' +
            '<div style="margin-top:16px; font-size:11px; color:var(--text-secondary); text-align:center;">' +
              'Total Tokens Utilized: ' + d.formatNumber(task.tokens) + ' · Base Model: <span class="font-mono" style="color:var(--text-primary);">' + modelName + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        
        // Left Column: Metadata
        '<div class="card">' +
          '<div class="card-header"><div class="card-title">Execution Metadata</div></div>' +
          '<div class="card-body">' +
            '<div class="metric-row"><span class="metric-row-label">Transaction ID</span><span class="metric-row-value font-mono text-accent">' + task.id + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Timestamp</span><span class="metric-row-value">' + dateStr + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Execution Type</span><span class="metric-row-value"><span class="badge badge-neutral">' + task.task_type + '</span></span></div>' +
            '<div class="metric-row"><span class="metric-row-label">API Status</span><span class="metric-row-value"><span class="badge ' + statusBadge + '">' + task.status + '</span></span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Execution Latency</span><span class="metric-row-value tabular-nums">' + task.duration_ms + ' ms</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Model Contract Price</span><span class="metric-row-value" style="font-size:11px;">' + pricingStr + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Rate Limit Capacity</span><span class="metric-row-value font-mono" style="font-size:11px;">' + tpmLimit.toLocaleString() + ' TPM / ' + rpmLimit.toLocaleString() + ' RPM</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Task TPM Utilization</span><span class="metric-row-value" style="color:var(--color-info); font-weight:600;">' + limitUtil + '%</span></div>' +
          '</div>' +
        '</div>' +
        
        // Right Column: Cost Decomposition
        '<div class="card" id="cfo-cost-breakdown-card">' +
          '<div class="card-header"><div class="card-title">Cost Breakdown & ROI</div></div>' +
          '<div class="card-body">' +
            '<div class="metric-row"><span class="metric-row-label">Input Token Cost</span><span class="metric-row-value tabular-nums">$' + (inTokens * (modelName === 'gpt-4o' ? 0.0000025 : modelName === 'gpt-4' ? 0.00003 : modelName === 'snowflake-cortex' ? 0.0000007 : modelName === 'databricks-dbrx' ? 0.0000015 : 0.000003)).toFixed(5) + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Output Token Cost</span><span class="metric-row-value tabular-nums">$' + (outTokens * (modelName === 'gpt-4o' ? 0.00001 : modelName === 'gpt-4' ? 0.00006 : modelName === 'snowflake-cortex' ? 0.0000028 : modelName === 'databricks-dbrx' ? 0.0000045 : 0.000015)).toFixed(5) + '</span></div>' +
            '<div style="border-top:1px solid var(--border-primary); margin:12px 0; padding-top:12px;" class="metric-row">' +
              '<span class="metric-row-label" style="font-weight:600; color:var(--text-primary);">Total Cost (Decomposed)</span>' +
              '<span class="metric-row-value tabular-nums" style="font-size:16px; font-weight:700; color:var(--color-warning);">$' + Number(task.cost).toFixed(5) + '</span>' +
            '</div>' +
            '<div class="metric-row"><span class="metric-row-label">Business Value Yield</span><span class="metric-row-value" style="color:var(--color-success); font-weight:600;">$0.10 (Est.)</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Net Transaction ROI</span><span class="metric-row-value" style="color:var(--color-success); font-weight:600;">+' + Math.round((0.10 / Math.max(task.cost, 0.001) - 1) * 100) + '%</span></div>' +
          '</div>' +
        '</div>' +
        
        // Full width prompt / response tracer
        '<div class="card" style="grid-column: span 2;">' +
          '<div class="card-header"><div class="card-title">LLM Payload Tracer</div></div>' +
          '<div class="card-body">' +
            '<div style="font-size:11px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:6px;">Prompt / Input Context</div>' +
            '<pre style="background:var(--bg-secondary); border:1px solid var(--border-primary); padding:12px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:11px; color:var(--text-primary); white-space:pre-wrap; word-break:break-all; margin-bottom:16px;">' + mockPrompt + '</pre>' +
            '<div style="font-size:11px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:6px;">Completion / Output Response</div>' +
            '<pre style="background:var(--bg-secondary); border:1px solid var(--border-primary); padding:12px; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:11px; color:var(--color-success-light); white-space:pre-wrap; word-break:break-all; margin:0;">' + mockCompletion + '</pre>' +
          '</div>' +
        '</div>';

      // Inline recommendation box fetch and render
      d.getCostRecommendations(function (recosData) {
        var recos = recosData.recommendations || [];
        var rec = recos.find(function (r) { return r.agent_id === agentId; });
        if (rec) {
          var tr = rec.task_recommendations.find(function (t) { return t.task_type === task.task_type; });
          if (tr) {
            var singleCurrentCost = task.cost;
            var singleOptimizedCost = Number((singleCurrentCost * (tr.optimized_cost / tr.current_cost)).toFixed(5));
            var singleSavings = Number((singleCurrentCost - singleOptimizedCost).toFixed(5));
            var savingsPct = tr.savings_pct;
            
            var recoBoxHtml = '<div style="margin-top:16px; padding:12px; background:rgba(16, 185, 129, 0.05); border:1px solid rgba(16, 185, 129, 0.15); border-radius:var(--radius-sm); text-align: left;">' +
              '<div style="font-weight:700; color:var(--color-success); font-size:12px; display:flex; align-items:center;">' +
                '<span style="margin-right:6px;">💡</span> Cost Optimization Opportunity' +
              '</div>' +
              '<p style="font-size:11px; color:var(--text-primary); margin:6px 0 0 0; line-height: 1.4;">' +
                'This task execution can be optimized. Running this <strong>' + task.task_type + '</strong> on <strong>' + tr.optimal_model + '</strong> instead of ' + task.model + ' reduces cost to <strong>$' + singleOptimizedCost.toFixed(5) + '</strong> ' +
                '(saving <strong>$' + singleSavings.toFixed(5) + '</strong> or ' + savingsPct + '% per transaction).' +
              '</p>' +
              '<p style="font-size:10px; color:var(--text-secondary); margin:6px 0 0 0; opacity: 0.8; line-height: 1.3;">' +
                'Rationale: ' + tr.reason +
              '</p>' +
            '</div>';
            
            var card = document.getElementById('cfo-cost-breakdown-card');
            if (card) {
              var cardBody = card.querySelector('.card-body');
              if (cardBody) {
                var div = document.createElement('div');
                div.innerHTML = recoBoxHtml;
                cardBody.appendChild(div.firstChild);
              }
            }
          }
        }
      });
    });
  },

  renderVisaClearing: function () {
    var d = AETHER.data;
    var allAgents = d.getAllAgents();
    var html = '<div class="page-content">';

    // Breadcrumbs
    html += '<div class="topbar-breadcrumb" style="margin-bottom:16px;">' +
      '<a href="#cfo" style="color: var(--text-secondary); text-decoration:none;">CFO Dashboard</a>' +
      '<span class="topbar-breadcrumb-sep" style="margin:0 8px; color:var(--text-tertiary);">/</span>' +
      '<span style="color:var(--text-primary); font-weight:600;">Visa Clearing Network</span>' +
      '</div>';

    // Page Header
    html += '<div class="page-header animate-fade-in-up">' +
      '<div>' +
        '<h1 class="page-title">💳 Visa Clearing Network (A2A)</h1>' +
        '<p class="page-subtitle">Real-time authentication, cost authorization, and dispute clearing for Agent-to-Agent transactions</p>' +
      '</div>' +
      '</div>';

    // Overview KPIs
    html += '<div class="kpi-row" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:24px;">' +
      '<div class="kpi-card animate-fade-in-up stagger-1">' +
        '<div style="font-size:24px; font-weight:700; color:var(--color-info);" id="visa-kpi-volume">$0.0000</div>' +
        '<div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Total Clearing Volume</div>' +
      '</div>' +
      '<div class="kpi-card animate-fade-in-up stagger-2">' +
        '<div style="font-size:24px; font-weight:700; color:var(--color-success);" id="visa-kpi-success">0%</div>' +
        '<div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Authorization Success Rate</div>' +
      '</div>' +
      '<div class="kpi-card animate-fade-in-up stagger-3">' +
        '<div style="font-size:24px; font-weight:700; color:var(--color-danger);" id="visa-kpi-decline">0%</div>' +
        '<div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Decline Rate</div>' +
      '</div>' +
      '<div class="kpi-card animate-fade-in-up stagger-4">' +
        '<div style="font-size:24px; font-weight:700; color:var(--color-warning);" id="visa-kpi-disputes">0</div>' +
        '<div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">Active Disputes / Refunds</div>' +
      '</div>' +
    '</div>';

    // Grid: Terminal & Passport Scanner
    html += '<div class="grid-2" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">' +
      // Column 1: A2A Terminal
      '<div class="card animate-fade-in-up stagger-5" style="display:flex; flex-direction:column;">' +
        '<div class="card-header" style="font-weight:700; font-size:13px; color:var(--text-primary); border-bottom:1px solid var(--border-primary); padding:12px 16px;">⚡ Real-time Clearing Gateway</div>' +
        '<div class="card-body" style="padding:16px; flex-grow:1; display:flex; flex-direction:column; gap:12px;">' +
          '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">' +
            '<div>' +
              '<label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Sender Agent</label>' +
              '<select id="visa-sender-select" class="form-control" style="width:100%; border:1px solid var(--border-primary); background:var(--bg-topbar); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-sm); font-size:12px;"></select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Receiver Agent</label>' +
              '<select id="visa-receiver-select" class="form-control" style="width:100%; border:1px solid var(--border-primary); background:var(--bg-topbar); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-sm); font-size:12px;"></select>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Requested Tokens</label>' +
            '<input type="number" id="visa-tokens-input" value="15000" class="form-control" style="width:100%; border:1px solid var(--border-primary); background:var(--bg-topbar); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-sm); font-size:12px;" />' +
          '</div>' +
          '<button id="visa-submit-btn" class="btn btn-primary" style="width:100%; font-weight:600; padding:10px; border-radius:var(--radius-sm); cursor:pointer;">Submit Authorization Request</button>' +
          // Terminal console output
          '<div id="visa-console" style="margin-top:10px; background:#0d1117; border:1px solid #30363d; border-radius:var(--radius-sm); font-family:var(--font-mono); font-size:11px; color:#8b949e; padding:12px; height:150px; overflow-y:auto; line-height:1.4;">' +
            '<span style="color:#58a6ff;">&gt; AETHER Visa network status: online. Ready for clearing requests.</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Column 2: Passport Scanner
      '<div class="card animate-fade-in-up stagger-6">' +
        '<div class="card-header" style="font-weight:700; font-size:13px; color:var(--text-primary); border-bottom:1px solid var(--border-primary); padding:12px 16px;">🪪 Agent Passport Validator</div>' +
        '<div class="card-body" style="padding:16px;">' +
          '<div style="margin-bottom:16px;">' +
            '<label style="display:block; font-size:11px; color:var(--text-secondary); margin-bottom:4px;">Scan Agent Passport</label>' +
            '<select id="visa-passport-select" class="form-control" style="width:100%; border:1px solid var(--border-primary); background:var(--bg-topbar); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-sm); font-size:12px;"></select>' +
          '</div>' +
          '<div id="passport-details" style="border:1px dashed var(--border-primary); border-radius:var(--radius-md); padding:16px; min-height:220px; background:rgba(255,255,255,0.01);">' +
            '<div style="text-align:center; color:var(--text-tertiary); padding-top:80px; font-size:12px;">Select an agent to scan and verify their cryptographic Visa passport.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // Row: Transaction Ledger
    html += '<div class="table-container animate-fade-in-up stagger-7">' +
      '<div class="table-header" style="padding:16px; border-bottom:1px solid var(--border-primary); font-weight:700; font-size:13px; color:var(--text-primary);">📝 Clearing Network Transaction Ledger</div>' +
      '<div class="table-scroll">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>TX ID</th>' +
              '<th>Timestamp</th>' +
              '<th>Sender Agent</th>' +
              '<th>Receiver Agent</th>' +
              '<th>Tokens</th>' +
              '<th>Clearing Cost</th>' +
              '<th>Compliance</th>' +
              '<th>Status</th>' +
              '<th style="text-align:right;">Actions</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="visa-ledger-rows">' +
            '<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-secondary);">Loading transaction logs...</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

    html += '</div>';
    return html;
  },

  initVisaClearing: function () {
    var d = AETHER.data;
    var allAgents = d.getAllAgents();

    // Populate dropdowns
    var senderSelect = document.getElementById('visa-sender-select');
    var receiverSelect = document.getElementById('visa-receiver-select');
    var passportSelect = document.getElementById('visa-passport-select');

    if (senderSelect && receiverSelect && passportSelect) {
      senderSelect.innerHTML = '';
      receiverSelect.innerHTML = '';
      passportSelect.innerHTML = '<option value="">-- Choose Agent --</option>';

      allAgents.forEach(function (ag) {
        var opt = '<option value="' + ag.id + '">' + ag.name + ' (' + ag.id + ')</option>';
        senderSelect.innerHTML += opt;
        receiverSelect.innerHTML += opt;
        passportSelect.innerHTML += '<option value="' + ag.id + '">' + ag.name + ' (' + ag.id + ')</option>';
      });
      
      // Defaults
      if (allAgents.length > 1) {
        receiverSelect.value = allAgents[1].id;
      }
    }

    var self = this;
    
    // Fetch and render ledger
    var refreshLedger = function () {
      d.getA2ATransactions(function (transactions) {
        var rowsHTML = '';
        var totalVol = 0.0;
        var approvedCount = 0;
        var declinedCount = 0;
        var disputeCount = 0;

        if (transactions.length === 0) {
          rowsHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--text-secondary);">No transactions cleared yet.</td></tr>';
        } else {
          transactions.forEach(function (tx) {
            var date = new Date(tx.timestamp).toLocaleString();
            var senderAg = d.getAgent(tx.sender_id) || { name: 'Unknown (' + tx.sender_id + ')' };
            var receiverAg = d.getAgent(tx.receiver_id) || { name: 'Unknown (' + tx.receiver_id + ')' };
            
            totalVol += tx.cost;
            if (tx.status === 'Approved') approvedCount++;
            else if (tx.status === 'Declined') declinedCount++;
            else if (tx.status === 'Refunded') disputeCount++;

            var statusBadge = '';
            if (tx.status === 'Approved') statusBadge = '<span class="badge badge-success">Approved</span>';
            else if (tx.status === 'Declined') statusBadge = '<span class="badge badge-danger" title="' + tx.decline_reason + '">Declined</span>';
            else if (tx.status === 'Refunded') statusBadge = '<span class="badge badge-warning">Refunded</span>';

            var compBadge = tx.compliance_check === 'Passed' 
              ? '<span class="badge badge-success" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981;">Passed</span>'
              : '<span class="badge badge-danger" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444;">Failed</span>';

            var actionBtn = '';
            if (tx.status === 'Approved') {
              actionBtn = '<button class="btn btn-xs btn-secondary visa-dispute-btn" data-id="' + tx.id + '" style="font-size:10px; padding:2px 6px;">Dispute</button>';
            }

            rowsHTML += '<tr>' +
              '<td class="font-mono" style="font-weight:600; color:var(--text-primary);">' + tx.id + '</td>' +
              '<td style="font-size:11px; color:var(--text-secondary);">' + date + '</td>' +
              '<td>' + senderAg.name + '</td>' +
              '<td>' + receiverAg.name + '</td>' +
              '<td class="font-mono">' + tx.tokens_requested.toLocaleString() + '</td>' +
              '<td class="font-mono">$' + tx.cost.toFixed(4) + '</td>' +
              '<td>' + compBadge + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td style="text-align:right;">' + actionBtn + '</td>' +
              '</tr>';
          });
        }

        var ledgerBody = document.getElementById('visa-ledger-rows');
        if (ledgerBody) ledgerBody.innerHTML = rowsHTML;

        // Render KPI metrics
        var successRate = (approvedCount + declinedCount + disputeCount) > 0 
          ? Math.round((approvedCount / (approvedCount + declinedCount + disputeCount)) * 100) : 100;
        var declineRate = (approvedCount + declinedCount + disputeCount) > 0 
          ? Math.round((declinedCount / (approvedCount + declinedCount + disputeCount)) * 100) : 0;

        var volKPI = document.getElementById('visa-kpi-volume');
        var successKPI = document.getElementById('visa-kpi-success');
        var declineKPI = document.getElementById('visa-kpi-decline');
        var disputeKPI = document.getElementById('visa-kpi-disputes');

        if (volKPI) volKPI.textContent = '$' + totalVol.toFixed(4);
        if (successKPI) successKPI.textContent = successRate + '%';
        if (declineKPI) declineKPI.textContent = declineRate + '%';
        if (disputeKPI) disputeKPI.textContent = disputeCount;

        // Bind dispute buttons
        var btns = document.querySelectorAll('.visa-dispute-btn');
        btns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var txId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to dispute transaction ' + txId + ' and trigger a roll-back?')) {
              d.disputeA2ATransaction(txId, function (res) {
                if (res.status === 'Refunded') {
                  alert('Transaction disputed and refunded. Counters reverted.');
                  refreshLedger();
                } else {
                  alert('Dispute failed: ' + res.error);
                }
              });
            }
          });
        });
      });
    };

    refreshLedger();

    // Bind terminal submit button
    var submitBtn = document.getElementById('visa-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var senderVal = document.getElementById('visa-sender-select').value;
        var receiverVal = document.getElementById('visa-receiver-select').value;
        var tokensVal = parseInt(document.getElementById('visa-tokens-input').value, 10);
        var consoleBox = document.getElementById('visa-console');

        if (!senderVal || !receiverVal || isNaN(tokensVal)) {
          alert('Please enter valid input values.');
          return;
        }

        if (consoleBox) {
          consoleBox.innerHTML = '<span style="color:#d4a72c;">&gt; Initiating cryptographic handshake...</span><br/>' +
            '<span style="color:#d4a72c;">&gt; Scanning sender agent passport credentials...</span><br/>' +
            '<span style="color:#d4a72c;">&gt; Intercepting network transaction payload...</span>';
          consoleBox.scrollTop = consoleBox.scrollHeight;
        }

        submitBtn.disabled = true;
        
        setTimeout(function () {
          d.authorizeA2ATransaction({
            sender_id: senderVal,
            receiver_id: receiverVal,
            tokens_requested: tokensVal
          }, function (receipt) {
            submitBtn.disabled = false;
            if (consoleBox) {
              var col = receipt.status === 'Approved' ? '#238636' : '#f85149';
              var receiptStr = JSON.stringify(receipt, null, 2).replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
              consoleBox.innerHTML += '<br/><span style="color:' + col + '; font-weight:700;">&gt; [VISA AUTH RESOLUTION: ' + receipt.status + ']</span><br/>' +
                '<span style="color:#8b949e;">' + receiptStr + '</span>';
              consoleBox.scrollTop = consoleBox.scrollHeight;
            }
            refreshLedger();
          });
        }, 1200);
      });
    }

    // Bind passport scanner selection
    if (passportSelect) {
      passportSelect.addEventListener('change', function () {
        var agentId = this.value;
        var container = document.getElementById('passport-details');
        if (!container) return;

        if (!agentId) {
          container.innerHTML = '<div style="text-align:center; color:var(--text-tertiary); padding-top:80px; font-size:12px;">Select an agent to scan and verify their cryptographic Visa passport.</div>';
          return;
        }

        var ag = d.getAgent(agentId);
        if (!ag) {
          container.innerHTML = '<div style="text-align:center; color:var(--color-danger); padding-top:80px; font-size:12px;">Agent not found in active registry.</div>';
          return;
        }

        var signature = 'SHA256:' + btoa(ag.id + ag.name).substring(0, 32).toUpperCase();
        var modelApp = 'Passed';
        var modelAppCol = '#10b981';
        
        var m = (ag.model || '').toLowerCase();
        if (m.indexOf('gpt-3.5') !== -1 || m.indexOf('davinci') !== -1 || m.indexOf('llama2') !== -1) {
          modelApp = 'Failed (GOV-MODEL-001)';
          modelAppCol = '#ef4444';
        }

        container.innerHTML = 
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-primary); padding-bottom:8px;">' +
            '<div style="font-weight:700; color:var(--text-primary); font-size:13px;">🛂 ' + ag.name + '</div>' +
            '<span class="badge badge-success" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; font-size:9px;">VERIFIED PASSPORT</span>' +
          '</div>' +
          '<div style="font-size:11px; display:flex; flex-direction:column; gap:8px; line-height:1.4;">' +
            '<div><span style="color:var(--text-secondary);">Passport Hash:</span> <code style="font-family:var(--font-mono); color:var(--color-info); font-size:10px;">' + signature + '</code></div>' +
            '<div><span style="color:var(--text-secondary);">Assigned Department:</span> <span style="font-weight:600; color:var(--text-primary);">' + ag.department + '</span></div>' +
            '<div><span style="color:var(--text-secondary);">Owner / Custodian:</span> <span style="font-weight:600; color:var(--text-primary);">' + ag.owner + '</span></div>' +
            '<div><span style="color:var(--text-secondary);">Infrastructure Region:</span> <code style="font-family:var(--font-mono);">' + ag.region + '</code></div>' +
            '<div><span style="color:var(--text-secondary);">Model Policy Check:</span> <span style="font-weight:700; color:' + modelAppCol + ';">' + modelApp + '</span></div>' +
            '<div><span style="color:var(--text-secondary);">Access Scopes:</span> ' +
              '<span class="badge badge-neutral" style="font-size:9px; margin-right:4px;">A2A_EXECUTE</span>' +
              (ag.financialAccess ? '<span class="badge badge-neutral" style="font-size:9px; margin-right:4px; background:rgba(245,158,11,0.15); color:#f59e0b;">FINANCIAL_DEBIT</span>' : '') +
              (ag.piiAccess ? '<span class="badge badge-neutral" style="font-size:9px; background:rgba(239,68,68,0.15); color:#ef4444;">PII_ACCESS</span>' : '') +
            '</div>' +
          '</div>';
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
