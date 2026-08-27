"""
Compliance Agent Module
Evaluates onboarded AI agents against 5 compliance frameworks using LLM.
Frameworks: GDPR, SOX, HIPAA, SOC 2, ISO 27001
"""

import json
import datetime

SYSTEM_PROMPT = (
    "You are an enterprise AI compliance auditor. "
    "Evaluate the given AI agent against compliance frameworks. "
    "Return your assessment as JSON."
)

FRAMEWORKS = ["GDPR", "SOX", "HIPAA", "SOC 2", "ISO 27001"]

BATCH_SIZE = 5


def _build_user_prompt(agents_batch):
    """Build a user prompt describing a batch of agents for compliance evaluation."""
    lines = []
    lines.append("Evaluate the following AI agent(s) against these compliance frameworks: "
                 + ", ".join(FRAMEWORKS) + ".")
    lines.append("")

    for idx, agent in enumerate(agents_batch):
        lines.append("Agent " + str(idx + 1) + ":")
        lines.append("  ID: " + str(agent.get("id", "unknown")))
        lines.append("  Name: " + str(agent.get("name", "unknown")))
        lines.append("  Platform: " + str(agent.get("platform", "unknown")))
        lines.append("  Department: " + str(agent.get("department", "unknown")))
        lines.append("  Owner: " + str(agent.get("owner", "unknown")))
        lines.append("  PII Access: " + str(agent.get("piiAccess", False)))
        lines.append("  Financial Access: " + str(agent.get("financialAccess", False)))
        lines.append("  Risk Score: " + str(agent.get("riskScore", 0)))
        lines.append("  Endpoint: " + str(agent.get("endpoint", "unknown")))
        lines.append("  Environment: " + str(agent.get("environment", "unknown")))
        lines.append("  Purpose: " + str(agent.get("purpose", "unknown")))
        lines.append("")

    lines.append(
        "For EACH agent, return a JSON object with this structure:\n"
        '{"results": [\n'
        '  {\n'
        '    "agent_id": "<agent id>",\n'
        '    "frameworks": [\n'
        '      {"name": "GDPR", "compliant": true/false, "score": 0-100, "findings": ["..."]},\n'
        '      {"name": "SOX", "compliant": true/false, "score": 0-100, "findings": ["..."]},\n'
        '      {"name": "HIPAA", "compliant": true/false, "score": 0-100, "findings": ["..."]},\n'
        '      {"name": "SOC 2", "compliant": true/false, "score": 0-100, "findings": ["..."]},\n'
        '      {"name": "ISO 27001", "compliant": true/false, "score": 0-100, "findings": ["..."]}\n'
        '    ],\n'
        '    "overall_score": 0-100\n'
        '  }\n'
        ']}\n'
        "Respond ONLY with valid JSON, no markdown or extra text."
    )

    return "\n".join(lines)


def _empty_result():
    """Return an empty result when no agents are provided."""
    return {
        "frameworks": [
            {"name": fw, "avg_score": 0, "compliant_count": 0, "total_count": 0}
            for fw in FRAMEWORKS
        ],
        "findings": [],
        "agent_results": [],
        "provider": "none",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }


def _fallback_agent_result(agent, error_msg):
    """Build a fallback result for a single agent when LLM fails."""
    return {
        "agent_id": agent.get("id", "unknown"),
        "agent_name": agent.get("name", "unknown"),
        "frameworks": [
            {"name": fw, "compliant": False, "score": 0, "findings": ["Error: " + error_msg]}
            for fw in FRAMEWORKS
        ],
        "overall_score": 0,
        "error": error_msg
    }


def _aggregate_frameworks(agent_results):
    """Aggregate framework scores across all agent results."""
    fw_data = {}
    for fw in FRAMEWORKS:
        fw_data[fw] = {"scores": [], "compliant_count": 0, "findings": []}

    for result in agent_results:
        for fw_result in result.get("frameworks", []):
            fw_name = fw_result.get("name", "")
            if fw_name in fw_data:
                fw_data[fw_name]["scores"].append(fw_result.get("score", 0))
                if fw_result.get("compliant", False):
                    fw_data[fw_name]["compliant_count"] += 1
                fw_data[fw_name]["findings"].extend(fw_result.get("findings", []))

    aggregated = []
    for fw in FRAMEWORKS:
        scores = fw_data[fw]["scores"]
        avg_score = 0
        if scores:
            avg_score = round(sum(scores) / len(scores), 1)
        aggregated.append({
            "name": fw,
            "avg_score": avg_score,
            "compliant_count": fw_data[fw]["compliant_count"],
            "total_count": len(scores),
            "findings": fw_data[fw]["findings"]
        })

    return aggregated


