"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CasusLogo } from "@/components/ui/CasusLogo";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No pudimos crear tu cuenta.");
      setLoading(false);
      return;
    }

    // Inicia sesión automáticamente y va directo al onboarding corto.
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <CasusLogo size={24} />
          <span className="font-display text-2xl text-primary">CASUS</span>
        </div>
        <p className="text-sm text-ink-muted mb-6">
          Creá tu cuenta. En un par de minutos armás tu primer contenido.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5 text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="vos@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-ink">Contraseña</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-sm text-ink-muted mt-5 text-center">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-primary font-medium">
            Iniciá sesión
          </a>
        </p>
      </Card>
    </div>
  );
}
