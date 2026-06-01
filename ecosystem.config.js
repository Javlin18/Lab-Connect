module.exports = {
  apps: [
    {
      name: "api",
      script: "apps/api/dist/main.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      autorestart: true,
      max_memory_restart: "400M"
    },
    {
      name: "web",
      script: "pnpm",
      args: "start --port 3000",
      cwd: "./apps/web",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      autorestart: true,
      max_memory_restart: "400M"
    }
  ]
};
