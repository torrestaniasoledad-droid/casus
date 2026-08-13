import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-xl text-primary">CASUS</span>
        <Link href="/login">
          <Button variant="secondary" size="sm">
            Iniciar sesión
          </Button>
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">
          Convertí tu experiencia profesional en contenido,
          <br className="hidden md:block" /> sin exponer a tus pacientes.
        </h1>
        <p className="text-ink-muted text-base md:text-lg mb-8 max-w-xl">
          Una IA diseñada para profesionales de la salud que quieren crear contenido educativo
          de forma rápida, estratégica y responsable.
        </p>
        <Link href="/register">
          <Button size="lg">Probar CASUS</Button>
        </Link>
      </section>
    </main>
  );
}
