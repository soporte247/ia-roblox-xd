module.exports = {
  apps: [
    {
      name: 'datashark-ia',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Reintentar 5 veces antes de dar por perdido
      max_restarts: 5,
      min_uptime: '10s',
      // Reiniciar automáticamente si hay un crash
      autorestart: true,
      // Esperar 2 segundos entre reintentos
      wait_ready: true,
      kill_timeout: 5000,
      // Capturar logs con timestamp
      merge_logs: true
    }
  ]
};
