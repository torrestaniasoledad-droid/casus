"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, ExternalLink } from "lucide-react";

interface StatusResponse {
  allowed: boolean;
  connected: boolean;
  status: string;
  googleEmail: string | null;
  sheetUrl: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
}

function errorMessageFor(code: string): string {
  switch (code) {
    case "denied":
      return "Cancelaste la conexión con Google.";
    case "invalid_state":
      return "No pudimos validar la conexión con Google. Probá de nuevo.";
    case "token_exchange_failed":
    case "userinfo_failed":
      return "No pudimos completar la conexión con Google. Probá de nuevo.";
    case "not_configured":
      return "La conexión con Google no está disponible en este momento. Avisá al equipo.";
    default:
      return "Ocurrió un error conectando con Google.";
  }
}

/** Gestión completa de la conexión con Google: conectar, ver estado, desconectar. */
export function GoogleIntegrationCard() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadStatus() {
    setLoading(true);
    fetch("/api/integrations/google/status")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("No pudimos cargar el estado de la conexión."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStatus();

    // Si venimos del redirect de /api/integrations/google/callback, mostrar
    // el error si lo hubo (el éxito ya se refleja solo en el status).
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");
    if (errorCode) setError(errorMessageFor(errorCode));
  }, []);

  async function handleConnect() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/integrations/google/connect", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(json.error ?? "No pudimos iniciar la conexión con Google.");
      return;
    }
    window.location.href = json.authUrl;
  }

  async function handleSync() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/integrations/google/sync", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No pudimos sincronizar.");
      return;
    }
    loadStatus();
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar Google Drive? Vas a poder reconectar cuando quieras.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/integrations/google/disconnect", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No pudimos desconectar.");
      return;
    }
    loadStatus();
  }

  if (loading) {
    return (
      <Card className="flex items-center gap-2 text-sm text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Cargando...
      </Card>
    );
  }

  if (!data) {
    return <Card className="text-sm text-danger">No pudimos cargar el estado de la conexión.</Card>;
  }

  if (!data.allowed) {
    return (
      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-ink mb-1">Google Drive</h2>
          <p className="text-sm text-ink-muted">
            Sincronizar tu calendario editorial con una planilla de Google Sheets está disponible
            en los planes Pro y Premium.
          </p>
        </div>
        <a href="/dashboard/plans" className="w-fit">
          <Button size="sm">Ver planes</Button>
        </a>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-medium text-ink mb-1">Google Drive</h2>
        <p className="text-sm text-ink-muted">
          CASUS crea una carpeta y una planilla en tu Drive para que veas tu calendario editorial
          también desde ahí. Vos seguís editando desde CASUS — la planilla es de solo lectura.
        </p>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {data.status === "NEEDS_REAUTH" && (
        <p className="text-sm text-warn">
          Tu conexión con Google expiró o fue revocada. Reconectá para seguir sincronizando.
        </p>
      )}

      {data.connected || data.status === "NEEDS_REAUTH" ? (
        <>
          {data.connected && (
            <div className="text-sm text-ink">
              Conectado como <span className="font-medium">{data.googleEmail}</span>
            </div>
          )}
          {data.sheetUrl && (
            <a
              href={data.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
            >
              Abrir planilla <ExternalLink size={14} />
            </a>
          )}

          {data.connected && (
            <div className="text-xs text-ink-muted">
              {data.lastSyncAt
                ? `Última sincronización: ${new Date(data.lastSyncAt).toLocaleString("es-AR")}`
                : "Todavía no se sincronizó."}
            </div>
          )}
          {data.lastSyncError && (
            <p className="text-xs text-danger">No pudimos sincronizar la última vez: {data.lastSyncError}</p>
          )}

          <div className="flex gap-2 pt-1">
            {data.status === "NEEDS_REAUTH" && (
              <Button size="sm" onClick={handleConnect} disabled={busy}>
                Reconectar
              </Button>
            )}
            {data.connected && (
              <Button size="sm" variant="secondary" onClick={handleSync} disabled={busy}>
                {busy ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={busy}
              className="text-danger hover:bg-danger-soft"
            >
              Desconectar
            </Button>
          </div>
        </>
      ) : (
        <Button size="sm" onClick={handleConnect} disabled={busy} className="w-fit">
          {busy ? "Redirigiendo..." : "Conectar Google Drive"}
        </Button>
      )}
    </Card>
  );
}
