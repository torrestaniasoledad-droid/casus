"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PenLine, Mic, Loader2 } from "lucide-react";
import { PrivacyReview, type DetectedItem } from "@/components/content/PrivacyReview";
import { RiskSummary } from "@/components/content/RiskSummary";
import {
  ObjectiveFormatPicker,
  type Objective,
  type Format,
} from "@/components/content/ObjectiveFormatPicker";
import { GeneratedContent } from "@/components/content/GeneratedContent";

type Mode = "escribir" | "dictar";
type AnalyzeStage = "idle" | "analyzing" | "protecting" | "learning" | "done" | "error";
type GenerateStage = "idle" | "building" | "preparing" | "done" | "error";

const ANALYZE_STAGE_LABEL: Record<AnalyzeStage, string> = {
  idle: "",
  analyzing: "Analizando tu experiencia...",
  protecting: "Protegiendo la información sensible...",
  learning: "Identificando el aprendizaje...",
  done: "",
  error: "",
};

const GENERATE_STAGE_LABEL: Record<GenerateStage, string> = {
  idle: "",
  building: "Construyendo tu contenido...",
  preparing: "Preparando tu publicación...",
  done: "",
  error: "",
};

interface AnalysisResult {
  contentId: string;
  detected: DetectedItem[];
  deidentifiedText: string;
  riskLevel: "BAJO" | "REVISAR" | "ALTO";
  riskExplanation: string;
  clinicalLearning: string;
}

