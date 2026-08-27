"""
AETHER Governance Agent
========================
Evaluates onboarded AI agents against 8 enterprise governance policies
using the LLM gateway. Returns structured violations, recommended actions,
and aggregate statistics.

Policies enforced:
  GOV-PII-001   PII Access Control
  GOV-FIN-001   Financial Transaction Limit
  GOV-COST-001  Cost Anomaly Detection
  GOV-AUTH-001  Unauthorized Agent Detection
  GOV-MODEL-001 Model Version Control
  GOV-DATA-001  Cross-Region Data Transfer
  GOV-CERT-001  Certification Expiry
  GOV-IDLE-001  Idle Agent Detection

Uses only Python stdlib.
"""

import json
import datetime
import sys
import os

# ── Resolve imports from project root ─────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import llm_gateway

# ── Governance Policies Reference ─────────────────────────────

GOVERNANCE_POLICIES = [
    {
        "id": "GOV-PII-001",
        "name": "PII Access Control",
        "description": "Agent has PII access without proper certification",
        "severity_default": "Critical"
    },
    {
        "id": "GOV-FIN-001",
        "name": "Financial Transaction Limit",
        "description": "Agent handles financial data without required safeguards",
        "severity_default": "High"
    },
    {
        "id": "GOV-COST-001",
        "name": "Cost Anomaly Detection",
        "description": "Agent monthly cost exceeds acceptable threshold",
        "severity_default": "Medium"
    },
    {
        "id": "GOV-AUTH-001",
        "name": "Unauthorized Agent Detection",
        "description": "Agent is deployed without a registered owner or approval",
        "severity_default": "Critical"
    },
    {
        "id": "GOV-MODEL-001",
        "name": "Model Version Control",
        "description": "Agent model is not on the approved model list",
        "severity_default": "High"
    },
    {
        "id": "GOV-DATA-001",
        "name": "Cross-Region Data Transfer",
        "description": "Agent processes data across different regions",
        "severity_default": "High"
    },
    {
        "id": "GOV-CERT-001",
        "name": "Certification Expiry",
        "description": "Agent certification is about to expire or has expired",
        "severity_default": "Medium"
    },
    {
        "id": "GOV-IDLE-001",
        "name": "Idle Agent Detection",
        "description": "Agent is inactive but still carries an active status",
        "severity_default": "Low"
    }
]

# ── System prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are an enterprise AI governance engine. "
    "Evaluate AI agents against governance policies. "
    "Return structured JSON with violations found."
)

# ── Build user prompt ─────────────────────────────────────────

def _build_user_prompt(agents_list):
    """Construct the user prompt sent to the LLM."""
    policies_text = json.dumps(GOVERNANCE_POLICIES, indent=2)
    agents_text = json.dumps(agents_list, indent=2)

    prompt = (
        "Below is a list of AI agents and 8 governance policies.\n\n"
        "=== GOVERNANCE POLICIES ===\n"
        + policies_text + "\n\n"
        "=== AGENTS TO EVALUATE ===\n"
        + agents_text + "\n\n"
        "For EACH agent, check ALL 8 policies. An agent can have zero or more violations.\n\n"
        "Policy evaluation guidelines:\n"
        "- GOV-PII-001: Violation if piiAccess is true and certificationStatus is not 'certified'.\n"
        "- GOV-FIN-001: Violation if financialAccess is true.\n"
        "- GOV-COST-001: Violation if monthlyCost > 500.\n"
        "- GOV-AUTH-001: Violation if owner is null, empty, or 'unassigned', or if there is no approval.\n"
        "- GOV-MODEL-001: Violation if the agent model/platform is not on an approved list "
        "(approved: 'GPT-4', 'GPT-4o', 'Claude-3', 'Gemini-Pro', 'Llama-3').\n"
        "- GOV-DATA-001: Violation if region contains 'multi' or if purpose implies cross-region transfers.\n"
        "- GOV-CERT-001: Violation if certificationStatus is 'expiring', 'expired', or 'pending'.\n"
        "- GOV-IDLE-001: Violation if purpose or name suggests the agent is inactive/idle "
        "but environment shows it as active/production.\n\n"
        "Return a JSON object with this exact structure:\n"
        "{\n"
        '  "violations": [\n'
        "    {\n"
        '      "id": "VIO-001",\n'
        '      "policy_id": "GOV-...",\n'
        '      "policy_name": "...",\n'
        '      "agent_id": "...",\n'
        '      "agent_name": "...",\n'
        '      "severity": "Critical|High|Medium|Low",\n'
        '      "details": "Explanation of the violation",\n'
        '      "recommendation": "Recommended remediation action",\n'
        '      "status": "Open"\n'
        "    }\n"
        "  ],\n"
        '  "actions": [\n'
        "    {\n"
        '      "time": "ISO timestamp",\n'
        '      "action": "Description of governance action taken",\n'
        '      "agent": "agent name",\n'
        '      "type": "warning|danger|success|info"\n'
        "    }\n"
        "  ],\n"
        '  "total_violations": <number>\n'
        "}\n\n"
        "Number violations sequentially as VIO-001, VIO-002, etc.\n"
        "For each violation found, also add a matching entry in the actions array.\n"
        "Return ONLY valid JSON, no additional text."
    )
    return prompt


