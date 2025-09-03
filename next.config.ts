import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "d13ziab59z.ufs.sh"
      }
    ]
  }
};

export default nextConfig;
