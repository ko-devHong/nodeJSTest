module.exports = {
  apps: [
    {
      script: "hello.js",
      watch: true,
      env: {
        NODE_ENV: "development",
        watch: false,
      },
      env_dev: {
        name: "thisdev",
        NODE_ENV: "production",
        watch: false,
      },
      env_production: {
        NODE_ENV: "production",
        watch: false,
      },
    },
  ],

  deploy: {
    production: {
      user: "SSH_USERNAME",
      host: "SSH_HOSTMACHINE",
      ref: "origin/master",
      repo: "GIT_REPOSITORY",
      path: "DESTINATION_PATH",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