# ── Fallback: rule-based evaluation if LLM fails ─────────────

def _evaluate_fallback(agents_list):
    """Deterministic rule-based evaluation used when the LLM is unavailable."""
    violations = []
    actions = []
    vio_counter = 0
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    approved_models = {"gpt-4", "gpt-4o", "claude-3", "gemini-pro", "llama-3"}

    for agent in agents_list:
        agent_id = agent.get("id", "unknown")
        agent_name = agent.get("name", "Unknown Agent")

        # GOV-PII-001
        if agent.get("piiAccess") and agent.get("certificationStatus", "").lower() != "certified":
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-PII-001",
                "policy_name": "PII Access Control",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "Critical",
                "details": "Agent has PII access without valid certification. Current status: " + str(agent.get("certificationStatus", "none")),
                "recommendation": "Revoke PII access or complete certification immediately.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "PII access violation detected", "agent": agent_name, "type": "danger"})

        # GOV-FIN-001
        if agent.get("financialAccess"):
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-FIN-001",
                "policy_name": "Financial Transaction Limit",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "High",
                "details": "Agent handles financial data. Enhanced monitoring required.",
                "recommendation": "Implement transaction limits and enable financial audit logging.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Financial access flagged for review", "agent": agent_name, "type": "warning"})

        # GOV-COST-001
        cost = agent.get("monthlyCost", 0)
        if isinstance(cost, (int, float)) and cost > 500:
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-COST-001",
                "policy_name": "Cost Anomaly Detection",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "Medium",
                "details": "Monthly cost $" + str(cost) + " exceeds $500 threshold.",
                "recommendation": "Review agent usage and optimize or set budget alerts.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Cost anomaly detected ($" + str(cost) + ")", "agent": agent_name, "type": "warning"})

        # GOV-AUTH-001
        owner = str(agent.get("owner", "") or "").strip().lower()
        if not owner or owner == "unassigned" or owner == "none":
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-AUTH-001",
                "policy_name": "Unauthorized Agent Detection",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "Critical",
                "details": "Agent has no registered owner or approval record.",
                "recommendation": "Assign an owner and complete the approval workflow immediately.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Unauthorized agent flagged", "agent": agent_name, "type": "danger"})

        # GOV-MODEL-001 — checks the agent's LLM *model* (e.g. "gpt-4o",
        # "claude-3-5-sonnet"), not its deployment *platform* (e.g. "OpenAI
        # GPT", "Microsoft Copilot"). Those are different fields; comparing
        # platform against the model allowlist meant no value could ever
        # match, so every single onboarded agent was flagged. Matched by
        # prefix so dated/versioned model names (e.g. "claude-3-5-sonnet")
        # still count against their approved family ("claude-3").
        model = str(agent.get("model", "")).strip().lower()
        model_approved = any(model == m or model.startswith(m) for m in approved_models)
        if model and not model_approved:
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-MODEL-001",
                "policy_name": "Model Version Control",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "High",
                "details": "Model '" + model + "' is not on the approved list.",
                "recommendation": "Migrate to an approved model or submit an exception request.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Unapproved model detected", "agent": agent_name, "type": "warning"})

        # GOV-DATA-001
        region = str(agent.get("region", "")).strip().lower()
        if "multi" in region or "cross" in region or "global" in region:
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-DATA-001",
                "policy_name": "Cross-Region Data Transfer",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "High",
                "details": "Agent operates in region '" + region + "' which implies cross-region data transfers.",
                "recommendation": "Restrict data processing to a single approved region or obtain cross-region authorization.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Cross-region transfer flagged", "agent": agent_name, "type": "warning"})

        # GOV-CERT-001
        cert = str(agent.get("certificationStatus", "")).strip().lower()
        if cert in ("expiring", "expired", "pending"):
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-CERT-001",
                "policy_name": "Certification Expiry",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "Medium",
                "details": "Certification status is '" + cert + "'.",
                "recommendation": "Renew or complete certification before the deadline.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Certification issue detected", "agent": agent_name, "type": "warning"})

        # GOV-IDLE-001
        purpose = str(agent.get("purpose", "")).strip().lower()
        env = str(agent.get("environment", "")).strip().lower()
        name_lower = agent_name.lower()
        idle_keywords = ("idle", "inactive", "deprecated", "unused", "dormant")
        is_idle = any(kw in purpose or kw in name_lower for kw in idle_keywords)
        is_active = env in ("production", "active", "prod")
        if is_idle and is_active:
            vio_counter += 1
            vid = "VIO-" + str(vio_counter).zfill(3)
            violations.append({
                "id": vid,
                "policy_id": "GOV-IDLE-001",
                "policy_name": "Idle Agent Detection",
                "agent_id": agent_id,
                "agent_name": agent_name,
                "severity": "Low",
                "details": "Agent appears idle/inactive but is still in '" + env + "' environment.",
                "recommendation": "Decommission the agent or update its status to reflect actual usage.",
                "status": "Open"
            })
            actions.append({"time": now, "action": "Idle agent detected in active environment", "agent": agent_name, "type": "info"})

    return {
        "violations": violations,
        "actions": actions,
        "total_violations": len(violations)
    }


