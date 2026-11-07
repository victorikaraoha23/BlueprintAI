/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@neondatabase/serverless"],
};

module.exports = nextConfig;
