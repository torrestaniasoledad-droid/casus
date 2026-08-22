import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GoogleIntegrationCard } from "@/components/integrations/GoogleIntegrationCard";

export default function IntegrationsPage() {
  return (
    <div className="max-w-lg">
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Volver a tu perfil
      </Link>

      <h1 className="font-display text-2xl text-ink mb-6">Integraciones</h1>

      <GoogleIntegrationCard />
    </div>
  );
}
