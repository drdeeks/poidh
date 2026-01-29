/**
 * PM2 Ecosystem Configuration
 * 
 * Start with: pm2 start ecosystem.config.js
 * View logs: pm2 logs
 * Monitor: pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'bounty-bot',
      script: 'dist/scripts/continuous-bounty-loop.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },
    {
      name: 'streaming-server',
      script: 'dist/server/streaming-server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      env: {
        NODE_ENV: 'production',
        STREAMING_PORT: 3001,
        POLL_INTERVAL: 5,
        LOG_LEVEL: 'info',
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M',
    },
  ],
};
