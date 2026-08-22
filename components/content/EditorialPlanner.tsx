"use client";

import { useState } from "react";
import { EditorialBoard, type EditorialItem } from "./EditorialBoard";
import { EditorialCalendar } from "./EditorialCalendar";

const TABS = [
  { value: "CHECKLIST", label: "Checklist" },
  { value: "CALENDARIO", label: "Calendario" },
] as const;

export function EditorialPlanner({ items }: { items: EditorialItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("CHECKLIST");

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

      {tab === "CHECKLIST" ? <EditorialBoard items={items} /> : <EditorialCalendar items={items} />}
    </div>
  );
}
