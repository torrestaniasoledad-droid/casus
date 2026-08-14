import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Format } from "./ObjectiveFormatPicker";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</div>
      <p className="text-sm text-ink whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function VisualSuggestion({ points }: { points: string[] }) {
  return (
    <div className="rounded-md bg-accent-soft/60 border border-accent/20 overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Lightbulb size={16} className="text-accent shrink-0" />
        <div className="text-xs text-accent uppercase tracking-wide font-medium">
          Ideas para grabar/diseñar
        </div>
      </div>
      <ul className="divide-y divide-accent/15">
        {points.map((point, i) => (
          <li key={i} className="flex gap-2 px-3 py-2 text-sm text-ink">
            <span className="text-accent shrink-0">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GeneratedContent({ format, data }: { format: Format; data: any }) {
  if (format === "REEL") {
    return (
      <Card className="flex flex-col gap-4">
        <Field label="Hook" value={data.hook} />
        <Field label="Guion" value={data.script} />
        <Field label="Texto hablado" value={data.spoken_text} />
        <Field label="CTA" value={data.cta} />
        <Field label="Caption" value={data.caption} />
        <Field label="Hashtags" value={data.hashtags.join(" ")} />
        <VisualSuggestion points={data.visual_suggestion} />
      </Card>
    );
  }

  if (format === "CARRUSEL") {
    return (
      <Card className="flex flex-col gap-4">
        <div>
          <div className="text-xs text-ink-muted uppercase tracking-wide mb-2">
            Slides ({data.slides.length})
          </div>
          <div className="flex flex-col gap-2">
            {data.slides.map((slide: string, i: number) => (
              <div key={i} className="rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-ink-muted mr-2">{i + 1}.</span>
                {slide}
              </div>
            ))}
          </div>
        </div>
        <Field label="CTA" value={data.cta} />
        <Field label="Caption" value={data.caption} />
        <Field label="Hashtags" value={data.hashtags.join(" ")} />
        <VisualSuggestion points={data.visual_suggestion} />
      </Card>
    );
  }

  if (format === "STORIES") {
    return (
      <Card className="flex flex-col gap-4">
        <div>
          <div className="text-xs text-ink-muted uppercase tracking-wide mb-2">
            Historias ({data.stories.length})
          </div>
          <div className="flex flex-col gap-2">
            {data.stories.map((story: string, i: number) => (
              <div key={i} className="rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-ink-muted mr-2">{i + 1}.</span>
                {story}
              </div>
            ))}
          </div>
        </div>
        <Field label="CTA" value={data.cta} />
        <VisualSuggestion points={data.visual_suggestion} />
      </Card>
    );
  }

  // POST
  return (
    <Card className="flex flex-col gap-4">
      <Field label="Hook" value={data.hook} />
      <Field label="Desarrollo" value={data.desarrollo} />
      <Field label="CTA" value={data.cta} />
      <Field label="Caption" value={data.caption} />
      <Field label="Hashtags" value={data.hashtags.join(" ")} />
      <VisualSuggestion points={data.visual_suggestion} />
    </Card>
  );
}
