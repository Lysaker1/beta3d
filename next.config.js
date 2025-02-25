/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || [])];
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,  // Prevents 'fs' module from being bundled client-side
      };
    }
    return config;
  },
}

module.exports = nextConfig; 