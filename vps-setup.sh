#!/bin/bash

# VPS Setup Script for Procurement AI Copilot
# Run this script on your fresh Ubuntu 22.04 VPS

echo "🚀 Setting up VPS for Procurement AI Copilot..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Create app directory
sudo mkdir -p /var/www/procurement-ai
sudo chown -R $USER:$USER /var/www/procurement-ai

# Install SSL certificate tool
sudo apt install certbot python3-certbot-nginx -y

echo "✅ Basic VPS setup complete!"
echo "Next steps:"
echo "1. Upload your application files to /var/www/procurement-ai"
echo "2. Configure environment variables"
echo "3. Set up Nginx reverse proxy"
echo "4. Start the application with PM2"