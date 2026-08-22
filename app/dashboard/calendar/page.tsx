import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { EditorialPlanner } from "@/components/content/EditorialPlanner";
import { GoogleStatusChip } from "@/components/integrations/GoogleStatusChip";
import type { EditorialItem } from "@/components/content/EditorialBoard";
import { dateColumnToCalendarDateString } from "@/lib/dateOnly";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const contents = await prisma.content.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const items: EditorialItem[] = contents.map((c) => ({
    id: c.id,
    title: c.title,
    format: c.format,
    editorialStatus: c.editorialStatus,
    scheduledFor: c.scheduledFor ? dateColumnToCalendarDateString(c.scheduledFor) : null,
  }));

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-2xl text-ink mb-2">Calendario editorial</h1>
      <p className="text-ink-muted text-sm mb-5">
        Organizá tus contenidos de idea a publicado, y programá cuándo salen.
      </p>

      <GoogleStatusChip />

      <EditorialPlanner items={items} />
    </div>
  );
}
