"use client";

import { useAuth } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroBanner } from "@/components/hero-banner";
import { BannerCarousel } from "@/components/banner-carousel";
import { GameCatalog } from "@/components/game-catalog";
import { Eye } from "lucide-react";

export function HomeContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          <Eye className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <p className="mt-4 font-mono text-sm text-muted-foreground uppercase tracking-widest">
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1">
        <HeroBanner />
        <BannerCarousel />
        <GameCatalog />
      </main>
      <SiteFooter />
    </div>
  );
}
