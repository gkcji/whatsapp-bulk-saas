export default {
  apps: [
    {
      name: 'whatsapp-saas-backend',
      script: 'node_modules/.bin/ts-node',
      args: 'src/index.ts',
      instances: 'max', // Scale across all available CPU cores
      exec_mode: 'cluster', // Enables clustering
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
