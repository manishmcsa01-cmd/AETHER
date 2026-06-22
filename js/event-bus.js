/* ============================================================
 *  AETHER Event Bus — Central Pub/Sub & Event History
 *  ============================================================
 *  Provides platform-wide event emission, subscription, and
 *  a rolling history buffer used by dashboards & feeds.
 *  Supports auto-play mode that simulates realistic monitoring
 *  events for demonstration / development purposes.
 * ============================================================ */

window.AETHER = window.AETHER || {};

AETHER.events = (function () {
  'use strict';

  // ── Private state ────────────────────────────────────────
  var _listeners  = {};
  var _history    = [];          // rolling event history
  var MAX_HISTORY = 500;
  var _eventId    = 0;
  var _autoPlayTimer = null;

  // ── Canonical event types with visual metadata ───────────
  var EVENT_TYPES = {
    AgentDiscovered:     { icon: '🔍', color: '#3b82f6', severity: 'info'     },
    AgentUpdated:        { icon: '🔄', color: '#06b6d4', severity: 'info'     },
    AgentDeleted:        { icon: '🗑️', color: '#ef4444', severity: 'warning'  },
    AgentOnboarded:      { icon: '✅', color: '#10b981', severity: 'info'     },
    AgentOffboarded:     { icon: '❌', color: '#ef4444', severity: 'warning'  },
    OwnershipChanged:    { icon: '👤', color: '#f59e0b', severity: 'info'     },
    PolicyViolation:     { icon: '🛡️', color: '#ef4444', severity: 'critical' },
    ComplianceFailure:   { icon: '📋', color: '#f59e0b', severity: 'high'     },
    HighRiskDetected:    { icon: '⚠️', color: '#ef4444', severity: 'critical' },
    HighSpendDetected:   { icon: '💰', color: '#f59e0b', severity: 'high'     },
    ReliabilityIncident: { icon: '💓', color: '#ef4444', severity: 'high'     },
    AuditCompleted:      { icon: '🔎', color: '#8b5cf6', severity: 'info'     },
    BriefingGenerated:   { icon: '👔', color: '#0891b2', severity: 'info'     },
    HealthCheckPassed:   { icon: '💚', color: '#10b981', severity: 'info'     },
    HealthCheckFailed:   { icon: '💔', color: '#ef4444', severity: 'critical' },
    ConfigChanged:       { icon: '⚙️', color: '#6366f1', severity: 'info'     },
    AllAgentsComplete:   { icon: '🚀', color: '#10b981', severity: 'info'     },
    AgentAnalysisComplete: { icon: '📊', color: '#3b82f6', severity: 'info'   }
  };

  // ── Helpers ──────────────────────────────────────────────

  /**
   * Pick a random element from an array.
   */
  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate a random agent ID like AGT-3847.
   */
  function _randomAgentId() {
    return 'AGT-' + (1000 + Math.floor(Math.random() * 9000));
  }

  /**
   * Return a random integer between min and max (inclusive).
   */
  function _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ── Core API ─────────────────────────────────────────────

  /**
   * Emit an event to all registered listeners.
   * @param {string} type  — one of EVENT_TYPES keys
   * @param {object} data  — arbitrary payload
   * @returns {object} the event object that was emitted
   */
  function emit(type, data) {
    var meta = EVENT_TYPES[type] || { icon: '📌', color: '#94a3b8', severity: 'info' };
    var evt = {
      id:        ++_eventId,
      type:      type,
      source:    (data && data.source) || 'system',
      severity:  meta.severity,
      data:      data || {},
      timestamp: new Date().toISOString(),
      icon:      meta.icon,
      color:     meta.color
    };

    // Push to history, cap at MAX_HISTORY
    _history.push(evt);
    if (_history.length > MAX_HISTORY) {
      _history = _history.slice(_history.length - MAX_HISTORY);
    }

    // Notify specific-type listeners
    if (_listeners[type]) {
      for (var i = 0; i < _listeners[type].length; i++) {
        try { _listeners[type][i](evt); } catch (e) { console.error('[AETHER.events] listener error:', e); }
      }
    }

    // Notify wildcard listeners
    if (_listeners['*']) {
      for (var j = 0; j < _listeners['*'].length; j++) {
        try { _listeners['*'][j](evt); } catch (e) { console.error('[AETHER.events] wildcard listener error:', e); }
      }
    }

    return evt;
  }

  /**
   * Subscribe to an event type. Use '*' for all events.
   */
  function on(type, handler) {
    if (typeof handler !== 'function') {
      console.warn('[AETHER.events] handler must be a function');
      return;
    }
    if (!_listeners[type]) {
      _listeners[type] = [];
    }
    _listeners[type].push(handler);
  }

  /**
   * Unsubscribe a handler from an event type.
   */
  function off(type, handler) {
    if (!_listeners[type]) return;
    _listeners[type] = _listeners[type].filter(function (h) {
      return h !== handler;
    });
  }

  /**
   * Return the last n events from history.
   */
  function getRecent(n) {
    var count = n || 20;
    return _history.slice(-count).reverse();
  }

  /**
   * Filter history by event type.
   */
  function getByType(type) {
    return _history.filter(function (evt) {
      return evt.type === type;
    });
  }

  /**
   * Return the canonical EVENT_TYPES map.
   */
  function getEventTypes() {
    return EVENT_TYPES;
  }

  /**
   * Compute aggregate stats over the event history.
   */
  function getStats() {
    var byType     = {};
    var bySeverity = {};
    var oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    var lastHour   = 0;

    for (var i = 0; i < _history.length; i++) {
      var evt = _history[i];
      byType[evt.type]         = (byType[evt.type] || 0) + 1;
      bySeverity[evt.severity] = (bySeverity[evt.severity] || 0) + 1;
      if (evt.timestamp >= oneHourAgo) {
        lastHour++;
      }
    }

    return {
      total:      _history.length,
      byType:     byType,
      bySeverity: bySeverity,
      lastHour:   lastHour
    };
  }

  /**
   * Clear all event history.
   */
  function clear() {
    _history = [];
    _eventId = 0;
  }

  // ── Auto-play (demo simulation) ─────────────────────────

  /**
   * Template pool for realistic simulated events.
   */
  var _autoPlayTemplates = [
    function () {
      var platforms = ['GitHub Copilot', 'Amazon Q', 'ServiceNow', 'Salesforce Einstein', 'Microsoft 365 Copilot', 'Vertex AI'];
      return { type: 'AgentDiscovered', data: { source: 'Discovery Agent', description: 'New agent discovered on ' + _pick(platforms), agentId: _randomAgentId(), platform: _pick(platforms) } };
    },
    function () {
      return { type: 'HighRiskDetected', data: { source: 'Risk Agent', description: 'Agent ' + _randomAgentId() + ' flagged as High Risk — elevated privilege scope', agentId: _randomAgentId() } };
    },
    function () {
      var policies = ['PII access without DLP', 'Unencrypted data channel', 'Missing audit trail', 'Cross-tenant data flow'];
      return { type: 'PolicyViolation', data: { source: 'Governance Agent', description: 'Blocked: ' + _pick(policies), agentId: _randomAgentId() } };
    },
    function () {
      var spend = '$' + _randInt(200, 9500).toLocaleString();
      return { type: 'HighSpendDetected', data: { source: 'Cost Agent', description: 'Spend anomaly detected — ' + spend + ' above forecast', amount: spend } };
    },
    function () {
      var latency = _randInt(1200, 4500);
      return { type: 'ReliabilityIncident', data: { source: 'Reliability Agent', description: 'Latency spike: ' + latency + 'ms (threshold 1000ms)', latencyMs: latency, agentId: _randomAgentId() } };
    },
    function () {
      return { type: 'AgentOnboarded', data: { source: 'Lifecycle Agent', description: 'Agent ' + _randomAgentId() + ' successfully onboarded', agentId: _randomAgentId() } };
    },
    function () {
      return { type: 'AuditCompleted', data: { source: 'Audit Agent', description: 'Quarterly compliance audit completed — ' + _randInt(92, 100) + '% compliant' } };
    },
    function () {
      return { type: 'ComplianceFailure', data: { source: 'Compliance Agent', description: 'SOC-2 control gap detected for ' + _randomAgentId(), framework: 'SOC-2' } };
    },
    function () {
      return { type: 'HealthCheckPassed', data: { source: 'Reliability Agent', description: 'All ' + _randInt(40, 65) + ' monitored agents passed health check' } };
    },
    function () {
      return { type: 'BriefingGenerated', data: { source: 'Executive Agent', description: 'Weekly executive briefing generated — ' + _randInt(3, 8) + ' action items' } };
    },
    function () {
      return { type: 'AgentUpdated', data: { source: 'Discovery Agent', description: 'Agent ' + _randomAgentId() + ' configuration changed', agentId: _randomAgentId() } };
    }
  ];

  /**
   * Polls the backend /api/events endpoint for real monitoring events.
   * NO client-side event fabrication — all events come from the server.
   * When the server is down, polling silently fails and no events appear.
   */
  function startAutoPlay() {
    if (_autoPlayTimer) return; // Already running

    var _lastEventId = null; // Track last seen event for incremental polling

    function _pollEvents() {
      var url = 'http://localhost:3000/api/events';
      if (_lastEventId) {
        url += '?since=' + encodeURIComponent(_lastEventId);
      }

      fetch(url, { method: 'GET' })
        .then(function (res) {
          if (!res.ok) return null;
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.events) return;

          var events = data.events;
          if (events.length === 0) return;

          // Emit each new event from the server
          for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            emit(ev.type || 'ServerEvent', {
              source: ev.source || 'AETHER Server',
              description: ev.description || '',
              severity: ev.severity || 'info',
              id: ev.id,
              timestamp: ev.timestamp
            });
          }

          // Update last seen event ID
          _lastEventId = events[events.length - 1].id;
        })
        .catch(function () {
          // Server is offline — silently skip, no events emitted
        });
    }

    // Poll every 8 seconds
    _autoPlayTimer = setInterval(_pollEvents, 8000);

    // Do initial poll immediately
    _pollEvents();

    console.log('[AETHER.events] Polling /api/events from backend server');
  }

  /**
   * Stop auto-play event generation.
   */
  function stopAutoPlay() {
    if (_autoPlayTimer) {
      clearInterval(_autoPlayTimer);
      _autoPlayTimer = null;
      console.log('[AETHER.events] Polling stopped');
    }
  }

  /**
   * Check whether auto-play is currently active.
   */
  function isAutoPlaying() {
    return _autoPlayTimer !== null;
  }

  // ── Public API ───────────────────────────────────────────
  return {
    emit:           emit,
    on:             on,
    off:            off,
    getRecent:      getRecent,
    getByType:      getByType,
    getEventTypes:  getEventTypes,
    getStats:       getStats,
    clear:          clear,
    startAutoPlay:  startAutoPlay,
    stopAutoPlay:   stopAutoPlay,
    isAutoPlaying:  isAutoPlaying
  };

})();
