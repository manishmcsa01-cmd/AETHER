"""
AETHER Trust Layer — Test Suite
================================
Run from the project root with either:
    python -m unittest tests.test_trust -v
    pytest tests/test_trust.py -v

Uses a throwaway SQLite database via the AETHER_DB env var.
"""

import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Point the trust store at a temp database BEFORE importing the modules.
_TMP = tempfile.mkdtemp(prefix='aether-test-')
os.environ['AETHER_DB'] = os.path.join(_TMP, 'test.db')
os.environ['DEMO_MODE'] = 'true'

from trust import a2a, crypto_utils, delegation, identity, policy, recourse, reputation, store  # noqa: E402

store.init_db()


def _future(days=30):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def _past(days=1):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


class TestCrypto(unittest.TestCase):
    def test_sign_and_verify(self):
        priv, pub = crypto_utils.generate_keypair()
        payload = {'b': 2, 'a': 1}
        sig = crypto_utils.sign(priv, payload)
        self.assertTrue(crypto_utils.verify(pub, {'a': 1, 'b': 2}, sig))  # key order irrelevant
        self.assertFalse(crypto_utils.verify(pub, {'a': 1, 'b': 3}, sig))  # tamper detected
        priv2, pub2 = crypto_utils.generate_keypair()
        self.assertFalse(crypto_utils.verify(pub2, payload, sig))  # wrong key rejected


class TestIdentity(unittest.TestCase):
    def test_register_custodial_and_client_held(self):
        a = identity.register('agent', 'Test Agent A', agent_id='AGT-1')
        self.assertIn('private_key', a)
        self.assertTrue(a['did'].startswith('did:aether:'))
        priv, pub = crypto_utils.generate_keypair()
        b = identity.register('agent', 'Client-held Agent', public_key=pub)
        self.assertNotIn('private_key', b)
        stored = identity.get_identity(b['did'])
        self.assertIsNone(stored['private_key'])

    def test_agent_card_signed_by_registry(self):
        a = identity.register('agent', 'Card Agent', agent_id='AGT-2')
        card = identity.agent_card(a['did'])
        self.assertTrue(identity.verify_agent_card(card))
        card['card']['name'] = 'Impostor'
        self.assertFalse(identity.verify_agent_card(card))  # tampered card fails

    def test_non_custodial_cannot_auto_sign(self):
        priv, pub = crypto_utils.generate_keypair()
        b = identity.register('agent', 'NC Agent', public_key=pub)
        with self.assertRaises(ValueError):
            identity.sign_as(b['did'], {'x': 1})


class TestDelegation(unittest.TestCase):
    def setUp(self):
        self.principal = identity.register('principal', 'Alice (Human Principal)')
        self.agent = identity.register('agent', 'Worker Agent')
        self.subagent = identity.register('agent', 'Sub Agent')

    def _root(self, **kw):
        args = dict(scope=['research', 'booking'], spend_cap_usd=10.0,
                    max_tokens_per_tx=100000, expires_at=_future(), auto_sign=True)
        args.update(kw)
        return delegation.issue(self.principal['did'], self.agent['did'], **args)

    def test_root_mandate_valid_chain(self):
        m = self._root()
        self.assertNotIn('error', m)
        v = delegation.verify_chain(m['id'], purpose='research', amount_usd=1.0, tokens=5000)
        self.assertTrue(v['valid'])
        self.assertEqual(v['root_principal'], self.principal['did'])

    def test_scope_enforced(self):
        m = self._root()
        v = delegation.verify_chain(m['id'], purpose='payments')
        self.assertFalse(v['valid'])
        self.assertIn('outside scope', v['reason'])

    def test_expired_mandate_rejected(self):
        m = self._root(expires_at=_past())
        v = delegation.verify_chain(m['id'])
        self.assertFalse(v['valid'])
        self.assertIn('expired', v['reason'])

    def test_sub_delegation_must_narrow(self):
        m = self._root()
        wide = delegation.issue(self.principal['did'], self.subagent['did'],
                                scope=['research'], spend_cap_usd=50.0,
                                max_tokens_per_tx=100000, expires_at=_future(),
                                parent_id=m['id'], auto_sign=True)
        self.assertIn('error', wide)  # cap exceeds parent
        bad_scope = delegation.issue(self.principal['did'], self.subagent['did'],
                                     scope=['payments'], spend_cap_usd=1.0,
                                     max_tokens_per_tx=1000, expires_at=_future(),
                                     parent_id=m['id'], auto_sign=True)
        self.assertIn('error', bad_scope)  # scope not subset
        ok = delegation.issue(self.principal['did'], self.subagent['did'],
                              scope=['research'], spend_cap_usd=2.0,
                              max_tokens_per_tx=1000, expires_at=_future(10),
                              parent_id=m['id'], auto_sign=True)
        self.assertNotIn('error', ok)
        v = delegation.verify_chain(ok['id'], purpose='research', tokens=500)
        self.assertTrue(v['valid'])
        self.assertEqual(v['depth'], 2)

    def test_revocation_kills_chain(self):
        m = self._root()
        child = delegation.issue(self.principal['did'], self.subagent['did'],
                                 scope=['research'], spend_cap_usd=1.0,
                                 max_tokens_per_tx=1000, expires_at=_future(10),
                                 parent_id=m['id'], auto_sign=True)
        delegation.revoke(m['id'], self.principal['did'], auto_sign=True)
        v = delegation.verify_chain(child['id'])
        self.assertFalse(v['valid'])  # revoked parent breaks child too


