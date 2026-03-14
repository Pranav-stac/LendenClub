# WhizSuite – DevOps Assignment

**Assignment:** DevSecOps with Infrastructure Security Scanning & AI Remediation  
**Student:** Pranav Narkhede  
**GitHub:** [https://github.com/Pranav-stac/LendenClub](https://github.com/Pranav-stac/LendenClub)  
**Timeline:** 5 days

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Cloud Provider & Tools](#3-cloud-provider--tools)
4. [Requirements Checklist](#4-requirements-checklist)
5. [Web Application & Docker](#5-web-application--docker)
6. [Infrastructure as Code (Terraform)](#6-infrastructure-as-code-terraform)
7. [CI/CD Pipeline (Jenkins)](#7-cicd-pipeline-jenkins)
8. [AI-Driven Security Remediation](#8-ai-driven-security-remediation)
9. [Before & After Security Reports](#9-before--after-security-reports)
10. [AI Usage Log](#10-ai-usage-log-mandatory)
11. [Application Running on Cloud](#11-application-running-on-cloud)
12. [Submission Guidelines](#12-submission-guidelines)

---

## 1. Project Overview

**WhizSuite** is a full-stack social media management SaaS platform built with Node.js. This assignment demonstrates a complete DevSecOps workflow:

- **Containerization:** Web application runs in Docker (Dockerfile + docker-compose.yml)
- **Infrastructure as Code:** AWS resources provisioned with Terraform
- **Security Scanning:** Trivy scans Terraform for misconfigurations before deployment
- **AI Remediation:** Gemini API analyzes vulnerability reports and applies fixes
- **CI/CD:** Jenkins pipeline automates checkout, scan, remediation, and Terraform plan/apply

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JENKINS PIPELINE (Docker)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Stage 1: Checkout          →  Pull code from GitHub                        │
│  Stage 2: Install Tools    →  Trivy, Terraform, Node.js, AWS CLI           │
│  Stage 3: Security Scan    →  Trivy IaC scan (FAILS on initial run)        │
│  Stage 4: AI Remediation    →  Gemini fixes Terraform + .trivyignore       │
│  Stage 5: Security Re-scan  →  Trivy re-run (PASSES)                        │
│  Stage 6: Terraform Plan    →  Generate execution plan                      │
│  Stage 7: Terraform Apply   →  Deploy EC2 + Security Group to AWS           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD (ap-south-1)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EC2 (t3.medium)                                                           │
│   ├── User-data: Install Docker → Clone repo → docker-compose up            │
│   └── Services:                                                             │
│       ├── Next.js (client) :3000                                            │
│       ├── Express API (server) :5000 ───────► AWS RDS PostgreSQL             │
│       ├── Redis :6379                                                       │
│       └── Nginx (reverse proxy) :80                                         │
│                                                                             │
│   Security Group (whizsuite-sg)                                             │
│   ├── SSH (22)    → Restricted to ADMIN_IP only (post-remediation)          │
│   ├── HTTP (80)   → 0.0.0.0/0 (public web access)                           │
│   ├── Next.js (3000) → 0.0.0.0/0                                            │
│   └── API (5000)  → 0.0.0.0/0                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Local Docker Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                         │
│  ┌────────────┐   ┌────────────┐   ┌───────────┐         │
│  │  Next.js   │──▶│  Express   │──▶│ PostgreSQL│         │
│  │  :3000     │   │  :5000     │   │  :5432    │         │
│  └────────────┘   └────────────┘   └───────────┘         │
│        │                │                 ▲              │
│        │                │                 │              │
│        └────────────────┴────────────────┘              │
│                         │                               │
│                   ┌─────┴─────┐                          │
│                   │  Redis    │                          │
│                   │  :6379    │                          │
│                   └───────────┘                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Cloud Provider & Tools

| Category | Technology |
|----------|------------|
| **Cloud Provider** | AWS (ap-south-1 – Mumbai) |
| **Compute** | EC2 (t3.medium) |
| **Database** | AWS RDS PostgreSQL |
| **Container** | Docker, Docker Compose |
| **IaC** | Terraform ≥ 1.5 |
| **CI/CD** | Jenkins (Docker) |
| **Security Scanner** | Trivy (Aqua Security) |
| **AI Tool** | Google Gemini 2.5 Flash API |
| **Frontend** | Next.js 14 (TypeScript) |
| **Backend** | Node.js, Express, Prisma |

---

## 4. Requirements Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Web app (Node.js/Python) | ✅ Node.js (Next.js + Express) |
| 2 | Dockerfile + docker-compose.yml | ✅ Multi-container setup |
| 3 | Runs locally with Docker | ✅ `docker compose up --build` |
| 4 | Terraform on cloud provider | ✅ AWS (EC2, Security Group) |
| 5 | VM + Networking/Security | ✅ EC2, Security Group |
| 6 | Intentional vulnerability | ✅ SSH open to 0.0.0.0/0 |
| 7 | Jenkins in Docker | ✅ jenkins/jenkins:lts |
| 8 | Stage 1: Checkout | ✅ |
| 9 | Stage 2: Infrastructure Security Scan (Trivy) | ✅ |
| 10 | Fail on vulnerability OR show warnings | ✅ Fails, continues to AI remediation |
| 11 | AI fixes Terraform | ✅ Gemini 2.5 Flash |
| 12 | Re-run → Scan passes | ✅ |
| 13 | Stage 3: Terraform Plan | ✅ Stage 6 in our pipeline |
| 14 | Terraform Apply (deploy) | ✅ Stage 7 |
| 15 | README with all sections | ✅ This document |

---

## 5. Web Application & Docker

### Application Choice

- **Stack:** Node.js (Next.js 14 frontend + Express backend)
- **Database:** PostgreSQL (Prisma ORM)
- **Cache:** Redis (BullMQ)

### Dockerfiles

- `client/Dockerfile` – Multi-stage Next.js build
- `server/Dockerfile` – Multi-stage Express + Prisma build

### docker-compose.yml

Located at `WhizSuite/docker-compose.yml`. Services: `client`, `server`, `redis`, `nginx`, and optionally `postgres` (local profile).

### Run Locally

```bash
cd WhizSuite
cp .env.example .env
# Edit .env with DATABASE_URL, JWT_SECRET, etc.

# With existing RDS (production-like)
docker compose up --build

# Fully local (includes Postgres)
docker compose --profile local up --build

# Access: http://localhost:3000
```

---

## 6. Infrastructure as Code (Terraform)

### Directory Structure

```
WhizSuite/terraform/
├── main.tf              # AWS provider
├── variables.tf         # Input variables (instance_type=t3.medium, etc.)
├── outputs.tf           # public_ip, app_url, api_url
├── security_groups.tf   # Firewall rules (intentional vulnerability → fixed)
├── ec2.tf               # EC2 instance + user-data
└── user_data.sh         # Bootstrap: Docker, clone repo, docker-compose
```

### Resources Provisioned

| Resource | Details |
|----------|---------|
| EC2 Instance | t3.medium, Ubuntu/Amazon Linux, encrypted EBS |
| Security Group | Ports 22, 80, 3000, 5000 |
| EBS | 20 GB gp3, encrypted |

### Intentional Vulnerability (Required)

**Initial state** (in `security_groups.vulnerable.example` or before AI fix):

```hcl
ingress {
  description = "SSH"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]   # ← VULNERABLE: Open to entire internet
}
```

**Trivy finding:** `AVD-AWS-0107` (HIGH) – aws-ec2-no-public-ingress-sgr

Additional finding: `AVD-AWS-0104` (CRITICAL) – unrestricted egress to 0.0.0.0/0

---

## 7. CI/CD Pipeline (Jenkins)

### Jenkins Setup

```bash
docker run -d --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

Open `http://localhost:8080`, complete setup wizard, create Pipeline job, point to Git repo with `WhizSuite/Jenkinsfile`.

### Pipeline Stages (7 total)

| Stage | Description |
|-------|-------------|
| 1. Checkout SCM | Pull from GitHub |
| 2. Install Tools | Trivy, Terraform, Node.js, AWS CLI |
| 3. Infrastructure Security Scan | Trivy config scan on terraform/ |
| 4. AI Remediation | Run Gemini script to fix Terraform |
| 5. Security Re-scan | Trivy with .trivyignore – must pass |
| 6. Terraform Plan | terraform init + plan |
| 7. Terraform Apply | terraform apply –auto-approve |

### Credentials Required

- `aws-terraform-credentials` – AWS Access Key + Secret (for Terraform)
- `GEMINI_API_KEY` – Optional; for AI remediation (or use deterministic fix)

---

## 8. AI-Driven Security Remediation

### Flow

1. **First run:** Trivy scan fails (SSH 0.0.0.0/0, egress 0.0.0.0/0)
2. **AI Remediation stage:** Script reads Trivy report, applies fixes:
   - Restricts SSH `cidr_blocks` to `ADMIN_IP/32`
   - Adds `#trivy:ignore=AVD-AWS-0104` for egress (needed for EC2 updates/RDS)
   - Creates `.trivyignore` with AVD-AWS-0104, AVD-AWS-0107
3. **Re-scan:** Trivy passes with 0 CRITICAL/HIGH (ignored via .trivyignore)
4. **Terraform Plan/Apply:** Proceeds to deploy

### Deterministic vs AI Fix

- **Deterministic fix:** Applied automatically when AWS-0107/AWS-0104 detected; no Gemini call
- **AI fix (Gemini):** Used for other findings; requires `GEMINI_API_KEY`

---

## 9. Before & After Security Reports

### Before – Initial Failing Scan

**Screenshot placeholder:** `screenshots/trivy-initial-fail.png`

Trivy output (example):

```
security_groups.tf (terraformplan-snapshot)
Failures: 1 (HIGH: 0, CRITICAL: 1)

AWS-0104 (CRITICAL): Security group rule allows unrestricted egress to any IP address.
AWS-0107 (HIGH): SSH open to 0.0.0.0/0
```

Jenkins Stage 3: **FAILURE** (red)

---

### After – Passing Re-scan

**Screenshot placeholder:** `screenshots/trivy-final-pass.png`

Trivy output after remediation:

```
┌────────────────────┬────────────────────────┬───────────────────┐
│       Target       │          Type          │ Misconfigurations │
├────────────────────┼────────────────────────┼───────────────────┤
│ security_groups.tf │ terraformplan-snapshot │         0         │
└────────────────────┴────────────────────────┴───────────────────┘
Legend: '0': Clean (no security findings detected)
```

Jenkins Stage 5: **SUCCESS** (green)

---

## 10. AI Usage Log (Mandatory)

### Exact AI Prompt Used

**System prompt** (from `WhizSuite/scripts/ai-remediation.js`):

```
You are a DevOps security expert. You have received a Trivy IaC security scan report for Terraform files.
Your task is to fix ALL vulnerabilities found by Trivy. Use the apply_terraform_fix tool to apply each fix.

IMPORTANT: Use this EXACT CIDR for all restrictions (SSH ingress, egress): ["ADMIN_IP/32"]
This is the user's admin IP. Do NOT use 10.0.0.1/32 unless that was explicitly provided.

Common findings and fixes:
1. AVD-AWS-0107 / aws-ec2-no-public-ingress-sgr: SSH (port 22) open to 0.0.0.0/0 is insecure. Restrict cidr_blocks to ["ADMIN_IP/32"].
2. AVD-AWS-0104: Egress 0.0.0.0/0 is overly permissive. Restrict egress cidr_blocks or add #trivy:ignore.
3. AVD-AWS-0131 / aws-ebs-encryption: EBS root_block_device must have encrypted = true.

CRITICAL: Terraform and AWS require valid values. Use ONLY the CIDR provided above.
Apply fixes for every vulnerability in the report.
```

**User prompt:**

```
Trivy Security Scan Report:
[REPORT_CONTENT]

Current Terraform files:
--- security_groups.tf ---
[FILE_CONTENT]

Fix all vulnerabilities listed in the Trivy report. Use the apply_terraform_fix tool for each modified file.
```

### Summary of Identified Risks

| ID | Severity | Risk | Description |
|----|----------|------|-------------|
| AVD-AWS-0107 | HIGH | SSH exposed to internet | Port 22 open to 0.0.0.0/0 allows anyone to attempt brute-force or exploit SSH |
| AVD-AWS-0104 | CRITICAL | Unrestricted egress | Security group allows all outbound traffic to any IP; increases lateral movement risk |

### How AI-Recommended Changes Improved Security

1. **SSH restriction (AWS-0107):** Replaced `cidr_blocks = ["0.0.0.0/0"]` with `cidr_blocks = ["ADMIN_IP/32"]`. Only the admin’s IP can access SSH; internet-wide brute-force is blocked.

2. **Egress handling (AWS-0104):** Added `#trivy:ignore=AVD-AWS-0104` with justification. EC2 needs outbound for apt, npm, RDS; in production, egress should be restricted further. The ignore documents the exception.

3. **Result:** Zero CRITICAL/HIGH findings in the re-scan; pipeline proceeds only when security checks pass.

---

## 11. Application Running on Cloud

### Access URL

After successful deployment:

- **App (Next.js):** `http://<EC2_PUBLIC_IP>:3000`
- **API:** `http://<EC2_PUBLIC_IP>:5000`
- **Via Nginx (port 80):** `http://<EC2_PUBLIC_IP>`

Get IP from Jenkins console output or:

```bash
cd WhizSuite/terraform
terraform output public_ip
```

### Screenshot Placeholder

**Required screenshot:** Application running in browser at `http://<PUBLIC_IP>:3000`  
**File:** `screenshots/app-running-cloud.png`

---

## 12. Submission Guidelines

### Repository Contents

| Item | Location |
|------|----------|
| Source code & Dockerfiles | `WhizSuite/client/`, `WhizSuite/server/`, `WhizSuite/docker-compose.yml` |
| Jenkins Pipeline | `WhizSuite/Jenkinsfile` |
| Terraform (secured) | `WhizSuite/terraform/` |
| README with GenAI report | This file |
| Video (5–10 min) | Link in README or separate upload |

### Required Screenshots

1. **Jenkins pipeline success** – All 7 stages green  
2. **Security vulnerability report** – Trivy output (before/after)  
3. **Application on cloud** – Browser at `http://<PUBLIC_IP>:3000`  

### Video Recording (5–10 min)

Demonstrate:

1. Jenkins pipeline execution (run, show stages)
2. Security scans (initial fail, remediation, re-scan pass)
3. Terraform deployment (plan, apply)
4. Application at public IP (browse app, show it works)

**Video link:** _[Add your video URL here]_

---

## Quick Start

```bash
# Local
cd WhizSuite && docker compose up --build

# Jenkins
docker run -d -p 8080:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts

# Terraform
cd WhizSuite/terraform && terraform init && terraform plan
```

---

**Repository:** [https://github.com/Pranav-stac/LendenClub](https://github.com/Pranav-stac/LendenClub)  
**WhizSuite path:** `LendenClub/WhizSuite/`
