import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Oraculo Aviator",
  description:
    "Oraculo Aviator - Rastreamento de crash games ao vivo. Aviator e mais. Analise em tempo real.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${spaceMono.variable} font-sans antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