class TestTransactionsEscrowRecourse(unittest.TestCase):
    def setUp(self):
        self.principal = identity.register('principal', 'Bob (Principal)')
        self.sender = identity.register('agent', 'Buyer Agent')
        self.receiver = identity.register('agent', 'Seller Agent')
        self.mandate = delegation.issue(
            self.principal['did'], self.sender['did'], scope=['*'],
            spend_cap_usd=5.0, max_tokens_per_tx=200000, expires_at=_future(),
            auto_sign=True)
        store.credit(self.sender['did'], 5.0)

    def _auth(self, tokens=50000, purpose='research'):
        return a2a.authorize(self.mandate['id'], self.sender['did'], self.receiver['did'],
                             tokens, purpose, auto_sign=True)

    def test_happy_path_escrow_and_release(self):
        r = self._auth()
        self.assertEqual(r['status'], 'Escrowed')
        sender_acct = store.get_account(self.sender['did'])
        self.assertGreater(sender_acct['escrow_held'], 0)
        done = a2a.complete(r['transaction_id'], auto_sign=True)
        self.assertEqual(done['status'], 'Completed')
        recv_acct = store.get_account(self.receiver['did'])
        self.assertAlmostEqual(recv_acct['balance'], r['amount_usd'], places=6)

    def test_insufficient_balance_declines(self):
        poor = identity.register('agent', 'Broke Agent')
        m = delegation.issue(self.principal['did'], poor['did'], scope=['*'],
                             spend_cap_usd=5.0, max_tokens_per_tx=200000,
                             expires_at=_future(), auto_sign=True)
        r = a2a.authorize(m['id'], poor['did'], self.receiver['did'], 50000, 'x', auto_sign=True)
        self.assertEqual(r['status'], 'Declined')
        self.assertIn('ESCROW', r['decline_reason'])

    def test_spend_cap_enforced_cumulatively(self):
        store.credit(self.sender['did'], 100.0)
        # cap is $5; each 100k-token tx = $2 → third one must break the cap
        self.assertEqual(self._auth(tokens=100000)['status'], 'Escrowed')
        self.assertEqual(self._auth(tokens=100000)['status'], 'Escrowed')
        r3 = self._auth(tokens=100000)
        self.assertEqual(r3['status'], 'Declined')
        self.assertIn('DELEGATION', r3['decline_reason'])

    def test_mandate_of_other_agent_rejected(self):
        stranger = identity.register('agent', 'Stranger Agent')
        store.credit(stranger['did'], 5.0)
        r = a2a.authorize(self.mandate['id'], stranger['did'], self.receiver['did'],
                          1000, 'x', auto_sign=True)
        self.assertEqual(r['status'], 'Declined')
        self.assertIn('does not empower', r['decline_reason'])

    def test_token_hard_limit_policy(self):
        big_mandate = delegation.issue(
            self.principal['did'], self.sender['did'], scope=['*'],
            spend_cap_usd=100.0, max_tokens_per_tx=10_000_000, expires_at=_future(),
            auto_sign=True)
        store.credit(self.sender['did'], 100.0)
        r = a2a.authorize(big_mandate['id'], self.sender['did'], self.receiver['did'],
                          600000, 'x', auto_sign=True)
        self.assertEqual(r['status'], 'Declined')
        self.assertIn('POLICY', r['decline_reason'])

    def test_dispute_without_attestation_refunds_sender(self):
        r = self._auth()
        before = store.get_account(self.sender['did'])['balance']
        d = recourse.open_dispute(r['transaction_id'], self.sender['did'],
                                  'Service not delivered', evidence='no output received',
                                  auto_sign=True)
        self.assertEqual(d['status'], 'Open')
        resolved = recourse.resolve(d['dispute_id'])
        self.assertEqual(resolved['outcome'], 'refund_sender')
        self.assertEqual(resolved['tx_status'], 'Refunded')
        after = store.get_account(self.sender['did'])['balance']
        self.assertAlmostEqual(after - before, r['amount_usd'], places=6)

    def test_non_party_cannot_dispute(self):
        r = self._auth()
        outsider = identity.register('agent', 'Outsider')
        d = recourse.open_dispute(r['transaction_id'], outsider['did'], 'meddling', auto_sign=True)
        self.assertIn('error', d)


