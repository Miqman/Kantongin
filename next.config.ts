import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for Next.js 15+ Turbopack failing to resolve prisma generated client
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
