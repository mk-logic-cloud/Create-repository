import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { headers } from "next/headers";
import { connection } from "next/server";
import { trustedNonce } from "@/lib/csp";
import { StyleNonce } from "@/components/layout/style-nonce";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Wayne Command Center", template: "%s · Wayne Command Center" },
  description: "Zentrale Steuerung für Aufgaben, Projekte, Entscheidungen und Agenten.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // CSP nonces are per request: render every route dynamically, including otherwise static ones.
  await connection();
  const nonce = trustedNonce(await headers());
  return (
    <html lang="de" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <StyleNonce nonce={nonce} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
