/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "sharp"],
    outputFileTracingIncludes: { "/api/public/signatures/[token]/card": ["./assets/card/**"] },
  },
};

export default nextConfig;