export default function CreateContentPage() {
  const [mode, setMode] = useState<Mode>("escribir");
  const [text, setText] = useState("");
  const [analyzeStage, setAnalyzeStage] = useState<AnalyzeStage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [objective, setObjective] = useState<Objective | null>(null);
  const [format, setFormat] = useState<Format | null>(null);
  const [generateStage, setGenerateStage] = useState<GenerateStage>("idle");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ format: Format; data: any } | null>(null);

  async function handleAnalyze() {
    setErrorMsg(null);
    setResult(null);
    setGenerated(null);
    setAnalyzeStage("analyzing");

    const t1 = setTimeout(() => setAnalyzeStage("protecting"), 1400);
    const t2 = setTimeout(() => setAnalyzeStage("learning"), 3200);

    try {
      const res = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: text }),
      });
      const data = await res.json();

      clearTimeout(t1);
      clearTimeout(t2);

      if (!res.ok) {
        setAnalyzeStage("error");
        setErrorMsg(data.error ?? "No pudimos analizar tu experiencia. Probá de nuevo.");
        return;
      }

      setResult(data);
      setAnalyzeStage("done");
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setAnalyzeStage("error");
      setErrorMsg("No pudimos conectar con CASUS. Revisá tu conexión e intentá de nuevo.");
    }
  }

  async function handleGenerate() {
    if (!result || !objective || !format) return;
    setGenerateError(null);
    setGenerateStage("building");
    const t1 = setTimeout(() => setGenerateStage("preparing"), 1800);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: result.contentId, objective, format }),
      });
      const data = await res.json();
      clearTimeout(t1);

      if (!res.ok) {
        setGenerateStage("error");
        setGenerateError(data.error ?? "No pudimos generar tu contenido. Probá de nuevo.");
        return;
      }

      setGenerated({ format: data.format, data: data.data });
      setGenerateStage("done");
    } catch {
      clearTimeout(t1);
      setGenerateStage("error");
      setGenerateError("No pudimos conectar con CASUS. Revisá tu conexión e intentá de nuevo.");
    }
  }

  function handleStartOver() {
    setResult(null);
    setAnalyzeStage("idle");
    setErrorMsg(null);
    setText("");
    setObjective(null);
    setFormat(null);
    setGenerated(null);
    setGenerateStage("idle");
    setGenerateError(null);
  }

  const isBusyAnalyzing =
    analyzeStage === "analyzing" || analyzeStage === "protecting" || analyzeStage === "learning";
  const isBusyGenerating = generateStage === "building" || generateStage === "preparing";

  return (
    <div className="max-w-2xl">
      {!result && (
        <>
          <h1 className="font-display text-2xl text-ink mb-1">¿Qué pasó hoy en tu práctica?</h1>
          <p className="text-ink-muted text-sm mb-6">
            Contanos una situación, un aprendizaje o algo que viviste en tu día a día. CASUS se
            encarga de proteger cualquier dato identificable antes de convertirlo en contenido.
          </p>

          <div className="inline-flex rounded-md border border-line p-1 mb-4 bg-surface">
            <button
              onClick={() => setMode("escribir")}
              disabled={isBusyAnalyzing}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors ${
                mode === "escribir" ? "bg-primary-soft text-primary" : "text-ink-muted"
              }`}
            >
              <PenLine size={16} /> Escribir
            </button>
            <button
              onClick={() => setMode("dictar")}
              disabled={isBusyAnalyzing}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors ${
                mode === "dictar" ? "bg-primary-soft text-primary" : "text-ink-muted"
              }`}
            >
              <Mic size={16} /> Dictar
            </button>
          </div>

          <Card className="p-0 overflow-hidden">
            {mode === "escribir" ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isBusyAnalyzing}
                maxLength={4000}
                placeholder="Ej: Hoy atendí a una nena de 7 años que..."
                className="w-full min-h-[220px] resize-none p-4 text-sm outline-none disabled:bg-surface disabled:text-ink-muted"
              />
            ) : (
              <div className="min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-sm text-ink-muted">
                <Mic size={28} className="mb-3 text-ink-muted" />
                El dictado por voz se habilita en una próxima etapa. Por ahora, escribí tu
                experiencia con la otra opción.
              </div>
            )}
          </Card>
          {mode === "escribir" && (
            <div className="text-xs text-ink-muted text-right mt-1">{text.length}/4000</div>
          )}

          {errorMsg && (
            <p className="text-sm text-danger mt-3" role="alert">
              {errorMsg}
            </p>
          )}

          <Button
            size="lg"
            className="mt-5"
            disabled={mode !== "escribir" || text.trim().length === 0 || isBusyAnalyzing}
            onClick={handleAnalyze}
          >
            {isBusyAnalyzing && <Loader2 size={16} className="animate-spin" />}
            {isBusyAnalyzing ? ANALYZE_STAGE_LABEL[analyzeStage] : "Analizar con CASUS"}
          </Button>
        </>
      )}

      {result && (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-display text-2xl text-ink mb-1">Revisá tu contenido protegido</h1>
            <p className="text-ink-muted text-sm">
              Esto es lo que CASUS detectó y cómo quedó tu experiencia después de protegerla.
            </p>
          </div>

          <PrivacyReview items={result.detected} />
          <RiskSummary level={result.riskLevel} explanation={result.riskExplanation} />

          <Card>
            <div className="text-sm font-medium text-ink mb-2">Aprendizaje que podés compartir</div>
            <p className="text-sm text-ink-muted">{result.clinicalLearning}</p>
          </Card>

          {!generated && (
            <>
              <div>
                <h2 className="font-display text-xl text-ink mb-1">
                  Elegí objetivo y formato
                </h2>
                <p className="text-ink-muted text-sm">
                  Con esto CASUS construye el contenido final.
                </p>
              </div>

              <ObjectiveFormatPicker
                objective={objective}
                format={format}
                onObjectiveChange={setObjective}
                onFormatChange={setFormat}
                onSubmit={handleGenerate}
                loading={isBusyGenerating}
                loadingLabel={GENERATE_STAGE_LABEL[generateStage]}
              />

              {generateError && (
                <p className="text-sm text-danger" role="alert">
                  {generateError}
                </p>
              )}
            </>
          )}

          {generated && (
            <>
              <div>
                <h2 className="font-display text-xl text-ink mb-1">Tu contenido está listo</h2>
                <p className="text-ink-muted text-sm">
                  Ya quedó guardado en tu biblioteca — desde ahí podés editarlo cuando quieras.
                </p>
              </div>
              <GeneratedContent format={generated.format} data={generated.data} />
              <div>
                <a href="/dashboard/library">
                  <Button variant="secondary">Ver en mi biblioteca</Button>
                </a>
              </div>
            </>
          )}

          <div>
            <Button variant="secondary" onClick={handleStartOver}>
              Analizar otra experiencia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
