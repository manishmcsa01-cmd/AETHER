"""
AETHER Trust Layer — Storage
=============================
SQLite persistence for the trust layer. Shares aether.db with the main
platform (override with the AETHER_DB environment variable, used by tests).

Tables:
  trust_keys          — identities (agents, principals, registry anchor)
  trust_mandates      — delegation mandates (signed, chainable)
  trust_transactions  — escrowed agent-to-agent transactions
  trust_accounts      — balances and escrow holds
  trust_disputes      — recourse cases
  trust_ledger        — hash-chained append-only event log
"""

import os
import sqlite3
from datetime import datetime, timezone

from . import crypto_utils

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def db_path() -> str:
    return os.environ.get('AETHER_DB', os.path.join(PROJECT_ROOT, 'aether.db'))


def connect():
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    return conn


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db():
    """Create trust tables if they do not exist."""
    conn = connect()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_keys (
            did TEXT PRIMARY KEY,
            kind TEXT NOT NULL,              -- 'agent' | 'principal' | 'registry'
            name TEXT,
            agent_id TEXT,                   -- link to agents.id for kind='agent'
            public_key TEXT NOT NULL,
            private_key TEXT,                -- custodial demo mode only; NULL when key is client-held
            status TEXT DEFAULT 'Active',
            created_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_mandates (
            id TEXT PRIMARY KEY,
            principal_did TEXT NOT NULL,     -- root human/org authority for the chain
            agent_did TEXT NOT NULL,         -- the agent being empowered
            parent_id TEXT,                  -- NULL for root mandates
            scope TEXT NOT NULL,             -- JSON array of allowed purposes ('*' = all)
            spend_cap_usd REAL NOT NULL,
            max_tokens_per_tx INTEGER NOT NULL,
            issued_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            signer_did TEXT NOT NULL,        -- who signed this mandate
            signature TEXT NOT NULL,
            status TEXT DEFAULT 'Active',    -- 'Active' | 'Revoked'
            revoked_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_transactions (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            mandate_id TEXT NOT NULL,
            sender_did TEXT NOT NULL,
            receiver_did TEXT NOT NULL,
            tokens INTEGER NOT NULL,
            amount_usd REAL NOT NULL,
            purpose TEXT,
            status TEXT NOT NULL,            -- 'Escrowed' | 'Completed' | 'Disputed' | 'Refunded'
            decline_reason TEXT,
            request_hash TEXT,
            sender_signature TEXT,
            receiver_attestation TEXT,
            completed_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_accounts (
            did TEXT PRIMARY KEY,
            balance REAL DEFAULT 0,
            escrow_held REAL DEFAULT 0
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_disputes (
            id TEXT PRIMARY KEY,
            tx_id TEXT NOT NULL,
            complainant_did TEXT NOT NULL,
            reason TEXT,
            evidence TEXT,
            opened_at TEXT,
            status TEXT DEFAULT 'Open',      -- 'Open' | 'Resolved'
            outcome TEXT,                    -- 'refund_sender' | 'release_receiver'
            arbiter_notes TEXT,
            resolved_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS trust_ledger (
            seq INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


# ── Hash-chained ledger ───────────────────────────────────────

GENESIS_HASH = '0' * 64


def ledger_append(event_type: str, payload: dict) -> dict:
    """Append an event to the tamper-evident ledger and return the entry."""
    conn = connect()
    c = conn.cursor()
    c.execute('SELECT hash FROM trust_ledger ORDER BY seq DESC LIMIT 1')
    row = c.fetchone()
    prev_hash = row['hash'] if row else GENESIS_HASH
    ts = now_iso()
    body = crypto_utils.canonical_json(payload)
    entry_hash = crypto_utils.sha256_hex(prev_hash + '|' + ts + '|' + event_type + '|' + body)
    c.execute(
        'INSERT INTO trust_ledger (timestamp, event_type, payload, prev_hash, hash) VALUES (?, ?, ?, ?, ?)',
        (ts, event_type, body, prev_hash, entry_hash),
    )
    conn.commit()
    seq = c.lastrowid
    conn.close()
    return {'seq': seq, 'timestamp': ts, 'event_type': event_type, 'hash': entry_hash}


def ledger_verify() -> dict:
    """Walk the whole chain and verify every link. Returns integrity report."""
    conn = connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_ledger ORDER BY seq ASC')
    rows = c.fetchall()
    conn.close()
    prev = GENESIS_HASH
    for r in rows:
        expected = crypto_utils.sha256_hex(
            prev + '|' + r['timestamp'] + '|' + r['event_type'] + '|' + r['payload']
        )
        if r['prev_hash'] != prev or r['hash'] != expected:
            return {'valid': False, 'entries': len(rows), 'broken_at_seq': r['seq']}
        prev = r['hash']
    return {'valid': True, 'entries': len(rows), 'head': prev}


# ── Accounts / escrow primitives ──────────────────────────────

def ensure_account(did: str):
    conn = connect()
    c = conn.cursor()
    c.execute('INSERT OR IGNORE INTO trust_accounts (did, balance, escrow_held) VALUES (?, 0, 0)', (did,))
    conn.commit()
    conn.close()


def get_account(did: str):
    conn = connect()
    c = conn.cursor()
    c.execute('SELECT * FROM trust_accounts WHERE did = ?', (did,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def credit(did: str, amount: float):
    ensure_account(did)
    conn = connect()
    conn.execute('UPDATE trust_accounts SET balance = balance + ? WHERE did = ?', (amount, did))
    conn.commit()
    conn.close()


def escrow_hold(did: str, amount: float) -> bool:
    """Move funds from balance into escrow. Returns False on insufficient balance."""
    ensure_account(did)
    conn = connect()
    c = conn.cursor()
    c.execute('SELECT balance FROM trust_accounts WHERE did = ?', (did,))
    bal = c.fetchone()['balance']
    if bal < amount:
        conn.close()
        return False
    c.execute(
        'UPDATE trust_accounts SET balance = balance - ?, escrow_held = escrow_held + ? WHERE did = ?',
        (amount, amount, did),
    )
    conn.commit()
    conn.close()
    return True


def escrow_release(sender_did: str, receiver_did: str, amount: float):
    """Release escrowed funds from sender's hold to receiver's balance."""
    ensure_account(receiver_did)
    conn = connect()
    c = conn.cursor()
    c.execute('UPDATE trust_accounts SET escrow_held = MAX(0, escrow_held - ?) WHERE did = ?', (amount, sender_did))
    c.execute('UPDATE trust_accounts SET balance = balance + ? WHERE did = ?', (amount, receiver_did))
    conn.commit()
    conn.close()


def escrow_refund(sender_did: str, amount: float):
    """Return escrowed funds to the sender's balance."""
    conn = connect()
    c = conn.cursor()
    c.execute(
        'UPDATE trust_accounts SET escrow_held = MAX(0, escrow_held - ?), balance = balance + ? WHERE did = ?',
        (amount, amount, sender_did),
    )
    conn.commit()
    conn.close()
