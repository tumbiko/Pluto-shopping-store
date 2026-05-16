import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* existing config options */
  experimental: {
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
};

export default nextConfig;
