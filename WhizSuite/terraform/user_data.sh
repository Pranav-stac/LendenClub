#!/bin/bash
set -e

# ─────────────────────────────────────────────
# 1. System update & Docker installation
# ─────────────────────────────────────────────
yum update -y
yum install -y docker git

systemctl enable docker
systemctl start docker

# Install Docker Compose v2
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ─────────────────────────────────────────────
# 2. Clone application repository
# ─────────────────────────────────────────────
cd /home/ec2-user
git clone ${github_repo_url} whizsuite
cd whizsuite/WhizSuite

# ─────────────────────────────────────────────
# 3. Create .env from Terraform variables
# ─────────────────────────────────────────────
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

cat > .env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=${database_url}
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=${jwt_secret}_refresh
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://$${PUBLIC_IP}:3000
BACKEND_URL=http://$${PUBLIC_IP}:5000
NEXT_PUBLIC_API_URL=http://$${PUBLIC_IP}:5000/api
USE_LOCAL_STORAGE=false
EOF

# ─────────────────────────────────────────────
# 4. Start the application
# ─────────────────────────────────────────────
docker-compose up -d --build

echo "WhizSuite started. Access at http://$${PUBLIC_IP}:3000"
