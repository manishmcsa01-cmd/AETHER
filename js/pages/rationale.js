/* ═══════════════════════════════════════════════════════════════
   AETHER KPI Rationale Page
   Enterprise AI Workforce Platform
   ═══════════════════════════════════════════════════════════════ */

window.AETHER = window.AETHER || {};
AETHER.pages = AETHER.pages || {};

AETHER.pages.rationale = {
  render: function (kpiId) {
    kpiId = kpiId || 'totalAgents';
    var d = AETHER.data;
    var kpis = d.computeKPIs();
    var allAgents = d.getAllAgents();
    var viewMode = AETHER.pages.executiveViewMode || 'cumulative';
    var isCum = viewMode === 'cumulative';

    // KPI Definitions Dictionary
    var kpiDefinitions = {
      totalAgents: {
        title: 'Total Onboarded Agents',
        icon: '🤖',
        color: '#3b82f6',
        formula: 'N = \\sum_{i=1}^{M} A_i',
        formulaText: 'Where \\(A_i = 1\\) for each unique registered agent in the system of record.',
        description: 'The count of all AI workers, Copilots, and custom LLM agents actively registered under AETHER governance.',
        rationale: 'This metric tracks the size and growth of your digital workforce. Knowing the absolute count of agents is critical for resource allocation, security auditing, and preventing "AI sprawl" (duplicate or unmonitored agents performing redundant functions).',
        calculation: 'AETHER scans the local agent registry database (agents.json) and counts the total number of unique active agent IDs.',
        zeroState: 'No agents are onboarded. To populate this KPI, click the "+ Onboard Agent" button in the top navigation bar to register your first AI workforce member.',
        format: function(v) { return v + ' Agent' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          if (allAgents.length === 0 && (!isCum || !d.dbStats.deboarded_agents || d.dbStats.deboarded_agents.length === 0)) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td>' + ag.platform + '</td>' +
                      '<td>' + ag.department + '</td>' +
                      '<td><span class="badge badge-success">' + ag.status + '</span></td>' +
                    '</tr>';
          });
          var html = '<h3>Active Agent Fleet</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>Status</th></tr></thead>' +
                 '<tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No active agents.</td></tr>') + '</tbody></table></div></div>';
          
          if (isCum) {
            var dbList = d.dbStats.deboarded_agents || [];
            var dbRows = '';
            dbList.forEach(function(ag) {
              var date = new Date(ag.deboardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              dbRows += '<tr>' +
                          '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                          '<td>' + ag.id + '</td>' +
                          '<td>' + ag.platform + '</td>' +
                          '<td>' + ag.department + '</td>' +
                          '<td>' + date + '</td>' +
                          '<td><span class="badge badge-neutral">' + ag.reason + '</span></td>' +
                        '</tr>';
            });
            html += '<h3 style="margin-top:24px;">🚫 Deboarded Agents History (SQLite Database)</h3>' +
                    '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                    '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>Deboarded Date</th><th>Reason</th></tr></thead>' +
                    '<tbody>' + (dbRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No deboarded agents.</td></tr>') + '</tbody></table></div></div>';
          }
          return html;
        }
      },
      discoveryCoverage: {
        title: 'Discovery Coverage',
        icon: '📡',
        color: '#06b6d4',
        formula: '\\text{Coverage} = \\frac{N_{\\text{registered}}}{N_{\\text{discovered}}} \\times 100\\%',
        formulaText: 'Where \\(N_{\\text{registered}}\\) is registered agents and \\(N_{\\text{discovered}}\\) is discovered network endpoints.',
        description: 'Measures the percentage of network-detected AI agent endpoints that have been successfully registered under governance.',
        rationale: 'Shadow AI is a massive security risk. Discovery Coverage measures the visibility of your security team. A value of 100% means all detected LLM API calls and agent actions originate from verified, cataloged, and audited agents.',
        calculation: 'AETHER currently treats every registered agent as fully discovered — there is no live network endpoint scanner in this release, so coverage is a fixed 100% once any agent is onboarded (0% before then). A real discovery-vs-registration comparison is on the roadmap.',
        zeroState: 'No agents are registered yet, resulting in a default base rating. Onboard discovered agents to ensure complete governance coverage.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          var rows = '<tr><td>Registered Agents</td><td>' + allAgents.length + '</td><td>Active and managed in AETHER</td></tr>' +
                     '<tr><td>Discovered Endpoints</td><td>' + Math.max(allAgents.length, 0) + '</td><td>Detected via platform connector logs</td></tr>';
          return '<h3>Coverage Breakdown</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Metric Variable</th><th>Count</th><th>Description</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      complianceScore: {
        title: 'Compliance Score',
        icon: '🛡️',
        color: '#10b981',
        formula: '\\text{Compliance} = \\frac{1}{R}\\sum_{r=1}^{R} \\text{Score}_r',
        formulaText: 'Where \\(\\text{Score}_r\\) is each individually-assessed agent\'s overall compliance score (\\(R\\) = number of assessed agents); AETHER averages per-agent scores, falling back to an average of per-framework scores only when per-agent results aren\'t available.',
        description: 'Adherence rate of all AI workers against SOC 2, ISO 27001, GDPR, SOX, and HIPAA control frameworks.',
        rationale: 'AI agents must abide by data privacy and security regulations. The compliance score indicates the audit readiness of your AI workforce. Higher scores reflect strict data access policies, low PII exposure, and proper model tracking.',
        calculation: 'The supervisory Compliance Agent executes LLM-driven policy audits. It scores each agent individually against the 5 frameworks, then averages those per-agent scores across the fleet (falling back to a framework-level average, or a local rule-based estimate, if the LLM agent hasn\'t run).',
        zeroState: 'The Compliance Agent has not yet run, or no agents are registered to be assessed. Run a supervisory check to audit compliance controls.',
        format: function(v) { return kpis.complianceAssessed ? v + '%' : 'Not Assessed'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            var score = ag._complianceScore >= 0 ? ag._complianceScore + '%' : 'Not Assessed';
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td class="tabular-nums" style="font-weight:600;">' + score + '</td>' +
                      '<td>' + ag.certificationStatus + '</td>' +
                    '</tr>';
          });
          return '<h3>Individual Agent Compliance Ratings</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Compliance Score</th><th>Certification Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      auditReadiness: {
        title: 'Audit Readiness',
        icon: '📋',
        color: '#06b6d4',
        formula: '\\text{Readiness} = \\frac{\\sum_{f=1}^{F} \\text{Passed}_f}{\\sum_{f=1}^{F} \\text{Controls}_f} \\times 100\\%',
        formulaText: 'Where \\(\\text{Passed}_f\\) and \\(\\text{Controls}_f\\) are the passing and total control counts for framework \\(f\\).',
        description: 'The share of individual controls, across every monitored framework, that currently have verified passing evidence.',
        rationale: 'Deliberately distinct from Overall Score: Score can be severity-weighted or LLM-assessed, while Readiness answers a narrower, auditor-facing question — "of every control we are supposed to have evidence for, how many actually do?" A framework can have a respectable score while still having unresolved individual controls.',
        calculation: 'Sums passedControls and controls across all monitored frameworks, then divides.',
        zeroState: 'No frameworks are monitored yet, so readiness cannot be computed.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          var frameworks = (d.computeCompliance().frameworks) || [];
          if (allAgents.length === 0 || frameworks.length === 0) return '';
          var rows = '';
          frameworks.forEach(function(f) {
            var pct = f.controls > 0 ? Math.round((f.passedControls / f.controls) * 100) : 0;
            rows += '<tr>' +
                      '<td>' + f.name + '</td>' +
                      '<td class="tabular-nums">' + f.passedControls + ' / ' + f.controls + '</td>' +
                      '<td class="tabular-nums" style="font-weight:600;color:' + (pct >= 90 ? 'var(--color-success)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-danger)') + '">' + pct + '%</td>' +
                    '</tr>';
          });
          return '<h3>Control Readiness By Framework</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Framework</th><th>Passed / Total Controls</th><th>Readiness</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      avgReliability: {
        title: 'Average Reliability',
        icon: '⚡',
        color: '#8b5cf6',
        formula: '\\text{Reliability} = \\frac{1}{N}\\sum_{i=1}^{N} \\text{Uptime}_i\\%',
        formulaText: 'Where \\(\\text{Uptime}_i\\) is the health check availability percentage of agent \\(i\\).',
        description: 'Average uptime and availability percentage of all AI worker endpoints.',
        rationale: 'AI workers are core parts of modern workflows. This metric ensures that agent API endpoints are responsive. Frequent downtimes degrade productivity and disrupt automated business processes.',
        calculation: 'Computed by the Health Agent as a weighted score (starting at 100 and deducting for unreachable endpoints, elevated latency, HTTP error responses, and low reported success rates), then averaged across the fleet — not a raw successful-probes-over-total-probes ratio.',
        zeroState: 'No agents are registered to monitor, or all registered endpoints are unreachable. Configure active endpoints and run health checks.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td class="tabular-nums">' + ag.availability + '%</td>' +
                      '<td class="tabular-nums">' + ag.avgLatency + ' ms</td>' +
                      '<td>' + (ag.status === 'Active' ? '<span class="badge badge-success">Healthy</span>' : '<span class="badge badge-danger">Unreachable</span>') + '</td>' +
                    '</tr>';
          });
          return '<h3>Agent Reliability & Availability Logs</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Uptime / Availability</th><th>Avg Latency</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      monthlySpend: {
        title: 'Monthly AI Spend',
        icon: '💰',
        color: '#f59e0b',
        formula: '\\text{Spend} = \\sum_{i=1}^{N} C_i',
        formulaText: 'Where \\(C_i\\) is the monthly operational and API resource cost configured for agent \\(i\\).',
        description: 'Total monthly spend on AI workforce runtime, including LLM token charges and server hosting.',
        rationale: 'Keeps AI project budgets transparent. This aggregates model API fees (OpenAI, Anthropic, Bedrock), vector database costs, and cloud infrastructure usage to prevent budget overruns.',
        calculation: 'Aggregates the individual monthly costs specified in each agent\'s operational profile parameters.',
        zeroState: 'Monthly spend is $0.00 because no agents are onboarded, or all registered agents are configured with zero operational cost in their profiles.',
        format: function(v) { return '$' + d.formatNumber(v); },
        renderTable: function() {
          if (allAgents.length === 0 && (!isCum || !d.dbStats.deboarded_agents || d.dbStats.deboarded_agents.length === 0)) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td>' + ag.platform + '</td>' +
                      '<td class="tabular-nums" style="font-weight:600;">$' + d.formatNumber(ag.monthlyCost) + '</td>' +
                    '</tr>';
          });
          var html = '<h3>Active Spend Contribution by Agent</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Monthly Cost</th></tr></thead>' +
                 '<tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No active agents contributing to spend.</td></tr>') + '</tbody></table></div></div>';
          
          if (isCum) {
            var dbList = d.dbStats.deboarded_agents || [];
            var dbRows = '';
            dbList.forEach(function(ag) {
              dbRows += '<tr>' +
                          '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                          '<td>' + ag.id + '</td>' +
                          '<td>' + ag.platform + '</td>' +
                          '<td class="tabular-nums" style="font-weight:600;">$' + d.formatNumber(ag.monthlyCost) + '</td>' +
                        '</tr>';
            });
            html += '<h3 style="margin-top:24px;">🚫 Archived Deboarded Agent Spend (SQLite Database)</h3>' +
                    '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                    '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Monthly Cost (Prior)</th></tr></thead>' +
                    '<tbody>' + (dbRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No archived agent spend.</td></tr>') + '</tbody></table></div></div>';
          }
          return html;
        }
      },
      workforceROI: {
        title: 'AI Workforce ROI',
        icon: '📈',
        color: '#6366f1',
        formula: '\\text{ROI} = \\frac{\\text{Labor Savings}}{\\text{Monthly Spend}} \\times 100\\%',
        formulaText: 'Where \\(\\text{Labor Savings} = \\text{Total Tasks} \\times \\$0.10\\) (labor cost offset). This is a savings-to-spend ratio, not a net-of-spend return.',
        description: 'Financial return on investment generated by the AI workforce compared to human operational costs.',
        rationale: 'Justifies AI investments by measuring efficiency. Every task executed by an AI worker offsets manual human tasks. We estimate a conservative labor savings of $0.10 per task executed.',
        calculation: 'Calculated by multiplying the total number of tasks executed by all agents by $0.10 and dividing by the monthly cost (no subtraction — it\'s a ratio of estimated labor savings to spend, so it can read well above 100% when spend is low relative to task volume).',
        zeroState: 'Workforce ROI is 0% because either no tasks have been executed yet, or monthly cost equals $0.00. Run tasks to calculate efficiency gains.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          if (allAgents.length === 0 && (!isCum || !d.dbStats.deboarded_agents || d.dbStats.deboarded_agents.length === 0)) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            var savings = (ag.tasksExecuted * 0.10).toFixed(2);
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td class="tabular-nums">' + d.formatNumber(ag.tasksExecuted) + '</td>' +
                      '<td class="tabular-nums">$' + d.formatNumber(savings) + '</td>' +
                      '<td class="tabular-nums">$' + d.formatNumber(ag.monthlyCost) + '</td>' +
                    '</tr>';
          });
          var html = '<h3>Active Agent Productivity & Labor Offset</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Tasks Executed</th><th>Est. Labor Savings ($0.10/task)</th><th>Monthly Cost</th></tr></thead>' +
                 '<tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No active agents contributing to productivity.</td></tr>') + '</tbody></table></div></div>';
          
          if (isCum) {
            var dbList = d.dbStats.deboarded_agents || [];
            var dbRows = '';
            dbList.forEach(function(ag) {
              var savings = (ag.tasksExecuted * 0.10).toFixed(2);
              dbRows += '<tr>' +
                          '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                          '<td class="tabular-nums">' + d.formatNumber(ag.tasksExecuted) + '</td>' +
                          '<td class="tabular-nums">$' + d.formatNumber(savings) + '</td>' +
                          '<td class="tabular-nums">$' + d.formatNumber(ag.monthlyCost) + '</td>' +
                        '</tr>';
            });
            html += '<h3 style="margin-top:24px;">🚫 Archived Deboarded Agent Productivity (SQLite Database)</h3>' +
                    '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                    '<thead><tr><th>Agent Name</th><th>Tasks Executed</th><th>Est. Labor Savings ($0.10/task)</th><th>Monthly Cost (Prior)</th></tr></thead>' +
                    '<tbody>' + (dbRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No archived agent productivity.</td></tr>') + '</tbody></table></div></div>';
          }
          return html;
        }
      },
      highRiskAgents: {
        title: 'High Risk Agents',
        icon: '⚠️',
        color: '#ef4444',
        formula: 'R_{\\text{high}} = \\sum_{i=1}^{N} [r_i \\ge 60]',
        formulaText: 'Where \\(r_i\\) is the individual risk score computed for agent \\(i\\) out of 100.',
        description: 'The number of active AI agents currently classified as carrying high risk parameters.',
        rationale: 'Identifies security vulnerability hotspots. Agents are marked as high risk if they have permissions to transmit sensitive financial/PII data, run in production environments, or lack proper certifications.',
        calculation: 'Scans the agent registry. Counts all agents whose computed risk score equals or exceeds the enterprise risk threshold of 60.',
        zeroState: 'Zero high risk agents detected! The AI fleet is currently in a safe and secure configuration.',
        format: function(v) { return v + ' Flagged'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            var riskColor = ag.riskScore >= 80 ? 'text-danger' : ag.riskScore >= 60 ? 'text-warning' : 'text-success';
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td class="tabular-nums ' + riskColor + '" style="font-weight:600;">' + ag.riskScore + '</td>' +
                      '<td>' + ag.riskLevel + '</td>' +
                      '<td>' + ag.criticality + '</td>' +
                    '</tr>';
          });
          return '<h3>Agent Risk Profile Breakdown</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Risk Score</th><th>Risk Level</th><th>Criticality</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      policyViolations: {
        title: 'Policy Violations',
        icon: '🚫',
        color: '#ec4899',
        formula: 'V = \\text{Count of Active Rule Breaches}',
        formulaText: 'Calculated by the Governance Agent scanning fleet configurations against active guardrails.',
        description: 'Total active rule violations detected across the AI worker fleet.',
        rationale: 'Policy violations signal governance failures (e.g. data leakages, cost overruns, model drift). Keeping this metric at zero is vital to maintain corporate compliance and data security.',
        calculation: 'The Governance Agent automatically audits agent details against active system policies and counts the total number of breached rules.',
        zeroState: 'Zero policy violations detected. All agents are operating fully within configured guardrails.',
        format: function(v) { return v.toString(); },
        renderTable: function() {
          if (!d.policies || d.policies.length === 0) return '';
          // Live per-policy counts (the static d.policies[i].violations field is
          // never mutated — see js/pages/governance.js for the same fix applied
          // to the Governance page's Policy Rules cards).
          var liveViolations = d.computeViolations().violations;
          var countByPolicy = {};
          liveViolations.forEach(function (v) { countByPolicy[v.policy] = (countByPolicy[v.policy] || 0) + 1; });
          var rows = '';
          d.policies.forEach(function(p) {
            var count = countByPolicy[p.name] || 0;
            rows += '<tr>' +
                      '<td><strong>' + p.id + '</strong></td>' +
                      '<td>' + p.name + '</td>' +
                      '<td><code>' + p.condition + '</code></td>' +
                      '<td><span class="badge badge-info">' + p.action + '</span></td>' +
                      '<td class="tabular-nums" style="font-weight:600;color:' + (count > 0 ? 'var(--color-danger)' : 'var(--color-success)') + '">' + count + '</td>' +
                    '</tr>';
          });
          return '<h3>Active Governance Policies & Violations</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Policy ID</th><th>Policy Name</th><th>Condition Rule</th><th>Action</th><th>Violations</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      // Reliability Dashboard KPIs
      availability: {
        title: 'Availability Rate',
        icon: '📡',
        color: '#10b981',
        formula: '\\text{Availability} = \\frac{\\text{Successful Heartbeats}}{\\text{Total Probes}} \\times 100\\%',
        formulaText: 'Where successful heartbeats return HTTP 2xx or 3xx status codes.',
        description: 'The percentage of time agent HTTP endpoints remain responsive and reachable.',
        rationale: 'Tracks the hardware/hosting stability of AI services. Helps operations teams detect node crashes or hosting issues.',
        calculation: 'Calculated using health check pings. Successful checks return standard HTTP success statuses.',
        zeroState: 'No health check data has been gathered yet. Run the Health Agent check to populate.',
        format: function(v) { return v + '%'; },
        renderTable: function() { return kpiDefinitions.avgReliability.renderTable(); }
      },
      successRate: {
        title: 'Task Success Rate',
        icon: '✓',
        color: '#3b82f6',
        formula: '\\text{Success Rate} = \\frac{\\text{Succeeded Tasks}}{\\text{Total Executed Tasks}} \\times 100\\%',
        formulaText: 'Where succeeded tasks are those that complete without exceptions or syntax errors.',
        description: 'Percentage of executed tasks that completed successfully without operational failures.',
        rationale: 'Measures logical execution quality. High success rates indicate stable agent prompts, clean tool bindings, and reliable model reasoning.',
        calculation: 'Aggregates task execution parameters from onboarded agent stats.',
        zeroState: 'No tasks have been executed yet by the registered agent fleet.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            var sr = parseFloat(ag.successRate) || 0;
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td class="tabular-nums" style="font-weight:600;color:' + (sr >= 95 ? 'var(--color-success)' : sr >= 85 ? 'var(--color-warning)' : 'var(--color-danger)') + '">' + sr.toFixed(1) + '%</td>' +
                      '<td class="tabular-nums">' + (100 - sr).toFixed(1) + '%</td>' +
                    '</tr>';
          });
          return '<h3>Per-Agent Task Success / Failure Rate</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Success Rate</th><th>Failure Rate</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      failureRate: {
        title: 'Task Failure Rate',
        icon: '✕',
        color: '#ef4444',
        formula: '\\text{Failure Rate} = 100\\% - \\text{Success Rate}',
        formulaText: 'Complement of the overall task success rate across the agent fleet.',
        description: 'Percentage of executed tasks that failed due to timeouts, API limits, or system crashes.',
        rationale: 'Critical for error debugging. High failure rates indicate LLM gateway connection errors, rate limit triggers, or model hallucinations.',
        calculation: 'Derived from the task success rate statistics.',
        zeroState: 'Zero failures detected! All tasks have completed successfully.',
        format: function(v) { return v + '%'; },
        renderTable: function() { return kpiDefinitions.successRate.renderTable(); }
      },
      avgLatency: {
        title: 'Average Response Latency',
        icon: '⏱️',
        color: '#06b6d4',
        formula: '\\text{Latency} = \\frac{1}{N}\\sum_{i=1}^{N} T_i \\text{ ms}',
        formulaText: 'Where \\(T_i\\) is the average round-trip API response time of agent \\(i\\).',
        description: 'Average round-trip response time in milliseconds for agent endpoint calls.',
        rationale: 'High latency directly degrades downstream user experience. Monitors network speed and model token generation velocity.',
        calculation: 'Measured via automated endpoint probing cycles performed by the Health Agent.',
        zeroState: 'No latency metrics have been recorded yet. Verify that agent endpoints are active and reachable.',
        format: function(v) { return v + ' ms'; },
        renderTable: function() { return kpiDefinitions.avgReliability.renderTable(); }
      },
      // Cost Dashboard KPIs
      costPerAgent: {
        title: 'Average Cost Per Agent',
        icon: '💵',
        color: '#3b82f6',
        formula: '\\text{Cost per Agent} = \\frac{\\text{Total monthly spend}}{N}',
        formulaText: 'Where \\(N\\) is the total number of onboarded agents in the system.',
        description: 'The average monthly operational and subscription licensing cost per active AI worker.',
        rationale: 'Helps teams budget and allocate IT costs fairly across departments by showing the average overhead per registered agent.',
        calculation: 'Divides the sum of all monthly costs by the count of registered agents.',
        zeroState: 'Cost per agent is $0 because no agents are registered or all registered agents have zero costs.',
        format: function(v) { return '$' + d.formatNumber(v) + (isCum ? '' : '/mo'); },
        renderTable: function() { return kpiDefinitions.monthlySpend.renderTable(); }
      },
      costPerTask: {
        title: 'Average Cost Per Task',
        icon: '🏷️',
        color: '#06b6d4',
        formula: '\\text{Cost per Task} = \\frac{\\text{Total monthly spend}}{\\text{Total Executed Tasks}}',
        formulaText: 'Measures resource unit cost efficiency across execution workflows.',
        description: 'Average cost incurred per single task executed by the AI workforce.',
        rationale: 'Unit economics metric. Lowering cost per task demonstrates that the AI workforce is scaling efficiently without linear cost growth.',
        calculation: 'Divides the fleet monthly cost by total executed tasks.',
        zeroState: 'No tasks have been executed, or monthly cost is zero.',
        format: function(v) { return '$' + Number(v).toFixed(isCum ? 4 : 2); },
        renderTable: function() { return kpiDefinitions.workforceROI.renderTable(); }
      },
      tokenSpend: {
        title: 'LLM Token Spend',
        icon: '🪙',
        color: '#8b5cf6',
        formula: '\\text{Token Spend} = 75\\% \\times \\text{Total Monthly Spend}',
        formulaText: 'Calculated as the estimated fraction of spend consumed by LLM API usage.',
        description: 'Estimated cost consumed directly by model input/output API tokens.',
        rationale: 'Separates raw model usage costs from hosting infrastructure. Critical for sizing API subscription accounts.',
        calculation: 'Estimated as 75% of the total monthly operational cost of the fleet.',
        zeroState: 'Token spend is currently $0.00.',
        format: function(v) { return '$' + d.formatNumber(v); },
        renderTable: function() { return kpiDefinitions.monthlySpend.renderTable(); }
      },
      infraCost: {
        title: 'Infrastructure Cost',
        icon: '🖥️',
        color: '#f59e0b',
        formula: '\\text{Infrastructure Cost} = 25\\% \\times \\text{Total Monthly Spend}',
        formulaText: 'Calculated as the estimated fraction of spend consumed by hosting assets.',
        description: 'Estimated cost consumed by hosting compute, databases, and container nodes.',
        rationale: 'Measures background cloud overhead (virtual machines, vector databases, container orchestration) required to support the AI workforce.',
        calculation: 'Estimated as 25% of the total monthly operational cost of the fleet.',
        zeroState: 'Infrastructure cost is currently $0.00.',
        format: function(v) { return '$' + d.formatNumber(v); },
        renderTable: function() { return kpiDefinitions.monthlySpend.renderTable(); }
      },
      // Benchmark KPIs
      overallRanking: {
        title: 'Overall Benchmark Ranking',
        icon: '🏆',
        color: '#10b981',
        formula: '\\text{Rank} = f(\\text{Availability percentile vs SaaS industry standards})',
        formulaText: 'Calculated by placing availability metrics on standard SaaS SLA curves.',
        description: 'Percentile classification of your fleet reliability compared to SaaS benchmarks.',
        rationale: 'Tracks competitiveness. Evaluates how stable your AI deployments are compared to industry peers.',
        calculation: 'Compares your availability against industry benchmarks (Top 5% if > 99.0%, Top 15% if > 98.0%, else Top 30%).',
        zeroState: 'Availability is zero or unassessed. Registries must contain active probed agents to determine overall ranking.',
        format: function(v) { return v; },
        renderTable: function() { return kpiDefinitions.avgReliability.renderTable(); }
      },
      metricsAboveBenchmark: {
        title: 'Metrics Above Benchmark',
        icon: '📈',
        color: '#3b82f6',
        formula: 'M_{\\text{above}} = \\sum_{k=1}^{8} [\\text{Company}_k > \\text{Industry}_k]',
        formulaText: 'Where metrics like Reliability, Cost Per Task, and Compliance are evaluated.',
        description: 'Number of key operational metrics that currently beat industry standard benchmarks.',
        rationale: 'Broad health indicator. Beating industry standards in a majority of metrics indicates a highly optimized AI workforce.',
        calculation: 'Evaluates company metrics (reliability, utilization, compliance, latency, etc.) against corresponding industry averages.',
        zeroState: 'No metrics are currently exceeding industry benchmarks. Register agents to benchmark performance.',
        format: function(v) { return v; },
        renderTable: function() {
          var rows = '';
          var benchmarks = d.computeBenchmarks().filter(function (b) { return !b.notAssessed; });
          benchmarks.forEach(function(b) {
            var comp = b.company;
            var ind = b.industry;
            var lowerIsBetter = { 'Cost Per Task': true, 'Avg Risk Score': true, 'Avg Response Time': true };
            var isAbove = lowerIsBetter[b.metric] ? comp < ind : comp > ind;
            var status = isAbove ? '<span style="color:var(--color-success);font-weight:600;">Above</span>' : '<span style="color:var(--text-tertiary);">Below</span>';
            rows += '<tr>' +
                      '<td>' + b.metric + '</td>' +
                      '<td class="tabular-nums">' + comp + b.unit + '</td>' +
                      '<td class="tabular-nums">' + ind + b.unit + '</td>' +
                      '<td>' + status + '</td>' +
                    '</tr>';
          });
          return '<h3>Industry Benchmark Comparisons</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Operational Metric</th><th>Company Performance</th><th>Industry Baseline</th><th>Benchmarking Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      biggestGap: {
        title: 'Biggest Performance Gap',
        icon: '📊',
        color: '#06b6d4',
        formula: '\\text{Max Gap} = \\max | \\text{Company}_k - \\text{Industry}_k |',
        formulaText: 'Calculated as the maximum percentage difference from industry baseline.',
        description: 'Identifies the metric with the largest variance (positive or negative) from the industry baseline.',
        rationale: 'Focuses optimization efforts. Highlights the specific area where the company underperforms or overperforms the most.',
        calculation: 'Calculates percentage gaps across all benchmarked items and returns the maximum variance.',
        zeroState: 'No gap calculated. Benchmarks require active agent operational data to evaluate.',
        format: function(v) { return v; },
        renderTable: function() { return kpiDefinitions.metricsAboveBenchmark.renderTable(); }
      },
      costAdvantage: {
        title: 'Cost Advantage Ratio',
        icon: '💵',
        color: '#10b981',
        formula: '\\text{Cost Advantage} = (1 - \\frac{\\text{Company Cost per Task}}{\\$0.18}) \\times 100\\%',
        formulaText: 'Where \\(\\$0.18\\) is the average industry cost per AI task execution.',
        description: 'Percentage savings in cost per task compared to the industry average.',
        rationale: 'Directly demonstrates cost efficiency. Shows whether your infrastructure and token routing are cheaper than standard industry averages.',
        calculation: 'Compares your average cost per task against the industry average cost of $0.18.',
        zeroState: 'No cost advantage calculated. Run tasks to establish unit economics.',
        format: function(v) { return v; },
        renderTable: function() { return kpiDefinitions.workforceROI.renderTable(); }
      },
      certifiedAgents: {
        title: 'Certified Agents',
        icon: '🎓',
        color: '#10b981',
        formula: 'N_{\\text{certified}} = \\sum_{i=1}^{N} [C_i = \\text{"Certified"}]',
        formulaText: 'Where \\(C_i\\) represents the compliance certification status of agent \\(i\\).',
        description: 'The count of registered AI agents that have successfully passed security compliance control audits.',
        rationale: 'Certification guarantees that an AI worker meets SOC 2, ISO 27001, and corporate security guidelines before interfacing with sensitive endpoints. Minimizing pending audits prevents shadow operations.',
        calculation: 'AETHER scans the registered agent fleet and counts those with a certification status of "Certified".',
        zeroState: 'No agents are certified. Run a Compliance Agent audit to assess compliance controls.',
        format: function(v) { return v + ' Certified'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            if (ag.certificationStatus === 'Certified') {
              rows += '<tr>' +
                        '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                        '<td>' + ag.id + '</td>' +
                        '<td>' + ag.platform + '</td>' +
                        '<td>' + ag.department + '</td>' +
                        '<td><span class="badge badge-success">Certified</span></td>' +
                      '</tr>';
            }
          });
          if (!rows) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No certified agents.</div>';
          return '<h3>Certified AI Workers</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      pendingCertification: {
        title: 'Pending Certification',
        icon: '⏳',
        color: '#f59e0b',
        formula: 'N_{\\text{pending}} = \\sum_{i=1}^{N} [C_i = \\text{"Pending"}]',
        formulaText: 'Where \\(C_i\\) represents compliance certification status of agent \\(i\\) awaiting audit validation.',
        description: 'AI agents currently awaiting regulatory audits, security reviews, or compliance assessment.',
        rationale: 'Agents in a pending state represent unverified assets. They are restricted from writing to production systems or accessing customer data until their certification audit is completed.',
        calculation: 'Aggregates agents whose compliance assessment is incomplete or whose scores fall below the 80% passing threshold.',
        zeroState: 'All agents are certified or no agents are currently awaiting certification review.',
        format: function(v) { return v + ' Pending'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            if (ag.certificationStatus !== 'Certified') {
              rows += '<tr>' +
                        '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                        '<td>' + ag.id + '</td>' +
                        '<td>' + ag.platform + '</td>' +
                        '<td>' + ag.department + '</td>' +
                        '<td><span class="badge badge-warning">Pending Review</span></td>' +
                      '</tr>';
            }
          });
          if (!rows) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No pending certifications.</div>';
          return '<h3>Pending AI Certification Fleet</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      activePolicies: {
        title: 'Active Policies',
        icon: '📜',
        color: '#3b82f6',
        formula: 'P_{\\text{active}} = \\sum_{j=1}^{M} [S_j = \\text{"Active"}]',
        formulaText: 'Where \\(S_j\\) represents the active state of rule constraint \\(j\\).',
        description: 'Total number of active governance guardrails, system policies, and cost thresholds enforced across AETHER.',
        rationale: 'Enforcing active policies prevents rogue agent behavior, unauthorized API consumption, data leakages, and cost overruns by blocking execution when conditions are met.',
        calculation: 'Counts the total number of rules currently loaded and enabled in the system governance configuration.',
        zeroState: 'No active policies are loaded. Create a governance policy template to enforce guardrails.',
        format: function(v) { return v + ' Policy Rules'; },
        renderTable: function() {
          if (!d.policies || d.policies.length === 0) return '';
          // Live per-policy counts (the static d.policies[i].violations field is
          // never mutated — see js/pages/governance.js for the same fix applied
          // to the Governance page's Policy Rules cards).
          var liveViolations = d.computeViolations().violations;
          var countByPolicy = {};
          liveViolations.forEach(function (v) { countByPolicy[v.policy] = (countByPolicy[v.policy] || 0) + 1; });
          var rows = '';
          d.policies.forEach(function(p) {
            var count = countByPolicy[p.name] || 0;
            rows += '<tr>' +
                      '<td><strong>' + p.id + '</strong></td>' +
                      '<td>' + p.name + '</td>' +
                      '<td><code>' + p.condition + '</code></td>' +
                      '<td><span class="badge badge-info">' + p.action + '</span></td>' +
                      '<td class="tabular-nums" style="font-weight:600;color:' + (count > 0 ? 'var(--color-danger)' : 'var(--color-success)') + '">' + count + '</td>' +
                    '</tr>';
          });
          return '<h3>Active Governance Policies & Violations</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Policy ID</th><th>Policy Name</th><th>Condition Rule</th><th>Action</th><th>Violations</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      autoActionsToday: {
        title: 'Auto-Actions Today',
        icon: '⚡',
        color: '#8b5cf6',
        formula: 'A_{\\text{actions}} = \\sum_{k=1}^{T} \\text{Action}_k',
        formulaText: 'Aggregates every automated enforcement action logged for the current fleet — onboarding flags plus any policy-triggered blocks/alerts. This is a running fleet-wide total, not filtered to a rolling 24-hour window yet.',
        description: 'The count of system-enforced corrections, blocks, cost limits, or alerts executed by AETHER supervisors.',
        rationale: 'Automated remediation ensures round-the-clock policy adherence, shutting down violations before they scale into compliance breaches or financial losses.',
        calculation: 'Scans the supervisory action log and counts all onboarding, block, alert, and quarantine actions recorded for currently-onboarded agents.',
        zeroState: 'Zero automated actions taken today. All systems operating within thresholds.',
        format: function(v) { return v + ' Action' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          var govData = d.computeViolations();
          var actions = govData.actions || [];
          if (actions.length === 0) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No auto-actions logged today.</div>';
          var rows = '';
          actions.forEach(function(a) {
            rows += '<tr>' +
                      '<td>' + a.time + '</td>' +
                      '<td><span class="badge badge-info">' + a.action + '</span></td>' +
                      '<td><span class="table-agent-name">' + a.agent + '</span></td>' +
                      '<td>' + a.type + '</td>' +
                    '</tr>';
          });
          return '<h3>Remediation Log</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Timestamp</th><th>Action Taken</th><th>Agent</th><th>Type</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      policyAdherence: {
        title: 'Policy Adherence Rate',
        icon: '✅',
        color: '#10b981',
        formula: '\\text{Adherence} = (1 - \\frac{V_{\\text{active}}}{N}) \\times 100\\%',
        formulaText: 'Where \\(V_{\\text{active}}\\) is active policy violations and \\(N\\) is total agents.',
        description: 'The percentage of onboarded AI agents operating in full conformity without any active policy violations.',
        rationale: 'A high policy adherence rate guarantees that your digital workforce is aligned with security policies, cost guidelines, and compliance rules.',
        calculation: 'Calculated as 100% minus the proportion of agents with at least one open violation.',
        zeroState: 'Adherence is at 0% due to active violations across the fleet. Resolve active policy breaches to restore adherence.',
        format: function(v) { return v + '%'; },
        renderTable: function() { return kpiDefinitions.activePolicies.renderTable(); }
      },
      avgRiskScore: {
        title: 'Average Risk Score',
        icon: '🛡️',
        color: '#06b6d4',
        formula: '\\text{Avg Risk} = \\frac{1}{N}\\sum_{i=1}^{N} r_i',
        formulaText: 'Where \\(r_i\\) is the individual risk score computed for agent \\(i\\) on a 1-100 scale.',
        description: 'The average calculated security and operational risk rating across all registered agents.',
        rationale: 'Identifies systemic risk exposure. Managing this average score helps the organization maintain a healthy posture and prevent accumulation of high-risk assets.',
        calculation: 'Computes the mean risk score of all registered agents, factoring in data access scopes and platforms.',
        zeroState: 'Risk score is 0 because no agents are onboarded.',
        format: function(v) { return (v || 0) + ' / 100'; },
        renderTable: function() { return kpiDefinitions.highRiskAgents.renderTable(); }
      },
      piiExposure: {
        title: 'PII Exposure',
        icon: '👤',
        color: '#ef4444',
        formula: 'E_{\\text{PII}} = \\sum_{i=1}^{N} [P_i = 1]',
        formulaText: 'Where \\(P_i = 1\\) if agent \\(i\\) has access permission to Personally Identifiable Information.',
        description: 'The number of active AI agents configured with authorization to read, process, or store customer PII.',
        rationale: 'Minimizing the footprint of agents handling PII is critical for GDPR, HIPAA, and CCPA compliance. Highly restricted scopes lower breach impacts.',
        calculation: 'Scans agent registration metadata for active database scopes, API endpoints, or environment flags containing PII labels.',
        zeroState: 'Zero PII exposure! No agents are currently authorized to handle Personally Identifiable Information.',
        format: function(v) { return v + ' Agent' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            if (ag.piiAccess) {
              rows += '<tr>' +
                        '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                        '<td>' + ag.id + '</td>' +
                        '<td>' + ag.platform + '</td>' +
                        '<td>' + ag.department + '</td>' +
                        '<td><span class="badge badge-danger">PII Access</span></td>' +
                      '</tr>';
            }
          });
          if (!rows) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No agents with PII access.</div>';
          return '<h3>Agents Handling PII</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>PII Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      financialAccess: {
        title: 'Financial Access',
        icon: '💳',
        color: '#f59e0b',
        formula: 'F_{\\text{access}} = \\sum_{i=1}^{N} [F_i = 1]',
        formulaText: 'Where \\(F_i = 1\\) if agent \\(i\\) is authorized to interface with financial transaction or billing systems.',
        description: 'The count of active AI workers with permissions to access ERP systems, payment gateways, or invoices.',
        rationale: 'Financial connectors require strict tracking and double-approvals. Rogue actions on financial endpoints can lead to fraud or budget losses.',
        calculation: 'Counts registered agents possessing active financial access flags in their database configuration profiles.',
        zeroState: 'No agents possess financial access permissions.',
        format: function(v) { return v + ' Agent' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            if (ag.financialAccess) {
              rows += '<tr>' +
                        '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                        '<td>' + ag.id + '</td>' +
                        '<td>' + ag.platform + '</td>' +
                        '<td>' + ag.department + '</td>' +
                        '<td><span class="badge badge-danger">Financial Access</span></td>' +
                      '</tr>';
            }
          });
          if (!rows) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No agents with financial access.</div>';
          return '<h3>Agents with Financial Access</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Department</th><th>Financial Access</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      complianceFindings: {
        title: 'Compliance Findings',
        icon: '🗂️',
        color: '#f59e0b',
        formula: 'F_{\\text{findings}} = \\sum_{j=1}^{C} [\\text{Status}_j = \\text{"Open"}]',
        formulaText: 'Where \\(\\text{Status}_j\\) is the status of audit findings detected during compliance runs.',
        description: 'Total open compliance failures, security gaps, and non-compliance flags identified across regulatory controls.',
        rationale: 'Compliance findings indicate that standard security controls are failing or not properly documented. Keeping these findings resolved is vital for clean audit reports.',
        calculation: 'Sums all active compliance findings registered in the compliance database.',
        zeroState: 'Zero compliance findings! All systems conform fully to SOC 2, ISO 27001, and HIPAA frameworks.',
        format: function(v) { return v + ' Finding' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          var compData = d.computeCompliance();
          var findings = compData.findings || [];
          if (findings.length === 0) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">Zero compliance findings. All systems conform fully to compliance frameworks.</div>';
          var rows = '';
          findings.forEach(function(f) {
            rows += '<tr>' +
                      '<td><strong>' + f.id + '</strong></td>' +
                      '<td>' + f.framework + '</td>' +
                      '<td>' + f.control + '</td>' +
                      '<td><span class="badge badge-warning">' + f.severity + '</span></td>' +
                      '<td>' + f.description + '</td>' +
                    '</tr>';
          });
          return '<h3>Active Audit Findings</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>ID</th><th>Framework</th><th>Control</th><th>Severity</th><th>Description</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      criticalIncidents: {
        title: 'Critical Incidents',
        icon: '🚨',
        color: '#ef4444',
        formula: 'I_{\\text{critical}} = \\sum_{i=1}^{N} [r_i \\ge 80]',
        formulaText: 'Where \\(r_i\\) represents the calculated risk score of agent \\(i\\) exceeding the critical threshold of 80.',
        description: 'Total active agents carrying a Critical risk level profile, indicating high operational or security vulnerability.',
        rationale: 'Any critical incident or agent flagged at critical risk requires immediate attention. Typical triggers include unencrypted sensitive credentials, open write permissions in production, or external data export.',
        calculation: 'Counts registered agents whose current computed risk score is equal to or greater than 80.',
        zeroState: 'Zero critical incidents. The agent fleet is operating safely within acceptable risk bounds.',
        format: function(v) { return v + ' Critical'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            if (ag.riskScore >= 80) {
              rows += '<tr>' +
                        '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                        '<td>' + ag.id + '</td>' +
                        '<td style="color:#ef4444;font-weight:700;">' + ag.riskScore + '</td>' +
                        '<td>' + ag.department + '</td>' +
                        '<td>' + (ag._riskReasoning || 'Risk score matches Critical criteria') + '</td>' +
                      '</tr>';
            }
          });
          if (!rows) return '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">No critical risk incidents.</div>';
          return '<h3>Critical Risk Profiles</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Risk Score</th><th>Department</th><th>Reasoning</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      budgetEfficiency: {
        title: 'Budget Efficiency',
        icon: '💎',
        color: '#f59e0b',
        formula: '\\text{Efficiency} = \\min(100\\%, \\frac{\\text{Est. Labor Savings}}{\\text{Monthly Spend}} \\times 100\\%)',
        formulaText: 'Where Labor Savings is task execution count times $0.10 labor cost offset.',
        description: 'The productivity output value of the AI fleet compared directly to its total operational spend.',
        rationale: 'Measures financial return per dollar spent. High efficiency indicates that the AI agents execute tasks at a scale that offsets operational costs.',
        calculation: 'Calculates the ratio of estimated labor savings ($0.10/task) to the monthly spend, capped at 100%.',
        zeroState: 'Budget efficiency is 0% because spend is zero or no tasks have been executed.',
        format: function(v) { return v + '%'; },
        renderTable: function() { return kpiDefinitions.workforceROI.renderTable(); }
      },
      agentUtilization: {
        title: 'Agent Utilization',
        icon: '⚙️',
        color: '#3b82f6',
        formula: '\\text{Utilization} = \\frac{|\\{i : \\text{Active}_i \\wedge \\text{Tasks}_i > 0\\}|}{N} \\times 100\\%',
        formulaText: 'Share of all onboarded agents that are both Active and have executed at least one task.',
        description: 'How much of the onboarded fleet is actually doing work, as opposed to sitting idle or unconfigured.',
        rationale: 'A distinct measure from Budget Efficiency (a cost/labor-offset ratio). An agent can be cheap to run and still be idle; utilization flags agents that are Active in name only — the same agents Idle Agent Detection (GOV-IDLE-001) would flag individually.',
        calculation: 'Counts agents with status "Active" and tasksExecuted > 0, divides by total onboarded agents.',
        zeroState: 'Utilization is 0% because no onboarded agents have executed a task yet.',
        format: function(v) { return v + '%'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            var utilized = ag.status === 'Active' && (ag.tasksExecuted || 0) > 0;
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.status + '</td>' +
                      '<td class="tabular-nums">' + d.formatNumber(ag.tasksExecuted || 0) + '</td>' +
                      '<td>' + (utilized ? '<span class="badge badge-success">Utilized</span>' : '<span class="badge badge-warning">Idle</span>') + '</td>' +
                    '</tr>';
          });
          return '<h3>Agent Utilization Detail</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Status</th><th>Tasks Executed</th><th>Utilization</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      totalIdentities: {
        title: 'Total Agent Identities',
        icon: '🔑',
        color: '#3b82f6',
        formula: 'I_{\\text{total}} = \\sum_{i=1}^{N} Id_i',
        formulaText: 'Where \\(Id_i\\) represents unique security identities (service principals, app registrations, or API accounts) assigned to agent \\(i\\).',
        description: 'The count of active authentication and authorization identities registered for AI agents.',
        rationale: 'Every AI agent requires a distinct security identity to log actions, enforce scopes, and track compliance. Monitoring total identities prevents anonymous or sharing of credentials among agents.',
        calculation: 'Scans the Entra ID and OAuth configuration tables to count unique active agent identity objects.',
        zeroState: 'Zero agent identities registered. Onboard an agent to automatically generate a secure identity.',
        format: function(v) { return (v || 0) + ' Registered'; },
        renderTable: function() {
          if (allAgents.length === 0) return '';
          var rows = '';
          allAgents.forEach(function(ag) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + ag.name + '</span></td>' +
                      '<td>' + ag.id + '</td>' +
                      '<td>' + ag.platform + '</td>' +
                      '<td>' + (ag.endpoint ? 'Service Principal' : 'API Key') + '</td>' +
                      '<td><span class="badge badge-success">Active</span></td>' +
                    '</tr>';
          });
          return '<h3>Agent Identity Registry</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Platform</th><th>Identity Type</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      activeCredentials: {
        title: 'Active Agent Credentials',
        icon: '🛡️',
        color: '#10b981',
        formula: 'C_{\\text{active}} = \\sum_{j=1}^{M} [S_j = \\text{"Active"}]',
        formulaText: 'Where \\(S_j\\) is the status of registered agent credential \\(j\\).',
        description: 'The number of active credentials (secrets, certificates, API keys) currently in use by the agent fleet.',
        rationale: 'Active credentials represent potential entry points. Auditing active credentials ensures that deprecated keys are disabled and access is limited to active, verified agents.',
        calculation: 'Counts the number of active, non-expired keys and secrets stored in the secure credentials vault.',
        zeroState: 'No active credentials. Register agent connections to generate credentials.',
        format: function(v) { return (v || 0) + ' Active'; },
        renderTable: function() {
          var creds = d.computeIdentity().credentials.filter(function (c) { return c.status === 'Active'; });
          if (creds.length === 0) return '';
          var rows = '';
          creds.forEach(function(c) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + c.agent + '</span></td>' +
                      '<td>' + c.agentId + '</td>' +
                      '<td>' + c.type + '</td>' +
                      '<td><span class="badge badge-success">Active</span></td>' +
                      '<td>' + (c.scope === 'admin' ? 'Read/Write (Admin)' : 'Read/Write') + '</td>' +
                    '</tr>';
          });
          return '<h3>Credential Access Inventory</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Auth Type</th><th>Status</th><th>Scope</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      pendingRotation: {
        title: 'Pending Credential Rotation',
        icon: '⏳',
        color: '#f59e0b',
        formula: 'C_{\\text{rotation}} = \\sum_{j=1}^{M} [Age_j \\ge 90 \\text{ days}]',
        formulaText: 'Where \\(Age_j\\) is the number of days since credential \\(j\\) was last rotated.',
        description: 'Number of credentials that have exceeded the 90-day rotation threshold.',
        rationale: 'Corporate security policies mandate rotating credentials every 90 days. Pending rotations flag stale keys that are vulnerable to credential theft.',
        calculation: 'Compares the current date with the lastRotated (createdDate) timestamp of all agent credentials.',
        zeroState: 'All credentials are up to date and rotated within policy limits.',
        format: function(v) { return (v || 0) + ' Pending'; },
        renderTable: function() {
          var creds = d.computeIdentity().credentials.filter(function (c) { return c.status === 'Rotation Due'; });
          if (creds.length === 0) return '';
          var rows = '';
          creds.forEach(function(c) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + c.agent + '</span></td>' +
                      '<td>' + c.agentId + '</td>' +
                      '<td>' + c.lastRotated + '</td>' +
                      '<td><span class="badge badge-warning">Rotation Due</span></td>' +
                    '</tr>';
          });
          return '<h3>Stale Credentials Awaiting Rotation</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Last Rotated</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      expiringSoon: {
        title: 'Credentials Expiring Soon',
        icon: '⚠️',
        color: '#ef4444',
        formula: 'C_{\\text{expiring}} = \\sum_{j=1}^{M} [TimeLeft_j \\le 30 \\text{ days}]',
        formulaText: 'Where \\(TimeLeft_j\\) represents the days remaining until credential \\(j\\) expires.',
        description: 'The number of certificates or secrets expiring within the next 30 days.',
        rationale: 'Unexpected credential expiration causes service outages. Tracking expiring credentials allows security administrators to plan automated rotations before services fail.',
        calculation: 'Calculates the difference between the 90-day rotation due date and today for all credentials, filtering for those 30 days or less away.',
        zeroState: 'Zero credentials expiring within 30 days.',
        format: function(v) { return (v || 0) + ' Alert' + (v === 1 ? '' : 's'); },
        renderTable: function() {
          var creds = d.computeIdentity().credentials.filter(function (c) { return c.status === 'Expiring'; });
          if (creds.length === 0) return '';
          var rows = '';
          creds.forEach(function(c) {
            rows += '<tr>' +
                      '<td><span class="table-agent-name">' + c.agent + '</span></td>' +
                      '<td>' + c.agentId + '</td>' +
                      '<td>' + c.expiresIn + '</td>' +
                      '<td><span class="badge badge-danger">Expiring</span></td>' +
                    '</tr>';
          });
          return '<h3>Credential Expiration Schedule</h3>' +
                 '<div class="table-container"><div class="table-scroll"><table class="data-table">' +
                 '<thead><tr><th>Agent Name</th><th>Agent ID</th><th>Expires In</th><th>Status</th></tr></thead>' +
                 '<tbody>' + rows + '</tbody></table></div></div>';
        }
      },
      revokedThisMonth: {
        title: 'Revoked Credentials',
        icon: '🚫',
        color: '#8b5cf6',
        formula: 'C_{\\text{revoked}} = \\sum_{k=1}^{L} [Event_k = \\text{"Revoked"}]',
        formulaText: 'Where \\(Event_k\\) is a credential revocation event logged within the current calendar month.',
        description: 'Number of credentials revoked due to offboarding, security rotation, or anomaly detection.',
        rationale: 'Revocation is a key incident response control. Tracking revocation counts helps verify that compromised agent keys are successfully invalidated.',
        calculation: 'Queries the security auditing log for credential revocation events in the current month. AETHER does not yet log individual credential-revocation events (only full agent onboard/deboard), so this is always 0 until that capability is added.',
        zeroState: 'No credentials revoked this month.',
        format: function(v) { return (v || 0) + ' Revoked'; },
        renderTable: function() {
          // No revocation event log exists yet — nothing real to show.
          return '';
        }
      }
    };

    var def = kpiDefinitions[kpiId] || kpiDefinitions.totalAgents;
    var rawValue = kpis[kpiId];
    if (isCum) {
      if (kpiId === 'totalAgents') {
        rawValue = d.dbStats.cumulative_onboarded;
      } else if (kpiId === 'monthlySpend') {
        rawValue = d.dbStats.cumulative_spend;
      } else if (kpiId === 'workforceROI') {
        rawValue = d.dbStats.cumulative_roi;
      } else if (kpiId === 'costPerAgent') {
        rawValue = d.dbStats.cumulative_spend / Math.max(d.dbStats.cumulative_onboarded, 1);
      } else if (kpiId === 'costPerTask') {
        rawValue = d.dbStats.cumulative_spend / Math.max(d.dbStats.cumulative_tasks, 1);
      } else if (kpiId === 'tokenSpend') {
        rawValue = d.dbStats.cumulative_spend * 0.75;
      } else if (kpiId === 'infraCost') {
        rawValue = d.dbStats.cumulative_spend * 0.25;
      } else if (kpiId === 'budgetEfficiency') {
        rawValue = d.dbStats.cumulative_spend > 0 ? Math.min(100, Math.round((d.dbStats.cumulative_tasks * 0.1) / d.dbStats.cumulative_spend * 100)) : 0;
      }
    }
    if (kpiId === 'overallRanking') {
      rawValue = parseFloat(kpis.availability) > 99 ? 'Top 5%' : parseFloat(kpis.availability) > 98 ? 'Top 15%' : 'Top 30%';
    } else if (kpiId === 'metricsAboveBenchmark') {
      var above = 0;
      var benchmarks = d.computeBenchmarks().filter(function (b) { return !b.notAssessed; });
      benchmarks.forEach(function(b) {
        var lowerIsBetter = { 'Cost Per Task': true, 'Avg Risk Score': true, 'Avg Response Time': true };
        var comp = parseFloat(b.company) || 0;
        var ind = parseFloat(b.industry) || 0;
        if (lowerIsBetter[b.metric]) {
          if (comp < ind) above++;
        } else {
          if (comp > ind) above++;
        }
      });
      rawValue = above + '/' + benchmarks.length;
    } else if (kpiId === 'biggestGap') {
      var maxGap = 0;
      var benchmarks = d.computeBenchmarks().filter(function (b) { return !b.notAssessed; });
      benchmarks.forEach(function(b) {
        var comp = parseFloat(b.company) || 0;
        var ind = parseFloat(b.industry) || 0;
        var gap = Math.abs(((comp - ind) / Math.max(ind, 0.01)) * 100);
        if (gap > maxGap) maxGap = gap;
      });
      rawValue = '+' + maxGap.toFixed(1) + '%';
    } else if (kpiId === 'costAdvantage') {
      var cpt = parseFloat(kpis.costPerTask) || 0;
      rawValue = cpt > 0 ? Math.round((1 - cpt / 0.18) * 100) + '% lower' : 'N/A';
    } else if (kpiId === 'totalIdentities' || kpiId === 'activeCredentials' || kpiId === 'pendingRotation' ||
               kpiId === 'expiringSoon' || kpiId === 'revokedThisMonth') {
      // These live on computeIdentity().summary, not computeKPIs() — kpis[kpiId]
      // would otherwise always be undefined and render as "0" regardless of the
      // real identity/credential counts shown on the Identity & Access page.
      rawValue = d.computeIdentity().summary[kpiId];
    }
    
    var val = def.format(rawValue);
    var isZero = parseFloat(rawValue) === 0 || rawValue === 0 || rawValue === '0%' || rawValue === 'N/A' || rawValue === '$0';

    // Status Badge determination
    var statusText = 'Optimal';
    var statusClass = 'badge-success';
    if (isZero) {
      statusText = 'Zero / Unpopulated';
      statusClass = 'badge-neutral';
    } else if (kpiId === 'highRiskAgents' && rawValue > 0) {
      statusText = 'Caution';
      statusClass = 'badge-warning';
    } else if (kpiId === 'policyViolations' && rawValue > 0) {
      statusText = 'Violation Detected';
      statusClass = 'badge-danger';
    }

    return '<div class="page-content">' +
      /* ── Header ─────────────────────────────────────────── */
      '<div class="page-header animate-fade-in-up">' +
        '<div class="page-header-left">' +
          '<h1 class="page-title"><span style="margin-right:8px;color:' + def.color + '">' + def.icon + '</span> KPI Rationale</h1>' +
          '<p class="page-subtitle">Mathematical formulation and business context for ' + def.title + '</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-secondary" onclick="window.history.back()">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
            ' Go Back' +
          '</button>' +
          '<button class="btn btn-primary" onclick="window.location.hash=\'#dashboard\'">' +
            'Command Center' +
          '</button>' +
        '</div>' +
      '</div>' +

      /* ── Content Grid ───────────────────────────────────── */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">' +
        
        /* ── Left Column — Overview & Formulation ──────────── */
        '<div style="display:flex;flex-direction:column;gap:24px;" class="animate-fade-in-up stagger-1">' +
          
          /* Card: Live Value */
          '<div class="card" style="position:relative;overflow:hidden;">' +
            '<div style="position:absolute;top:0;left:0;bottom:0;width:4px;background:' + def.color + '"></div>' +
            '<div class="card-body" style="padding:24px;">' +
              '<div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Current Calculated Value</div>' +
              '<div style="font-size:48px;font-weight:800;color:var(--text-primary);margin:12px 0 8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;letter-spacing:-0.02em;">' + val + '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
                '<span style="font-size:12px;color:var(--text-secondary);">Computed in real-time</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Card: Math Formulation */
          '<div class="card">' +
            '<div class="card-body" style="padding:24px;">' +
              '<h3 style="margin-top:0;margin-bottom:12px;font-size:14px;color:var(--text-primary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Mathematical Formulation</h3>' +
              '<div style="background:var(--bg-topbar);border:1px solid var(--border-primary);padding:16px 20px;border-radius:var(--radius-md);text-align:center;margin:16px 0;font-family:\'Courier New\',Courier,monospace;font-size:18px;color:var(--text-primary);font-weight:700;box-shadow:inset 0 1px 3px rgba(0,0,0,0.2);">' +
                '\\[' + def.formula + '\\]' +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-secondary);line-height:1.6;font-style:italic;">' + def.formulaText + '</div>' +
            '</div>' +
          '</div>' +

          /* Card: Rationale */
          '<div class="card">' +
            '<div class="card-body" style="padding:24px;">' +
              '<h3 style="margin-top:0;margin-bottom:12px;font-size:14px;color:var(--text-primary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Business Rationale & Context</h3>' +
              '<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">' + def.rationale + '</p>' +
              '<div style="font-size:12px;color:var(--text-tertiary);line-height:1.5;">' +
                '<strong>Operational impact:</strong> ' + def.description +
              '</div>' +
            '</div>' +
          '</div>' +

        '</div>' +

        /* ── Right Column — Calculation & Contributing Agents ─ */
        '<div style="display:flex;flex-direction:column;gap:24px;" class="animate-fade-in-up stagger-2">' +
          
          /* Card: Zero State Callout (Render only if zero) */
          (isZero ? 
            '<div class="alert-banner info" style="margin-bottom:0;padding:20px;">' +
              '<div style="display:flex;gap:12px;">' +
                '<span style="font-size:24px;line-height:1;">💡</span>' +
                '<div>' +
                  '<div style="font-weight:700;color:var(--text-primary);font-size:13px;margin-bottom:4px;">Why is this KPI ' + val + '?</div>' +
                  '<div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px;">' + def.zeroState + '</div>' +
                  '<div style="display:flex;gap:8px;">' +
                    '<button class="btn btn-secondary btn-sm" onclick="AETHER.app.openOnboardModal()">Onboard Agent</button>' +
                    '<button class="btn btn-primary btn-sm" onclick="window.location.hash=\'#dashboard\'">Go to Dashboard</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>'
          : '') +

          /* Card: Calculation Logic */
          '<div class="card">' +
            '<div class="card-body" style="padding:24px;">' +
              '<h3 style="margin-top:0;margin-bottom:12px;font-size:14px;color:var(--text-primary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">System Calculation Logic</h3>' +
              '<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:0;">' + def.calculation + '</p>' +
            '</div>' +
          '</div>' +

          /* Card: Contributor Breakdown Table */
          '<div class="card">' +
            '<div class="card-body" style="padding:24px;">' +
              ((allAgents.length === 0 && (!isCum || d.dbStats.cumulative_onboarded === 0)) ? 
                '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:12px;">No agents registered to display breakdown.</div>'
              : def.renderTable()) +
            '</div>' +
          '</div>' +

        '</div>' +

      '</div>' +
    '</div>';
  },

  init: function (kpiId) {
    // Mathjax or similar renderer isn't used, but we render inline LaTeX style equations.
    // If the browser needs text formatting, we can convert standard math strings.
    // Let's replace LaTeX display blocks with pretty math formatting on page render if LaTeX isn't parsed natively.
    var el = document.getElementById('page-content');
    if (!el) return;
    
    // Quick custom renderer for LaTeX display equations \\[ ... \\] and inline \\( ... \\)
    var text = el.innerHTML;
    text = text.replace(/\\\[(.*?)\\\]/g, function(match, formula) {
      return '<div style="font-style:italic;font-family:\'Outfit\',sans-serif;font-size:16px;">' + formula.replace(/\\sum/g, '&Sigma;').replace(/\\frac/g, '').replace(/\\text/g, '').replace(/\\%/g, '%').replace(/\{/g, '(').replace(/\}/g, ')').replace(/_/g, '').replace(/\^/g, '') + '</div>';
    });
    text = text.replace(/\\\((.*?)\\\)/g, function(match, formula) {
      return '<span style="font-style:italic;font-family:\'Outfit\',sans-serif;">' + formula.replace(/\\sum/g, '&Sigma;').replace(/\\frac/g, '').replace(/\\text/g, '').replace(/\\%/g, '%').replace(/\{/g, '(').replace(/\}/g, ')').replace(/_/g, '').replace(/\^/g, '') + '</span>';
    });
    el.innerHTML = text;
  }
};
