"""
AETHER Trust Layer — Escrowed Agent-to-Agent Transactions
==========================================================
The clearing flow ("Visa for AI Agents"):

  authorize  — sender proves identity (signature) + authority (mandate chain),
               deterministic policy checks run, receiver reputation is gated,
               funds move into escrow, everything lands on the hash-chained ledger.
  complete   — receiver signs a completion attestation; escrow releases to them.
  (disputes and refunds live in recourse.py)
"""

from . import crypto_utils, delegation, identity, policy, reputation, store

USD_PER_TOKEN = 0.00002  # $0.02 per 1k tokens — same rate as the legacy endpoint


def _tx_request_payload(mandate_id, sender_did, receiver_did, tokens, purpose, nonce):
    return {
        'type': 'a2a-transaction-request',
        'mandate_id': mandate_id,
        'sender_did': sender_did,
        'receiver_did': receiver_did,
        'tokens': tokens,
        'purpose': purpose,
        'usd_per_token': USD_PER_TOKEN,
        'nonce': nonce,
    }


def get_transaction(tx_id: str):
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_transactions WHERE id = ?', (tx_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def list_transactions(limit: int = 100):
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_transactions ORDER BY timestamp DESC LIMIT ?', (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose, reason):
    conn = store.connect()
    conn.execute(
        '''INSERT INTO trust_transactions
           (id, timestamp, mandate_id, sender_did, receiver_did, tokens, amount_usd, purpose,
            status, decline_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Declined', ?)''',
        (tx_id, store.now_iso(), mandate_id or '', sender_did or '', receiver_did or '',
         tokens, amount, purpose, reason),
    )
    conn.commit()
    conn.close()
    store.ledger_append('TransactionDeclined', {
        'tx_id': tx_id, 'sender_did': sender_did, 'receiver_did': receiver_did,
        'tokens': tokens, 'reason': reason,
    })
    return {'transaction_id': tx_id, 'status': 'Declined', 'decline_reason': reason}


def authorize(mandate_id: str, sender_did: str, receiver_did: str, tokens: int,
              purpose: str, nonce: str = None, signature: str = None,
              auto_sign: bool = False) -> dict:
    """Authorize and escrow an agent-to-agent transaction."""
    tokens = int(tokens)
    amount = round(tokens * USD_PER_TOKEN, 6)
    nonce = nonce or crypto_utils.new_id('NNC')
    tx_id = crypto_utils.new_id('TX')

    # 1. Identity: both parties registered, sender signature valid
    sender = identity.get_identity(sender_did)
    receiver = identity.get_identity(receiver_did)
    if not sender:
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'IDENTITY: sender DID not registered')
    if not receiver:
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'IDENTITY: receiver DID not registered')

    payload = _tx_request_payload(mandate_id, sender_did, receiver_did, tokens, purpose, nonce)
    if signature is None:
        if not auto_sign:
            return {'error': 'No signature supplied and auto_sign not requested',
                    'unsigned_payload': payload}
        try:
            signature = identity.sign_as(sender_did, payload)
        except ValueError as e:
            return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                            'IDENTITY: %s' % e)
    if not identity.verify_from(sender_did, payload, signature):
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'IDENTITY: sender signature verification failed')

    # 2. Delegation: mandate chain must authorize this exact transaction
    chain = delegation.verify_chain(mandate_id, purpose=purpose, amount_usd=amount, tokens=tokens)
    if not chain['valid']:
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'DELEGATION: %s' % chain['reason'])
    leaf = delegation.get_mandate(mandate_id)
    if leaf['agent_did'] != sender_did:
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'DELEGATION: mandate %s does not empower sender %s' % (mandate_id, sender_did))

    # 3. Deterministic policy + reputation gate
    from_registry = _registry_agent_for(sender)
    to_registry = _registry_agent_for(receiver)
    rep = reputation.compute(receiver_did)
    violations = policy.evaluate_transaction(from_registry, to_registry, tokens, receiver_reputation=rep)
    if violations:
        worst = violations[0]
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'POLICY %s: %s' % (worst['policy_id'], worst['details']))

    # 4. Escrow the funds
    if not store.escrow_hold(sender_did, amount):
        acct = store.get_account(sender_did) or {'balance': 0}
        return _decline(tx_id, mandate_id, sender_did, receiver_did, tokens, amount, purpose,
                        'ESCROW: insufficient balance ($%.4f available, $%.4f required)'
                        % (acct['balance'], amount))

    # 5. Record
    request_hash = crypto_utils.sha256_hex(crypto_utils.canonical_json(payload))
    conn = store.connect()
    conn.execute(
        '''INSERT INTO trust_transactions
           (id, timestamp, mandate_id, sender_did, receiver_did, tokens, amount_usd, purpose,
            status, request_hash, sender_signature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Escrowed', ?, ?)''',
        (tx_id, store.now_iso(), mandate_id, sender_did, receiver_did, tokens, amount, purpose,
         request_hash, signature),
    )
    conn.commit()
    conn.close()
    store.ledger_append('TransactionEscrowed', {
        'tx_id': tx_id, 'mandate_id': mandate_id, 'sender_did': sender_did,
        'receiver_did': receiver_did, 'tokens': tokens, 'amount_usd': amount,
        'purpose': purpose, 'request_hash': request_hash,
        'delegation_root': chain['root_principal'], 'receiver_reputation': rep['score'],
    })
    return {
        'transaction_id': tx_id,
        'status': 'Escrowed',
        'amount_usd': amount,
        'tokens': tokens,
        'delegation_chain_depth': chain['depth'],
        'delegation_root_principal': chain['root_principal'],
        'receiver_reputation': rep['score'],
        'request_hash': request_hash,
    }


