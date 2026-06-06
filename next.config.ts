import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    // Allow larger request bodies for file uploads (20 MB)
  },
};

export default nextConfig;
