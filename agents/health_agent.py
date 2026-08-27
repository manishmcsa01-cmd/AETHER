"""
AETHER Health Monitoring Agent
================================
Checks AI agent health via endpoint pinging + LLM-based assessment.
Uses only Python stdlib (urllib, json, ssl, time, datetime).
"""

import json
import time
import datetime
import os
import sys
import ssl
import urllib.request
import urllib.error

# ── Resolve llm_gateway from project root ─────────────────────
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import llm_gateway


# ── Constants ─────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are an enterprise AI operations engineer. "
    "Assess the health of AI agents based on their operational metrics. "
    "Return structured JSON."
)

ENDPOINT_TIMEOUT = 5  # seconds

# Permissive SSL context for corporate environments
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


# ── Endpoint Probing ──────────────────────────────────────────

def _probe_endpoint(endpoint):
    """
    Probe an HTTP(S) endpoint. Try HEAD first, fall back to GET.

    Returns:
        dict with keys: reachable (bool), status_code (int|None),
                        response_time_ms (float|None), error (str|None)
    """
    if not endpoint or not isinstance(endpoint, str) or not endpoint.strip():
        return {
            "reachable": False,
            "status_code": None,
            "response_time_ms": None,
            "error": "No endpoint configured",
        }

    url = endpoint.strip()

    # Ensure the URL has a scheme
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    # Try HEAD first (lighter), then fall back to GET
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method)
            req.add_header("User-Agent", "AETHER-HealthAgent/1.0")

            start = time.time()
            with urllib.request.urlopen(req, context=_ssl_ctx, timeout=ENDPOINT_TIMEOUT) as resp:
                status_code = resp.getcode()
            elapsed_ms = round((time.time() - start) * 1000, 1)

            return {
                "reachable": True,
                "status_code": status_code,
                "response_time_ms": elapsed_ms,
                "error": None,
            }

        except urllib.error.HTTPError as e:
            # HTTP errors still mean the server is reachable
            elapsed_ms = round((time.time() - start) * 1000, 1)
            return {
                "reachable": True,
                "status_code": e.code,
                "response_time_ms": elapsed_ms,
                "error": "HTTP " + str(e.code),
            }

        except urllib.error.URLError as e:
            # Connection refused, DNS failure, etc. — try next method
            if method == "GET":
                return {
                    "reachable": False,
                    "status_code": None,
                    "response_time_ms": None,
                    "error": "URLError: " + str(e.reason),
                }

        except Exception as e:
            if method == "GET":
                return {
                    "reachable": False,
                    "status_code": None,
                    "response_time_ms": None,
                    "error": str(type(e).__name__) + ": " + str(e),
                }

    # Should not reach here, but just in case
    return {
        "reachable": False,
        "status_code": None,
        "response_time_ms": None,
        "error": "All probe methods exhausted",
    }


def _determine_preliminary_health(agent, probe_result):
    """
    Assign a preliminary health status from hard metrics (before LLM).
    This ensures we have usable data even if LLM is unavailable.
    """
    score = 100
    reasons = []

    # Endpoint reachability
    if not probe_result["reachable"]:
        endpoint = agent.get("endpoint", "")
        if endpoint and isinstance(endpoint, str) and endpoint.strip():
            score -= 40
            reasons.append("Endpoint unreachable")
        else:
            # No endpoint configured — not necessarily unhealthy
            score -= 5
            reasons.append("No endpoint configured")
    else:
        # Penalize slow responses (>2s is concerning, >4s is bad)
        rt = probe_result.get("response_time_ms") or 0
        if rt > 4000:
            score -= 25
            reasons.append("Very high response time: " + str(rt) + "ms")
        elif rt > 2000:
            score -= 10
            reasons.append("High response time: " + str(rt) + "ms")

        # Penalize error status codes
        sc = probe_result.get("status_code") or 200
        if sc >= 500:
            score -= 30
            reasons.append("Server error: HTTP " + str(sc))
        elif sc >= 400:
            score -= 15
            reasons.append("Client error: HTTP " + str(sc))

    # Incorporate provided metrics
    availability = _safe_float(agent.get("availability", 100))
    if availability < 90:
        score -= 20
        reasons.append("Low availability: " + str(availability) + "%")
    elif availability < 99:
        score -= 5

    success_rate = _safe_float(agent.get("successRate", 100))
    if success_rate < 80:
        score -= 20
        reasons.append("Low success rate: " + str(success_rate) + "%")
    elif success_rate < 95:
        score -= 5

    avg_latency = _safe_float(agent.get("avgLatency", 0))
    if avg_latency > 5000:
        score -= 15
        reasons.append("High avg latency: " + str(avg_latency) + "ms")
    elif avg_latency > 2000:
        score -= 5

    # Agent-reported status
    status = str(agent.get("status", "")).lower()
    if status in ("error", "failed", "down"):
        score -= 25
        reasons.append("Reported status: " + status)
    elif status in ("degraded", "warning"):
        score -= 10
        reasons.append("Reported status: " + status)

    score = max(0, min(100, score))

    if score >= 80:
        health_status = "Healthy"
    elif score >= 50:
        health_status = "Degraded"
    elif score > 0:
        health_status = "Unhealthy"
    else:
        health_status = "Unreachable"

    return {
        "health_score": score,
        "health_status": health_status,
        "assessment": "; ".join(reasons) if reasons else "All checks passed",
    }


