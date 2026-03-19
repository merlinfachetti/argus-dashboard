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
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_56%)]" />
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
