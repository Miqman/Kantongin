import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Fix for Next.js 15+ Turbopack failing to resolve prisma generated client
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
  turbopack: {}, // Silences the warning because Serwist adds Webpack config but we disable Serwist in dev
};

export default withSerwist(nextConfig);
