"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Copy, Trash2 } from "lucide-react";
import { FORMAT_LABEL, OBJECTIVE_LABEL, STATUS_LABEL } from "@/lib/labels";

export interface LibraryItem {
  id: string;
  title: string | null;
  format: string | null;
  objective: string | null;
  status: string;
  riskLevel: string | null;
  createdAt: string;
}

const TABS: { value: string; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "REEL", label: "Reels" },
  { value: "CARRUSEL", label: "Carruseles" },
  { value: "POST", label: "Posts" },
  { value: "STORIES", label: "Stories" },
];

export function LibraryList({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("TODOS");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (tab === "TODOS" ? items : items.filter((i) => i.format === tab)),
    [items, tab]
  );

  async function handleDuplicate(id: string) {
    setError(null);
    setPendingId(id);
    const res = await fetch(`/api/content/${id}/duplicate`, { method: "POST" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos duplicar el contenido.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este contenido? Esta acción no se puede deshacer.")) return;
    setError(null);
    setPendingId(id);
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos eliminar el contenido.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="inline-flex flex-wrap gap-1 rounded-md border border-line p-1 mb-5 bg-surface">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${
              tab === t.value ? "bg-primary-soft text-primary" : "text-ink-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-danger mb-4" role="alert">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <Card className="text-sm text-ink-muted">
          No hay contenidos en esta categoría todavía.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-ink-muted mb-1">
                    {item.format ? FORMAT_LABEL[item.format] : "Sin formato"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                  <Link href={`/dashboard/library/${item.id}`} className="hover:underline">
                    <div className="font-medium text-sm line-clamp-2">
                      {item.title ?? "Contenido sin título"}
                    </div>
                  </Link>
                </div>
                {item.riskLevel && <RiskBadge level={item.riskLevel as any} />}
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{item.objective ? OBJECTIVE_LABEL[item.objective] : "Sin objetivo"}</span>
                <span className="rounded-full bg-primary-soft text-primary px-2 py-0.5">
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-line">
                <Link href={`/dashboard/library/${item.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Abrir
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === item.id}
                  onClick={() => handleDuplicate(item.id)}
                  title="Duplicar"
                  aria-label={`Duplicar ${item.title ?? "contenido"}`}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  title="Eliminar"
                  aria-label={`Eliminar ${item.title ?? "contenido"}`}
                  className="text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
