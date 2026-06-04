import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playa de Regulación Psicológica VR",
  description: "Entorno WebXR inmersivo para relajación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning evita que las extensiones como Grammarly rompan el inicio de la app
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}