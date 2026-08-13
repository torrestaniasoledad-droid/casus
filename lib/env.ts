import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL."),
  NEXTAUTH_SECRET: z.string().min(1, "Falta NEXTAUTH_SECRET."),
  ANTHROPIC_API_KEY: z.string().min(1, "Falta ANTHROPIC_API_KEY."),
});

/**
 * Se importa una sola vez desde cada entrypoint sensible (rutas de API que
 * usan IA o DB). Si falta una variable, tira un error explícito y legible
 * en los logs del servidor en vez de fallar más adelante con un mensaje
 * críptico de Prisma o del SDK de Anthropic.
 */
export function assertEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.message).join(" ");
    // eslint-disable-next-line no-console
    console.error(`[CASUS] Configuración incompleta: ${missing}`);
    throw new Error(`Configuración del servidor incompleta: ${missing}`);
  }
}
