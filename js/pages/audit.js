/* ═══════════════════════════════════════════════════════════════
   AETHER Audit Center
   Enterprise AI Workforce Platform — Auditor Agent Command Post
   Autonomous audit, evidence collection, and executive reporting
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.audit = {

  render: function () {
    var d = AETHER.data;
    var cfg = AETHER.config;
    var audit = d.computeAudit();
    var totalAgents = d.getTotalAgentCount();

    var html = '<div class="page-content">';

    /* ── Page Header ──────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left">' +
        '<h1 class="page-title">Audit Center</h1>' +
        '<p class="page-subtitle">Autonomous audit, evidence collection, and executive reporting</p>' +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-secondary" id="audit-export-btn">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M4 12V10M8 12V8M12 12V6"/>' +
            '<rect x="1" y="1" width="14" height="14" rx="2"/>' +
          '</svg>' +
          ' Export Report' +
        '</button>' +
        '<button class="btn btn-primary" id="audit-run-btn">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<polygon points="5,3 13,8 5,13" fill="currentColor" stroke="none"/>' +
          '</svg>' +
          ' Run Audit' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── Empty State ──────────────────────────────────────── */
    if (totalAgents === 0) {
      html += '<div class="card animate-fade-in-up stagger-1">' +
        '<div class="card-body" style="text-align: center; padding: 60px 20px;">' +
          '<div style="font-size: 48px; margin-bottom: 16px;">🔎</div>' +
          '<h3 style="color: #e8ecf4; margin: 0 0 8px 0;">No Audit Data</h3>' +
          '<p style="color: #7a85a0; margin: 0;">No agents onboarded. Audit monitoring will begin when agents are added.</p>' +
        '</div>' +
      '</div>';
      html += '</div>';
      return html;
    }

    /* ── Auditor Agent Status Card ────────────────────────── */
    html += '<div class="animate-fade-in-up stagger-1">';
    if (AETHER.supervisorUI && typeof AETHER.supervisorUI.renderAgentCard === 'function') {
      html += AETHER.supervisorUI.renderAgentCard('sa-auditor');
    } else {
      html += '<div class="card" style="border-left: 3px solid #d946ef; margin-bottom: 24px;">' +
        '<div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">' +
          '<div style="display: flex; align-items: center; gap: 12px;">' +
            '<span style="font-size: 28px;">🔎</span>' +
            '<div>' +
              '<h3 style="margin: 0; color: #e8ecf4; font-size: 16px;">Auditor Agent</h3>' +
              '<span style="color: #7a85a0; font-size: 13px;">Autonomous internal auditor — who, what, risks, compliance, value</span>' +
            '</div>' +
          '</div>' +
          '<span class="badge badge-success">Running</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">' +
            '<div class="metric-row" style="flex-direction: column; align-items: center; text-align: center; cursor: pointer;" onclick="window.location.hash=\'#rationale/totalAgents\'" title="Click to view total agents rationale">' +
              '<div class="metric-value" style="font-size: 24px; font-weight: 700; color: #e8ecf4;">' + audit.auditsCompleted + '</div>' +
              '<div class="metric-label" style="color: #7a85a0; font-size: 12px;">Audits Completed</div>' +
            '</div>' +
            '<div class="metric-row" style="flex-direction: column; align-items: center; text-align: center; cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view open findings rationale">' +
              '<div class="metric-value" style="font-size: 24px; font-weight: 700; color: #f59e0b;">' + audit.openFindings + '</div>' +
              '<div class="metric-label" style="color: #7a85a0; font-size: 12px;">Open Findings</div>' +
            '</div>' +
            '<div class="metric-row" style="flex-direction: column; align-items: center; text-align: center; cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view critical findings rationale">' +
              '<div class="metric-value" style="font-size: 24px; font-weight: 700; color: #ef4444;">' + audit.criticalFindings + '</div>' +
              '<div class="metric-label" style="color: #7a85a0; font-size: 12px;">Critical Findings</div>' +
            '</div>' +
            '<div class="metric-row" style="flex-direction: column; align-items: center; text-align: center;" title="Number of audit reports generated for the current fleet">' +
              '<div class="metric-value" style="font-size: 24px; font-weight: 700; color: #3b82f6;">' + audit.reports.length + '</div>' +
              '<div class="metric-label" style="color: #7a85a0; font-size: 12px;">Reports Generated</div>' +
            '</div>' +
            '<div class="metric-row" style="flex-direction: column; align-items: center; text-align: center;" title="Target remediation time based on the current findings\' severity mix — not a historical average (AETHER doesn\'t yet track finding resolution timestamps)">' +
              '<div class="metric-value" style="font-size: 24px; font-weight: 700; color: #10b981;">' + audit.avgRemediation + '</div>' +
              '<div class="metric-label" style="color: #7a85a0; font-size: 12px;">Remediation SLA Target</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';

    /* ── KPI Grid — 4 Cards ──────────────────────────────── */
    html += '<div class="kpi-grid">' +

      /* Audits Completed */
      '<div class="kpi-card animate-fade-in-up stagger-2" style="cursor: pointer;" onclick="window.location.hash=\'#rationale/totalAgents\'" title="Click to view rationale">' +
        '<div class="kpi-card-accent" style="background: #10b981;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon green">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M9 11l3 3L22 4"/>' +
              '<rect x="2" y="2" width="16" height="16" rx="3"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + audit.auditsCompleted + '</div>' +
        '<div class="kpi-label">Audits Completed</div>' +
      '</div>' +

      /* Open Findings */
      '<div class="kpi-card animate-fade-in-up stagger-3" style="cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view rationale">' +
        '<div class="kpi-card-accent" style="background: #f59e0b;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon yellow">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<circle cx="10" cy="10" r="8"/>' +
              '<line x1="10" y1="6" x2="10" y2="10"/>' +
              '<circle cx="10" cy="13" r="0.5" fill="currentColor"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + audit.openFindings + '</div>' +
        '<div class="kpi-label">Open Findings</div>' +
      '</div>' +

      /* Critical Findings */
      '<div class="kpi-card animate-fade-in-up stagger-4" style="cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view rationale">' +
        '<div class="kpi-card-accent" style="background: #ef4444;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon red">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M10 2L18 18H2L10 2z"/>' +
              '<line x1="10" y1="8" x2="10" y2="12"/>' +
              '<circle cx="10" cy="15" r="0.5" fill="currentColor"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + audit.criticalFindings + '</div>' +
        '<div class="kpi-label">Critical Findings</div>' +
      '</div>' +

      /* Avg Remediation */
      '<div class="kpi-card animate-fade-in-up stagger-5" title="Target remediation time based on current findings\' severity mix — not a historical average">' +
        '<div class="kpi-card-accent" style="background: #3b82f6;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<circle cx="10" cy="10" r="8"/>' +
              '<polyline points="10,5 10,10 14,12"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend neutral">—</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + audit.avgRemediation + '</div>' +
        '<div class="kpi-label">Remediation SLA Target</div>' +
      '</div>' +

    '</div>';

    /* ── Audit Reports ───────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-5" style="margin-bottom: 24px;">' +
      '<div class="card-header">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">📄 Audit Reports</h3>' +
      '</div>' +
      '<div class="card-body">';

    if (audit.reports.length === 0) {
      html += '<p style="color: #7a85a0; text-align: center; padding: 20px 0; margin: 0;">No audit reports generated yet.</p>';
    } else {
      html += '<div class="grid-3">';
      for (var r = 0; r < audit.reports.length; r++) {
        var report = audit.reports[r];
        html += '<div class="card" style="border-left: 3px solid ' + (report.color || '#3b82f6') + '; background: rgba(15,19,42,0.5);">' +
          '<div class="card-body">' +
            '<h4 style="color: #e8ecf4; margin: 0 0 8px 0; font-size: 14px;">' + report.title + '</h4>' +
            '<div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">' +
              '<div style="display: flex; justify-content: space-between; font-size: 12px;">' +
                '<span style="color: #7a85a0;">Generated</span>' +
                '<span style="color: #e8ecf4;">' + report.generated + '</span>' +
              '</div>' +
              '<div style="display: flex; justify-content: space-between; font-size: 12px;">' +
                '<span style="color: #7a85a0;">Pages</span>' +
                '<span style="color: #e8ecf4;">' + report.pages + '</span>' +
              '</div>' +
              '<div style="display: flex; justify-content: space-between; font-size: 12px; align-items: center;">' +
                '<span style="color: #7a85a0;">Status</span>' +
                '<span class="badge badge-success">' + report.status + '</span>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-secondary audit-view-report-btn" style="width: 100%;">View Report</button>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
    }

    html += '</div></div>';

    /* ── Audit Findings Table ─────────────────────────────── */
    var findings = audit.findings;
    html += '<div class="card animate-fade-in-up stagger-6" style="margin-bottom: 24px;">' +
      '<div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">🔍 Audit Findings</h3>' +
        '<span class="badge badge-neutral">' + findings.length + ' findings</span>' +
      '</div>' +
      '<div class="card-body" style="overflow-x: auto;">';

    if (findings.length === 0) {
      html += '<p style="color: #7a85a0; text-align: center; padding: 20px 0; margin: 0;">No findings detected. All agents are compliant.</p>';
    } else {
      html += '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Finding ID</th>' +
              '<th>Framework</th>' +
              '<th>Control</th>' +
              '<th>Severity</th>' +
              '<th>Finding</th>' +
              '<th>Status</th>' +
              '<th>Due Date</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

      for (var f = 0; f < findings.length; f++) {
        var finding = findings[f];
        var sevBadge = 'badge-info';
        if (finding.severity === 'Critical') sevBadge = 'badge-danger';
        else if (finding.severity === 'High') sevBadge = 'badge-danger';
        else if (finding.severity === 'Medium') sevBadge = 'badge-warning';

        var statusBadge = 'badge-neutral';
        if (finding.status === 'Open') statusBadge = 'badge-danger';
        else if (finding.status === 'In Progress') statusBadge = 'badge-warning';
        else if (finding.status === 'Resolved') statusBadge = 'badge-success';

        html += '<tr>' +
          '<td style="color: #e8ecf4; font-weight: 500; cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view compliance findings rationale">' + finding.id + '</td>' +
          '<td style="cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceScore\'" title="Click to view compliance score rationale">' + finding.framework + '</td>' +
          '<td style="font-size: 12px; max-width: 140px; cursor: pointer;" onclick="window.location.hash=\'#rationale/complianceFindings\'" title="Click to view control details">' + finding.control + '</td>' +
          '<td><span class="badge ' + sevBadge + '" style="cursor: pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceFindings\'" title="Click to view severity details">' + finding.severity + '</span></td>' +
          '<td style="font-size: 12px; max-width: 260px;">' + finding.description + '</td>' +
          '<td><span class="badge ' + statusBadge + '" style="cursor: pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/complianceFindings\'" title="Click to view status details">' + finding.status + '</span></td>' +
          '<td style="white-space: nowrap;">' + finding.dueDate + '</td>' +
        '</tr>';
      }

      html += '</tbody></table>';
    }

    html += '</div></div>';

    /* ── Executive Summary ────────────────────────────────── */
    html += '<div class="grid-2 animate-fade-in-up stagger-7">';

    html += '<div class="card">' +
      '<div class="card-header">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">🤖 AI-Generated Executive Summary</h3>' +
      '</div>' +
      '<div class="card-body">' +
        '<div style="line-height: 1.8; color: #a0a8c0; font-size: 13px;">' +
          '<p style="margin: 0;">' + audit.executiveSummary + '</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    /* ── Audit Timeline ──────────────────────────────────── */
    html += '<div class="card">' +
      '<div class="card-header">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">📋 Recent Audit Activity</h3>' +
      '</div>' +
      '<div class="card-body">';

    if (audit.timeline.length === 0) {
      html += '<p style="color: #7a85a0; text-align: center; padding: 20px 0; margin: 0;">No recent audit activity.</p>';
    } else {
      html += '<div class="timeline">';
      for (var t = 0; t < audit.timeline.length; t++) {
        var item = audit.timeline[t];
        html += '<div class="timeline-item">' +
            '<div class="timeline-dot ' + item.type + '"></div>' +
            '<div class="timeline-content">' +
              '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<strong style="color: #e8ecf4; font-size: 13px;">' + item.description + '</strong>' +
                '<span style="color: #4a5470; font-size: 11px;">' + item.time + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    html += '</div>' +
    '</div>';

    html += '</div>'; /* close grid-2 */

    /* ── Compliance Posture Chart + Findings by Severity ── */
    html += '<div class="grid-2 animate-fade-in-up stagger-8">';

    html += '<div class="chart-card">' +
      '<div class="chart-card-header">' +
        '<div>' +
          '<div class="chart-card-title">Compliance Trend</div>' +
          '<div class="chart-card-subtitle">12-month compliance score progression</div>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card-body">' +
        '<canvas id="audit-compliance-trend"></canvas>' +
      '</div>' +
    '</div>';

    html += '<div class="chart-card">' +
      '<div class="chart-card-header">' +
        '<div>' +
          '<div class="chart-card-title">Findings by Severity</div>' +
          '<div class="chart-card-subtitle">Distribution of open audit findings</div>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card-body">' +
        '<canvas id="audit-findings-severity"></canvas>' +
      '</div>' +
    '</div>';

    html += '</div>';

    html += '</div>'; /* close page-content */
    return html;
  },

  init: function () {
    var c = AETHER.charts;
    if (c) c.destroyAll();
    var d = AETHER.data;
    var totalAgents = d.getTotalAgentCount();

    if (totalAgents === 0) {
      console.log('[AETHER] Audit Center initialized (empty state)');
      return;
    }

    // ── Compliance Trend Chart ─────────────────────────────
    if (c && d && d.trends && d.trends.compliance) {
      c.createLineChart('audit-compliance-trend', d.months, [
        { label: 'Compliance Score', data: d.trends.compliance.data, color: '#10b981', fill: true },
        { label: 'Target', data: Array(12).fill(95), color: '#f59e0b', width: 1.5, dashed: true, points: false }
      ], { yFormat: function (v) { return v + '%'; } });
    }

    // ── Findings by Severity Chart ─────────────────────────
    if (c) {
      var audit = d.computeAudit();
      var findings = audit.findings;
      var critical = 0, high = 0, medium = 0, low = 0;
      for (var i = 0; i < findings.length; i++) {
        if (findings[i].severity === 'Critical') critical++;
        else if (findings[i].severity === 'High') high++;
        else if (findings[i].severity === 'Medium') medium++;
        else low++;
      }
      c.createDoughnutChart('audit-findings-severity',
        ['Critical', 'High', 'Medium', 'Low'],
        [critical, high, medium, low],
        ['#dc2626', '#ef4444', '#f59e0b', '#3b82f6']
      );
    }

    // ── Button Event Handlers ──────────────────────────────
    var runBtn = document.getElementById('audit-run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', function () {
        var originalText = runBtn.innerHTML;
        runBtn.disabled = true;
        runBtn.innerHTML = '\u23F3 Running LLM audit...';
        AETHER.runtime.runAgentAnalysis('audit', function (err, data) {
          runBtn.disabled = false;
          runBtn.innerHTML = originalText;
          if (err) {
            AETHER.app.showToast('Audit failed: ' + (err.message || err), 'error');
            return;
          }
          AETHER.app.showToast('Audit complete — ' + ((data && data.findings) ? data.findings.length : 0) + ' findings detected', 'success');
          // Refresh the page to show updated data
          window.location.hash = '#audit';
          if (AETHER.app && AETHER.app.navigate) {
            AETHER.app.navigate();
          }
        });
      });
    }

    var exportBtn = document.getElementById('audit-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportBtn.disabled = true;
        exportBtn.textContent = '\u23F3 Generating...';
        fetch('http://localhost:3000/api/results/audit')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          exportBtn.disabled = false;
          exportBtn.textContent = 'Export Report';
          if (data.error) {
            AETHER.app.showToast('No audit data. Run an audit first.', 'warning');
            return;
          }
          // Generate downloadable report
          var reportJSON = JSON.stringify(data, null, 2);
          var blob = new Blob([reportJSON], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'aether_audit_report_' + new Date().toISOString().slice(0, 10) + '.json';
          link.click();
          URL.revokeObjectURL(url);
          AETHER.app.showToast('Audit report downloaded!', 'success');
        })
        .catch(function () {
          exportBtn.disabled = false;
          exportBtn.textContent = 'Export Report';
          AETHER.app.showToast('Backend offline. Cannot export report.', 'error');
        });
      });
    }

    var viewBtns = document.querySelectorAll('.audit-view-report-btn');
    for (var v = 0; v < viewBtns.length; v++) {
      viewBtns[v].addEventListener('click', function () {
        this.disabled = true;
        this.textContent = '\u23F3 Loading...';
        var btn = this;
        fetch('http://localhost:3000/api/results/audit')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          btn.disabled = false;
          btn.textContent = 'View Report';
          if (data.error) {
            AETHER.app.showToast('No audit data available. Run an audit first.', 'warning');
            return;
          }
          _showReportModal(data);
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'View Report';
          AETHER.app.showToast('Backend offline. Cannot load report.', 'error');
        });
      });
    }

    console.log('[AETHER] Audit Center initialized');
  },

  /**
   * Show a rich report modal with LLM-generated audit content.
   */
  _showReportModal: _showReportModal
};

