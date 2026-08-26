/* ═══════════════════════════════════════════════════════════════
   AETHER Application Shell
   Enterprise AI Workforce Platform — Router & Initialization
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};

AETHER.app = (function () {
  // ─── Navigation Config ───────────────────────────────────
  const NAV_SECTIONS = [
    {
      title: null, // no section header for main items
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' }
      ]
    },
    {
      title: 'AI Workforce',
      items: [
        { id: 'discovery', label: 'Agent Discovery', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' },
        { id: 'registry', label: 'Agent Registry', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/></svg>' },
        { id: 'identity', label: 'Identity', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 12a3 3 0 1 0 0-1 3 3 0 0 0 0 1z"/><path d="M7 19v-1a5 5 0 0 1 10 0v1"/></svg>' },
        { id: 'knowledgegraph', label: 'Knowledge Graph', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v4m-5.2 3.2L10 12.5m4 .5l3.2 3.7"/></svg>' }
      ]
    },
    {
      title: 'Governance & Risk',
      items: [
        { id: 'governance', label: 'Governance', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', badge: 4 },
        { id: 'compliance', label: 'Compliance', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
        { id: 'risk', label: 'Risk Engine', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
        { id: 'audit', label: 'Audit Center', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'reliability', label: 'Reliability', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
        { id: 'cost', label: 'Cost Optimization', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
        { id: 'benchmark', label: 'Benchmark Network', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
        { id: 'impact', label: 'Business Impact', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
        { id: 'integrations', label: 'Integrations Hub', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>' }
      ]
    },
    {
      title: 'C-Suite',
      items: [
        { id: 'cio', label: 'CIO Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { id: 'ciso', label: 'CISO Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
        { id: 'cfo', label: 'CFO Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' }
      ]
    },
    {
      title: 'Trust Layer',
      items: [
        { id: 'trust', label: 'Trust Console', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>' }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' }
      ]
    }
  ];

  // ─── Page title map ──────────────────────────────────────
  const PAGE_TITLES = {
    dashboard: 'Dashboard',
    discovery: 'Agent Discovery',
    registry: 'Agent Registry',
    identity: 'Identity & Access',
    knowledgegraph: 'Knowledge Graph',
    governance: 'Governance Engine',
    compliance: 'Compliance Center',
    risk: 'Risk Engine',
    audit: 'Audit Center',
    reliability: 'Reliability',
    cost: 'Cost Optimization',
    benchmark: 'Benchmark Network',
    impact: 'Business Impact',
    integrations: 'Integrations Hub',
    cio: 'CIO Dashboard',
    ciso: 'CISO Dashboard',
    cfo: 'CFO Dashboard',
    trust: 'Trust Console',
    settings: 'Settings',
    profile: 'Agent Profile',
    rationale: 'KPI Rationale'
  };

  // ─── Render Sidebar ──────────────────────────────────────
  function renderSidebar() {
    let html = '';
    html += '<div class="sidebar-header">';
    html += '  <div class="sidebar-logo">';
    html += '    <div class="sidebar-logo-icon">Æ</div>';
    html += '    <span class="sidebar-logo-text">AETHER</span>';
    html += '  </div>';
    html += '  <span class="sidebar-logo-badge">BETA</span>';
    html += '</div>';
    html += '<nav class="sidebar-nav">';

    NAV_SECTIONS.forEach(function (section) {
      html += '<div class="sidebar-section">';
      if (section.title) {
        html += '<div class="sidebar-section-title">' + section.title + '</div>';
      }
      section.items.forEach(function (item) {
        html += '<a class="sidebar-item" data-page="' + item.id + '" href="#' + item.id + '">';
        html += '<span class="sidebar-item-icon">' + item.icon + '</span>';
        html += '<span>' + item.label + '</span>';
        if (item.badge) {
          html += '<span class="sidebar-item-badge">' + item.badge + '</span>';
        }
        html += '</a>';
      });
      html += '</div>';
    });

    html += '</nav>';

    // Sidebar footer
    html += '<div style="padding: 16px 20px; border-top: 1px solid var(--border-primary); flex-shrink: 0;">';
    html += '<div style="font-size: 10px; color: var(--text-tertiary); text-align: center;">';
    html += 'AETHER Platform v2.4.1<br>';
    html += '© 2026 Aether Inc.';
    html += '</div></div>';

    return html;
  }

  // ─── Render Top Bar ──────────────────────────────────────
  function renderTopbar(page) {
    const title = PAGE_TITLES[page] || 'Dashboard';
    let html = '';
    html += '<div class="topbar-left">';
    html += '  <div class="topbar-breadcrumb">';
    html += '    <span style="color: var(--text-tertiary);">AETHER</span>';
    html += '    <span class="topbar-breadcrumb-sep">/</span>';
    html += '    <span class="topbar-breadcrumb-current">' + title + '</span>';
    html += '  </div>';
    html += '</div>';
    html += '<div style="flex: 1; display: flex; justify-content: center;">';
    html += '  <div class="topbar-search">';
    html += '    <span class="topbar-search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>';
    html += '    <input type="text" placeholder="Search agents, policies, metrics..." id="global-search" />';
    html += '    <span class="topbar-search-shortcut">⌘K</span>';
    html += '  </div>';
    html += '</div>';
    html += '<div class="topbar-right">';
    html += '  <button class="topbar-icon-btn" id="btn-onboard-agent" title="Onboard Agent" style="position:relative;">';
    html += '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    html += '  </button>';
    html += '  <button class="topbar-icon-btn" id="btn-event-stream" title="Event Stream" style="position:relative;">';
    html += '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    html += '    <span class="notification-dot"></span>';
    html += '    <span class="notification-badge" id="event-count-badge" style="display:none;">0</span>';
    html += '  </button>';
    html += '  <button class="topbar-icon-btn" title="Help">';
    html += '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    html += '  </button>';
    html += '  <div class="topbar-divider"></div>';
    html += '  <div class="topbar-user">';
    html += '    <div class="topbar-avatar">MK</div>';
    html += '    <div class="topbar-user-info">';
    html += '      <span class="topbar-user-name">Manish Kapoor</span>';
    html += '      <span class="topbar-user-role">Platform Admin</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  // ─── Router ──────────────────────────────────────────────
  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const parts = hash.split('/');
    return { page: parts[0], param: parts[1] || null };
  }

  function navigate() {
    const route = getPageFromHash();
    const page = route.page;

    // Destroy existing charts
    if (AETHER.charts) AETHER.charts.destroyAll();

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(function (item) {
      const itemPage = item.getAttribute('data-page');
      if (itemPage === page || (page === 'profile' && itemPage === 'registry')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update topbar
    var topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML = renderTopbar(page);
    }

    // Render page content
    var content = document.getElementById('page-content');
    if (!content) return;

    var pageModule = AETHER.pages[page];
    if (pageModule && typeof pageModule.render === 'function') {
      try {
        content.innerHTML = pageModule.render(route.param);
      } catch (renderErr) {
        console.error('[AETHER] Page render error for "' + page + '":', renderErr);
        content.innerHTML = '<div class="page-content"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Page Error</div><div class="empty-state-desc">Failed to render ' + page + ': ' + renderErr.message + '</div></div></div>';
        return;
      }
      // Scroll to top
      content.scrollTop = 0;
      // Initialize charts and listeners after DOM update
      requestAnimationFrame(function () {
        if (typeof pageModule.init === 'function') {
          try {
            pageModule.init(route.param);
          } catch (initErr) {
            console.error('[AETHER] Page init error for "' + page + '":', initErr);
          }
        }
      });
    } else {
      content.innerHTML = '<div class="page-content"><div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-title">Page Loading</div><div class="empty-state-desc">This page is being built. Please try another section.</div></div></div>';
    }

    // Update document title
    document.title = (PAGE_TITLES[page] || 'Dashboard') + ' — AETHER';
  }

  // ─── Event Stream Panel ──────────────────────────────────
  function renderEventStreamPanel() {
    var html = '<div class="event-stream-overlay" id="event-stream-panel">';
    html += '  <div class="event-stream-header">';
    html += '    <div>';
    html += '      <div class="event-stream-title">⚡ Event Stream</div>';
    html += '      <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Real-time agent events</div>';
    html += '    </div>';
    html += '    <button class="event-stream-close" id="btn-close-events">✕</button>';
    html += '  </div>';
    html += '  <div class="event-stream-filters" id="event-filters"></div>';
    html += '  <div class="event-stream-body" id="event-stream-body"></div>';
    html += '</div>';
    return html;
  }

  function toggleEventStream() {
    var panel = document.getElementById('event-stream-panel');
    if (panel) {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        refreshEventStream();
      }
    }
  }

  function refreshEventStream() {
    var body = document.getElementById('event-stream-body');
    if (!body || !AETHER.events) return;

    var events = AETHER.events.getRecent(50);
    var html = '';
    events.forEach(function (evt) {
      var timeDiff = Math.floor((Date.now() - new Date(evt.timestamp).getTime()) / 1000);
      var timeStr = timeDiff < 60 ? timeDiff + 's ago' : Math.floor(timeDiff / 60) + 'm ago';
      var severityColors = { info: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
      var badgeColor = severityColors[evt.severity] || '#3b82f6';

      html += '<div class="event-stream-item">';
      html += '  <span class="event-stream-item-icon">' + (evt.icon || '📋') + '</span>';
      html += '  <div class="event-stream-item-content">';
      html += '    <div class="event-stream-item-title">' + evt.type.replace(/([A-Z])/g, ' $1').trim() + '</div>';
      html += '    <div class="event-stream-item-detail">' + (evt.data && evt.data.description ? evt.data.description : (evt.data && evt.data.agentName ? evt.data.agentName : '')) + '</div>';
      html += '    <div class="event-stream-item-time">' + timeStr + ' · <span style="color:' + badgeColor + ';">' + evt.severity + '</span></div>';
      html += '  </div>';
      html += '</div>';
    });

    if (!html) {
      html = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:12px;">No events yet. Runtime will start generating events shortly.</div>';
    }
    body.innerHTML = html;
  }

  var _eventStreamTimer = null;

  function startEventStreamRefresh() {
    if (_eventStreamTimer) clearInterval(_eventStreamTimer);
    _eventStreamTimer = setInterval(function () {
      var panel = document.getElementById('event-stream-panel');
      if (panel && panel.classList.contains('open')) {
        refreshEventStream();
      }
      // Update badge count
      var badge = document.getElementById('event-count-badge');
      if (badge && AETHER.events) {
        var stats = AETHER.events.getStats();
        if (stats.total > 0) {
          badge.style.display = 'flex';
          badge.textContent = stats.total > 99 ? '99+' : stats.total;
        }
      }
    }, 3000);
  }

  // ─── Onboarding Modal ──────────────────────────────────────
  var _onboardStep = 1;
  var _onboardData = {};

  function openOnboardModal() {
    _onboardStep = 1;
    _onboardData = {};
    var existing = document.getElementById('onboard-modal-backdrop');
    if (existing) existing.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'onboard-modal-backdrop';
    backdrop.innerHTML = renderOnboardStep(1);
    document.body.appendChild(backdrop);
    attachOnboardListeners();
  }

  function closeOnboardModal() {
    var backdrop = document.getElementById('onboard-modal-backdrop');
    if (backdrop) backdrop.remove();
  }

  function renderOnboardStep(step) {
    var totalSteps = 5;
    var html = '<div class="modal">';

    // Header
    html += '<div class="modal-header">';
    html += '  <div class="modal-title">✨ Onboard New Agent — Step ' + step + ' of ' + totalSteps + '</div>';
    html += '  <button class="modal-close" id="modal-close-btn">✕</button>';
    html += '</div>';

    // Steps indicator
    html += '<div class="modal-steps">';
    for (var i = 1; i <= totalSteps; i++) {
      var cls = i < step ? 'completed' : (i === step ? 'active' : '');
      html += '<div class="modal-step ' + cls + '"></div>';
    }
    html += '</div>';

    // Body
    html += '<div class="modal-body">';

    if (step === 1) {
      html += '<div class="form-group"><label class="form-label">Agent Name *</label><input class="form-input" id="ob-name" placeholder="e.g. Finance Forecast Agent" value="' + (_onboardData.name || '') + '"/></div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">Platform *</label><select class="form-select" id="ob-platform"><option value="">Select platform...</option>';
      if (AETHER.config) {
        AETHER.config.platformConnectors.forEach(function (c) {
          var sel = _onboardData.platform === c.name ? ' selected' : '';
          html += '<option value="' + c.name + '"' + sel + '>' + c.icon + ' ' + c.name + '</option>';
        });
      }
      html += '  </select></div>';
      html += '  <div class="form-group"><label class="form-label">Department *</label><select class="form-select" id="ob-department"><option value="">Select...</option>';
      var depts = ['Engineering', 'Finance', 'Customer Success', 'Sales', 'HR', 'Legal', 'Marketing', 'Operations', 'Security', 'Data Science'];
      depts.forEach(function (d) {
        var sel = _onboardData.department === d ? ' selected' : '';
        html += '<option value="' + d + '"' + sel + '>' + d + '</option>';
      });
      html += '  </select></div>';
      html += '</div>';
      html += '<div class="form-group"><label class="form-label">Owner *</label><input class="form-input" id="ob-owner" placeholder="e.g. Finance Team" value="' + (_onboardData.owner || '') + '"/></div>';
      html += '<div class="form-group"><label class="form-label">Purpose</label><textarea class="form-textarea" id="ob-purpose" placeholder="Describe what this agent does...">' + (_onboardData.purpose || '') + '</textarea></div>';

    } else if (step === 2) {
      html += '<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Deployment Topology</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">WHERE does this agent run?</div></div>';
      html += '<div class="form-group"><label class="form-label">Endpoint URL *</label><input class="form-input" id="ob-endpoint" placeholder="https://my-agent.contoso.com" value="' + (_onboardData.endpoint || '') + '"/><div class="form-hint">The agent\'s API or service endpoint URL</div></div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">Environment</label><select class="form-select" id="ob-environment"><option value="Production"' + (_onboardData.environment === 'Production' ? ' selected' : '') + '>Production</option><option value="Staging"' + (_onboardData.environment === 'Staging' ? ' selected' : '') + '>Staging</option><option value="Development"' + (_onboardData.environment === 'Development' ? ' selected' : '') + '>Development</option><option value="Test"' + (_onboardData.environment === 'Test' ? ' selected' : '') + '>Test</option></select></div>';
      html += '  <div class="form-group"><label class="form-label">Region</label><input class="form-input" id="ob-region" placeholder="e.g. us-east-1" value="' + (_onboardData.region || 'us-east-1') + '"/></div>';
      html += '</div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">Runtime</label><input class="form-input" id="ob-runtime" placeholder="e.g. Azure Kubernetes Service" value="' + (_onboardData.runtime || '') + '"/></div>';
      html += '  <div class="form-group"><label class="form-label">Namespace</label><input class="form-input" id="ob-namespace" placeholder="e.g. default" value="' + (_onboardData.namespace || 'default') + '"/></div>';
      html += '</div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">Health Check Endpoint</label><input class="form-input" id="ob-health" placeholder="/health" value="' + (_onboardData.healthCheckEndpoint || '/health') + '"/></div>';
      html += '  <div class="form-group"><label class="form-label">Metrics Endpoint</label><input class="form-input" id="ob-metrics" placeholder="/metrics" value="' + (_onboardData.metricsEndpoint || '/metrics') + '"/></div>';
      html += '</div>';

    } else if (step === 3) {
      html += '<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Monitoring Method</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">HOW should AETHER monitor this agent?</div></div>';
      var methods = AETHER.config ? AETHER.config.monitoringMethods : {};
      var selMethod = _onboardData.monitoringMethod || 'sdk-push';
      html += '<div class="form-group"><select class="form-select" id="ob-method">';
      Object.keys(methods).forEach(function (key) {
        var m = methods[key];
        html += '<option value="' + key + '"' + (selMethod === key ? ' selected' : '') + '>' + m.name + '</option>';
      });
      html += '</select></div>';
      html += '<div id="method-description" style="padding:12px 16px;background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-md);margin-bottom:16px;">';
      if (methods[selMethod]) {
        html += '<div style="font-size:12px;color:var(--text-secondary);">' + methods[selMethod].description + '</div>';
        html += '<div style="font-size:11px;color:var(--text-tertiary);margin-top:6px;"><strong style="color:var(--text-secondary);">How it works:</strong> ' + methods[selMethod].howItWorks + '</div>';
      }
      html += '</div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">Health Check Interval (seconds)</label><input class="form-input" id="ob-hc-interval" type="number" value="' + (_onboardData.healthCheckInterval || '60') + '"/></div>';
      html += '  <div class="form-group"><label class="form-label">Metrics Interval (seconds)</label><input class="form-input" id="ob-metrics-interval" type="number" value="' + (_onboardData.metricsInterval || '300') + '"/></div>';
      html += '</div>';
      html += '<div class="form-group"><label class="form-label">Alert Channels</label><div class="form-checkbox-group">';
      ['Email', 'Slack', 'Teams', 'PagerDuty'].forEach(function (ch) {
        html += '<label class="form-checkbox"><input type="checkbox" checked /> ' + ch + '</label>';
      });
      html += '</div></div>';

    } else if (step === 4) {
      html += '<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Governance & Compliance</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">WHAT policies and frameworks apply?</div></div>';
      html += '<div class="form-group"><label class="form-label">Governance Policies</label><div class="form-checkbox-group">';
      if (AETHER.config) {
        AETHER.config.governancePolicies.forEach(function (p) {
          html += '<label class="form-checkbox"><input type="checkbox" checked /> ' + p.name + '</label>';
        });
      }
      html += '</div></div>';
      html += '<div class="form-group"><label class="form-label">Compliance Frameworks</label><div class="form-checkbox-group">';
      ['SOC2', 'ISO27001', 'GDPR', 'SOX', 'HIPAA'].forEach(function (f) {
        html += '<label class="form-checkbox"><input type="checkbox"' + (f !== 'HIPAA' ? ' checked' : '') + ' /> ' + f + '</label>';
      });
      html += '</div></div>';
      html += '<div class="form-row">';
      html += '  <div class="form-group"><label class="form-label">PII Access</label><select class="form-select" id="ob-pii"><option value="false">No</option><option value="true">Yes</option></select></div>';
      html += '  <div class="form-group"><label class="form-label">Financial Access</label><select class="form-select" id="ob-financial"><option value="false">No</option><option value="true">Yes</option></select></div>';
      html += '</div>';

    } else if (step === 5) {
      html += '<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Review & Confirm</div><div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Verify all details before onboarding</div></div>';
      var fields = [
        ['Agent Name', _onboardData.name || '—'],
        ['Platform', _onboardData.platform || '—'],
        ['Department', _onboardData.department || '—'],
        ['Owner', _onboardData.owner || '—'],
        ['Endpoint', _onboardData.endpoint || '—'],
        ['Environment', _onboardData.environment || 'Production'],
        ['Region', _onboardData.region || 'us-east-1'],
        ['Runtime', _onboardData.runtime || '—'],
        ['Monitoring', _onboardData.monitoringMethod || 'sdk-push'],
        ['Health Check', (_onboardData.healthCheckInterval || '60') + 's']
      ];
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
      fields.forEach(function (f) {
        html += '<div style="padding:10px 14px;background:var(--bg-card);border:1px solid var(--border-primary);border-radius:var(--radius-sm);">';
        html += '<div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">' + f[0] + '</div>';
        html += '<div style="font-size:13px;color:var(--text-primary);margin-top:2px;font-weight:500;word-break:break-all;">' + f[1] + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';

    // Footer
    html += '<div class="modal-footer">';
    if (step > 1) {
      html += '<button class="btn btn-secondary" id="ob-prev">← Back</button>';
    } else {
      html += '<div></div>';
    }
    if (step < totalSteps) {
      html += '<button class="btn btn-primary" id="ob-next">Next →</button>';
    } else {
      html += '<button class="btn btn-primary" id="ob-submit" style="background:linear-gradient(135deg,#10b981,#059669);">✅ Onboard Agent</button>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function collectOnboardData(step) {
    if (step === 1) {
      var el;
      el = document.getElementById('ob-name'); if (el) _onboardData.name = el.value;
      el = document.getElementById('ob-platform'); if (el) _onboardData.platform = el.value;
      el = document.getElementById('ob-department'); if (el) _onboardData.department = el.value;
      el = document.getElementById('ob-owner'); if (el) _onboardData.owner = el.value;
      el = document.getElementById('ob-purpose'); if (el) _onboardData.purpose = el.value;
    } else if (step === 2) {
      var el;
      el = document.getElementById('ob-endpoint'); if (el) _onboardData.endpoint = el.value;
      el = document.getElementById('ob-environment'); if (el) _onboardData.environment = el.value;
      el = document.getElementById('ob-region'); if (el) _onboardData.region = el.value;
      el = document.getElementById('ob-runtime'); if (el) _onboardData.runtime = el.value;
      el = document.getElementById('ob-namespace'); if (el) _onboardData.namespace = el.value;
      el = document.getElementById('ob-health'); if (el) _onboardData.healthCheckEndpoint = el.value;
      el = document.getElementById('ob-metrics'); if (el) _onboardData.metricsEndpoint = el.value;
    } else if (step === 3) {
      var el;
      el = document.getElementById('ob-method'); if (el) _onboardData.monitoringMethod = el.value;
      el = document.getElementById('ob-hc-interval'); if (el) _onboardData.healthCheckInterval = parseInt(el.value, 10);
      el = document.getElementById('ob-metrics-interval'); if (el) _onboardData.metricsInterval = parseInt(el.value, 10);
    } else if (step === 4) {
      var el;
      el = document.getElementById('ob-pii'); if (el) _onboardData.piiAccess = el.value === 'true';
      el = document.getElementById('ob-financial'); if (el) _onboardData.financialAccess = el.value === 'true';
    }
  }

  function attachOnboardListeners() {
    var close = document.getElementById('modal-close-btn');
    if (close) close.addEventListener('click', closeOnboardModal);

    var next = document.getElementById('ob-next');
    if (next) next.addEventListener('click', function () {
      collectOnboardData(_onboardStep);
      if (_onboardStep === 1 && !_onboardData.name) {
        showToast('Please enter an agent name', 'warning'); return;
      }
      _onboardStep++;
      var backdrop = document.getElementById('onboard-modal-backdrop');
      if (backdrop) { backdrop.innerHTML = renderOnboardStep(_onboardStep); attachOnboardListeners(); }
    });

    var prev = document.getElementById('ob-prev');
    if (prev) prev.addEventListener('click', function () {
      collectOnboardData(_onboardStep);
      _onboardStep--;
      var backdrop = document.getElementById('onboard-modal-backdrop');
      if (backdrop) { backdrop.innerHTML = renderOnboardStep(_onboardStep); attachOnboardListeners(); }
    });

    var submit = document.getElementById('ob-submit');
    if (submit) submit.addEventListener('click', function () {
      if (!AETHER.config) { showToast('Config not loaded', 'danger'); return; }
      var result = AETHER.config.onboardAgent(_onboardData);
      if (result) {
        closeOnboardModal();
        showToast('✅ Agent "' + result.name + '" onboarded as ' + result.id + '. Monitoring started.', 'success');
        // Re-navigate to refresh current page data
        setTimeout(function () { navigate(); }, 500);
      } else {
        showToast('Failed to onboard agent', 'danger');
      }
    });

    // Click backdrop to close
    var backdrop = document.getElementById('onboard-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeOnboardModal();
      });
    }
  }

  // ─── Toast System ────────────────────────────────────────
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    var icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span>' +
      '<span class="toast-message">' + message + '</span>' +
      '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentElement) toast.remove(); }, 5000);
  }

  // ─── Initialize ──────────────────────────────────────────
  function init() {
    // Initialize config
    if (AETHER.config && AETHER.config.init) AETHER.config.init();

    // Apply chart defaults
    if (AETHER.charts) AETHER.charts.applyDefaults();

    // Build layout
    var app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = '';
    app.className = 'app-layout';

    // Sidebar
    var sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = renderSidebar();
    app.appendChild(sidebar);

    // Main area
    var mainArea = document.createElement('div');
    mainArea.className = 'main-area';

    var topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.id = 'topbar';
    mainArea.appendChild(topbar);

    var pageContent = document.createElement('main');
    pageContent.id = 'page-content';
    pageContent.style.cssText = 'flex: 1; overflow-y: auto; overflow-x: hidden;';
    mainArea.appendChild(pageContent);

    app.appendChild(mainArea);

    // Event stream panel
    var streamPanel = document.createElement('div');
    streamPanel.innerHTML = renderEventStreamPanel();
    document.body.appendChild(streamPanel.firstElementChild);

    // Sidebar click handlers
    sidebar.addEventListener('click', function (e) {
      var item = e.target.closest('.sidebar-item');
      if (item) {
        e.preventDefault();
        var page = item.getAttribute('data-page');
        window.location.hash = '#' + page;
      }
    });

    // Hash change listener
    window.addEventListener('hashchange', navigate);

    // Initial navigation
    navigate();

    // Start event stream refresh
    startEventStreamRefresh();

    // Start runtime engine
    if (AETHER.runtime && AETHER.runtime.start) {
      setTimeout(function () { AETHER.runtime.start(); }, 1000);
    }

    // Global click listener for table-agent-name elements
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.classList && target.classList.contains('table-agent-name')) {
        var id = target.getAttribute('data-agent-id');
        if (id) {
          window.location.hash = '#profile/' + id;
          return;
        }
        var name = target.textContent.trim();
        if (AETHER.data && typeof AETHER.data.getAllAgents === 'function') {
          var found = AETHER.data.getAllAgents().find(function (a) { return a.name === name || a.agent === name; });
          if (found) {
            window.location.hash = '#profile/' + found.id;
          }
        }
      }
    });
  }

  // After navigate, attach topbar event handlers
  var _origNavigate = navigate;
  navigate = function () {
    _origNavigate();
    // Attach topbar buttons after render
    requestAnimationFrame(function () {
      var evtBtn = document.getElementById('btn-event-stream');
      if (evtBtn) evtBtn.addEventListener('click', toggleEventStream);
      var closeBtn = document.getElementById('btn-close-events');
      if (closeBtn) closeBtn.addEventListener('click', toggleEventStream);
      var onboardBtn = document.getElementById('btn-onboard-agent');
      if (onboardBtn) onboardBtn.addEventListener('click', openOnboardModal);

      /* Global search bar */
      var searchInput = document.getElementById('global-search');
      if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            var query = searchInput.value.trim().toLowerCase();
            if (!query) return;
            /* Search onboarded agents */
            var agents = (AETHER.config && AETHER.config.getOnboardedAgents) ? AETHER.config.getOnboardedAgents() : [];
            var match = null;
            for (var s = 0; s < agents.length; s++) {
              var ag = agents[s];
              if ((ag.name || '').toLowerCase().indexOf(query) !== -1 ||
                  (ag.platform || '').toLowerCase().indexOf(query) !== -1 ||
                  (ag.department || '').toLowerCase().indexOf(query) !== -1 ||
                  (ag.id || '').toLowerCase().indexOf(query) !== -1) {
                match = ag;
                break;
              }
            }
            if (match) {
              navigateTo('profile/' + match.id);
            } else {
              /* Navigate to registry with search term */
              navigateTo('registry');
              showToast('No agent found matching "' + searchInput.value.trim() + '"', 'info');
            }
            searchInput.value = '';
          }
        });
      }
    });
  };

  // ─── DOM Ready ───────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function navigateTo(page) {
    window.location.hash = '#' + page;
  }

  return { init: init, navigate: navigate, navigateTo: navigateTo, openOnboardModal: openOnboardModal, showToast: showToast };
})();
