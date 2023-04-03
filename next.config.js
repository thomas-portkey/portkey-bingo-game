const rewrites = require('./rewrites');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.APP_ENV,
  },
  async rewrites() {
    return rewrites;
  },
};

const withTM = require('next-transpile-modules')(['antd-mobile', '@portkey/did-ui-react']);

module.exports = withTM(nextConfig);
