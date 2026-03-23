import type { Metadata } from "next";
import { Suspense } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argus | Job Radar",
  description:
    "Private radar to collect, structure, score and track job opportunities aligned with your profile.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <I18nProvider>
          <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <Suspense fallback={null}>
              <AppHeader />
            </Suspense>
            <main className="relative flex-1">{children}</main>
            <AppFooter />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
