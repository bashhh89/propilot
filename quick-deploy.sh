#!/bin/bash

# 🚀 Quick Deploy Script for Procurement AI Copilot
# Run this on your VPS: ssh root@168.231.115.219

echo "🚀 Starting Procurement AI Copilot deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install required packages
echo "📦 Installing required packages..."
apt install -y nginx git ufw

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Setup firewall
echo "🔒 Setting up firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /var/www/procurement-ai
cd /var/www/procurement-ai

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/bashhh89/propilot.git .

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
# OpenWebUI Configuration (Local AI)
OPENWEBUI_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI1ZTIyODVkLTI0NTUtNGQyMS1iZGJkLWNiYzYwYTlhN2RjYyJ9.hJGAazDC0Dm9JS3n-2ngWPTr7IZ_ggSJPEe9fVtX2rw
OPENWEBUI_BASE_URL=https://socialgarden-openwebui.vo0egb.easypanel.host

# Server Configuration
PORT=3000
NODE_ENV=production
EOF

# Create PM2 config
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'procurement-ai-copilot',
    script: 'server.js',
    cwd: '/var/www/procurement-ai',
    instances: 1,
    exec_mode: 'fork',
    
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF

# Create Nginx config
echo "⚙️ Creating Nginx configuration..."
cat > /etc/nginx/sites-available/procurement-ai << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable Nginx site
echo "🌐 Configuring Nginx..."
ln -sf /etc/nginx/sites-available/procurement-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# Start application
echo "🚀 Starting application..."
cd /var/www/procurement-ai
pm2 delete procurement-ai-copilot 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Your Procurement AI Copilot is running at:"
echo "   🌐 http://168.231.115.219"
echo ""
echo "🔧 Check status:"
echo "   pm2 status"
echo "   pm2 logs procurement-ai-copilot"
echo ""
echo "📝 Test endpoints:"
echo "   http://168.231.115.219/sample-data"
echo "   http://168.231.115.219/"
echo ""