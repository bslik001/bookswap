import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Base de donnees
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),

  // Africa's Talking
  AT_API_KEY: z.string().min(1),
  AT_USERNAME: z.string().min(1),
  AT_SENDER_ID: z.string().min(1),

  // App
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().min(1),

  // Observabilite (optionnel)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? 0 : Number(v)))
    .pipe(z.number().min(0).max(1)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger not available yet (depends on env), use stderr directly
  process.stderr.write("Variables d'environnement invalides:\n");
  process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) + '\n');
  process.exit(1);
}

export const env = parsed.data;
