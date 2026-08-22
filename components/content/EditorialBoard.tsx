"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { EDITORIAL_STATUS_LABEL, EDITORIAL_STATUS_ORDER, FORMAT_LABEL } from "@/lib/labels";
import { NewIdeaForm } from "./NewIdeaForm";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface EditorialItem {
  id: string;
  title: string | null;
  format: string | null;
  editorialStatus: string;
  scheduledFor: string | null; // ISO
}

// Un acento de color por columna, para que el ojo distinga el estado sin
// tener que leer cada tarjeta — mismos tokens que ya usa RiskBadge.
const COLUMN_ACCENT: Record<string, string> = {
  IDEA: "border-t-ink-muted",
  EN_PROCESO: "border-t-accent",
  LISTO: "border-t-primary",
  PROGRAMADO: "border-t-warn",
  PUBLICADO: "border-t-ok",
  NO_UTILIZAR: "border-t-danger",
};

function StatusCard({
  item,
  pending,
  onMove,
}: {
  item: EditorialItem;
  pending: boolean;
  onMove: (id: string, status: string) => void;
}) {
  return (
    <Card className="p-3 flex flex-col gap-2">
      <Link href={`/dashboard/library/${item.id}`} className="hover:underline">
        <div className="text-sm font-medium line-clamp-2">{item.title ?? "Sin título"}</div>
      </Link>
      <div className="text-xs text-ink-muted flex items-center justify-between gap-2">
        <span>{item.format ? FORMAT_LABEL[item.format] : "Idea suelta"}</span>
        {item.scheduledFor && (
          <span>
            {new Date(item.scheduledFor).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
      <select
        value={item.editorialStatus}
        disabled={pending}
        onChange={(e) => onMove(item.id, e.target.value)}
        className="w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink-muted focus:border-primary outline-none disabled:opacity-50"
        aria-label={`Mover "${item.title ?? "contenido"}" a otro estado`}
      >
        {EDITORIAL_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            Mover a: {EDITORIAL_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </Card>
  );
}

/**
 * Checklist editorial en columnas por estado. Sin drag-and-drop a
 * propósito (ver auditoría) — mover una tarjeta es un select "Mover a",
 * mismo nivel de esfuerzo que ya usan otras acciones de Biblioteca.
 * "No utilizar" queda colapsada por default para no ensuciar la vista.
 */
export function EditorialBoard({ items }: { items: EditorialItem[] }) {
  const router = useRouter();
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, EditorialItem[]>();
    for (const status of EDITORIAL_STATUS_ORDER) map.set(status, []);
    for (const item of items) {
      map.get(item.editorialStatus)?.push(item);
    }
    return map;
  }, [items]);

  async function handleMove(id: string, status: string) {
    setPendingId(id);
    const res = await fetch(`/api/content/${id}/editorial`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editorialStatus: status }),
    });
    setPendingId(null);
    if (res.ok) router.refresh();
  }

  const visibleColumns = EDITORIAL_STATUS_ORDER.filter((s) => s !== "NO_UTILIZAR");
  const discarded = grouped.get("NO_UTILIZAR") ?? [];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleColumns.map((status) => {
          const columnItems = grouped.get(status) ?? [];
          return (
            <div key={status} className={`border-t-2 pt-3 ${COLUMN_ACCENT[status]}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ink">{EDITORIAL_STATUS_LABEL[status]}</h3>
                <span className="text-xs text-ink-muted">{columnItems.length}</span>
              </div>

              <div className="flex flex-col gap-2">
                {status === "IDEA" && <NewIdeaForm />}

                {columnItems.length === 0 && status !== "IDEA" && (
                  <p className="text-xs text-ink-muted">Nada acá todavía.</p>
                )}

                {columnItems.map((item) => (
                  <StatusCard key={item.id} item={item} pending={pendingId === item.id} onMove={handleMove} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowDiscarded((v) => !v)}
        className="mt-6 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-primary"
      >
        {showDiscarded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {showDiscarded ? "Ocultar descartados" : `Mostrar descartados (${discarded.length})`}
      </button>

      {showDiscarded && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
          {discarded.length === 0 && <p className="text-xs text-ink-muted">No hay contenidos descartados.</p>}
          {discarded.map((item) => (
            <div key={item.id} className="opacity-70">
              <StatusCard item={item} pending={pendingId === item.id} onMove={handleMove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
