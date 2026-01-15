import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.frgroup.kz',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'media.partner.frgroup.kz',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
