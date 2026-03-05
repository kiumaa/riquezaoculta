import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  KB_AGENCY_API_KEY: z.string().optional(),
  KB_AGENCY_WEBHOOK_SECRET: z.string().optional(),
  BULKGATE_APP_ID: z.string().optional(),
  BULKGATE_APP_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  PUSHCUT_URL: z.string().url().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
