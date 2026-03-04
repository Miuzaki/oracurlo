"use client";

import { useAuth, type Player } from "@/contexts/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Loader2,
  MapPin,
  Wallet,
  CreditCard,
  LogIn,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function getPlayerName(player: Player): string {
  return player.name || player.first_name || player.username || player.email || "Usuario";
}

function getPlayerInitials(player: Player): string {
  const name = getPlayerName(player);
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { player, isAuthenticated, isLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <Eye className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!isAuthenticated || !player) {
    return (
      <div className="flex min-h-screen flex-col bg-background noise-overlay">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">Acesso Restrito</h1>
          <p className="text-muted-foreground text-center">Faca login para acessar seu perfil.</p>
          <Button
            onClick={() => setLoginOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(0_84%_50%/0.3)]"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
          <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const initials = getPlayerInitials(player);
  const displayName = getPlayerName(player);
  const credits = player._cached?.["get-credits"];

  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
          {/* Profile header card */}
          <Card className="border-border/50 bg-card overflow-hidden">
            <div className="relative h-28">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full glow-line" />
            </div>
            <CardContent className="relative pb-6 pt-0">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                <Avatar className="-mt-14 h-24 w-24 border-2 border-primary/30 ring-2 ring-background">
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground text-balance">{displayName}</h1>
                    {player.is_active === 1 && (
                      <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/30 bg-primary/5 rounded px-1.5 py-0.5">Ativo</span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{player.email || player.username || ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet */}
          {player.wallet && (
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground uppercase tracking-wide text-sm">
                  <Wallet className="h-4 w-4 text-primary" />
                  Carteira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Saldo</span>
                    <span className="font-mono text-xl font-bold text-primary">{formatCurrency(credits?.credit ?? player.wallet.credit ?? 0)}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card p-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{"Bonus"}</span>
                    <span className="font-mono text-xl font-bold text-foreground">{formatCurrency(credits?.bonus ?? player.wallet.bonus ?? 0)}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card p-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{"Disponivel"}</span>
                    <span className="font-mono text-xl font-bold text-foreground">{formatCurrency(player.wallet.available_value ?? 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal data */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground uppercase tracking-wide text-sm">
                <User className="h-4 w-4 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {player.email && <InfoItem icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value={player.email} />}
                {player.phone && <InfoItem icon={<Phone className="h-4 w-4 text-primary" />} label="Telefone" value={`${player.ddi || ""} ${player.phone}`} />}
                {player.birth_date && <InfoItem icon={<Calendar className="h-4 w-4 text-primary" />} label="Data de Nascimento" value={formatDate(player.birth_date)} />}
                {player.created_at && <InfoItem icon={<Calendar className="h-4 w-4 text-primary" />} label="Membro desde" value={formatDate(player.created_at)} />}
              </div>
              {(player.document || player.currency) && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {player.document && <InfoItem icon={<Shield className="h-4 w-4 text-primary" />} label="CPF" value={formatCPF(player.document.number || "")} />}
                    {player.currency && <InfoItem icon={<CreditCard className="h-4 w-4 text-primary" />} label="Moeda" value={player.currency} />}
                  </div>
                </>
              )}
              {(player.city || player.address) && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {player.city && <InfoItem icon={<MapPin className="h-4 w-4 text-primary" />} label="Cidade / Estado" value={`${player.city} - ${player.state || "N/A"}`} />}
                    {player.address && <InfoItem icon={<MapPin className="h-4 w-4 text-primary" />} label="Endereco" value={player.address} />}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
