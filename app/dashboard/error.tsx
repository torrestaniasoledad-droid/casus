"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <Card className="max-w-md">
      <h2 className="font-display text-lg text-ink mb-2">No pudimos cargar esto</h2>
      <p className="text-sm text-ink-muted mb-4">
        Puede haber sido un problema de conexión con la base de datos. Probá de nuevo en un
        momento.
      </p>
      <Button onClick={reset} variant="secondary">
        Reintentar
      </Button>
    </Card>
  );
}
