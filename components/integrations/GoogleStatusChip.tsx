"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface StatusResponse {
  allowed: boolean;
  connected: boolean;
  status: string;
  googleEmail: string | null;
}

/**
 * Chip compacto para la parte de arriba del calendario — la gestión
 * completa (conectar/desconectar) vive en /dashboard/integrations, esto
 * solo resume el estado y linkea para allá.
 */
export function GoogleStatusChip() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations/google/status")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-5 text-xs text-ink-muted flex items-center gap-1.5">
        <Loader2 size={12} className="animate-spin" /> Cargando estado de Google...
      </div>
    );
  }
  if (!data) return null;

  if (!data.allowed) {
    return (
      <Link
        href="/dashboard/plans"
        className="mb-5 flex items-center justify-between gap-3 rounded-md border border-line bg-primary-soft px-4 py-2.5 text-sm text-primary hover:bg-primary-soft/70"
      >
        <span>Sincronizá tu calendario con Google Sheets — disponible en Pro y Premium.</span>
        <span className="font-medium shrink-0">Ver planes →</span>
      </Link>
    );
  }

  if (data.status === "NEEDS_REAUTH") {
    return (
      <Link
        href="/dashboard/integrations"
        className="mb-5 flex items-center justify-between gap-3 rounded-md border border-line bg-warn-soft px-4 py-2.5 text-sm text-warn hover:bg-warn-soft/70"
      >
        <span>Tu conexión con Google expiró. Reconectá para seguir sincronizando.</span>
        <span className="font-medium shrink-0">Reconectar →</span>
      </Link>
    );
  }

  if (data.connected) {
    return (
      <Link
        href="/dashboard/integrations"
        className="mb-5 flex items-center justify-between gap-3 rounded-md border border-line bg-ok-soft px-4 py-2.5 text-sm text-ok hover:bg-ok-soft/70"
      >
        <span>Conectado a Google como {data.googleEmail}.</span>
        <span className="font-medium shrink-0">Gestionar →</span>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/integrations"
      className="mb-5 flex items-center justify-between gap-3 rounded-md border border-line px-4 py-2.5 text-sm text-ink-muted hover:border-primary/40 hover:text-primary"
    >
      <span>Conectá Google Drive para organizar este calendario en una planilla.</span>
      <span className="font-medium shrink-0">Conectar →</span>
    </Link>
  );
}
