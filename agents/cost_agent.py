"""
AETHER Cost Optimization Agent
===============================
Analyzes AI agent costs and finds optimization opportunities using LLM.
Uses only Python stdlib.
"""

import json
import time
import datetime
import os
import sys

# ── Resolve llm_gateway from project root ─────────────────────
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import llm_gateway


# ── Constants ─────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are an enterprise AI cost optimization analyst. "
    "Analyze AI agent spending patterns and identify optimization opportunities. "
    "Return structured JSON."
)


# ── Helpers ───────────────────────────────────────────────────

def _safe_float(val, default=0.0):
    """Safely convert a value to float."""
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _safe_int(val, default=0):
    """Safely convert a value to int."""
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _compute_basic_metrics(agents_list):
    """Pre-compute metrics from the raw agent data before LLM analysis."""
    total_spend = 0.0
    total_tasks = 0
    platform_costs = {}
    spenders = []

    for agent in agents_list:
        cost = _safe_float(agent.get("monthlyCost", 0))
        tasks = _safe_int(agent.get("tasksExecuted", 0))
        platform = agent.get("platform", "Unknown")
        name = agent.get("name", agent.get("id", "Unknown"))

        total_spend += cost
        total_tasks += tasks

        # Aggregate by platform
        if platform not in platform_costs:
            platform_costs[platform] = 0.0
        platform_costs[platform] += cost

        spenders.append({
            "name": name,
            "cost": cost,
            "tasks": tasks,
            "cost_per_task": round(cost / tasks, 4) if tasks > 0 else 0,
            "successRate": _safe_float(agent.get("successRate", 0)),
            "tokenUsage": _safe_int(agent.get("tokenUsage", 0)),
            "department": agent.get("department", "Unknown"),
            "platform": platform,
        })

    # Sort by cost descending
    spenders.sort(key=lambda x: x["cost"], reverse=True)

    agent_count = len(agents_list)
    avg_cost_per_agent = round(total_spend / agent_count, 2) if agent_count > 0 else 0
    avg_cost_per_task = round(total_spend / total_tasks, 4) if total_tasks > 0 else 0

    by_platform = {
        "labels": list(platform_costs.keys()),
        "data": [round(v, 2) for v in platform_costs.values()],
    }

    return {
        "total_monthly_spend": round(total_spend, 2),
        "avg_cost_per_agent": avg_cost_per_agent,
        "avg_cost_per_task": avg_cost_per_task,
        "by_platform": by_platform,
        "top_spenders": spenders[:5],
        "all_agents_summary": spenders,
        "total_tasks": total_tasks,
    }


def _build_user_prompt(agents_list, metrics):
    """Build the user prompt for the LLM with pre-computed metrics."""
    prompt_parts = [
        "Analyze the following AI agent cost data and provide optimization recommendations.",
        "",
        "## Pre-computed Metrics",
        json.dumps(metrics, indent=2),
        "",
        "## Raw Agent Data",
        json.dumps(agents_list, indent=2),
        "",
        "Respond with a JSON object containing these keys:",
        "1. \"anomalies\": array of objects with keys: \"agent\" (name), \"issue\" (description), \"severity\" (\"high\"|\"medium\"|\"low\")",
        "2. \"recommendations\": array of objects with keys: \"title\", \"description\", \"savings\" (estimated $ or %), \"priority\" (\"high\"|\"medium\"|\"low\")",
        "3. \"roi_analysis\": a short paragraph summarizing ROI and cost-efficiency outlook",
        "",
        "Return ONLY the JSON object, no extra text.",
    ]
    return "\n".join(prompt_parts)


# ── Main entry point ─────────────────────────────────────────

