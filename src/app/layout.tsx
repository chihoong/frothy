import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Frothy — Surf Session Analyzer",
  description: "Analyze your surf sessions with GPS data from GPX uploads or Strava.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground" style={{ fontFamily: "var(--font-mono), monospace" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
