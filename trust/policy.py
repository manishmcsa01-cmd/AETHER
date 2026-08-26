"""
AETHER Trust Layer — Deterministic Policy Engine
=================================================
Code-level implementation of the 8 enterprise governance policies plus
transaction-time rules. Enforcement decisions MUST be deterministic and
reproducible — the LLM supervisory agents are for narrative analysis,
never for enforcement.
"""

APPROVED_MODELS = ('gpt-4', 'gpt-4o', 'claude', 'gemini', 'llama-3', 'llama3',
                   'snowflake-cortex', 'databricks-dbrx')
UNAPPROVED_MODEL_MARKERS = ('gpt-3.5', 'davinci', 'llama2', 'llama-2')

COST_THRESHOLD_USD = 500.0
TX_TOKEN_HARD_LIMIT = 500_000
CRITICAL_RISK_SCORE = 80


def evaluate_agent(agent: dict) -> list:
    """Evaluate one registered agent against the 8 GOV policies. Returns violations."""
    v = []
    cert = (agent.get('certificationStatus') or '').lower()
    model = (agent.get('model') or agent.get('platform') or '').lower()
    owner = (agent.get('owner') or '').strip().lower()
    region = (agent.get('region') or '').lower()

    if agent.get('piiAccess') and cert != 'certified':
        v.append(_v('GOV-PII-001', 'PII Access Control', 'Critical',
                    'Agent has PII access but certification status is %r' % (agent.get('certificationStatus'),)))
    if agent.get('financialAccess') and cert != 'certified':
        v.append(_v('GOV-FIN-001', 'Financial Transaction Limit', 'High',
                    'Agent has financial access without certified safeguards'))
    if (agent.get('monthlyCost') or 0) > COST_THRESHOLD_USD:
        v.append(_v('GOV-COST-001', 'Cost Anomaly Detection', 'Medium',
                    'Monthly cost $%.2f exceeds $%.2f threshold' % (agent.get('monthlyCost') or 0, COST_THRESHOLD_USD)))
    if owner in ('', 'unknown', 'unassigned', 'null', 'none'):
        v.append(_v('GOV-AUTH-001', 'Unauthorized Agent Detection', 'Critical',
                    'Agent has no registered owner'))
    if model and (any(bad in model for bad in UNAPPROVED_MODEL_MARKERS)
                  or not any(ok in model for ok in APPROVED_MODELS)):
        v.append(_v('GOV-MODEL-001', 'Model Version Control', 'High',
                    'Model/platform %r is not on the approved list' % (agent.get('model') or agent.get('platform'),)))
    if 'multi' in region:
        v.append(_v('GOV-DATA-001', 'Cross-Region Data Transfer', 'High',
                    'Agent operates across regions (%r)' % (agent.get('region'),)))
    if cert in ('expiring', 'expired', 'pending'):
        v.append(_v('GOV-CERT-001', 'Certification Expiry', 'Medium',
                    'Certification status is %r' % (agent.get('certificationStatus'),)))
    if (agent.get('status') or '').lower() == 'active' and (agent.get('tasksExecuted') or 0) == 0:
        v.append(_v('GOV-IDLE-001', 'Idle Agent Detection', 'Low',
                    'Agent is marked Active but has executed no tasks'))
    return v


def evaluate_transaction(sender: dict, receiver: dict, tokens: int,
                         receiver_reputation: dict = None) -> list:
    """
    Deterministic transaction-time checks between two identities/agents.
    sender/receiver are registry agent rows (may be None for pure-DID parties).
    Returns a list of violations; empty list means allowed.
    """
    v = []
    if tokens > TX_TOKEN_HARD_LIMIT:
        v.append(_v('GOV-COST-001', 'Transaction Token Limit', 'High',
                    'Requested tokens (%s) exceed the %s hard limit' % (tokens, TX_TOKEN_HARD_LIMIT)))
    if receiver:
        model = (receiver.get('model') or '').lower()
        if any(bad in model for bad in UNAPPROVED_MODEL_MARKERS):
            v.append(_v('GOV-MODEL-001', 'Model Version Control', 'High',
                        'Receiver uses unapproved model %r' % (receiver.get('model'),)))
        if (receiver.get('riskScore') or 0) > CRITICAL_RISK_SCORE:
            v.append(_v('GOV-RISK-001', 'Critical Risk Rating', 'Critical',
                        'Receiver risk score %s is Critical (>%s)' % (receiver.get('riskScore'), CRITICAL_RISK_SCORE)))
    if receiver_reputation and receiver_reputation.get('events', 0) >= 5 \
            and receiver_reputation.get('score', 100) < 30:
        v.append(_v('GOV-REP-001', 'Reputation Floor', 'High',
                    'Receiver reputation %s/100 over %s verified events is below the floor (30)'
                    % (receiver_reputation.get('score'), receiver_reputation.get('events'))))
    return v


def _v(policy_id, name, severity, details):
    return {'policy_id': policy_id, 'policy_name': name, 'severity': severity, 'details': details}
