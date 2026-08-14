"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Copy, Trash2, Save } from "lucide-react";

interface Props {
  contentId: string;
  format: "REEL" | "CARRUSEL" | "POST" | "STORIES";
  title: string | null;
  hook: string | null;
  script: string | null; // texto plano (REEL/POST) o JSON array (CARRUSEL/STORIES)
  caption: string | null;
  cta: string | null;
  hashtags: string | null;
  createdAt: string;
}

const SCRIPT_LABEL: Record<Props["format"], string> = {
  REEL: "Guion",
  POST: "Desarrollo",
  CARRUSEL: "Slides (una línea por slide)",
  STORIES: "Historias (una línea por historia)",
};

function scriptToText(format: Props["format"], script: string | null): string {
  if (!script) return "";
  if (format === "CARRUSEL" || format === "STORIES") {
    try {
      const arr = JSON.parse(script);
      return Array.isArray(arr) ? arr.join("\n") : script;
    } catch {
      return script;
    }
  }
  return script;
}

function textToScript(format: Props["format"], text: string): string {
  if (format === "CARRUSEL" || format === "STORIES") {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    return JSON.stringify(lines);
  }
  return text;
}

export function ContentEditor(props: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(props.title ?? "");
  const [hook, setHook] = useState(props.hook ?? "");
  const [scriptText, setScriptText] = useState(scriptToText(props.format, props.script));
  const [caption, setCaption] = useState(props.caption ?? "");
  const [cta, setCta] = useState(props.cta ?? "");
  const [hashtags, setHashtags] = useState(props.hashtags ?? "");

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/content/${props.contentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || undefined,
        hook,
        script: textToScript(props.format, scriptText),
        caption: props.format === "STORIES" ? null : caption,
        cta,
        hashtags: props.format === "STORIES" ? null : hashtags,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos guardar los cambios.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleDuplicate() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/content/${props.contentId}/duplicate`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos duplicar el contenido.");
      return;
    }
    const data = await res.json();
    router.push(`/dashboard/library/${data.id}`);
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este contenido? Esta acción no se puede deshacer.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/content/${props.contentId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos eliminar el contenido.");
      return;
    }
    router.push("/dashboard/library");
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="text-xs text-ink-muted">
        Creado el{" "}
        {new Date(props.createdAt).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </div>

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">
          Título
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">Hook</label>
        <textarea
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          className="w-full min-h-[60px] resize-y rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">
          {SCRIPT_LABEL[props.format]}
        </label>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          className="w-full min-h-[140px] resize-y rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        />
      </div>

      {props.format !== "STORIES" && (
        <div>
          <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">
            Copy
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full min-h-[70px] resize-y rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">CTA</label>
        <input
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
        />
      </div>

      {props.format !== "STORIES" && (
        <div>
          <label className="block text-xs text-ink-muted uppercase tracking-wide mb-1">
            Hashtags
          </label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-ok">Cambios guardados.</p>}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button variant="secondary" onClick={handleDuplicate} disabled={busy}>
          <Copy size={16} />
          Duplicar
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={busy}
          className="text-danger hover:bg-danger-soft"
        >
          <Trash2 size={16} />
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
