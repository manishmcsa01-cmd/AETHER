/* ═══════════════════════════════════════════════════════════════
   AETHER Integrations Hub
   Enterprise AI Workforce Platform — Connector & SDK Management
   Platform connectors, SDK registration, and API management
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.integrations = {

  render: function () {
    var d = AETHER.data;
    var cfg = AETHER.config;
    var connectors = (cfg && cfg.platformConnectors) ? cfg.platformConnectors : [];
    var copilot = (cfg && cfg.microsoftCopilot) ? cfg.microsoftCopilot : null;
    var methods = (cfg && cfg.monitoringMethods) ? cfg.monitoringMethods : {};

    var html = '<div class="page-content">';

    /* ── Page Header ──────────────────────────────────────── */
    html += '<div class="page-header animate-fade-in-up">' +
      '<div class="page-header-left">' +
        '<h1 class="page-title">Integrations Hub</h1>' +
        '<p class="page-subtitle">Platform connectors, SDK registration, and API management</p>' +
      '</div>' +
      '<div class="page-header-actions">' +
        '<button class="btn btn-primary" id="intg-add-connector-btn">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<line x1="8" y1="3" x2="8" y2="13"/>' +
            '<line x1="3" y1="8" x2="13" y2="8"/>' +
          '</svg>' +
          ' Add Connector' +
        '</button>' +
      '</div>' +
    '</div>';

    /* ── KPI Grid — 4 Cards ──────────────────────────── */
    var kpi = (d && typeof d.computeKPIs === 'function') ? d.computeKPIs() : {};
    var totalAgents = (d && typeof d.getTotalAgentCount === 'function') ? d.getTotalAgentCount() : 0;
    var connectedPlatforms = connectors.length;
    var agentsDiscovered = totalAgents;
    var activeWebhooks = (kpi.totalAgents || 0) > 0 ? connectors.length : 0;
    var sdkRegistrations = totalAgents;
    var agentsTrend = totalAgents > 0 ? ('\u2191 ' + totalAgents + ' onboarded') : 'None yet';
    var webhookTrend = activeWebhooks > 0 ? 'All Healthy' : 'No agents';
    var sdkTrend = sdkRegistrations > 0 ? (sdkRegistrations + ' registered') : 'None yet';

    html += '<div class="kpi-grid">' +

      /* Connected Platforms */
      '<div class="kpi-card animate-fade-in-up stagger-1" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" style="cursor: pointer;" title="Click to view discovery coverage rationale">' +
        '<div class="kpi-card-accent" style="background: #10b981;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon green">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<rect x="2" y="2" width="6" height="6" rx="1"/>' +
              '<rect x="12" y="2" width="6" height="6" rx="1"/>' +
              '<rect x="2" y="12" width="6" height="6" rx="1"/>' +
              '<rect x="12" y="12" width="6" height="6" rx="1"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend up">All Active</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + connectedPlatforms + '</div>' +
        '<div class="kpi-label">Connected Platforms</div>' +
      '</div>' +

      /* Agents Discovered */
      '<div class="kpi-card animate-fade-in-up stagger-2" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view total agents rationale">' +
        '<div class="kpi-card-accent" style="background: #3b82f6;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon blue">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<circle cx="8" cy="7" r="3"/>' +
              '<path d="M1 17c0-3 3-5 7-5s7 2 7 5"/>' +
              '<circle cx="15" cy="6" r="2"/>' +
              '<path d="M16 11c2 0 3 1.5 3 3"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend up">' + agentsTrend + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + agentsDiscovered + '</div>' +
        '<div class="kpi-label">Agents Discovered</div>' +
      '</div>' +

      /* Active Webhooks */
      '<div class="kpi-card animate-fade-in-up stagger-3" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" style="cursor: pointer;" title="Click to view discovery coverage rationale">' +
        '<div class="kpi-card-accent" style="background: #8b5cf6;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon purple">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M4 4l6 6-6 6"/>' +
              '<line x1="10" y1="16" x2="18" y2="16"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend up">' + webhookTrend + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + activeWebhooks + '</div>' +
        '<div class="kpi-label">Active Webhooks</div>' +
      '</div>' +

      /* SDK Registrations */
      '<div class="kpi-card animate-fade-in-up stagger-4" onclick="window.location.hash=\'#rationale/totalAgents\'" style="cursor: pointer;" title="Click to view total agents rationale">' +
        '<div class="kpi-card-accent" style="background: #06b6d4;"></div>' +
        '<div class="kpi-card-header">' +
          '<div class="kpi-card-icon cyan">' +
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M6 4l-4 6 4 6"/>' +
              '<path d="M14 4l4 6-4 6"/>' +
              '<line x1="12" y1="2" x2="8" y2="18"/>' +
            '</svg>' +
          '</div>' +
          '<span class="kpi-trend up">' + sdkTrend + '</span>' +
        '</div>' +
        '<div class="kpi-value tabular-nums">' + sdkRegistrations + '</div>' +
        '<div class="kpi-label">SDK Registrations</div>' +
      '</div>' +

    '</div>';

    /* ── Platform Connectors Grid ─────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-5" style="margin-bottom: 24px;">' +
      '<div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">🔌 Platform Connectors</h3>' +
        '<span class="badge badge-success">' + connectors.length + ' connected</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="grid-4">';

    for (var i = 0; i < connectors.length; i++) {
      var conn = connectors[i];
      var statusClass = conn.status === 'connected' ? 'badge-success' : 'badge-danger';
      var statusText = conn.status === 'connected' ? 'Connected' : 'Disconnected';
      var healthColor = conn.healthStatus === 'healthy' ? '#10b981' :
                        conn.healthStatus === 'degraded' ? '#f59e0b' : '#ef4444';

      // Format last sync time
      var syncLabel = '';
      if (conn.lastSync) {
        var syncDate = new Date(conn.lastSync);
        var diffMin = Math.round((Date.now() - syncDate.getTime()) / 60000);
        if (diffMin < 60) syncLabel = diffMin + ' min ago';
        else if (diffMin < 1440) syncLabel = Math.floor(diffMin / 60) + 'h ago';
        else syncLabel = Math.floor(diffMin / 1440) + 'd ago';
      }

      html += '<div style="background: rgba(15,19,42,0.6); border: 1px solid rgba(59,130,246,0.1); border-radius: 12px; padding: 20px; transition: transform 0.2s, border-color 0.2s;" ' +
        'onmouseenter="this.style.borderColor=\'' + conn.color + '\'; this.style.transform=\'translateY(-2px)\'" ' +
        'onmouseleave="this.style.borderColor=\'rgba(59,130,246,0.1)\'; this.style.transform=\'translateY(0)\'">' +

        /* Header: icon + name + health */
        '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">' +
          '<div style="display: flex; align-items: center; gap: 8px;">' +
            '<span style="font-size: 22px;">' + conn.icon + '</span>' +
            '<span style="color: #e8ecf4; font-weight: 600; font-size: 13px;">' + conn.name + '</span>' +
          '</div>' +
          '<div style="width: 8px; height: 8px; border-radius: 50%; background: ' + healthColor + '; box-shadow: 0 0 6px ' + healthColor + ';"></div>' +
        '</div>' +

        /* Status badge */
        '<div style="margin-bottom: 10px;">' +
          '<span class="badge ' + statusClass + '" style="cursor:pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale">' + statusText + '</span>' +
        '</div>' +

        /* Metrics */
        '<div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 12px;">' +
          '<div style="display: flex; justify-content: space-between; cursor: pointer;" onclick="window.location.hash=\'#rationale/discoveryCoverage\'" title="Click to view discovery coverage rationale">' +
            '<span style="color: #7a85a0;">Agents</span>' +
            '<span style="color: #e8ecf4; font-weight: 500;">' + (conn.agentsDiscovered || 0) + '</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between;">' +
            '<span style="color: #7a85a0;">Last Sync</span>' +
            '<span style="color: #e8ecf4;">' + syncLabel + '</span>' +
          '</div>' +
          '<div style="display: flex; justify-content: space-between;">' +
            '<span style="color: #7a85a0;">Type</span>' +
            '<span style="color: ' + conn.color + '; font-size: 11px; text-transform: capitalize;">' + conn.type + '</span>' +
          '</div>' +
        '</div>' +

        /* Configure button */
        '<button class="btn btn-sm btn-secondary intg-configure-btn" data-connector="' + conn.id + '" style="width: 100%;">Configure</button>' +
      '</div>';
    }

    html += '</div></div></div>';

    /* ── Microsoft Copilot Integration ─────────────────────── */
    if (copilot) {
      html += '<div class="card animate-fade-in-up stagger-6" style="border-left: 3px solid #3b82f6; margin-bottom: 24px;">' +
        '<div class="card-header">' +
          '<div style="display: flex; align-items: center; gap: 10px;">' +
            '<span style="font-size: 24px;">🔷</span>' +
            '<div>' +
              '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">Microsoft Copilot Integration</h3>' +
              '<span style="color: #7a85a0; font-size: 12px;">Highest priority platform — deep Graph API integration</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="grid-3">';

      /* Tenant Info */
      html += '<div>' +
        '<h4 style="color: #3b82f6; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Tenant Configuration</h4>' +
        '<div class="metric-row"><span class="metric-label">Tenant</span><span class="metric-value">' + copilot.tenant.id + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">Subscription</span><span class="metric-value">' + copilot.tenant.subscriptionTier + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">Graph API</span><span class="metric-value">' + copilot.graphApi.version + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">Region</span><span class="metric-value">' + copilot.tenant.region + '</span></div>' +
      '</div>';

      /* Discovery Capabilities */
      html += '<div>' +
        '<h4 style="color: #8b5cf6; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Discovery Scope</h4>';

      var discoveryItems = [
        { key: 'copilotAgents', label: 'Copilot Agents' },
        { key: 'copilotStudioAgents', label: 'Copilot Studio' },
        { key: 'copilotPlugins', label: 'Copilot Plugins' },
        { key: 'm365CopilotInteractions', label: 'M365 Copilot' },
        { key: 'copilotUsageMetrics', label: 'Usage Metrics' },
        { key: 'copilotPermissions', label: 'Permissions' }
      ];

      for (var di = 0; di < discoveryItems.length; di++) {
        var item = discoveryItems[di];
        var enabled = copilot.discovery && copilot.discovery[item.key];
        html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px;">' +
          '<div style="width: 8px; height: 8px; border-radius: 50%; background: ' + (enabled ? '#10b981' : '#ef4444') + ';"></div>' +
          '<span style="color: ' + (enabled ? '#e8ecf4' : '#7a85a0') + ';">' + item.label + '</span>' +
        '</div>';
      }

      html += '</div>';

      /* Entra ID */
      html += '<div>' +
        '<h4 style="color: #6366f1; font-size: 13px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Entra ID Security</h4>' +
        '<div class="metric-row"><span class="metric-label">SSO</span><span class="metric-value">' + (copilot.entraId.ssoEnabled ? '<span style="color: #10b981;">Enabled</span>' : 'Disabled') + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">MFA</span><span class="metric-value">' + (copilot.entraId.mfaRequired ? '<span style="color: #10b981;">Required</span>' : 'Optional') + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">App Registrations</span><span class="metric-value">' + copilot.entraId.appRegistrations + '</span></div>' +
        '<div class="metric-row"><span class="metric-label">Service Principals</span><span class="metric-value">' + copilot.entraId.servicePrincipals + '</span></div>';

      /* Conditional Access Policies */
      if (copilot.entraId.conditionalAccessPolicies) {
        html += '<div style="margin-top: 12px;">' +
          '<span style="color: #7a85a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Conditional Access</span>';
        for (var ci = 0; ci < copilot.entraId.conditionalAccessPolicies.length; ci++) {
          var cap = copilot.entraId.conditionalAccessPolicies[ci];
          html += '<div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px;">' +
            '<span style="color: #10b981;">✓</span>' +
            '<span style="color: #a0a8c0;">' + cap.name + '</span>' +
          '</div>';
        }
        html += '</div>';
      }

      html += '</div>';

      html += '</div></div></div>';
    }

    /* ── SDK Registration Section ─────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-7" style="margin-bottom: 24px;">' +
      '<div class="card-header">' +
        '<div>' +
          '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">⚡ AETHER Agent SDK</h3>' +
          '<span style="color: #7a85a0; font-size: 12px;">Register custom agents using the AETHER SDK</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="grid-2">';

    /* Python SDK */
    html += '<div>' +
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">' +
        '<span style="background: #306998; color: #FFD43B; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">Python</span>' +
        '<span style="color: #7a85a0; font-size: 12px;">aether-sdk v1.2.0</span>' +
      '</div>' +
      '<div style="background: #0a0e1a; border-radius: 8px; padding: 20px; overflow-x: auto; line-height: 1.6; font-family: \'JetBrains Mono\', \'Fira Code\', monospace; font-size: 13px; border: 1px solid rgba(59,130,246,0.1);">' +
        '<code style="color: #e8ecf4;">' +
          '<span style="color: #3b82f6;">from</span> aether <span style="color: #3b82f6;">import</span> Agent\n' +
          '\n' +
          'agent = Agent.<span style="color: #06b6d4;">register</span>(\n' +
          '    name=<span style="color: #10b981;">"Finance Forecast Agent"</span>,\n' +
          '    owner=<span style="color: #10b981;">"Finance Team"</span>,\n' +
          '    department=<span style="color: #10b981;">"Finance"</span>,\n' +
          '    platform=<span style="color: #10b981;">"Custom"</span>,\n' +
          '    endpoint=<span style="color: #10b981;">"https://finance-agents.contoso.com/forecast"</span>,\n' +
          '    environment=<span style="color: #10b981;">"Production"</span>,\n' +
          '    region=<span style="color: #10b981;">"us-east-1"</span>,\n' +
          '    runtime=<span style="color: #10b981;">"Azure Kubernetes Service"</span>,\n' +
          '    monitoring_method=<span style="color: #10b981;">"sdk-push"</span>\n' +
          ')\n' +
          '\n' +
          '<span style="color: #4a5470;"># SDK automatically sends heartbeats, metrics, and logs</span>\n' +
          '<span style="color: #4a5470;"># Agent appears in AETHER registry within 60 seconds</span>' +
        '</code>' +
      '</div>' +
    '</div>';

    /* TypeScript SDK */
    html += '<div>' +
      '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">' +
        '<span style="background: #3178c6; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">TypeScript</span>' +
        '<span style="color: #7a85a0; font-size: 12px;">@aether/sdk v1.1.0</span>' +
      '</div>' +
      '<div style="background: #0a0e1a; border-radius: 8px; padding: 20px; overflow-x: auto; line-height: 1.6; font-family: \'JetBrains Mono\', \'Fira Code\', monospace; font-size: 13px; border: 1px solid rgba(59,130,246,0.1);">' +
        '<code style="color: #e8ecf4;">' +
          '<span style="color: #3b82f6;">import</span> { Agent } <span style="color: #3b82f6;">from</span> <span style="color: #10b981;">\'@aether/sdk\'</span>;\n' +
          '\n' +
          '<span style="color: #3b82f6;">const</span> agent = <span style="color: #3b82f6;">await</span> Agent.<span style="color: #06b6d4;">register</span>({\n' +
          '  name: <span style="color: #10b981;">\'Customer Support Agent\'</span>,\n' +
          '  owner: <span style="color: #10b981;">\'Support Team\'</span>,\n' +
          '  department: <span style="color: #10b981;">\'Customer Success\'</span>,\n' +
          '  platform: <span style="color: #10b981;">\'Custom\'</span>,\n' +
          '  endpoint: <span style="color: #10b981;">\'https://support-agent.contoso.com\'</span>,\n' +
          '  environment: <span style="color: #10b981;">\'Production\'</span>,\n' +
          '  region: <span style="color: #10b981;">\'us-east-1\'</span>,\n' +
          '  runtime: <span style="color: #10b981;">\'Azure Kubernetes Service\'</span>,\n' +
          '  monitoringMethod: <span style="color: #10b981;">\'sdk-push\'</span>\n' +
          '});\n' +
          '\n' +
          '<span style="color: #4a5470;">// Automatic heartbeats, metrics, and activity logging</span>' +
        '</code>' +
      '</div>' +
    '</div>';

    html += '</div></div></div>';

    /* ── Monitoring Methods Section ────────────────────────── */
    html += '<div class="card animate-fade-in-up stagger-8" style="margin-bottom: 24px;">' +
      '<div class="card-header">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">📡 Monitoring Methods</h3>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="grid-2">';

    var methodKeys = Object.keys(methods);
    var methodIcons = {
      'connector-pull': '🔄',
      'sdk-push': '📤',
      'webhook': '🔔',
      'hybrid': '🔀'
    };
    var methodColors = {
      'connector-pull': '#3b82f6',
      'sdk-push': '#10b981',
      'webhook': '#8b5cf6',
      'hybrid': '#06b6d4'
    };

    for (var m = 0; m < methodKeys.length; m++) {
      var method = methods[methodKeys[m]];
      var mIcon = methodIcons[method.id] || '📡';
      var mColor = methodColors[method.id] || '#3b82f6';

      html += '<div style="background: rgba(15,19,42,0.5); border: 1px solid rgba(59,130,246,0.08); border-radius: 10px; padding: 20px; border-top: 2px solid ' + mColor + ';">' +
        '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">' +
          '<span style="font-size: 20px;">' + mIcon + '</span>' +
          '<h4 style="margin: 0; color: #e8ecf4; font-size: 14px;">' + method.name + '</h4>' +
        '</div>' +
        '<p style="margin: 0 0 10px 0; color: #a0a8c0; font-size: 12px; line-height: 1.5;">' + method.description + '</p>' +
        '<div style="margin-bottom: 10px;">' +
          '<span style="color: #7a85a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">How it works</span>' +
          '<p style="margin: 4px 0 0 0; color: #7a85a0; font-size: 12px; line-height: 1.5; font-style: italic;">' + method.howItWorks + '</p>' +
        '</div>' +
        '<div style="margin-bottom: 8px;">' +
          '<span style="color: #7a85a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Supported Platforms</span>' +
          '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">';

      var platforms = method.supportedPlatforms || [];
      for (var p = 0; p < platforms.length; p++) {
        html += '<span style="background: rgba(59,130,246,0.1); color: #a0a8c0; font-size: 10px; padding: 2px 6px; border-radius: 4px;">' + platforms[p] + '</span>';
      }

      html += '</div></div>' +
        '<div>' +
          '<span style="color: #7a85a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Required</span>' +
          '<div style="margin-top: 4px; color: #e8ecf4; font-size: 12px; font-family: \'JetBrains Mono\', monospace;">' + (method.requiredFields || []).join(', ') + '</div>' +
        '</div>' +
      '</div>';
    }

    html += '</div></div></div>';

    /* ── Webhook Configuration ─────────────────────────────── */
    html += '<div class="card animate-fade-in-up" style="margin-bottom: 24px;">' +
      '<div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">' +
        '<h3 style="margin: 0; color: #e8ecf4; font-size: 15px;">🔔 Webhook Configuration</h3>' +
        '<span class="badge badge-success">Active</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="grid-2">';

    /* Webhook Details */
    html += '<div>' +
      '<div class="metric-row">' +
        '<span class="metric-label">Webhook URL</span>' +
        '<span class="metric-value" style="font-family: \'JetBrains Mono\', monospace; font-size: 11px; color: #06b6d4;">https://aether-api.contoso.com/webhooks/agent-events</span>' +
      '</div>' +
      '<div class="metric-row">' +
        '<span class="metric-label">Status</span>' +
        '<span class="metric-value"><span class="badge badge-success">Active</span></span>' +
      '</div>' +
      '<div class="metric-row">' +
        '<span class="metric-label">Secret</span>' +
        '<span class="metric-value" style="color: #7a85a0; letter-spacing: 2px;">••••••••••••••••</span>' +
      '</div>' +
      '<div class="metric-row">' +
        '<span class="metric-label">Last Delivery</span>' +
        '<span class="metric-value">2 min ago — <span style="color: #10b981;">200 OK</span></span>' +
      '</div>' +
      '<div style="margin-top: 16px;">' +
        '<button class="btn btn-sm btn-secondary" id="intg-test-webhook-btn">Test Webhook</button>' +
      '</div>' +
    '</div>';

    /* Subscribed Events */
    html += '<div>' +
      '<h4 style="color: #7a85a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Subscribed Events</h4>';

    var webhookEvents = [
      { name: 'AgentDiscovered', desc: 'New agent detected by Discovery Agent', color: '#3b82f6' },
      { name: 'AgentStatusChanged', desc: 'Agent status transitions (active/inactive/degraded)', color: '#06b6d4' },
      { name: 'PolicyViolation', desc: 'Governance policy breach detected', color: '#ef4444' },
      { name: 'AuditCompleted', desc: 'Audit cycle finished with findings', color: '#10b981' },
      { name: 'CostThresholdExceeded', desc: 'Agent cost exceeds budget threshold', color: '#f59e0b' },
      { name: 'ComplianceDrift', desc: 'Compliance score drop detected', color: '#8b5cf6' },
      { name: 'CredentialExpiring', desc: 'Agent credential approaching expiry', color: '#ec4899' },
      { name: 'RiskEscalation', desc: 'Agent risk level increased to critical', color: '#ef4444' }
    ];

    for (var w = 0; w < webhookEvents.length; w++) {
      var evt = webhookEvents[w];
      html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">' +
        '<div style="width: 6px; height: 6px; border-radius: 50%; background: ' + evt.color + ';"></div>' +
        '<span style="color: #e8ecf4; font-size: 12px; font-family: \'JetBrains Mono\', monospace;">' + evt.name + '</span>' +
        '<span style="color: #4a5470; font-size: 11px;">— ' + evt.desc + '</span>' +
      '</div>';
    }

    html += '</div>';

    html += '</div></div></div>';

    /* ── Connection Health Summary Chart ───────────────────── */
    html += '<div class="grid-2 animate-fade-in-up">';

    html += '<div class="chart-card">' +
      '<div class="chart-card-header">' +
        '<div>' +
          '<div class="chart-card-title">Agents by Platform</div>' +
          '<div class="chart-card-subtitle">Distribution of discovered agents across platforms</div>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card-body">' +
        '<canvas id="intg-agents-platform"></canvas>' +
      '</div>' +
    '</div>';

    html += '<div class="chart-card">' +
      '<div class="chart-card-header">' +
        '<div>' +
          '<div class="chart-card-title">Sync Activity</div>' +
          '<div class="chart-card-subtitle">Platform connector sync events (last 30 days)</div>' +
        '</div>' +
      '</div>' +
      '<div class="chart-card-body">' +
        '<canvas id="intg-sync-activity"></canvas>' +
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
    var cfg = AETHER.config;

    // ── Agents by Platform Chart ───────────────────────
    if (c && d && typeof d.computePlatformDistribution === 'function') {
      var platDist = d.computePlatformDistribution();
      c.createDoughnutChart('intg-agents-platform',
        platDist.labels,
        platDist.data,
        platDist.colors
      );
    }

    // ── Sync Activity Chart (simulated 30-day data) ────────
    if (c && d && d.last30Days) {
      var agentCount = (typeof d.getTotalAgentCount === 'function') ? d.getTotalAgentCount() : 0;
      var syncData = d.last30Days.map(function () {
        return agentCount > 0 ? Math.floor(Math.random() * 50) + 80 : 0;
      });
      c.createBarChart('intg-sync-activity', d.last30Days, [
        { label: 'Sync Events', data: syncData, color: '#3b82f6' }
      ]);
    }

    // ── Button Handlers ────────────────────────────────────
    var addBtn = document.getElementById('intg-add-connector-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        alert('Add Connector wizard — configure a new platform integration.\n\nSupported: Microsoft Copilot, Salesforce Agentforce, Databricks, Snowflake Cortex, OpenAI, LangGraph, CrewAI, and Custom agents via AETHER SDK.');
      });
    }

    var testWebhookBtn = document.getElementById('intg-test-webhook-btn');
    if (testWebhookBtn) {
      testWebhookBtn.addEventListener('click', function () {
        alert('Webhook test sent to https://aether-api.contoso.com/webhooks/agent-events\n\nResponse: 200 OK (45ms)');
      });
    }

    // ── Configure Buttons ──────────────────────────────────
    var configBtns = document.querySelectorAll('.intg-configure-btn');
    for (var i = 0; i < configBtns.length; i++) {
      configBtns[i].addEventListener('click', function () {
        var connId = this.getAttribute('data-connector');
        console.log('[AETHER] Configure connector:', connId);
        alert('Opening configuration for connector: ' + connId);
      });
    }

    console.log('[AETHER] Integrations Hub initialized');
  }
};
