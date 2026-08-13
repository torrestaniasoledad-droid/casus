import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Necesitás iniciar sesión." }, { status: 401 });

  const original = await prisma.content.findUnique({
    where: { id: params.id },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!original || original.userId !== userId) {
    return NextResponse.json({ error: "No encontramos ese contenido." }, { status: 404 });
  }

  const latestVersion = original.versions[0];

  const duplicate = await prisma.content.create({
    data: {
      userId,
      title: original.title ? `${original.title} (copia)` : null,
      objective: original.objective,
      format: original.format,
      status: original.status,
      riskLevel: original.riskLevel,
      clinicalLearning: original.clinicalLearning,
      deidentifiedInput: original.deidentifiedInput,
      versions: latestVersion
        ? {
            create: {
              hook: latestVersion.hook,
              script: latestVersion.script,
              caption: latestVersion.caption,
              cta: latestVersion.cta,
              hashtags: latestVersion.hashtags,
              raw: latestVersion.raw ?? undefined,
            },
          }
        : undefined,
    },
  });

  return NextResponse.json({ id: duplicate.id });
}
