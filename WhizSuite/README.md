# WhizSuite – DevOps Assignment

A full-stack social media management SaaS platform, containerised and deployed to AWS with automated infrastructure security scanning via Jenkins CI/CD and AI-assisted vulnerability remediation.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Local Setup with Docker](#local-setup-with-docker)
5. [Cloud Infrastructure (Terraform)](#cloud-infrastructure-terraform)
6. [CI/CD Pipeline (Jenkins)](#cicd-pipeline-jenkins)
7. [AI-Driven Security Remediation](#ai-driven-security-remediation)
8. [Before & After Security Reports](#before--after-security-reports)
9. [Application Screenshots](#application-screenshots)
10. [How to Access the Live App](#how-to-access-the-live-app)

---

## Project Overview

WhizSuite is a multi-workspace social media management platform.  
This submission demonstrates a complete DevOps workflow:

- Application containerised with **Docker** (multi-stage builds)
- Infrastructure provisioned on **AWS** with **Terraform**
- A **Jenkins** pipeline that scans Terraform code with **Trivy** before any deployment
- **AI-assisted remediation** to identify and fix a deliberate SSH security vulnerability

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Local / Docker                           │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌───────────┐  │
│  │  client  │──▶│  server  │──▶│  postgres │   │   redis   │  │
│  │ :3000    │   │  :5000   │   │  :5432    │   │  :6379    │  │
│  └──────────┘   └──────────┘   └───────────┘   └───────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                 │
│                                                                  │
│  EC2 (t2.micro)                                                  │
│  ├── Docker Compose                                              │
│  │   ├── client  (:3000)                                         │
│  │   ├── server  (:5000) ──── AWS RDS (PostgreSQL ap-south-1)   │
│  │   └── redis   (:6379)                                         │
│  └── Security Group (post-remediation: SSH restricted to VPN)   │
│                                                                  │
│  S3 Bucket: whizsuite (media file storage)                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                               │
│                                                                  │
│  Jenkins (Docker) ──► Git Checkout                               │
│                   ──► Trivy IaC Scan (terraform/)                │
│                   ──► AI Remediation (Gemini 2.5 Flash)          │
│                   ──► Trivy Re-scan                              │
│                   ──► Terraform Plan                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | Next.js 14 (TypeScript, App Router)     |
| Backend        | Node.js 18, Express, Prisma ORM         |
| Database       | PostgreSQL 15 (AWS RDS)                 |
| Cache / Queue  | Redis 7 (BullMQ)                        |
| Object Storage | AWS S3                                  |
| Container      | Docker, Docker Compose                  |
| IaC            | Terraform >= 1.5                        |
| CI/CD          | Jenkins (Docker image)                  |
| Security Scan  | Trivy (Aqua Security)                   |
| Cloud Provider | AWS (ap-south-1 – Mumbai)               |
| AI Tool        | Gemini API (tool calling for automated remediation) |

---

## Local Setup with Docker

### Prerequisites

- Docker Desktop installed and running
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/whizsuite.git
cd whizsuite/WhizSuite

# 2. Copy the env template and fill in your values
cp .env.example .env
# Edit .env – set DATABASE_URL, JWT_SECRET, AWS credentials, etc.

# 3a. Run with existing AWS RDS (default)
docker compose up --build

# 3b. OR run fully local (includes a local Postgres container)
docker compose --profile local up --build

# 4. Open the app
#    Frontend: http://localhost:3000
#    API:      http://localhost:5000
#    Health:   http://localhost:5000/health
```

### Service Ports

| Service  | Port |
|----------|------|
| client   | 3000 |
| server   | 5000 |
| postgres | 5432 (local profile only) |
| redis    | 6379 |

---

## Cloud Infrastructure (Terraform)

### Directory

```
terraform/
├── main.tf             # AWS provider config
├── variables.tf        # Input variables
├── outputs.tf          # Public IP / app URL
├── security_groups.tf  # Firewall rules (vulnerability here initially)
├── ec2.tf              # EC2 instance + user-data
└── user_data.sh        # Bootstrap: install Docker, clone repo, start app
```

### Deploy

```bash
cd WhizSuite/terraform

# Initialise providers
terraform init

# Preview changes
terraform plan -var="github_repo_url=https://github.com/your-username/whizsuite.git"

# Apply (creates EC2 + security group)
terraform apply -var="github_repo_url=https://github.com/your-username/whizsuite.git"

# Get the public IP
terraform output public_ip
```

### Resources Provisioned

| Resource        | Details                              |
|-----------------|--------------------------------------|
| EC2 Instance    | t2.micro, Amazon Linux 2, ap-south-1 |
| Security Group  | Ports 22, 80, 3000, 5000 from 0.0.0.0/0 (before fix) |
| EBS Volume      | 20 GB gp3                            |
| Existing RDS    | AWS RDS PostgreSQL (reused)          |
| Existing S3     | whizsuite bucket (reused)            |

---

## CI/CD Pipeline (Jenkins)

**→ Full setup guide: [docs/JENKINS_SETUP.md](docs/JENKINS_SETUP.md)**

### Running Jenkins with Docker

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Open http://localhost:8080
# Follow the setup wizard; install recommended plugins + HTML Publisher plugin
```

### Pipeline Stages

| Stage | Description |
|-------|-------------|
| 1. Checkout | Pull source code from Git |
| 2. Install Tools | Download Trivy, Terraform, Node.js if not cached |
| 3. Infrastructure Security Scan | Run `trivy config` on `terraform/`; fail on HIGH/CRITICAL (continues via catchError) |
| 4. AI Remediation | Run Gemini 2.5 Flash script to fix Terraform (when GEMINI_API_KEY is set) |
| 5. Security Re-scan | Re-run Trivy to verify fixes; must pass to continue |
| 6. Terraform Plan | Run `terraform init && terraform plan` |

### Jenkinsfile Location

`WhizSuite/Jenkinsfile`

### Jenkins Configuration Guide

See **[docs/JENKINS_SETUP.md](docs/JENKINS_SETUP.md)** for step-by-step instructions on:

- Running Jenkins with Docker
- Creating the pipeline job and connecting Git
- Adding GEMINI_API_KEY (credential or global env)
- Troubleshooting common issues

---

## AI-Driven Security Remediation (Gemini 2.5 Flash + Tool Calling)

This project uses **Gemini 2.5 Flash API** with **function calling** to automatically fix Trivy-identified vulnerabilities. The Jenkins pipeline invokes a Node.js script that:

1. Reads the Trivy report from the failed scan
2. Calls Gemini API with the report and current Terraform file contents
3. Uses the `apply_terraform_fix` tool – Gemini returns structured function calls with corrected file content
4. The script executes those calls and writes the fixed Terraform files to disk
5. Re-scan runs to verify fixes – pipeline continues only if no CRITICAL/HIGH remain

### Gemini API Setup

1. **Get an API key** from [Google AI Studio](https://aistudio.google.com/apikey)
2. **Add it to Jenkins** as an environment variable or secret:
   - **Pipeline credentials**: Jenkins → Manage Jenkins → Credentials → Add Secret Text. Add `GEMINI_API_KEY` with your key.
   - **Pipeline configuration**: In your Pipeline job, add under "Pipeline" → "Environment variables" or use `withCredentials`:
     ```groovy
     withCredentials([string(credentialsId: 'gemini-api-key', variable: 'GEMINI_API_KEY')]) {
         // pipeline steps
     }
     ```
   - Or set it globally: Manage Jenkins → Configure System → Global properties → Environment variables → `GEMINI_API_KEY`
3. **Optional – restrict SSH to your IP**: Set `ADMIN_IP=your.public.ip` so the AI restricts SSH to your IP instead of a placeholder.

### Step 1 – First Pipeline Run (Intentional Failure)

The initial `security_groups.tf` contains a known vulnerability:

```hcl
ingress {
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # SSH open to the entire internet
}
```

Trivy reports this as **HIGH** (AVD-AWS-0107 – aws-ec2-no-public-ingress-sgr).  
The stage fails, but `catchError` allows the pipeline to continue to the **AI Remediation** stage.

---

### Step 2 – Automated AI Remediation (Gemini 2.5 Flash)

When `GEMINI_API_KEY` is set, the pipeline runs `WhizSuite/scripts/ai-remediation.js`:

- **Input**: Trivy report + current `security_groups.tf` and `ec2.tf`
- **Model**: `gemini-2.5-flash` with tool calling
- **Tool**: `apply_terraform_fix(file_path, new_content, description)` – Gemini calls this with corrected Terraform
- **Output**: Fixed files written to disk; Re-scan runs next

If `GEMINI_API_KEY` is not set, the script skips (exit 0) and the Re-scan will fail (vulnerabilities unchanged).

---

### Step 3 – Summary of Identified Risks

| Finding | Severity | Risk | Trivy Check |
|---------|----------|------|-------------|
| SSH (22) open to 0.0.0.0/0 | HIGH | Any attacker on the internet can attempt brute-force or exploit SSH. Exposes instance to automated scanning and credential-stuffing attacks. | AVD-AWS-0107 |
| EBS volume not encrypted | MEDIUM | Unencrypted root disk could expose data-at-rest if the volume snapshot is accessed without IAM controls. | AVD-AWS-0131 |

---

### Step 4 – AI-Recommended Fixes Applied

**SSH restriction** – `security_groups.tf` after remediation:

```hcl
ingress {
  description = "SSH – restricted to admin IP only"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["YOUR_ADMIN_IP/32"]  # Replace with your actual IP
}
```

**EBS encryption** – `ec2.tf` after remediation:

```hcl
root_block_device {
  volume_size = 20
  volume_type = "gp3"
  encrypted   = true   # Enabled after AI recommendation
}
```

---

### Step 5 – How the Changes Improved Security

1. **SSH restricted to a single IP** eliminates exposure to the open internet. Automated scanners and brute-force tools can no longer reach port 22.
2. **Encrypted EBS** ensures that data written to disk is protected at rest, satisfying cloud security best practices (CIS AWS Benchmark).
3. **Zero CRITICAL/HIGH findings** – re-running the Jenkins pipeline confirms a clean Trivy report.

---

## Before & After Security Reports

### Before (Initial Pipeline Run – FAILS)

> **Screenshot:** `screenshots/jenkins-scan-fail.png`  
> Trivy reports HIGH vulnerability: `AVD-AWS-0107` on `security_groups.tf`  
> Jenkins stage "Infrastructure Security Scan" marked RED.

### After (Post-Remediation Pipeline Run – PASSES)

> **Screenshot:** `screenshots/jenkins-scan-pass.png`  
> Trivy reports 0 CRITICAL, 0 HIGH findings.  
> All Jenkins stages GREEN.

---

## Application Screenshots

### Jenkins Pipeline Success

> `screenshots/jenkins-pipeline-success.png`

### Security Vulnerability Report

> `screenshots/trivy-report.png`

### Application Running on Cloud Public IP

> **URL:** `http://<EC2_PUBLIC_IP>:3000`  
> `screenshots/app-live.png`

---

## How to Access the Live App

After `terraform apply`:

```bash
terraform output app_url
# Output: http://<PUBLIC_IP>:3000
```

Open the URL in a browser. The WhizSuite login page will be served by the Next.js client container on the EC2 instance.

---

## Security Notes

- **Never commit `.env` files.** Use `.env.example` as a template.
- AWS credentials in `.env` are for S3 access only. Use IAM roles on EC2 in production.
- Database credentials should be stored in **AWS Secrets Manager** for production deployments.
- The `terraform/` directory in this repo contains the **remediated, secure version** of the infrastructure code.

---

## Repository Structure

```
WhizSuite/
├── client/                  # Next.js 14 frontend
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── server/                  # Node.js / Express backend
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── prisma/
│   └── src/
├── terraform/               # AWS infrastructure (secured)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── security_groups.tf
│   ├── ec2.tf
│   └── user_data.sh
├── docker-compose.yml
├── .env.example
├── Jenkinsfile
└── README.md
```
