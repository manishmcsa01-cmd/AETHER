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

## Verify everything works

```bash
python -m unittest tests.test_trust -v     # 22 tests, all should pass
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
trust/            10 modules — the trust layer (identity, delegation,
                  reputation, recourse, escrow, ledger, policy, API)
tests/            22 tests
js/pages/trust.js SPA page that hosts the console
trust.html        the console itself (also works standalone)
docs/trust-layer.md   full API reference + production roadmap
requirements.txt
```

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
