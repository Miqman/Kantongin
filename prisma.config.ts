import { defineConfig, env } from '@prisma/config';
import { config } from 'dotenv';

// Load variables from .env file explicitly
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // For Prisma CLI (migrations/push), we MUST use the Direct URL to bypass connection pooling on Supabase
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
