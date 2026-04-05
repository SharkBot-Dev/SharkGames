module.exports = {
  apps: [
    {
      name: "sharkgames-api",
      script: "/home/neko/Desktop/SharkGamesV2/.venv/bin/python",
      args: [
        "-m", "uvicorn",
        "main:app",
        "--host", "0.0.0.0",
        "--port", "8010",
        "--workers", "2"
      ],
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      env: {
        PYTHONPATH: "."
      }
    }
  ]
};