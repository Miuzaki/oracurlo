"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      setEmail("");
      setPassword("");
      onOpenChange(false);
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <DialogHeader className="items-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30 mb-2">
            <Eye className="h-7 w-7 text-primary" />
            <div className="absolute inset-0 rounded-full animate-pulse-glow" />
          </div>
          <DialogTitle className="text-xl text-foreground">Acessar o Oraculo</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use suas credenciais para acessar a plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-foreground">
              Email / CPF
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="seu@email.com ou CPF"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="border-border bg-background pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(0_84%_50%/0.3)] focus-visible:ring-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
