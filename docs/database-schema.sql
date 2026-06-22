/*
 * ============================================================================
 * AETHER Enterprise AI Workforce Platform — Database Schema
 * ============================================================================
 *
 * Description : Complete PostgreSQL schema for the AETHER platform, covering
 *               tenant isolation, AI-agent lifecycle management, compliance,
 *               governance, observability, cost tracking, knowledge-graph,
 *               and supervisory-agent orchestration.
 *
 * Version     : 1.0.0
 * Created     : 2026-06-15
 * Database    : PostgreSQL 15+ (recommended 16+)
 * Encoding    : UTF-8
 * Collation   : en_US.UTF-8
 *
 * Requirements:
 *   - PostgreSQL 15 or later
 *   - Superuser or CREATE EXTENSION privilege for: uuid-ossp, pgcrypto, pg_trgm
 *   - Sufficient shared_buffers and work_mem for JSONB / GIN index workloads
 *   - Recommended: enable pg_stat_statements for query-performance monitoring
 *
 * Notes:
 *   - All primary keys use UUID v4 via uuid_generate_v4().
 *   - Row-level security (RLS) policies are NOT included here but should be
 *     layered on top using tenant_id for multi-tenant isolation.
 *   - Partitioning for high-volume tables (audit_logs, events, agent_activity)
 *     is recommended in production but omitted for clarity.
 *   - All timestamps are stored as TIMESTAMPTZ (UTC).
 *   - Tables are ordered to satisfy foreign-key dependencies (referenced
 *     tables appear before referencing tables).
 *
 * ============================================================================
 */

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram similarity / fuzzy search

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE agent_status AS ENUM (
    'discovered',
    'onboarding',
    'active',
    'inactive',
    'suspended',
    'offboarded',
    'decommissioned'
);

CREATE TYPE agent_environment AS ENUM (
    'production',
    'staging',
    'development',
    'testing'
);

CREATE TYPE agent_platform AS ENUM (
    'copilot_studio',
    'agentforce',
    'databricks',
    'aws_bedrock',
    'google_vertex',
    'langchain',
    'langgraph',
    'autogen',
    'custom'
);

CREATE TYPE monitoring_method AS ENUM (
    'connector_pull',
    'sdk_push',
    'webhook',
    'hybrid'
);

CREATE TYPE risk_level AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'minimal'
);

CREATE TYPE compliance_status AS ENUM (
    'compliant',
    'non_compliant',
    'partially_compliant',
    'under_review',
    'not_assessed'
);

CREATE TYPE policy_enforcement AS ENUM (
    'enforce',
    'warn',
    'audit',
    'disabled'
);

CREATE TYPE event_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'info'
);

CREATE TYPE integration_status AS ENUM (
    'active',
    'inactive',
    'error',
    'configuring'
);

CREATE TYPE scan_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);

CREATE TYPE credential_type AS ENUM (
    'api_key',
    'oauth_token',
    'service_account',
    'managed_identity',
    'certificate'
);

CREATE TYPE violation_status AS ENUM (
    'open',
    'acknowledged',
    'mitigating',
    'resolved',
    'false_positive'
);

CREATE TYPE finding_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'informational'
);

-- ============================================================================
-- 2. TABLES  (ordered by dependency — referenced tables first)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2.1  tenants  (root entity — referenced by nearly every table)
-- --------------------------------------------------------------------------
CREATE TABLE tenants (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(128) NOT NULL UNIQUE,
    display_name      VARCHAR(255),
    azure_tenant_id   UUID,
    subscription_tier VARCHAR(50)  NOT NULL DEFAULT 'free'
                      CHECK (subscription_tier IN ('free','starter','professional','enterprise')),
    settings          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.2  users
-- --------------------------------------------------------------------------
CREATE TABLE users (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email             VARCHAR(320) NOT NULL,
    display_name      VARCHAR(255) NOT NULL,
    azure_oid         UUID,
    avatar_url        TEXT,
    status            user_status NOT NULL DEFAULT 'pending',
    last_login_at     TIMESTAMPTZ,
    preferences       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, email)
);

-- --------------------------------------------------------------------------
-- 2.3  departments
-- --------------------------------------------------------------------------
CREATE TABLE departments (
    id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id            UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                 VARCHAR(255)  NOT NULL,
    code                 VARCHAR(50),
    parent_department_id UUID          REFERENCES departments(id) ON DELETE SET NULL,
    head_user_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
    budget_annual        NUMERIC(14,2),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, code)
);

