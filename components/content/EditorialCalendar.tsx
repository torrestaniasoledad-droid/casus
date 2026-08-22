"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, isSameDay } from "@/lib/calendarGrid";
import { FORMAT_LABEL } from "@/lib/labels";
import type { EditorialItem } from "./EditorialBoard";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Grilla mensual en desktop; en mobile, una grilla de 7 columnas es poco
 * usable, así que se muestra una agenda (lista agrupada por fecha) con los
 * mismos datos — se conmuta con CSS (`md:`), sin duplicar el fetch.
 */
export function EditorialCalendar({ items }: { items: EditorialItem[] }) {
  const scheduled = useMemo(
    () => items.filter((i): i is EditorialItem & { scheduledFor: string } => !!i.scheduledFor),
    [items]
  );

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const weeks = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const itemsThisMonth = useMemo(
    () =>
      scheduled
        .filter((i) => {
          const d = new Date(i.scheduledFor);
          return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
        })
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()),
    [scheduled, cursor]
  );

  function itemsForDay(day: Date) {
    return scheduled.filter((i) => isSameDay(new Date(i.scheduledFor), day));
  }

  const monthLabel = cursor.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink capitalize">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Grilla mensual — desktop/tablet */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 text-xs text-ink-muted mb-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-line rounded-md overflow-hidden border border-line">
          {weeks.flat().map(({ date, inMonth }, i) => {
            const dayItems = itemsForDay(date);
            const isToday = isSameDay(date, today);
            return (
              <div key={i} className={`bg-surface min-h-[92px] p-1.5 ${!inMonth ? "opacity-40" : ""}`}>
                <div
                  className={`text-xs mb-1 inline-flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-white w-5 h-5" : "text-ink-muted"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="flex flex-col gap-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/library/${item.id}`}
                      className="block text-xs bg-primary-soft text-primary rounded px-1.5 py-0.5 truncate hover:underline"
                      title={item.title ?? "Sin título"}
                    >
                      {item.title ?? "Sin título"}
                    </Link>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-xs text-ink-muted">+{dayItems.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda — mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {itemsThisMonth.length === 0 && (
          <Card className="text-sm text-ink-muted">No hay nada programado este mes.</Card>
        )}
        {itemsThisMonth.map((item) => (
          <Link key={item.id} href={`/dashboard/library/${item.id}`}>
            <Card className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-ink-muted mb-1">
                  {new Date(item.scheduledFor).toLocaleDateString("es-AR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                <div className="text-sm font-medium line-clamp-2">{item.title ?? "Sin título"}</div>
              </div>
              {item.format && (
                <span className="text-xs text-ink-muted shrink-0">{FORMAT_LABEL[item.format]}</span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
