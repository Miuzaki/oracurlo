"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Clock,
  BookOpen,
  Target,
  BarChart3,
  Lock,
  Bell,
  Eye,
} from "lucide-react";

export interface Lesson {
  id: number;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  duration: string;
  category: string;
  level: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Introducao ao Mundo das Apostas",
    description: "Aprenda os fundamentos basicos de como funcionam as apostas online, tipos de jogos e como comecar de forma segura.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "15:30",
    category: "Fundamentos",
    level: "Iniciante",
  },
  {
    id: 2,
    title: "Gestao de Banca para Iniciantes",
    description: "Entenda como gerenciar seu dinheiro de forma inteligente, definir limites e proteger seu capital.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "22:15",
    category: "Financeiro",
    level: "Iniciante",
  },
  {
    id: 3,
    title: "Estrategias em Crash Games - Volatilidade e Padroes",
    description: "Descubra como a volatilidade afeta seus resultados nos crash games e como identificar padroes.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "18:45",
    category: "Estrategia",
    level: "Intermediario",
  },
  {
    id: 4,
    title: "Aviator - Probabilidades e Sistemas",
    description: "Analise matematica das probabilidades no Aviator e os sistemas de apostas mais conhecidos.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "25:00",
    category: "Estrategia",
    level: "Intermediario",
  },
  {
    id: 5,
    title: "Martingale e Anti-Martingale na Pratica",
    description: "Domine os sistemas Martingale e Anti-Martingale com exemplos praticos e analise de risco.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "30:20",
    category: "Estrategia",
    level: "Avancado",
  },
  {
    id: 6,
    title: "Jogo Responsavel - Limites e Controle",
    description: "A aula mais importante: como manter o controle, identificar sinais de problema e jogar de forma responsavel.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "20:10",
    category: "Fundamentos",
    level: "Todos",
  },
  {
    id: 7,
    title: "Analise de Odds e Valor Esperado",
    description: "Aprenda a calcular o valor esperado de uma aposta e identificar oportunidades com odds favoraveis.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "19:50",
    category: "Financeiro",
    level: "Avancado",
  },
  {
    id: 8,
    title: "Psicologia do Jogador - Controle Emocional",
    description: "Entenda como as emocoes afetam suas decisoes e aprenda tecnicas para manter a disciplina durante as sessoes.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    duration: "17:35",
    category: "Fundamentos",
    level: "Todos",
  },
];

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Fundamentos: <BookOpen className="h-4 w-4" />,
  Estrategia: <Target className="h-4 w-4" />,
  Financeiro: <BarChart3 className="h-4 w-4" />,
};

export const LEVEL_COLORS: Record<string, string> = {
  Iniciante: "bg-primary/10 text-primary border-primary/30",
  Intermediario: "bg-muted text-foreground border-border",
  Avancado: "bg-primary/20 text-primary border-primary/40",
  Todos: "bg-muted text-muted-foreground border-border",
};

const UPCOMING_MODULES = [
  {
    title: "Fundamentos de Crash Games",
    lessons: 4,
    icon: <BookOpen className="h-5 w-5" />,
    description: "Aprenda os conceitos basicos, mecanica dos crash games e como analisar multiplicadores.",
  },
  {
    title: "Estrategias Avancadas",
    lessons: 3,
    icon: <Target className="h-5 w-5" />,
    description: "Martingale, Fibonacci, analise de padroes e sistemas de apostas com gestao de risco.",
  },
  {
    title: "Gestao Financeira",
    lessons: 3,
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Controle de banca, metas diarias, stop loss e planejamento financeiro para jogadores.",
  },
];

export default function MentoriasPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative border-b border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="glow-line" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-primary/20" />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                  <GraduationCap className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Em Breve</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground uppercase tracking-wide sm:text-4xl lg:text-5xl text-balance">
                  Mentorias e Aulas
                </h1>
                <p className="max-w-2xl text-muted-foreground leading-relaxed text-pretty">
                  Estamos preparando conteudo exclusivo de alta qualidade para
                  membros do Oraculo Aviator. Aulas em video sobre
                  estrategias, gestao de banca e jogo responsavel.
                </p>
              </div>
            </div>
          </div>
          <div className="glow-line" />
        </section>

        {/* Coming soon content */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/50 bg-card">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
              Conteudo em Desenvolvimento
            </h2>
            <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
              Nossa equipe esta gravando e editando as melhores aulas para
              voce. Fique ligado nas novidades.
            </p>
          </div>

          <h3 className="mb-5 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Modulos Planejados
          </h3>
          <div className="flex flex-col gap-3">
            {UPCOMING_MODULES.map((mod) => (
              <Card key={mod.title} className="border-border/50 bg-card transition-all hover:border-primary/30">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    {mod.icon}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-foreground">{mod.title}</h4>
                      <span className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {mod.lessons} aulas
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-foreground">Fique por dentro</p>
                <p className="text-sm text-muted-foreground">
                  As aulas serao liberadas em breve diretamente aqui na plataforma.
                  Continue acompanhando para nao perder nenhum conteudo.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
