#!/bin/bash
# Server Configuration Script for Hostinger / Oracle Cloud / Ubuntu VPS
# Automatically provisions MySQL, Redis, PM2, and NGINX safely.

echo "======================================"
echo "Initializing VPS Enterprise Deployment"
echo "======================================"

# 1. Update Server
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js & NPM
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Nginx
sudo apt-get install -y nginx
sudo ufw allow 'Nginx Full'

# 4. Install Docker & Docker Compose (For MySQL & Redis logic)
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# 5. Bring up MySQL and Redis Databases via Docker
sudo docker-compose up -d

# 6. Global Packages: PM2 & Typescript
sudo npm install -g pm2 typescript ts-node

# 7. Setup Application (Assume code is cloned here)
cd backend
npm install

# 8. Migrate MySQL Database
npx prisma generate
npx prisma db push

# 9. Start PM2 Cluster
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 10. Copy NGINX Config & Reload
sudo cp ../nginx.example.conf /etc/nginx/sites-available/whatsapp_saas
sudo ln -s /etc/nginx/sites-available/whatsapp_saas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "======================================"
echo "DEPLOYMENT COMPLETE. SYSTEM ONLINE!"
echo "Server is now Nginx, PM2, Redis, and MySQL Ready."
echo "======================================"