class TestReputation(unittest.TestCase):
    def setUp(self):
        self.principal = identity.register('principal', 'Carol (Principal)')
        self.sender = identity.register('agent', 'Rep Buyer')
        self.good = identity.register('agent', 'Reliable Seller')
        self.bad = identity.register('agent', 'Flaky Seller')
        self.mandate = delegation.issue(
            self.principal['did'], self.sender['did'], scope=['*'],
            spend_cap_usd=1000.0, max_tokens_per_tx=200000, expires_at=_future(),
            auto_sign=True)
        store.credit(self.sender['did'], 1000.0)

    def _tx(self, receiver_did, complete_it):
        r = a2a.authorize(self.mandate['id'], self.sender['did'], receiver_did,
                          10000, 'work', auto_sign=True)
        assert r['status'] == 'Escrowed', r
        if complete_it:
            a2a.complete(r['transaction_id'], auto_sign=True)
        else:
            d = recourse.open_dispute(r['transaction_id'], self.sender['did'],
                                      'not delivered', auto_sign=True)
            recourse.resolve(d['dispute_id'])
        return r

    def test_neutral_without_history(self):
        rep = reputation.compute(self.good['did'])
        self.assertEqual(rep['score'], 50)
        self.assertEqual(rep['events'], 0)

    def test_verified_outcomes_move_score(self):
        for _ in range(8):
            self._tx(self.good['did'], complete_it=True)
        for _ in range(4):
            self._tx(self.bad['did'], complete_it=False)
        good_rep = reputation.compute(self.good['did'])
        bad_rep = reputation.compute(self.bad['did'])
        self.assertGreater(good_rep['score'], 60)
        self.assertLess(bad_rep['score'], 40)
        self.assertEqual(good_rep['completed'], 8)
        self.assertEqual(bad_rep['refunded'], 4)

    def test_reputation_floor_blocks_new_transactions(self):
        declined = None
        for _ in range(10):
            r = a2a.authorize(self.mandate['id'], self.sender['did'], self.bad['did'],
                              10000, 'work', auto_sign=True)
            if r['status'] == 'Declined':
                declined = r
                break
            d = recourse.open_dispute(r['transaction_id'], self.sender['did'],
                                      'not delivered', auto_sign=True)
            recourse.resolve(d['dispute_id'])
        self.assertIsNotNone(declined, 'Reputation floor never engaged')
        self.assertIn('GOV-REP-001', declined['decline_reason'])


class TestLedgerIntegrity(unittest.TestCase):
    def test_chain_verifies_and_detects_tampering(self):
        store.ledger_append('TestEvent', {'n': 1})
        store.ledger_append('TestEvent', {'n': 2})
        report = store.ledger_verify()
        self.assertTrue(report['valid'])
        self.assertGreaterEqual(report['entries'], 2)
        # Tamper with a mid-chain payload directly in SQLite
        conn = store.connect()
        conn.execute("UPDATE trust_ledger SET payload = '{\"n\":999}' WHERE seq = 1")
        conn.commit()
        conn.close()
        report2 = store.ledger_verify()
        self.assertFalse(report2['valid'])
        self.assertEqual(report2['broken_at_seq'], 1)


class TestPolicyEngine(unittest.TestCase):
    def test_deterministic_agent_rules(self):
        agent = {
            'id': 'AGT-X', 'name': 'Risky', 'piiAccess': True, 'financialAccess': True,
            'certificationStatus': 'expired', 'monthlyCost': 900, 'owner': '',
            'model': 'gpt-3.5-turbo', 'region': 'multi-region', 'status': 'Active',
            'tasksExecuted': 0,
        }
        violations = policy.evaluate_agent(agent)
        ids = {v['policy_id'] for v in violations}
        self.assertEqual(ids, {'GOV-PII-001', 'GOV-FIN-001', 'GOV-COST-001', 'GOV-AUTH-001',
                               'GOV-MODEL-001', 'GOV-DATA-001', 'GOV-CERT-001', 'GOV-IDLE-001'})

    def test_clean_agent_passes(self):
        agent = {
            'id': 'AGT-Y', 'name': 'Clean', 'piiAccess': False, 'financialAccess': False,
            'certificationStatus': 'certified', 'monthlyCost': 100, 'owner': 'ops@corp.com',
            'model': 'gpt-4o', 'region': 'us-east-1', 'status': 'Active', 'tasksExecuted': 10,
        }
        self.assertEqual(policy.evaluate_agent(agent), [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