function _showReportModal(data) {
  // Remove any existing modal
  var old = document.getElementById('audit-report-modal');
  if (old) old.remove();

  var meta = data._meta || {};
  var findings = data.findings || [];
  var summary = data.executive_summary || 'No summary available.';
  var recs = data.recommendations || [];
  var overall = data.overall_compliance_score || data.overall_risk_score || 'N/A';

  var findingsHTML = '';
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    var sevColor = (f.severity === 'critical' || f.severity === 'Critical') ? '#ef4444' :
                   (f.severity === 'high' || f.severity === 'High') ? '#f59e0b' :
                   (f.severity === 'medium' || f.severity === 'Medium') ? '#3b82f6' : '#10b981';
    findingsHTML += '' +
      '<div style="border-left: 3px solid ' + sevColor + '; background: rgba(15,19,42,0.5); padding: 12px 16px; border-radius: 6px; margin-bottom: 8px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">' +
          '<strong style="color: #e8ecf4; font-size: 13px;">' + (f.agent || f.finding || 'Finding ' + (i + 1)) + '</strong>' +
          '<span style="background: ' + sevColor + '22; color: ' + sevColor + '; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">' + (f.severity || 'Medium') + '</span>' +
        '</div>' +
        '<div style="color: #7a85a0; font-size: 12px;">' + (f.description || f.issue || f.detail || JSON.stringify(f)) + '</div>' +
      '</div>';
  }
  if (findings.length === 0) {
    findingsHTML = '<p style="color: #10b981; text-align: center; padding: 16px 0;">\u2705 No findings \u2014 all agents compliant.</p>';
  }

  var recsHTML = '';
  for (var j = 0; j < recs.length; j++) {
    var rec = typeof recs[j] === 'string' ? recs[j] : (recs[j].recommendation || recs[j].description || JSON.stringify(recs[j]));
    recsHTML += '<div style="color: #e8ecf4; font-size: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #3b82f6; margin-right: 8px;">\u25B6</span>' + rec + '</div>';
  }

  var modalHTML = '' +
    '<div id="audit-report-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease;">' +
      '<div style="background: #0f1634; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 680px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 48px rgba(0,0,0,0.5);">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">' +
          '<div>' +
            '<h2 style="margin: 0; color: #e8ecf4; font-size: 18px;">\uD83D\uDCCB Audit Report</h2>' +
            '<div style="color: #7a85a0; font-size: 12px; margin-top: 4px;">Generated: ' + (meta.timestamp ? new Date(meta.timestamp).toLocaleString() : new Date().toLocaleString()) + ' \u2022 ' + (meta.agents_analyzed || 0) + ' agents analyzed \u2022 ' + (meta.elapsed_seconds || 0) + 's</div>' +
          '</div>' +
          '<button id="close-report-modal" style="background: none; border: none; color: #7a85a0; font-size: 20px; cursor: pointer; padding: 4px;">\u2715</button>' +
        '</div>' +
        '<div style="overflow-y: auto; padding: 24px; flex: 1;">' +
          '<div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 16px; margin-bottom: 20px;">' +
            '<div style="color: #3b82f6; font-size: 12px; font-weight: 600; margin-bottom: 6px;">EXECUTIVE SUMMARY</div>' +
            '<div style="color: #e8ecf4; font-size: 13px; line-height: 1.6;">' + summary + '</div>' +
          '</div>' +
          (typeof overall !== 'undefined' && overall !== 'N/A' ? '<div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 12px 24px;"><div style="font-size: 28px; font-weight: 700; color: #10b981;">' + overall + '</div><div style="font-size: 11px; color: #7a85a0;">Overall Score</div></div></div>' : '') +
          '<div style="margin-bottom: 20px;">' +
            '<div style="color: #e8ecf4; font-size: 14px; font-weight: 600; margin-bottom: 12px;">\uD83D\uDD0D Findings (' + findings.length + ')</div>' +
            findingsHTML +
          '</div>' +
          (recs.length > 0 ? '<div><div style="color: #e8ecf4; font-size: 14px; font-weight: 600; margin-bottom: 12px;">\uD83D\uDCA1 Recommendations (' + recs.length + ')</div>' + recsHTML + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('close-report-modal').addEventListener('click', function () {
    document.getElementById('audit-report-modal').remove();
  });
  document.getElementById('audit-report-modal').addEventListener('click', function (e) {
    if (e.target.id === 'audit-report-modal') {
      e.target.remove();
    }
  });
}
