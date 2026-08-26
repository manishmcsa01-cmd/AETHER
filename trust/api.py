"""
AETHER Trust Layer — HTTP API
==============================
Route dispatcher for /api/trust/* and /.well-known/agent-card/*.
server.py delegates matching requests here; every handler returns
(payload_dict, http_status).

Endpoints:
  POST /api/trust/identity/register      {kind, name, agent_id?, public_key?}
  GET  /api/trust/identity               ?kind=agent|principal
  GET  /api/trust/identity/<did>
  GET  /.well-known/agent-card/<did>     signed A2A agent card
  POST /api/trust/mandate/issue          {principal_did, agent_did, scope[], spend_cap_usd,
                                          max_tokens_per_tx, expires_at, parent_id?, signature?|auto_sign}
  POST /api/trust/mandate/revoke         {mandate_id, revoker_did, signature?|auto_sign}
  POST /api/trust/mandate/verify         {mandate_id, purpose?, amount_usd?, tokens?}
  GET  /api/trust/mandates               ?agent_did=
  POST /api/trust/a2a/authorize          {mandate_id, sender_did, receiver_did, tokens, purpose,
                                          nonce?, signature?|auto_sign}
  POST /api/trust/a2a/complete           {transaction_id, attestation_signature?|auto_sign}
  GET  /api/trust/a2a/transactions
  POST /api/trust/dispute/open           {transaction_id, complainant_did, reason, evidence?,
                                          signature?|auto_sign}
  POST /api/trust/dispute/resolve        {dispute_id, outcome?, arbiter_notes?}
  GET  /api/trust/disputes               ?status=Open
  GET  /api/trust/reputation/<did>
  GET  /api/trust/account/<did>
  POST /api/trust/account/fund           {did, amount}   (DEMO_MODE only)
  GET  /api/trust/ledger                 ?limit=
  GET  /api/trust/ledger/verify
  POST /api/trust/policy/check           {agent} | {agents:[...]}
"""

import os

from . import a2a, delegation, identity, policy, recourse, reputation, store

store.init_db()


def demo_mode() -> bool:
    return os.environ.get('DEMO_MODE', 'true').strip().lower() in ('1', 'true', 'yes', 'on')


def handle(method: str, path: str, query: dict, body: dict):
    """Dispatch a trust-layer request. Returns (payload, status)."""
    try:
        return _route(method, path, query or {}, body or {})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'error': 'Trust layer error: %s' % e}, 500


def _q(query, key, default=None):
    v = query.get(key, [default])
    return v[0] if isinstance(v, list) else v


