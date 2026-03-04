"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Save,
  Trash2,
  History,
  X,
  AlertTriangle,
  Info,
  Target,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DiaProgressao = {
  dia: number;
  meta: number;
  acumulado: number;
  metaNoDia: number;
};

type ProgressaoSalva = {
  id: string;
  data: string;
  valorInicial: number;
  percentualMeta: number;
  jurosCompostos: boolean;
  progressao: DiaProgressao[];
};

export function ProgressaoContent() {
  const [valorInicial, setValorInicial] = useState("");
  const [percentualMeta, setPercentualMeta] = useState("1");
  const [jurosCompostos, setJurosCompostos] = useState(false);
  const [progressao, setProgressao] = useState<DiaProgressao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalvosModalOpen, setIsSalvosModalOpen] = useState(false);
  const [progressoesSalvas, setProgressoesSalvas] = useState<ProgressaoSalva[]>(
    [],
  );
  const [progressaoSelecionada, setProgressaoSelecionada] =
    useState<ProgressaoSalva | null>(null);

  const showRiskWarning = Number.parseFloat(percentualMeta) > 3;

  useEffect(() => {
    const salvas = localStorage.getItem("progressoes-salvas");
    if (salvas) {
      setProgressoesSalvas(JSON.parse(salvas));
    }
  }, []);

  const calcularProgressao = () => {
    const inicial = Number.parseFloat(valorInicial);
    const percentual = Number.parseFloat(percentualMeta);

    if (!inicial || !percentual || inicial <= 0 || percentual <= 0) {
      alert("Por favor, preencha os valores corretamente.");
      return;
    }

    const dias: DiaProgressao[] = [];
    let bancaAtual = inicial;
    let acumuladoTotal = 0;

    for (let dia = 1; dia <= 30; dia++) {
      let metaNoDia: number;

      if (jurosCompostos) {
        metaNoDia = bancaAtual * (percentual / 100);
        bancaAtual = bancaAtual + metaNoDia;
      } else {
        metaNoDia = inicial * (percentual / 100);
      }

      acumuladoTotal += metaNoDia;

      dias.push({
        dia,
        meta: metaNoDia,
        acumulado: acumuladoTotal,
        metaNoDia,
      });
    }

    setProgressao(dias);
    setProgressaoSelecionada(null);
    setIsModalOpen(true);
  };

  const salvarProgressao = () => {
    const novaProgressao: ProgressaoSalva = {
      id: Date.now().toString(),
      data: new Date().toLocaleString("pt-BR"),
      valorInicial: Number.parseFloat(valorInicial),
      percentualMeta: Number.parseFloat(percentualMeta),
      jurosCompostos,
      progressao,
    };

    const novaLista = [...progressoesSalvas, novaProgressao];
    setProgressoesSalvas(novaLista);
    localStorage.setItem("progressoes-salvas", JSON.stringify(novaLista));
    alert("Planejamento salvo com sucesso!");
  };

  const removerProgressao = (id: string) => {
    const novaLista = progressoesSalvas.filter((p) => p.id !== id);
    setProgressoesSalvas(novaLista);
    localStorage.setItem("progressoes-salvas", JSON.stringify(novaLista));
  };

  const limparTodasProgressoes = () => {
    if (
      confirm("Tem certeza que deseja remover todos os planejamentos salvos?")
    ) {
      setProgressoesSalvas([]);
      localStorage.removeItem("progressoes-salvas");
    }
  };

  const visualizarProgressaoSalva = (salva: ProgressaoSalva) => {
    setProgressaoSelecionada(salva);
    setProgressao(salva.progressao);
    setIsSalvosModalOpen(false);
    setIsModalOpen(true);
  };

  const dadosExibicao = progressaoSelecionada || {
    valorInicial: Number.parseFloat(valorInicial),
    percentualMeta: Number.parseFloat(percentualMeta),
    jurosCompostos,
    progressao,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/20" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide sm:text-3xl">
              Planejamento de Metas
            </h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Simulacao de metas para 30 dias
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-muted-foreground text-sm">
          <strong className="text-amber-500">Simulacao teorica.</strong> Os
          resultados apresentados sao apenas projecoes matematicas e nao
          representam garantia de ganhos. Resultados reais dependem de
          diversos fatores e podem variar significativamente.
        </AlertDescription>
      </Alert>

      <Card className="p-8 border-2 bg-card">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="valorInicial" className="text-base font-semibold text-foreground">
              Valor Inicial da Banca (R$)
            </Label>
            <Input
              id="valorInicial"
              type="number"
              placeholder="1000.00"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              className="h-12 text-lg border-border bg-background text-foreground"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold text-foreground">
              Percentual de Meta Diaria (%)
            </Label>
            <Select value={percentualMeta} onValueChange={setPercentualMeta}>
              <SelectTrigger className="h-12 text-lg border-border bg-background text-foreground">
                <SelectValue placeholder="Selecione o percentual" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                <SelectItem value="0.5">0.5% (Conservador)</SelectItem>
                <SelectItem value="1">1% (Recomendado)</SelectItem>
                <SelectItem value="1.5">1.5%</SelectItem>
                <SelectItem value="2">2%</SelectItem>
                <SelectItem value="2.5">2.5%</SelectItem>
                <SelectItem value="3">3% (Limite seguro)</SelectItem>
                <SelectItem value="4">4% (Alto risco)</SelectItem>
                <SelectItem value="5">5% (Muito alto risco)</SelectItem>
              </SelectContent>
            </Select>

            {showRiskWarning && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400 text-sm">
                  Metas acima de 3% representam alto risco e sao dificeis de
                  manter consistentemente. Prossiga com cautela e
                  responsabilidade.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="jurosCompostos"
                className="text-base font-semibold cursor-pointer text-foreground"
              >
                Juros Compostos
              </Label>
              <p className="text-sm text-muted-foreground">
                Reinvestir o resultado diario na banca
              </p>
            </div>
            <Switch
              id="jurosCompostos"
              checked={jurosCompostos}
              onCheckedChange={setJurosCompostos}
            />
          </div>

          <Button
            onClick={calcularProgressao}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            <BarChart3 className="h-5 w-5" />
            Simular Planejamento
          </Button>

          <Button
            onClick={() => setIsSalvosModalOpen(true)}
            variant="outline"
            className="w-full h-12"
          >
            <History className="h-5 w-5" />
            Ver Planejamentos Salvos ({progressoesSalvas.length})
          </Button>
        </div>
      </Card>

      {/* Modal de Resultados */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <Calendar className="h-6 w-6 text-primary" />
              Planejamento de Metas (30 dias)
              {progressaoSelecionada && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Salvo em {progressaoSelecionada.data})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {dadosExibicao.jurosCompostos
                ? "Com juros compostos"
                : "Com juros simples"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-2">
            {/* Disclaimer no modal */}
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Info className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-muted-foreground text-xs">
                <strong className="text-amber-500">Simulacao teorica.</strong>{" "}
                Resultados reais podem variar. Esta projecao nao constitui
                promessa ou garantia de ganhos.
              </AlertDescription>
            </Alert>

            {progressao.length > 0 && (
              <>
                <Card className="p-6 bg-primary/10 border-primary/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Valor Inicial
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        R$ {dadosExibicao.valorInicial.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Resultado Acumulado (30 dias)
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        +R$ {progressao[29].acumulado.toFixed(2)}
                      </p>
                    </div>
                    {dadosExibicao.jurosCompostos && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Banca Final Projetada
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            R${" "}
                            {(
                              dadosExibicao.valorInicial +
                              progressao[29].acumulado
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Crescimento Projetado
                          </p>
                          <p className="text-2xl font-bold text-blue-500">
                            {(
                              (progressao[29].acumulado /
                                dadosExibicao.valorInicial) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {!progressaoSelecionada && (
                  <Button
                    onClick={salvarProgressao}
                    className="w-full"
                    variant="secondary"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Este Planejamento
                  </Button>
                )}

                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    Detalhamento Diario
                  </h3>
                  {progressao.map((dia) => (
                    <Card
                      key={dia.dia}
                      className="p-4 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center">
                            {dia.dia}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Dia {dia.dia}</p>
                            <p className="text-sm text-muted-foreground">
                              Meta: R$ {dia.meta.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">
                            +R$ {dia.metaNoDia.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Acumulado: R$ {dia.acumulado.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Salvos */}
      <Dialog open={isSalvosModalOpen} onOpenChange={setIsSalvosModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <History className="h-6 w-6 text-primary" />
              Planejamentos Salvos
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-2">
            {progressoesSalvas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum planejamento salvo ainda.</p>
                <p className="text-sm">
                  Simule um planejamento e salve para ver aqui.
                </p>
              </div>
            ) : (
              <>
                <Button
                  onClick={limparTodasProgressoes}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Todos os Planejamentos
                </Button>

                <div className="flex flex-col gap-3">
                  {progressoesSalvas.map((salva) => (
                    <Card
                      key={salva.id}
                      className="p-4 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          className="flex flex-1 items-center gap-3 text-left"
                          onClick={() => visualizarProgressaoSalva(salva)}
                        >
                          <div className="bg-primary/10 text-primary p-2 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              R$ {salva.valorInicial.toFixed(2)} -{" "}
                              {salva.percentualMeta}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {salva.jurosCompostos
                                ? "Juros Compostos"
                                : "Juros Simples"}{" "}
                              - {salva.data}
                            </p>
                            <p className="text-sm text-green-500 font-medium">
                              Resultado Projetado: +R${" "}
                              {salva.progressao[29].acumulado.toFixed(2)}
                            </p>
                          </div>
                        </button>
                        <Button
                          onClick={() => removerProgressao(salva.id)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
