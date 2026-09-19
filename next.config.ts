import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingIncludes: {
    "/build/[slug]": ["./python/agentic_lab/lessons/**"],
  },
};

export default nextConfig;
