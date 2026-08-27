# AETHER — Start Here

Everything is integrated. The trust layer now lives inside the main app.

## Run it (3 steps)

```bash
cd C:\AETHER\AETHER
pip install -r requirements.txt        # one time — installs `cryptography`
python server.py
```

Open **http://localhost:3000** → click **Trust Console** in the left sidebar
(under the new "Trust Layer" section).

## Try the full flow in the Trust Console

The console panels are numbered in the order you use them:

1. **Register identity** — create one `principal` (that's you, the human) and
   two `agent` identities. Copy the `did:aether:…` values from the output box.
2. **Issue mandate** — paste the principal DID + first agent DID, keep scope
   `booking,research`, cap `$10`. Click Issue. The mandate id auto-fills panel 4.
3. **Fund account** — paste the *sender* agent DID, fund `$25` (demo money).
4. **Authorize transaction** — paste sender + receiver DIDs, purpose `booking`.
   → funds move into **escrow**. Then click **Complete last tx** to release them.
5. **Try a failure** — change purpose to `payments` and authorize again.
   → `Declined — DELEGATION: Purpose 'payments' outside scope`.
6. **Dispute** — authorize a fresh transaction, open a dispute on it, then
   resolve it. With no completion attestation on file, the sender is refunded
   automatically and the receiver's reputation drops.
7. **Reputation & ledger** — check any DID's verified reputation, verify the
   hash-chained ledger, or fetch a registry-signed agent card.

The **Portfolio Metrics** strip at the top of the console (identities,
active mandates, transactions, escrow held, disputes, average reputation,
ledger integrity, decline rate) updates automatically after every action
above — it's reading `GET /api/trust/metrics`, a live rollup, not a cached
snapshot.

## Verify everything works

```bash
python -m unittest tests.test_trust -v     # 24 tests, all should pass
```

## What changed in your existing files

| File | Change |
|---|---|
| `server.py` | Mounts `/api/trust/*` + `/.well-known/agent-card/*`; simulated data now behind `DEMO_MODE` |
| `index.html` | Loads `js/pages/trust.js` |
| `js/app.js` | New "Trust Layer" sidebar section + page title |
| `llm_gateway.py` | TLS verification ON by default (set `AETHER_INSECURE_SSL=1` only if a proxy forces it) |
| `mcp_server.py` | Database path resolved relative to the project (was hardcoded to a stale path) |

Nothing was removed. Every existing page, agent, and endpoint still works.

## New files

```
trust/            11 modules — the trust layer (identity, delegation,
                  reputation, recourse, escrow, ledger, policy, metrics, API)
tests/            24 tests
js/pages/trust.js SPA page that hosts the console
trust.html        the console itself (also works standalone) — now with a
                  live Portfolio Metrics KPI strip
docs/trust-layer.md   full API reference + production roadmap
requirements.txt
```

## Metrics audit (this update)

The existing governance/operations dashboards were audited against their
own displayed formulas. Fixed: **Policy Adherence** and **Overall
Compliance Score** each had a second, divergent copy of their formula
living in `js/pages/governance.js` that could show a different number than
the canonical one on the Dashboard; the benchmark table's **"Policy
Adherence"** row was silently plotting the Compliance Score instead;
**"Agent Utilization"** was wired to a cost-efficiency metric that isn't
utilization at all (now backed by a real utilization KPI: % of onboarded
agents that are Active and have executed at least one task); the **Biggest
Gap** card's label was hardcoded to "Utilization" regardless of which
metric actually had the biggest gap; and the **Cost Advantage** card and
two "Key Recommendations" cards had static, fabricated numbers that didn't
track the live KPI they claimed to describe. Full detail in the commit
notes / rationale pages for `policyAdherence`, `complianceScore`,
`auditReadiness`, and `agentUtilization`.

The trust layer itself had no fleet-wide KPI surface — every endpoint was
a per-record lookup. `trust/metrics.py` + `GET /api/trust/metrics` +
the console's new Portfolio Metrics strip close that gap.

## Second audit pass (this update)

A full re-audit of `js/data.js` (the canonical KPI engine), every page
module, the trust console, and the Python supervisor agents, verified
live against a running server (real `/api/run-agent/*` calls + direct
SQLite inspection), not just by reading code. Highlights:

- **Phantom benchmark data**: `rationale.js`'s "Metrics Above Benchmark"
  and "Biggest Gap" drill-downs referenced `AETHER.data.benchmarks`, a
  property that never existed — they always silently showed "0/8" and
  "+0.0%" no matter how the fleet was actually performing. Added a single
  canonical `AETHER.data.computeBenchmarks()` and pointed every consumer
  (dashboard, operations, rationale) at it — this also removed three
  independently-drifting copies of the same 8-row benchmark array.
- **Credential rotation was fake**: the Identity page always showed 0
  pending/expiring credentials and "Active" for everyone, because
  `createdDate` was stamped to "today" on every agent load instead of
  using the real onboarding date. Fixed the two-layer pipeline
  (`agents-config.js`'s `_createOnboardEntry()` and `data.js`'s
  `convertOnboardedAgent()`) so real onboarding dates flow through, and
  added a real 90-day rotation / 30-day expiring-soon calculation
  (`computeIdentity()`).
- **Policy Adherence miscounted violations**: it divided by raw violation
  *events* instead of distinct offending agents, so one agent with 3
  violation types counted as 3 non-adherent agents.
- **Two mislabeled policies**: financial-access and high-risk violations
  were being attributed to unrelated existing policies; added the two
  policies they actually belong to (POL-009, POL-010).
- **Discovery Coverage sparkline** was plotting Compliance Score's trend
  data (copy-paste bug in `computeDynamicTrends()`).
- **Backend fallback paths were dead code in disguise**: with no LLM
  provider configured, `audit_agent.py`'s fallback read `violations`/
  `risks` keys that compliance/risk agents never produce (real keys are
  `findings`/`agents`) — audit findings only ever populated from
  governance, silently. `governance_agent.py`'s model-approval check read
  `agent.get("platform")` instead of `agent.get("model")`, flagging every
  single agent regardless of its actual model. `risk_agent.py`'s fallback
  produced a contradictory `risk_score: 0` paired with `risk_level:
  "High"`. All three fixed and verified against a live run.
- **`server.py`'s KPI history logger** wrote hardcoded constants
  (`compliance_score: 100.0`, `avg_reliability: 99.9`, `policy_violations:
  0`, `pii_exposure: 0`, `critical_incidents: 0`, `budget_efficiency:
  100.0`) into `kpi_history` on every run instead of real values — so
  historical trend charts were flat lines regardless of what actually
  happened. Now computed from real agent/table data.
- Several smaller fixes across `executive.js` (mislabeled $M vs $K spend
  chart, falsy-zero bug on `connectedSystems`, overstated annual/YTD
  projections), `integrations.js` (Connected Platforms / Active Webhooks /
  SDK Registrations were miscounted), `audit.js` (rationale links pointing
  at the wrong KPI), and `agents-supervisor.js` (status-dot animation
  class was never applied).

Every touched file passed `node --check` / `python3 -m py_compile`, the
existing `tests/test_trust.py` suite (24/24), and a live smoke test
against a running server with real SQLite inspection.

## Demo vs real mode

Add to your `.env`:

```
DEMO_MODE=true     # simulated metrics + demo funding endpoint (default)
DEMO_MODE=false    # real recorded activity only; funding endpoint disabled
```

Keep `true` for demos and investor walkthroughs. Switch to `false` when you
want the dashboards to reflect only genuine, signed, escrow-settled activity.

---

**Next milestones** (see the roadmap at the end of `docs/trust-layer.md`):
real settlement rails, non-custodial keys everywhere, external ledger
anchoring, and authentication on the platform's own management API.
