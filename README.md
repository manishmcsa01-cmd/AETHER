# AETHER

**The trust layer for the agent economy — identity, delegation, reputation, and recourse for AI agents that transact with each other.**

Before an AI agent hands money or authority to another agent, someone has to be able to answer four questions with evidence, not self-reported metadata: *Who is this agent, verifiably? Who authorized it, and up to what limit? What's its track record? And when it goes wrong, who pays?* AETHER answers all four, plus the enterprise governance dashboard ("Workday for AI Workers") that sits on top of it.

## What's in here

| Layer | What it does | Code |
|---|---|---|
| **Identity** | Ed25519 keypair + DID per agent/principal, signed agent cards served at `/.well-known/agent-card/<did>` | [`trust/identity.py`](trust/identity.py) |
| **Delegation** | Signed, chainable, strictly-narrowing mandates from a human principal to an agent (scope, spend cap, expiry) | [`trust/delegation.py`](trust/delegation.py) |
| **Transactions** | Escrowed agent-to-agent clearing on a hash-chained, tamper-evident ledger | [`trust/a2a.py`](trust/a2a.py), [`trust/store.py`](trust/store.py) |
| **Reputation** | Computed only from escrow-settled, signed transaction outcomes — never self-reported | [`trust/reputation.py`](trust/reputation.py) |
| **Recourse** | Disputes, evidence, deterministic-first arbitration, refunds | [`trust/recourse.py`](trust/recourse.py) |
| **Policy** | Deterministic enforcement engine (token limits, reputation floor, unapproved receivers) | [`trust/policy.py`](trust/policy.py) |
| **Governance dashboard** | 6 supervisory agents (governance, risk, cost, health, compliance, audit) monitoring an enterprise AI fleet | [`agents/`](agents/) |

Full protocol reference and the production hardening roadmap: [`docs/trust-layer.md`](docs/trust-layer.md).

## Quick start

```bash
pip install -r requirements.txt        # cryptography (trust layer) + mcp (optional MCP server)
python server.py
```

Open **http://localhost:3000** and click **Trust Console** in the sidebar, or go straight to `http://localhost:3000/trust.html`. Step-by-step walkthrough of the full identity → mandate → escrow → dispute flow: [`START_HERE.md`](START_HERE.md).

Run the test suite:

```bash
python -m unittest tests.test_trust -v   # 22 tests
```

## Configuration

Copy `.env` and set (nothing is required to run in demo mode):

| Variable | Default | Meaning |
|---|---|---|
| `DEMO_MODE` | `true` | Simulated fleet metrics + demo funding endpoint. Set `false` for real-data-only mode. |
| `AETHER_PORT` | `3000` | HTTP server port. |
| `AETHER_DB` | `aether.db` | SQLite database path. |
| `AETHER_INSECURE_SSL` | unset | Leave unset — TLS verification is on by default in `llm_gateway.py`. |

**Never commit real API keys or tokens in `.env`.** It's gitignored; keep it that way.

## Honest state of the stack

The docs in `docs/` describe target/aspirational architecture (React, FastAPI, PostgreSQL, Kubernetes). What's actually implemented today is a vanilla JS frontend and a Python stdlib `http.server` + SQLite backend, with `cryptography` (Ed25519) as the one real dependency for the trust layer. Don't present the target architecture as built — see the roadmap in [`docs/trust-layer.md`](docs/trust-layer.md) for what's genuinely there versus what's next (non-custodial keys everywhere, real settlement rails, external ledger anchoring, full A2A task lifecycle, auth on the management API).

## Repo layout

```
trust/            10 modules — identity, delegation, reputation, recourse, escrow, ledger, policy, API
tests/            trust-layer test suite (22 tests)
agents/           supervisory agents for the governance dashboard
js/, css/         frontend (vanilla JS SPA)
docs/             architecture, API spec, trust-layer protocol reference
trust.html        standalone Trust Console
server.py         HTTP backend — mounts the dashboard API and /api/trust/*
mcp_server.py     MCP stdio server for querying the agent registry
```
