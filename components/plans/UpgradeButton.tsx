"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export function UpgradeButton({ plan }: { plan: "PRO" | "PREMIUM" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No pudimos iniciar el pago. Probá de nuevo.");
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("No pudimos conectar. Probá de nuevo en unos minutos.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Redirigiendo..." : "Elegir este plan"}
      </Button>
      {error && (
        <p className="text-xs text-danger mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
