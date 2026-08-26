"""
AETHER Trust Layer — Pillar 4: Recourse
========================================
When an escrowed transaction goes wrong, either party can open a dispute
with evidence. Funds stay locked in escrow until an arbitration decision
resolves the case: refund the sender, or release to the receiver.

Arbitration is deterministic-first (rules on evidence and attestations),
with an optional LLM advisory note — the LLM never decides the outcome.
Every step is recorded on the hash-chained ledger, and dispute outcomes
feed the reputation engine.
"""

from . import crypto_utils, identity, store
from . import a2a


def open_dispute(tx_id: str, complainant_did: str, reason: str, evidence: str = '',
                 signature: str = None, auto_sign: bool = False) -> dict:
    tx = a2a.get_transaction(tx_id)
    if not tx:
        return {'error': 'Transaction not found'}
    if complainant_did not in (tx['sender_did'], tx['receiver_did']):
        return {'error': 'Only a party to the transaction can open a dispute'}
    if tx['status'] not in ('Escrowed', 'Completed'):
        return {'error': 'Only Escrowed or Completed transactions can be disputed (current: %s)' % tx['status']}

    payload = {'type': 'dispute', 'tx_id': tx_id, 'complainant_did': complainant_did,
               'reason': reason, 'evidence_hash': crypto_utils.sha256_hex(evidence or '')}
    if signature is None:
        if not auto_sign:
            return {'error': 'No signature supplied and auto_sign not requested', 'unsigned_payload': payload}
        try:
            signature = identity.sign_as(complainant_did, payload)
        except ValueError as e:
            return {'error': str(e)}
    if not identity.verify_from(complainant_did, payload, signature):
        return {'error': 'Dispute signature verification failed'}

    dispute_id = crypto_utils.new_id('DSP')
    conn = store.connect()
    conn.execute(
        '''INSERT INTO trust_disputes (id, tx_id, complainant_did, reason, evidence, opened_at)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (dispute_id, tx_id, complainant_did, reason, evidence, store.now_iso()),
    )
    conn.execute("UPDATE trust_transactions SET status = 'Disputed' WHERE id = ? AND status = 'Escrowed'", (tx_id,))
    conn.commit()
    conn.close()
    store.ledger_append('DisputeOpened', {**payload, 'dispute_id': dispute_id})
    return {'dispute_id': dispute_id, 'tx_id': tx_id, 'status': 'Open'}


def _auto_recommendation(tx: dict, dispute: dict) -> str:
    """
    Deterministic arbitration recommendation:
      - No receiver completion attestation on file → the service was never
        cryptographically attested as delivered → refund the sender.
      - Completion attested and the receiver is the complainant → nothing to
        claw back → release to the receiver.
      - Completion attested, sender disputes anyway → evidence review needed;
        default recommendation is release (the signed attestation stands
        unless the arbiter overrides with cause).
    """
    if not tx.get('receiver_attestation'):
        return 'refund_sender'
    return 'release_receiver'


def resolve(dispute_id: str, outcome: str = None, arbiter_notes: str = '') -> dict:
    """
    Resolve a dispute. If no outcome is given, the deterministic
    recommendation is applied. Escrow moves accordingly and the outcome
    permanently affects both parties' reputations.
    """
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_disputes WHERE id = ?', (dispute_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return {'error': 'Dispute not found'}
    dispute = dict(row)
    if dispute['status'] != 'Open':
        return {'error': 'Dispute already resolved'}

    tx = a2a.get_transaction(dispute['tx_id'])
    if not tx:
        return {'error': 'Underlying transaction missing'}

    recommended = _auto_recommendation(tx, dispute)
    outcome = outcome or recommended
    if outcome not in ('refund_sender', 'release_receiver'):
        return {'error': "outcome must be 'refund_sender' or 'release_receiver'"}

    # Move escrow only if funds are still held (Disputed from Escrowed state).
    if tx['status'] == 'Disputed':
        if outcome == 'refund_sender':
            store.escrow_refund(tx['sender_did'], tx['amount_usd'])
            new_status = 'Refunded'
        else:
            store.escrow_release(tx['sender_did'], tx['receiver_did'], tx['amount_usd'])
            new_status = 'Completed'
        conn = store.connect()
        conn.execute('UPDATE trust_transactions SET status = ? WHERE id = ?', (new_status, tx['id']))
        conn.commit()
        conn.close()
    else:
        new_status = tx['status']  # Completed disputes: reputational outcome only

    conn = store.connect()
    conn.execute(
        "UPDATE trust_disputes SET status = 'Resolved', outcome = ?, arbiter_notes = ?, resolved_at = ? WHERE id = ?",
        (outcome, arbiter_notes or ('auto: ' + recommended), store.now_iso(), dispute_id),
    )
    conn.commit()
    conn.close()
    store.ledger_append('DisputeResolved', {
        'dispute_id': dispute_id, 'tx_id': tx['id'], 'outcome': outcome,
        'recommended': recommended, 'tx_status': new_status,
    })
    return {'dispute_id': dispute_id, 'tx_id': tx['id'], 'outcome': outcome,
            'recommended': recommended, 'tx_status': new_status}


def list_disputes(status: str = None):
    conn = store.connect()
    c = conn.cursor()
    if status:
        c.execute('SELECT * FROM trust_disputes WHERE status = ? ORDER BY opened_at DESC', (status,))
    else:
        c.execute('SELECT * FROM trust_disputes ORDER BY opened_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows
