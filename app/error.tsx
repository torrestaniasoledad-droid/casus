"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function GlobalError({
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
    <html lang="es">
      <body className="bg-bg text-ink min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-sm text-center">
          <h1 className="font-display text-xl text-ink mb-2">Algo salió mal</h1>
          <p className="text-sm text-ink-muted mb-5">
            Tuvimos un problema inesperado. Probá de nuevo — si sigue pasando, contactanos.
          </p>
          <Button onClick={reset}>Reintentar</Button>
        </Card>
      </body>
    </html>
  );
}
