"""
Risk Agent Module
Scores each AI agent's risk level using LLM-based reasoning.
Factors: PII access, financial access, endpoint exposure, platform, department, purpose.
"""

import json
import datetime

SYSTEM_PROMPT = (
    "You are an enterprise AI risk analyst. "
    "Assess the risk profile of AI agents. "
    "Return structured JSON."
)

BATCH_SIZE = 5

RISK_LEVELS = ["Low", "Medium", "High", "Critical"]


def _build_user_prompt(agents_batch):
    """Build a user prompt describing a batch of agents for risk assessment."""
    lines = []
    lines.append(
        "Assess the risk profile of the following AI agent(s). "
        "Consider these factors: PII access, financial access, endpoint exposure, "
        "platform, department, and purpose."
    )
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
        "For each agent, return a JSON object with this structure:\n"
        '{"agents": [\n'
        '  {\n'
        '    "id": "<agent id>",\n'
        '    "risk_score": 0-100,\n'
        '    "risk_level": "Low|Medium|High|Critical",\n'
        '    "reasoning": "<explanation of the risk assessment>",\n'
        '    "risk_factors": ["<factor 1>", "<factor 2>", ...]\n'
        '  }\n'
        ']}\n'
        "Respond ONLY with valid JSON, no markdown or extra text."
    )

    return "\n".join(lines)


def _empty_result():
    """Return an empty result when no agents are provided."""
    return {
        "agents": [],
        "high_risk_count": 0,
        "avg_risk_score": 0,
        "distribution": {"Low": 0, "Medium": 0, "High": 0, "Critical": 0},
        "provider": "none",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }


def _fallback_agent_result(agent, error_msg):
    """Build a fallback risk result for a single agent when LLM fails."""
    return {
        "id": agent.get("id", "unknown"),
        "name": agent.get("name", "unknown"),
        "risk_score": 0,
        "risk_level": "High",
        "reasoning": "Error during assessment: " + error_msg,
        "risk_factors": ["assessment_error"],
        "error": error_msg
    }


def _compute_distribution(agent_results):
    """Compute the distribution of risk levels across all assessed agents."""
    distribution = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for result in agent_results:
        level = result.get("risk_level", "High")
        if level in distribution:
            distribution[level] += 1
        else:
            # Normalize unexpected levels to nearest match
            level_lower = level.lower() if isinstance(level, str) else ""
            if "critical" in level_lower:
                distribution["Critical"] += 1
            elif "high" in level_lower:
                distribution["High"] += 1
            elif "medium" in level_lower or "moderate" in level_lower:
                distribution["Medium"] += 1
            else:
                distribution["Low"] += 1
    return distribution


def _compute_avg_risk_score(agent_results):
    """Compute average risk score across all agents."""
    if not agent_results:
        return 0
    scores = [r.get("risk_score", 0) for r in agent_results]
    return round(sum(scores) / len(scores), 1)


def _count_high_risk(agent_results):
    """Count agents with High or Critical risk level."""
    count = 0
    for result in agent_results:
        level = result.get("risk_level", "")
        if level in ("High", "Critical"):
            count += 1
    return count


def run(agents_list, llm_fn):
    """
    Assess risk profiles for a list of AI agents.

    Args:
        agents_list: List of agent dicts with keys: id, name, platform, department,
                     owner, piiAccess, financialAccess, riskScore, endpoint,
                     environment, purpose.
        llm_fn: Function with signature llm_fn.call_llm(system_prompt, user_prompt)
                that returns dict with 'success', 'text', 'provider', 'model'.

    Returns:
        Dict with risk assessments, distribution, and summary statistics.
    """
    print("[RiskAgent] Starting risk assessment for "
          + str(len(agents_list)) + " agent(s).")

    # Handle empty list
    if not agents_list:
        print("[RiskAgent] No agents to assess. Returning empty results.")
        return _empty_result()

    agent_results = []
    last_provider = "unknown"

    # Process agents in batches
    for batch_start in range(0, len(agents_list), BATCH_SIZE):
        batch = agents_list[batch_start:batch_start + BATCH_SIZE]
        batch_num = (batch_start // BATCH_SIZE) + 1
        print("[RiskAgent] Processing batch " + str(batch_num)
              + " (" + str(len(batch)) + " agent(s)).")

        user_prompt = _build_user_prompt(batch)

        try:
            response = llm_fn.call_llm(SYSTEM_PROMPT, user_prompt)
        except Exception as e:
            error_msg = "LLM call failed: " + str(e)
            print("[RiskAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        if not response.get("success", False):
            error_msg = "LLM returned unsuccessful response"
            print("[RiskAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        last_provider = response.get("provider", "unknown")
        raw_text = response.get("text", "")

        try:
            parsed = llm_fn.parse_json_response(raw_text)
        except Exception as e:
            error_msg = "Failed to parse LLM JSON: " + str(e)
            print("[RiskAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        if parsed is None:
            error_msg = "LLM returned unparseable response"
            print("[RiskAgent] " + error_msg)
            for agent in batch:
                agent_results.append(_fallback_agent_result(agent, error_msg))
            continue

        # Extract per-agent results from parsed response
        llm_agents = parsed.get("agents", [])

        # Build a lookup by agent id from LLM results
        llm_lookup = {}
        for lr in llm_agents:
            aid = str(lr.get("id", ""))
            llm_lookup[aid] = lr

        # Match LLM results back to batch agents
        for idx, agent in enumerate(batch):
            agent_id = str(agent.get("id", "unknown"))
            agent_name = str(agent.get("name", "unknown"))

            llm_agent_result = llm_lookup.get(agent_id)
            if llm_agent_result is None and idx < len(llm_agents):
                llm_agent_result = llm_agents[idx]

            if llm_agent_result is None:
                print("[RiskAgent] No LLM result found for agent: " + agent_id)
                agent_results.append(
                    _fallback_agent_result(agent, "No result returned by LLM for this agent")
                )
                continue

            # Normalize risk_level
            risk_level = str(llm_agent_result.get("risk_level", "High"))
            if risk_level not in RISK_LEVELS:
                # Best-effort normalization
                rl_lower = risk_level.lower()
                if "critical" in rl_lower:
                    risk_level = "Critical"
                elif "high" in rl_lower:
                    risk_level = "High"
                elif "medium" in rl_lower or "moderate" in rl_lower:
                    risk_level = "Medium"
                elif "low" in rl_lower:
                    risk_level = "Low"
                else:
                    risk_level = "High"

            risk_score = llm_agent_result.get("risk_score", 0)
            try:
                risk_score = int(risk_score)
            except (ValueError, TypeError):
                risk_score = 0
            risk_score = max(0, min(100, risk_score))

            agent_results.append({
                "id": agent_id,
                "name": agent_name,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "reasoning": str(llm_agent_result.get("reasoning", "")),
                "risk_factors": llm_agent_result.get("risk_factors", [])
            })

        print("[RiskAgent] Batch " + str(batch_num) + " completed successfully.")

    # Compute summary statistics
    distribution = _compute_distribution(agent_results)
    avg_risk_score = _compute_avg_risk_score(agent_results)
    high_risk_count = _count_high_risk(agent_results)

    result = {
        "agents": agent_results,
        "high_risk_count": high_risk_count,
        "avg_risk_score": avg_risk_score,
        "distribution": distribution,
        "provider": last_provider,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

    print("[RiskAgent] Assessment complete. "
          + str(len(agent_results)) + " agent(s) assessed. "
          + str(high_risk_count) + " high-risk, avg score: "
          + str(avg_risk_score) + ".")

    return result