def run(agents_list, llm_fn):
    """
    Analyze AI agent costs and find optimization opportunities.

    Args:
        agents_list: list of agent dicts, each with keys:
            id, name, platform, monthlyCost, tasksExecuted,
            successRate, tokenUsage, department
        llm_fn: callable(system_prompt, user_prompt) -> dict

    Returns:
        dict with cost analysis results.
    """
    print("[CostAgent] Starting cost analysis for " + str(len(agents_list)) + " agents")
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    # Handle empty input
    if not agents_list:
        print("[CostAgent] No agents provided — returning empty results")
        return {
            "total_monthly_spend": 0,
            "avg_cost_per_agent": 0,
            "avg_cost_per_task": 0,
            "by_platform": {"labels": [], "data": []},
            "top_spenders": [],
            "anomalies": [],
            "recommendations": [],
            "roi_analysis": "No agents to analyze.",
            "provider": None,
            "timestamp": timestamp,
        }

    # Step 1: Compute deterministic metrics from the data
    metrics = _compute_basic_metrics(agents_list)
    print("[CostAgent] Total monthly spend: $" + str(metrics["total_monthly_spend"]))
    print("[CostAgent] Avg cost/task: $" + str(metrics["avg_cost_per_task"]))

    # Step 2: Ask LLM for anomalies, recommendations, and ROI analysis
    user_prompt = _build_user_prompt(agents_list, metrics)
    llm_anomalies = []
    llm_recommendations = []
    llm_roi = "LLM analysis unavailable."
    provider = None

    try:
        print("[CostAgent] Calling LLM for optimization analysis...")
        llm_result = llm_fn(SYSTEM_PROMPT, user_prompt)

        if llm_result.get("success"):
            provider = llm_result.get("provider")
            parsed = llm_gateway.parse_json_response(llm_result.get("text", ""))

            if parsed and isinstance(parsed, dict):
                llm_anomalies = parsed.get("anomalies", [])
                llm_recommendations = parsed.get("recommendations", [])
                llm_roi = parsed.get("roi_analysis", "Analysis complete.")
                print("[CostAgent] LLM returned " + str(len(llm_anomalies)) + " anomalies, "
                      + str(len(llm_recommendations)) + " recommendations")
            else:
                print("[CostAgent] WARNING: Could not parse LLM response as JSON")
        else:
            error_msg = llm_result.get("error", "Unknown error")
            print("[CostAgent] LLM call failed: " + str(error_msg))

    except Exception as e:
        print("[CostAgent] Exception during LLM call: " + str(e))

    # Step 3: Assemble final result
    result = {
        "total_monthly_spend": metrics["total_monthly_spend"],
        "avg_cost_per_agent": metrics["avg_cost_per_agent"],
        "avg_cost_per_task": metrics["avg_cost_per_task"],
        "total_tasks": metrics["total_tasks"],
        "by_platform": metrics["by_platform"],
        "top_spenders": metrics["top_spenders"],
        "all_agents_summary": metrics["all_agents_summary"],
        "anomalies": llm_anomalies,
        "recommendations": llm_recommendations,
        "roi_analysis": llm_roi,
        "provider": provider,
        "timestamp": timestamp,
    }

    print("[CostAgent] Analysis complete")
    return result


# ── Self-test ─────────────────────────────────────────────────

if __name__ == "__main__":
    sample_agents = [
        {
            "id": "agent-001",
            "name": "CustomerSupportBot",
            "platform": "Azure OpenAI",
            "monthlyCost": 1250.00,
            "tasksExecuted": 15000,
            "successRate": 94.5,
            "tokenUsage": 2500000,
            "department": "Support",
        },
        {
            "id": "agent-002",
            "name": "DataAnalyzer",
            "platform": "AWS Bedrock",
            "monthlyCost": 890.00,
            "tasksExecuted": 3200,
            "successRate": 88.0,
            "tokenUsage": 1800000,
            "department": "Analytics",
        },
        {
            "id": "agent-003",
            "name": "CodeReviewer",
            "platform": "Azure OpenAI",
            "monthlyCost": 2100.00,
            "tasksExecuted": 800,
            "successRate": 72.0,
            "tokenUsage": 4200000,
            "department": "Engineering",
        },
    ]

    print("Running CostAgent self-test...")
    output = run(sample_agents, llm_gateway.call_llm)
    print(json.dumps(output, indent=2))
