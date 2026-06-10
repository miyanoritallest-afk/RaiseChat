#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/user-data.log) 2>&1

AWS_REGION="${aws_region}"
ECR_REGISTRY="${ecr_registry}"
APP_DIR="/app"

# ── 基本パッケージ ────────────────────────────────────────────
dnf update -y
dnf install -y docker nginx amazon-ssm-agent

# ── Docker起動 ────────────────────────────────────────────────
systemctl enable --now docker
usermod -aG docker ec2-user

# ── Docker Compose プラグイン ─────────────────────────────────
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── SSM Agent起動 ────────────────────────────────────────────
systemctl enable --now amazon-ssm-agent

# ── Nginx設定 ─────────────────────────────────────────────────
cat > /etc/nginx/conf.d/raisechat.conf << 'NGINX_CONF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name _;

    # Socket.io WebSocket（/api/より先に定義）
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection $connection_upgrade;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }

    # NestJS API
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Next.js フロントエンド
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
NGINX_CONF

# デフォルト設定を無効化
rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl enable --now nginx

# ── アプリディレクトリ ────────────────────────────────────────
mkdir -p "$APP_DIR"

# ── SSMからenv取得して.env.prodを生成するスクリプト ────────────
cat > /app/fetch-env.sh << 'FETCHENV'
#!/bin/bash
set -euo pipefail
REGION="$(curl -s http://169.254.169.254/latest/meta-data/placement/region)"
PARAMS=(DATABASE_URL JWT_SECRET SENTRY_DSN NEXT_PUBLIC_API_URL FRONTEND_URL AWS_S3_BUCKET_NAME AWS_REGION)

> /app/.env.prod
for PARAM in "${PARAMS[@]}"; do
  VALUE=$(aws ssm get-parameter \
    --name "/raisechat/prod/$PARAM" \
    --with-decryption \
    --region "$REGION" \
    --query 'Parameter.Value' \
    --output text)
  echo "$PARAM=$VALUE" >> /app/.env.prod
done
chmod 600 /app/.env.prod
FETCHENV
chmod +x /app/fetch-env.sh

# ── docker-compose.prod.yml ────────────────────────────────────
cat > /app/docker-compose.prod.yml << COMPOSE
version: "3.9"
services:
  backend:
    image: ${ECR_REGISTRY}/raisechat-backend:latest
    restart: unless-stopped
    env_file:
      - /app/.env.prod
    ports:
      - "127.0.0.1:4000:4000"

  frontend:
    image: ${ECR_REGISTRY}/raisechat-frontend:latest
    restart: unless-stopped
    env_file:
      - /app/.env.prod
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend
COMPOSE

echo "User data setup complete"
