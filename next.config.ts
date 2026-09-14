import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Playwright dev server origin used by tests/e2e.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
