/* ═══════════════════════════════════════════════════════════════
   AETHER Agent Pages
   Discovery · Registry · Profile · Identity & Access
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};


/* ───────────────────────────────────────────────────────────────
   PAGE 1 — Agent Discovery
   ─────────────────────────────────────────────────────────────── */

AETHER.pages.discovery = {

  render: function () {
    var d = AETHER.data;
    var allAgents = d.getAllAgents();
    // Show newest (onboarded) first, render all for dynamic pagination
    var agents = allAgents.slice().reverse();

    /* --- platform / department options --- */
    var platformOpts = '<option>All Platforms</option>' +
      d.platforms.map(function (p) { return '<option>' + p.name + '</option>'; }).join('');
    var deptOpts = '<option>All Departments</option>' +
      d.departments.map(function (dp) { return '<option>' + dp + '</option>'; }).join('');

    /* --- table rows --- */
    var rows = agents.map(function (a) {
      var statusBadge = a.status === 'Active'
        ? '<span class="badge badge-success" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgReliability\'" title="Click to view availability rationale">Active</span>'
        : '<span class="badge badge-neutral" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgReliability\'" title="Click to view availability rationale">Inactive</span>';
      var riskBadge = a.riskLevel === 'Low'
        ? '<span class="badge badge-success" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · Low</span>'
        : a.riskLevel === 'Medium'
          ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · Medium</span>'
          : '<span class="badge badge-danger" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · ' + a.riskLevel + '</span>';
      var deboardBtn = a._isOnboarded
        ? '<button class="btn btn-sm btn-deboard" data-deboard-id="' + a.id + '" title="Remove this agent">Deboard</button>'
        : '';
      return '<tr data-agent-id="' + a.id + '">' +
        '<td><span class="table-agent-name" data-agent-id="' + a.id + '">' + a.name + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale"><span style="color:' + a.platformColor + '">\u25CF</span> ' + a.platform + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/activePolicies\'" title="Click to view active policies rationale">' + a.owner + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/totalIdentities\'" title="Click to view total identities rationale">' + a.department + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + riskBadge + '</td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale">' + a.lastSeen + '</span></td>' +
        '<td>' + deboardBtn + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Agent Discovery</h1>' +
          '<p class="page-subtitle">Automated discovery and inventory of all enterprise AI agents</p>' +
        '</div>' +
      '</div>' +

      /* Alert banner */
      '<div class="alert-banner success animate-fade-in-up stagger-1">' +
        '✅ Last scan completed ' + (function () {
          var sa = AETHER.config && AETHER.config.getSupervisoryAgent ? AETHER.config.getSupervisoryAgent('sa-discovery') : null;
          var lastRun = sa && sa.metrics && sa.metrics.lastRun;
          return (lastRun && AETHER.supervisorUI) ? AETHER.supervisorUI.relativeTime(lastRun) : 'just now';
        })() + ' — ' + d.getTotalAgentCount().toLocaleString() + ' agents discovered across ' + d.platforms.length + ' platforms' +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid kpi-grid-3 animate-fade-in-up stagger-2">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 6v4l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? d.computeKPIs().discoveryCoverage + '%' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.computeKPIs().discoveryCoverage + '%</div>' +
          '<div class="kpi-label">Discovery Coverage</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? d.computeKPIs().unknownAgents + ' found' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.computeKPIs().unknownAgents + '</div>' +
          '<div class="kpi-label">Unknown/Shadow Agents</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/><path d="M10 5v5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>' +
            '<span class="kpi-trend ' + (d.getTotalAgentCount() > 0 ? 'up' : 'neutral') + '">' + (d.getTotalAgentCount() > 0 ? 'active' : '—') + '</span>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.getTotalAgentCount().toLocaleString() + '</div>' +
          '<div class="kpi-label">Total Monitored Agents</div>' +
        '</div>' +

      '</div>' +

      /* Filter bar */
      '<div class="filter-bar animate-fade-in-up stagger-3">' +
        '<select class="filter-select" id="discovery-platform-filter">' + platformOpts + '</select>' +
        '<select class="filter-select" id="discovery-dept-filter">' + deptOpts + '</select>' +
        '<select class="filter-select" id="discovery-risk-filter">' +
          '<option>All Levels</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>' +
        '</select>' +
        '<div style="flex:1"></div>' +
        '<div class="topbar-search" style="margin:0;max-width:240px;background:var(--bg-card)">' +
          '<span class="topbar-search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>' +
          '<input type="text" placeholder="Filter endpoints..." id="discovery-search" style="padding-left:32px"/>' +
        '</div>' +
      '</div>' +

      /* Table wrapper and headers */
      '<div class="card animate-fade-in-up stagger-3" id="discovery-table-wrapper">' +
        '<div class="table-header">' +
          '<div class="table-title">Discovered Endpoints</div>' +
          '<div class="table-count">' + allAgents.length + ' agents</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table" id="discovery-table">' +
            '<thead><tr>' +
              '<th>Agent Name</th><th>Platform</th><th>Owner</th><th>Department</th><th>Status</th><th>Risk Score</th><th>Last Seen</th><th>Actions</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="table-footer">' +
          '<span>Showing 0–0 of 0 agents</span>' +
          '<div class="table-pagination"></div>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    /* Navigate on agent-name click */
    var names = document.querySelectorAll('#discovery-table .table-agent-name');
    names.forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.hash = '#profile/' + el.getAttribute('data-agent-id');
      });
    });

    /* Navigate on row click (but not on deboard button) */
    var trs = document.querySelectorAll('#discovery-table tbody tr');
    trs.forEach(function (tr) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-deboard')) return;
        window.location.hash = '#profile/' + tr.getAttribute('data-agent-id');
      });
    });

    /* Deboard button click handlers */
    var deboardBtns = document.querySelectorAll('#discovery-table .btn-deboard');
    deboardBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var agentId = btn.getAttribute('data-deboard-id');
        var agentName = btn.closest('tr').querySelector('.table-agent-name').textContent;

        if (!confirm('Deboard agent "' + agentName + '"? This will remove it from monitoring.')) return;

        btn.disabled = true;
        btn.textContent = 'Removing...';

        fetch('http://localhost:3000/api/agents/' + encodeURIComponent(agentId), { method: 'DELETE' })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            // Also remove from local config
            if (AETHER.config && AETHER.config.offboardAgent) {
              AETHER.config.offboardAgent(agentId);
            }
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast(agentName + ' has been deboarded', 'success');
            }
            // Re-render the page
            if (AETHER.app && AETHER.app.navigateTo) {
              AETHER.app.navigateTo('agents');
            }
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = 'Deboard';
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast('Failed to deboard: ' + err.message, 'error');
            }
          });
      });
    });

    /* Dynamic Pagination showPage */
    function showPage(pageNumber) {
      var rows = document.querySelectorAll('#discovery-table tbody tr');
      var visibleRows = [];
      rows.forEach(function (row) {
        if (row.getAttribute('data-filtered-out') !== 'true') {
          visibleRows.push(row);
        } else {
          row.style.display = 'none';
        }
      });

      var totalPages = Math.ceil(visibleRows.length / 20) || 1;
      if (pageNumber > totalPages) pageNumber = totalPages;
      if (pageNumber < 1) pageNumber = 1;

      var paginationContainer = document.querySelector('#discovery-table-wrapper .table-pagination');
      if (paginationContainer) {
        var html = '';
        for (var i = 1; i <= totalPages; i++) {
          var activeClass = i === pageNumber ? 'active' : '';
          html += '<button class="btn btn-ghost btn-sm ' + activeClass + '" data-page="' + i + '">' + i + '</button>';
        }
        paginationContainer.innerHTML = html;
        paginationContainer.querySelectorAll('button').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var p = parseInt(btn.getAttribute('data-page'));
            showPage(p);
          });
        });
      }

      var showingSpan = document.querySelector('#discovery-table-wrapper .table-footer > span');
      if (showingSpan) {
        var start = visibleRows.length > 0 ? (pageNumber - 1) * 20 + 1 : 0;
        var end = Math.min(pageNumber * 20, visibleRows.length);
        showingSpan.textContent = 'Showing ' + start + '–' + end + ' of ' + visibleRows.length.toLocaleString() + ' agents';
      }

      visibleRows.forEach(function (row, idx) {
        if (idx >= (pageNumber - 1) * 20 && idx < pageNumber * 20) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    /* Filter functionality */
    var platformFilter = document.getElementById('discovery-platform-filter');
    var deptFilter = document.getElementById('discovery-dept-filter');
    var riskFilter = document.getElementById('discovery-risk-filter');
    var searchInput = document.getElementById('discovery-search');

    function applyDiscoveryFilters() {
      var platform = platformFilter ? platformFilter.value : 'All Platforms';
      var dept = deptFilter ? deptFilter.value : 'All Departments';
      var risk = riskFilter ? riskFilter.value : 'All Levels';
      var search = searchInput ? searchInput.value.toLowerCase() : '';
      var rows = document.querySelectorAll('#discovery-table tbody tr');
      rows.forEach(function (row) {
        var cells = row.querySelectorAll('td');
        var rowText = row.textContent.toLowerCase();
        var show = true;
        if (platform !== 'All Platforms' && cells[1] && cells[1].textContent.indexOf(platform) === -1) show = false;
        if (dept !== 'All Departments' && cells[3] && cells[3].textContent.trim() !== dept) show = false;
        if (risk !== 'All Levels' && cells[5] && cells[5].textContent.indexOf(risk) === -1) show = false;
        if (search && rowText.indexOf(search) === -1) show = false;
        row.setAttribute('data-filtered-out', show ? 'false' : 'true');
      });
      showPage(1);
    }

    if (platformFilter) platformFilter.addEventListener('change', applyDiscoveryFilters);
    if (deptFilter) deptFilter.addEventListener('change', applyDiscoveryFilters);
    if (riskFilter) riskFilter.addEventListener('change', applyDiscoveryFilters);
    if (searchInput) searchInput.addEventListener('input', applyDiscoveryFilters);

    // Initial page load showPage(1)
    showPage(1);
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 2 — Agent Registry
   ─────────────────────────────────────────────────────────────── */

AETHER.pages.registry = {

  render: function () {
    var d = AETHER.data;
    var allAgents = d.getAllAgents();
    // Show newest (onboarded) first, render all for dynamic pagination
    var agents = allAgents.slice().reverse();
    var totalCount = allAgents.length;
    var kpis = d.computeKPIs();
    var certified = kpis.certifiedAgents;
    var pending = kpis.pendingCertification;

    /* --- filter options --- */
    var platformOpts = '<option>All Platforms</option>' +
      d.platforms.map(function (p) { return '<option>' + p.name + '</option>'; }).join('');
    var deptOpts = '<option>All Departments</option>' +
      d.departments.map(function (dp) { return '<option>' + dp + '</option>'; }).join('');

    /* --- table rows --- */
    var rows = agents.map(function (a) {
      var critBadge = a.criticality === 'Critical'
        ? '<span class="badge badge-danger" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Critical</span>'
        : a.criticality === 'High'
          ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">High</span>'
          : a.criticality === 'Medium'
            ? '<span class="badge badge-info" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Medium</span>'
            : '<span class="badge badge-neutral" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Low</span>';

      var riskBadge = a.riskLevel === 'Low'
        ? '<span class="badge badge-success" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · Low</span>'
        : a.riskLevel === 'Medium'
          ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · Medium</span>'
          : '<span class="badge badge-danger" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/avgRiskScore\'">' + a.riskScore + ' · ' + a.riskLevel + '</span>';

      var certBadge = a.certificationStatus === 'Certified'
        ? '<span class="badge badge-success" style="cursor:pointer;" onclick="event.stopPropagation(); AETHER.pages.registry.showCertificationDetails(\'' + a.id + '\')" title="Click to view certification details">Certified</span>'
        : '<span class="badge badge-warning" style="cursor:pointer;" onclick="event.stopPropagation(); AETHER.pages.registry.showCertificationDetails(\'' + a.id + '\')" title="Click to view pending certifications">Pending</span>';

      var regDeboardBtn = a._isOnboarded
        ? '<button class="btn btn-sm btn-deboard" data-deboard-id="' + a.id + '" title="Remove this agent">Deboard</button>'
        : '';
      return '<tr data-agent-id="' + a.id + '">' +
        '<td class="font-mono" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#profile/' + a.id + '\'" title="Click to view agent profile">' + a.id + '</td>' +
        '<td><span class="table-agent-name" data-agent-id="' + a.id + '">' + a.name + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/activePolicies\'" title="Click to view active policies rationale">' + a.owner + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/totalIdentities\'" title="Click to view total identities rationale">' + a.department + '</span></td>' +
        '<td><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale"><span style="color:' + a.platformColor + '">●</span> ' + a.platform + '</span></td>' +
        '<td>' + critBadge + '</td>' +
        '<td>' + riskBadge + '</td>' +
        '<td>' + certBadge + '</td>' +
        '<td class="tabular-nums"><span style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/totalAgents\'" title="Click to view total agents rationale">' + a.createdDate + '</span></td>' +
        '<td>' + regDeboardBtn + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Agent Registry</h1>' +
          '<p class="page-subtitle">System of record for all registered AI agents</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right:6px;vertical-align:-2px"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Register New Agent</button>' +
        '</div>' +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid animate-fade-in-up stagger-1">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + totalCount.toLocaleString() + '</div>' +
          '<div class="kpi-label">Registered Agents</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/certifiedAgents\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + certified.toLocaleString() + '</div>' +
          '<div class="kpi-label">Certified</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/pendingCertification\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + pending + '</div>' +
          '<div class="kpi-label">Pending Certification</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/avgRiskScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v4M10 14v4M2 10h4M14 10h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="2"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + (d.computeKPIs().avgRiskScore || 0) + '%</div>' +
          '<div class="kpi-label">Avg Risk Score</div>' +
        '</div>' +

      '</div>' +

      /* Filter bar */
      '<div class="filter-bar animate-fade-in-up stagger-2">' +
        '<select class="filter-select" id="registry-platform-filter">' + platformOpts + '</select>' +
        '<select class="filter-select" id="registry-dept-filter">' + deptOpts + '</select>' +
        '<select class="filter-select" id="registry-cert-filter">' +
          '<option>All Certifications</option><option>Certified</option><option>Pending</option>' +
        '</select>' +
        '<select class="filter-select" id="registry-crit-filter">' +
          '<option>All Criticalities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>' +
        '</select>' +
        '<input class="filter-search" id="registry-search" type="text" placeholder="Search agents..." />' +
      '</div>' +

      /* Table wrapper and headers */
      '<div class="card animate-fade-in-up stagger-3" id="registry-table-wrapper">' +
        '<div class="table-header">' +
          '<div class="table-title">Agent Registry</div>' +
          '<div class="table-count">' + totalCount.toLocaleString() + ' agents</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table" id="registry-table">' +
            '<thead><tr>' +
              '<th>Agent ID</th><th>Agent Name</th><th>Owner</th><th>Department</th><th>Platform</th><th>Criticality</th><th>Risk Rating</th><th>Certification</th><th>Created</th><th>Actions</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="table-footer">' +
          '<span>Showing 0–0 of 0 agents</span>' +
          '<div class="table-pagination"></div>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    /* Navigate on agent-name click */
    var names = document.querySelectorAll('#registry-table .table-agent-name');
    names.forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.hash = '#profile/' + el.getAttribute('data-agent-id');
      });
    });

    /* Navigate on row click (but not on deboard button) */
    var trs = document.querySelectorAll('#registry-table tbody tr');
    trs.forEach(function (tr) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-deboard')) return;
        window.location.hash = '#profile/' + tr.getAttribute('data-agent-id');
      });
    });

    /* Deboard button click handlers for registry */
    var regDeboardBtns = document.querySelectorAll('#registry-table .btn-deboard');
    regDeboardBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var agentId = btn.getAttribute('data-deboard-id');
        var agentName = btn.closest('tr').querySelector('.table-agent-name').textContent;

        if (!confirm('Deboard agent "' + agentName + '"? This will remove it from monitoring.')) return;

        btn.disabled = true;
        btn.textContent = 'Removing...';

        fetch('http://localhost:3000/api/agents/' + encodeURIComponent(agentId), { method: 'DELETE' })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (AETHER.config && AETHER.config.offboardAgent) {
              AETHER.config.offboardAgent(agentId);
            }
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast(agentName + ' has been deboarded', 'success');
            }
            if (AETHER.app && AETHER.app.navigateTo) {
              AETHER.app.navigateTo('registry');
            }
          })
          .catch(function (err) {
            // Fallback: remove locally even if server is offline
            if (AETHER.config && AETHER.config.offboardAgent) {
              AETHER.config.offboardAgent(agentId);
            }
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast(agentName + ' has been deboarded', 'success');
            }
            if (AETHER.app && AETHER.app.navigateTo) {
              AETHER.app.navigateTo('registry');
            }
          });
      });
    });

    /* Wire Register New Agent button */
    var registerBtn = document.querySelector('.page-header-actions .btn-primary');
    if (registerBtn && AETHER.app && AETHER.app.openOnboardModal) {
      registerBtn.addEventListener('click', function () {
        AETHER.app.openOnboardModal();
      });
    }

    /* Dynamic Pagination showPage */
    function showPage(pageNumber) {
      var rows = document.querySelectorAll('#registry-table tbody tr');
      var visibleRows = [];
      rows.forEach(function (row) {
        if (row.getAttribute('data-filtered-out') !== 'true') {
          visibleRows.push(row);
        } else {
          row.style.display = 'none';
        }
      });

      var totalPages = Math.ceil(visibleRows.length / 20) || 1;
      if (pageNumber > totalPages) pageNumber = totalPages;
      if (pageNumber < 1) pageNumber = 1;

      var paginationContainer = document.querySelector('#registry-table-wrapper .table-pagination');
      if (paginationContainer) {
        var html = '';
        for (var i = 1; i <= totalPages; i++) {
          var activeClass = i === pageNumber ? 'active' : '';
          html += '<button class="btn btn-ghost btn-sm ' + activeClass + '" data-page="' + i + '">' + i + '</button>';
        }
        paginationContainer.innerHTML = html;
        paginationContainer.querySelectorAll('button').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var p = parseInt(btn.getAttribute('data-page'));
            showPage(p);
          });
        });
      }

      var showingSpan = document.querySelector('#registry-table-wrapper .table-footer > span');
      if (showingSpan) {
        var start = visibleRows.length > 0 ? (pageNumber - 1) * 20 + 1 : 0;
        var end = Math.min(pageNumber * 20, visibleRows.length);
        showingSpan.textContent = 'Showing ' + start + '–' + end + ' of ' + visibleRows.length.toLocaleString() + ' agents';
      }

      visibleRows.forEach(function (row, idx) {
        if (idx >= (pageNumber - 1) * 20 && idx < pageNumber * 20) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    /* Filter functionality */
    var platformFilter = document.getElementById('registry-platform-filter');
    var deptFilter = document.getElementById('registry-dept-filter');
    var certFilter = document.getElementById('registry-cert-filter');
    var critFilter = document.getElementById('registry-crit-filter');
    var searchInput = document.getElementById('registry-search');

    function applyRegistryFilters() {
      var platform = platformFilter ? platformFilter.value : 'All Platforms';
      var dept = deptFilter ? deptFilter.value : 'All Departments';
      var cert = certFilter ? certFilter.value : 'All Certifications';
      var crit = critFilter ? critFilter.value : 'All Criticalities';
      var search = searchInput ? searchInput.value.toLowerCase() : '';
      var rows = document.querySelectorAll('#registry-table tbody tr');
      rows.forEach(function (row) {
        var cells = row.querySelectorAll('td');
        var rowText = row.textContent.toLowerCase();
        var show = true;
        if (platform !== 'All Platforms' && cells[4] && cells[4].textContent.indexOf(platform) === -1) show = false;
        if (dept !== 'All Departments' && cells[3] && cells[3].textContent.trim() !== dept) show = false;
        if (cert !== 'All Certifications' && cells[7] && cells[7].textContent.indexOf(cert) === -1) show = false;
        if (crit !== 'All Criticalities' && cells[5] && cells[5].textContent.indexOf(crit) === -1) show = false;
        if (search && rowText.indexOf(search) === -1) show = false;
        row.setAttribute('data-filtered-out', show ? 'false' : 'true');
      });
      showPage(1);
    }

    if (platformFilter) platformFilter.addEventListener('change', applyRegistryFilters);
    if (deptFilter) deptFilter.addEventListener('change', applyRegistryFilters);
    if (certFilter) certFilter.addEventListener('change', applyRegistryFilters);
    if (critFilter) critFilter.addEventListener('change', applyRegistryFilters);
    if (searchInput) searchInput.addEventListener('input', applyRegistryFilters);

    // Initial page load showPage(1)
    showPage(1);
  },
  showCertificationDetails: function (agentId) {
    var d = AETHER.data;
    var agent = d.getAgent(agentId);
    if (!agent) return;

    // Retrieve compliance info if exists
    var compResults = (AETHER.runtime && AETHER.runtime.getResults) ? AETHER.runtime.getResults('compliance') : null;
    var agentComp = null;
    if (compResults && compResults.agent_results) {
      agentComp = compResults.agent_results.find(function(ca) {
        return ca.agent_id === agentId || ca.agent_name === agent.name;
      });
    }

    var frameworks = [
      { name: 'SOC 2', desc: 'Trust Services Criteria (Security, Confidentiality)' },
      { name: 'ISO 27001', desc: 'Information Security Management System controls' },
      { name: 'GDPR', desc: 'EU General Data Privacy Regulation controls' },
      { name: 'SOX', desc: 'Sarbanes-Oxley Act financial audit guardrails' },
      { name: 'HIPAA', desc: 'Health Insurance Portability and Accountability Act controls' }
    ];

    var html = '<div class="modal-backdrop" id="cert-details-modal-backdrop" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;">' +
      '<div class="modal" style="background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-lg);width:500px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);overflow:hidden;">' +
        '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-primary);">' +
          '<div class="modal-title" style="font-size:15px;font-weight:700;color:var(--text-primary);">🎓 Certification Details: ' + agent.name + '</div>' +
          '<button class="modal-close" onclick="document.getElementById(\'cert-details-modal-backdrop\').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:16px;">✕</button>' +
        '</div>' +
        '<div class="modal-body" style="padding:20px;">' +
          '<div style="margin-bottom:16px;font-size:12px;color:var(--text-secondary);line-height:1.5;">' +
            'This panel details the certification status of <strong>' + agent.name + '</strong> across all enterprise compliance frameworks.' +
          '</div>';

    frameworks.forEach(function(fw) {
      var score = -1;
      var status = 'Pending';
      var statusClass = 'badge-warning';

      if (agentComp && agentComp.frameworks) {
        var foundFw = agentComp.frameworks.find(function(f) { return f.name === fw.name; });
        if (foundFw) {
          score = foundFw.score;
          status = score >= 80 ? 'Passed' : 'Failed';
          statusClass = score >= 80 ? 'badge-success' : 'badge-danger';
        }
      } else {
        if (agent.certificationStatus === 'Certified') {
          status = 'Passed';
          statusClass = 'badge-success';
          score = 95;
        }
      }

      var scoreText = score >= 0 ? score + '%' : 'Not Assessed';
      
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:600;color:var(--text-primary);">' + fw.name + '</div>' +
          '<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">' + fw.desc + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--text-secondary);" class="tabular-nums">' + scoreText + '</span>' +
          '<span class="badge ' + statusClass + '">' + status + '</span>' +
        '</div>' +
      '</div>';
    });

    html += '</div>' +
        '<div class="modal-footer" style="padding:16px 20px;border-top:1px solid var(--border-primary);display:flex;justify-content:flex-end;gap:12px;background:rgba(0,0,0,0.2);">' +
          '<button class="btn btn-secondary" onclick="document.getElementById(\'cert-details-modal-backdrop\').remove()">Close</button>' +
          (agent.certificationStatus !== 'Certified' ? '<button class="btn btn-primary" onclick="document.getElementById(\'cert-details-modal-backdrop\').remove(); window.location.hash=\'#compliance\'">Run Compliance Audit</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 3 — Agent Profile
   ─────────────────────────────────────────────────────────────── */

AETHER.pages.profile = {

  render: function () {
    var d = AETHER.data;

    /* Resolve agent from hash */
    var hashParts = window.location.hash.split('/');
    var agentId = hashParts.length > 1 ? hashParts[1] : 'AGT-0001';
    var agent = d.getAgent(agentId) || d.getAgent('AGT-0001');

    /* Status / risk / cert badges */
    var statusBadge = agent.status === 'Active'
      ? '<span class="badge badge-success" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgReliability\'" title="Click to view reliability rationale">Active</span>'
      : '<span class="badge badge-neutral" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgReliability\'" title="Click to view reliability rationale">Inactive</span>';

    var riskBadge = agent.riskLevel === 'Low'
      ? '<span class="badge badge-success" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgRiskScore\'" title="Click to view risk rationale">' + agent.riskLevel + '</span>'
      : agent.riskLevel === 'Medium'
        ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgRiskScore\'" title="Click to view risk rationale">' + agent.riskLevel + '</span>'
        : '<span class="badge badge-danger" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgRiskScore\'" title="Click to view risk rationale">' + agent.riskLevel + '</span>';

    var certBadge = agent.certificationStatus === 'Certified'
      ? '<span class="badge badge-success" style="cursor:pointer;" onclick="AETHER.pages.registry.showCertificationDetails(\'' + agent.id + '\')" title="Click to view certification details">Certified</span>'
      : '<span class="badge badge-warning" style="cursor:pointer;" onclick="AETHER.pages.registry.showCertificationDetails(\'' + agent.id + '\')" title="Click to view pending certifications">Pending</span>';

    /* Risk score color */
    var riskIconColor = agent.riskLevel === 'Low' ? 'green'
      : agent.riskLevel === 'Medium' ? 'yellow'
      : 'red';

    /* Avatar initials */
    var initials = agent.name.split(' ').slice(0, 2).map(function (w) { return w.charAt(0); }).join('');

    /* Connected systems */
    var exampleSystems = ['SAP ERP', 'Salesforce CRM', 'Snowflake DW', 'ServiceNow', 'Workday HCM', 'Jira', 'Confluence', 'Slack'];
    var connectedSystemRows = exampleSystems.slice(0, Math.min(agent.connectedSystems, exampleSystems.length)).map(function (sys, i) {
      var icons = ['🏢', '☁️', '❄️', '🎫', '👥', '📋', '📝', '💬'];
      return '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale"><span class="metric-row-label">' + icons[i] + ' ' + sys + '</span><span class="metric-row-value"><span class="badge badge-success">Connected</span></span></div>';
    }).join('');

    /* Policies table (first 3) */
    var policies = d.policies.slice(0, 3);
    var policyRows = policies.map(function (p) {
      return '<tr>' +
        '<td class="font-mono" style="cursor:pointer;text-decoration:underline;" onclick="window.location.hash=\'#rationale/activePolicies\'" title="Click to view active policies rationale">' + p.id + '</td>' +
        '<td>' + p.name + '</td>' +
        '<td><code class="font-mono" style="font-size:11px;color:#7a85a0">' + p.condition + '</code></td>' +
        '<td><span class="badge badge-' + p.actionType + '">' + p.action + '</span></td>' +
        '<td><span class="badge badge-success">' + p.status + '</span></td>' +
        '<td class="tabular-nums" style="cursor:pointer;font-weight:600;color:var(--color-danger);" onclick="window.location.hash=\'#rationale/policyViolations\'" title="Click to view policy violations rationale">' + p.violations + '</td>' +
        '</tr>';
    }).join('');

    /* Audit trail */
    var auditEntries = [
      { ts: '2026-06-13 19:32', event: 'Task Batch Completed', user: 'System', details: 'Executed 245 tasks — 243 succeeded, 2 retried' },
      { ts: '2026-06-12 14:08', event: 'Access Token Rotated', user: 'IAM Service', details: 'OAuth 2.0 credential rotated per 90-day policy' },
      { ts: '2026-06-10 09:15', event: 'Governance Review Passed', user: agent.owner, details: 'Quarterly governance attestation approved' },
      { ts: '2026-06-08 11:42', event: 'Configuration Updated', user: agent.owner, details: 'Token usage threshold raised from 2M to 3M' },
      { ts: '2026-06-05 16:30', event: 'Risk Score Recalculated', user: 'Risk Engine', details: 'Score updated from ' + Math.max(agent.riskScore - 5, 0) + ' to ' + agent.riskScore }
    ];
    var auditRows = auditEntries.map(function (e) {
      return '<tr>' +
        '<td class="tabular-nums font-mono" style="white-space:nowrap">' + e.ts + '</td>' +
        '<td>' + e.event + '</td>' +
        '<td>' + e.user + '</td>' +
        '<td style="color:#7a85a0;font-size:12px">' + e.details + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Profile hero */
      '<div class="profile-hero animate-fade-in-up">' +
        '<div style="display:flex;align-items:center;gap:24px;flex:1">' +
          '<div class="profile-avatar" style="background:linear-gradient(135deg,' + agent.platformColor + ',' + agent.platformColor + '88);font-size:24px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:16px;flex-shrink:0">' + initials + '</div>' +
          '<div class="profile-info">' +
            '<h1 class="profile-name">' + agent.name + '</h1>' +
            '<div class="profile-meta">' +
              '<span class="profile-meta-item"><span style="color:' + agent.platformColor + '">●</span> ' + agent.platform + '</span>' +
              '<span class="profile-meta-item">👤 ' + agent.owner + '</span>' +
              '<span class="profile-meta-item">🏢 ' + agent.department + '</span>' +
              '<span class="profile-meta-item">📅 Created ' + agent.createdDate + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0">' +
          statusBadge + riskBadge + certBadge +
          (agent._isOnboarded
            ? '<button class="btn btn-sm btn-deboard btn-deboard-profile" id="profile-deboard-btn" data-deboard-id="' + agent.id + '" data-deboard-name="' + agent.name + '" title="Remove this agent from AETHER">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-2px">' +
                  '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
                '</svg>' +
                'Remove Agent' +
              '</button>'
            : '') +
        '</div>' +
      '</div>' +

      /* KPI Grid */
      '<div class="kpi-grid animate-fade-in-up stagger-1">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/avgRiskScore\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon ' + riskIconColor + '"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l7 12H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v3M10 13.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + agent.riskScore + '</div>' +
          '<div class="kpi-label">Risk Score</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/monthlySpend\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 2 7-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatCurrency(agent.monthlyCost) + '</div>' +
          '<div class="kpi-label">Monthly Cost</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/workforceROI\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2"/><path d="M7 10h6M10 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + d.formatNumber(agent.tasksExecuted) + '</div>' +
          '<div class="kpi-label">Tasks Executed</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/successRate\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon cyan"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + agent.successRate + '%</div>' +
          '<div class="kpi-label">Success Rate</div>' +
        '</div>' +

      '</div>' +

      /* Tabs */
      '<div class="tabs animate-fade-in-up stagger-2">' +
        '<div class="tab-item active" data-tab="overview">Overview</div>' +
        '<div class="tab-item" data-tab="activity">Activity</div>' +
        '<div class="tab-item" data-tab="systems">Connected Systems</div>' +
        '<div class="tab-item" data-tab="governance">Governance</div>' +
        '<div class="tab-item" data-tab="audit">Audit Trail</div>' +
      '</div>' +

      /* Overview — grid-2 */
      '<div class="grid-2 animate-fade-in-up stagger-3 profile-tab-content" id="tab-overview">' +

        /* Left: Agent Details */
        '<div class="card">' +
          '<div class="card-header"><div class="card-title">Agent Details</div></div>' +
          '<div class="card-body">' +
            '<div class="metric-row"><span class="metric-row-label">Agent ID</span><span class="metric-row-value font-mono">' + agent.id + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Purpose</span><span class="metric-row-value" style="font-size:12px;color:#7a85a0;text-align:right;max-width:260px">' + agent.purpose + '</span></div>' +
            '<div class="metric-row"><span class="metric-row-label">Criticality</span><span class="metric-row-value">' +
              (agent.criticality === 'Critical' ? '<span class="badge badge-danger" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Critical</span>' :
               agent.criticality === 'High' ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">High</span>' :
               agent.criticality === 'Medium' ? '<span class="badge badge-info" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Medium</span>' :
               '<span class="badge badge-neutral" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/highRiskAgents\'" title="Click to view high-risk agent rationale">Low</span>') +
            '</span></div>' +
            '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/availability\'" title="Click to view availability rationale"><span class="metric-row-label">Availability</span><span class="metric-row-value tabular-nums">' + agent.availability + '%</span></div>' +
            '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/avgLatency\'" title="Click to view average latency rationale"><span class="metric-row-label">Avg Latency</span><span class="metric-row-value tabular-nums">' + agent.avgLatency + ' ms</span></div>' +
            '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/tokenSpend\'" title="Click to view token spend rationale"><span class="metric-row-label">Token Usage</span><span class="metric-row-value tabular-nums">' + d.formatNumber(agent.tokenUsage) + '</span></div>' +
            '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/piiExposure\'" title="Click to view PII exposure rationale"><span class="metric-row-label">PII Access</span><span class="metric-row-value">' + (agent.piiAccess ? '<span class="badge badge-danger">Yes</span>' : '<span class="badge badge-neutral">No</span>') + '</span></div>' +
            '<div class="metric-row" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/financialAccess\'" title="Click to view financial access rationale"><span class="metric-row-label">Financial Access</span><span class="metric-row-value">' + (agent.financialAccess ? '<span class="badge badge-warning">Yes</span>' : '<span class="badge badge-neutral">No</span>') + '</span></div>' +
          '</div>' +
        '</div>' +

        /* Right: Connected Systems */
        '<div class="card">' +
          '<div class="card-header"><div class="card-title">Connected Systems</div><span class="badge badge-info">' + agent.connectedSystems + ' systems</span></div>' +
          '<div class="card-body">' +
            connectedSystemRows +
          '</div>' +
        '</div>' +

      '</div>' +

      /* Recent Activity Timeline */
      '<div class="card animate-fade-in-up stagger-4 profile-tab-content" id="tab-activity" style="display:none">' +
        '<div class="card-header"><div class="card-title">Recent Activity</div></div>' +
        '<div class="card-body">' +
          '<div class="timeline">' +
            '<div class="timeline-item">' +
              '<div class="timeline-dot green"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-title">Task batch completed successfully</div>' +
                '<div class="timeline-desc">245 tasks executed — 99.2% success rate</div>' +
                '<div class="timeline-time">2h ago</div>' +
              '</div>' +
            '</div>' +
            '<div class="timeline-item">' +
              '<div class="timeline-dot blue"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-title">Access token rotated</div>' +
                '<div class="timeline-desc">OAuth 2.0 credential automatically renewed</div>' +
                '<div class="timeline-time">1d ago</div>' +
              '</div>' +
            '</div>' +
            '<div class="timeline-item">' +
              '<div class="timeline-dot blue"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-title">Governance policy reviewed</div>' +
                '<div class="timeline-desc">Quarterly attestation by ' + agent.owner + '</div>' +
                '<div class="timeline-time">3d ago</div>' +
              '</div>' +
            '</div>' +
            '<div class="timeline-item">' +
              '<div class="timeline-dot green"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-title">Performance benchmark passed</div>' +
                '<div class="timeline-desc">All SLA thresholds met — latency p99 within target</div>' +
                '<div class="timeline-time">5d ago</div>' +
              '</div>' +
            '</div>' +
            '<div class="timeline-item">' +
              '<div class="timeline-dot blue"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-title">Monthly cost report generated</div>' +
                '<div class="timeline-desc">Total spend: ' + d.formatCurrency(agent.monthlyCost) + ' — within budget</div>' +
                '<div class="timeline-time">7d ago</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* Governance Policies */
      '<div class="table-container animate-fade-in-up stagger-5 profile-tab-content" id="tab-governance" style="display:none">' +
        '<div class="table-header">' +
          '<div class="table-title">Governance Policies</div>' +
          '<div class="table-count">' + policies.length + ' policies applied</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>Policy ID</th><th>Name</th><th>Condition</th><th>Action</th><th>Status</th><th>Violations</th>' +
            '</tr></thead>' +
            '<tbody>' + policyRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* Audit Trail */
      '<div class="table-container animate-fade-in-up stagger-6 profile-tab-content" id="tab-audit" style="display:none">' +
        '<div class="table-header">' +
          '<div class="table-title">Audit Trail</div>' +
          '<div class="table-count">Last 5 events</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>Timestamp</th><th>Event</th><th>User</th><th>Details</th>' +
            '</tr></thead>' +
            '<tbody>' + auditRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

    '</div>';
  },

  init: function () {
    /* Tab switching */
    var tabItems = document.querySelectorAll('.tabs .tab-item');
    tabItems.forEach(function (tab) {
      tab.addEventListener('click', function () {
        /* Remove active from all tabs */
        tabItems.forEach(function (t) { t.classList.remove('active'); });
        /* Add active to clicked tab */
        tab.classList.add('active');
        /* Hide all tab content */
        var allContent = document.querySelectorAll('.profile-tab-content');
        allContent.forEach(function (section) { section.style.display = 'none'; });
        /* Show the matching tab content */
        var tabName = tab.getAttribute('data-tab');
        /* Connected Systems lives inside the overview grid */
        if (tabName === 'systems') tabName = 'overview';
        var target = document.getElementById('tab-' + tabName);
        if (target) target.style.display = '';
      });
    });

    /* Profile Deboard / Remove Agent button */
    var profileDeboardBtn = document.getElementById('profile-deboard-btn');
    if (profileDeboardBtn) {
      profileDeboardBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var agentId = profileDeboardBtn.getAttribute('data-deboard-id');
        var agentName = profileDeboardBtn.getAttribute('data-deboard-name');

        if (!confirm('Remove agent "' + agentName + '" from AETHER? This will stop all monitoring and governance for this agent.')) return;

        profileDeboardBtn.disabled = true;
        profileDeboardBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:-2px;animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="30" stroke-dashoffset="10"/></svg>Removing...';

        fetch('http://localhost:3000/api/agents/' + encodeURIComponent(agentId), { method: 'DELETE' })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (AETHER.config && AETHER.config.offboardAgent) {
              AETHER.config.offboardAgent(agentId);
            }
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast('Agent "' + agentName + '" has been removed from AETHER', 'success');
            }
            if (AETHER.app && AETHER.app.navigateTo) {
              AETHER.app.navigateTo('registry');
            }
          })
          .catch(function (err) {
            // Fallback: remove locally even if server is offline
            if (AETHER.config && AETHER.config.offboardAgent) {
              AETHER.config.offboardAgent(agentId);
            }
            if (AETHER.app && AETHER.app.showToast) {
              AETHER.app.showToast('Agent "' + agentName + '" has been removed from AETHER', 'success');
            }
            if (AETHER.app && AETHER.app.navigateTo) {
              AETHER.app.navigateTo('registry');
            }
          });
      });
    }
  }
};