# ── Helpers ───────────────────────────────────────────────────

def _safe_float(val, default=0.0):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _build_user_prompt(agent_health_data):
    """Build the LLM user prompt with collected probe results."""
    prompt_parts = [
        "Assess the health of the following AI agents based on their endpoint probe results and operational metrics.",
        "",
        "## Agent Health Data",
        json.dumps(agent_health_data, indent=2),
        "",
        "For each agent, provide:",
        "- \"health_score\": integer 0-100",
        "- \"health_status\": one of \"Healthy\", \"Degraded\", \"Unhealthy\", \"Unreachable\"",
        "- \"assessment\": brief text explaining the status",
        "",
        "Respond with a JSON object containing:",
        "1. \"agents\": array of objects, one per agent, each with keys: "
        "\"id\", \"name\", \"health_score\", \"health_status\", \"assessment\"",
        "2. \"overall_assessment\": a short paragraph summarizing fleet health",
        "",
        "Return ONLY the JSON object, no extra text.",
    ]
    return "\n".join(prompt_parts)


# ── Main entry point ─────────────────────────────────────────

def run(agents_list, llm_fn):
    """
    Check AI agent health via endpoint pinging + LLM assessment.

    Args:
        agents_list: list of agent dicts, each with keys:
            id, name, endpoint, platform, availability,
            avgLatency, successRate, status
        llm_fn: callable(system_prompt, user_prompt) -> dict

    Returns:
        dict with health assessment results.
    """
    print("[HealthAgent] Starting health check for " + str(len(agents_list)) + " agents")
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    # Handle empty input
    if not agents_list:
        print("[HealthAgent] No agents provided — returning empty results")
        return {
            "agents": [],
            "summary": {"total": 0, "healthy": 0, "degraded": 0, "unhealthy": 0},
            "provider": None,
            "timestamp": timestamp,
        }

    # Step 1: Probe all endpoints and compute preliminary health
    agents_health = []
    for agent in agents_list:
        agent_id = agent.get("id", "unknown")
        agent_name = agent.get("name", agent_id)
        endpoint = agent.get("endpoint", "")

        print("[HealthAgent] Probing " + agent_name + " (" + str(endpoint) + ")...")
        probe = _probe_endpoint(endpoint)

        if probe["reachable"]:
            print("[HealthAgent]   -> Reachable, HTTP " + str(probe["status_code"])
                  + ", " + str(probe["response_time_ms"]) + "ms")
        else:
            print("[HealthAgent]   -> NOT reachable: " + str(probe.get("error", "unknown")))

        preliminary = _determine_preliminary_health(agent, probe)

        entry = {
            "id": agent_id,
            "name": agent_name,
            "endpoint": endpoint if endpoint else None,
            "platform": agent.get("platform", "Unknown"),
            "endpoint_reachable": probe["reachable"],
            "response_time_ms": probe["response_time_ms"],
            "status_code": probe["status_code"],
            "health_score": preliminary["health_score"],
            "health_status": preliminary["health_status"],
            "assessment": preliminary["assessment"],
            # Include raw metrics for LLM context
            "availability": agent.get("availability"),
            "avgLatency": agent.get("avgLatency"),
            "successRate": agent.get("successRate"),
            "reported_status": agent.get("status"),
        }
        agents_health.append(entry)

    # Step 2: Ask LLM to refine the assessment
    provider = None
    try:
        print("[HealthAgent] Calling LLM for health assessment...")
        user_prompt = _build_user_prompt(agents_health)
        llm_result = llm_fn(SYSTEM_PROMPT, user_prompt)

        if llm_result.get("success"):
            provider = llm_result.get("provider")
            parsed = llm_gateway.parse_json_response(llm_result.get("text", ""))

            if parsed and isinstance(parsed, dict):
                llm_agents = parsed.get("agents", [])
                # Merge LLM assessments back into our data by matching on id
                llm_map = {}
                for la in llm_agents:
                    aid = la.get("id", "")
                    if aid:
                        llm_map[aid] = la

                valid_statuses = ("Healthy", "Degraded", "Unhealthy", "Unreachable")
                for entry in agents_health:
                    llm_entry = llm_map.get(entry["id"])
                    if llm_entry:
                        # LLM refines score, status, and assessment. Validated
                        # the same way risk_agent.py validates risk_score/
                        # risk_level, since this overwrites an already-clamped
                        # preliminary score/status and an out-of-range or
                        # non-numeric LLM value would otherwise propagate
                        # straight through to the "Availability %" KPI.
                        if "health_score" in llm_entry:
                            try:
                                score = float(llm_entry["health_score"])
                                entry["health_score"] = max(0, min(100, score))
                            except (ValueError, TypeError):
                                pass  # keep the preliminary heuristic score
                        if "health_status" in llm_entry:
                            status = str(llm_entry["health_status"])
                            if status in valid_statuses:
                                entry["health_status"] = status
                        if "assessment" in llm_entry:
                            entry["assessment"] = llm_entry["assessment"]

                print("[HealthAgent] LLM refined assessments for " + str(len(llm_map)) + " agents")
            else:
                print("[HealthAgent] WARNING: Could not parse LLM response as JSON")
        else:
            error_msg = llm_result.get("error", "Unknown error")
            print("[HealthAgent] LLM call failed: " + str(error_msg))
            print("[HealthAgent] Using preliminary health scores only")

    except Exception as e:
        print("[HealthAgent] Exception during LLM call: " + str(e))
        print("[HealthAgent] Using preliminary health scores only")

    # Step 3: Build summary counts
    healthy_count = 0
    degraded_count = 0
    unhealthy_count = 0

    for entry in agents_health:
        status = entry.get("health_status", "")
        if status == "Healthy":
            healthy_count += 1
        elif status == "Degraded":
            degraded_count += 1
        else:
            unhealthy_count += 1

    # Step 4: Clean up internal-only fields before returning
    output_agents = []
    for entry in agents_health:
        output_agents.append({
            "id": entry["id"],
            "name": entry["name"],
            "endpoint_reachable": entry["endpoint_reachable"],
            "response_time_ms": entry["response_time_ms"],
            "status_code": entry["status_code"],
            "health_score": entry["health_score"],
            "health_status": entry["health_status"],
            "assessment": entry["assessment"],
        })

    result = {
        "agents": output_agents,
        "summary": {
            "total": len(agents_list),
            "healthy": healthy_count,
            "degraded": degraded_count,
            "unhealthy": unhealthy_count,
        },
        "provider": provider,
        "timestamp": timestamp,
    }

    print("[HealthAgent] Health check complete — "
          + str(healthy_count) + " healthy, "
          + str(degraded_count) + " degraded, "
          + str(unhealthy_count) + " unhealthy")
    return result


# ── Self-test ─────────────────────────────────────────────────

if __name__ == "__main__":
    sample_agents = [
        {
            "id": "agent-001",
            "name": "CustomerSupportBot",
            "endpoint": "https://httpbin.org/status/200",
            "platform": "Azure OpenAI",
            "availability": 99.5,
            "avgLatency": 320,
            "successRate": 94.5,
            "status": "running",
        },
        {
            "id": "agent-002",
            "name": "DataAnalyzer",
            "endpoint": "https://localhost:9999/health",
            "platform": "AWS Bedrock",
            "availability": 87.0,
            "avgLatency": 1500,
            "successRate": 88.0,
            "status": "degraded",
        },
        {
            "id": "agent-003",
            "name": "InternalBot",
            "endpoint": "",
            "platform": "On-Prem",
            "availability": 99.9,
            "avgLatency": 50,
            "successRate": 99.0,
            "status": "running",
        },
    ]

    print("Running HealthAgent self-test...")
    output = run(sample_agents, llm_gateway.call_llm)
    print(json.dumps(output, indent=2))
