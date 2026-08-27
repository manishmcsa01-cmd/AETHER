"""
AETHER Audit Agent
===================
Generates comprehensive, executive-ready audit reports for the AI agent
portfolio. Can incorporate results from other AETHER agents (compliance,
risk, governance) to produce a unified audit view.

Returns structured JSON with: executive_summary, findings, timeline,
reports, stats, provider, and timestamp.

Uses only Python stdlib.
"""

import json
import datetime
import sys
import os

# ── Resolve imports from project root ─────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import llm_gateway

# ── System prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a Chief AI Auditor generating enterprise audit reports. "
    "Create comprehensive, executive-ready audit findings. "
    "Return structured JSON."
)

# ── Build user prompt ─────────────────────────────────────────

def _build_user_prompt(agents_list, compliance_results, risk_results, governance_results):
    """Construct the user prompt sent to the LLM."""
    agents_text = json.dumps(agents_list, indent=2)

    # Merge supplementary context sections
    context_sections = ""

    if compliance_results:
        context_sections += (
            "\n=== COMPLIANCE AGENT RESULTS ===\n"
            + json.dumps(compliance_results, indent=2, default=str) + "\n"
        )
    if risk_results:
        context_sections += (
            "\n=== RISK AGENT RESULTS ===\n"
            + json.dumps(risk_results, indent=2, default=str) + "\n"
        )
    if governance_results:
        context_sections += (
            "\n=== GOVERNANCE AGENT RESULTS ===\n"
            + json.dumps(governance_results, indent=2, default=str) + "\n"
        )

    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")

    prompt = (
        "Today's date: " + today + "\n\n"
        "Below is the list of AI agents currently deployed in the enterprise, "
        "along with any results from prior compliance, risk, and governance evaluations.\n\n"
        "=== AGENTS ===\n"
        + agents_text + "\n"
        + context_sections + "\n\n"
        "Based on all the information above, generate a comprehensive audit report.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        '  "executive_summary": "A 2-4 sentence executive overview of the audit.",\n'
        '  "findings": [\n'
        "    {\n"
        '      "id": "FND-001",\n'
        '      "severity": "Critical|High|Medium|Low",\n'
        '      "framework": "The governance/compliance framework this relates to (e.g. SOC2, GDPR, ISO-27001, NIST, Internal Policy)",\n'
        '      "description": "Clear description of the finding",\n'
        '      "recommendation": "Actionable remediation step",\n'
        '      "status": "Open",\n'
        '      "due_date": "YYYY-MM-DD — a reasonable remediation deadline"\n'
        "    }\n"
        "  ],\n"
        '  "timeline": [\n'
        "    {\n"
        '      "date": "YYYY-MM-DD",\n'
        '      "event": "Description of audit event or milestone",\n'
        '      "type": "info|warning|danger|success"\n'
        "    }\n"
        "  ],\n"
        '  "reports": [\n'
        "    {\n"
        '      "name": "Report title",\n'
        '      "date": "YYYY-MM-DD",\n'
        '      "status": "Published|Draft|Pending",\n'
        '      "findings": <number of findings in this report>\n'
        "    }\n"
        "  ],\n"
        '  "stats": {\n'
        '    "audits_completed": <number>,\n'
        '    "open_findings": <number>,\n'
        '    "critical_findings": <number>,\n'
        '    "avg_remediation": "<N> days"\n'
        "  }\n"
        "}\n\n"
        "Guidelines:\n"
        "- Generate at least one finding per significant issue identified.\n"
        "- Number findings sequentially as FND-001, FND-002, etc.\n"
        "- The timeline should include: audit start, key findings discovered, and next steps.\n"
        "- reports should list the audit report(s) produced.\n"
        "- stats should reflect realistic aggregates for the findings you generated.\n"
        "- Return ONLY valid JSON, no additional text."
    )
    return prompt


# ── Fallback report generator ─────────────────────────────────

