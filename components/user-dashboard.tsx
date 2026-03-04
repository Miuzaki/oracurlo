"use client";

import { useAuth, type Player } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Loader2,
  MapPin,
  Wallet,
  CreditCard,
} from "lucide-react";
import { GameCatalog } from "@/components/game-catalog";

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
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserDashboard() {
  const { player, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!player) return null;

  const initials = getPlayerInitials(player);
  const displayName = getPlayerName(player);
  const credits = player._cached?.["get-credits"];

  return (
    <div className="mx-auto w-full max-w-4xl flex flex-col gap-6">
      {/* Header Card */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-600 to-emerald-800" />
        <CardContent className="relative pb-6 pt-0">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <Avatar className="-mt-12 h-24 w-24 border-4 border-card">
              <AvatarFallback className="bg-emerald-600 text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground text-balance">
                  {displayName}
                </h2>
                {player.is_active === 1 && (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/15">
                    Ativo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {player.email || player.username || ""}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="border-border text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Card */}
      {player.wallet && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">Saldo</span>
                <span className="text-lg font-bold text-emerald-500">
                  {formatCurrency(credits?.credit ?? player.wallet.credit ?? 0)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">{"Bonus"}</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(credits?.bonus ?? player.wallet.bonus ?? 0)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">{"Disponivel"}</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(player.wallet.available_value ?? 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Catalog */}
      <GameCatalog />

      {/* Info Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-emerald-500" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {player.email && (
              <InfoItem
                icon={<Mail className="h-4 w-4 text-emerald-500" />}
                label="Email"
                value={player.email}
              />
            )}
            {player.phone && (
              <InfoItem
                icon={<Phone className="h-4 w-4 text-emerald-500" />}
                label="Telefone"
                value={`${player.ddi || ""} ${player.phone}`}
              />
            )}
            {player.birth_date && (
              <InfoItem
                icon={<Calendar className="h-4 w-4 text-emerald-500" />}
                label="Data de Nascimento"
                value={formatDate(player.birth_date)}
              />
            )}
            {player.created_at && (
              <InfoItem
                icon={<Calendar className="h-4 w-4 text-emerald-500" />}
                label="Membro desde"
                value={formatDate(player.created_at)}
              />
            )}
          </div>

          {(player.document || player.currency) && (
            <>
              <Separator className="bg-border" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {player.document && (
                  <InfoItem
                    icon={<Shield className="h-4 w-4 text-emerald-500" />}
                    label="CPF"
                    value={formatCPF(player.document.number || "")}
                  />
                )}
                {player.currency && (
                  <InfoItem
                    icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
                    label="Moeda"
                    value={player.currency}
                  />
                )}
              </div>
            </>
          )}

          {(player.city || player.address) && (
            <>
              <Separator className="bg-border" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {player.city && (
                  <InfoItem
                    icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                    label="Cidade / Estado"
                    value={`${player.city} - ${player.state || "N/A"}`}
                  />
                )}
                {player.address && (
                  <InfoItem
                    icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                    label="Endereco"
                    value={player.address}
                  />
                )}
              </div>
            </>
          )}

          {/* Raw data dump for debugging */}
          <Separator className="bg-border" />
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors">
              Ver dados brutos (debug)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
              {JSON.stringify(player, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}
