# AETHER Trust Layer — Identity, Delegation, Reputation, Recourse

> **Status:** Implemented (v1) · **Module:** `trust/` · **Console:** `trust.html` · **Tests:** `tests/test_trust.py`

The trust layer turns AETHER from a governance dashboard into the clearing
infrastructure for agent-to-agent commerce: before any agent hands money or
authority to another agent, the platform can answer four questions with
cryptographic evidence rather than self-reported metadata.

| Pillar | Question answered | Module |
|---|---|---|
| **Identity** | Who is this agent, verifiably? | `trust/identity.py` |
| **Delegation** | Who authorized it, and up to what limit? | `trust/delegation.py` |
| **Reputation** | What is its verified track record? | `trust/reputation.py` |
| **Recourse** | When it goes wrong, who pays and how? | `trust/recourse.py` |

Supporting modules: `trust/crypto_utils.py` (Ed25519 + canonical JSON),
`trust/store.py` (SQLite + hash-chained ledger + escrow accounts),
`trust/policy.py` (deterministic policy engine), `trust/a2a.py` (escrowed
transactions), `trust/api.py` (HTTP routes, mounted by `server.py`).

---

## 1. Identity — Ed25519 keys, DIDs, signed agent cards

Every agent and principal registers an identity backed by an **Ed25519
keypair** and addressed by a **DID** (`did:aether:<hex>`).

- **Custodial (demo) mode** — omit `public_key` at registration: a keypair is
  generated, the private key is returned **once**, and a copy is retained so
  the platform can `auto_sign` on the identity's behalf. Convenient for demos.
- **Non-custodial (production) mode** — register with your own `public_key`.
  The private key never touches the server; every operation must carry a
  caller-produced signature. This is the deployment model for real trust.

The registry itself holds a **trust-anchor keypair** and countersigns every
**agent card** served at `/.well-known/agent-card/<did>`, so any third party
holding the registry public key can verify a card offline.

```
POST /api/trust/identity/register   {"kind":"agent","name":"Booking Agent"}
GET  /.well-known/agent-card/did:aether:...
```

## 2. Delegation — signed, chainable, narrowing mandates

A **mandate** is a signed grant of authority from a principal to an agent:

```json
{
  "principal_did": "did:aether:… (human/org)",
  "agent_did": "did:aether:… (the empowered agent)",
  "scope": ["booking", "research"],
  "spend_cap_usd": 10.0,
  "max_tokens_per_tx": 100000,
  "expires_at": "2027-01-01T00:00:00+00:00"
}
```

Root mandates are signed by the principal. Agents may **sub-delegate** by
issuing child mandates (signed with the *parent agent's* key), but a child
must be strictly narrower: scope ⊆ parent scope, cap ≤ parent cap, expiry ≤
parent expiry. `verify_chain` walks every link to the root principal and
checks signatures, expiry, revocation, scope, per-transaction token limits,
and **cumulative chain spend** (a sub-agent's spending counts against every
ancestor's cap). Revoking any mandate in the chain kills everything below it.

```
POST /api/trust/mandate/issue    (auto_sign or caller signature)
POST /api/trust/mandate/verify   {"mandate_id":"MND-…","purpose":"booking","amount_usd":1.0}
POST /api/trust/mandate/revoke
```

## 3. Transactions — escrowed clearing on a hash-chained ledger

`POST /api/trust/a2a/authorize` runs the full clearing sequence:

1. **Identity** — both DIDs registered; sender's Ed25519 signature over the
   canonical request payload verifies.
2. **Delegation** — the mandate chain authorizes this exact purpose, amount,
   and token count, and the mandate belongs to the sender.
3. **Policy** — deterministic engine (`trust/policy.py`): token hard limit,
   unapproved receiver models, critical risk scores, **reputation floor**
   (receivers with ≥5 verified events and score <30 are declined).
4. **Escrow** — the USD amount moves from the sender's balance into escrow;
   insufficient funds decline the transaction.
5. **Ledger** — the event lands on the tamper-evident hash chain.

`POST /api/trust/a2a/complete` requires the **receiver's signed completion
attestation**; only then does escrow release to the receiver. Declines are
recorded with machine-readable reasons (`IDENTITY: …`, `DELEGATION: …`,
`POLICY GOV-…`, `ESCROW: …`).

The ledger (`trust_ledger`) is append-only; each entry hashes its
predecessor. `GET /api/trust/ledger/verify` re-walks the entire chain and
pinpoints the first broken link if anything was tampered with.

## 4. Reputation — computed only from verified outcomes

Reputation (`GET /api/trust/reputation/<did>`) is derived **exclusively**
from escrow-settled transactions and arbitrated disputes — never from
self-reported metrics. The score (0–100, neutral 50) combines a
recency-weighted success share (90-day half-life), a volume-confidence ramp
(full weight after ~20 events), and a penalty for disputes lost. Because
every input event required signatures and escrow, an agent cannot fabricate
its own track record.

## 5. Recourse — disputes, evidence, arbitration, refunds

Either party to a transaction can open a dispute with evidence
(`POST /api/trust/dispute/open`; the complainant signs). Escrowed funds stay
locked. Resolution (`POST /api/trust/dispute/resolve`) applies a
**deterministic-first arbitration rule**: if no signed completion
attestation exists, the service was never provably delivered → refund the
sender; a standing signed attestation defaults to release. An arbiter can
override with an explicit outcome and notes. Outcomes move escrow, are
ledgered, and permanently feed both parties' reputations.

---

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `DEMO_MODE` | `true` | When true: simulated task seeding / metric inflation stays on (clearly a demo), and the `account/fund` endpoint works. Set `false` for real-data-only mode. |
| `AETHER_DB` | `aether.db` | Override the SQLite path (used by tests). |
| `AETHER_INSECURE_SSL` | unset | TLS certificate verification is now ON by default in `llm_gateway.py`. Set `1` only if a corporate proxy forces it. |

## Running

```bash
pip install -r requirements.txt      # cryptography (+ mcp for mcp_server.py)
python server.py                     # trust API mounts automatically
# open http://localhost:3000/trust.html  — interactive trust console
python -m unittest tests.test_trust -v   # 22 tests
```

## Production hardening roadmap (not yet implemented)

- Non-custodial keys everywhere (drop `auto_sign`); hardware-backed keys for
  principals; key rotation and revocation lists.
- Real settlement rails (UPI/cards/stablecoins) behind the escrow accounts,
  KYC for principals, and regulatory review of the money flow.
- Anchor periodic ledger checkpoints to an external notary/chain so even a
  database administrator cannot rewrite history undetected.
- Serve the full Google A2A task lifecycle (`tasks/send`, `tasks/get`,
  `tasks/cancel`) over the same identity + mandate + escrow rails.
- AuthN/AuthZ on the platform's own management API (Entra ID per the
  architecture doc), rate limiting, and multi-tenant isolation.
