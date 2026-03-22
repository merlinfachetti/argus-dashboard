import type { Metadata } from "next";
import { Suspense } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argus | Job Radar",
  description:
    "Radar privado para coletar, estruturar, pontuar e acompanhar vagas com foco em aderência ao perfil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div className="argus-shell relative flex min-h-screen flex-col overflow-x-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_54%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-[32rem] h-[18rem] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.10),transparent_58%)]" />
          <Suspense fallback={null}>
            <AppHeader />
          </Suspense>
          <main className="relative flex-1">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
