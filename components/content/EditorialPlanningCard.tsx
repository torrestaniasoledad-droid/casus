"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { EDITORIAL_STATUS_LABEL, EDITORIAL_STATUS_ORDER } from "@/lib/labels";

interface Props {
  contentId: string;
  editorialStatus: string;
  scheduledFor: string | null; // "YYYY-MM-DD" o null
  channel: string | null;
  editorialNote: string | null;
}

/**
 * Sección de planificación dentro del detalle de un contenido
 * (/dashboard/library/[id]). Guarda contra /api/content/[id]/editorial, NO
 * contra el PATCH de ContentEditor — son dos cosas distintas (planificación
 * vs. edición del contenido generado, ver comentario en esa ruta).
 */
export function EditorialPlanningCard(props: Props) {
  const router = useRouter();
  const [editorialStatus, setEditorialStatus] = useState(props.editorialStatus);
  const [scheduledFor, setScheduledFor] = useState(props.scheduledFor ?? "");
  const [channel, setChannel] = useState(props.channel ?? "");
  const [editorialNote, setEditorialNote] = useState(props.editorialNote ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/content/${props.contentId}/editorial`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editorialStatus,
        scheduledFor: scheduledFor || null,
        channel: channel || null,
        editorialNote: editorialNote || null,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos guardar la planificación.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4 mb-5">
      <h2 className="text-sm font-medium text-ink">Planificación editorial</h2>

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">Estado</label>
        <select
          value={editorialStatus}
          onChange={(e) => setEditorialStatus(e.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        >
          {EDITORIAL_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {EDITORIAL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">
            Fecha programada
          </label>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">Canal</label>
          <input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="instagram, tiktok..."
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">Nota</label>
        <textarea
          value={editorialNote}
          onChange={(e) => setEditorialNote(e.target.value)}
          rows={2}
          className="w-full resize-y rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-ok">Planificación guardada.</p>}

      <div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar planificación"}
        </Button>
      </div>
    </Card>
  );
}
