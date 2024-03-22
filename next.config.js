/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // set to false if you using production mode
  env: {
    DB_USERNAME: "",
    DB_PASSWORD: "",
    DB_NAME: "",
    DB_HOST: "",
    DB_PORT: 1433, //default sqlserver port is 1433
    USE_BCRYPT: true, // set false if not using password hash with bcrypt
    USE_AUTH_TOKEN: true, //set false if not using auth token
  },
};

module.exports = nextConfig;
