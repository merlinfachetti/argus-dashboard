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
