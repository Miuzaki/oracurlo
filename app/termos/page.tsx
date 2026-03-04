import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Aceitacao dos Termos",
    content:
      "Ao acessar e utilizar a plataforma Oraculo Aviator, voce concorda em cumprir e estar vinculado a estes Termos de Servico. Se voce nao concordar com qualquer parte destes termos, nao devera utilizar nossos servicos. A utilizacao continuada da plataforma constitui aceitacao de quaisquer alteracoes ou modificacoes feitas nestes termos.",
  },
  {
    title: "2. Elegibilidade",
    content:
      "Para utilizar os servicos da Oraculo Aviator, voce deve ter pelo menos 18 anos de idade e possuir capacidade legal para celebrar contratos vinculantes. Ao se registrar, voce declara e garante que atende a todos os requisitos de elegibilidade. A plataforma se reserva o direito de verificar a idade e identidade dos usuarios a qualquer momento.",
  },
  {
    title: "3. Registro e Conta",
    content:
      "Voce e responsavel por manter a confidencialidade de suas credenciais de acesso, incluindo nome de usuario e senha. Todas as atividades realizadas em sua conta sao de sua responsabilidade. Voce concorda em notificar imediatamente a Oraculo Aviator sobre qualquer uso nao autorizado de sua conta ou qualquer outra violacao de seguranca.",
  },
  {
    title: "4. Depositos e Saques",
    content:
      "Os depositos e saques estao sujeitos aos limites e prazos estabelecidos pela plataforma. A Oraculo Aviator utiliza metodos de pagamento seguros e criptografados para proteger suas transacoes financeiras. Os prazos de processamento podem variar de acordo com o metodo de pagamento escolhido. A plataforma se reserva o direito de solicitar documentacao adicional para verificacao de identidade antes de processar saques.",
  },
  {
    title: "5. Jogo Responsavel",
    content:
      "A Oraculo Aviator promove o jogo responsavel e oferece ferramentas para ajudar os usuarios a gerenciar sua atividade de jogo. Voce pode definir limites de deposito, limites de perda e periodos de autoexclusao a qualquer momento. Se voce acredita que tem um problema com jogos de azar, encorajamos a procurar ajuda profissional. A plataforma nao se responsabiliza por perdas decorrentes do uso de seus servicos.",
  },
  {
    title: "6. Propriedade Intelectual",
    content:
      "Todo o conteudo da plataforma Oraculo Aviator, incluindo mas nao limitado a textos, graficos, logos, icones, imagens, clips de audio, downloads digitais e compilacoes de dados, e de propriedade da Oraculo Aviator ou de seus fornecedores de conteudo e e protegido por leis de direitos autorais brasileiras e internacionais.",
  },
  {
    title: "7. Privacidade e Protecao de Dados",
    content:
      "A Oraculo Aviator coleta, armazena e processa dados pessoais de acordo com a Lei Geral de Protecao de Dados (LGPD). Seus dados pessoais serao utilizados exclusivamente para fins de prestacao de servicos, seguranca e cumprimento de obrigacoes legais. Voce tem o direito de solicitar acesso, correcao ou exclusao de seus dados pessoais a qualquer momento.",
  },
  {
    title: "8. Limitacao de Responsabilidade",
    content:
      "A Oraculo Aviator nao sera responsavel por quaisquer danos diretos, indiretos, incidentais, especiais ou consequentes resultantes do uso ou da incapacidade de uso da plataforma. Os servicos sao fornecidos 'como estao' e 'conforme disponiveis', sem garantias de qualquer tipo, expressas ou implicitas.",
  },
  {
    title: "9. Modificacoes dos Termos",
    content:
      "A Oraculo Aviator se reserva o direito de modificar estes Termos de Servico a qualquer momento. As alteracoes serao comunicadas por meio de notificacao na plataforma. O uso continuado dos servicos apos a publicacao de alteracoes constitui aceitacao dos novos termos.",
  },
  {
    title: "10. Legislacao Aplicavel",
    content:
      "Estes Termos de Servico serao regidos e interpretados de acordo com as leis da Republica Federativa do Brasil. Qualquer disputa decorrente destes termos sera submetida a jurisdicao exclusiva dos tribunais competentes do Brasil.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background noise-overlay">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/20" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground uppercase tracking-wide text-balance">
              Termos de Servico
            </h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Ultima atualizacao: Fevereiro 2026
            </p>
          </div>

          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bem-vindo a Oraculo Aviator. Leia atentamente estes Termos de Servico
                antes de utilizar nossa plataforma. Ao utilizar nossos servicos,
                voce concorda com os termos descritos abaixo.
              </p>

              {sections.map((section, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {i > 0 && <Separator className="mb-2 bg-border/50" />}
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}

              <Separator className="bg-border/50" />
              <p className="font-mono text-xs text-muted-foreground text-center">
                Em caso de duvidas sobre estes termos, entre em contato com
                nosso suporte.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
