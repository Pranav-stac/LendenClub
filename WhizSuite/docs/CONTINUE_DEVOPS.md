# Continue DevOps Assignment – Step-by-Step

**Current status:** Docker runs locally ✅ | Jenkins & Terraform pending

---

## Step 1: Push Latest Code to GitHub

Ensure your repo has the fixes (Jenkinsfile without ansiColor, client/public folder, etc.):

```powershell
cd E:\Pranav\LendenClub
git status
git add .
git commit -m "DevOps assignment: Jenkins, Terraform, Docker fixes"
git push origin main
```

---

## Step 2: Start Jenkins (if not running)

```powershell
docker ps -a
# If jenkins container exists but is stopped:
docker start jenkins

# If no jenkins container, create one:
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```

Open http://localhost:8080

---

## Step 3: Configure Jenkins Pipeline Job

1. Go to **WhizSuite-DevOps** → **Configure**
2. **Pipeline** section:
   - SCM: **Git**
   - Repository URL: `https://github.com/Pranav-stac/LendenClub`
   - Branch: `*/main`
   - Script Path: `WhizSuite/Jenkinsfile`
3. **Build Environment** (scroll down):
   - Check **Use secret text(s) or file(s)**
   - Add: Credentials = `gemini-api-key`, Variable = `GEMINI_API_KEY`
4. **Save**

**If you don't have the credential yet:**
- **Manage Jenkins** → **Credentials** → **Add Credentials**
- Kind: Secret text | Secret: [your Gemini API key] | ID: `gemini-api-key`

---

## Step 4: Run Jenkins Pipeline

1. **WhizSuite-DevOps** → **Build Now**
2. Click the build number → **Console Output**
3. Expected flow:
   - Stage 1 (Checkout) ✅
   - Stage 2 (Install Tools) ✅
   - Stage 3 (Security Scan) ❌ (intentional – Trivy finds SSH vulnerability)
   - Stage 4 (AI Remediation) ✅ (fixes Terraform if GEMINI_API_KEY is set)
   - Stage 5 (Re-scan) ✅
   - Stage 6 (Terraform Plan) ✅

4. **Take screenshots:**
   - Pipeline overview (all stages)
   - Trivy report (Stage 3 or 5 output)
   - Final success

---

## Step 5: Terraform Deployment (AWS)

### 5a. Prerequisites
- AWS CLI configured: `aws configure`
- EC2 key pair created in ap-south-1 (e.g. `whizsuite-key`)
- RDS security group allows inbound 5432 from your EC2 security group

### 5b. Deploy

```powershell
cd E:\Pranav\LendenClub\WhizSuite\terraform

terraform init
terraform plan -var="github_repo_url=https://github.com/Pranav-stac/LendenClub.git" -var="key_name=whizsuite-key"
terraform apply -var="github_repo_url=https://github.com/Pranav-stac/LendenClub.git" -var="key_name=whizsuite-key"
# Type: yes
```

### 5c. Get Public IP

```powershell
terraform output public_ip
terraform output app_url
```

### 5d. Wait & Test
- Wait 5–10 minutes for EC2 user-data (Docker install, clone, compose)
- Open `http://<PUBLIC_IP>:3000` in browser
- **Screenshot:** App running on cloud

---

## Step 6: Update README

Add to your README.md:
1. **Before & After Security Reports** – Screenshots (failing vs passing Trivy)
2. **AI Usage Log:**
   - Exact prompt used
   - Summary of risks (SSH 0.0.0.0/0, unencrypted EBS)
   - How AI fixes improved security
3. **Live App URL:** `http://<YOUR_PUBLIC_IP>:3000`
4. **Screenshots:** Jenkins success, Trivy report, app on cloud

---

## Step 7: Record Video (5–10 min)

1. Run Jenkins pipeline
2. Show Trivy fail → AI remediation → pass
3. Show Terraform plan
4. Show app at public IP

---

## Step 8: Submit

- GitHub repo link
- Video link or file

---

## Troubleshooting

| Issue | Fix |
|------|-----|
| Jenkins "Invalid option ansiColor" | Push the fixed Jenkinsfile (no ansiColor) to GitHub |
| Stage 4 skips / Re-scan fails | Add GEMINI_API_KEY in Build Environment |
| Terraform: key not found | Create key pair in AWS Console → EC2 → Key Pairs |
| App not loading on EC2 | Wait 10 min; check RDS security group allows EC2 SG |
| Checkout fails | Verify repo URL, branch (`main` vs `master`) |
