/* ═══════════════════════════════════════════════════════════════
   AETHER Dashboard — Command Center
   Enterprise AI Workforce Platform
   The flagship page. First thing investors see.
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.dashboard = {
  render: function () {
    var d = AETHER.data;
    var k = d.computeKPIs();

    return '<div class="page-content">' +

      /* ── Page Header ──────────────────────────────────────── */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Command Center</h1>' +
          '<p class="page-subtitle">Real-time overview of your enterprise AI workforce</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-secondary" id="btn-run-all-agents">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M4 12V10M8 12V8M12 12V6"/>' +
              '<rect x="1" y="1" width="14" height="14" rx="2"/>' +
            '</svg>' +
            ' Run All Agents' +
          '</button>' +
          '<button class="btn btn-primary">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<line x1="8" y1="3" x2="8" y2="13"/>' +
              '<line x1="3" y1="8" x2="13" y2="8"/>' +
            '</svg>' +
            ' Add Agent' +
          '</button>' +
        '</div>' +
      '</div>' +

      /* ── Supervisory Agents Status Strip ─────────────────── */
      '<div class="animate-fade-in-up stagger-1" id="sa-strip-container">' +
        (AETHER.supervisorUI ? AETHER.supervisorUI.renderStatusStrip() : '') +
      '</div>' +

      /* ── Live Activity Feed ─────────────────────────────── */
      '<div class="charts-grid" style="margin-bottom: 20px;">' +
        '<div class="chart-card animate-fade-in-up stagger-2" style="grid-column: span 2;">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">⚡ Live Agent Activity</div>' +
              '<div class="chart-card-subtitle">Real-time events from supervisory agents</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body" id="dashboard-activity-feed" style="max-height: 200px; overflow-y: auto;">' +
            (k.totalAgents === 0
              ? '<div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:13px;">' +
                  '<div style="font-size:32px;margin-bottom:12px;">🤖</div>' +
                  '<div style="font-weight:600;color:var(--text-secondary);margin-bottom:4px;">No agents onboarded yet</div>' +
                  '<div>Click the <strong style="color:var(--accent-blue);">⊕</strong> button in the top bar to add your first agent</div>' +
                '</div>'
              : (AETHER.supervisorUI ? AETHER.supervisorUI.renderActivityFeed(8) : '')) +
          '</div>' +
        '</div>' +
      '</div>' +

      /* ── KPI Grid — 4x2 = 8 Cards ────────────────────────── */
      '<div class="kpi-grid">' +

        /* Card 1 — Total Agents */
        '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #3b82f6;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<circle cx="7" cy="7" r="3"/>' +
                '<path d="M1 17c0-3 3-5 6-5s6 2 6 5"/>' +
                '<circle cx="14" cy="6" r="2.5"/>' +
                '<path d="M15 12c2.5 0 4 1.5 4 4"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.totalAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? k.totalAgents + ' live' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatNumber(k.totalAgents) + '</div>' +
          '<div class="kpi-label">Total Agents</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-agents" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 2 — Discovery Coverage */
        '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #06b6d4;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<circle cx="10" cy="10" r="8"/>' +
                '<path d="M10 2a8 8 0 0 1 0 16"/>' +
                '<circle cx="10" cy="10" r="3"/>' +
                '<line x1="13" y1="10" x2="18" y2="10"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.totalAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? k.discoveryCoverage + '%' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.discoveryCoverage + '%</div>' +
          '<div class="kpi-label">Discovery Coverage</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-discovery" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 3 — Compliance Score */
        '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/complianceScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #10b981;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M10 1l2.5 5 5.5.8-4 3.9.9 5.3L10 13.5 5.1 16l.9-5.3-4-3.9 5.5-.8z"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.complianceAssessed ? 'up' : 'neutral') + '">' + (k.complianceAssessed ? k.complianceScore + '%' : 'Not Assessed') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (k.complianceAssessed ? k.complianceScore + '%' : 'N/A') + '</div>' +
          '<div class="kpi-label">Compliance Score</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-compliance" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 4 — Avg Reliability */
        '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/avgReliability\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #8b5cf6;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon purple">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M3 14l4-4 3 3 7-9"/>' +
                '<path d="M14 4h4v4"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.totalAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? k.availability + '%' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.avgReliability + '%</div>' +
          '<div class="kpi-label">Avg Reliability</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-reliability" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 5 — Monthly AI Spend */
        '<div class="kpi-card animate-fade-in-up stagger-5" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #f59e0b;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M10 1v18M6 5h6a3 3 0 0 1 0 6H5M6 11h7a3 3 0 0 1 0 6H5"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.totalAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? d.formatCurrency(k.monthlySpend) : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatCurrency(k.monthlySpend) + '</div>' +
          '<div class="kpi-label">Monthly AI Spend</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-spend" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 6 — AI Workforce ROI */
        '<div class="kpi-card animate-fade-in-up stagger-6" onclick="window.location.hash=\'#rationale/workforceROI\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #6366f1;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon indigo">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<rect x="2" y="9" width="4" height="8" rx="1"/>' +
                '<rect x="8" y="5" width="4" height="12" rx="1"/>' +
                '<rect x="14" y="2" width="4" height="15" rx="1"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.totalAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? k.workforceROI + '% ROI' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.workforceROI + '%</div>' +
          '<div class="kpi-label">AI Workforce ROI</div>' +
        '</div>' +

        /* Card 7 — High Risk Agents */
        '<div class="kpi-card animate-fade-in-up stagger-7" onclick="window.location.hash=\'#rationale/highRiskAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #ef4444;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M10 2L1 18h18L10 2z"/>' +
                '<line x1="10" y1="8" x2="10" y2="12"/>' +
                '<circle cx="10" cy="15" r="0.5" fill="currentColor"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend ' + (k.highRiskAgents > 0 ? 'up' : 'neutral') + '">' + (k.totalAgents > 0 ? k.highRiskAgents + ' flagged' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.highRiskAgents + '</div>' +
          '<div class="kpi-label">High Risk Agents</div>' +
          '<div class="kpi-sparkline"><canvas id="spark-risk" style="height: 32px;"></canvas></div>' +
        '</div>' +

        /* Card 8 — Policy Violations */
        '<div class="kpi-card animate-fade-in-up stagger-8" onclick="window.location.hash=\'#rationale/policyViolations\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-accent" style="background: #ec4899;"></div>' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon pink">' +
              '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<rect x="3" y="2" width="14" height="16" rx="2"/>' +
                '<path d="M7 7h6M7 10h6M7 13h4"/>' +
              '</svg>' +
            '</div>' +
            '<span class="kpi-trend neutral">↓ -2</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + k.policyViolations + '</div>' +
          '<div class="kpi-label">Policy Violations</div>' +
        '</div>' +

      '</div>' +

      /* ── Charts Grid — 2x2 ────────────────────────────────── */
      '<div class="charts-grid">' +

        /* Chart 1 — Agent Growth Trend */
        '<div class="chart-card animate-fade-in-up stagger-1">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Agent Growth Trend</div>' +
              '<div class="chart-card-subtitle">12-month agent workforce expansion</div>' +
            '</div>' +
            '<div class="chart-card-actions">' +
              '<span class="badge ' + (k.totalAgents > 0 ? 'badge-success' : 'badge-neutral') + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/totalAgents\'" title="Click to view total agents rationale">' + (k.totalAgents > 0 ? '+' + k.totalAgents + ' agents' : 'No data') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body">' +
            '<canvas id="chart-agent-growth" style="height: 280px;"></canvas>' +
          '</div>' +
        '</div>' +

        /* Chart 2 — AI Spend vs Budget */
        '<div class="chart-card animate-fade-in-up stagger-2">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">AI Spend vs Budget</div>' +
              '<div class="chart-card-subtitle">Monthly spend tracking against allocated budget</div>' +
            '</div>' +
            '<div class="chart-card-actions">' +
              '<span class="badge ' + (k.monthlySpend > 0 ? 'badge-info' : 'badge-neutral') + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/monthlySpend\'" title="Click to view spend rationale">' + (k.monthlySpend > 0 ? d.formatCurrency(k.monthlySpend) : 'No spend') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body">' +
            '<canvas id="chart-spend-budget" style="height: 280px;"></canvas>' +
          '</div>' +
        '</div>' +

        /* Chart 3 — Reliability Trend */
        '<div class="chart-card animate-fade-in-up stagger-3">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Reliability Trend</div>' +
              '<div class="chart-card-subtitle">Platform-wide uptime vs 99.0% SLA target</div>' +
            '</div>' +
            '<div class="chart-card-actions">' +
              '<span class="badge ' + (k.totalAgents > 0 ? (parseFloat(k.availability) >= 99 ? 'badge-success' : 'badge-warning') : 'badge-neutral') + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgReliability\'" title="Click to view reliability rationale">' + (k.totalAgents > 0 ? k.availability + '%' : 'No data') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body">' +
            '<canvas id="chart-reliability" style="height: 280px;"></canvas>' +
          '</div>' +
        '</div>' +

        /* Chart 4 — Risk Distribution */
        '<div class="chart-card animate-fade-in-up stagger-4">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Risk Distribution</div>' +
              '<div class="chart-card-subtitle">Agent risk classification breakdown</div>' +
            '</div>' +
            '<div class="chart-card-actions">' +
              '<span class="badge badge-warning" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view risk rationale">' + k.highRiskAgents + ' High Risk</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body">' +
            '<canvas id="chart-risk-dist" style="height: 280px;"></canvas>' +
          '</div>' +
        '</div>' +

      '</div>' +

      /* ── Full-width Platform Distribution ─────────────────── */
      '<div class="charts-grid full">' +
        '<div class="chart-card animate-fade-in-up stagger-5">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Platform Distribution</div>' +
              '<div class="chart-card-subtitle">Agent count by AI platform across the enterprise</div>' +
            '</div>' +
            '<div class="chart-card-actions">' +
              '<span class="badge badge-neutral" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view platform distribution rationale">' + d.computePlatformDistribution().labels.length + ' Platforms</span>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body">' +
            '<canvas id="chart-platform-dist" style="height: 220px;"></canvas>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* ── Alert Banner ─────────────────────────────────────── */
      '<div class="alert-banner ' + (k.totalAgents > 0 ? 'info' : 'success') + ' animate-fade-in-up stagger-6" style="cursor:pointer;" onclick="window.location.hash=\'' + (k.totalAgents > 0 ? '#rationale/totalAgents' : '#agents') + '\'" title="Click to view agent details">' +
        (k.totalAgents > 0
          ? '🔔 ' + k.totalAgents + ' agent' + (k.totalAgents !== 1 ? 's' : '') + ' registered — governance, compliance, and risk actively monitored'
          : '✅ AETHER is ready. Click ⊕ Add Agent to onboard your first AI workforce agent') +
      '</div>' +

    '</div>';
  },

  init: function () {
    var d = AETHER.data;
    var c = AETHER.charts;

    // Destroy any previously created charts
    c.destroyAll();

    /* ── Sparklines ─────────────────────────────────────────── */
    c.createSparkline('spark-agents', d.trends.agentGrowth.data, '#3b82f6');
    c.createSparkline('spark-discovery', d.trends.compliance.data, '#06b6d4');
    c.createSparkline('spark-compliance', d.trends.compliance.data, '#10b981');
    c.createSparkline('spark-reliability', d.trends.reliability.data, '#8b5cf6');
    c.createSparkline('spark-spend', d.trends.aiSpend.data, '#f59e0b');
    c.createSparkline('spark-risk', d.trends.riskTrend.data, '#ef4444');

    /* ── Chart 1 — Agent Growth (Area) ──────────────────────── */
    c.createAreaChart(
      'chart-agent-growth',
      d.trends.agentGrowth.labels,
      [{
        label: 'Active Agents',
        data: d.trends.agentGrowth.data,
        color: '#3b82f6',
        fill: true,
        points: false,
        width: 2.5
      }]
    );

    /* ── Chart 2 — AI Spend vs Budget (Combo Bar + Line) ───── */
    // We create the bar chart first, then add the budget line as an overlay
    // Using the chart factory with mixed type via createBarChart, then overlaying
    var spendCanvas = document.getElementById('chart-spend-budget');
    if (spendCanvas) {
      c.destroy('chart-spend-budget');
      var spendChart = new Chart(spendCanvas, {
        type: 'bar',
        data: {
          labels: d.trends.aiSpend.labels,
          datasets: [
            {
              type: 'bar',
              label: 'AI Spend ($M)',
              data: d.trends.aiSpend.data,
              backgroundColor: '#8b5cf6',
              borderColor: 'transparent',
              borderWidth: 0,
              borderRadius: 6,
              borderSkipped: false,
              maxBarThickness: 40,
              order: 2
            },
            {
              type: 'line',
              label: 'Budget ($M)',
              data: d.trends.aiSpend.budget,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              pointHoverRadius: 4,
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
                callback: function (v) { return '$' + v + 'M'; }
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
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                color: '#7a85a0',
                font: { size: 11 }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function (ctx) {
                  return ctx.dataset.label + ': $' + ctx.parsed.y + 'M';
                }
              }
            }
          },
          interaction: { mode: 'index', intersect: false }
        }
      });
    }

    /* ── Chart 3 — Reliability Trend (Line + SLA) ──────────── */
    c.createLineChart(
      'chart-reliability',
      d.trends.reliability.labels,
      [
        {
          label: 'Reliability',
          data: d.trends.reliability.data,
          color: '#10b981',
          fill: false,
          points: true,
          width: 2.5
        },
        {
          label: 'SLA Target (99.0%)',
          data: d.trends.reliability.sla,
          color: '#ef4444',
          fill: false,
          dashed: true,
          points: false,
          width: 1.5
        }
      ],
      {
        y: {
          min: 97.5,
          max: 100,
          ticks: {
            color: '#4a5470',
            font: { size: 10 },
            callback: function (v) { return v + '%'; }
          }
        },
        yFormat: function (v) { return v + '%'; }
      }
    );

    /* ── Chart 4 — Risk Distribution (Doughnut) ─────────────── */
    var riskDist = d.computeRiskDistribution();
    c.createDoughnutChart(
      'chart-risk-dist',
      riskDist.labels,
      riskDist.data,
      riskDist.colors,
      { legend: true, legendPosition: 'right' }
    );

    /* ── Chart 5 — Platform Distribution (Horizontal Bar) ──── */
    var platDist = d.computePlatformDistribution();
    c.createHorizontalBar(
      'chart-platform-dist',
      platDist.labels,
      platDist.data,
      platDist.colors
    );

    /* ── Supervisory Agent Auto-refresh ─────────────────────── */
    if (AETHER.supervisorUI) {
      AETHER.supervisorUI.initStatusStrip();
      AETHER.supervisorUI.initActivityFeed('dashboard-activity-feed', 8);
    }

    /* ── Add Agent button handler ───────────────────────────── */
    var addBtn = document.querySelector('.page-header-actions .btn-primary');
    if (addBtn && AETHER.app && AETHER.app.openOnboardModal) {
      addBtn.addEventListener('click', function () { AETHER.app.openOnboardModal(); });
    }

    /* ── Run All Agents button handler ─────────────────────── */
    var runAllBtn = document.getElementById('btn-run-all-agents');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', function () {
        if (!AETHER.runtime || !AETHER.runtime.runAllAgents) {
          AETHER.app.showToast('Backend not connected. Start the server with: python3 server.py', 'error');
          return;
        }
        var agentCount = (AETHER.data && AETHER.data.getTotalAgentCount) ? AETHER.data.getTotalAgentCount() : 0;
        if (agentCount === 0) {
          AETHER.app.showToast('No agents onboarded. Add an agent first, then run analysis.', 'warning');
          return;
        }
        runAllBtn.disabled = true;
        runAllBtn.textContent = '\u23F3 Running 6 AI agents...';
        AETHER.runtime.runAllAgents(function (err, data) {
          runAllBtn.disabled = false;
          runAllBtn.textContent = '\u2705 Run All Agents';
          if (err) {
            AETHER.app.showToast('Agent run failed: ' + err.message, 'error');
            return;
          }
          var types = Object.keys(data);
          AETHER.app.showToast('All ' + types.length + ' AI agents completed! Refreshing...', 'success');
          AETHER.app.navigateTo('dashboard');
        });
      });
    }
  }
};
