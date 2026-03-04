import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/50 bg-card">
      <div className="glow-line" />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-widest text-foreground">ORACULO</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">AVIATOR</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rastreie crash games ao vivo com dados em tempo real.
              Analise padroes e gerencie sua banca com precisao.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Plataforma</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">Inicio</Link>
              <Link href="/mentorias" className="text-sm text-muted-foreground transition-colors hover:text-primary">Mentorias</Link>
              <Link href="/calculadora" className="text-sm text-muted-foreground transition-colors hover:text-primary">Calculadora</Link>
              <Link href="/progressao" className="text-sm text-muted-foreground transition-colors hover:text-primary">Progressao</Link>
              <Link href="/perfil" className="text-sm text-muted-foreground transition-colors hover:text-primary">Meu Perfil</Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/termos" className="text-sm text-muted-foreground transition-colors hover:text-primary">Termos de Servico</Link>
              <Link href="/termos" className="text-sm text-muted-foreground transition-colors hover:text-primary">Politica de Privacidade</Link>
            </nav>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Jogo Responsavel</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Jogue com responsabilidade. Esta plataforma e destinada a maiores de 18 anos.
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/5 font-mono text-xs font-bold text-primary">
              18+
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Oraculo Aviator. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Jogue com responsabilidade. 18+
          </p>
        </div>
      </div>
    </footer>
  );
}
