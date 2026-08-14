"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CasusLogo } from "@/components/ui/CasusLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <CasusLogo size={24} />
          <span className="font-display text-2xl text-primary">CASUS</span>
        </div>
        <p className="text-sm text-ink-muted mb-6">Iniciá sesión para seguir creando contenido.</p>

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
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-primary outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-sm text-ink-muted mt-5 text-center">
          ¿No tenés cuenta?{" "}
          <a href="/register" className="text-primary font-medium">
            Registrate
          </a>
        </p>
      </Card>
    </div>
  );
}
