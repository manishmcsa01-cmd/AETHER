"""
AETHER Trust Layer — Pillar 2: Delegation
==========================================
Signed, chainable mandates: a human/organizational PRINCIPAL authorizes an
AGENT with an explicit scope, spend cap, per-transaction token limit, and
expiry. Agents can sub-delegate to other agents, but every child mandate
must be strictly narrower than its parent (scope subset, cap within the
parent's remaining budget, expiry no later than the parent's).

Verification walks the whole chain back to the root principal and checks
every signature, expiry, revocation, scope, and cumulative spend.
"""

import json
from datetime import datetime, timezone

from . import crypto_utils, identity, store


def _mandate_payload(m: dict) -> dict:
    """The exact fields covered by a mandate signature."""
    return {
        'id': m['id'],
        'principal_did': m['principal_did'],
        'agent_did': m['agent_did'],
        'parent_id': m.get('parent_id'),
        'scope': m['scope'],  # list
        'spend_cap_usd': m['spend_cap_usd'],
        'max_tokens_per_tx': m['max_tokens_per_tx'],
        'issued_at': m['issued_at'],
        'expires_at': m['expires_at'],
    }


def get_mandate(mandate_id: str):
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_mandates WHERE id = ?', (mandate_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    m = dict(row)
    m['scope'] = json.loads(m['scope'])
    return m


def list_mandates(agent_did: str = None):
    conn = store.connect()
    c = conn.cursor()
    if agent_did:
        c.execute('SELECT * FROM trust_mandates WHERE agent_did = ? ORDER BY issued_at DESC', (agent_did,))
    else:
        c.execute('SELECT * FROM trust_mandates ORDER BY issued_at DESC')
    rows = []
    for r in c.fetchall():
        m = dict(r)
        m['scope'] = json.loads(m['scope'])
        rows.append(m)
    conn.close()
    return rows


