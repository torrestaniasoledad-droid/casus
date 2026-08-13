import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { LibraryList, type LibraryItem } from "@/components/content/LibraryList";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const contents = await prisma.content.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const items: LibraryItem[] = contents.map((c) => ({
    id: c.id,
    title: c.title,
    format: c.format,
    objective: c.objective,
    status: c.status,
    riskLevel: c.riskLevel,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-ink mb-6">Biblioteca</h1>
      <LibraryList items={items} />
    </div>
  );
}
