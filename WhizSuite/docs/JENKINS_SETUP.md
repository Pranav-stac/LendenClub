# Jenkins Configuration Guide – WhizSuite DevOps Pipeline

This guide walks you through setting up Jenkins to run the WhizSuite DevOps pipeline with AI-powered security remediation.

---

## Prerequisites

- **Jenkins**: Docker (Linux) or native Windows installation
- Git
- GitHub repository with WhizSuite code pushed
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Step 1: Run Jenkins

### Option A: Docker (Linux – recommended)

```bash
# Start Jenkins container
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

**First-time setup:**
1. Open **http://localhost:8080** in your browser
2. Copy the initial admin password: `docker logs jenkins 2>&1 | grep -A 2 "password"`
3. Install **recommended plugins**
4. Create an admin user

### Option B: Windows (native Jenkins)

1. Download the Windows installer from [jenkins.io](https://www.jenkins.io/download/)
2. Run the installer and complete setup
3. Ensure the Jenkins agent runs as a user that can download from the internet (Trivy, Terraform, Node are auto-installed)
4. Install **PowerShell** (built-in on Windows 10/11) – the pipeline uses it for Windows stages

**Plugins to install** (Manage Jenkins → Plugins):

- **Pipeline**
- **HTML Publisher** (for Trivy reports)
- **Credentials Binding** (for GEMINI_API_KEY)
- **Git**
- **PowerShell** (for Windows agents)

---

## Step 2: Create the Pipeline Job

1. Click **New Item**
2. Enter name: `WhizSuite-DevOps`
3. Select **Pipeline**
4. Click **OK**

---

## Step 3: Configure Pipeline (Pipeline Definition)

1. In the job, go to **Configure**
2. Under **Pipeline**:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`  
     (Replace with your actual repo URL – e.g. `https://github.com/youruser/LendenClub.git`)
   - **Branch**: `*/main` or `*/master` (match your default branch)
   - **Script Path**: `WhizSuite/Jenkinsfile`

3. If your repo root is **WhizSuite** (no parent folder), set Script Path to `Jenkinsfile`

4. Save

---

## Step 4: Add GEMINI_API_KEY

Choose **one** of these methods.

### Option A: Credential + Build Environment (Recommended – secure, no code change)

1. Go to **Manage Jenkins → Credentials → System → Global credentials (unrestricted)**
2. Click **Add Credentials**
3. Set:
   - **Kind**: Secret text
   - **Scope**: Global
   - **Secret**: Paste your Gemini API key
   - **ID**: `gemini-api-key`
   - **Description**: Gemini 2.5 Flash API Key
4. Save

5. In your pipeline job → **Configure** → **Build Environment**:
   - Check **Use secret text(s) or file(s)**
   - Add **Secret text** binding:
     - **Credential**: Select `gemini-api-key`
     - **Variable**: `GEMINI_API_KEY`
6. Save

No Jenkinsfile changes needed – the variable is injected before the pipeline runs.

### Option B: Global Environment Variable (Simplest)

1. Go to **Manage Jenkins → Configure System**
2. Scroll to **Global properties**
3. Check **Environment variables**
4. Click **Add**:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
5. Save

No Jenkinsfile changes needed – the pipeline will pick it up automatically.

### Option C: Inject Credential in Job (Per-job, no global env)

1. Create the credential (Steps 1–4 from Option A)
2. In your **Pipeline job → Configure**
3. Under **Build Environment**, enable **Use secret text(s) or file(s)**
4. Add **Secret text** binding:
   - **Credentials**: Select `gemini-api-key`
   - **Variable**: `GEMINI_API_KEY`
5. Save

No Jenkinsfile changes needed.

---

## Step 5: Optional – Restrict SSH to Your IP

If you want the AI to restrict SSH to your IP instead of a placeholder:

1. Find your public IP: visit https://whatismyip.com
2. In **Manage Jenkins → Configure System → Global properties → Environment variables**, add:
   - **Name**: `ADMIN_IP`
   - **Value**: Your IP (e.g. `203.0.113.50`)

---

## Step 6: Adjust Jenkinsfile Path (if needed)

If your repo structure is:

- **Repo root = LendenClub (contains WhizSuite/)**
  - Script Path: `WhizSuite/Jenkinsfile`
  - The pipeline expects: `WhizSuite/terraform`, `WhizSuite/scripts`, etc.

- **Repo root = WhizSuite**
  - Script Path: `Jenkinsfile`
  - Update the Jenkinsfile: replace `WhizSuite/` with `./` for `TERRAFORM_DIR`, `dir('WhizSuite/scripts')` → `dir('scripts')`, etc.

---

## Step 7: Run the Pipeline

1. Open your job **WhizSuite-DevOps**
2. Click **Build Now**
3. Watch the stages:
   - Stage 3 (Security Scan) will show as failed (intended – vulnerability present)
   - Stage 4 (AI Remediation) will run and fix Terraform (if GEMINI_API_KEY is set)
   - Stage 5 (Re-scan) must pass
   - Stage 6 (Terraform Plan) runs if re-scan passes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Checkout fails** | Check Git URL, branch name, credentials for private repos |
| **Node.js not found** | Linux: install Node on the agent. **Windows**: pipeline auto-downloads Node to workspace; ensure outbound HTTPS is allowed |
| **GEMINI_API_KEY not set** | Add credential or global env var; ensure variable name is exact |
| **Script path not found** | Verify Script Path matches repo layout (`WhizSuite/Jenkinsfile` vs `Jenkinsfile`) |
| **Trivy install fails** | Linux: agent needs `curl`, `unzip`. **Windows**: pipeline auto-downloads Trivy; ensure outbound HTTPS works |
| **Re-scan still fails** | Check if AI Remediation ran (Stage 4 logs). If GEMINI_API_KEY was missing, it skips. Add the key and re-run |
| **"sh: command not found" on Windows** | Use native Windows Jenkins (not WSL). The pipeline detects OS and uses `bat`/`powershell` on Windows |
| **PowerShell execution policy** | On Windows, run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` if PowerShell scripts are blocked |

---

## Summary Checklist

- [ ] Jenkins running (Docker or existing server)
- [ ] Plugins installed: Pipeline, Git, HTML Publisher, Credentials Binding
- [ ] Pipeline job created with correct Git URL and Script Path
- [ ] GEMINI_API_KEY added (credential or global env)
- [ ] (Optional) ADMIN_IP set for SSH restriction
- [ ] First build run – AI remediation and re-scan succeed
