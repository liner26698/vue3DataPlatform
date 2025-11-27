module.exports = {
  apps: [
    {
      name: "koa-server",
      script: "/home/dataPlatform/server/koaapp-production.js",
      watch: false,
      env: {},
      interpreter: "/root/.nvm/versions/node/v21.7.3/bin/node"
    },
    {
      name: "scheduler",
      script: "/home/dataPlatform/server/scheduleCrawler.js",
      watch: false,
      env: {},
      interpreter: "/root/.nvm/versions/node/v21.7.3/bin/node"
    }
  ]
};
