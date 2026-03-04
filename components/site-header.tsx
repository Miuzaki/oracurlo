"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  DollarSign,
  GraduationCap,
  Calculator,
  TrendingUp,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { DepositModal } from "@/components/deposit-modal";

function formatCurrency(raw: number) {
  // se vier “grande demais”, assume que está em centavos
  const value = raw > 1_000_000 ? raw / 100 : raw;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
export function SiteHeader() {
  const { player, isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const credits = player?._cached?.["get-credits"];
  const balance = credits?.credit ?? player?.wallet?.credit ?? 0;

  const displayName =
    player?.name || player?.first_name || player?.username || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="glow-line" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.PNG"
              alt="Oraculo Aviator"
              className="h-20 object-cover"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "/", label: "Inicio" },
              {
                href: "/mentorias",
                label: "Mentorias",
                icon: <GraduationCap className="h-3.5 w-3.5" />,
              },
              {
                href: "/calculadora",
                label: "Calculadora",
                icon: <Calculator className="h-3.5 w-3.5" />,
              },
              {
                href: "/progressao",
                label: "Progressao",
                icon: <TrendingUp className="h-3.5 w-3.5" />,
              },
              { href: "/termos", label: "Termos" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && player && (
              <>
                <div className="hidden items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 sm:flex">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatCurrency(balance)}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => setDepositOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_hsl(199_89%_48%/0.3)]"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Depositar</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                      <Avatar className="h-8 w-8 border border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 border-border bg-card text-foreground"
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      <p className="font-mono text-xs text-primary">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/perfil"
                        className="flex cursor-pointer items-center gap-2 text-foreground"
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDepositOpen(true)}
                      className="flex cursor-pointer items-center gap-2 text-foreground"
                    >
                      <DollarSign className="h-4 w-4" />
                      Depositar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {/* <span className="mt-1 text-[10px] font-medium text-emerald-400">
                    Cadastre-se para ganhar bônus
                  </span> */}
            {!isAuthenticated && !player && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end leading-tight">
                  <Button
                    asChild
                    size="sm"
                    className="animate-pulse bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                  >
                    <Link href="https://go.aff.apostatudo.bet/hh390al4">
                      <Gift className="h-4 w-4" />
                      Cadastre-se
                    </Link>
                  </Button>
                </div>
                <Button
                  onClick={() => setLoginOpen(true)}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_hsl(199_89%_48%/0.3)]"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                { href: "/", label: "Inicio" },
                {
                  href: "/mentorias",
                  label: "Mentorias",
                  icon: <GraduationCap className="h-4 w-4" />,
                },
                {
                  href: "/calculadora",
                  label: "Calculadora",
                  icon: <Calculator className="h-4 w-4" />,
                },
                {
                  href: "/progressao",
                  label: "Progressao",
                  icon: <TrendingUp className="h-4 w-4" />,
                },
                { href: "/termos", label: "Termos" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <Link
                    href="https://go.aff.apostatudo.bet/hh390al4"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white animate-pulse shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                  >
                    <Gift className="h-4 w-4" />
                    Cadastre-se
                  </Link>
                  <p className="mt-2 text-center text-xs text-emerald-400">
                    Cadastre-se para ganhar bônus
                  </p>
                </div>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    href="/perfil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setDepositOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <DollarSign className="h-4 w-4" />
                    Depositar
                  </button>
                  <div className="flex items-center gap-2 rounded-md px-3 py-2 sm:hidden">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-bold text-primary">
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </>
  );
}
