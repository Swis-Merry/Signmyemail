/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "sharp"],
  },
};

export default nextConfig;
