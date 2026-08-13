import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const onboardingSchema = z.object({
  displayName: z.string().min(1, "Ingresá tu nombre.").max(100),
  profession: z.string().min(1, "Elegí tu profesión.").max(100),
  specialty: z.string().max(150).optional(),
  targetAudience: z.string().max(150).optional(),
  mainNetwork: z.string().max(100).optional(),
  mainGoal: z.string().min(1, "Elegí tu objetivo principal.").max(50),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  }

  const parsed = onboardingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...parsed.data, onboardedAt: new Date() },
    update: { ...parsed.data, onboardedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
