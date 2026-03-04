import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CalculadoraContent } from "@/components/calculadora-content";

export default function CalculadoraPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1">
        <CalculadoraContent />
      </main>
      <SiteFooter />
    </div>
  );
}
