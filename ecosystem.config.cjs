module.exports = {
  apps: [
    {
      name: "sharkgames",
      script: "./server/dist/index.js",
      cwd: "/home/neko/Desktop/SharkGamesV2",
      exec_mode: "cluster",
      instances: "max",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: "8010",
      }
    }
  ]
};