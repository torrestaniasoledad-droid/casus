import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CASUS — Contenido profesional sin exponer pacientes",
  description:
    "Convertí tu experiencia profesional en contenido, sin exponer a tus pacientes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-bg text-ink min-h-screen antialiased">{children}</body>
    </html>
  );
}
