"""
AETHER Trust Layer — Pillar 1: Verifiable Identity
===================================================
Every agent and principal gets an Ed25519 keypair and a DID.
The registry itself holds a trust-anchor keypair and countersigns
agent cards, so third parties can verify "AETHER vouches that this
public key belongs to this registered agent".

Custody model: in demo/custodial mode the private key is stored so the
platform can sign on the identity's behalf (auto_sign). In production
mode a client submits its own public key and the private key never
touches the server (private_key stays NULL).
"""

from . import crypto_utils, store

REGISTRY_NAME = 'AETHER Registry Trust Anchor'


def _get_registry() -> dict:
    """Get (or lazily create) the registry trust-anchor identity."""
    conn = store.connect()
    c = conn.cursor()
    c.execute("SELECT * FROM trust_keys WHERE kind = 'registry' LIMIT 1")
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    priv, pub = crypto_utils.generate_keypair()
    did = crypto_utils.new_did('aether-registry')
    conn = store.connect()
    conn.execute(
        'INSERT INTO trust_keys (did, kind, name, public_key, private_key, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (did, 'registry', REGISTRY_NAME, pub, priv, store.now_iso()),
    )
    conn.commit()
    conn.close()
    store.ledger_append('RegistryAnchorCreated', {'did': did, 'public_key': pub})
    return {'did': did, 'kind': 'registry', 'name': REGISTRY_NAME, 'public_key': pub, 'private_key': priv}


def get_identity(did: str):
    conn = store.connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_keys WHERE did = ?', (did,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def get_identity_by_agent_id(agent_id: str):
    conn = store.connect()
    c = conn.cursor()
    c.execute("SELECT * FROM trust_keys WHERE agent_id = ? AND kind = 'agent'", (agent_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def register(kind: str, name: str, agent_id: str = None, public_key: str = None) -> dict:
    """
    Register an agent or principal identity.

    If public_key is provided the key is client-held (non-custodial): we never
    see the private key. Otherwise a keypair is generated and the private key
    is returned ONCE (and stored for custodial auto-signing in demo mode).
    """
    if kind not in ('agent', 'principal'):
        raise ValueError("kind must be 'agent' or 'principal'")
    custodial = public_key is None
    priv = None
    if custodial:
        priv, public_key = crypto_utils.generate_keypair()
    did = crypto_utils.new_did()
    conn = store.connect()
    conn.execute(
        'INSERT INTO trust_keys (did, kind, name, agent_id, public_key, private_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (did, kind, name, agent_id, public_key, priv, store.now_iso()),
    )
    conn.commit()
    conn.close()
    store.ensure_account(did)
    store.ledger_append('IdentityRegistered', {
        'did': did, 'kind': kind, 'name': name, 'agent_id': agent_id,
        'public_key': public_key, 'custodial': custodial,
    })
    result = {'did': did, 'kind': kind, 'name': name, 'agent_id': agent_id,
              'public_key': public_key, 'custodial': custodial}
    if custodial:
        # Returned once so the caller can hold its own key; retained server-side
        # only to power auto_sign in demo mode.
        result['private_key'] = priv
    return result


def sign_as(did: str, payload) -> str:
    """Custodial signing: sign a payload with an identity's stored private key."""
    ident = get_identity(did)
    if not ident:
        raise ValueError('Unknown identity: %s' % did)
    if not ident.get('private_key'):
        raise ValueError('Identity %s is non-custodial; caller must supply its own signature' % did)
    return crypto_utils.sign(ident['private_key'], payload)


def verify_from(did: str, payload, signature_hex: str) -> bool:
    """Verify that a payload was signed by the identity behind a DID."""
    ident = get_identity(did)
    if not ident or ident.get('status') != 'Active':
        return False
    return crypto_utils.verify(ident['public_key'], payload, signature_hex)


def agent_card(did: str) -> dict:
    """
    Build a signed A2A-style agent card. The card body is countersigned by
    the registry trust anchor, so any third party holding the registry's
    public key can verify authenticity offline.
    """
    ident = get_identity(did)
    if not ident or ident['kind'] != 'agent':
        return None
    registry = _get_registry()
    card = {
        'name': ident['name'],
        'did': ident['did'],
        'agent_id': ident.get('agent_id'),
        'public_key': ident['public_key'],
        'protocol': 'a2a',
        'version': '1.0',
        'capabilities': {'streaming': False, 'pushNotifications': False},
        'authentication': {'schemes': ['ed25519-signature']},
        'registry': {'did': registry['did'], 'public_key': registry['public_key']},
        'issued_at': store.now_iso(),
    }
    signature = crypto_utils.sign(registry['private_key'], card)
    return {'card': card, 'registry_signature': signature}


def verify_agent_card(card_envelope: dict) -> bool:
    """Verify a card envelope against the registry anchor key embedded in it."""
    card = card_envelope.get('card', {})
    sig = card_envelope.get('registry_signature', '')
    registry_pub = card.get('registry', {}).get('public_key', '')
    return crypto_utils.verify(registry_pub, card, sig)


def list_identities(kind: str = None):
    conn = store.connect()
    c = conn.cursor()
    if kind:
        c.execute('SELECT did, kind, name, agent_id, public_key, status, created_at FROM trust_keys WHERE kind = ? ORDER BY created_at DESC', (kind,))
    else:
        c.execute('SELECT did, kind, name, agent_id, public_key, status, created_at FROM trust_keys ORDER BY created_at DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows
