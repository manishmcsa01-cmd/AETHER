"""
AETHER Trust Layer — Pillar 3: Reputation
==========================================
Reputation is computed EXCLUSIVELY from verified outcomes recorded in the
escrowed transaction ledger — never from self-reported metadata. An agent
cannot fabricate its own track record: every event that moves the score is
a signed, escrow-settled transaction or an arbitrated dispute.

Score model (0–100, deterministic):
  - neutral 50 with no history
  - success component: recency-weighted share of Completed vs Refunded
    outcomes (exponential decay, 90-day half-life)
  - volume confidence: full weight only after ~20 verified events
  - dispute drag: penalty for disputes lost as a fraction of events
"""

import math
from datetime import datetime, timezone

from . import store

HALF_LIFE_DAYS = 90.0
CONFIDENCE_EVENTS = 20.0
NEUTRAL = 50.0


def _age_days(ts: str) -> float:
    try:
        t = datetime.fromisoformat(ts)
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        return max(0.0, (datetime.now(timezone.utc) - t).total_seconds() / 86400.0)
    except Exception:
        return 0.0


def _decay(ts: str) -> float:
    return math.pow(0.5, _age_days(ts) / HALF_LIFE_DAYS)


def compute(did: str) -> dict:
    """Compute the verified reputation of a DID (as a transaction counterparty)."""
    conn = store.connect()
    c = conn.cursor()
    c.execute(
        "SELECT id, timestamp, status, amount_usd, sender_did, receiver_did "
        "FROM trust_transactions "
        "WHERE (receiver_did = ? OR sender_did = ?) AND status IN ('Completed', 'Refunded', 'Disputed')",
        (did, did),
    )
    txs = [dict(r) for r in c.fetchall()]
    c.execute(
        "SELECT d.id, d.status, d.outcome, d.complainant_did, t.receiver_did, t.sender_did "
        "FROM trust_disputes d JOIN trust_transactions t ON d.tx_id = t.id "
        "WHERE t.receiver_did = ? OR t.sender_did = ?",
        (did, did),
    )
    disputes = [dict(r) for r in c.fetchall()]
    conn.close()

    events = len(txs)
    if events == 0:
        return {'did': did, 'score': int(NEUTRAL), 'events': 0, 'completed': 0,
                'refunded': 0, 'open_disputes': 0, 'disputes_lost': 0,
                'volume_usd': 0.0, 'confidence': 0.0,
                'basis': 'no verified history — neutral'}

    w_good = 0.0
    w_bad = 0.0
    completed = refunded = disputed_open = 0
    volume = 0.0
    for t in txs:
        w = _decay(t['timestamp'])
        volume += t['amount_usd'] or 0
        if t['status'] == 'Completed':
            completed += 1
            w_good += w
        elif t['status'] == 'Refunded':
            refunded += 1
            # A refund hurts the party that failed to deliver (the receiver).
            if t['receiver_did'] == did:
                w_bad += w
            else:
                w_good += 0.5 * w  # sender recovered funds; mild positive
        elif t['status'] == 'Disputed':
            disputed_open += 1

    disputes_lost = 0
    for d in disputes:
        if d['status'] == 'Resolved':
            if d['outcome'] == 'refund_sender' and d['receiver_did'] == did:
                disputes_lost += 1
            elif d['outcome'] == 'release_receiver' and d['sender_did'] == did \
                    and d['complainant_did'] == did:
                disputes_lost += 1  # frivolous dispute lost by sender

    total_w = w_good + w_bad
    success = (w_good / total_w) if total_w > 0 else 0.5
    confidence = min(1.0, events / CONFIDENCE_EVENTS)
    dispute_drag = min(0.3, 0.1 * disputes_lost)

    raw = NEUTRAL + (success - 0.5) * 100.0 * confidence
    score = max(0, min(100, round(raw - dispute_drag * 100)))

    return {
        'did': did,
        'score': score,
        'events': events,
        'completed': completed,
        'refunded': refunded,
        'open_disputes': disputed_open,
        'disputes_lost': disputes_lost,
        'volume_usd': round(volume, 4),
        'confidence': round(confidence, 2),
        'basis': 'computed from %d escrow-verified transaction outcomes' % events,
    }
