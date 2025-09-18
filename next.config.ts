// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ⚡ Completely ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚡ Skip type checking during builds
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
