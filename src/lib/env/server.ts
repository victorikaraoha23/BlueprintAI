import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_API_URL: z.string().url().optional(),
  VERCEL_BLOB_READ_WRITE_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  BRAVE_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
