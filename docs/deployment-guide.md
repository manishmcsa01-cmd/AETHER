# AETHER Enterprise AI Workforce Platform — Deployment Guide

> **Version**: 2.0.0  
> **Last Updated**: 2026-06-15  
> **Maintainers**: AETHER Platform Engineering Team

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Docker Configuration](#3-docker-configuration)
4. [Kubernetes (AKS) Deployment](#4-kubernetes-aks-deployment)
5. [Terraform Infrastructure](#5-terraform-infrastructure)
6. [CI/CD Pipeline (GitHub Actions)](#6-cicd-pipeline-github-actions)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Health Check Endpoints](#8-health-check-endpoints)
9. [Monitoring & Alerting](#9-monitoring--alerting)
10. [Backup & Disaster Recovery](#10-backup--disaster-recovery)
11. [Security Hardening](#11-security-hardening)

---

## 1. Prerequisites

Ensure the following tools and services are available before proceeding.

| Tool / Service          | Minimum Version | Purpose                          |
|-------------------------|-----------------|----------------------------------|
| Azure Subscription      | —               | Cloud hosting & managed services |
| Azure CLI               | 2.50+           | Azure resource management        |
| Node.js                 | 20 LTS          | Frontend build toolchain         |
| Python                  | 3.12+           | Backend runtime                  |
| Docker                  | 24+             | Container builds & local dev     |
| Docker Compose          | v2              | Multi-container orchestration    |
| kubectl                 | 1.28+           | Kubernetes cluster management    |
| Terraform               | 1.6+            | Infrastructure as Code           |
| Helm                    | 3.13+           | Kubernetes package management    |
| Git                     | 2.40+           | Source control                   |

```bash
# Verify all prerequisites
az --version          # Azure CLI 2.50+
node --version        # v20.x
python3 --version     # 3.12+
docker --version      # 24+
docker compose version # v2.x
kubectl version --client # 1.28+
terraform --version   # 1.6+
helm version          # 3.13+
git --version         # 2.40+
```

---

## 2. Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/aether-platform/aether-enterprise.git
cd aether-enterprise
```

### 2.2 Install Frontend Dependencies

```bash
cd frontend
npm ci
cp .env.example .env.local
# Edit .env.local with your local API URL
```

### 2.3 Install Backend Dependencies

```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

pip install poetry==1.8.3
poetry install --with dev,test
cp .env.example .env
```

### 2.4 Start Local Infrastructure (PostgreSQL & Redis)

```bash
cd ..
docker compose -f docker-compose.dev.yaml up -d postgres redis
```

```yaml
# docker-compose.dev.yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: aether_dev
      POSTGRES_USER: aether
      POSTGRES_PASSWORD: localdev123
    volumes:
      - pgdata_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aether -d aether_dev"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata_dev:
```

### 2.5 Run Database Migrations & Seed Data

```bash
cd backend
alembic upgrade head
python -m aether.cli seed --environment development
```

### 2.6 Start Development Servers

```bash
# Terminal 1 — Backend
cd backend
uvicorn aether.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev -- --port 3000
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 3. Docker Configuration

### 3.1 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
# ─── Stage 1: Build ───
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_APP_VERSION=0.0.0
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:1.25-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Backend Dockerfile

```dockerfile
# backend/Dockerfile
# ─── Stage 1: Build ───
FROM python:3.12-slim AS builder

WORKDIR /build

RUN pip install --no-cache-dir poetry==1.8.3

COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --without-hashes -o requirements.txt

COPY . .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
RUN pip install --no-cache-dir --prefix=/install .

# ─── Stage 2: Run ───
FROM python:3.12-slim AS runner

RUN groupadd --gid 1001 aether && \
    useradd --uid 1001 --gid 1001 --shell /bin/false --create-home aether

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --from=builder /build/alembic /app/alembic
COPY --from=builder /build/alembic.ini /app/alembic.ini

RUN chown -R aether:aether /app

USER aether

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/live')" || exit 1

CMD ["uvicorn", "aether.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--access-log", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
```

### 3.3 docker-compose.yaml (Full Stack)

```yaml
# docker-compose.yaml
version: "3.9"

x-common: &common-restart
  restart: unless-stopped

services:
  # ── Frontend ──
  frontend:
    <<: *common-restart
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: /api
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - aether-net
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M
        reservations:
          cpus: "0.25"
          memory: 128M
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:80/health"]
      interval: 30s
      timeout: 5s
      start_period: 10s
      retries: 3

  # ── Backend API ──
  backend:
    <<: *common-restart
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql+asyncpg://aether:${POSTGRES_PASSWORD}@postgres:5432/aether
      REDIS_URL: redis://redis:6379/0
      ENVIRONMENT: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - aether-net
    deploy:
      resources:
        limits:
          cpus: "2.00"
          memory: 2G
        reservations:
          cpus: "1.00"
          memory: 1G
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/live')"]
      interval: 30s
      timeout: 5s
      start_period: 30s
      retries: 3

  # ── PostgreSQL ──
  postgres:
    <<: *common-restart
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: aether
      POSTGRES_USER: aether
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - aether-net
    deploy:
      resources:
        limits:
          cpus: "1.00"
          memory: 1G
        reservations:
          cpus: "0.50"
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aether -d aether"]
      interval: 10s
      timeout: 5s
      start_period: 20s
      retries: 5

  # ── Redis ──
  redis:
    <<: *common-restart
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: >
      redis-server
        --maxmemory 512mb
        --maxmemory-policy allkeys-lru
        --appendonly yes
        --save 60 1000
    volumes:
      - redisdata:/data
    networks:
      - aether-net
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 768M
        reservations:
          cpus: "0.25"
          memory: 256M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      start_period: 10s
      retries: 5

  # ── pgAdmin ──
  pgadmin:
    <<: *common-restart
    image: dpage/pgadmin4:8
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@aether.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
      PGADMIN_CONFIG_SERVER_MODE: "False"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - aether-net
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M

volumes:
  pgdata:
    name: aether-pgdata
  redisdata:
    name: aether-redisdata
  pgadmin_data:
    name: aether-pgadmin

networks:
  aether-net:
    name: aether-network
    driver: bridge
```

### 3.4 .env.example

```bash
# .env.example — AETHER Platform Environment Variables

# ─── Application ───
APP_NAME=aether-platform
ENVIRONMENT=development
DEBUG=false
LOG_LEVEL=info
SECRET_KEY=CHANGE_ME_GENERATE_A_RANDOM_64_CHAR_STRING
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000

# ─── Database ───
POSTGRES_PASSWORD=changeme
DATABASE_URL=postgresql+asyncpg://aether:changeme@postgres:5432/aether
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30

# ─── Redis ───
REDIS_URL=redis://redis:6379/0
REDIS_MAX_CONNECTIONS=50

# ─── Authentication ───
JWT_SECRET_KEY=CHANGE_ME_GENERATE_A_RANDOM_64_CHAR_STRING
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=

# ─── Azure Services ───
AZURE_SUBSCRIPTION_ID=
AZURE_RESOURCE_GROUP=rg-aether-prod
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
AZURE_KEY_VAULT_URL=

# ─── Event Hub ───
EVENTHUB_NAMESPACE=aether-events-prod
EVENTHUB_CONNECTION_STRING=
EVENTHUB_AGENT_EVENTS_HUB=agent-events
EVENTHUB_WORKFLOW_EVENTS_HUB=workflow-events
EVENTHUB_AUDIT_EVENTS_HUB=audit-events

# ─── Monitoring ───
APPLICATIONINSIGHTS_CONNECTION_STRING=
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_SERVICE_NAME=aether-backend

# ─── Feature Flags ───
FEATURE_AI_AGENTS=true
FEATURE_WORKFLOW_ENGINE=true
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_MULTI_TENANT=false

# ─── pgAdmin ───
PGADMIN_EMAIL=admin@aether.local
PGADMIN_PASSWORD=admin
```

---

## 4. Kubernetes (AKS) Deployment

### 4.1 Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aether
  labels:
    app.kubernetes.io/name: aether
    app.kubernetes.io/part-of: aether-platform
    environment: production
```

### 4.2 ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aether-config
  namespace: aether
  labels:
    app.kubernetes.io/name: aether
data:
  APP_NAME: "aether-platform"
  ENVIRONMENT: "production"
  LOG_LEVEL: "info"
  DEBUG: "false"
  DATABASE_POOL_SIZE: "20"
  DATABASE_MAX_OVERFLOW: "10"
  DATABASE_POOL_TIMEOUT: "30"
  REDIS_MAX_CONNECTIONS: "50"
  OTEL_SERVICE_NAME: "aether-backend"
  FEATURE_AI_AGENTS: "true"
  FEATURE_WORKFLOW_ENGINE: "true"
  FEATURE_ADVANCED_ANALYTICS: "false"
  FEATURE_MULTI_TENANT: "false"
  CORS_ORIGINS: "https://aether.example.com"
  ALLOWED_HOSTS: "aether.example.com"
```

### 4.3 Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: aether-secrets
  namespace: aether
  labels:
    app.kubernetes.io/name: aether
type: Opaque
stringData:
  SECRET_KEY: "<generated-64-char-secret>"
  JWT_SECRET_KEY: "<generated-64-char-jwt-secret>"
  DATABASE_URL: "postgresql+asyncpg://aether:<password>@aether-postgres.postgres.database.azure.com:5432/aether?sslmode=require"
  REDIS_URL: "rediss://:<access-key>@aether-redis.redis.cache.windows.net:6380/0"
  AZURE_AD_TENANT_ID: "<tenant-id>"
  AZURE_AD_CLIENT_ID: "<client-id>"
  AZURE_AD_CLIENT_SECRET: "<client-secret>"
  EVENTHUB_CONNECTION_STRING: "<eventhub-connection-string>"
  APPLICATIONINSIGHTS_CONNECTION_STRING: "<appinsights-connection-string>"
  AZURE_STORAGE_ACCOUNT_KEY: "<storage-key>"
```

### 4.4 Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aether-backend
  namespace: aether
  labels:
    app.kubernetes.io/name: aether-backend
    app.kubernetes.io/component: api
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: aether-backend
  template:
    metadata:
      labels:
        app.kubernetes.io/name: aether-backend
        app.kubernetes.io/component: api
    spec:
      serviceAccountName: aether-backend-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app.kubernetes.io/name
                      operator: In
                      values:
                        - aether-backend
                topologyKey: kubernetes.io/hostname
      containers:
        - name: backend
          image: aetherprod.azurecr.io/aether-backend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
              protocol: TCP
              name: http
          envFrom:
            - configMapRef:
                name: aether-config
            - secretRef:
                name: aether-secrets
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: "2"
              memory: 2Gi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          startupProbe:
            httpGet:
              path: /health/startup
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 30
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 0
            periodSeconds: 15
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 0
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: aether-backend
```

### 4.5 Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aether-frontend
  namespace: aether
  labels:
    app.kubernetes.io/name: aether-frontend
    app.kubernetes.io/component: ui
spec:
  replicas: 2
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: aether-frontend
  template:
    metadata:
      labels:
        app.kubernetes.io/name: aether-frontend
        app.kubernetes.io/component: ui
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101
        runAsGroup: 101
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: frontend
          image: aetherprod.azurecr.io/aether-frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
              protocol: TCP
              name: http
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
          livenessProbe:
            httpGet:
              path: /health
              port: http
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: http
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
```

### 4.6 Services

```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: aether-backend
  namespace: aether
  labels:
    app.kubernetes.io/name: aether-backend
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/name: aether-backend
---
apiVersion: v1
kind: Service
metadata:
  name: aether-frontend
  namespace: aether
  labels:
    app.kubernetes.io/name: aether-frontend
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/name: aether-frontend
```

### 4.7 Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aether-ingress
  namespace: aether
  labels:
    app.kubernetes.io/name: aether
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    nginx.ingress.kubernetes.io/rate-limit-connections: "100"
    nginx.ingress.kubernetes.io/rate-limit-rps: "50"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - aether.example.com
      secretName: aether-tls-cert
  rules:
    - host: aether.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: aether-backend
                port:
                  number: 8000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: aether-frontend
                port:
                  number: 80
```

### 4.8 Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aether-backend-hpa
  namespace: aether
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aether-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aether-frontend-hpa
  namespace: aether
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aether-frontend
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 4.9 Pod Disruption Budget

```yaml
# k8s/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: aether-backend-pdb
  namespace: aether
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: aether-backend
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: aether-frontend-pdb
  namespace: aether
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: aether-frontend
```

### 4.10 Network Policy

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: aether-backend-netpol
  namespace: aether
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: aether-backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: aether-frontend
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8000
  egress:
    - to: []   # Allow all egress (DB, Redis, Azure services)
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: aether-default-deny
  namespace: aether
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress: []
```

---

## 5. Terraform Infrastructure

### 5.1 providers.tf

```hcl
# terraform/providers.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-aether-tfstate"
    storage_account_name = "aethertfstate"
    container_name       = "tfstate"
    key                  = "aether.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

provider "azuread" {}
```

### 5.2 variables.tf

```hcl
# terraform/variables.tf
variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "aether"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for resource deployment"
  type        = string
  default     = "eastus2"
}

variable "aks_node_count" {
  description = "Default node count for system pool"
  type        = number
  default     = 3
}

variable "aks_app_node_count" {
  description = "Default node count for application pool"
  type        = number
  default     = 3
}

variable "aks_app_max_count" {
  description = "Max node count for application pool autoscaler"
  type        = number
  default     = 10
}

variable "postgres_sku" {
  description = "PostgreSQL Flexible Server SKU"
  type        = string
  default     = "GP_Standard_D4ds_v4"
}

variable "postgres_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 131072
}

variable "redis_sku" {
  description = "Redis Cache SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "redis_capacity" {
  description = "Redis Cache capacity (family-dependent)"
  type        = number
  default     = 2
}

variable "admin_group_object_id" {
  description = "Azure AD group Object ID for AKS admin access"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "aether"
    managed_by  = "terraform"
  }
}
```

### 5.3 main.tf

```hcl
# terraform/main.tf
locals {
  prefix = "${var.project_name}-${var.environment}"
  tags   = merge(var.tags, { environment = var.environment })
}

# ─── Resource Group ───
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.tags
}

# ─── Virtual Network ───
resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "aks" {
  name                 = "snet-aks"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/20"]
}

resource "azurerm_subnet" "postgres" {
  name                 = "snet-postgres"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.16.0/24"]
  service_endpoints    = ["Microsoft.Storage"]

  delegation {
    name = "postgres-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "redis" {
  name                 = "snet-redis"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.17.0/24"]
}

resource "azurerm_subnet" "endpoints" {
  name                 = "snet-endpoints"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.18.0/24"]
}

# ─── NSG for AKS subnet ───
resource "azurerm_network_security_group" "aks" {
  name                = "nsg-aks-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "aks" {
  subnet_id                 = azurerm_subnet.aks.id
  network_security_group_id = azurerm_network_security_group.aks.id
}

# ─── Log Analytics Workspace ───
resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90
  tags                = local.tags
}

# ─── AKS Cluster ───
resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = local.prefix
  kubernetes_version  = "1.28"
  sku_tier            = "Standard"
  tags                = local.tags

  default_node_pool {
    name                = "system"
    node_count          = var.aks_node_count
    vm_size             = "Standard_D4s_v5"
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"
    vnet_subnet_id      = azurerm_subnet.aks.id
    max_pods            = 50
    type                = "VirtualMachineScaleSets"
    zones               = ["1", "2", "3"]
    only_critical_addons_enabled = true

    node_labels = {
      "nodepool-type" = "system"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    admin_group_object_ids = [var.admin_group_object_id]
    azure_rbac_enabled     = true
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  auto_scaler_profile {
    balance_similar_node_groups = true
    scale_down_delay_after_add  = "10m"
    scale_down_unneeded         = "10m"
  }
}

# ─── AKS Application Node Pool ───
resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "app"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v5"
  node_count            = var.aks_app_node_count
  min_count             = var.aks_app_node_count
  max_count             = var.aks_app_max_count
  enable_auto_scaling   = true
  os_disk_size_gb       = 256
  os_disk_type          = "Managed"
  vnet_subnet_id        = azurerm_subnet.aks.id
  max_pods              = 100
  zones                 = ["1", "2", "3"]
  tags                  = local.tags

  node_labels = {
    "nodepool-type" = "application"
    "workload"      = "aether"
  }

  node_taints = []
}

# ─── PostgreSQL Flexible Server ───
resource "random_password" "postgres" {
  length  = 32
  special = true
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${local.prefix}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "vnet-link-postgres"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
  resource_group_name   = azurerm_resource_group.main.name
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${local.prefix}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  delegated_subnet_id    = azurerm_subnet.postgres.id
  private_dns_zone_id    = azurerm_private_dns_zone.postgres.id
  administrator_login    = "aether_admin"
  administrator_password = random_password.postgres.result
  zone                   = "1"
  storage_mb             = var.postgres_storage_mb
  sku_name               = var.postgres_sku
  tags                   = local.tags

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "aether" {
  name      = "aether"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "aks" {
  name             = "allow-aks-subnet"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "10.0.0.0"
  end_ip_address   = "10.0.15.255"
}

# ─── Redis Cache ───
resource "azurerm_redis_cache" "main" {
  name                = "redis-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_sku == "Premium" ? "P" : "C"
  sku_name            = var.redis_sku
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  tags                = local.tags

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }
}

resource "azurerm_redis_firewall_rule" "aks" {
  name                = "allow-aks"
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = azurerm_resource_group.main.name
  start_ip            = "10.0.0.0"
  end_ip              = "10.0.15.255"
}

# ─── Key Vault ───
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "kv-${local.prefix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true
  tags                       = local.tags

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id

    secret_permissions = ["Get", "List"]
  }
}

resource "azurerm_key_vault_secret" "db_connection" {
  name         = "database-url"
  value        = "postgresql+asyncpg://aether_admin:${random_password.postgres.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/aether?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-url"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}/0"
  key_vault_id = azurerm_key_vault.main.id
}

# ─── Event Hub ───
resource "azurerm_eventhub_namespace" "main" {
  name                = "evhns-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  capacity            = 2
  tags                = local.tags
}

resource "azurerm_eventhub" "agent_events" {
  name                = "agent-events"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 4
  message_retention   = 7
}

resource "azurerm_eventhub" "workflow_events" {
  name                = "workflow-events"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 4
  message_retention   = 7
}

resource "azurerm_eventhub" "audit_events" {
  name                = "audit-events"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 2
  message_retention   = 30
}

resource "azurerm_eventhub_consumer_group" "backend" {
  name                = "aether-backend"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.agent_events.name
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_eventhub_authorization_rule" "backend" {
  name                = "aether-backend-rule"
  namespace_name      = azurerm_eventhub_namespace.main.name
  eventhub_name       = azurerm_eventhub.agent_events.name
  resource_group_name = azurerm_resource_group.main.name
  listen              = true
  send                = true
  manage              = false
}

# ─── Azure Container Registry ───
resource "azurerm_container_registry" "main" {
  name                = replace("acr${local.prefix}", "-", "")
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Premium"
  admin_enabled       = false
  tags                = local.tags
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

# ─── Azure Monitor ───
resource "azurerm_application_insights" "main" {
  name                = "appi-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.tags
}

resource "azurerm_monitor_action_group" "critical" {
  name                = "ag-critical-${local.prefix}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "AetherCrit"
  tags                = local.tags

  email_receiver {
    name          = "platform-oncall"
    email_address = "oncall@aether.example.com"
  }
}

resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "alert-aks-high-cpu"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = local.tags

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }
}

resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "diag-aks-${local.prefix}"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "kube-apiserver"
  }
  enabled_log {
    category = "kube-controller-manager"
  }
  enabled_log {
    category = "kube-scheduler"
  }
  enabled_log {
    category = "kube-audit-admin"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# ─── Private Endpoints ───
resource "azurerm_private_endpoint" "redis" {
  name                = "pe-redis-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.endpoints.id
  tags                = local.tags

  private_service_connection {
    name                           = "psc-redis"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }
}
```

### 5.4 outputs.tf

```hcl
# terraform/outputs.tf
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "aks_kube_config" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_admin_password" {
  value     = random_password.postgres.result
  sensitive = true
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "redis_primary_key" {
  value     = azurerm_redis_cache.main.primary_access_key
  sensitive = true
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "eventhub_namespace" {
  value = azurerm_eventhub_namespace.main.name
}

output "app_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.main.id
}
```

---

## 6. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yaml
name: AETHER Platform CI/CD

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

env:
  ACR_REGISTRY: aetherprod.azurecr.io
  AKS_CLUSTER_PROD: aks-aether-prod
  AKS_CLUSTER_STAGING: aks-aether-staging
  RESOURCE_GROUP_PROD: rg-aether-prod
  RESOURCE_GROUP_STAGING: rg-aether-staging

permissions:
  contents: read
  id-token: write
  security-events: write

jobs:
  # ────────────────────────────────────────────
  # Job 1: Test
  # ────────────────────────────────────────────
  test:
    name: Test & Validate
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: aether_test
          POSTGRES_USER: aether
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U aether"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # ── Frontend ──
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: npm ci
        working-directory: frontend

      - name: Lint frontend
        run: npm run lint
        working-directory: frontend

      - name: Run frontend unit tests
        run: npm run test -- --coverage --watchAll=false
        working-directory: frontend

      # ── Backend ──
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install backend dependencies
        run: |
          pip install poetry==1.8.3
          poetry install --with dev,test
        working-directory: backend

      - name: Lint backend
        run: |
          poetry run ruff check .
          poetry run ruff format --check .
          poetry run mypy aether/
        working-directory: backend

      - name: Run backend unit tests
        run: poetry run pytest tests/unit -v --cov=aether --cov-report=xml
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://aether:testpass@localhost:5432/aether_test
          REDIS_URL: redis://localhost:6379/0
          ENVIRONMENT: test

      - name: Run integration tests
        run: poetry run pytest tests/integration -v --timeout=120
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://aether:testpass@localhost:5432/aether_test
          REDIS_URL: redis://localhost:6379/0
          ENVIRONMENT: test

      - name: Security scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          severity: "CRITICAL,HIGH"
          exit-code: "1"

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml
          flags: backend
          fail_ci_if_error: false

  # ────────────────────────────────────────────
  # Job 2: Build
  # ────────────────────────────────────────────
  build:
    name: Build & Push Images
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Login to ACR
        run: az acr login --name ${{ env.ACR_REGISTRY }}

      - name: Generate image metadata
        id: meta
        run: |
          SHA_SHORT=$(echo ${{ github.sha }} | cut -c1-7)
          TIMESTAMP=$(date +%Y%m%d%H%M%S)
          VERSION="${TIMESTAMP}-${SHA_SHORT}"
          echo "version=${VERSION}" >> $GITHUB_OUTPUT
          echo "sha_short=${SHA_SHORT}" >> $GITHUB_OUTPUT

      - name: Build & push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ env.ACR_REGISTRY }}/aether-backend:${{ steps.meta.outputs.version }}
            ${{ env.ACR_REGISTRY }}/aether-backend:${{ github.ref_name }}-latest

      - name: Build & push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ env.ACR_REGISTRY }}/aether-frontend:${{ steps.meta.outputs.version }}
            ${{ env.ACR_REGISTRY }}/aether-frontend:${{ github.ref_name }}-latest
          build-args: |
            VITE_APP_VERSION=${{ steps.meta.outputs.version }}

      - name: Scan images for vulnerabilities
        run: |
          az acr run --registry ${{ env.ACR_REGISTRY }} --cmd "trivy image ${{ env.ACR_REGISTRY }}/aether-backend:${{ steps.meta.outputs.version }} --severity HIGH,CRITICAL --exit-code 0" /dev/null
          az acr run --registry ${{ env.ACR_REGISTRY }} --cmd "trivy image ${{ env.ACR_REGISTRY }}/aether-frontend:${{ steps.meta.outputs.version }} --severity HIGH,CRITICAL --exit-code 0" /dev/null

  # ────────────────────────────────────────────
  # Job 3: Deploy Staging
  # ────────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.aether.example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get AKS credentials
        run: az aks get-credentials --resource-group ${{ env.RESOURCE_GROUP_STAGING }} --name ${{ env.AKS_CLUSTER_STAGING }}

      - name: Deploy to staging
        run: |
          IMAGE_TAG=${{ needs.build.outputs.image_tag }}
          kubectl set image deployment/aether-backend backend=${{ env.ACR_REGISTRY }}/aether-backend:${IMAGE_TAG} -n aether
          kubectl set image deployment/aether-frontend frontend=${{ env.ACR_REGISTRY }}/aether-frontend:${IMAGE_TAG} -n aether
          kubectl rollout status deployment/aether-backend -n aether --timeout=300s
          kubectl rollout status deployment/aether-frontend -n aether --timeout=300s

      - name: Run smoke tests
        run: |
          STAGING_URL="https://staging.aether.example.com"
          echo "Running smoke tests against ${STAGING_URL}"
          curl -sf "${STAGING_URL}/api/health/ready" || exit 1
          curl -sf "${STAGING_URL}/" | grep -q "AETHER" || exit 1
          echo "Smoke tests passed"

  # ────────────────────────────────────────────
  # Job 4: Deploy Production
  # ────────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://aether.example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get AKS credentials
        run: az aks get-credentials --resource-group ${{ env.RESOURCE_GROUP_PROD }} --name ${{ env.AKS_CLUSTER_PROD }}

      - name: Blue-green deploy
        run: |
          IMAGE_TAG=${{ needs.build.outputs.image_tag }}

          # Deploy new version to green slots
          kubectl set image deployment/aether-backend backend=${{ env.ACR_REGISTRY }}/aether-backend:${IMAGE_TAG} -n aether
          kubectl set image deployment/aether-frontend frontend=${{ env.ACR_REGISTRY }}/aether-frontend:${IMAGE_TAG} -n aether

          # Wait for rollout
          kubectl rollout status deployment/aether-backend -n aether --timeout=600s
          kubectl rollout status deployment/aether-frontend -n aether --timeout=300s

      - name: Production smoke tests
        id: smoke
        run: |
          PROD_URL="https://aether.example.com"
          echo "Running production smoke tests..."

          # Health checks
          curl -sf "${PROD_URL}/api/health/ready" || exit 1
          curl -sf "${PROD_URL}/api/health/live" || exit 1

          # UI availability
          curl -sf "${PROD_URL}/" | grep -q "AETHER" || exit 1

          # API response check
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/api/health")
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "API health check failed with HTTP ${HTTP_CODE}"
            exit 1
          fi

          echo "All production smoke tests passed"

      - name: Rollback on failure
        if: failure() && steps.smoke.outcome == 'failure'
        run: |
          echo "Smoke tests failed — rolling back..."
          kubectl rollout undo deployment/aether-backend -n aether
          kubectl rollout undo deployment/aether-frontend -n aether
          kubectl rollout status deployment/aether-backend -n aether --timeout=300s
          kubectl rollout status deployment/aether-frontend -n aether --timeout=300s
          echo "Rollback completed"
          exit 1
```

---

## 7. Environment Variables Reference

### Application

| Variable          | Description                        | Required | Default       | Example                         |
|-------------------|------------------------------------|----------|---------------|---------------------------------|
| `APP_NAME`        | Application name identifier        | No       | aether-platform | `aether-platform`             |
| `ENVIRONMENT`     | Runtime environment                | Yes      | development   | `production`                    |
| `DEBUG`           | Enable debug mode                  | No       | `false`       | `true`                          |
| `LOG_LEVEL`       | Logging verbosity                  | No       | `info`        | `debug`, `warning`, `error`     |
| `SECRET_KEY`      | Application secret key             | Yes      | —             | `a3f8c9...` (64 chars)          |
| `ALLOWED_HOSTS`   | Comma-separated allowed hostnames  | Yes      | —             | `aether.example.com`            |
| `CORS_ORIGINS`    | Comma-separated CORS origins       | Yes      | —             | `https://aether.example.com`    |

### Database

| Variable                 | Description                  | Required | Default | Example                                       |
|--------------------------|------------------------------|----------|---------|-----------------------------------------------|
| `DATABASE_URL`           | PostgreSQL connection string | Yes      | —       | `postgresql+asyncpg://user:pass@host:5432/db` |
| `DATABASE_POOL_SIZE`     | Connection pool size         | No       | `20`    | `30`                                          |
| `DATABASE_MAX_OVERFLOW`  | Max overflow connections     | No       | `10`    | `20`                                          |
| `DATABASE_POOL_TIMEOUT`  | Pool timeout (seconds)       | No       | `30`    | `60`                                          |

### Redis

| Variable               | Description               | Required | Default | Example                      |
|------------------------|---------------------------|----------|---------|------------------------------|
| `REDIS_URL`            | Redis connection string   | Yes      | —       | `redis://redis:6379/0`       |
| `REDIS_MAX_CONNECTIONS`| Max Redis connections     | No       | `50`    | `100`                        |

### Authentication

| Variable                          | Description                    | Required | Default | Example                |
|-----------------------------------|--------------------------------|----------|---------|------------------------|
| `JWT_SECRET_KEY`                  | JWT signing key                | Yes      | —       | `b7d2a1...` (64 chars) |
| `JWT_ALGORITHM`                   | JWT algorithm                  | No       | `HS256` | `RS256`                |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (minutes)     | No       | `30`    | `60`                   |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token TTL (days)       | No       | `7`     | `30`                   |
| `AZURE_AD_TENANT_ID`             | Azure AD tenant ID             | Yes*     | —       | `xxxxxxxx-xxxx-...`    |
| `AZURE_AD_CLIENT_ID`             | Azure AD app client ID         | Yes*     | —       | `xxxxxxxx-xxxx-...`    |
| `AZURE_AD_CLIENT_SECRET`         | Azure AD app client secret     | Yes*     | —       | `xxxxxxxx`             |

### Azure Services

| Variable                       | Description              | Required | Default | Example                        |
|--------------------------------|--------------------------|----------|---------|--------------------------------|
| `AZURE_SUBSCRIPTION_ID`       | Azure subscription ID    | Yes      | —       | `xxxxxxxx-xxxx-...`            |
| `AZURE_RESOURCE_GROUP`        | Azure resource group     | Yes      | —       | `rg-aether-prod`               |
| `AZURE_STORAGE_ACCOUNT_NAME`  | Blob storage account     | Yes      | —       | `aetherstorageprod`            |
| `AZURE_STORAGE_ACCOUNT_KEY`   | Blob storage key         | Yes      | —       | `xxxx==`                       |
| `AZURE_KEY_VAULT_URL`         | Key Vault URL            | Yes      | —       | `https://kv-aether.vault.net`  |

### Event Hub

| Variable                          | Description                 | Required | Default          | Example               |
|-----------------------------------|-----------------------------|----------|------------------|------------------------|
| `EVENTHUB_NAMESPACE`             | Event Hub namespace          | Yes      | —                | `aether-events-prod`   |
| `EVENTHUB_CONNECTION_STRING`     | Namespace connection string  | Yes      | —                | `Endpoint=sb://...`    |
| `EVENTHUB_AGENT_EVENTS_HUB`     | Agent events hub name        | No       | `agent-events`   | `agent-events`         |
| `EVENTHUB_WORKFLOW_EVENTS_HUB`  | Workflow events hub name     | No       | `workflow-events`| `workflow-events`      |
| `EVENTHUB_AUDIT_EVENTS_HUB`     | Audit events hub name        | No       | `audit-events`   | `audit-events`         |

### Monitoring

| Variable                               | Description                     | Required | Default         | Example                     |
|----------------------------------------|---------------------------------|----------|-----------------|-----------------------------|
| `APPLICATIONINSIGHTS_CONNECTION_STRING`| App Insights connection string  | Yes      | —               | `InstrumentationKey=...`    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`         | OpenTelemetry collector URL     | No       | —               | `http://otel:4317`          |
| `OTEL_SERVICE_NAME`                    | Service name for tracing        | No       | `aether-backend`| `aether-backend`            |

### Feature Flags

| Variable                     | Description                    | Required | Default | Example |
|------------------------------|--------------------------------|----------|---------|---------|
| `FEATURE_AI_AGENTS`         | Enable AI agent features        | No       | `true`  | `true`  |
| `FEATURE_WORKFLOW_ENGINE`   | Enable workflow engine          | No       | `true`  | `true`  |
| `FEATURE_ADVANCED_ANALYTICS`| Enable advanced analytics       | No       | `false` | `true`  |
| `FEATURE_MULTI_TENANT`      | Enable multi-tenancy            | No       | `false` | `true`  |

---

## 8. Health Check Endpoints

### GET `/health/live`

Liveness probe — confirms the process is running.

```json
// 200 OK
{
  "status": "alive",
  "timestamp": "2026-06-15T15:30:00Z"
}
```

### GET `/health/ready`

Readiness probe — confirms all dependencies are reachable.

```json
// 200 OK
{
  "status": "ready",
  "timestamp": "2026-06-15T15:30:00Z",
  "checks": {
    "database": { "status": "up", "latency_ms": 2.4 },
    "redis": { "status": "up", "latency_ms": 0.8 },
    "event_hub": { "status": "up", "latency_ms": 12.1 }
  }
}

// 503 Service Unavailable
{
  "status": "not_ready",
  "timestamp": "2026-06-15T15:30:00Z",
  "checks": {
    "database": { "status": "down", "error": "connection refused" },
    "redis": { "status": "up", "latency_ms": 0.8 },
    "event_hub": { "status": "up", "latency_ms": 12.1 }
  }
}
```

### GET `/health/startup`

Startup probe — confirms initial bootstrap is complete (migrations, cache warm-up).

```json
// 200 OK
{
  "status": "started",
  "timestamp": "2026-06-15T15:30:00Z",
  "version": "2.0.0",
  "uptime_seconds": 45.2
}
```

### GET `/health`

Comprehensive health report combining all checks.

```json
// 200 OK
{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production",
  "timestamp": "2026-06-15T15:30:00Z",
  "uptime_seconds": 86400,
  "checks": {
    "database": { "status": "up", "latency_ms": 2.4, "pool_size": 20, "pool_used": 5 },
    "redis": { "status": "up", "latency_ms": 0.8, "connected_clients": 12 },
    "event_hub": { "status": "up", "latency_ms": 12.1 },
    "storage": { "status": "up", "latency_ms": 15.3 }
  }
}
```

---

## 9. Monitoring & Alerting

### 9.1 Azure Monitor & Application Insights

Application Insights is provisioned via Terraform (§5) and auto-collects:
- Request metrics (rate, duration, failures)
- Dependency calls (DB, Redis, HTTP)
- Exceptions and stack traces
- Custom events & metrics

### 9.2 OpenTelemetry Tracing

```python
# backend/aether/telemetry.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import os

def configure_telemetry(app):
    resource = Resource.create({
        "service.name": os.getenv("OTEL_SERVICE_NAME", "aether-backend"),
        "service.version": os.getenv("APP_VERSION", "0.0.0"),
        "deployment.environment": os.getenv("ENVIRONMENT", "development"),
    })

    provider = TracerProvider(resource=resource)

    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        provider.add_span_processor(BatchSpanProcessor(exporter))

    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument()
    RedisInstrumentor().instrument()
```

### 9.3 Custom Metrics

```python
# backend/aether/metrics.py
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider

meter = metrics.get_meter("aether.backend")

agent_tasks_counter = meter.create_counter(
    name="aether.agent.tasks.total",
    description="Total agent tasks processed",
    unit="1",
)

agent_task_duration = meter.create_histogram(
    name="aether.agent.task.duration",
    description="Agent task processing duration",
    unit="ms",
)

workflow_executions = meter.create_counter(
    name="aether.workflow.executions.total",
    description="Total workflow executions",
    unit="1",
)

active_connections = meter.create_up_down_counter(
    name="aether.connections.active",
    description="Currently active WebSocket connections",
    unit="1",
)
```

### 9.4 Alert Rules

| Alert                     | Condition                        | Severity | Window  | Action           |
|---------------------------|----------------------------------|----------|---------|------------------|
| High Error Rate           | Error rate > 5%                  | 1        | 5 min   | Page on-call      |
| High Latency              | P95 latency > 2s                 | 2        | 10 min  | Notify Slack      |
| Pod Restart Storm          | Pod restarts > 3 in 15 min       | 1        | 15 min  | Page on-call      |
| DB Pool Exhaustion         | Pool utilisation > 90%           | 2        | 5 min   | Notify Slack      |
| Redis Memory Critical      | Memory usage > 80%               | 2        | 5 min   | Notify Slack      |
| Certificate Expiry         | TLS cert expires < 30 days       | 3        | Daily   | Create ticket     |
| Disk Pressure              | Node disk > 85%                  | 2        | 5 min   | Page on-call      |
| Deployment Failed          | Rollout not progressing          | 1        | 10 min  | Page on-call      |

### 9.5 Log Aggregation

All container logs flow to Azure Log Analytics via the OMS Agent. Use KQL to query:

```kql
// Error spike detection
ContainerLog
| where LogEntry contains "ERROR"
| where TimeGenerated > ago(1h)
| summarize ErrorCount = count() by bin(TimeGenerated, 5m), ContainerName
| order by TimeGenerated desc

// Slow API requests
AppRequests
| where DurationMs > 2000
| project TimeGenerated, Name, DurationMs, ResultCode
| order by DurationMs desc
| take 50
```

---

## 10. Backup & Disaster Recovery

### 10.1 PostgreSQL Backups

| Feature                  | Configuration                  |
|--------------------------|--------------------------------|
| Retention Period          | 35 days                        |
| Point-in-Time Recovery   | Enabled (any point in 35 days) |
| Geo-Redundant Backup     | Enabled                        |
| Backup Frequency          | Continuous WAL archiving       |

**Restore to a point in time:**

```bash
az postgres flexible-server restore \
  --resource-group rg-aether-prod \
  --name psql-aether-prod-restored \
  --source-server psql-aether-prod \
  --restore-time "2026-06-14T10:00:00Z"
```

### 10.2 Redis Persistence

| Feature      | Configuration                       |
|--------------|-------------------------------------|
| AOF          | Enabled (appendonly yes)            |
| RDB Snapshot | Every 60s if ≥ 1000 keys changed   |
| Export       | Weekly export to Azure Blob Storage |

```bash
# Export Redis data
az redis export \
  --resource-group rg-aether-prod \
  --name redis-aether-prod \
  --prefix aether-redis-backup \
  --container "https://aetherstorageprod.blob.core.windows.net/backups" \
  --file-format rdb
```

### 10.3 AKS Backup (Velero)

```bash
# Install Velero
velero install \
  --provider azure \
  --plugins velero/velero-plugin-for-microsoft-azure:v1.9.0 \
  --bucket aether-velero-backups \
  --secret-file ./velero-credentials \
  --backup-location-config resourceGroup=rg-aether-prod,storageAccount=aetherstorageprod \
  --snapshot-location-config resourceGroup=rg-aether-prod

# Schedule daily backup
velero schedule create aether-daily \
  --schedule="0 2 * * *" \
  --include-namespaces aether \
  --ttl 720h

# Restore from backup
velero restore create --from-backup aether-daily-20260615020000
```

### 10.4 RTO / RPO Targets

| Tier                | RTO          | RPO          |
|---------------------|--------------|--------------|
| Compute (AKS)       | 15 minutes   | 0 (stateless)|
| Database (PostgreSQL)| 1 hour       | 5 minutes    |
| Cache (Redis)        | 30 minutes   | 1 hour       |
| Overall Platform     | 1 hour       | 5 minutes    |

### 10.5 Disaster Recovery Runbook

1. **Detect** — Azure Monitor alerts trigger PagerDuty incident.
2. **Assess** — Determine scope (single service vs. region-wide).
3. **Communicate** — Update status page; notify stakeholders.
4. **Recover Compute** — Re-deploy AKS workloads from CI/CD or Velero.
5. **Recover Data** — Restore PostgreSQL from geo-redundant backup / PITR.
6. **Recover Cache** — Redis auto-recovers from AOF; import RDB if needed.
7. **Validate** — Run full smoke test suite against recovered environment.
8. **DNS Failover** — Update Azure Traffic Manager to point to recovered region.
9. **Post-Mortem** — Conduct blameless post-incident review within 48 hours.

---

## 11. Security Hardening

### 11.1 Network Policies

- Default deny-all ingress in the `aether` namespace (see §4.10).
- Explicit allow rules only for required traffic paths.
- Azure NSGs restrict traffic at the subnet level.

### 11.2 Pod Security

```yaml
# All pods enforce:
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  seccompProfile:
    type: RuntimeDefault
  capabilities:
    drop:
      - ALL
```

### 11.3 Secret Rotation

| Secret Type          | Rotation Schedule | Method                         |
|----------------------|-------------------|--------------------------------|
| Database Password    | 90 days           | Azure Key Vault auto-rotation  |
| JWT Secret Key       | 180 days          | Manual rotation with overlap   |
| Azure AD Credentials | 365 days          | Azure AD automatic             |
| Redis Access Key     | 90 days           | Azure Key Vault auto-rotation  |
| TLS Certificates     | 60 days           | cert-manager auto-renewal      |

### 11.4 Image Scanning

```yaml
# Trivy scan in CI (see §6)
# Additionally, enable Azure Defender for Containers:
az security pricing create \
  --name Containers \
  --tier Standard
```

- All images scanned for CVEs before push to ACR.
- ACR Quarantine policy blocks images with CRITICAL vulnerabilities.
- Runtime scanning enabled via Microsoft Defender for Containers.

### 11.5 RBAC

```yaml
# k8s/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: aether-backend-role
  namespace: aether
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: aether-backend-binding
  namespace: aether
subjects:
  - kind: ServiceAccount
    name: aether-backend-sa
    namespace: aether
roleRef:
  kind: Role
  name: aether-backend-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aether-backend-sa
  namespace: aether
  annotations:
    azure.workload.identity/client-id: "<managed-identity-client-id>"
```

### 11.6 TLS Everywhere

- **Ingress → Client**: TLS 1.2+ via cert-manager + Let's Encrypt.
- **Ingress → Backend**: Encrypted in-cluster via mTLS (Istio/Linkerd optional).
- **Backend → PostgreSQL**: `sslmode=require` enforced in connection string.
- **Backend → Redis**: TLS-only (`rediss://` scheme), non-SSL port disabled.
- **Backend → Event Hub**: AMQPS (TLS) enforced by Azure.

### 11.7 Web Application Firewall (WAF)

```bash
# Deploy Azure Front Door with WAF policy
az network front-door waf-policy create \
  --resource-group rg-aether-prod \
  --name waf-aether-prod \
  --mode Prevention \
  --sku Premium_AzureFrontDoor

# Enable OWASP managed rule set
az network front-door waf-policy managed-rules add \
  --policy-name waf-aether-prod \
  --resource-group rg-aether-prod \
  --type Microsoft_DefaultRuleSet \
  --version 2.1 \
  --action Block

# Rate limiting rule
az network front-door waf-policy custom-rule create \
  --policy-name waf-aether-prod \
  --resource-group rg-aether-prod \
  --name RateLimitAPI \
  --priority 100 \
  --rule-type RateLimitRule \
  --rate-limit-duration-in-minutes 1 \
  --rate-limit-threshold 1000 \
  --action Block \
  --defer
```

---

> **Questions?** Reach out to the AETHER Platform Engineering team at [platform-eng@aether.example.com](mailto:platform-eng@aether.example.com).
