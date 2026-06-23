/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lab-app/shared"],
  output: "standalone",
};

module.exports = nextConfig;
