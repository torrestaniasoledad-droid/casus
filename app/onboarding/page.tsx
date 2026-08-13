"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// La lista de profesiones es SOLO datos de UI: agregar una nueva
// profesión no requiere tocar el esquema de base de datos ni el backend.
const PROFESSIONS = [
  { value: "fonoaudiologia", label: "Fonoaudiología / Logopedia" },
];

const GOALS = [
  { value: "conseguir_pacientes", label: "Conseguir pacientes" },
  { value: "autoridad", label: "Construir autoridad" },
  { value: "educar", label: "Educar a mi audiencia" },
  { value: "seguidores", label: "Aumentar seguidores" },
  { value: "consultas", label: "Generar consultas" },
  { value: "promocion", label: "Promocionar mis servicios" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    profession: PROFESSIONS[0].value,
    specialty: "",
    targetAudience: "",
    mainNetwork: "",
    mainGoal: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos guardar tu perfil.");
      return;
    }
    router.push("/dashboard/create");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <div className="font-display text-2xl text-primary mb-1">Contanos sobre vos</div>
        <p className="text-sm text-ink-muted mb-6">
          Un minuto y listo — esto nos ayuda a adaptar el contenido a tu práctica.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5">Nombre</label>
            <input
              required
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5">Profesión</label>
            <select
              value={form.profession}
              onChange={(e) => set("profession", e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none bg-surface"
            >
              {PROFESSIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1.5">Especialidad (opcional)</label>
            <input
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="Ej: lenguaje infantil, deglución, voz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5">Público objetivo (opcional)</label>
              <input
                value={form.targetAudience}
                onChange={(e) => set("targetAudience", e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
                placeholder="Ej: familias, colegas"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5">Red principal (opcional)</label>
              <input
                value={form.mainNetwork}
                onChange={(e) => set("mainNetwork", e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
                placeholder="Ej: Instagram"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5">¿Cuál es tu objetivo principal?</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => set("mainGoal", g.value)}
                  className={`text-left text-sm rounded-md border px-3 py-2 transition-colors ${
                    form.mainGoal === g.value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-line text-ink-muted hover:bg-primary-soft/40"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading || !form.mainGoal} className="w-full mt-2">
            {loading ? "Guardando..." : "Empezar a crear contenido"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