def _generate_fallback(agents_list, compliance_results, risk_results, governance_results):
    """Build a deterministic audit report when the LLM is unavailable."""
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    num_agents = len(agents_list)

    findings = []
    finding_counter = 0

    # ── Derive findings from governance violations ────────────
    if governance_results and isinstance(governance_results.get("violations"), list):
        for viol in governance_results["violations"]:
            finding_counter += 1
            fid = "FND-" + str(finding_counter).zfill(3)
            findings.append({
                "id": fid,
                "severity": viol.get("severity", "Medium"),
                "framework": "Internal Policy",
                "description": "Governance violation " + viol.get("id", "") + ": " + viol.get("details", "No details"),
                "recommendation": viol.get("recommendation", "Review and remediate."),
                "status": "Open",
                "due_date": _due_date(viol.get("severity", "Medium"))
            })

    # ── Derive findings from compliance results ───────────────
    # compliance_agent.run() returns top-level "findings" (a flat list of
    # {agent_id, agent_name, framework, finding} — see _collect_all_findings
    # in compliance_agent.py), not "violations". That key never existed here,
    # so this branch was always a no-op even when real findings were present.
    if compliance_results and isinstance(compliance_results.get("findings"), list):
        for cf in compliance_results["findings"]:
            finding_counter += 1
            fid = "FND-" + str(finding_counter).zfill(3)
            framework = cf.get("framework", "Compliance")
            findings.append({
                "id": fid,
                "severity": cf.get("severity", "Medium"),
                "framework": framework,
                "description": "Compliance issue (" + cf.get("agent_name", "unknown agent") + "): " + str(cf.get("finding", "N/A")),
                "recommendation": "Address the compliance gap.",
                "status": "Open",
                "due_date": _due_date(cf.get("severity", "Medium"))
            })

    # ── Derive findings from risk results ─────────────────────
    # risk_agent.run() returns top-level "agents" (per-agent risk_score/
    # risk_level/reasoning — see _fallback_agent_result / the LLM path in
    # risk_agent.py), not "risks". Only agents actually flagged High/Critical
    # become audit findings.
    if risk_results and isinstance(risk_results.get("agents"), list):
        for ra in risk_results["agents"]:
            level = ra.get("risk_level", "")
            if level not in ("High", "Critical"):
                continue
            finding_counter += 1
            fid = "FND-" + str(finding_counter).zfill(3)
            findings.append({
                "id": fid,
                "severity": level,
                "framework": "Risk Management",
                "description": "Risk finding (" + ra.get("name", "unknown agent") + "): " + str(ra.get("reasoning", "Elevated risk score of " + str(ra.get("risk_score", "?")))),
                "recommendation": "Mitigate the identified risk factors: " + ", ".join(ra.get("risk_factors", []) or ["review agent configuration"]),
                "status": "Open",
                "due_date": _due_date(level)
            })

    # ── Default finding if nothing else was generated ─────────
    if not findings:
        finding_counter += 1
        findings.append({
            "id": "FND-001",
            "severity": "Low",
            "framework": "Internal Policy",
            "description": "Baseline audit completed for " + str(num_agents) + " agent(s). No critical issues detected from available data.",
            "recommendation": "Continue periodic audits and integrate additional data sources.",
            "status": "Open",
            "due_date": _due_date("Low")
        })

    critical_count = sum(1 for f in findings if f["severity"] == "Critical")
    open_count = len(findings)

    executive_summary = (
        "Enterprise AI audit completed on " + today + " covering "
        + str(num_agents) + " agent(s). "
        + str(open_count) + " finding(s) identified, including "
        + str(critical_count) + " critical. "
        + "Immediate action required for critical and high-severity items."
    )

    timeline = [
        {"date": today, "event": "Automated audit initiated", "type": "info"},
        {"date": today, "event": str(num_agents) + " agents scanned", "type": "info"},
    ]
    if critical_count > 0:
        timeline.append({"date": today, "event": str(critical_count) + " critical finding(s) flagged", "type": "danger"})
    timeline.append({"date": today, "event": "Audit report generated", "type": "success"})

    reports = [
        {
            "name": "AETHER AI Agent Audit — " + today,
            "date": today,
            "status": "Published",
            "findings": open_count
        }
    ]

    stats = {
        "audits_completed": 1,
        "open_findings": open_count,
        "critical_findings": critical_count,
        "avg_remediation": "14 days"
    }

    return {
        "executive_summary": executive_summary,
        "findings": findings,
        "timeline": timeline,
        "reports": reports,
        "stats": stats
    }


def _due_date(severity):
    """Return a reasonable due date string based on severity."""
    days_map = {"Critical": 7, "High": 14, "Medium": 30, "Low": 60}
    days = days_map.get(severity, 30)
    due = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    return due.strftime("%Y-%m-%d")


# ── Main entry point ──────────────────────────────────────────