def _route(method, path, query, body):
    # ── Well-known agent cards ────────────────────────────────
    if path.startswith('/.well-known/agent-card/'):
        did = path.rsplit('/', 1)[-1]
        card = identity.agent_card(did)
        if not card:
            return {'error': 'No agent identity for %s' % did}, 404
        return card, 200

    if not path.startswith('/api/trust/'):
        return {'error': 'Unknown trust endpoint'}, 404
    sub = path[len('/api/trust/'):].rstrip('/')

    # ── Identity ──────────────────────────────────────────────
    if sub == 'identity/register' and method == 'POST':
        kind = body.get('kind', 'agent')
        name = body.get('name')
        if not name:
            return {'error': 'name is required'}, 400
        try:
            result = identity.register(kind, name, agent_id=body.get('agent_id'),
                                       public_key=body.get('public_key'))
        except ValueError as e:
            return {'error': str(e)}, 400
        if result.get('custodial') and 'private_key' in result:
            result['note'] = ('Private key returned ONCE and held custodially for demo auto-signing. '
                              'In production, register with your own public_key instead.')
        return result, 201

    if sub == 'identity' and method == 'GET':
        return {'identities': identity.list_identities(_q(query, 'kind'))}, 200

    if sub.startswith('identity/') and method == 'GET':
        did = sub.split('/', 1)[1]
        ident = identity.get_identity(did)
        if not ident:
            return {'error': 'Identity not found'}, 404
        ident.pop('private_key', None)  # never expose stored keys
        return ident, 200

    # ── Delegation ────────────────────────────────────────────
    if sub == 'mandate/issue' and method == 'POST':
        required = ('principal_did', 'agent_did', 'scope', 'spend_cap_usd',
                    'max_tokens_per_tx', 'expires_at')
        missing = [k for k in required if body.get(k) in (None, '', [])]
        if missing:
            return {'error': 'Missing fields: %s' % ', '.join(missing)}, 400
        result = delegation.issue(
            body['principal_did'], body['agent_did'], body['scope'],
            float(body['spend_cap_usd']), int(body['max_tokens_per_tx']),
            body['expires_at'], parent_id=body.get('parent_id'),
            signature=body.get('signature'), auto_sign=bool(body.get('auto_sign')),
        )
        return result, (400 if 'error' in result else 201)

    if sub == 'mandate/revoke' and method == 'POST':
        result = delegation.revoke(body.get('mandate_id'), body.get('revoker_did'),
                                   signature=body.get('signature'),
                                   auto_sign=bool(body.get('auto_sign')))
        return result, (400 if 'error' in result else 200)

    if sub == 'mandate/verify' and method == 'POST':
        if not body.get('mandate_id'):
            return {'error': 'mandate_id is required'}, 400
        result = delegation.verify_chain(
            body['mandate_id'], purpose=body.get('purpose'),
            amount_usd=(float(body['amount_usd']) if body.get('amount_usd') is not None else None),
            tokens=(int(body['tokens']) if body.get('tokens') is not None else None),
        )
        return result, 200

    if sub == 'mandates' and method == 'GET':
        mandates = delegation.list_mandates(_q(query, 'agent_did'))
        for m in mandates:
            m['spent_usd'] = round(delegation.chain_spend(m['id']), 6)
        return {'mandates': mandates}, 200

    # ── Transactions ──────────────────────────────────────────
    if sub == 'a2a/authorize' and method == 'POST':
        required = ('mandate_id', 'sender_did', 'receiver_did', 'tokens', 'purpose')
        missing = [k for k in required if body.get(k) in (None, '')]
        if missing:
            return {'error': 'Missing fields: %s' % ', '.join(missing)}, 400
        result = a2a.authorize(
            body['mandate_id'], body['sender_did'], body['receiver_did'],
            int(body['tokens']), body['purpose'], nonce=body.get('nonce'),
            signature=body.get('signature'), auto_sign=bool(body.get('auto_sign')),
        )
        return result, (400 if 'error' in result else 200)

    if sub == 'a2a/complete' and method == 'POST':
        result = a2a.complete(body.get('transaction_id'),
                              attestation_signature=body.get('attestation_signature'),
                              auto_sign=bool(body.get('auto_sign')))
        return result, (400 if 'error' in result else 200)

    if sub == 'a2a/transactions' and method == 'GET':
        return {'transactions': a2a.list_transactions()}, 200

    # ── Recourse ──────────────────────────────────────────────
    if sub == 'dispute/open' and method == 'POST':
        result = recourse.open_dispute(
            body.get('transaction_id'), body.get('complainant_did'),
            body.get('reason', ''), evidence=body.get('evidence', ''),
            signature=body.get('signature'), auto_sign=bool(body.get('auto_sign')),
        )
        return result, (400 if 'error' in result else 201)

    if sub == 'dispute/resolve' and method == 'POST':
        result = recourse.resolve(body.get('dispute_id'), outcome=body.get('outcome'),
                                  arbiter_notes=body.get('arbiter_notes', ''))
        return result, (400 if 'error' in result else 200)

    if sub == 'disputes' and method == 'GET':
        return {'disputes': recourse.list_disputes(_q(query, 'status'))}, 200

    # ── Reputation ────────────────────────────────────────────
    if sub.startswith('reputation/') and method == 'GET':
        return reputation.compute(sub.split('/', 1)[1]), 200

    # ── Accounts ──────────────────────────────────────────────
    if sub.startswith('account/') and sub != 'account/fund' and method == 'GET':
        acct = store.get_account(sub.split('/', 1)[1])
        if not acct:
            return {'error': 'Account not found'}, 404
        return acct, 200

    if sub == 'account/fund' and method == 'POST':
        if not demo_mode():
            return {'error': 'Account funding endpoint is available in DEMO_MODE only. '
                             'In production, balances come from real settlement rails.'}, 403
        did, amount = body.get('did'), float(body.get('amount', 0))
        if not did or amount <= 0:
            return {'error': 'did and a positive amount are required'}, 400
        store.credit(did, amount)
        store.ledger_append('DemoFundsCredited', {'did': did, 'amount_usd': amount})
        return {'account': store.get_account(did), 'note': 'demo funds'}, 200

    # ── Ledger ────────────────────────────────────────────────
    if sub == 'ledger/verify' and method == 'GET':
        return store.ledger_verify(), 200

    if sub == 'ledger' and method == 'GET':
        limit = int(_q(query, 'limit', '50') or '50')
        conn = store.connect()
        c = conn.cursor()
        c.execute('SELECT * FROM trust_ledger ORDER BY seq DESC LIMIT ?', (limit,))
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return {'entries': rows}, 200

    # ── Deterministic policy checks ───────────────────────────
    if sub == 'policy/check' and method == 'POST':
        agents = body.get('agents')
        if agents is None and body.get('agent'):
            agents = [body['agent']]
        if not agents:
            return {'error': "Provide 'agent' or 'agents'"}, 400
        results = []
        for ag in agents:
            results.append({'agent_id': ag.get('id'), 'agent_name': ag.get('name'),
                            'violations': policy.evaluate_agent(ag)})
        total = sum(len(r['violations']) for r in results)
        return {'results': results, 'total_violations': total, 'engine': 'deterministic'}, 200

    return {'error': 'Unknown trust endpoint: %s %s' % (method, path)}, 404
