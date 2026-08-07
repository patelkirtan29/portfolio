import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import StatusStrip from "@/components/StatusStrip";
import AmbientLayer from "@/components/AmbientLayer";
import Cursor from "@/components/Cursor";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// TODO: replace with real title/description before ship.
export const metadata: Metadata = {
  title: "Portfolio (placeholder title)",
  description: "Placeholder description — replace before ship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Cursor />
        <AmbientLayer />
        <Nav />
        {children}
        {/*
          Mounted globally, alongside Nav, per CREATIVE_DIRECTION_V2.md's
          "atmosphere layer" framing (§5C) rather than Home-only — both Nav
          and StatusStrip sit outside individual page content. It's `fixed
          inset-x-0 bottom-0`, so it never participates in document flow;
          pages that size themselves to min-h-screen / min-h-[calc(100vh-
          3.5rem)] (Home, Contact) reserve explicit bottom padding so their
          content never sits under it — see those files.
        */}
        <StatusStrip />
      </body>
    </html>
  );
}
