"""
AETHER Trust Layer — Cryptographic Utilities
=============================================
Ed25519 keypairs, canonical JSON, signing and verification.

Requires the `cryptography` package (see requirements.txt).
All keys are serialized as raw 32-byte hex strings.
"""

import hashlib
import json
import secrets

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.exceptions import InvalidSignature


# ── Canonical JSON ────────────────────────────────────────────

def canonical_json(obj) -> str:
    """Deterministic JSON serialization used for all signatures and hashes."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=True)


def sha256_hex(data) -> str:
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()


# ── Keypairs ──────────────────────────────────────────────────

def generate_keypair():
    """Generate an Ed25519 keypair. Returns (private_key_hex, public_key_hex)."""
    priv = Ed25519PrivateKey.generate()
    priv_hex = priv.private_bytes_raw().hex()
    pub_hex = priv.public_key().public_bytes_raw().hex()
    return priv_hex, pub_hex


def public_key_from_private(private_key_hex: str) -> str:
    priv = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key_hex))
    return priv.public_key().public_bytes_raw().hex()


# ── Signing / verification ────────────────────────────────────

def sign(private_key_hex: str, payload) -> str:
    """Sign a payload (dict or str) with an Ed25519 private key. Returns hex signature."""
    if not isinstance(payload, str):
        payload = canonical_json(payload)
    priv = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(private_key_hex))
    return priv.sign(payload.encode('utf-8')).hex()


def verify(public_key_hex: str, payload, signature_hex: str) -> bool:
    """Verify an Ed25519 signature over a payload (dict or str)."""
    if not isinstance(payload, str):
        payload = canonical_json(payload)
    try:
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
        pub.verify(bytes.fromhex(signature_hex), payload.encode('utf-8'))
        return True
    except (InvalidSignature, ValueError):
        return False


# ── Identifiers ───────────────────────────────────────────────

def new_did(prefix: str = 'aether') -> str:
    """Generate a decentralized-identifier-style id: did:aether:<24 hex chars>."""
    return 'did:%s:%s' % (prefix, secrets.token_hex(12))


def new_id(prefix: str) -> str:
    """Generate a prefixed unique id, e.g. MND-a1b2c3d4e5f6."""
    return '%s-%s' % (prefix, secrets.token_hex(6))
