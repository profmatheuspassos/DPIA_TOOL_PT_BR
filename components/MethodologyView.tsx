import React from 'react';
import { LEGAL_BASIS_LABELS } from '../utils/riskLogic';

const WP29_REFERENCE = [
  {
    index: '01',
    title: 'Avaliação ou pontuação (Profiling)',
    article: 'Art. 35(3)(a) · WP248',
    description:
      'Predição ou análise de aspectos pessoais, situação econômica, saúde, preferências ou desempenho profissional.',
  },
  {
    index: '02',
    title: 'Decisão automatizada com efeito legal',
    article: 'Art. 22 · WP248',
    description:
      'Decisões tomadas exclusivamente por meio automatizado que produzem efeitos jurídicos ou afetam significativamente o titular.',
  },
  {
    index: '03',
    title: 'Monitoramento sistemático',
    article: 'Art. 35(3)(c) · WP248',
    description:
      'Observação contínua, rastreamento de localização, telemetria ou vigilância em áreas acessíveis ao público ou ambiente laboral.',
  },
  {
    index: '04',
    title: 'Dados sensíveis ou altamente pessoais',
    article: 'Art. 9 & Art. 10 · WP248',
    description:
      'Dados de saúde, biometria, genéticos, origem racial, convicções, registros criminais ou dados financeiros de alta criticidade.',
  },
  {
    index: '05',
    title: 'Tratamento em larga escala',
    article: 'Considerando 91 · WP248',
    description:
      'Avaliado segundo volume de titulares, extensão geográfica, duração e variedade de dados tratados simultaneamente.',
  },
  {
    index: '06',
    title: 'Cruzamento de conjuntos de dados',
    article: 'WP248 Critério 6',
    description:
      'Combinação ou correlação de bases coletadas para finalidades distintas que extrapola a expectativa razoável do titular.',
  },
  {
    index: '07',
    title: 'Titulares vulneráveis',
    article: 'Considerando 75 · WP248',
    description:
      'Crianças, idosos, pacientes ou colaboradores (em razão do desequilíbrio de poder frente ao empregador).',
  },
  {
    index: '08',
    title: 'Uso inovador de novas tecnologias',
    article: 'Art. 35(1) · WP248',
    description:
      'Emprego de inteligência artificial, reconhecimento facial, IoT ou soluções organizacionais cujo impacto ainda não é consolidado.',
  },
  {
    index: '09',
    title: 'Impedimento de direito ou serviço',
    article: 'WP248 Critério 9',
    description:
      'Operações que impedem o titular de exercer um direito ou usufruir de um serviço ou contrato (ex: triagem de crédito ou acesso).',
  },
];

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Methodology Intro */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Metodologia de Triagem GDPR Art. 35 & Diretrizes EDPB (WP248)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          De acordo com o Artigo 35 do GDPR e o documento orientativo WP248 rev.01 do European Data
          Protection Board (EDPB), a Avaliação de Impacto sobre a Proteção de Dados (DPIA) é
          obrigatória sempre que o tratamento resultar em alto risco aos direitos e liberdades dos
          titulares — em regra, quando <strong>dois ou mais critérios</strong> abaixo são
          acionados simultaneamente, ou nos casos explícitos do Art. 35(3).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div className="p-4 rounded-md bg-emerald-50/70 border border-emerald-200">
            <div className="text-xs font-mono font-semibold text-emerald-800">0–3 pontos</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">Baixo Risco</div>
            <p className="text-xs text-slate-600 mt-1">
              Dados cadastrais em pequena escala sem gatilhos críticos. Manter registro no ROPA (Art. 30).
            </p>
          </div>
          <div className="p-4 rounded-md bg-amber-50/70 border border-amber-200">
            <div className="text-xs font-mono font-semibold text-amber-800">4–8 pontos</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">Médio Risco</div>
            <p className="text-xs text-slate-600 mt-1">
              Exige controles técnicos documentados, revisão de proporcionalidade e mitigação específica.
            </p>
          </div>
          <div className="p-4 rounded-md bg-red-50/70 border border-red-200">
            <div className="text-xs font-mono font-semibold text-red-800">9+ pontos ou combinação crítica</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">Alto Risco</div>
            <p className="text-xs text-slate-600 mt-1">
              DPIA completa obrigatória e parecer formal do DPO antes do início do processamento.
            </p>
          </div>
        </div>
      </section>

      {/* 9 WP29 Criteria Grid */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Os 9 Critérios de Alto Risco (WP248 rev.01)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Utilizados automaticamente pelo motor de triagem para determinar a obrigatoriedade do Art. 35.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WP29_REFERENCE.map((item) => (
            <div
              key={item.index}
              className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#0F4C81]">{item.index}.</span>
                <span className="font-mono text-slate-500">{item.article}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Bases Art. 6 */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Bases Legais Aplicáveis (Art. 6(1) GDPR)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Todo tratamento requer ao menos uma hipótese legal válida e documentada antes da coleta.
          </p>
        </div>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
          {Object.entries(LEGAL_BASIS_LABELS).map(([key, info]) => (
            <div key={key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-900">{info.label}</span>
              <span className="font-mono text-xs text-slate-500">{info.article}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