def complete(tx_id: str, attestation_signature: str = None, auto_sign: bool = False) -> dict:
    """Receiver attests completion; escrow releases to the receiver."""
    tx = get_transaction(tx_id)
    if not tx:
        return {'error': 'Transaction not found'}
    if tx['status'] != 'Escrowed':
        return {'error': 'Only Escrowed transactions can be completed (current: %s)' % tx['status']}

    attestation = {'type': 'a2a-completion-attestation', 'tx_id': tx_id,
                   'receiver_did': tx['receiver_did'], 'request_hash': tx['request_hash']}
    if attestation_signature is None:
        if not auto_sign:
            return {'error': 'No attestation signature supplied and auto_sign not requested',
                    'unsigned_payload': attestation}
        try:
            attestation_signature = identity.sign_as(tx['receiver_did'], attestation)
        except ValueError as e:
            return {'error': str(e)}
    if not identity.verify_from(tx['receiver_did'], attestation, attestation_signature):
        return {'error': 'Receiver attestation signature verification failed'}

    store.escrow_release(tx['sender_did'], tx['receiver_did'], tx['amount_usd'])
    conn = store.connect()
    conn.execute(
        "UPDATE trust_transactions SET status = 'Completed', receiver_attestation = ?, completed_at = ? WHERE id = ?",
        (attestation_signature, store.now_iso(), tx_id),
    )
    conn.commit()
    conn.close()
    store.ledger_append('TransactionCompleted', {
        'tx_id': tx_id, 'receiver_did': tx['receiver_did'], 'amount_usd': tx['amount_usd'],
    })
    return {'transaction_id': tx_id, 'status': 'Completed', 'released_usd': tx['amount_usd'],
            'receiver_did': tx['receiver_did']}


def _registry_agent_for(ident: dict):
    """Look up the platform registry row for an identity (best effort)."""
    if not ident or not ident.get('agent_id'):
        return None
    conn = store.connect()
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM agents WHERE id = ?', (ident['agent_id'],))
        row = c.fetchone()
        result = dict(row) if row else None
    except Exception:
        result = None
    conn.close()
    return result
