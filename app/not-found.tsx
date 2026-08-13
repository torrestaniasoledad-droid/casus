import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl text-ink mb-2">No encontramos esta página</h1>
      <p className="text-sm text-ink-muted mb-5">
        Puede que el link esté roto o que el contenido ya no exista.
      </p>
      <Link href="/dashboard">
        <Button>Volver al dashboard</Button>
      </Link>
    </div>
  );
}