-- --------------------------------------------------------------------------
-- 2.4  roles
-- --------------------------------------------------------------------------
CREATE TABLE roles (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(128) NOT NULL,
    description     TEXT,
    permissions     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    is_system_role  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name)
);

-- --------------------------------------------------------------------------
-- 2.5  user_roles
-- --------------------------------------------------------------------------
CREATE TABLE user_roles (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_by UUID        REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,

    UNIQUE (user_id, role_id, tenant_id)
);

-- --------------------------------------------------------------------------
-- 2.6  agents
-- --------------------------------------------------------------------------
CREATE TABLE agents (
    id                UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id         UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id       VARCHAR(512),
    name              VARCHAR(255)    NOT NULL,
    description       TEXT,
    platform          agent_platform  NOT NULL,
    environment       agent_environment NOT NULL DEFAULT 'development',
    status            agent_status    NOT NULL DEFAULT 'discovered',
    version           VARCHAR(50),
    endpoint_url      TEXT,
    region            VARCHAR(64),
    runtime           VARCHAR(128),
    owner_id          UUID            REFERENCES users(id) ON DELETE SET NULL,
    department_id     UUID            REFERENCES departments(id) ON DELETE SET NULL,
    monitoring_method monitoring_method,
    tags              JSONB           NOT NULL DEFAULT '[]'::jsonb,
    metadata          JSONB           NOT NULL DEFAULT '{}'::jsonb,
    onboarded_at      TIMESTAMPTZ,
    offboarded_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, external_id)
);

-- --------------------------------------------------------------------------
-- 2.7  agent_identity
-- --------------------------------------------------------------------------
CREATE TABLE agent_identity (
    id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id              UUID            NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id             UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    credential_type       credential_type NOT NULL,
    credential_identifier VARCHAR(512)    NOT NULL,
    credential_hash       TEXT,
    issued_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMPTZ,
    last_rotated_at       TIMESTAMPTZ,
    rotation_policy_days  INTEGER         CHECK (rotation_policy_days > 0),
    is_active             BOOLEAN         NOT NULL DEFAULT TRUE,
    metadata              JSONB           NOT NULL DEFAULT '{}'::jsonb,
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.8  integrations  (moved before agent_discovery which references it)
-- --------------------------------------------------------------------------
CREATE TABLE integrations (
    id                   UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id            UUID               NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                 VARCHAR(255)       NOT NULL,
    platform             agent_platform     NOT NULL,
    integration_status   integration_status NOT NULL DEFAULT 'configuring',
    connection_config    JSONB              NOT NULL DEFAULT '{}'::jsonb,
    auth_config          JSONB              NOT NULL DEFAULT '{}'::jsonb,
    last_sync_at         TIMESTAMPTZ,
    sync_frequency_minutes INTEGER          CHECK (sync_frequency_minutes > 0),
    error_message        TEXT,
    created_by           UUID               REFERENCES users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name)
);

