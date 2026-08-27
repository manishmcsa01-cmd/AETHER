/* ============================================================
 *  AETHER Supervisory Agent UI Components
 *  ============================================================
 *  Reusable render functions that return HTML strings for
 *  supervisory-agent panels, status strips, activity feeds,
 *  and animated SVG pulse rings.
 *
 *  All HTML is built with string concatenation (no template
 *  literals) to match the AETHER codebase convention.
 *
 *  Depends on:
 *    - AETHER.config   (agents-config.js)
 *    - AETHER.events   (event-bus.js)
 *    - AETHER.runtime  (agents-runtime.js)
 * ============================================================ */

window.AETHER = window.AETHER || {};

AETHER.supervisorUI = (function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────

  /**
   * Format a date string as relative time (e.g. "2m ago").
   */
  function _relativeTime(dateStr) {
    if (!dateStr) return 'never';
    var diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) {
      // Future time — show as "in Xm"
      diff = Math.abs(diff);
      var fSecs = Math.floor(diff / 1000);
      if (fSecs < 60)   return 'in ' + fSecs + 's';
      if (fSecs < 3600)  return 'in ' + Math.floor(fSecs / 60) + 'm';
      if (fSecs < 86400) return 'in ' + Math.floor(fSecs / 3600) + 'h';
      return 'in ' + Math.floor(fSecs / 86400) + 'd';
    }
    var secs = Math.floor(diff / 1000);
    if (secs < 60)   return secs + 's ago';
    if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }

  /**
   * Map agent status to a dot color.
   */
  function _statusColor(status) {
    var map = {
      active:   '#10b981',
      running:  '#10b981',
      scanning: '#3b82f6',
      idle:     '#f59e0b',
      error:    '#ef4444',
      paused:   '#6b7280'
    };
    return map[(status || '').toLowerCase()] || '#10b981';
  }

  /**
   * Map status to a human-friendly label.
   */
  function _statusLabel(status) {
    var s = (status || 'active').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Format a number with locale-aware commas (basic fallback).
   */
  function _fmtNum(n) {
    if (n === undefined || n === null) return '—';
    if (typeof n === 'number') return n.toLocaleString();
    return String(n);
  }

  /**
   * Safely get agent by ID from config.
   */
  function _getAgent(agentId) {
    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
    for (var i = 0; i < agents.length; i++) {
      if (agents[i].id === agentId) return agents[i];
    }
    return null;
  }

  /**
   * Helper to map metric key & agentId to corresponding rationale page.
   */
  function _getMetricHash(key, agentId) {
    var k = (key || '').toLowerCase();
    if (k.indexOf('audit') !== -1 || k.indexOf('report') !== -1) return '#rationale/complianceScore';
    if (k.indexOf('finding') !== -1) return '#rationale/complianceFindings';
    if (k.indexOf('remediation') !== -1 || k.indexOf('incident') !== -1) return '#rationale/criticalIncidents';
    if (k.indexOf('risk') !== -1) return '#rationale/avgRiskScore';
    if (k.indexOf('discovery') !== -1 || k.indexOf('coverage') !== -1 || k.indexOf('discovered') !== -1) return '#rationale/discoveryCoverage';
    if (k.indexOf('unknown') !== -1) return '#rationale/totalAgents';
    if (k.indexOf('identity') !== -1) return '#rationale/totalIdentities';
    if (k.indexOf('violation') !== -1 || k.indexOf('action') !== -1 || k.indexOf('escalation') !== -1 || k.indexOf('eval') !== -1 || k.indexOf('policy') !== -1) return '#rationale/policyViolations';
    if (k.indexOf('spend') !== -1 || k.indexOf('costperagent') !== -1 || k.indexOf('infra') !== -1) return '#rationale/monthlySpend';
    if (k.indexOf('costpertask') !== -1) return '#rationale/costPerTask';
    if (k.indexOf('availability') !== -1) return '#rationale/availability';
    if (k.indexOf('success') !== -1) return '#rationale/successRate';
    if (k.indexOf('latency') !== -1) return '#rationale/avgLatency';
    if (k.indexOf('sla') !== -1) return '#rationale/discoveryCoverage';
    
    // Fallbacks based on agentId
    if (agentId === 'sa-discovery') return '#rationale/discoveryCoverage';
    if (agentId === 'sa-identity') return '#rationale/totalIdentities';
    if (agentId === 'sa-governance') return '#rationale/policyViolations';
    if (agentId === 'sa-compliance') return '#rationale/complianceScore';
    if (agentId === 'sa-risk') return '#rationale/avgRiskScore';
    if (agentId === 'sa-cost') return '#rationale/monthlySpend';
    if (agentId === 'sa-reliability') return '#rationale/avgReliability';
    if (agentId === 'sa-observability') return '#rationale/discoveryCoverage';
    if (agentId === 'sa-benchmarking') return '#rationale/discoveryCoverage';
    if (agentId === 'sa-auditor') return '#rationale/complianceScore';
    if (agentId === 'sa-workforce-manager') return '#rationale/complianceScore';
    
    return '#rationale/complianceScore';
  }

  // ── renderStatusStrip ────────────────────────────────────

  /**
   * Render a horizontal strip showing ALL 11 supervisory agents.
   * Each agent shows a colored status dot, icon, name, status,
   * and last-run time.
   *
   * @returns {string} HTML string
   */
  function renderStatusStrip() {
    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
    var agentCount = 0;
    if (AETHER.data && typeof AETHER.data.getTotalAgentCount === 'function') {
      agentCount = AETHER.data.getTotalAgentCount();
    }
    var isActive = agentCount > 0;

    var html = '';
    html += '<div class="card sa-status-strip-card">';
    html += '  <div class="card-header">';
    html += '    <div class="card-header-left">';
    html += '      <h3 class="card-title">AETHER Supervisory Agents</h3>';
    html += '      <p class="card-subtitle">' + (isActive ? agents.length + ' agents actively monitoring ' + agentCount + ' workforce agent' + (agentCount !== 1 ? 's' : '') : 'Standing by — no workforce agents onboarded yet') + '</p>';
    html += '    </div>';
    html += '    <div class="card-header-right">';
    html += '      <span class="badge ' + (isActive ? 'badge-success' : 'badge-neutral') + '">' + (isActive ? 'All Systems Active' : 'Standby') + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="sa-status-strip">';

    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      var m = a.metrics || {};
      var dotColor = _statusColor(a.status);
      var lastRun  = _relativeTime(m.lastRun);

      html += '<div class="sa-status-item" data-agent-id="' + a.id + '">';
      html += '  <div class="sa-status-dot-wrap">';
      html += '    <span class="sa-status-dot ' + (a.status || '').toLowerCase() + '" style="background:' + dotColor + ';box-shadow:0 0 8px ' + dotColor + '"></span>';
      html += '  </div>';
      html += '  <span class="sa-status-icon">' + (a.icon || '🤖') + '</span>';
      html += '  <div class="sa-status-info">';
      html += '    <span class="sa-status-name">' + (a.name || 'Agent') + '</span>';
      html += '    <span class="sa-status-meta">' + _statusLabel(a.status) + ' · ' + lastRun + '</span>';
      html += '  </div>';
      html += '</div>';
    }

    html += '  </div>'; // .sa-status-strip
    html += '</div>';   // .card

    return html;
  }

  // ── renderAgentCard ──────────────────────────────────────

  /**
   * Render a detailed card for a single supervisory agent.
   *
   * @param {string} agentId — the agent's ID (e.g. 'sa-discovery')
   * @returns {string} HTML string
   */
  function renderAgentCard(agentId) {
    var agent = _getAgent(agentId);
    if (!agent) {
      return '<div class="sa-agent-card sa-agent-card--empty">Agent not found: ' + agentId + '</div>';
    }

    var m = agent.metrics || {};
    var dotColor  = _statusColor(agent.status);
    var lastRun   = _relativeTime(m.lastRun);
    var nextRun   = _relativeTime(m.nextRun);

    // ── Header
    var html = '';
    html += '<div class="sa-agent-card" data-agent-id="' + agent.id + '">';
    html += '  <div class="sa-agent-header">';
    html += '    <div class="sa-agent-title-row">';
    html += '      <span class="sa-agent-icon">' + (agent.icon || '🤖') + '</span>';
    html += '      <div class="sa-agent-title-text">';
    html += '        <h4 class="sa-agent-name">' + agent.name + '</h4>';
    html += '        <p class="sa-agent-purpose">' + (agent.purpose || '') + '</p>';
    html += '      </div>';
    html += '      <span class="sa-agent-badge" style="background:' + dotColor + '">' + _statusLabel(agent.status) + '</span>';
    html += '    </div>';
    html += '  </div>';

    // ── Metrics grid
    html += '  <div class="sa-agent-metrics">';
    var metricKeys = Object.keys(m);
    var displayCount = 0;
    for (var i = 0; i < metricKeys.length; i++) {
      var key = metricKeys[i];
      // Skip timing fields — we show those separately
      if (key === 'lastRun' || key === 'nextRun') continue;
      // Skip complex objects unless they're small
      if (typeof m[key] === 'object') continue;
      if (displayCount >= 4) break;

      var label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, function (c) { return c.toUpperCase(); })
        .trim();

      var hash = _getMetricHash(key, agent.id);
      html += '    <div class="sa-metric-tile" style="cursor: pointer;" onclick="window.location.hash=\'' + hash + '\'" title="Click to view rationale for ' + label + '">';
      html += '      <span class="sa-metric-value">' + _fmtNum(m[key]) + '</span>';
      html += '      <span class="sa-metric-label">' + label + '</span>';
      html += '    </div>';
      displayCount++;
    }
    html += '  </div>';

    // ── Mini activity feed (last 3 events from this agent)
    var events = [];
    if (AETHER.events) {
      var recent = AETHER.events.getRecent(100);
      for (var j = 0; j < recent.length; j++) {
        if (recent[j].source === agent.name || (recent[j].data && recent[j].data.source === agent.name)) {
          events.push(recent[j]);
          if (events.length >= 3) break;
        }
      }
    }

    html += '  <div class="sa-agent-feed">';
    html += '    <h5 class="sa-feed-heading">Recent Activity</h5>';

    if (events.length === 0) {
      html += '    <p class="sa-feed-empty">No recent activity</p>';
    } else {
      for (var k = 0; k < events.length; k++) {
        var e = events[k];
        html += '    <div class="sa-feed-item">';
        html += '      <span class="sa-feed-icon" style="color:' + e.color + '">' + e.icon + '</span>';
        html += '      <span class="sa-feed-text">' + ((e.data && e.data.description) || e.type) + '</span>';
        html += '      <span class="sa-feed-time">' + _relativeTime(e.timestamp) + '</span>';
        html += '    </div>';
      }
    }

    html += '  </div>';

    // ── Scan timing footer
    html += '  <div class="sa-agent-footer">';
    html += '    <span class="sa-timing">Last scan: <strong>' + lastRun + '</strong></span>';
    html += '    <span class="sa-timing">Next scan: <strong>' + nextRun + '</strong></span>';
    html += '  </div>';

    html += '</div>'; // .sa-agent-card

    return html;
  }

  // ── renderActivityFeed ───────────────────────────────────

  /**
   * Render a scrolling activity feed with timestamp, icon,
   * description, and source agent name.
   *
   * @param {number} count — number of events to show
   * @returns {string} HTML string
   */
  function renderActivityFeed(count) {
    var n = count || 20;
    var feed = [];

    if (AETHER.runtime && typeof AETHER.runtime.getActivityFeed === 'function') {
      feed = AETHER.runtime.getActivityFeed(n);
    } else if (AETHER.events) {
      var raw = AETHER.events.getRecent(n);
      for (var r = 0; r < raw.length; r++) {
        feed.push({
          icon:        raw[r].icon,
          color:       raw[r].color,
          description: (raw[r].data && raw[r].data.description) || raw[r].type,
          source:      raw[r].source || (raw[r].data && raw[r].data.source) || 'System',
          timestamp:   raw[r].timestamp
        });
      }
    }

    var html = '';
    html += '<div class="sa-activity-feed">';

    if (feed.length === 0) {
      html += '  <div class="sa-feed-empty-state">';
      html += '    <span class="sa-feed-empty-icon">📡</span>';
      html += '    <p>Waiting for events…</p>';
      html += '  </div>';
    } else {
      for (var i = 0; i < feed.length; i++) {
        var item = feed[i];
        var timeStr = _relativeTime(item.timestamp);
        var color   = item.color || '#94a3b8';

        html += '  <div class="sa-feed-item">';
        html += '    <span class="sa-feed-time">' + timeStr + '</span>';
        html += '    <span class="sa-feed-dot" style="background:' + color + '"></span>';
        html += '    <span class="sa-feed-icon" style="color:' + color + '">' + (item.icon || '📌') + '</span>';
        html += '    <span class="sa-feed-text">' + (item.description || '') + '</span>';
        html += '    <span class="sa-feed-source">' + (item.source || '') + '</span>';
        html += '  </div>';
      }
    }

    html += '</div>';

    return html;
  }

  // ── renderPulseRing ──────────────────────────────────────

  /**
   * Render an animated SVG pulse ring indicating agent activity.
   * Size ~48px. Pulses green when active, grey when idle.
   *
   * @param {string} agentId
   * @returns {string} SVG HTML string
   */
  function renderPulseRing(agentId) {
    var agent = _getAgent(agentId);
    var isActive = agent && (agent.status === 'active' || agent.status === 'running' || agent.status === 'scanning');
    var ringColor = isActive ? '#10b981' : '#4b5563';
    var icon = (agent && agent.icon) || '🤖';

    var html = '';
    html += '<div class="sa-pulse-ring-wrap" data-agent-id="' + (agentId || '') + '">';
    html += '  <svg class="sa-pulse-ring" width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">';

    // Outer animated ring
    html += '    <circle cx="24" cy="24" r="22" fill="none" stroke="' + ringColor + '" stroke-width="2" opacity="0.3">';
    if (isActive) {
      html += '      <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite"/>';
      html += '      <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>';
    }
    html += '    </circle>';

    // Inner steady ring
    html += '    <circle cx="24" cy="24" r="16" fill="none" stroke="' + ringColor + '" stroke-width="1.5" opacity="0.6"/>';

    // Centre background
    html += '    <circle cx="24" cy="24" r="12" fill="rgba(15,23,42,0.8)"/>';

    html += '  </svg>';

    // Emoji overlay centred inside the SVG
    html += '  <span class="sa-pulse-icon">' + icon + '</span>';
    html += '</div>';

    return html;
  }

  // ── Live-updating initialisers ───────────────────────────

  var _statusStripTimer  = null;
  var _activityFeedTimer = null;

  /**
   * Set up auto-refresh of the status strip every 5 seconds.
   * Looks for an element with class `.sa-status-strip-card`
   * or falls back to `#sa-status-strip`.
   */
  function initStatusStrip() {
    // Initial render
    _updateStatusStrip();

    // Clear any previous timer
    if (_statusStripTimer) clearInterval(_statusStripTimer);

    _statusStripTimer = setInterval(function () {
      _updateStatusStrip();
    }, 5000);

    console.log('[AETHER.supervisorUI] Status strip auto-refresh started (5s)');
  }

  function _updateStatusStrip() {
    var container = document.querySelector('.sa-status-strip-card')
                 || document.getElementById('sa-status-strip');
    if (!container) return;

    // Re-render the inner strip portion only
    var stripEl = container.querySelector('.sa-status-strip');
    if (stripEl) {
      // Re-generate just the strip items
      var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
      var inner = '';
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];
        var m = a.metrics || {};
        var dotColor = _statusColor(a.status);
        var lastRun  = _relativeTime(m.lastRun);

        inner += '<div class="sa-status-item" data-agent-id="' + a.id + '">';
        inner += '  <div class="sa-status-dot-wrap">';
        inner += '    <span class="sa-status-dot ' + (a.status || '').toLowerCase() + '" style="background:' + dotColor + ';box-shadow:0 0 8px ' + dotColor + '"></span>';
        inner += '  </div>';
        inner += '  <span class="sa-status-icon">' + (a.icon || '🤖') + '</span>';
        inner += '  <div class="sa-status-info">';
        inner += '    <span class="sa-status-name">' + (a.name || 'Agent') + '</span>';
        inner += '    <span class="sa-status-meta">' + _statusLabel(a.status) + ' · ' + lastRun + '</span>';
        inner += '  </div>';
        inner += '</div>';
      }
      stripEl.innerHTML = inner;
    } else {
      // Replace the whole card
      container.outerHTML = renderStatusStrip();
    }
  }

  /**
   * Set up auto-refresh of an activity feed every 3 seconds.
   *
   * @param {string} containerId — DOM id of the feed container
   * @param {number} count       — number of events to display
   */
  function initActivityFeed(containerId, count) {
    var n = count || 20;

    // Initial render
    _updateActivityFeed(containerId, n);

    // Clear any previous timer
    if (_activityFeedTimer) clearInterval(_activityFeedTimer);

    _activityFeedTimer = setInterval(function () {
      _updateActivityFeed(containerId, n);
    }, 3000);

    console.log('[AETHER.supervisorUI] Activity feed auto-refresh started (3s) → #' + containerId);
  }

  function _updateActivityFeed(containerId, count) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = renderActivityFeed(count);
  }

  // ── Public API ───────────────────────────────────────────
  return {
    renderStatusStrip:  renderStatusStrip,
    renderAgentCard:    renderAgentCard,
    renderActivityFeed: renderActivityFeed,
    renderPulseRing:    renderPulseRing,
    initStatusStrip:    initStatusStrip,
    initActivityFeed:   initActivityFeed,
    relativeTime:       _relativeTime
  };

})();