# ── Main entry point ──────────────────────────────────────────

def run(agents_list, llm_fn):
    """
    Evaluate AI agents against governance policies.

    Args:
        agents_list: list of agent dicts (id, name, platform, owner,
                     piiAccess, financialAccess, riskScore,
                     certificationStatus, environment, region,
                     purpose, monthlyCost)
        llm_fn:      callable — llm_gateway.call_llm(system, user)

    Returns:
        dict with violations, actions, total_violations, provider, timestamp
    """
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print("[Governance Agent] Starting evaluation for " + str(len(agents_list)) + " agent(s)")

    # ── Handle empty input ────────────────────────────────────
    if not agents_list:
        print("[Governance Agent] No agents to evaluate.")
        return {
            "violations": [],
            "actions": [{
                "time": timestamp,
                "action": "Governance scan completed — no agents to evaluate",
                "agent": "System",
                "type": "info"
            }],
            "total_violations": 0,
            "provider": "none",
            "timestamp": timestamp
        }

    # ── Call LLM ──────────────────────────────────────────────
    user_prompt = _build_user_prompt(agents_list)

    try:
        response = llm_fn(SYSTEM_PROMPT, user_prompt)
    except Exception as exc:
        print("[Governance Agent] LLM call raised exception: " + str(exc))
        response = {"success": False, "error": str(exc)}

    provider = "fallback-rules"

    if response.get("success"):
        provider = response.get("provider", "unknown") + " / " + response.get("model", "")
        parsed = llm_gateway.parse_json_response(response.get("text", ""))

        if parsed and isinstance(parsed, dict) and "violations" in parsed:
            print("[Governance Agent] LLM returned " + str(len(parsed.get("violations", []))) + " violation(s)")
            # Normalise and enrich LLM output
            violations = parsed.get("violations", [])
            actions = parsed.get("actions", [])

            # Ensure every violation has the required keys
            for v in violations:
                v.setdefault("status", "Open")
                v.setdefault("severity", "Medium")

            return {
                "violations": violations,
                "actions": actions,
                "total_violations": len(violations),
                "provider": provider,
                "timestamp": timestamp
            }
        else:
            print("[Governance Agent] LLM response could not be parsed as valid violations JSON. Falling back to rules.")
    else:
        print("[Governance Agent] LLM call failed: " + str(response.get("error", "unknown error")))
        print("[Governance Agent] Falling back to rule-based evaluation.")

    # ── Fallback: deterministic rule engine ────────────────────
    fallback = _evaluate_fallback(agents_list)
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

    print("=== Governance Agent Self-Test ===")
    result = run(sample_agents, llm_gateway.call_llm)
    print(json.dumps(result, indent=2))
