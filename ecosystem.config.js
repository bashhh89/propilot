// PM2 configuration for Procurement AI Copilot
module.exports = {
  apps: [{
    name: 'procurement-ai-copilot',
    script: 'server.js',
    cwd: '/var/www/procurement-ai',
    instances: 2, // Use 2 instances for better performance
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logging
    log_file: '/var/log/pm2/procurement-ai.log',
    out_file: '/var/log/pm2/procurement-ai-out.log',
    error_file: '/var/log/pm2/procurement-ai-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart configuration
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    max_memory_restart: '1G',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Auto-restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};