def run(agents_list, llm_fn, compliance_results=None, risk_results=None, governance_results=None):
    """
    Generate a comprehensive audit report for the AI agent portfolio.

    Args:
        agents_list:        list of agent dicts
        llm_fn:             callable — llm_gateway.call_llm(system, user)
        compliance_results: optional dict from compliance agent
        risk_results:       optional dict from risk agent
        governance_results: optional dict from governance agent

    Returns:
        dict with executive_summary, findings, timeline, reports, stats,
        provider, timestamp
    """
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print("[Audit Agent] Starting audit for " + str(len(agents_list)) + " agent(s)")

    # ── Handle empty input ────────────────────────────────────
    if not agents_list:
        print("[Audit Agent] No agents to audit.")
        return {
            "executive_summary": "No AI agents are currently onboarded. Audit scope is empty.",
            "findings": [],
            "timeline": [
                {"date": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
                 "event": "Audit completed — no agents in scope",
                 "type": "info"}
            ],
            "reports": [],
            "stats": {
                "audits_completed": 1,
                "open_findings": 0,
                "critical_findings": 0,
                "avg_remediation": "0 days"
            },
            "provider": "none",
            "timestamp": timestamp
        }

    # ── Call LLM ──────────────────────────────────────────────
    user_prompt = _build_user_prompt(agents_list, compliance_results, risk_results, governance_results)

    try:
        response = llm_fn(SYSTEM_PROMPT, user_prompt)
    except Exception as exc:
        print("[Audit Agent] LLM call raised exception: " + str(exc))
        response = {"success": False, "error": str(exc)}

    provider = "fallback-rules"

    if response.get("success"):
        provider = response.get("provider", "unknown") + " / " + response.get("model", "")
        parsed = llm_gateway.parse_json_response(response.get("text", ""))

        if parsed and isinstance(parsed, dict) and "findings" in parsed:
            print("[Audit Agent] LLM returned " + str(len(parsed.get("findings", []))) + " finding(s)")

            # Normalise and enrich
            for f in parsed.get("findings", []):
                f.setdefault("status", "Open")
                f.setdefault("severity", "Medium")
                f.setdefault("due_date", _due_date(f.get("severity", "Medium")))

            # Ensure top-level keys are present
            result = {
                "executive_summary": parsed.get("executive_summary", "Audit report generated."),
                "findings": parsed.get("findings", []),
                "timeline": parsed.get("timeline", []),
                "reports": parsed.get("reports", []),
                "stats": parsed.get("stats", {
                    "audits_completed": 1,
                    "open_findings": len(parsed.get("findings", [])),
                    "critical_findings": sum(
                        1 for f in parsed.get("findings", [])
                        if f.get("severity") == "Critical"
                    ),
                    "avg_remediation": "14 days"
                }),
                "provider": provider,
                "timestamp": timestamp
            }
            return result
        else:
            print("[Audit Agent] LLM response could not be parsed. Falling back to rule-based generation.")
    else:
        print("[Audit Agent] LLM call failed: " + str(response.get("error", "unknown error")))
        print("[Audit Agent] Falling back to rule-based report generation.")

    # ── Fallback: deterministic report generator ──────────────
    fallback = _generate_fallback(agents_list, compliance_results, risk_results, governance_results)
    fallback["provider"] = provider
    fallback["timestamp"] = timestamp
    return fallback


# ── Self-test ─────────────────────────────────────────────────

if __name__ == "__main__":
    sample_agents = [
        {
            "id": "AGT-001",
            "name": "Customer PII Processor",
            "platform": "GPT-4",
            "owner": "alice@corp.com",
            "piiAccess": True,
            "financialAccess": False,
            "riskScore": 85,
            "certificationStatus": "expiring",
            "environment": "production",
            "region": "us-east-1",
            "purpose": "Process customer support tickets containing PII",
            "monthlyCost": 1200
        },
        {
            "id": "AGT-002",
            "name": "Legacy Bot",
            "platform": "davinci-002",
            "owner": "",
            "piiAccess": False,
            "financialAccess": True,
            "riskScore": 60,
            "certificationStatus": "expired",
            "environment": "production",
            "region": "multi-region",
            "purpose": "Idle invoice processor",
            "monthlyCost": 300
        }
    ]

    # Simulate governance results for cross-agent context
    sample_governance = {
        "violations": [
            {
                "id": "VIO-001",
                "policy_id": "GOV-PII-001",
                "severity": "Critical",
                "details": "PII access without certification",
                "recommendation": "Complete certification"
            }
        ],
        "total_violations": 1
    }

    print("=== Audit Agent Self-Test ===")
    result = run(sample_agents, llm_gateway.call_llm, governance_results=sample_governance)
    print(json.dumps(result, indent=2))
