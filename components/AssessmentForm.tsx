import React, { useMemo, useRef, useState } from 'react';
import {
  DPIAFormData,
  LegalBasis,
  RiskLevel,
  TransferMechanism,
} from '../types';
import {
  calculateRisk,
  getRiskConfig,
  ImportedDpiaPayload,
  initialFormState,
  LEGAL_BASIS_LABELS,
  parseImportedDpiaJson,
  PRESET_TEMPLATES,
  TRANSFER_MECHANISM_LABELS,
} from '../utils/riskLogic';
import { InputGroup } from './InputGroup';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';

interface AssessmentFormProps {
  formData: DPIAFormData;
  isEditingRecord: boolean;
  onChange: React.Dispatch<React.SetStateAction<DPIAFormData>>;
  onImportPayload: (payload: ImportedDpiaPayload) => void;
  onResetForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  formData,
  isEditingRecord,
  onChange,
  onImportPayload,
  onResetForm,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const livePreview = useMemo(() => calculateRisk(formData), [formData]);
  const riskConfig = getRiskConfig(livePreview.riskLevel);
  const triggeredCount = livePreview.triggeredCriteria.filter((c) => c.triggered).length;

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const payload = parseImportedDpiaJson(content);
      onImportPayload(payload);
      setImportFeedback({
        type: 'success',
        message: `Avaliação "${payload.formData.projectName || file.name}" importada com sucesso. Revise os campos e gere o relatório atualizado.`,
      });
    } catch (err) {
      setImportFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível ler o arquivo JSON selecionado.',
      });
    }
  };

  const handleFieldChange = <K extends keyof DPIAFormData>(field: K, value: DPIAFormData[K]) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'intlTransfer' && value === false
        ? { transferMechanism: TransferMechanism.NONE }
        : {}),
      ...(field === 'intlTransfer' && value === true && prev.transferMechanism === TransferMechanism.NONE
        ? { transferMechanism: TransferMechanism.UNSPECIFIED }
        : {}),
    }));
  };

  const handleNestedToggle = (
    category: 'dataNature' | 'dataSubjects' | 'existingControls',
    field: string
  ) => {
    onChange((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !(prev[category] as Record<string, boolean>)[field],
      },
    }));
  };

  const RiskIcon =
    livePreview.riskLevel === RiskLevel.HIGH
      ? ShieldAlert
      : livePreview.riskLevel === RiskLevel.MEDIUM
      ? AlertTriangle
      : ShieldCheck;

  return (
    <div className="space-y-6">
      {/* Quick-fill Scenarios Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Modelos de Cenário GDPR</h2>
          <p className="text-xs text-slate-500">
            Carregue um caso típico para agilizar o preenchimento ou inicie um formulário limpo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleJsonFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold text-[#0F4C81] bg-[#0F4C81]/8 hover:bg-[#0F4C81]/14 border border-[#0F4C81]/25 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload size={13} />
            Importar JSON
          </button>
          {PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                setImportFeedback(null);
                onResetForm();
                onChange(tpl.data);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {tpl.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setImportFeedback(null);
              onResetForm();
              onChange(initialFormState);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw size={13} />
            Limpar
          </button>
        </div>
      </div>

      {importFeedback && (
        <div
          role={importFeedback.type === 'error' ? 'alert' : 'status'}
          className={`px-4 py-3 rounded-md border text-xs flex items-center justify-between gap-3 ${
            importFeedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span>{importFeedback.message}</span>
          <button
            type="button"
            onClick={() => setImportFeedback(null)}
            className="font-semibold hover:underline shrink-0 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main 2-column workspace: Form + Sticky Live Screening */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {/* Section 1: Identificação & Base Legal */}
          <section className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Identificação do Tratamento & Base Legal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Contextualize a iniciativa, o responsável interno e o fundamento jurídico (Art. 6 GDPR).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Nome do Projeto ou Processo *
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  placeholder="Ex: Novo Portal de Benefícios de RH"
                  value={formData.projectName}
                  onChange={(e) => handleFieldChange('projectName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Departamento Responsável *
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  placeholder="Ex: Recursos Humanos"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Gestor / Data Owner
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  placeholder="Ex: Mariana Silva"
                  value={formData.ownerName}
                  onChange={(e) => handleFieldChange('ownerName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Base Legal Principal (Art. 6 GDPR)
                </label>
                <select
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  value={formData.legalBasis}
                  onChange={(e) => handleFieldChange('legalBasis', e.target.value as LegalBasis)}
                >
                  {Object.entries(LEGAL_BASIS_LABELS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.article} — {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Finalidade, Necessidade e Fluxo de Dados
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  placeholder="Descreva objetivamente quais dados são coletados, por que são necessários e quem tem acesso."
                  value={formData.purposeDescription}
                  onChange={(e) => handleFieldChange('purposeDescription', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Prazo de Retenção
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]"
                  placeholder="Ex: 5 anos"
                  value={formData.retentionPeriod}
                  onChange={(e) => handleFieldChange('retentionPeriod', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Natureza dos Dados & Titulares */}
          <section className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                2. Categorias de Dados & Titulares Envolvidos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifique categorias especiais (Art. 9/10) e grupos em situação de vulnerabilidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup
                label="Natureza dos Dados Pessoais"
                description="Selecione todas as categorias tratadas."
              >
                <CheckboxRow
                  checked={formData.dataNature.cadastral}
                  onChange={() => handleNestedToggle('dataNature', 'cadastral')}
                  label="Dados cadastrais (nome, e-mail, documento)"
                />
                <CheckboxRow
                  checked={formData.dataNature.financial}
                  onChange={() => handleNestedToggle('dataNature', 'financial')}
                  label="Dados financeiros, bancários ou de crédito"
                />
                <CheckboxRow
                  checked={formData.dataNature.behavioral}
                  onChange={() => handleNestedToggle('dataNature', 'behavioral')}
                  label="Localização, telemetria ou perfil comportamental"
                />
                <CheckboxRow
                  checked={formData.dataNature.sensitive}
                  onChange={() => handleNestedToggle('dataNature', 'sensitive')}
                  label="Dados sensíveis (Art. 9: saúde, biometria, origem)"
                  critical
                />
                <CheckboxRow
                  checked={formData.dataNature.criminal}
                  onChange={() => handleNestedToggle('dataNature', 'criminal')}
                  label="Condenações penais ou infrações (Art. 10)"
                  critical
                />
              </InputGroup>

              <InputGroup
                label="Titulares dos Dados"
                description="Quem são as pessoas físicas afetadas?"
              >
                <CheckboxRow
                  checked={formData.dataSubjects.general}
                  onChange={() => handleNestedToggle('dataSubjects', 'general')}
                  label="Clientes, leads ou usuários gerais"
                />
                <CheckboxRow
                  checked={formData.dataSubjects.employees}
                  onChange={() => handleNestedToggle('dataSubjects', 'employees')}
                  label="Colaboradores / candidatos (assimetria de poder)"
                />
                <CheckboxRow
                  checked={formData.dataSubjects.patients}
                  onChange={() => handleNestedToggle('dataSubjects', 'patients')}
                  label="Pacientes ou beneficiários assistenciais"
                  critical
                />
                <CheckboxRow
                  checked={formData.dataSubjects.children}
                  onChange={() => handleNestedToggle('dataSubjects', 'children')}
                  label="Crianças ou adolescentes (Art. 8 GDPR)"
                  critical
                />
              </InputGroup>
            </div>
          </section>

          {/* Section 3: Escopo, Critérios WP29 & Transferência */}
          <section className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                3. Escala, Critérios WP29 (Art. 35) & Fluxo Internacional
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Avalie os gatilhos de alto risco definidos pelo European Data Protection Board (EDPB).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Escala e Abrangência do Tratamento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'SMALL', title: 'Pequena Escala', desc: 'Local / unidade restrita' },
                  { value: 'MEDIUM', title: 'Média Escala', desc: 'Departamental / regional' },
                  { value: 'LARGE', title: 'Grande Escala', desc: 'Nacional / alto volume' },
                ].map((opt) => {
                  const active = formData.scale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleFieldChange('scale', opt.value as DPIAFormData['scale'])
                      }
                      className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <YesNoRow
                label="Tomada de decisão automatizada com efeito jurídico/relevante (Art. 22)?"
                value={formData.autoDecision}
                onChange={(val) => handleFieldChange('autoDecision', val)}
              />
              <YesNoRow
                label="Monitoramento sistemático de titulares ou áreas acessíveis (Art. 35(3)(c))?"
                value={formData.monitoring}
                onChange={(val) => handleFieldChange('monitoring', val)}
              />
              <YesNoRow
                label="Uso inovador de novas tecnologias (IA, reconhecimento facial, IoT)?"
                value={formData.newTech}
                onChange={(val) => handleFieldChange('newTech', val)}
              />
              <YesNoRow
                label="Cruzamento ou combinação de conjuntos de dados distintos?"
                value={formData.dataMatching}
                onChange={(val) => handleFieldChange('dataMatching', val)}
              />
              <YesNoRow
                label="O tratamento pode impedir o titular de exercer direito ou acessar serviço?"
                value={formData.rightsRestriction}
                onChange={(val) => handleFieldChange('rightsRestriction', val)}
              />
              <YesNoRow
                label="Há transferência internacional de dados fora do EEE / país de origem?"
                value={formData.intlTransfer}
                onChange={(val) => handleFieldChange('intlTransfer', val)}
              />
            </div>

            {formData.intlTransfer && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-md space-y-2">
                <label className="block text-xs font-semibold text-amber-900">
                  Mecanismo de Transferência Internacional (Capítulo V GDPR)
                </label>
                <select
                  className="w-full border border-amber-300 bg-white px-3 py-2 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  value={formData.transferMechanism}
                  onChange={(e) =>
                    handleFieldChange('transferMechanism', e.target.value as TransferMechanism)
                  }
                >
                  {Object.entries(TRANSFER_MECHANISM_LABELS)
                    .filter(([key]) => key !== TransferMechanism.NONE)
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </section>

          {/* Section 4: Controles Existentes (Mitigação) */}
          <section className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                4. Controles de Mitigação Já Implementados (Art. 25 & Art. 32)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Medidas técnicas e organizacionais comprovadas reduzem o risco residual calculado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <CheckboxRow
                checked={formData.existingControls.encryption}
                onChange={() => handleNestedToggle('existingControls', 'encryption')}
                label="Criptografia forte em repouso e trânsito (TLS 1.3 / AES-256)"
              />
              <CheckboxRow
                checked={formData.existingControls.pseudonymization}
                onChange={() => handleNestedToggle('existingControls', 'pseudonymization')}
                label="Pseudonimização ou anonimização de identificadores"
              />
              <CheckboxRow
                checked={formData.existingControls.accessControlMfa}
                onChange={() => handleNestedToggle('existingControls', 'accessControlMfa')}
                label="Controle de acesso mínimo (RBAC) com MFA obrigatório"
              />
              <CheckboxRow
                checked={formData.existingControls.retentionAutomation}
                onChange={() => handleNestedToggle('existingControls', 'retentionAutomation')}
                label="Expurgo automatizado conforme tabela de temporalidade"
              />
              <CheckboxRow
                checked={formData.existingControls.dpoConsulted}
                onChange={() => handleNestedToggle('existingControls', 'dpoConsulted')}
                label="Parecer preliminar do DPO / Comitê de Privacidade obtido"
              />
            </div>
          </section>
        </div>

        {/* Sticky Live Screening Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">Triagem em Tempo Real</div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  Prévia de Risco GDPR
                </h3>
              </div>
              <RiskIcon size={22} className={riskConfig.iconColor} />
            </div>

            {/* Residual Risk Readout */}
            <div className={`p-4 rounded-md border ${riskConfig.containerClass}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold">{riskConfig.label}</span>
                <span className="text-xs font-mono tabular-nums font-semibold">
                  Residual: {livePreview.residualScore} pts
                </span>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed opacity-90">{riskConfig.message}</p>
            </div>

            {/* Inherent vs Mitigation Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
              <div className="p-2">
                <div className="text-xs text-slate-500">Inerente</div>
                <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {livePreview.inherentScore}
                </div>
              </div>
              <div className="p-2 border-x border-slate-100">
                <div className="text-xs text-slate-500">Controles</div>
                <div className="text-lg font-mono font-semibold text-emerald-700 tabular-nums">
                  -{livePreview.mitigationCredits}
                </div>
              </div>
              <div className="p-2">
                <div className="text-xs text-slate-500">Residual</div>
                <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums">
                  {livePreview.residualScore}
                </div>
              </div>
            </div>

            {/* WP29 Trigger Status */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Critérios WP29 / EDPB</span>
                <span className="font-mono tabular-nums text-slate-600">
                  {triggeredCount} / 9 ativos
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {livePreview.dpiaMandatory ? (
                  <span className="font-semibold text-red-700">DPIA Obrigatória (Art. 35): </span>
                ) : (
                  <span className="font-semibold text-slate-800">Triagem Preliminar: </span>
                )}
                {livePreview.mandatoryReason}
              </p>

              {triggeredCount > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {livePreview.triggeredCriteria
                    .filter((c) => c.triggered)
                    .map((criterion) => (
                      <li
                        key={criterion.id}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <CheckCircle2 size={14} className="text-[#0F4C81] shrink-0 mt-0.5" />
                        <span>{criterion.label}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F4C81] hover:bg-[#0c3c66] text-white font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap cursor-pointer"
            >
              {isEditingRecord ? 'Atualizar Relatório DPIA' : 'Gerar Relatório DPIA'}
              <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

interface CheckboxRowProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  critical?: boolean;
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ checked, onChange, label, critical }) => {
  return (
    <label
      className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
        checked
          ? critical
            ? 'bg-red-50/70 border-red-200 text-red-950'
            : 'bg-slate-50 border-slate-300 text-slate-900'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${
          critical ? 'accent-red-600' : 'accent-[#0F4C81]'
        }`}
      />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
};

interface YesNoRowProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

const YesNoRow: React.FC<YesNoRowProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md border border-slate-200 bg-slate-50/60">
      <span className="text-sm text-slate-800">{label}</span>
      <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
            !value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Não
        </button>
      </div>
    </div>
  );
};
