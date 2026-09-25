# CourseHunt Production Hosting & Infrastructure Deployment Guide

This document is the definitive operational playbook for deploying, hardening, scaling, and managing the **CourseHunt Enterprise LMS** platform. It provides actionable architectures for both **Single-Node VPS deployments** and **Distributed Multi-Server / Multi-Cloud architectures**, along with scaling patterns to handle high-throughput workloads (up to millions of requests per second).

---

## Table of Contents
1. [Architecture & Topology Overview](#1-architecture--topology-overview)
2. [Pre-Hosting Production Checklist](#2-pre-hosting-production-checklist)
3. [Single-VPS Deployment: Step-by-Step Guide](#3-single-vps-deployment-step-by-step-guide)
4. [How to Host Perfectly (Hardening & Reliability)](#4-how-to-host-perfectly-hardening--reliability)
5. [Scaling Up & Scaling Down (Capacity Management)](#5-scaling-up--scaling-down-capacity-management)
6. [Distributed Architecture: Hosting Services in Different Places](#6-distributed-architecture-hosting-services-in-different-places)
7. [Handling Millions of Requests / Second (Ultra-Scale Architecture)](#7-handling-millions-of-requests--second-ultra-scale-architecture)
8. [Disaster Recovery, Backups & Emergency Runbook](#8-disaster-recovery-backups--emergency-runbook)

---

## 1. Architecture & Topology Overview

CourseHunt uses a unified, single-domain path-routed architecture behind a **Traefik Edge Reverse Proxy** terminating automated Let's Encrypt TLS:

```
                                    User Browser / Client
                                              │
                                   https://coursehunt.com
                                              │
                                   ┌──────────▼──────────┐
                                   │  Traefik Edge Proxy │ (Ports 80 -> 443 TLS)
                                   └──────────┬──────────┘
                                              │
            ┌─────────────────────────────────┼─────────────────────────────────┐
            │ PathPrefix(`/api/v1`)           │ PathPrefix(`/storage`,          │ PathPrefix(`/`)
            │ (Priority 100)                  │   `/{bucket}`) (Priority 50)    │ (Priority 1)
            ▼                                 ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
   │ Go Fiber API    │               │ MinIO S3 Store  │               │ Next.js 16 Web  │
   │ (Port 8080)     │               │ (Port 9000)     │               │ (Port 3000)     │
   └────────┬────────┘               └─────────────────┘               │ Incl: /api/auth │
            │                                                          └─────────────────┘
            ├─────────────────────────────────┐
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │  PostgreSQL 16  │               │     Redis 7     │
   │  (Port 5432)    │               │  (Port 6379)    │
   └─────────────────┘               └─────────────────┘
```

### Core Subsystems
- **Traefik Reverse Proxy**: Edge routing, automated SSL/TLS certificates (ACME HTTP-01 challenge), HTTP-to-HTTPS redirect, load balancing.
- **Next.js 16 Frontend**: Server-Side Rendering (SSR), React 19 Client components, Better Auth session authentication & JWKS provider.
- **Go Fiber 2.x Backend**: Zero-allocation high-throughput REST API, course engine, RBAC permission verification, payment capture CTEs, video resume heartbeats.
- **PostgreSQL 16**: ACID transactional ledger, `pg_cron` maintenance engine, and Outbox refund queues with `FOR UPDATE SKIP LOCKED`.
- **Redis 7**: Distributed rate limiting, cache storage with negative caching (`FetchOrNegative`), and session token validation.
- **MinIO S3**: Dual-bucket object storage (private bucket for video streaming with signed byte-range URLs, public bucket for images/thumbnails).
- **Grafana Loki**: Non-blocking asynchronous log aggregation and structured observability engine.

---

## 2. Pre-Hosting Production Checklist

Before running any deployment commands, complete and verify every item in this checklist:

### A. Domain & DNS Records
- [ ] Registered public domain (e.g., `coursehunt.com`).
- [ ] **DNS A Record**: `@` pointing to your server's public IPv4 address.
- [ ] **DNS A Record**: `www` pointing to your server's public IPv4 address (or CNAME to `@`).
- [ ] **DNS AAAA Record**: (Optional) pointing to IPv6 address if enabled.
- [ ] Verified DNS propagation: `dig +short coursehunt.com`.

### B. Security & Cryptographic Secrets
- [ ] Generated 64-character random hex strings:
  ```bash
  openssl rand -hex 32  # For BETTER_AUTH_SECRET
  openssl rand -hex 32  # For JWT_SECRET
  openssl rand -hex 24  # For POSTGRES_PASSWORD
  openssl rand -hex 24  # For REDIS_PASSWORD
  openssl rand -hex 16  # For MINIO_ACCESS_KEY
  openssl rand -hex 32  # For MINIO_SECRET_KEY
  ```
- [ ] Configured `COOKIE_SECURE=true` and `COOKIE_DOMAIN=.coursehunt.com`.

### C. Third-Party Integrations
- [ ] **Razorpay Live**: Obtained Live `Key ID`, Live `Key Secret`, and generated a secure webhook secret.
- [ ] **Google OAuth**: Configured redirect URI in Google Cloud Console: `https://coursehunt.com/api/auth/callback/google`.
- [ ] **Transactional SMTP**: Set up SendGrid, Resend, Amazon SES, or Postmark SMTP credentials.

### D. Host OS Hardening
- [ ] Linux OS updated: Ubuntu 24.04 LTS / Debian 12.
- [ ] Non-root `sudo` user created; password SSH disabled (SSH key-only authentication).
- [ ] Uncomplicated Firewall (UFW) active, allowing only ports `22`, `80`, and `443`.
- [ ] Docker and Docker Compose V2 installed (`docker compose version` $\ge$ v2.20).
- [ ] Swap file allocated (minimum 2 GB – 4 GB) to prevent OOM process killing.

---

## 3. Single-VPS Deployment: Step-by-Step Guide

This setup runs all services securely on a **single VPS instance** inside isolated Docker containers connected via a private bridge network.

### Recommended VPS Specifications
- **Minimum**: 2 vCPU, 4 GB RAM, 60 GB SSD (Testing / Staging).
- **Recommended Production**: 4 vCPU, 8 GB RAM, 160 GB NVMe (e.g., Hetzner CPX31, DigitalOcean 8GB Droplet, AWS t4g.xlarge).

---

### Step 1: Prepare the Host Server

Log in to your VPS as root or sudo user:

```bash
# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Configure UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. Configure a 4GB Swap file (essential for stability)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. Install Docker Engine & Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

---

### Step 2: Clone the Project Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/CourseHunt.git coursehunt
sudo chown -R $USER:$USER /opt/coursehunt
cd /opt/coursehunt
```

---

### Step 3: Configure Environment Variables

Copy the production template into `.env`:

```bash
cp .env.production.example .env
nano .env
```

Set the following critical production variables:

```ini
DOMAIN=coursehunt.com
ACME_EMAIL=admin@coursehunt.com
ENVIRONMENT=production

# URLs
NEXT_PUBLIC_APP_URL=https://coursehunt.com
NEXT_PUBLIC_API_URL=https://coursehunt.com/api
ALLOWED_ORIGINS=https://coursehunt.com
BETTER_AUTH_URL=https://coursehunt.com
COOKIE_DOMAIN=.coursehunt.com
COOKIE_SECURE=true

# Secrets (Paste the random strings generated earlier)
BETTER_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTGRES_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REDIS_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MINIO_ACCESS_KEY=xxxxxxxxxxxxxxxx
MINIO_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database & S3
POSTGRES_USER=coursehunt_prod_user
POSTGRES_DB=coursehunt_prod
DATABASE_URL=postgres://coursehunt_prod_user:YOUR_PG_PASSWORD@postgres:5432/coursehunt_prod?sslmode=disable
DOCKER_DATABASE_URL=postgres://coursehunt_prod_user:YOUR_PG_PASSWORD@postgres:5432/coursehunt_prod?sslmode=disable
MINIO_BUCKET=coursehunt-private
MINIO_PUBLIC_BUCKET=coursehunt-public
MINIO_BASE_URL=https://coursehunt.com/coursehunt-private

# Payment & Email
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM="CourseHunt <no-reply@coursehunt.com>"
```

---

### Step 4: Verify Docker Compose Configuration

Validate that all services, container quotas, and Traefik labels parse cleanly:

```bash
docker compose -f docker-compose.prod.yml config
```

---

### Step 5: Launch the Application

Build and start the complete container stack in detached mode:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

### Step 6: Verify Deployment & Health Checks

Check container statuses:

```bash
docker compose -f docker-compose.prod.yml ps
```

All 7 containers should report `healthy` or `running`:
1. `coursehunt-traefik` (healthy)
2. `coursehunt-web` (healthy)
3. `coursehunt-backend` (healthy)
4. `coursehunt-postgres` (healthy)
5. `coursehunt-redis` (healthy)
6. `coursehunt-minio` (healthy)
7. `coursehunt-loki` (healthy)

Check Traefik logs to confirm TLS certificate generation:

```bash
docker logs -f coursehunt-traefik
```
Look for: `Certificates obtained for domains ["coursehunt.com"]`.

---

## 4. How to Host Perfectly (Hardening & Reliability)

To ensure **99.99% uptime**, implement these essential production maintenance practices:

### 1. Automated Zero-Downtime Rolling Deployments
When releasing new code, run rolling builds so users never experience outages:

```bash
#!/bin/bash
# deploy.sh
set -e
git pull origin main

# Build updated images
docker compose -f docker-compose.prod.yml build web backend

# Run database migrations
docker compose -f docker-compose.prod.yml run --rm migrator

# Recreate web and backend containers without stopping others
docker compose -f docker-compose.prod.yml up -d --no-deps --no-build web backend
docker system prune -f
echo "Deploy completed successfully."
```

### 2. Automated PostgreSQL Daily Backups (Encrypted & Offsite)
Set up a daily cron job to dump the database and sync to an offsite S3 bucket:

```bash
# /etc/cron.daily/coursehunt-backup
#!/bin/bash
BACKUP_DIR="/var/backups/coursehunt"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Dump database from container
docker exec coursehunt-postgres pg_dump -U coursehunt_prod_user coursehunt_prod | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep last 7 days locally
find "$BACKUP_DIR" -type f -mtime +7 -delete

# (Optional) Sync to AWS S3 / Cloudflare R2:
# aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" s3://my-offsite-backups/
```

### 3. Docker Container Log Rotation
Prevent Docker from consuming all disk space with stdout logs by configuring `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```
Restart Docker after editing: `sudo systemctl restart docker`.

---

## 5. Scaling Up & Scaling Down (Capacity Management)

### A. Vertical Scaling (Scaling Up the VPS)
When CPU/Memory consumption consistently exceeds 70%:
1. Resize your VPS hardware (e.g. from 4 vCPU / 8 GB to 8 vCPU / 16 GB).
2. Adjust container memory quotas in [`docker-compose.prod.yml`](file:///home/rahulcodepython/Workspace/CourseHunt/docker-compose.prod.yml):
   - Increase PostgreSQL limits (`memory: 4096M`, `cpus: '4.0'`).
   - Increase Go backend limits (`memory: 1024M`, `cpus: '2.0'`).
3. Tune PostgreSQL memory settings in `infra/postgres/postgresql.conf`:
   - `shared_buffers = 4GB` (25% of total RAM).
   - `effective_cache_size = 12GB` (75% of total RAM).
   - `work_mem = 32MB`.

### B. Horizontal Container Scaling (On Single Node)
Because Traefik automatically discovers and round-robin load-balances multiple replicas of the same service name, you can scale stateless containers on demand:

```bash
# Scale Go backend to 3 instances:
docker compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale Next.js web to 2 instances:
docker compose -f docker-compose.prod.yml up -d --scale web=2
```
Traefik immediately distributes incoming requests across all healthy replica instances.

### C. Downscaling (Cost Optimization)
During low-traffic periods (or non-peak seasons):
- Reduce container replicas back to 1:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --scale backend=1 --scale web=1
  ```
- Remove build cache: `docker builder prune -a -f`.

---

## 6. Distributed Architecture: Hosting Services in Different Places

When traffic outgrows a single server (typically $>50,000$ daily active users), decouple each service into specialized managed infrastructure:

```
                            GLOBAL EDGE (Cloudflare / Fastly CDN)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [ Web Frontend Tier ]                           [ API Gateway / Load Balancer ]
      • AWS ECS / Vercel / K8s                        • AWS ALB / Traefik Cluster
      • Next.js 16 Nodes                              • Multi-AZ Go Fiber Replicas
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                             [ High-Speed Private VPC ]
                                          │
     ┌────────────────────────┬───────────┴───────────┬────────────────────────┐
     ▼                        ▼                       ▼                        ▼
[ Managed Database ]   [ In-Memory Cache ]   [ Cloud Object Store ]   [ Managed Logging ]
• AWS RDS Aurora PG    • AWS ElastiCache     • AWS S3 / Cloudflare R2 • Grafana Cloud /
• Read Replicas        • Redis Cluster Mode  • CloudFront CDN         • Datadog APM
```

### Migration Roadmap: Single VPS $\longrightarrow$ Distributed Tiers

| Service Tier | Single VPS Location | Distributed Cloud Destination | Migration Action Required |
| :--- | :--- | :--- | :--- |
| **Edge & TLS** | Traefik container | **Cloudflare / AWS ALB** | Route DNS to Cloudflare with Full (Strict) SSL; offload DDoS protection and asset caching to edge. |
| **Web Frontend** | `coursehunt-web` | **AWS ECS Fargate / Vercel** | Set `NEXT_PUBLIC_API_URL=https://coursehunt.com/api` and `JWKS_URL=https://coursehunt.com/api/auth/jwks`. |
| **Backend API** | `coursehunt-backend`| **AWS ECS / DigitalOcean K8s** | Scale stateless Go Fiber containers horizontally (auto-scale from 2 to 20 containers on CPU $>70\%$). |
| **Database** | `coursehunt-postgres` | **AWS RDS PostgreSQL 16** | Migrate data using `pg_dump` / `pg_restore`. Enable Multi-AZ failover and 1–3 Read Replicas. |
| **Cache / Rates** | `coursehunt-redis` | **AWS ElastiCache Redis** | Change `REDIS_HOST` to AWS ElastiCache cluster endpoint with automatic failover. |
| **Media / Video** | `coursehunt-minio` | **AWS S3 + CloudFront CDN** | Migrate files using MinIO Client (`mc mirror`). Configure CloudFront distribution for signed video URLs. |
| **Logs & APM** | `coursehunt-loki` | **Grafana Cloud Loki** | Change `LOKI_URL` to Grafana Cloud ingestion endpoint with API token. |

---

## 7. Handling Millions of Requests / Second (Ultra-Scale Architecture)

Serving millions of requests per second ($>1,000,000\text{ RPS}$) requires architectural offloading at every layer so that the database and origin servers only process essential mutations:

```
Millions of HTTP Requests
          │
          ▼
┌───────────────────────────────────┐
│ 1. Anycast Global Edge CDN        │ ──> Serves 95% of traffic: Static assets, course catalog,
│    (Cloudflare / Fastly)          │     landing pages, cached certificates directly from edge.
└─────────────────┬─────────────────┘
                  │ (5% Cache Misses & Dynamic Requests)
                  ▼
┌───────────────────────────────────┐
│ 2. Layer 7 Dynamic Token Limiter  │ ──> Absorbs volumetric attacks; throttles suspicious IPs
│    (Fiber Redis Rate Limiter)     │     using Redis distributed token bucket algorithms.
└─────────────────┬─────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│ 3. Go Fiber Zero-Allocation API   │ ──> 15,000+ RPS per container. Evaluates Negative Cache
│    (Universal Negative Cache)     │     sentinels in Redis memory in <1ms without DB query.
└─────────────────┬─────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│ 4. Read/Write Split Connection    │ ──> PgBouncer pools 50,000+ connections into 50 physical
│    Pooler (PgBouncer + Aurora PG) │     DB connections. Directs SELECTs to Read Replicas.
└───────────────────────────────────┘
```

### The 6 Architectural Pillars for Ultra-Scale:

#### 1. Edge-Level Caching (Cloudflare / Fastly)
- Static Next.js assets (`/_next/static/*`, `/images/*`, `/fonts/*`) are cached at 300+ edge locations with `Cache-Control: public, max-age=31536000, immutable`.
- Public course catalog and category endpoints (`/api/v1/courses`, `/api/v1/categories`) use Cloudflare Cache Rules with `stale-while-revalidate=86400`.
- **Result**: Over **95% of user requests never reach your origin servers**.

#### 2. Universal Negative Caching (`FetchOrNegative`)
- As implemented in Phase 3, queries for non-existent IDs, expired coupons, or missing slugs are cached in Redis as `__REDIS_NULL_SENTINEL__` for 60 seconds.
- **Result**: Bot scraping and cache-penetration attacks resolve directly in Redis memory in $<1\text{ms}$ at **15,000+ RPS**, completely protecting PostgreSQL from index scanning.

#### 3. Presigned Byte-Range Video Streaming (Direct S3 / CDN)
- Course video files (`.mp4`, `.webm`) are **never proxied through Go or Node.js application memory**.
- The Go server merely signs a short-lived URL with `response-content-disposition: inline`.
- The browser streams byte ranges (`206 Partial Content`) directly from AWS S3 or Cloudflare R2 through CloudFront edge nodes.
- **Result**: Streaming 100,000 concurrent 4K videos consumes **zero CPU and zero bandwidth on your application servers**.

#### 4. PostgreSQL Connection Pooling with PgBouncer
- Direct connections to PostgreSQL consume ~10 MB RAM per connection. Having 5,000 direct connections would exhaust 50 GB of RAM.
- Deploy **PgBouncer** in `transaction` pooling mode:
  ```ini
  pool_mode = transaction
  max_client_conn = 50000
  default_pool_size = 50
  reserve_pool_size = 10
  ```
- **Result**: 50,000 active web and backend workers share a pool of 50 physical database connections without database thread thrashing.

#### 5. Read/Write Database Splitting & Read Replicas
- Configure your PostgreSQL driver (`pgxpool`) to split traffic:
  - `PRIMARY`: All `INSERT`, `UPDATE`, `DELETE`, and financial transactions.
  - `REPLICA_POOL`: All `SELECT` queries for student dashboards, course curricula, and discussion forums.
- Scale from 1 to 5 read replicas with automatic latency-based DNS routing.

#### 6. Asynchronous Background Queues for Mutations
- Financial outbox refunds use PostgreSQL `FOR UPDATE SKIP LOCKED` background workers.
- Transactional emails are queued in a non-blocking Go channel worker pool (1024-message buffer).
- Observability logs are flushed in batches to Grafana Loki via HTTP gzip streams every 1000ms.
- **Result**: User-facing HTTP handlers respond in $<15\text{ms}$ without waiting for disk writes, third-party SMTP servers, or gateway webhooks.

---

## 8. Disaster Recovery, Backups & Emergency Runbook

### Scenario A: Let's Encrypt SSL Fails to Issue Certificate
1. Check Traefik logs:
   ```bash
   docker logs coursehunt-traefik --tail 100
   ```
2. Verify port 80 is accessible from the internet (Let's Encrypt HTTP-01 challenge requires port 80):
   ```bash
   curl -I http://coursehunt.com/.well-known/acme-challenge/test
   ```
3. Ensure your domain's DNS `A` record matches your public IP: `dig +short coursehunt.com`.

### Scenario B: Database Container Unhealthy / Startup Failure
1. Check PostgreSQL logs:
   ```bash
   docker logs coursehunt-postgres --tail 100
   ```
2. Verify disk space is not exhausted: `df -h`.
3. If corruption occurred, restore from the latest backup:
   ```bash
   gunzip < /var/backups/coursehunt/db_latest.sql.gz | docker exec -i coursehunt-postgres psql -U coursehunt_prod_user -d coursehunt_prod
   ```

### Scenario C: Emergency Rollback to Previous Version
If a newly deployed release has a critical bug:
```bash
# 1. Check out previous Git commit
git checkout HEAD~1

# 2. Re-run migrations down if needed
docker compose -f docker-compose.prod.yml run --rm migrator down 1

# 3. Rebuild and restart services
docker compose -f docker-compose.prod.yml up -d --build --no-deps web backend
```

---

## Summary Command Reference

| Action | Command |
| :--- | :--- |
| **Start Stack (Production)** | `docker compose -f docker-compose.prod.yml up -d` |
| **Stop Stack** | `docker compose -f docker-compose.prod.yml down` |
| **View Live Traefik Logs** | `docker logs -f coursehunt-traefik` |
| **View Live API Logs** | `docker logs -f coursehunt-backend` |
| **View Live Web Logs** | `docker logs -f coursehunt-web` |
| **Check All Healthchecks** | `docker compose -f docker-compose.prod.yml ps` |
| **Scale Backend to 3 Nodes** | `docker compose -f docker-compose.prod.yml up -d --scale backend=3` |
| **Run Manual DB Backup** | `docker exec coursehunt-postgres pg_dump -U coursehunt_prod_user coursehunt_prod > backup.sql` |
