import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // The concierge route reads request-scoped cookies and writing is done via
    // server routes; nothing special is required here beyond sane defaults.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
