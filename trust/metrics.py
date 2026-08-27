"""
AETHER Trust Layer — Portfolio Metrics
========================================
Aggregate KPIs across the whole trust layer, computed the same way the
platform computes everything else that matters: directly from the
recorded, hash-chained record — never estimated, never self-reported.

This is the metric surface that was missing: identity/, mandate/,
a2a/, dispute/ etc. all expose per-record lookups, but nothing rolled
those records up into fleet-level numbers a dashboard or an investor
update could show. portfolio_summary() is that rollup.
"""

from datetime import datetime

from . import reputation, store


def _pct(n, d):
    return round((n / d) * 100, 1) if d else 0.0


def portfolio_summary() -> dict:
    conn = store.connect()
    c = conn.cursor()

    # ── Identities ──────────────────────────────────────────────
    c.execute(
        "SELECT kind, COUNT(*) AS n, "
        "SUM(CASE WHEN private_key IS NOT NULL THEN 1 ELSE 0 END) AS custodial "
        "FROM trust_keys GROUP BY kind"
    )
    identity_rows = [dict(r) for r in c.fetchall()]
    identities_by_kind = {r['kind']: r['n'] for r in identity_rows}
    custodial_total = sum((r['custodial'] or 0) for r in identity_rows)
    total_identities = sum(identities_by_kind.values())

    # ── Mandates ────────────────────────────────────────────────
    c.execute("SELECT status, parent_id FROM trust_mandates")
    mandate_rows = [dict(r) for r in c.fetchall()]
    total_mandates = len(mandate_rows)
    active_mandates = sum(1 for m in mandate_rows if m['status'] == 'Active')
    revoked_mandates = sum(1 for m in mandate_rows if m['status'] == 'Revoked')
    root_mandates = sum(1 for m in mandate_rows if not m['parent_id'])
    child_mandates = total_mandates - root_mandates

    c.execute(
        "SELECT COALESCE(SUM(spend_cap_usd), 0) AS s FROM trust_mandates "
        "WHERE parent_id IS NULL AND status = 'Active'"
    )
    total_root_spend_cap = c.fetchone()['s']

    # ── Transactions ────────────────────────────────────────────
    c.execute("SELECT status, amount_usd, decline_reason FROM trust_transactions")
    tx_rows = [dict(r) for r in c.fetchall()]
    total_transactions = len(tx_rows)
    by_status = {}
    volume_by_status = {}
    for t in tx_rows:
        by_status[t['status']] = by_status.get(t['status'], 0) + 1
        volume_by_status[t['status']] = volume_by_status.get(t['status'], 0.0) + (t['amount_usd'] or 0)

    decline_gates = {'IDENTITY': 0, 'DELEGATION': 0, 'POLICY': 0, 'ESCROW': 0, 'OTHER': 0}
    declined_total = 0
    for t in tx_rows:
        if t['status'] != 'Declined':
            continue
        declined_total += 1
        reason = t['decline_reason'] or ''
        matched = False
        for gate in ('IDENTITY', 'DELEGATION', 'POLICY', 'ESCROW'):
            if reason.startswith(gate):
                decline_gates[gate] += 1
                matched = True
                break
        if not matched:
            decline_gates['OTHER'] += 1

    # ── Escrow / accounts ───────────────────────────────────────
    c.execute("SELECT COALESCE(SUM(escrow_held), 0) AS held, COALESCE(SUM(balance), 0) AS bal FROM trust_accounts")
    acct_row = c.fetchone()
    escrow_held_total = acct_row['held']
    balance_total = acct_row['bal']

    # ── Disputes ────────────────────────────────────────────────
    c.execute("SELECT status, outcome, opened_at, resolved_at FROM trust_disputes")
    dispute_rows = [dict(r) for r in c.fetchall()]
    total_disputes = len(dispute_rows)
    open_disputes = sum(1 for d in dispute_rows if d['status'] == 'Open')
    resolved_disputes = [d for d in dispute_rows if d['status'] == 'Resolved']
    outcome_counts = {'refund_sender': 0, 'release_receiver': 0}
    resolution_hours = []
    for d in resolved_disputes:
        if d['outcome'] in outcome_counts:
            outcome_counts[d['outcome']] += 1
        if d['opened_at'] and d['resolved_at']:
            try:
                t0 = datetime.fromisoformat(d['opened_at'])
                t1 = datetime.fromisoformat(d['resolved_at'])
                resolution_hours.append((t1 - t0).total_seconds() / 3600.0)
            except Exception:
                pass
    avg_resolution_hours = round(sum(resolution_hours) / len(resolution_hours), 2) if resolution_hours else None

    # ── Reputation across the agent population ─────────────────
    c.execute("SELECT did FROM trust_keys WHERE kind = 'agent'")
    agent_dids = [r['did'] for r in c.fetchall()]
    conn.close()

    rep_scores = []
    below_floor = 0
    for did in agent_dids:
        rep = reputation.compute(did)
        if rep['events'] > 0:
            rep_scores.append(rep['score'])
            if rep['events'] >= 5 and rep['score'] < 30:
                below_floor += 1
    avg_reputation = round(sum(rep_scores) / len(rep_scores), 1) if rep_scores else None

    # ── Ledger integrity — re-verified on every call, never cached ─
    ledger = store.ledger_verify()

    return {
        'identities': {
            'total': total_identities,
            'by_kind': identities_by_kind,
            'custodial_keys': custodial_total,
            'non_custodial_keys': total_identities - custodial_total,
        },
        'mandates': {
            'total': total_mandates,
            'active': active_mandates,
            'revoked': revoked_mandates,
            'root': root_mandates,
            'child': child_mandates,
            'total_root_spend_cap_usd': round(total_root_spend_cap, 2),
        },
        'transactions': {
            'total': total_transactions,
            'by_status': by_status,
            'volume_usd_by_status': {k: round(v, 6) for k, v in volume_by_status.items()},
            'decline_rate_pct': _pct(declined_total, total_transactions),
            'decline_reasons_by_gate': decline_gates,
        },
        'escrow': {
            'currently_held_usd': round(escrow_held_total, 6),
            'total_account_balance_usd': round(balance_total, 6),
        },
        'disputes': {
            'total': total_disputes,
            'open': open_disputes,
            'resolved': len(resolved_disputes),
            'outcomes': outcome_counts,
            'avg_resolution_hours': avg_resolution_hours,
        },
        'reputation': {
            'agents_with_verified_history': len(rep_scores),
            'avg_reputation_score': avg_reputation,
            'below_reputation_floor': below_floor,
        },
        'ledger': ledger,
    }
