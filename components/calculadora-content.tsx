"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calculator,
  Target,
  Wallet,
  History,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Transaction = {
  id: string;
  tipo: "deposito" | "saque";
  valor: number;
  data: string;
};

type BalanceData = {
  saldo: number;
  depositos: number;
  saques: number;
  transacoes: Transaction[];
};

type SessionData = {
  bancaInicial: number;
  metaDiaria: number;
  stopLoss: number;
  percentualMeta: number;
  percentualStop: number;
  resultadoAtual: number;
  ativa: boolean;
};

const initialBalanceData: BalanceData = {
  saldo: 0,
  depositos: 0,
  saques: 0,
  transacoes: [],
};

const initialSessionData: SessionData = {
  bancaInicial: 0,
  metaDiaria: 0,
  stopLoss: 0,
  percentualMeta: 1,
  percentualStop: 2,
  resultadoAtual: 0,
  ativa: false,
};

export function CalculadoraContent() {
  const [balanceData, setBalanceData] =
    useState<BalanceData>(initialBalanceData);
  const [sessionData, setSessionData] =
    useState<SessionData>(initialSessionData);
  const [isDepositoOpen, setIsDepositoOpen] = useState(false);
  const [isSaqueOpen, setIsSaqueOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [valorCalculadora, setValorCalculadora] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const [configBanca, setConfigBanca] = useState("");
  const [configMeta, setConfigMeta] = useState("1");
  const [configStop, setConfigStop] = useState("2");

  useEffect(() => {
    const savedData = localStorage.getItem("balanceData");
    const savedSession = localStorage.getItem("sessionData");
    if (savedData) {
      try {
        setBalanceData(JSON.parse(savedData));
      } catch {
        localStorage.removeItem("balanceData");
      }
    }
    if (savedSession) {
      try {
        setSessionData(JSON.parse(savedSession));
      } catch {
        localStorage.removeItem("sessionData");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("balanceData", JSON.stringify(balanceData));
    }
  }, [balanceData, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sessionData", JSON.stringify(sessionData));
    }
  }, [sessionData, isLoaded]);

  const calcularResultado = () => {
    return balanceData.saques - balanceData.depositos;
  };

  const handleNumeroClick = (num: string) => {
    if (num === "." && valorCalculadora.includes(".")) return;
    setValorCalculadora((prev) => prev + num);
  };

  const handleLimpar = () => {
    setValorCalculadora("");
  };

  const handleOpenDeposito = () => {
    setValorCalculadora("");
    setIsDepositoOpen(true);
  };

  const handleOpenSaque = () => {
    setValorCalculadora("");
    setIsSaqueOpen(true);
  };

  const handleDepositar = () => {
    const valor = Number.parseFloat(valorCalculadora);
    if (valor && valor > 0) {
      const novaTransacao: Transaction = {
        id: Date.now().toString(),
        tipo: "deposito",
        valor: valor,
        data: new Date().toLocaleString("pt-BR"),
      };
      setBalanceData((prev) => ({
        ...prev,
        saldo: prev.saldo + valor,
        depositos: prev.depositos + valor,
        transacoes: [novaTransacao, ...prev.transacoes],
      }));

      if (sessionData.ativa) {
        setSessionData((prev) => ({
          ...prev,
          resultadoAtual: prev.resultadoAtual - valor,
        }));
      }

      setValorCalculadora("");
      setIsDepositoOpen(false);
    }
  };

  const handleSacar = () => {
    const valor = Number.parseFloat(valorCalculadora);
    if (valor && valor > 0) {
      const novaTransacao: Transaction = {
        id: Date.now().toString(),
        tipo: "saque",
        valor: valor,
        data: new Date().toLocaleString("pt-BR"),
      };
      setBalanceData((prev) => ({
        ...prev,
        saldo: prev.saldo - valor,
        saques: prev.saques + valor,
        transacoes: [novaTransacao, ...prev.transacoes],
      }));

      if (sessionData.ativa) {
        setSessionData((prev) => ({
          ...prev,
          resultadoAtual: prev.resultadoAtual + valor,
        }));
      }

      setValorCalculadora("");
      setIsSaqueOpen(false);
    }
  };

  const handleLimparHistorico = () => {
    if (
      confirm(
        "Tem certeza que deseja limpar todo o historico? Isso ira zerar todos os valores.",
      )
    ) {
      setBalanceData(initialBalanceData);
      setSessionData(initialSessionData);
      localStorage.removeItem("balanceData");
      localStorage.removeItem("sessionData");
    }
  };

  const handleIniciarSessao = () => {
    const banca = Number.parseFloat(configBanca);
    const meta = Number.parseFloat(configMeta);
    const stop = Number.parseFloat(configStop);

    if (!banca || banca <= 0) {
      alert("Informe o valor da banca");
      return;
    }

    const metaValor = banca * (meta / 100);
    const stopValor = banca * (stop / 100);

    setSessionData({
      bancaInicial: banca,
      metaDiaria: metaValor,
      stopLoss: stopValor,
      percentualMeta: meta,
      percentualStop: stop,
      resultadoAtual: 0,
      ativa: true,
    });

    setIsConfigOpen(false);
  };

  const handleEncerrarSessao = () => {
    setSessionData((prev) => ({
      ...prev,
      ativa: false,
    }));
  };

  const resultado = calcularResultado();

  const metaAtingida =
    sessionData.ativa && sessionData.resultadoAtual >= sessionData.metaDiaria;
  const stopAtingido =
    sessionData.ativa && sessionData.resultadoAtual <= -sessionData.stopLoss;
  const showRiskWarning = Number.parseFloat(configMeta) > 3;

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Calculator className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide sm:text-3xl">
              Gestao de Banca
            </h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Oraculo Aviator - Controle e Organizacao
            </p>
          </div>
        </div>
      </div>

      {/* Session Status Alerts */}
      {metaAtingida && (
        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle className="text-green-500 font-semibold">
            Meta atingida. Encerrar sessao.
          </AlertTitle>
          <AlertDescription className="text-green-400">
            Voce atingiu sua meta diaria de R${" "}
            {sessionData.metaDiaria.toFixed(2)}. Recomendamos encerrar a
            sessao para preservar seus resultados.
          </AlertDescription>
          <Button
            onClick={handleEncerrarSessao}
            className="mt-3 bg-green-600 hover:bg-green-700 text-foreground"
            size="sm"
          >
            Encerrar Sessao
          </Button>
        </Alert>
      )}

      {stopAtingido && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10">
          <XCircle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-500 font-semibold">
            Limite de perda atingido. Voltar outro dia.
          </AlertTitle>
          <AlertDescription className="text-red-400">
            Voce atingiu seu limite de perda diaria de R${" "}
            {sessionData.stopLoss.toFixed(2)}. Pare agora e volte amanha com a
            mente descansada.
          </AlertDescription>
          <Button
            onClick={handleEncerrarSessao}
            variant="destructive"
            className="mt-3"
            size="sm"
          >
            Encerrar Sessao
          </Button>
        </Alert>
      )}

      {/* Session Card */}
      {sessionData.ativa ? (
        <Card className="mb-6 border-2 border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Sessao Ativa
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEncerrarSessao}
              >
                Encerrar
              </Button>
            </div>
            <CardDescription>
              Banca inicial: R$ {sessionData.bancaInicial.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-muted-foreground mb-1">
                  Meta Diaria
                </p>
                <p className="text-lg font-bold text-green-500">
                  +R$ {sessionData.metaDiaria.toFixed(2)}
                </p>
                <p className="text-xs text-green-400">
                  {sessionData.percentualMeta}%
                </p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-muted-foreground mb-1">
                  Stop Loss
                </p>
                <p className="text-lg font-bold text-red-500">
                  -R$ {sessionData.stopLoss.toFixed(2)}
                </p>
                <p className="text-xs text-red-400">
                  -{sessionData.percentualStop}%
                </p>
              </div>
              <div
                className={`text-center p-3 rounded-xl border ${
                  sessionData.resultadoAtual >= 0
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  Resultado
                </p>
                <p
                  className={`text-lg font-bold ${
                    sessionData.resultadoAtual >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {sessionData.resultadoAtual >= 0 ? "+" : ""}R${" "}
                  {sessionData.resultadoAtual.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stop Loss</span>
                <span>Meta Diaria</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-r from-red-500/30 to-transparent" />
                  <div className="w-1/2 bg-gradient-to-l from-green-500/30 to-transparent" />
                </div>
                <div
                  className={`absolute top-0 h-full w-1 transition-all duration-300 ${
                    sessionData.resultadoAtual >= 0
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    left: `${Math.min(
                      Math.max(
                        50 +
                          (sessionData.resultadoAtual /
                            (sessionData.metaDiaria || 1)) *
                            50,
                        0,
                      ),
                      100,
                    )}%`,
                  }}
                />
                <div className="absolute top-0 left-1/2 h-full w-0.5 bg-foreground/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-2 border-dashed border-primary/30 bg-card">
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 text-primary/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Nenhuma sessao ativa
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Configure sua meta diaria e limite de perda para comecar
            </p>
            <Button onClick={() => setIsConfigOpen(true)} className="gap-2">
              <Target className="h-4 w-4" />
              Iniciar Nova Sessao
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Saldo Atual
            </h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {balanceData.saldo.toFixed(2)}
          </p>
        </Card>

        <Card
          className={`p-6 ${
            resultado >= 0
              ? "bg-green-500/5 border-green-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp
              className={`h-6 w-6 ${resultado >= 0 ? "text-green-500" : "text-red-500"}`}
            />
            <h3 className="text-sm font-medium text-muted-foreground">
              Resultado Acumulado
            </h3>
          </div>
          <p
            className={`text-3xl font-bold ${resultado >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {resultado >= 0 ? "+" : ""}R$ {resultado.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Summary Card */}
      <Card
        className={`p-6 mb-6 border-2 ${
          resultado >= 0
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp
                className={`h-6 w-6 ${resultado >= 0 ? "text-green-500" : "text-red-500"}`}
              />
              <h3 className="text-sm font-medium text-muted-foreground">
                Balance Geral
              </h3>
            </div>
            <p
              className={`text-4xl font-bold ${resultado >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {resultado >= 0 ? "+" : ""}R$ {resultado.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {resultado >= 0
                ? "Voce esta no positivo"
                : "Voce esta no negativo"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Depositado</p>
            <p className="text-lg font-semibold text-foreground">
              R$ {balanceData.depositos.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mb-1 mt-2">Sacado</p>
            <p className="text-lg font-semibold text-foreground">
              R$ {balanceData.saques.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Button
          size="lg"
          onClick={handleOpenDeposito}
          className="h-16 text-lg font-semibold bg-red-600 hover:bg-red-700 text-foreground"
          disabled={metaAtingida || stopAtingido}
        >
          <ArrowUpCircle className="h-6 w-6" />
          Deposito
        </Button>

        <Button
          size="lg"
          onClick={handleOpenSaque}
          className="h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 text-foreground"
          disabled={metaAtingida || stopAtingido}
        >
          <ArrowDownCircle className="h-6 w-6" />
          Saque
        </Button>
      </div>

      <Button
        size="lg"
        variant="outline"
        onClick={() => setIsHistoricoOpen(true)}
        className="w-full h-12 text-base font-semibold"
      >
        <History className="h-5 w-5" />
        Ver Historico ({balanceData.transacoes.length})
      </Button>

      {/* Config Session Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Target className="h-6 w-6 text-primary" />
              Configurar Sessao
            </DialogTitle>
            <DialogDescription>
              Defina sua banca, meta diaria e limite de perda
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="banca" className="text-foreground">Valor da Banca (R$)</Label>
              <Input
                id="banca"
                type="number"
                placeholder="1000.00"
                value={configBanca}
                onChange={(e) => setConfigBanca(e.target.value)}
                className="h-12 text-lg border-border bg-background text-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Meta Diaria (%)</Label>
              <Select value={configMeta} onValueChange={setConfigMeta}>
                <SelectTrigger className="h-12 border-border bg-background text-foreground">
                  <SelectValue placeholder="Selecione a meta" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  <SelectItem value="5">5% (Conservador)</SelectItem>
                  <SelectItem value="8">8% (Equilibrado)</SelectItem>
                  <SelectItem value="10">10% (Recomendado)</SelectItem>
                  <SelectItem value="12">12% (Moderado)</SelectItem>
                  <SelectItem value="15">15% (Agressivo)</SelectItem>
                  <SelectItem value="20">20% (Alta exposicao)</SelectItem>
                </SelectContent>
              </Select>

              {showRiskWarning && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-400 text-sm">
                    Metas acima de 3% representam alto risco. Prossiga com
                    cautela.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Limite de Perda Diaria - Stop Loss (%)</Label>
              <Select value={configStop} onValueChange={setConfigStop}>
                <SelectTrigger className="h-12 border-border bg-background text-foreground">
                  <SelectValue placeholder="Selecione o stop" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  <SelectItem value="3">3% (Recomendado)</SelectItem>
                  <SelectItem value="4">4%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="7">7%</SelectItem>
                  <SelectItem value="10">10% (Maximo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {configBanca && (
              <Card className="p-4 bg-muted/50 border-border">
                <h4 className="font-semibold mb-3 text-sm text-foreground">
                  Resumo da Sessao
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Meta Diaria</p>
                    <p className="font-semibold text-green-500">
                      +R${" "}
                      {(
                        (Number.parseFloat(configBanca) *
                          Number.parseFloat(configMeta)) /
                        100
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop Loss</p>
                    <p className="font-semibold text-red-500">
                      -R${" "}
                      {(
                        (Number.parseFloat(configBanca) *
                          Number.parseFloat(configStop)) /
                        100
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Button
            onClick={handleIniciarSessao}
            className="w-full h-12 text-lg"
          >
            Iniciar Sessao
          </Button>
        </DialogContent>
      </Dialog>

      {/* Deposito Dialog */}
      <Dialog open={isDepositoOpen} onOpenChange={setIsDepositoOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ArrowUpCircle className="h-6 w-6" />
              Registrar Deposito
            </DialogTitle>
            <DialogDescription>
              Informe o valor depositado na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={valorCalculadora ? `R$ ${valorCalculadora}` : ""}
              readOnly
              placeholder="R$ 0,00"
              className="text-2xl text-center font-bold h-14 border-border bg-background text-foreground"
            />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumeroClick(num.toString())}
                  className="h-14 text-xl font-semibold"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleLimpar}
                className="h-14 text-xl font-semibold"
              >
                C
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumeroClick("0")}
                className="h-14 text-xl font-semibold"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumeroClick(".")}
                className="h-14 text-xl font-semibold"
              >
                .
              </Button>
            </div>
            <Button
              onClick={handleDepositar}
              disabled={
                !valorCalculadora || Number.parseFloat(valorCalculadora) <= 0
              }
              className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-foreground"
            >
              Confirmar Deposito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saque Dialog */}
      <Dialog open={isSaqueOpen} onOpenChange={setIsSaqueOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <ArrowDownCircle className="h-6 w-6" />
              Registrar Saque
            </DialogTitle>
            <DialogDescription>
              Informe o valor sacado da plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={valorCalculadora ? `R$ ${valorCalculadora}` : ""}
              readOnly
              placeholder="R$ 0,00"
              className="text-2xl text-center font-bold h-14 border-border bg-background text-foreground"
            />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumeroClick(num.toString())}
                  className="h-14 text-xl font-semibold"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleLimpar}
                className="h-14 text-xl font-semibold"
              >
                C
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumeroClick("0")}
                className="h-14 text-xl font-semibold"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumeroClick(".")}
                className="h-14 text-xl font-semibold"
              >
                .
              </Button>
            </div>
            <Button
              onClick={handleSacar}
              disabled={
                !valorCalculadora || Number.parseFloat(valorCalculadora) <= 0
              }
              className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-foreground"
            >
              Confirmar Saque
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Historico Dialog */}
      <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="h-6 w-6 text-primary" />
              Historico de Transacoes
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-2">
            {balanceData.transacoes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma transacao ainda</p>
              </div>
            ) : (
              balanceData.transacoes.map((transacao) => (
                <Card
                  key={transacao.id}
                  className={`p-4 ${
                    transacao.tipo === "deposito"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-green-500/30 bg-green-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {transacao.tipo === "deposito" ? (
                        <ArrowUpCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-green-500" />
                      )}
                      <div>
                        <p className="font-semibold capitalize text-foreground">
                          {transacao.tipo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transacao.data}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        transacao.tipo === "deposito"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {transacao.tipo === "deposito" ? "-" : "+"}R${" "}
                      {transacao.valor.toFixed(2)}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
          {balanceData.transacoes.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                onClick={handleLimparHistorico}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Historico e Zerar Valores
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
