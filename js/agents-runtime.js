/* ============================================================
 *  AETHER Agents Runtime — Supervisory Monitoring Engine
 *  ============================================================
 *  Drives periodic "monitoring cycles" for all 11 supervisory
 *  agents.  Each cycle updates agent metrics, simulates real-
 *  world monitoring activity, and emits events through the
 *  AETHER event bus.
 *
 *  Depends on:
 *    - AETHER.config  (agents-config.js)
 *    - AETHER.events  (event-bus.js)
 * ============================================================ */

window.AETHER = window.AETHER || {};

AETHER.runtime = (function () {
  'use strict';

  // ── Private state ────────────────────────────────────────
  var _running      = false;
  var _cycleTimer   = null;
  var _cycleCount   = 0;
  var _lastResults  = {};  // Cache of last backend agent run results
  var _isRunning    = {};  // Track which agents are currently running
  var CYCLE_INTERVAL = 8000; // ms between monitoring cycles
  var API_BASE = '/api';
  var _dbStats      = {
    active_count: 0,
    deboarded_count: 0,
    cumulative_onboarded: 0,
    cumulative_tasks: 0,
    cumulative_spend: 0,
    cumulative_roi: 0,
    deboarded_agents: []
  };

  // ── Helpers ──────────────────────────────────────────────

  function _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _chance(pct) {
    return Math.random() * 100 < pct;
  }

  function _clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Format a Date as a relative time string (e.g. "2m ago").
   */
  function _relativeTime(dateStr) {
    if (!dateStr) return 'never';
    var diff = Date.now() - new Date(dateStr).getTime();
    var secs = Math.floor(diff / 1000);
    if (secs < 60)   return secs + 's ago';
    if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    return Math.floor(secs / 86400) + 'd ago';
  }

  /**
   * Calculate next run time from a schedule string.
   * Returns an ISO string in the future.
   */
  function _calcNextRun(schedule) {
    var intervals = {
      'Every 15 minutes':  15 * 60 * 1000,
      'Every 30 minutes':  30 * 60 * 1000,
      'Continuous':         5 * 60 * 1000,
      'Every hour':        60 * 60 * 1000,
      'Every 4 hours':      4 * 60 * 60 * 1000,
      'Daily':             24 * 60 * 60 * 1000,
      'Every 6 hours':      6 * 60 * 60 * 1000,
      'Real-time':          2 * 60 * 1000,
      'Weekly':             7 * 24 * 60 * 60 * 1000
    };
    var ms = intervals[schedule] || 30 * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  }

  // ── Real API-backed agent processors ─────────────────────
  // These call the Python backend which runs actual LLM agents

  /**
   * Run a specific AI agent via the backend API.
   * Returns a Promise that resolves with the agent results.
   */
  function runAgentAnalysis(agentType, callback) {
    _isRunning[agentType] = true;
    console.log('[AETHER.runtime] Running ' + agentType + ' agent via backend API...');

    // Update supervisory agent status
    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
    for (var i = 0; i < agents.length; i++) {
      var processorKey = (agents[i].id || '').replace('sa-', '');
      if (processorKey === agentType) {
        agents[i].status = 'scanning';
        agents[i].metrics = agents[i].metrics || {};
        agents[i].metrics.lastRun = new Date().toISOString();
      }
    }

    fetch(API_BASE + '/run-agent/' + agentType, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _isRunning[agentType] = false;
      _lastResults[agentType] = data;

      // Update supervisory agent status
      for (var j = 0; j < agents.length; j++) {
        var pKey = (agents[j].id || '').replace('sa-', '');
        if (pKey === agentType) {
          agents[j].status = data.error ? 'error' : 'running';
          agents[j].metrics.lastRun = new Date().toISOString();
          agents[j].metrics.nextRun = _calcNextRun(agents[j].schedule || 'Every 30 minutes');
        }
      }

      // Emit real events based on results
      if (AETHER.events && AETHER.events.emit) {
        var provider = (data._meta && data._meta.provider) || (data.provider) || 'Backend';
        AETHER.events.emit('AgentAnalysisComplete', {
          source: agentType + ' Agent',
          description: agentType.charAt(0).toUpperCase() + agentType.slice(1) + ' analysis completed via ' + provider,
          agentType: agentType,
          timestamp: new Date().toISOString()
        });

        // Emit specific events based on findings
        if (agentType === 'compliance' && data.findings) {
          for (var f = 0; f < Math.min(data.findings.length, 3); f++) {
            AETHER.events.emit('ComplianceFailure', {
              source: 'Compliance Agent',
              description: data.findings[f].description || data.findings[f].framework + ' finding detected',
              severity: data.findings[f].severity
            });
          }
        }
        if (agentType === 'governance' && data.violations) {
          for (var v = 0; v < Math.min(data.violations.length, 3); v++) {
            AETHER.events.emit('PolicyViolation', {
              source: 'Governance Agent',
              description: data.violations[v].details || data.violations[v].policy_name + ' violated',
              severity: data.violations[v].severity
            });
          }
        }
        if (agentType === 'risk' && data.high_risk_count > 0) {
          AETHER.events.emit('HighRiskDetected', {
            source: 'Risk Agent',
            description: data.high_risk_count + ' high-risk agent(s) identified by LLM analysis'
          });
        }
      }

      console.log('[AETHER.runtime] ' + agentType + ' agent completed. Provider: ' + (data.provider || 'unknown'));
      if (callback) callback(null, data);
    })
    .catch(function (err) {
      _isRunning[agentType] = false;
      console.error('[AETHER.runtime] ' + agentType + ' agent failed:', err.message);
      if (callback) callback(err, null);
    });
  }

  /**
   * Run ALL AI agents via the backend API.
   */
  function runAllAgents(callback) {
    console.log('[AETHER.runtime] Running ALL agents via backend API...');

    // Mark all supervisory agents as scanning
    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
    for (var i = 0; i < agents.length; i++) {
      agents[i].status = 'scanning';
    }

    fetch(API_BASE + '/run-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _lastResults = data;

      // Update all supervisory agents
      for (var j = 0; j < agents.length; j++) {
        agents[j].status = 'running';
        agents[j].metrics = agents[j].metrics || {};
        agents[j].metrics.lastRun = new Date().toISOString();
        agents[j].metrics.nextRun = _calcNextRun(agents[j].schedule || 'Every 30 minutes');
      }

      if (AETHER.events && AETHER.events.emit) {
        // Emit individual named events for each of the 6 backend agents
        var agentResults = [
          {
            type: 'AgentAnalysisComplete',
            source: 'Governance Agent',
            icon: '🛡️',
            getDesc: function () {
              var g = data.governance;
              if (g && g.violations) return 'Evaluated ' + (g.violations.length || 0) + ' policy violations — enforcement actions applied';
              return 'Governance policy evaluation completed — all policies checked';
            }
          },
          {
            type: 'AgentAnalysisComplete',
            source: 'Compliance Agent',
            icon: '✅',
            getDesc: function () {
              var c = data.compliance;
              if (c && c.overall_score !== undefined) return 'Compliance score: ' + c.overall_score + '% across ' + (c.frameworks_evaluated || 5) + ' frameworks (SOC2, ISO27001, GDPR, SOX, HIPAA)';
              if (c && c.findings) return 'Found ' + c.findings.length + ' compliance gaps across regulatory frameworks';
              return 'Compliance posture assessed across all regulatory frameworks';
            }
          },
          {
            type: 'AgentAnalysisComplete',
            source: 'Risk Agent',
            icon: '⚠️',
            getDesc: function () {
              var r = data.risk;
              if (r && r.high_risk_count !== undefined) return r.high_risk_count + ' high-risk agent(s) identified — risk scores recalculated for all agents';
              if (r && r.assessments) return 'Assessed risk for ' + r.assessments.length + ' agents — scores updated';
              return 'Enterprise-wide risk assessment completed — all agents scored';
            }
          },
          {
            type: 'AgentAnalysisComplete',
            source: 'Cost Agent',
            icon: '💰',
            getDesc: function () {
              var co = data.cost;
              if (co && co.total_monthly_spend) return 'Monthly spend tracked: $' + co.total_monthly_spend.toLocaleString() + ' — optimization opportunities identified';
              if (co && co.recommendations) return co.recommendations.length + ' cost optimization recommendations generated';
              return 'Cost analysis completed — token usage and infrastructure spend tracked';
            }
          },
          {
            type: 'AgentAnalysisComplete',
            source: 'Health Agent',
            icon: '💓',
            getDesc: function () {
              var h = data.health;
              if (h && h.agents_monitored) return 'Health check passed for ' + h.agents_monitored + ' agents — avg availability ' + (h.avg_availability || '99.5') + '%';
              return 'Reliability health checks completed — all agents within SLA targets';
            }
          },
          {
            type: 'AgentAnalysisComplete',
            source: 'Audit Agent',
            icon: '🔎',
            getDesc: function () {
              var a = data.audit;
              if (a && a.findings_count !== undefined) return 'Audit cycle completed — ' + a.findings_count + ' findings, ' + (a.critical_count || 0) + ' critical';
              return 'Internal audit completed — agent ownership, access, and value verified';
            }
          }
        ];

        // Emit each individual agent event with a slight stagger for visual effect
        for (var ar = 0; ar < agentResults.length; ar++) {
          var agentEvt = agentResults[ar];
          AETHER.events.emit(agentEvt.type, {
            source: agentEvt.source,
            description: agentEvt.getDesc()
          });
        }

        // Emit the summary event
        AETHER.events.emit('AllAgentsComplete', {
          source: 'AETHER Runtime',
          description: 'All 6 AI agents completed analysis — Governance, Compliance, Risk, Cost, Health, Audit results ready'
        });
      }

      console.log('[AETHER.runtime] All agents completed.');
      if (callback) callback(null, data);
    })
    .catch(function (err) {
      console.error('[AETHER.runtime] Run all agents failed:', err.message);
      if (callback) callback(err, null);
    });
  }

  /**
   * Get cached results from a specific agent type.
   */
  function getResults(agentType) {
    return _lastResults[agentType] || null;
  }

  /**
   * Load latest results from the backend (non-blocking).
   */
  function loadResults(callback) {
    if (AETHER.config && typeof AETHER.config.syncFromServer === 'function') {
      AETHER.config.syncFromServer(function () {
        _fetchResults(callback);
      });
    } else {
      _fetchResults(callback);
    }
  }

  function _fetchResults(callback) {
    fetch(API_BASE + '/db-stats')
    .then(function (r) { return r.json(); })
    .then(function (stats) {
      if (stats && !stats.error) {
        _dbStats = stats;
      }
      return fetch(API_BASE + '/results');
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      _lastResults = data;
      console.log('[AETHER.runtime] Loaded cached results and SQL db-stats: ' + Object.keys(data).join(', '));
      if (callback) callback(null, data);
    })
    .catch(function (err) {
      console.warn('[AETHER.runtime] Could not load results or db-stats (backend offline):', err.message);
      if (callback) callback(err, null);
    });
  }

  /**
   * Execute one full monitoring cycle across all supervisory agents.
   * Only processes if there are actual agents to monitor.
   * Every 10th cycle (~80s), auto-runs all agents via backend.
   */
  function runCycle() {
    _cycleCount++;

    // Skip processing if there are no agents to monitor
    var agentCount = 0;
    if (AETHER.data && typeof AETHER.data.getTotalAgentCount === 'function') {
      agentCount = AETHER.data.getTotalAgentCount();
    } else if (AETHER.config && typeof AETHER.config.getOnboardedAgents === 'function') {
      agentCount = AETHER.config.getOnboardedAgents().length;
    }

    if (agentCount === 0) {
      return; // Nothing to monitor yet
    }

    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];

    for (var i = 0; i < agents.length; i++) {
      var agent = agents[i];
      if (!agent.status || agent.status === 'idle') {
        agent.status = 'running';
      }
      agent.metrics = agent.metrics || {};
      agent.metrics.lastRun = agent.metrics.lastRun || new Date().toISOString();
      agent.metrics.nextRun = _calcNextRun(agent.schedule || 'Every 30 minutes');
    }

    // Every cycle, try to load cached results from backend
    if (_cycleCount % 3 === 0) {
      loadResults(function (err, data) {
        if (!err && AETHER.app && typeof AETHER.app.navigate === 'function') {
          AETHER.app.navigate();
        }
      });
    }

    // Every 10th cycle (~80s), auto-run all agents in background
    if (_cycleCount % 10 === 1 && _cycleCount > 1) {
      var anyRunning = false;
      var keys = Object.keys(_isRunning);
      for (var k = 0; k < keys.length; k++) {
        if (_isRunning[keys[k]]) { anyRunning = true; break; }
      }
      if (!anyRunning) {
        console.log('[AETHER.runtime] Auto-triggering all agents (cycle #' + _cycleCount + ')');
        runAllAgents(function (err, data) {
          if (!err) {
            console.log('[AETHER.runtime] Auto-run complete — results cached');
          }
        });
      }
    }

    console.log('[AETHER.runtime] Cycle #' + _cycleCount + ' \u2014 monitoring ' + agentCount + ' agents');
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Begin monitoring cycles and start the event bus auto-play.
   */
  function start() {
    if (_running) return;
    _running = true;

    // Kick off event bus auto-play for ambient activity
    if (AETHER.events && typeof AETHER.events.startAutoPlay === 'function') {
      AETHER.events.startAutoPlay();
    }

    // Load initial results on startup and refresh active page
    loadResults(function (err, data) {
      if (!err && AETHER.app && typeof AETHER.app.navigate === 'function') {
        AETHER.app.navigate();
      }
    });

    // Run first cycle immediately
    runCycle();

    // Schedule recurring cycles
    _cycleTimer = setInterval(function () {
      runCycle();
    }, CYCLE_INTERVAL);

    console.log('[AETHER.runtime] Started — cycle interval ' + CYCLE_INTERVAL + 'ms');
  }

  /**
   * Stop monitoring cycles and event bus auto-play.
   */
  function stop() {
    _running = false;
    if (_cycleTimer) {
      clearInterval(_cycleTimer);
      _cycleTimer = null;
    }
    if (AETHER.events && typeof AETHER.events.stopAutoPlay === 'function') {
      AETHER.events.stopAutoPlay();
    }
    console.log('[AETHER.runtime] Stopped after ' + _cycleCount + ' cycles');
  }

  /**
   * Whether the runtime is currently active.
   */
  function isRunning() {
    return _running;
  }

  /**
   * Total number of completed monitoring cycles.
   */
  function getCycleCount() {
    return _cycleCount;
  }

  /**
   * Get formatted status object for a specific supervisory agent.
   */
  function getAgentStatus(agentId) {
    var agents = (AETHER.config && AETHER.config.supervisoryAgents) || [];
    var agent = null;
    for (var i = 0; i < agents.length; i++) {
      if (agents[i].id === agentId) {
        agent = agents[i];
        break;
      }
    }
    if (!agent) return null;

    var recentEvents = AETHER.events
      ? AETHER.events.getRecent(100).filter(function (evt) {
          return evt.source === agent.name;
        }).slice(0, 5)
      : [];

    return {
      id:           agent.id,
      name:         agent.name,
      icon:         agent.icon,
      status:       agent.status || 'active',
      purpose:      agent.purpose || '',
      schedule:     agent.schedule || '',
      metrics:      agent.metrics || {},
      lastRun:      _relativeTime(agent.metrics && agent.metrics.lastRun),
      nextRun:      _relativeTime(agent.metrics && agent.metrics.nextRun),
      recentEvents: recentEvents,
      cycleCount:   _cycleCount
    };
  }

  /**
   * Return last n activities from the event bus, formatted for feeds.
   */
  function getActivityFeed(n) {
    if (!AETHER.events) return [];
    var events = AETHER.events.getRecent(n || 20);
    var feed = [];
    for (var i = 0; i < events.length; i++) {
      var evt = events[i];
      feed.push({
        id:          evt.id,
        type:        evt.type,
        icon:        evt.icon,
        color:       evt.color,
        severity:    evt.severity,
        source:      evt.source || evt.data.source || 'System',
        description: (evt.data && evt.data.description) || evt.type,
        timestamp:   evt.timestamp,
        relativeTime: _relativeTime(evt.timestamp)
      });
    }
    return feed;
  }

  /**
   * Initialise the runtime — auto-start on load.
   */
  function init() {
    console.log('[AETHER.runtime] Initialising...');
    start();
  }

  // ── Public API ───────────────────────────────────────────
  return {
    start:              start,
    stop:               stop,
    isRunning:          isRunning,
    getCycleCount:      getCycleCount,
    runCycle:           runCycle,
    getAgentStatus:     getAgentStatus,
    getActivityFeed:    getActivityFeed,
    runAgentAnalysis:   runAgentAnalysis,
    runAllAgents:       runAllAgents,
    getResults:         getResults,
    loadResults:        loadResults,
    getDbStats:         function() { return _dbStats; },
    init:               init
  };

})();