def _collect_all_findings(agent_results):
    """Collect all findings across all agents and frameworks."""
    all_findings = []
    for result in agent_results:
        agent_id = result.get("agent_id", "unknown")
        agent_name = result.get("agent_name", "unknown")
        for fw_result in result.get("frameworks", []):
            fw_name = fw_result.get("name", "")
            for finding in fw_result.get("findings", []):
                all_findings.append({
                    "agent_id": agent_id,
                    "agent_name": agent_name,
                    "framework": fw_name,
                    "finding": finding
                })
    return all_findings


def run(agents_list, llm_fn):
    """
    Evaluate agents against compliance frameworks.

    Args:
        agents_list: List of agent dicts with keys: id, name, platform, department,
                     owner, piiAccess, financialAccess, riskScore, endpoint,
                     environment, purpose.
        llm_fn: Function with signature llm_fn.call_llm(system_prompt, user_prompt)
                that returns dict with 'success', 'text', 'provider', 'model'.

    Returns:
        Dict with aggregated compliance results.
    """
    print("[ComplianceAgent] Starting compliance evaluation for "
          + str(len(agents_list)) + " agent(s).")

    # Handle empty list
    if not agents_list:
        print("[ComplianceAgent] No agents to evaluate. Returning empty results.")
        return _empty_result()

    agent_results = []
    last_provider = "unknown"

    # Process agents in batches
    for batch_start in range(0, len(agents_list), BATCH_SIZE):
        batch = agents_list[batch_start:batch_start + BATCH_SIZE]
        batch_num = (batch_start // BATCH_SIZE) + 1
        print("[ComplianceAgent] Processing batch " + str(batch_num)
              + " (" + str(len(batch)) + " agent(s)).")

        user_prompt = _build_user_prompt(batch)

        try:
            response = llm_fn.call_llm(SYSTEM_PROMPT, user_prompt)
        except Exception as e:
            error_msg = "LLM call failed: " + str(e)
            print("[ComplianceAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        if not response.get("success", False):
            error_msg = "LLM returned unsuccessful response"
            print("[ComplianceAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        last_provider = response.get("provider", "unknown")
        raw_text = response.get("text", "")

        try:
            parsed = llm_fn.parse_json_response(raw_text)
        except Exception as e:
            error_msg = "Failed to parse LLM JSON: " + str(e)
            print("[ComplianceAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        if parsed is None:
            error_msg = "LLM returned unparseable response"
            print("[ComplianceAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        # Extract per-agent results from parsed response
        llm_results = parsed.get("results", [])

        # Build a lookup by agent_id from LLM results
        llm_lookup = {}
        for lr in llm_results:
            aid = str(lr.get("agent_id", ""))
            llm_lookup[aid] = lr

        # Also handle case where LLM returns results in order without matching IDs
        for idx, agent in enumerate(batch):
            agent_id = str(agent.get("id", "unknown"))
            agent_name = str(agent.get("name", "unknown"))

            llm_agent_result = llm_lookup.get(agent_id)
            if llm_agent_result is None and idx < len(llm_results):
                llm_agent_result = llm_results[idx]

            if llm_agent_result is None:
                print("[ComplianceAgent] No LLM result found for agent: " + agent_id)
                agent_results.append(
                    _fallback_agent_result(agent, "No result returned by LLM for this agent")
                )
                continue

            # Normalize frameworks list. Casts are guarded (matching
            # risk_agent.py's pattern) — a malformed score for one agent in
            # one batch should degrade that agent's score to 0, not raise
            # and abort the whole run, discarding every other agent's
            # already-computed results in the same batch/request.
            def _safe_int(value):
                try:
                    return int(value)
                except (ValueError, TypeError):
                    return 0

            frameworks = llm_agent_result.get("frameworks", [])
            normalized_fws = []
            for fw in frameworks:
                normalized_fws.append({
                    "name": fw.get("name", "Unknown"),
                    "compliant": bool(fw.get("compliant", False)),
                    "score": _safe_int(fw.get("score", 0)),
                    "findings": fw.get("findings", [])
                })

            agent_results.append({
                "agent_id": agent_id,
                "agent_name": agent_name,
                "frameworks": normalized_fws,
                "overall_score": _safe_int(llm_agent_result.get("overall_score", 0))
            })

        print("[ComplianceAgent] Batch " + str(batch_num) + " completed successfully.")

    # Aggregate results
    aggregated_frameworks = _aggregate_frameworks(agent_results)
    all_findings = _collect_all_findings(agent_results)

    result = {
        "frameworks": aggregated_frameworks,
        "findings": all_findings,
        "agent_results": agent_results,
        "provider": last_provider,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

    print("[ComplianceAgent] Evaluation complete. "
          + str(len(agent_results)) + " agent(s) evaluated, "
          + str(len(all_findings)) + " finding(s) collected.")

    return result