/* ───────────────────────────────────────────────────────────────
   PAGE 4 — Identity & Access
   ─────────────────────────────────────────────────────────────── */

AETHER.pages.identity = {

  render: function () {
    var d = AETHER.data;
    var idData = d.computeIdentity();
    var summary = idData.summary;
    var creds = idData.credentials;

    /* --- credential rows --- */
    var credRows = creds.map(function (c) {
      var statusBadge;
      if (c.status === 'Active') {
        statusBadge = '<span class="badge badge-success" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/activeCredentials\'" title="Click to view rationale">Active</span>';
      } else if (c.status === 'Rotation Due') {
        statusBadge = '<span class="badge badge-warning" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/pendingRotation\'" title="Click to view rationale">Rotation Due</span>';
      } else if (c.status === 'Expiring') {
        statusBadge = '<span class="badge badge-danger" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/expiringSoon\'" title="Click to view rationale">Expiring</span>';
      } else if (c.status === 'Revoked') {
        statusBadge = '<span class="badge badge-danger" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/revokedThisMonth\'" title="Click to view rationale">Revoked</span>';
      } else {
        statusBadge = '<span class="badge badge-neutral" style="cursor:pointer;" onclick="event.stopPropagation(); window.location.hash=\'#rationale/activeCredentials\'" title="Click to view rationale">' + c.status + '</span>';
      }

      return '<tr>' +
        '<td class="font-mono" style="cursor:pointer;" onclick="window.location.hash=\'#profile/' + c.agentId + '\'" title="Click to view agent profile">' + c.agentId + '</td>' +
        '<td style="cursor:pointer;" onclick="window.location.hash=\'#profile/' + c.agentId + '\'" title="Click to view agent profile">' + c.agent + '</td>' +
        '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/activeCredentials\'" title="Click to view credential details">' + c.type + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="tabular-nums" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/pendingRotation\'" title="Click to view rotation details">' + c.lastRotated + '</td>' +
        '<td class="tabular-nums" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/expiringSoon\'" title="Click to view expiration details">' + c.expiresIn + '</td>' +
        '<td style="cursor:pointer;" onclick="window.location.hash=\'#rationale/activeCredentials\'" title="Click to view credential scope details">' + c.scope + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="page-content">' +

      /* Header */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title">Identity & Access</h1>' +
          '<p class="page-subtitle">Agent identity lifecycle, credentials, and access management</p>' +
        '</div>' +
      '</div>' +

      /* KPI Grid — 5 cols */
      '<div class="kpi-grid kpi-grid-5 animate-fade-in-up stagger-1">' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/totalIdentities\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon blue"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + summary.totalIdentities.toLocaleString() + '</div>' +
          '<div class="kpi-label">Total Identities</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/activeCredentials\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon green"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 8V5a3 3 0 016 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + summary.activeCredentials.toLocaleString() + '</div>' +
          '<div class="kpi-label">Active Credentials</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/pendingRotation\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon yellow"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 110 16 8 8 0 010-16z" stroke="currentColor" stroke-width="2"/><path d="M10 6v4l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + summary.pendingRotation + '</div>' +
          '<div class="kpi-label">Pending Rotation</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/expiringSoon\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon red"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l7 12H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v3M10 13.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + summary.expiringSoon + '</div>' +
          '<div class="kpi-label">Expiring Soon</div>' +
        '</div>' +

        '<div class="kpi-card" onclick="window.location.hash=\'#rationale/revokedThisMonth\'" style="cursor: pointer;" title="Click to view rationale">' +
          '<div class="kpi-card-header">' +
            '<div class="kpi-card-icon purple"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>' +
          '</div>' +
          '<div class="kpi-value tabular-nums">' + summary.revokedThisMonth + '</div>' +
          '<div class="kpi-label">Revoked This Month</div>' +
        '</div>' +

      '</div>' +

      /* Alert banner — only shown when there's something real to warn about */
      (summary.expiringSoon > 0 || summary.pendingRotation > 0 ?
        '<div class="alert-banner warning animate-fade-in-up stagger-2">' +
          '⚠️ ' + summary.expiringSoon + ' credential' + (summary.expiringSoon === 1 ? '' : 's') + ' expiring within 30 days' +
          (summary.pendingRotation > 0 ? ', ' + summary.pendingRotation + ' overdue for rotation' : '') +
          ' — immediate rotation recommended' +
        '</div>' : '') +

      /* Credentials table */
      '<div class="table-container animate-fade-in-up stagger-3">' +
        '<div class="table-header">' +
          '<div class="table-title">Credential Inventory</div>' +
          '<div class="table-count">' + creds.length + ' credentials</div>' +
        '</div>' +
        '<div class="table-scroll">' +
          '<table class="data-table" id="identity-table">' +
            '<thead><tr>' +
              '<th>Agent ID</th><th>Agent Name</th><th>Credential Type</th><th>Status</th><th>Last Rotated</th><th>Expires In</th><th>Scope</th>' +
            '</tr></thead>' +
            '<tbody>' + credRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      /* Charts */
      '<div class="charts-grid animate-fade-in-up stagger-4">' +

        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Credential Types Distribution</div>' +
              '<div class="chart-card-subtitle">Breakdown by authentication method</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="identity-cred-types-chart" style="height:250px"></canvas></div>' +
        '</div>' +

        '<div class="chart-card">' +
          '<div class="chart-card-header">' +
            '<div>' +
              '<div class="chart-card-title">Access Scope Distribution</div>' +
              '<div class="chart-card-subtitle">Permission levels across agents</div>' +
            '</div>' +
          '</div>' +
          '<div class="chart-card-body"><canvas id="identity-scope-chart" style="height:250px"></canvas></div>' +
        '</div>' +

      '</div>' +

    '</div>';
  },

  init: function () {
    AETHER.charts.destroyAll();

    var d = AETHER.data;
    var creds = d.computeIdentity().credentials;

    /* Credential Types Doughnut — aggregated from the real credential inventory,
       not a fixed illustrative distribution. */
    var typeCounts = {};
    creds.forEach(function (c) { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1; });
    var typeLabels = Object.keys(typeCounts);
    var typeColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    AETHER.charts.createDoughnutChart(
      'identity-cred-types-chart',
      typeLabels.length ? typeLabels : ['No credentials'],
      typeLabels.length ? typeLabels.map(function (l) { return typeCounts[l]; }) : [1],
      typeLabels.length ? typeLabels.map(function (_, i) { return typeColors[i % typeColors.length]; }) : ['#334155'],
      { legend: true, legendPosition: 'bottom' }
    );

    /* Access Scope Doughnut — aggregated the same way. */
    var scopeCounts = {};
    creds.forEach(function (c) { scopeCounts[c.scope] = (scopeCounts[c.scope] || 0) + 1; });
    var scopeOrder = ['read only', 'read/write', 'admin'];
    var scopeLabelMap = { 'read only': 'Read Only', 'read/write': 'Read/Write', 'admin': 'Admin' };
    var scopeColorMap = { 'read only': '#10b981', 'read/write': '#3b82f6', 'admin': '#ef4444' };
    var presentScopes = scopeOrder.filter(function (s) { return scopeCounts[s]; });
    AETHER.charts.createDoughnutChart(
      'identity-scope-chart',
      presentScopes.length ? presentScopes.map(function (s) { return scopeLabelMap[s]; }) : ['No credentials'],
      presentScopes.length ? presentScopes.map(function (s) { return scopeCounts[s]; }) : [1],
      presentScopes.length ? presentScopes.map(function (s) { return scopeColorMap[s]; }) : ['#334155'],
      { legend: true, legendPosition: 'bottom' }
    );
  }
};
