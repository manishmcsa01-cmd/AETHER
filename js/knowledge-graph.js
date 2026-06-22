/* ═══════════════════════════════════════════════════════════════
   AETHER Knowledge Graph
   Enterprise AI Workforce Platform — Force-Directed Graph
   Interactive canvas-based visualization of agent relationships
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};

// ─── Knowledge Graph Component (reusable) ──────────────────
AETHER.knowledgeGraph = (function () {
  'use strict';

  // ── State ────────────────────────────────────────────────
  var nodes = [];
  var edges = [];
  var canvas = null;
  var ctx = null;
  var container = null;
  var tooltipEl = null;
  var animId = null;
  var running = false;

  // Interaction state
  var hoveredNode = null;
  var selectedNode = null;
  var dragNode = null;
  var isDragging = false;
  var isPanning = false;
  var panStart = { x: 0, y: 0 };

  // View transform
  var offsetX = 0;
  var offsetY = 0;
  var scale = 1.0;

  // Filter state (which node types are visible)
  var visibleTypes = {
    Agent: true,
    User: true,
    Department: true,
    Platform: true,
    Policy: true,
    BusinessFunction: true
  };

  // ── Node Type Config ─────────────────────────────────────
  var NODE_TYPES = {
    Agent:            { color: '#3b82f6', radius: 6 },
    User:             { color: '#10b981', radius: 5 },
    Department:       { color: '#8b5cf6', radius: 8 },
    Platform:         { color: '#06b6d4', radius: 8 },
    Policy:           { color: '#f59e0b', radius: 5 },
    BusinessFunction: { color: '#ec4899', radius: 5 }
  };

  // ── Build Graph Data (live agents only) ──────────────────
  function buildGraphData() {
    nodes = [];
    edges = [];

    var d = AETHER.data;

    // Only use live onboarded agents — NO fallback to mock d.agents
    var allAgents = (d && typeof d.getAllAgents === 'function') ? d.getAllAgents() : [];

    // If no agents, leave nodes/edges empty — render will show empty state
    if (!allAgents || allAgents.length === 0) {
      return;
    }

    // Derive departments, platforms, and owners from actual agent data
    var deptSet = {};
    var platSet = {};
    var ownerSet = {};

    for (var si = 0; si < allAgents.length; si++) {
      var ag = allAgents[si];
      if (ag.department) deptSet[ag.department] = true;
      if (ag.platform) platSet[ag.platform] = ag.platformColor || NODE_TYPES.Platform.color;
      if (ag.owner) ownerSet[ag.owner] = true;
    }

    // Node index maps for edge creation
    var nodeMap = {};
    var nodeIdx = 0;

    // ── Department Nodes (derived from agents) ─────────────
    var deptNames = Object.keys(deptSet);
    for (var di = 0; di < deptNames.length; di++) {
      nodeMap['dept-' + deptNames[di]] = nodeIdx;
      nodes.push({
        id: 'dept-' + deptNames[di],
        label: deptNames[di],
        type: 'Department',
        color: NODE_TYPES.Department.color,
        radius: NODE_TYPES.Department.radius,
        x: 0, y: 0, vx: 0, vy: 0
      });
      nodeIdx++;
    }

    // ── Platform Nodes (derived from agents) ───────────────
    var platNames = Object.keys(platSet);
    for (var pi = 0; pi < platNames.length; pi++) {
      nodeMap['plat-' + platNames[pi]] = nodeIdx;
      nodes.push({
        id: 'plat-' + platNames[pi],
        label: platNames[pi],
        type: 'Platform',
        color: platSet[platNames[pi]] || NODE_TYPES.Platform.color,
        radius: NODE_TYPES.Platform.radius,
        x: 0, y: 0, vx: 0, vy: 0
      });
      nodeIdx++;
    }

    // ── Agent Nodes (ALL onboarded — no cap) ───────────────
    for (var ai = 0; ai < allAgents.length; ai++) {
      var agent = allAgents[ai];
      nodeMap['agent-' + agent.id] = nodeIdx;
      nodes.push({
        id: 'agent-' + agent.id,
        label: agent.name,
        type: 'Agent',
        color: NODE_TYPES.Agent.color,
        radius: NODE_TYPES.Agent.radius,
        x: 0, y: 0, vx: 0, vy: 0,
        data: agent
      });
      nodeIdx++;
    }

    // ── User Nodes (owners derived from agents) ────────────
    var ownerNames = Object.keys(ownerSet);
    for (var oi = 0; oi < ownerNames.length; oi++) {
      nodeMap['user-' + ownerNames[oi]] = nodeIdx;
      nodes.push({
        id: 'user-' + ownerNames[oi],
        label: ownerNames[oi],
        type: 'User',
        color: NODE_TYPES.User.color,
        radius: NODE_TYPES.User.radius,
        x: 0, y: 0, vx: 0, vy: 0
      });
      nodeIdx++;
    }

    // ── Create Edges ───────────────────────────────────────
    for (var ei = 0; ei < allAgents.length; ei++) {
      var edgeAg = allAgents[ei];
      var agIdx = nodeMap['agent-' + edgeAg.id];

      // Agent → Department
      var deptIdx = nodeMap['dept-' + edgeAg.department];
      if (deptIdx !== undefined) {
        edges.push({ source: agIdx, target: deptIdx, type: 'BelongsTo' });
      }

      // Agent → User (owner)
      var userIdx = nodeMap['user-' + edgeAg.owner];
      if (userIdx !== undefined) {
        edges.push({ source: agIdx, target: userIdx, type: 'OwnedBy' });
      }

      // Agent → Platform
      var platIdx = nodeMap['plat-' + edgeAg.platform];
      if (platIdx !== undefined) {
        edges.push({ source: agIdx, target: platIdx, type: 'RunsOn' });
      }
    }

    // ── Initialize positions randomly ──────────────────────
    var w = canvas ? canvas.width : 800;
    var h = canvas ? canvas.height : 600;
    for (var ni = 0; ni < nodes.length; ni++) {
      nodes[ni].x = w * 0.2 + Math.random() * w * 0.6;
      nodes[ni].y = h * 0.2 + Math.random() * h * 0.6;
    }
  }

  // ── Physics Simulation ───────────────────────────────────
  function simulate() {
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var totalEnergy = 0;

    // Center gravity
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n === dragNode) continue;
      n.vx += (centerX - n.x) * 0.01;
      n.vy += (centerY - n.y) * 0.01;
    }

    // Node repulsion (Coulomb's law)
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var na = nodes[a];
        var nb = nodes[b];
        var dx = na.x - nb.x;
        var dy = na.y - nb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) dist = 10;
        var force = 500 / (dist * dist);
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        if (na !== dragNode) { na.vx += fx; na.vy += fy; }
        if (nb !== dragNode) { nb.vx -= fx; nb.vy -= fy; }
      }
    }

    // Edge springs (Hooke's law)
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var ns = nodes[edge.source];
      var nt = nodes[edge.target];
      if (!ns || !nt) continue;
      var ex = nt.x - ns.x;
      var ey = nt.y - ns.y;
      var eDist = Math.sqrt(ex * ex + ey * ey);
      if (eDist < 1) eDist = 1;
      var springForce = 0.005 * (eDist - 80);
      var sfx = (ex / eDist) * springForce;
      var sfy = (ey / eDist) * springForce;
      if (ns !== dragNode) { ns.vx += sfx; ns.vy += sfy; }
      if (nt !== dragNode) { nt.vx -= sfx; nt.vy -= sfy; }
    }

    // Velocity damping + position update
    for (var u = 0; u < nodes.length; u++) {
      var nd = nodes[u];
      if (nd === dragNode) { nd.vx = 0; nd.vy = 0; continue; }
      nd.vx *= 0.92;
      nd.vy *= 0.92;
      nd.x += nd.vx;
      nd.y += nd.vy;
      totalEnergy += nd.vx * nd.vx + nd.vy * nd.vy;
    }

    return totalEnergy;
  }

  // ── Rendering ────────────────────────────────────────────
  function renderEmptyState() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#7a85a0';
    ctx.fillText('No agents onboarded yet. Add agents to see the knowledge graph.', cx, cy);
    ctx.restore();
  }

  function render() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Empty state when no nodes
    if (nodes.length === 0) {
      renderEmptyState();
      return;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw edges
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var ns = nodes[edge.source];
      var nt = nodes[edge.target];
      if (!ns || !nt) continue;
      if (!visibleTypes[ns.type] || !visibleTypes[nt.type]) continue;

      var isHighlighted = hoveredNode &&
        (hoveredNode === ns || hoveredNode === nt);

      ctx.beginPath();
      ctx.moveTo(ns.x, ns.y);
      ctx.lineTo(nt.x, nt.y);
      ctx.strokeStyle = isHighlighted
        ? 'rgba(255, 255, 255, 0.6)'
        : 'rgba(100, 120, 180, 0.15)';
      ctx.lineWidth = isHighlighted ? 1.5 / scale : 0.5 / scale;
      ctx.stroke();
    }

    // Draw nodes
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n];
      if (!visibleTypes[node.type]) continue;

      var isHovered = node === hoveredNode;
      var isSelected = node === selectedNode;
      var r = node.radius / scale;

      // Glow effect
      ctx.save();
      ctx.shadowBlur = isHovered ? 20 : 8;
      ctx.shadowColor = node.color;

      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? r * 1.5 : r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      ctx.restore();

      // Draw labels for Department & Platform nodes
      if (node.type === 'Department' || node.type === 'Platform') {
        ctx.font = (9 / scale) + 'px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + r + 12 / scale);
      }
    }

    ctx.restore();
  }

  // ── Animation Loop ───────────────────────────────────────
  function tick() {
    var energy = simulate();
    render();

    if (energy < 0.1 && !dragNode && !isPanning) {
      running = false;
      return;
    }

    animId = requestAnimationFrame(tick);
  }

  function startSimulation() {
    if (running) return;
    running = true;
    tick();
  }

  function stopSimulation() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // ── Hit Testing ──────────────────────────────────────────
  function getNodeAtPos(mx, my) {
    // Convert mouse to graph coordinates
    var gx = (mx - offsetX) / scale;
    var gy = (my - offsetY) / scale;

    var closest = null;
    var closestDist = 15 / scale;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!visibleTypes[node.type]) continue;
      var dx = gx - node.x;
      var dy = gy - node.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    }
    return closest;
  }

  // ── Tooltip ──────────────────────────────────────────────
  function showTooltip(node, mx, my) {
    if (!tooltipEl) return;
    // Count connections
    var connections = 0;
    for (var e = 0; e < edges.length; e++) {
      var idx = nodes.indexOf(node);
      if (edges[e].source === idx || edges[e].target === idx) connections++;
    }

    tooltipEl.innerHTML =
      '<div style="font-weight: 600; color: #e8ecf4; margin-bottom: 4px;">' + node.label + '</div>' +
      '<div style="color: ' + node.color + '; font-size: 11px; margin-bottom: 4px;">' + node.type + '</div>' +
      '<div style="color: #7a85a0; font-size: 11px;">' + connections + ' connections</div>';

    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (mx + 15) + 'px';
    tooltipEl.style.top = (my - 10) + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // ── Event Handlers ───────────────────────────────────────
  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    if (isDragging && dragNode) {
      dragNode.x = (mx - offsetX) / scale;
      dragNode.y = (my - offsetY) / scale;
      if (!running) { render(); }
      return;
    }

    if (isPanning) {
      offsetX += e.clientX - panStart.x;
      offsetY += e.clientY - panStart.y;
      panStart.x = e.clientX;
      panStart.y = e.clientY;
      if (!running) { render(); }
      return;
    }

    var node = getNodeAtPos(mx, my);
    if (node !== hoveredNode) {
      hoveredNode = node;
      canvas.style.cursor = node ? 'pointer' : 'default';
      if (node) {
        showTooltip(node, mx, my);
      } else {
        hideTooltip();
      }
      if (!running) render();
    } else if (node) {
      showTooltip(node, mx, my);
    }
  }

  function onMouseDown(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var node = getNodeAtPos(mx, my);
    if (node) {
      dragNode = node;
      isDragging = true;
      selectedNode = node;
      console.log('[AETHER KG] Selected:', node.type, '—', node.label);
      startSimulation();
    } else {
      isPanning = true;
      panStart.x = e.clientX;
      panStart.y = e.clientY;
    }
  }

  function onMouseUp() {
    dragNode = null;
    isDragging = false;
    isPanning = false;
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newScale = scale * delta;
    if (newScale < 0.3) newScale = 0.3;
    if (newScale > 3.0) newScale = 3.0;

    // Zoom toward mouse position
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    offsetX = mx - (mx - offsetX) * (newScale / scale);
    offsetY = my - (my - offsetY) * (newScale / scale);

    scale = newScale;
    if (!running) render();
  }

  function onClick(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var node = getNodeAtPos(mx, my);
    if (node) {
      selectedNode = node;
      if (!running) render();
    }
  }

  // ── Public API ───────────────────────────────────────────
  return {
    create: function (containerId, options) {
      container = document.getElementById(containerId);
      if (!container) {
        console.warn('[AETHER KG] Container not found:', containerId);
        return;
      }

      // Create canvas
      canvas = document.getElementById('kg-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'kg-canvas';
        container.appendChild(canvas);
      }

      // Size canvas to container
      canvas.width = container.clientWidth || 800;
      canvas.height = container.clientHeight || 600;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.borderRadius = '8px';
      canvas.style.background = 'rgba(10, 14, 26, 0.6)';

      ctx = canvas.getContext('2d');

      // Create tooltip element
      tooltipEl = document.getElementById('kg-tooltip');
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'kg-tooltip';
        tooltipEl.style.cssText = 'position:absolute;display:none;background:#1a1f3a;border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:10px;color:#e8ecf4;font-size:12px;pointer-events:none;z-index:1000;white-space:nowrap;';
        container.appendChild(tooltipEl);
      }

      // Reset view transform
      offsetX = 0;
      offsetY = 0;
      scale = 1.0;

      // Build graph data & start simulation
      buildGraphData();

      // Bind events
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseUp);
      canvas.addEventListener('click', onClick);
      canvas.addEventListener('wheel', onWheel, { passive: false });

      // Handle resize
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (container && canvas) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            if (!running) render();
          }
        }, 200);
      });

      // If no nodes (0 agents), render empty state and skip simulation
      if (nodes.length === 0) {
        renderEmptyState();
        console.log('[AETHER KG] No agents onboarded — showing empty state');
      } else {
        startSimulation();
        console.log('[AETHER KG] Knowledge graph created with ' + nodes.length + ' nodes and ' + edges.length + ' edges');
      }
    },

    destroy: function () {
      stopSimulation();
      if (canvas) {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('wheel', onWheel);
      }
      nodes = [];
      edges = [];
      hoveredNode = null;
      selectedNode = null;
      dragNode = null;
    },

    refresh: function () {
      buildGraphData();
      startSimulation();
    },

    setFilter: function (type, visible) {
      visibleTypes[type] = visible;
      if (!running) render();
    },

    getNodes: function () { return nodes; },
    getEdges: function () { return edges; }
  };
})();

// ─── Page Wrapper ──────────────────────────────────────────
AETHER.pages = AETHER.pages || {};

AETHER.pages.knowledgegraph = {

  render: function () {
    var html = '<div class="page-content">';

    /* ── Page Header ──────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left">' +
        '<h1 class="page-title">Knowledge Graph</h1>' +
        '<p class="page-subtitle">AI Workforce Digital Twin — visualize relationships across agents, owners, departments, and platforms</p>' +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-secondary" id="kg-refresh-btn">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M2 8a6 6 0 0 1 10.3-4.2"/>' +
            '<path d="M14 8a6 6 0 0 1-10.3 4.2"/>' +
            '<polyline points="12,2 14,4 12,6"/>' +
            '<polyline points="4,10 2,12 4,14"/>' +
          '</svg>' +
          ' Refresh' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── Filter Toggles ───────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-1" style="margin-bottom: 20px;">' +
      '<div class="card-body" style="padding: 12px 20px;">' +
        '<div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">' +
          '<span style="color: #7a85a0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Filter:</span>';

    var filterTypes = [
      { type: 'Agent', color: '#3b82f6', label: 'Agents' },
      { type: 'User', color: '#10b981', label: 'Users' },
      { type: 'Department', color: '#8b5cf6', label: 'Departments' },
      { type: 'Platform', color: '#06b6d4', label: 'Platforms' },
      { type: 'Policy', color: '#f59e0b', label: 'Policies' },
      { type: 'BusinessFunction', color: '#ec4899', label: 'Business Functions' }
    ];

    for (var f = 0; f < filterTypes.length; f++) {
      var ft = filterTypes[f];
      html += '<label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: #e8ecf4;">' +
        '<input type="checkbox" class="kg-filter-checkbox" data-type="' + ft.type + '" checked ' +
          'style="accent-color: ' + ft.color + '; width: 14px; height: 14px;">' +
        '<span style="width: 10px; height: 10px; border-radius: 50%; background: ' + ft.color + '; display: inline-block;"></span>' +
        ft.label +
      '</label>';
    }

    html += '</div></div></div>';

    /* ── Canvas Container ─────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-2" style="margin-bottom: 20px; overflow: hidden;">' +
      '<div id="kg-container" style="width: 100%; height: 600px; position: relative; background: rgba(10,14,26,0.4); border-radius: 8px;">' +
        '<canvas id="kg-canvas"></canvas>' +
      '</div>' +
    '</div>';

    /* ── Legend ────────────────────────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-3">' +
      '<div class="card-body" style="padding: 14px 20px;">' +
        '<div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center;">';

    // Compute dynamic legend counts from live agent data
    var kgAllAgents = (AETHER.data && typeof AETHER.data.getAllAgents === 'function') ? AETHER.data.getAllAgents() : [];
    var kgDeptSet = {};
    var kgPlatSet = {};
    var kgOwnerSet = {};
    for (var lc = 0; lc < kgAllAgents.length; lc++) {
      if (kgAllAgents[lc].department) kgDeptSet[kgAllAgents[lc].department] = true;
      if (kgAllAgents[lc].platform) kgPlatSet[kgAllAgents[lc].platform] = true;
      if (kgAllAgents[lc].owner) kgOwnerSet[kgAllAgents[lc].owner] = true;
    }

    var legendItems = [
      { color: '#3b82f6', label: 'Agent', count: String(kgAllAgents.length) },
      { color: '#10b981', label: 'User / Owner', count: String(Object.keys(kgOwnerSet).length) },
      { color: '#8b5cf6', label: 'Department', count: String(Object.keys(kgDeptSet).length) },
      { color: '#06b6d4', label: 'Platform', count: String(Object.keys(kgPlatSet).length) }
    ];

    for (var l = 0; l < legendItems.length; l++) {
      var li = legendItems[l];
      html += '<div style="display: flex; align-items: center; gap: 6px;">' +
        '<div style="width: 12px; height: 12px; border-radius: 50%; background: ' + li.color + '; box-shadow: 0 0 6px ' + li.color + ';"></div>' +
        '<span style="color: #e8ecf4; font-size: 12px;">' + li.label + '</span>' +
        '<span style="color: #4a5470; font-size: 11px;">(' + li.count + ')</span>' +
      '</div>';
    }

    html += '</div></div></div>';

    /* ── Interaction Tips ─────────────────────────────────── */
    html += '<div class="animate-fade-in-up stagger-4" style="text-align: center; margin-top: 8px;">' +
      '<span style="color: #4a5470; font-size: 11px;">' +
        '🖱️ Hover for details • Click to select • Drag to reposition • Scroll to zoom • Drag empty space to pan' +
      '</span>' +
    '</div>';

    html += '</div>'; /* close page-content */
    return html;
  },

  init: function () {
    var c = AETHER.charts;
    if (c) c.destroyAll();

    // ── Initialize the Knowledge Graph ─────────────────────
    setTimeout(function () {
      AETHER.knowledgeGraph.create('kg-container');

      // ── Filter Checkbox Handlers ─────────────────────────
      var checkboxes = document.querySelectorAll('.kg-filter-checkbox');
      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', function () {
          var type = this.getAttribute('data-type');
          AETHER.knowledgeGraph.setFilter(type, this.checked);
        });
      }

      // ── Refresh Button ───────────────────────────────────
      var refreshBtn = document.getElementById('kg-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
          AETHER.knowledgeGraph.refresh();
        });
      }
    }, 100);

    console.log('[AETHER] Knowledge Graph page initialized');
  }
};