-- --------------------------------------------------------------------------
-- 2.9  agent_discovery
-- --------------------------------------------------------------------------
CREATE TABLE agent_discovery (
    id                     UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id              UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id         UUID           NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    scan_status            scan_status    NOT NULL DEFAULT 'pending',
    platform               agent_platform NOT NULL,
    discovered_agents_count INTEGER       NOT NULL DEFAULT 0 CHECK (discovered_agents_count >= 0),
    new_agents_count       INTEGER        NOT NULL DEFAULT 0 CHECK (new_agents_count >= 0),
    updated_agents_count   INTEGER        NOT NULL DEFAULT 0 CHECK (updated_agents_count >= 0),
    scan_started_at        TIMESTAMPTZ,
    scan_completed_at      TIMESTAMPTZ,
    scan_results           JSONB          NOT NULL DEFAULT '[]'::jsonb,
    error_message          TEXT,
    created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.10 agent_activity
-- --------------------------------------------------------------------------
CREATE TABLE agent_activity (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id        UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_type   VARCHAR(128) NOT NULL,
    description     TEXT,
    input_summary   TEXT,
    output_summary  TEXT,
    tokens_used     INTEGER     CHECK (tokens_used >= 0),
    latency_ms      INTEGER     CHECK (latency_ms >= 0),
    was_successful  BOOLEAN     NOT NULL DEFAULT TRUE,
    error_message   TEXT,
    metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.11 agent_metrics
-- --------------------------------------------------------------------------
CREATE TABLE agent_metrics (
    id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id     UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id    UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_name  VARCHAR(128)  NOT NULL,
    metric_value NUMERIC       NOT NULL,
    metric_unit  VARCHAR(50),
    dimensions   JSONB         NOT NULL DEFAULT '{}'::jsonb,
    recorded_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.12 agent_costs
-- --------------------------------------------------------------------------
CREATE TABLE agent_costs (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id        UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start    TIMESTAMPTZ   NOT NULL,
    period_end      TIMESTAMPTZ   NOT NULL,
    total_cost      NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    token_cost      NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (token_cost >= 0),
    compute_cost    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (compute_cost >= 0),
    api_call_cost   NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (api_call_cost >= 0),
    storage_cost    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (storage_cost >= 0),
    total_tokens    BIGINT        NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    total_api_calls BIGINT        NOT NULL DEFAULT 0 CHECK (total_api_calls >= 0),
    currency        VARCHAR(3)    NOT NULL DEFAULT 'USD',
    metadata        JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CHECK (period_end > period_start)
);

-- --------------------------------------------------------------------------
-- 2.13 agent_risks
-- --------------------------------------------------------------------------
CREATE TABLE agent_risks (
    id                     UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id               UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id              UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    overall_risk_level     risk_level    NOT NULL DEFAULT 'medium',
    risk_score             NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    data_sensitivity_score NUMERIC(5,2)  CHECK (data_sensitivity_score >= 0 AND data_sensitivity_score <= 100),
    autonomy_score         NUMERIC(5,2)  CHECK (autonomy_score >= 0 AND autonomy_score <= 100),
    impact_score           NUMERIC(5,2)  CHECK (impact_score >= 0 AND impact_score <= 100),
    access_scope_score     NUMERIC(5,2)  CHECK (access_scope_score >= 0 AND access_scope_score <= 100),
    pii_access             BOOLEAN       NOT NULL DEFAULT FALSE,
    financial_access       BOOLEAN       NOT NULL DEFAULT FALSE,
    external_access        BOOLEAN       NOT NULL DEFAULT FALSE,
    risk_factors           JSONB         NOT NULL DEFAULT '[]'::jsonb,
    assessed_by            UUID          REFERENCES users(id) ON DELETE SET NULL,
    assessed_at            TIMESTAMPTZ,
    next_assessment_at     TIMESTAMPTZ,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.14 compliance_frameworks  (moved before agent_compliance)
-- --------------------------------------------------------------------------
CREATE TABLE compliance_frameworks (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    version         VARCHAR(50) NOT NULL DEFAULT '1.0',
    description     TEXT,
    authority       VARCHAR(255),
    effective_date  DATE,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name, version)
);

-- --------------------------------------------------------------------------
-- 2.15 agent_compliance
-- --------------------------------------------------------------------------
CREATE TABLE agent_compliance (
    id                    UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id              UUID              NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id             UUID              NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    framework_id          UUID              NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    compliance_status     compliance_status NOT NULL DEFAULT 'not_assessed',
    last_assessed_at      TIMESTAMPTZ,
    next_assessment_at    TIMESTAMPTZ,
    findings_count        INTEGER           NOT NULL DEFAULT 0 CHECK (findings_count >= 0),
    critical_findings_count INTEGER         NOT NULL DEFAULT 0 CHECK (critical_findings_count >= 0),
    evidence              JSONB             NOT NULL DEFAULT '[]'::jsonb,
    created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.16 agent_health
-- --------------------------------------------------------------------------
CREATE TABLE agent_health (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id            UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tenant_id           UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    is_healthy          BOOLEAN       NOT NULL DEFAULT TRUE,
    uptime_percentage   NUMERIC(5,2)  CHECK (uptime_percentage >= 0 AND uptime_percentage <= 100),
    avg_latency_ms      INTEGER       CHECK (avg_latency_ms >= 0),
    p95_latency_ms      INTEGER       CHECK (p95_latency_ms >= 0),
    p99_latency_ms      INTEGER       CHECK (p99_latency_ms >= 0),
    success_rate        NUMERIC(5,2)  CHECK (success_rate >= 0 AND success_rate <= 100),
    error_rate          NUMERIC(5,2)  CHECK (error_rate >= 0 AND error_rate <= 100),
    last_heartbeat_at   TIMESTAMPTZ,
    last_error_at       TIMESTAMPTZ,
    last_error_message  TEXT,
    health_details      JSONB         NOT NULL DEFAULT '{}'::jsonb,
    recorded_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.17 policies
-- --------------------------------------------------------------------------
CREATE TABLE policies (
    id              UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID              NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255)      NOT NULL,
    description     TEXT,
    category        VARCHAR(128)      NOT NULL,
    enforcement     policy_enforcement NOT NULL DEFAULT 'audit',
    rules           JSONB             NOT NULL DEFAULT '[]'::jsonb,
    scope           JSONB             NOT NULL DEFAULT '{}'::jsonb,
    priority        INTEGER           NOT NULL DEFAULT 100 CHECK (priority >= 0),
    is_active       BOOLEAN           NOT NULL DEFAULT TRUE,
    created_by      UUID              REFERENCES users(id) ON DELETE SET NULL,
    approved_by     UUID              REFERENCES users(id) ON DELETE SET NULL,
    effective_from  TIMESTAMPTZ,
    effective_until TIMESTAMPTZ,
    version         VARCHAR(50)       NOT NULL DEFAULT '1.0',
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name, version)
);

-- --------------------------------------------------------------------------
-- 2.18 violations
-- --------------------------------------------------------------------------
CREATE TABLE violations (
    id                UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id         UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id         UUID             NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    agent_id          UUID             REFERENCES agents(id) ON DELETE SET NULL,
    violation_status  violation_status NOT NULL DEFAULT 'open',
    severity          event_severity   NOT NULL DEFAULT 'medium',
    description       TEXT             NOT NULL,
    evidence          JSONB            NOT NULL DEFAULT '{}'::jsonb,
    remediation_steps TEXT,
    resolved_by       UUID             REFERENCES users(id) ON DELETE SET NULL,
    resolved_at       TIMESTAMPTZ,
    resolution_notes  TEXT,
    created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.19 audit_logs
-- --------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id      UUID,
    actor_type    VARCHAR(50) NOT NULL DEFAULT 'user'
                  CHECK (actor_type IN ('user','agent','system','service')),
    action        VARCHAR(128) NOT NULL,
    resource_type VARCHAR(128) NOT NULL,
    resource_id   UUID,
    changes       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    ip_address    INET,
    user_agent    TEXT,
    session_id    UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.20 events
-- --------------------------------------------------------------------------
CREATE TABLE events (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type      VARCHAR(128)   NOT NULL,
    source          VARCHAR(255)   NOT NULL,
    severity        event_severity NOT NULL DEFAULT 'info',
    payload         JSONB          NOT NULL DEFAULT '{}'::jsonb,
    correlation_id  UUID,
    processed       BOOLEAN        NOT NULL DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.21 platform_connectors
-- --------------------------------------------------------------------------
CREATE TABLE platform_connectors (
    id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform            agent_platform NOT NULL,
    name                VARCHAR(255)   NOT NULL,
    description         TEXT,
    version             VARCHAR(50)    NOT NULL DEFAULT '1.0',
    connector_config    JSONB          NOT NULL DEFAULT '{}'::jsonb,
    supported_features  JSONB          NOT NULL DEFAULT '[]'::jsonb,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    documentation_url   TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    UNIQUE (platform, version)
);

-- --------------------------------------------------------------------------
-- 2.22 knowledge_graph_nodes
-- --------------------------------------------------------------------------
CREATE TABLE knowledge_graph_nodes (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    node_type   VARCHAR(128) NOT NULL,
    entity_id   UUID,
    label       VARCHAR(512) NOT NULL,
    properties  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    embedding   JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.23 knowledge_graph_edges
-- --------------------------------------------------------------------------
CREATE TABLE knowledge_graph_edges (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_node_id  UUID          NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    target_node_id  UUID          NOT NULL REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    edge_type       VARCHAR(128)  NOT NULL,
    weight          NUMERIC(5,4)  NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
    properties      JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, source_node_id, target_node_id, edge_type)
);

-- --------------------------------------------------------------------------
-- 2.24 supervisory_agents
-- --------------------------------------------------------------------------
CREATE TABLE supervisory_agents (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                 VARCHAR(255) NOT NULL UNIQUE,
    agent_type           VARCHAR(128) NOT NULL,
    description          TEXT,
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    configuration        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    last_run_at          TIMESTAMPTZ,
    run_frequency_seconds INTEGER    CHECK (run_frequency_seconds > 0),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.25 supervisory_agent_runs
-- --------------------------------------------------------------------------
CREATE TABLE supervisory_agent_runs (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisory_agent_id  UUID        NOT NULL REFERENCES supervisory_agents(id) ON DELETE CASCADE,
    tenant_id             UUID        REFERENCES tenants(id) ON DELETE SET NULL,
    status                VARCHAR(50) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','running','completed','failed','cancelled')),
    started_at            TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    duration_ms           INTEGER     CHECK (duration_ms >= 0),
    input_params          JSONB       NOT NULL DEFAULT '{}'::jsonb,
    output_results        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    error_message         TEXT,
    tokens_consumed       INTEGER     CHECK (tokens_consumed >= 0),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2.26 compliance_controls
-- --------------------------------------------------------------------------
CREATE TABLE compliance_controls (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id    UUID        NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    control_id_code VARCHAR(50) NOT NULL,
    title           VARCHAR(512) NOT NULL,
    description     TEXT,
    category        VARCHAR(128),
    requirements    JSONB       NOT NULL DEFAULT '[]'::jsonb,
    test_procedures JSONB       NOT NULL DEFAULT '[]'::jsonb,
    is_automated    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (framework_id, control_id_code)
);

-- --------------------------------------------------------------------------
-- 2.27 compliance_findings
-- --------------------------------------------------------------------------
CREATE TABLE compliance_findings (
    id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID             NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    control_id      UUID             NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    agent_id        UUID             REFERENCES agents(id) ON DELETE SET NULL,
    severity        finding_severity NOT NULL DEFAULT 'medium',
    title           VARCHAR(512)     NOT NULL,
    description     TEXT,
    evidence        JSONB            NOT NULL DEFAULT '{}'::jsonb,
    remediation     TEXT,
    status          violation_status NOT NULL DEFAULT 'open',
    found_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- --------------- tenants ---------------
CREATE INDEX idx_tenants_slug              ON tenants USING btree (slug);
CREATE INDEX idx_tenants_azure_tenant_id   ON tenants USING btree (azure_tenant_id) WHERE azure_tenant_id IS NOT NULL;
CREATE INDEX idx_tenants_is_active         ON tenants USING btree (is_active) WHERE is_active = TRUE;

-- --------------- users ---------------
CREATE INDEX idx_users_tenant_id           ON users USING btree (tenant_id);
CREATE INDEX idx_users_email               ON users USING btree (email);
CREATE INDEX idx_users_azure_oid           ON users USING btree (azure_oid) WHERE azure_oid IS NOT NULL;
CREATE INDEX idx_users_status              ON users USING btree (tenant_id, status);
CREATE INDEX idx_users_display_name_trgm   ON users USING gin (display_name gin_trgm_ops);

-- --------------- departments ---------------
CREATE INDEX idx_departments_tenant_id     ON departments USING btree (tenant_id);
CREATE INDEX idx_departments_parent        ON departments USING btree (parent_department_id) WHERE parent_department_id IS NOT NULL;
CREATE INDEX idx_departments_head_user     ON departments USING btree (head_user_id) WHERE head_user_id IS NOT NULL;

-- --------------- roles ---------------
CREATE INDEX idx_roles_tenant_id           ON roles USING btree (tenant_id);
CREATE INDEX idx_roles_permissions         ON roles USING gin (permissions);

-- --------------- user_roles ---------------
CREATE INDEX idx_user_roles_user_id        ON user_roles USING btree (user_id);
CREATE INDEX idx_user_roles_role_id        ON user_roles USING btree (role_id);
CREATE INDEX idx_user_roles_tenant_id      ON user_roles USING btree (tenant_id);
CREATE INDEX idx_user_roles_assigned_by    ON user_roles USING btree (assigned_by) WHERE assigned_by IS NOT NULL;

-- --------------- agents ---------------
CREATE INDEX idx_agents_tenant_id          ON agents USING btree (tenant_id);
CREATE INDEX idx_agents_platform           ON agents USING btree (tenant_id, platform);
CREATE INDEX idx_agents_status             ON agents USING btree (tenant_id, status);
CREATE INDEX idx_agents_environment        ON agents USING btree (tenant_id, environment);
CREATE INDEX idx_agents_owner_id           ON agents USING btree (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_agents_department_id      ON agents USING btree (department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_agents_name_trgm          ON agents USING gin (name gin_trgm_ops);
CREATE INDEX idx_agents_tags               ON agents USING gin (tags);
CREATE INDEX idx_agents_metadata           ON agents USING gin (metadata);

-- --------------- agent_identity ---------------
CREATE INDEX idx_agent_identity_agent_id   ON agent_identity USING btree (agent_id);
CREATE INDEX idx_agent_identity_tenant_id  ON agent_identity USING btree (tenant_id);
CREATE INDEX idx_agent_identity_cred_type  ON agent_identity USING btree (credential_type);
CREATE INDEX idx_agent_identity_active     ON agent_identity USING btree (agent_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_agent_identity_expires    ON agent_identity USING btree (expires_at) WHERE expires_at IS NOT NULL;

-- --------------- integrations ---------------
CREATE INDEX idx_integrations_tenant_id         ON integrations USING btree (tenant_id);
CREATE INDEX idx_integrations_platform          ON integrations USING btree (tenant_id, platform);
CREATE INDEX idx_integrations_status            ON integrations USING btree (tenant_id, integration_status);
CREATE INDEX idx_integrations_created_by        ON integrations USING btree (created_by) WHERE created_by IS NOT NULL;

-- --------------- agent_discovery ---------------
CREATE INDEX idx_agent_discovery_tenant_id      ON agent_discovery USING btree (tenant_id);
CREATE INDEX idx_agent_discovery_integration_id ON agent_discovery USING btree (integration_id);
CREATE INDEX idx_agent_discovery_status         ON agent_discovery USING btree (scan_status);
CREATE INDEX idx_agent_discovery_platform       ON agent_discovery USING btree (tenant_id, platform);

-- --------------- agent_activity ---------------
CREATE INDEX idx_agent_activity_agent_id        ON agent_activity USING btree (agent_id);
CREATE INDEX idx_agent_activity_tenant_id       ON agent_activity USING btree (tenant_id);
CREATE INDEX idx_agent_activity_type            ON agent_activity USING btree (tenant_id, activity_type);
CREATE INDEX idx_agent_activity_occurred_at     ON agent_activity USING btree (tenant_id, occurred_at DESC);
CREATE INDEX idx_agent_activity_agent_occurred  ON agent_activity USING btree (agent_id, occurred_at DESC);
CREATE INDEX idx_agent_activity_successful      ON agent_activity USING btree (tenant_id, was_successful) WHERE was_successful = FALSE;
CREATE INDEX idx_agent_activity_metadata        ON agent_activity USING gin (metadata);

-- --------------- agent_metrics ---------------
CREATE INDEX idx_agent_metrics_agent_id         ON agent_metrics USING btree (agent_id);
CREATE INDEX idx_agent_metrics_tenant_id        ON agent_metrics USING btree (tenant_id);
CREATE INDEX idx_agent_metrics_name             ON agent_metrics USING btree (tenant_id, metric_name);
CREATE INDEX idx_agent_metrics_recorded_at      ON agent_metrics USING btree (agent_id, recorded_at DESC);
CREATE INDEX idx_agent_metrics_dimensions       ON agent_metrics USING gin (dimensions);

-- --------------- agent_costs ---------------
CREATE INDEX idx_agent_costs_agent_id           ON agent_costs USING btree (agent_id);
CREATE INDEX idx_agent_costs_tenant_id          ON agent_costs USING btree (tenant_id);
CREATE INDEX idx_agent_costs_period             ON agent_costs USING btree (tenant_id, period_start, period_end);
CREATE INDEX idx_agent_costs_agent_period       ON agent_costs USING btree (agent_id, period_start DESC);

-- --------------- agent_risks ---------------
CREATE INDEX idx_agent_risks_agent_id           ON agent_risks USING btree (agent_id);
CREATE INDEX idx_agent_risks_tenant_id          ON agent_risks USING btree (tenant_id);
CREATE INDEX idx_agent_risks_level              ON agent_risks USING btree (tenant_id, overall_risk_level);
CREATE INDEX idx_agent_risks_score              ON agent_risks USING btree (tenant_id, risk_score DESC);
CREATE INDEX idx_agent_risks_pii               ON agent_risks USING btree (tenant_id) WHERE pii_access = TRUE;
CREATE INDEX idx_agent_risks_financial         ON agent_risks USING btree (tenant_id) WHERE financial_access = TRUE;
CREATE INDEX idx_agent_risks_factors           ON agent_risks USING gin (risk_factors);

-- --------------- compliance_frameworks ---------------
CREATE INDEX idx_cf_tenant_id                   ON compliance_frameworks USING btree (tenant_id);
CREATE INDEX idx_cf_active                      ON compliance_frameworks USING btree (tenant_id, is_active) WHERE is_active = TRUE;

-- --------------- agent_compliance ---------------
CREATE INDEX idx_agent_compliance_agent_id      ON agent_compliance USING btree (agent_id);
CREATE INDEX idx_agent_compliance_tenant_id     ON agent_compliance USING btree (tenant_id);
CREATE INDEX idx_agent_compliance_framework     ON agent_compliance USING btree (framework_id);
CREATE INDEX idx_agent_compliance_status        ON agent_compliance USING btree (tenant_id, compliance_status);
CREATE INDEX idx_agent_compliance_next_assess   ON agent_compliance USING btree (next_assessment_at) WHERE next_assessment_at IS NOT NULL;

-- --------------- agent_health ---------------
CREATE INDEX idx_agent_health_agent_id          ON agent_health USING btree (agent_id);
CREATE INDEX idx_agent_health_tenant_id         ON agent_health USING btree (tenant_id);
CREATE INDEX idx_agent_health_healthy           ON agent_health USING btree (tenant_id, is_healthy) WHERE is_healthy = FALSE;
CREATE INDEX idx_agent_health_recorded_at       ON agent_health USING btree (agent_id, recorded_at DESC);
CREATE INDEX idx_agent_health_heartbeat         ON agent_health USING btree (last_heartbeat_at DESC) WHERE last_heartbeat_at IS NOT NULL;

-- --------------- policies ---------------
CREATE INDEX idx_policies_tenant_id             ON policies USING btree (tenant_id);
CREATE INDEX idx_policies_category              ON policies USING btree (tenant_id, category);
CREATE INDEX idx_policies_enforcement           ON policies USING btree (tenant_id, enforcement);
CREATE INDEX idx_policies_active                ON policies USING btree (tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_policies_created_by            ON policies USING btree (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_policies_rules                 ON policies USING gin (rules);
CREATE INDEX idx_policies_scope                 ON policies USING gin (scope);

-- --------------- violations ---------------
CREATE INDEX idx_violations_tenant_id           ON violations USING btree (tenant_id);
CREATE INDEX idx_violations_policy_id           ON violations USING btree (policy_id);
CREATE INDEX idx_violations_agent_id            ON violations USING btree (agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_violations_status              ON violations USING btree (tenant_id, violation_status);
CREATE INDEX idx_violations_severity            ON violations USING btree (tenant_id, severity);
CREATE INDEX idx_violations_open                ON violations USING btree (tenant_id, created_at DESC) WHERE violation_status = 'open';
CREATE INDEX idx_violations_evidence            ON violations USING gin (evidence);

-- --------------- audit_logs ---------------
CREATE INDEX idx_audit_logs_tenant_id           ON audit_logs USING btree (tenant_id);
CREATE INDEX idx_audit_logs_actor               ON audit_logs USING btree (tenant_id, actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action              ON audit_logs USING btree (tenant_id, action);
CREATE INDEX idx_audit_logs_resource            ON audit_logs USING btree (tenant_id, resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at          ON audit_logs USING btree (tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_session             ON audit_logs USING btree (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_logs_changes             ON audit_logs USING gin (changes);

-- --------------- events ---------------
CREATE INDEX idx_events_tenant_id               ON events USING btree (tenant_id);
CREATE INDEX idx_events_type                    ON events USING btree (tenant_id, event_type);
CREATE INDEX idx_events_severity                ON events USING btree (tenant_id, severity);
CREATE INDEX idx_events_correlation             ON events USING btree (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_events_unprocessed             ON events USING btree (tenant_id, created_at) WHERE processed = FALSE;
CREATE INDEX idx_events_created_at              ON events USING btree (tenant_id, created_at DESC);
CREATE INDEX idx_events_payload                 ON events USING gin (payload);

-- --------------- platform_connectors ---------------
CREATE INDEX idx_platform_connectors_platform   ON platform_connectors USING btree (platform);
CREATE INDEX idx_platform_connectors_active     ON platform_connectors USING btree (platform, is_active) WHERE is_active = TRUE;

-- --------------- knowledge_graph_nodes ---------------
CREATE INDEX idx_kg_nodes_tenant_id             ON knowledge_graph_nodes USING btree (tenant_id);
CREATE INDEX idx_kg_nodes_type                  ON knowledge_graph_nodes USING btree (tenant_id, node_type);
CREATE INDEX idx_kg_nodes_entity_id             ON knowledge_graph_nodes USING btree (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_kg_nodes_label_trgm            ON knowledge_graph_nodes USING gin (label gin_trgm_ops);
CREATE INDEX idx_kg_nodes_properties            ON knowledge_graph_nodes USING gin (properties);

-- --------------- knowledge_graph_edges ---------------
CREATE INDEX idx_kg_edges_tenant_id             ON knowledge_graph_edges USING btree (tenant_id);
CREATE INDEX idx_kg_edges_source                ON knowledge_graph_edges USING btree (source_node_id);
CREATE INDEX idx_kg_edges_target                ON knowledge_graph_edges USING btree (target_node_id);
CREATE INDEX idx_kg_edges_type                  ON knowledge_graph_edges USING btree (tenant_id, edge_type);
CREATE INDEX idx_kg_edges_properties            ON knowledge_graph_edges USING gin (properties);

-- --------------- supervisory_agents ---------------
CREATE INDEX idx_supervisory_agents_type        ON supervisory_agents USING btree (agent_type);
CREATE INDEX idx_supervisory_agents_active      ON supervisory_agents USING btree (is_active) WHERE is_active = TRUE;

-- --------------- supervisory_agent_runs ---------------
CREATE INDEX idx_sa_runs_agent_id               ON supervisory_agent_runs USING btree (supervisory_agent_id);
CREATE INDEX idx_sa_runs_tenant_id              ON supervisory_agent_runs USING btree (tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_sa_runs_status                 ON supervisory_agent_runs USING btree (status);
CREATE INDEX idx_sa_runs_started_at             ON supervisory_agent_runs USING btree (supervisory_agent_id, started_at DESC);

-- --------------- compliance_controls ---------------
CREATE INDEX idx_cc_framework_id                ON compliance_controls USING btree (framework_id);
CREATE INDEX idx_cc_tenant_id                   ON compliance_controls USING btree (tenant_id);
CREATE INDEX idx_cc_category                    ON compliance_controls USING btree (tenant_id, category);
CREATE INDEX idx_cc_automated                   ON compliance_controls USING btree (framework_id, is_automated) WHERE is_automated = TRUE;
CREATE INDEX idx_cc_requirements                ON compliance_controls USING gin (requirements);
CREATE INDEX idx_cc_test_procedures             ON compliance_controls USING gin (test_procedures);

-- --------------- compliance_findings ---------------
CREATE INDEX idx_cfind_tenant_id                ON compliance_findings USING btree (tenant_id);
CREATE INDEX idx_cfind_control_id               ON compliance_findings USING btree (control_id);
CREATE INDEX idx_cfind_agent_id                 ON compliance_findings USING btree (agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_cfind_severity                 ON compliance_findings USING btree (tenant_id, severity);
CREATE INDEX idx_cfind_status                   ON compliance_findings USING btree (tenant_id, status);
CREATE INDEX idx_cfind_open                     ON compliance_findings USING btree (tenant_id, found_at DESC) WHERE status = 'open';
CREATE INDEX idx_cfind_evidence                 ON compliance_findings USING gin (evidence);

-- ============================================================================
-- 4. TRIGGER FUNCTION — auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. APPLY TRIGGER TO ALL TABLES WITH updated_at
-- ============================================================================

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agent_identity_updated_at
    BEFORE UPDATE ON agent_identity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agent_costs_updated_at
    BEFORE UPDATE ON agent_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agent_risks_updated_at
    BEFORE UPDATE ON agent_risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_frameworks_updated_at
    BEFORE UPDATE ON compliance_frameworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agent_compliance_updated_at
    BEFORE UPDATE ON agent_compliance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_violations_updated_at
    BEFORE UPDATE ON violations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_platform_connectors_updated_at
    BEFORE UPDATE ON platform_connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_kg_nodes_updated_at
    BEFORE UPDATE ON knowledge_graph_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_kg_edges_updated_at
    BEFORE UPDATE ON knowledge_graph_edges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_supervisory_agents_updated_at
    BEFORE UPDATE ON supervisory_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_controls_updated_at
    BEFORE UPDATE ON compliance_controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_compliance_findings_updated_at
    BEFORE UPDATE ON compliance_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
