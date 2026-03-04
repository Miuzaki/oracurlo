"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BANNERS = [
  {
    src: "/images/banners/cadastro.png",
    alt: "Oraculo Aviator - Cadastro",
    href: "https://go.aff.apostatudo.bet/hh390al4",
  },
  {
    src: "/images/banners/supwpp.png",
    alt: "Oraculo Aviator - Suporte via WhatsApp",
    href: "https://wa.me/message/4X3VFADVY4R4K1",
  },
  {
    src: "/images/banners/wpp.png",
    alt: "Oraculo Aviator - WhatsApp",
    href: "https://chat.whatsapp.com/Cj45qRdflfn31EVAuGn4Bj",
  },
  {
    src: "/images/banners/instagram.png",
    alt: "Oraculo Aviator - Instagram",
    href: "https://www.instagram.com/icaro.aviator?igsh=MW9rMjhld3BuaGluZg==",
  },
  {
    src: "/images/banners/telegram.png",
    alt: "Oraculo Aviator - Telegram",
    href: "https://t.me/+VRZlvjIgh0fLwwf4",
  },
];

export function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <div
        className="group relative overflow-hidden rounded-lg border border-border/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slides */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {BANNERS.map((banner) => (
            <a
              key={banner.src}
              href={banner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-[21/9] w-full flex-shrink-0 cursor-pointer sm:aspect-[3/1]"
            >
              <Image
                src={banner.src}
                alt={banner.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1280px"
                priority={banner === BANNERS[0]}
              />
            </a>
          ))}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={(e) => {
            e.preventDefault();
            prev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-background/80 group-hover:opacity-100"
          aria-label="Banner anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            next();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-background/80 group-hover:opacity-100"
          aria-label="Proximo banner"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Ir para banner ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
