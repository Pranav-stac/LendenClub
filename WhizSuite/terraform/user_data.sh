#!/bin/bash
set -e

# ─────────────────────────────────────────────
# 1. Detect OS and install Docker + git
# Supports: Amazon Linux 2, Ubuntu
# ─────────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  OS=unknown
fi

if [[ "$OS" == "ubuntu" ]]; then
  # Ubuntu
  apt-get update -y
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  APP_HOME="/home/ubuntu"
else
  # Amazon Linux 2
  yum update -y
  yum install -y docker git
  systemctl enable docker
  systemctl start docker
  # Docker Compose v2 (standalone)
  curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  APP_HOME="/home/ec2-user"
fi

# Start Docker (both Ubuntu and Amazon Linux)
systemctl enable docker
systemctl start docker

# Ensure docker-compose command exists (Ubuntu uses plugin: docker compose)
if ! command -v docker-compose &>/dev/null && command -v docker &>/dev/null; then
  alias docker-compose="docker compose"
fi

# ─────────────────────────────────────────────
# 2. Clone application repository
# ─────────────────────────────────────────────
cd $APP_HOME
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
if command -v docker-compose &>/dev/null; then
  docker-compose up -d --build
else
  docker compose up -d --build
fi

echo "WhizSuite started. Access at http://$${PUBLIC_IP}:3000"
