import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const registerSchema = z.object({
  email: z.string().email("Ingresá un email válido.").max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(200),
});

export async function POST(req: Request) {
  // Límite laxo por IP: frena bots de registro masivo sin afectar a un
  // usuario real que se equivoca un par de veces con la contraseña.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`register:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos de registro. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        subscription: { create: { plan: "FREE" } },
        settings: { create: {} },
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Probá de nuevo en unos minutos." },
      { status: 500 }
    );
  }
}
