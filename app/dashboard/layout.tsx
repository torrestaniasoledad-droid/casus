import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile?.onboardedAt) redirect("/onboarding");

  return <DashboardShell displayName={profile.displayName}>{children}</DashboardShell>;
}
