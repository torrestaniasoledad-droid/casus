import clsx from "clsx";

type Risk = "BAJO" | "REVISAR" | "ALTO";

const CONFIG: Record<Risk, { label: string; dot: string; bg: string; text: string }> = {
  BAJO: { label: "Riesgo bajo", dot: "bg-ok", bg: "bg-ok-soft", text: "text-ok" },
  REVISAR: { label: "Para revisar", dot: "bg-warn", bg: "bg-warn-soft", text: "text-warn" },
  ALTO: { label: "Riesgo alto", dot: "bg-danger", bg: "bg-danger-soft", text: "text-danger" },
};

export function RiskBadge({ level }: { level: Risk }) {
  const c = CONFIG[level];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        c.bg,
        c.text
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