def issue(principal_did: str, agent_did: str, scope, spend_cap_usd: float,
          max_tokens_per_tx: int, expires_at: str, parent_id: str = None,
          signature: str = None, auto_sign: bool = False) -> dict:
    """
    Issue a mandate. For a ROOT mandate the signer is the principal.
    For a CHILD mandate (parent_id set) the signer is the parent mandate's
    agent — an agent may only sub-delegate authority it already holds.
    """
    scope = list(scope) if scope else []
    if not scope:
        return {'error': 'Mandate scope cannot be empty (use ["*"] for full scope)'}
    if spend_cap_usd <= 0:
        return {'error': 'spend_cap_usd must be positive'}

    signer_did = principal_did
    if parent_id:
        parent = get_mandate(parent_id)
        if not parent:
            return {'error': 'Parent mandate not found: %s' % parent_id}
        signer_did = parent['agent_did']
        # Structural narrowing checks at issue time
        if principal_did != parent['principal_did']:
            return {'error': 'Child mandate must keep the root principal of its parent chain'}
        if not set(scope).issubset(set(parent['scope'])) and parent['scope'] != ['*']:
            return {'error': 'Child scope must be a subset of the parent scope'}
        if spend_cap_usd > parent['spend_cap_usd']:
            return {'error': 'Child spend cap ($%s) exceeds parent cap ($%s)' % (spend_cap_usd, parent['spend_cap_usd'])}
        if max_tokens_per_tx > parent['max_tokens_per_tx']:
            return {'error': 'Child max_tokens_per_tx exceeds parent limit'}
        if expires_at > parent['expires_at']:
            return {'error': 'Child mandate cannot outlive its parent'}

    for did, label in ((principal_did, 'principal'), (agent_did, 'agent'), (signer_did, 'signer')):
        if not identity.get_identity(did):
            return {'error': 'Unknown %s identity: %s' % (label, did)}

    m = {
        'id': crypto_utils.new_id('MND'),
        'principal_did': principal_did,
        'agent_did': agent_did,
        'parent_id': parent_id,
        'scope': scope,
        'spend_cap_usd': float(spend_cap_usd),
        'max_tokens_per_tx': int(max_tokens_per_tx),
        'issued_at': store.now_iso(),
        'expires_at': expires_at,
    }
    payload = _mandate_payload(m)

    if signature is None:
        if not auto_sign:
            return {'error': 'No signature supplied and auto_sign not requested', 'unsigned_payload': payload}
        try:
            signature = identity.sign_as(signer_did, payload)
        except ValueError as e:
            return {'error': str(e)}
    if not identity.verify_from(signer_did, payload, signature):
        return {'error': 'Mandate signature verification failed for signer %s' % signer_did}

    conn = store.connect()
    conn.execute(
        '''INSERT INTO trust_mandates
           (id, principal_did, agent_did, parent_id, scope, spend_cap_usd, max_tokens_per_tx,
            issued_at, expires_at, signer_did, signature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (m['id'], m['principal_did'], m['agent_did'], m['parent_id'], json.dumps(m['scope']),
         m['spend_cap_usd'], m['max_tokens_per_tx'], m['issued_at'], m['expires_at'],
         signer_did, signature),
    )
    conn.commit()
    conn.close()
    store.ledger_append('MandateIssued', {**payload, 'signer_did': signer_did})
    m['signer_did'] = signer_did
    m['signature'] = signature
    m['status'] = 'Active'
    return m


def revoke(mandate_id: str, revoker_did: str, signature: str = None, auto_sign: bool = False) -> dict:
    """Revoke a mandate. Only the signer (issuer) or the root principal may revoke."""
    m = get_mandate(mandate_id)
    if not m:
        return {'error': 'Mandate not found'}
    if revoker_did not in (m['signer_did'], m['principal_did']):
        return {'error': 'Only the mandate issuer or the root principal can revoke'}
    payload = {'action': 'revoke', 'mandate_id': mandate_id, 'revoker_did': revoker_did}
    if signature is None:
        if not auto_sign:
            return {'error': 'No signature supplied and auto_sign not requested', 'unsigned_payload': payload}
        try:
            signature = identity.sign_as(revoker_did, payload)
        except ValueError as e:
            return {'error': str(e)}
    if not identity.verify_from(revoker_did, payload, signature):
        return {'error': 'Revocation signature verification failed'}
    conn = store.connect()
    conn.execute("UPDATE trust_mandates SET status = 'Revoked', revoked_at = ? WHERE id = ?",
                 (store.now_iso(), mandate_id))
    conn.commit()
    conn.close()
    store.ledger_append('MandateRevoked', payload)
    return {'mandate_id': mandate_id, 'status': 'Revoked'}


# ── Spend accounting ──────────────────────────────────────────

def _own_spend(mandate_id: str) -> float:
    """USD already committed under a mandate (escrowed, completed, or disputed)."""
    conn = store.connect()
    c = conn.cursor()
    c.execute(
        "SELECT COALESCE(SUM(amount_usd), 0) AS s FROM trust_transactions "
        "WHERE mandate_id = ? AND status IN ('Escrowed', 'Completed', 'Disputed')",
        (mandate_id,),
    )
    s = c.fetchone()['s']
    conn.close()
    return float(s or 0)


def _children(mandate_id: str):
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT id FROM trust_mandates WHERE parent_id = ?', (mandate_id,))
    ids = [r['id'] for r in c.fetchall()]
    conn.close()
    return ids


def chain_spend(mandate_id: str) -> float:
    """Total spend of a mandate including everything its sub-delegations spent."""
    total = _own_spend(mandate_id)
    for child in _children(mandate_id):
        total += chain_spend(child)
    return total


# ── Chain verification ────────────────────────────────────────

def verify_chain(mandate_id: str, purpose: str = None, amount_usd: float = None,
                 tokens: int = None) -> dict:
    """
    Verify a mandate and every ancestor up to the root principal.
    Optionally checks that a proposed transaction (purpose/amount/tokens)
    is allowed at EVERY level of the chain.
    """
    checked = []
    now = datetime.now(timezone.utc).isoformat()
    current_id = mandate_id
    depth = 0
    while current_id:
        depth += 1
        if depth > 16:
            return {'valid': False, 'reason': 'Delegation chain too deep (possible cycle)', 'chain': checked}
        m = get_mandate(current_id)
        if not m:
            return {'valid': False, 'reason': 'Mandate not found: %s' % current_id, 'chain': checked}
        if m['status'] != 'Active':
            return {'valid': False, 'reason': 'Mandate %s is %s' % (m['id'], m['status']), 'chain': checked}
        if m['expires_at'] <= now:
            return {'valid': False, 'reason': 'Mandate %s expired at %s' % (m['id'], m['expires_at']), 'chain': checked}
        if not identity.verify_from(m['signer_did'], _mandate_payload(m), m['signature']):
            return {'valid': False, 'reason': 'Signature invalid on mandate %s' % m['id'], 'chain': checked}
        # The right party must have signed: root mandates by the principal,
        # child mandates by the parent mandate's agent.
        if m.get('parent_id'):
            parent = get_mandate(m['parent_id'])
            if not parent or parent['agent_did'] != m['signer_did']:
                return {'valid': False,
                        'reason': 'Mandate %s not signed by its parent mandate agent' % m['id'],
                        'chain': checked}
        elif m['signer_did'] != m['principal_did']:
            return {'valid': False,
                    'reason': 'Root mandate %s not signed by its principal' % m['id'],
                    'chain': checked}
        if purpose is not None and m['scope'] != ['*'] and purpose not in m['scope']:
            return {'valid': False,
                    'reason': "Purpose '%s' outside scope of mandate %s" % (purpose, m['id']),
                    'chain': checked}
        if tokens is not None and tokens > m['max_tokens_per_tx']:
            return {'valid': False,
                    'reason': 'Tokens (%s) exceed per-tx limit (%s) of mandate %s' % (tokens, m['max_tokens_per_tx'], m['id']),
                    'chain': checked}
        if amount_usd is not None:
            already = chain_spend(m['id'])
            if already + amount_usd > m['spend_cap_usd'] + 1e-9:
                return {'valid': False,
                        'reason': 'Spend cap exceeded on mandate %s: $%.4f spent + $%.4f requested > $%.4f cap'
                                  % (m['id'], already, amount_usd, m['spend_cap_usd']),
                        'chain': checked}
        checked.append({'id': m['id'], 'agent_did': m['agent_did'], 'signer_did': m['signer_did']})
        current_id = m.get('parent_id')

    root = checked[-1]
    root_mandate = get_mandate(root['id'])
    principal = identity.get_identity(root_mandate['principal_did'])
    if not principal or principal['kind'] != 'principal':
        return {'valid': False, 'reason': 'Chain does not terminate at a registered principal', 'chain': checked}
    return {'valid': True, 'chain': checked, 'root_principal': root_mandate['principal_did'], 'depth': len(checked)}
