"use client";

import { useState, useEffect, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
} from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DepositResponse {
  success: boolean;
  pix_code?: string;
  qr_code?: string;
  transaction_id?: string;
  amount?: number;
  value?: number;
}

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { isAuthenticated, getAuthHeaders, checkSession } = useAuth();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [depositData, setDepositData] = useState<DepositResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for deposit status when we have a transaction_id
  useEffect(() => {
    if (!depositData?.transaction_id || depositStatus === "approved") return;

    const pollStatus = async () => {
      try {
        const res = await fetch("/api/deposit/status", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ transaction_id: depositData.transaction_id }),
        });
        const data = await res.json();
        if (data.success && data.data?.status) {
          setDepositStatus(data.data.status);
          if (data.data.status === "approved" || data.data.status === "completed") {
            setDepositStatus("approved");
            // Refresh user balance
            checkSession();
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch {
        // ignore polling errors
      }
    };

    pollingRef.current = setInterval(pollStatus, 5000);
    // Also poll immediately
    pollStatus();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [depositData?.transaction_id, depositStatus, getAuthHeaders, checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      setError("Valor minimo de deposito e R$1,00");
      return;
    }

    if (!isAuthenticated) {
      setError("Voce precisa estar logado para depositar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Erro ao processar deposito");
        return;
      }

      // Response: { success, data: { pix_code, qr_code, transaction_id, amount, value } }
      setDepositData(data.data);
      setDepositStatus("pending");
    } catch {
      setError("Erro de conexao com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    const code = depositData?.pix_code || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setDepositData(null);
      setAmount("");
      setError("");
      setCopied(false);
      setDepositStatus(null);
    }
    onOpenChange(isOpen);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
  };

  // Show QR code / PIX result
  if (depositData) {
    const qrUrl = depositData.qr_code;
    const pixCode = depositData.pix_code || "";
    const displayAmount = depositData.amount ?? parseFloat(amount);

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card">
          <DialogHeader className="items-center">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30 mb-2">
              {depositStatus === "approved" ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <QrCode className="h-6 w-6 text-primary" />
              )}
            </div>
            <DialogTitle className="text-xl text-foreground">
              {depositStatus === "approved" ? "Deposito Confirmado!" : "Deposito PIX"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {depositStatus === "approved"
                ? "Seu deposito foi confirmado com sucesso."
                : "Escaneie o QR Code ou copie o codigo abaixo"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 pt-2">
            {/* Amount */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(displayAmount)}
              </span>
            </div>

            {depositStatus === "approved" ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <p className="text-sm text-muted-foreground">Saldo atualizado automaticamente.</p>
              </div>
            ) : (
              <>
                {/* QR Code */}
                {qrUrl && (
                  <div className="rounded-xl border border-border bg-foreground p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR Code PIX"
                      className="h-48 w-48"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}

                <Separator className="bg-border" />

                {/* PIX Code */}
                {pixCode && (
                  <div className="flex w-full flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Codigo PIX Copia e Cola
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={pixCode}
                        className="flex-1 border-border bg-secondary text-foreground text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCode}
                        className="shrink-0 border-border text-foreground hover:bg-secondary"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {depositData.transaction_id && (
                  <p className="text-xs text-muted-foreground">
                    ID: {depositData.transaction_id}
                  </p>
                )}

                {depositStatus === "pending" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Aguardando pagamento...</span>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={() => handleClose(false)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <DialogHeader className="items-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30 mb-2">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl text-foreground">
            Depositar via PIX
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha o valor do deposito. Minimo R$1,00.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Quick amount buttons */}
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Valores rapidos</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(val)}
                  className={`border-border text-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary ${
                    amount === String(val)
                      ? "border-primary bg-primary/10 text-primary"
                      : ""
                  }`}
                >
                  R${val}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Custom amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="deposit-amount" className="text-foreground">
              Ou digite um valor
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                R$
              </span>
              <Input
                id="deposit-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                className="border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !amount}
            className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(0_84%_50%/0.3)] focus-visible:ring-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Depositar{" "}
                {amount
                  ? `R$${parseFloat(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : ""}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
