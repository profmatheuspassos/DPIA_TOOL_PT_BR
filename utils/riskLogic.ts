import {
  AssessmentResult,
  DPIAFormData,
  DPIARecord,
  LegalBasis,
  RecommendationItem,
  RiskLevel,
  TransferMechanism,
  WP29Trigger,
} from '../types';

export const initialFormState: DPIAFormData = {
  projectName: '',
  department: '',
  ownerName: '',
  purposeDescription: '',
  legalBasis: LegalBasis.CONTRACT,
  retentionPeriod: '5 anos após término da relação',
  dataNature: {
    cadastral: true,
    financial: false,
    sensitive: false,
    criminal: false,
    behavioral: false,
  },
  dataSubjects: {
    general: true,
    employees: false,
    children: false,
    patients: false,
  },
  scale: 'SMALL',
  autoDecision: false,
  monitoring: false,
  newTech: false,
  dataMatching: false,
  rightsRestriction: false,
  intlTransfer: false,
  transferMechanism: TransferMechanism.NONE,
  existingControls: {
    encryption: false,
    pseudonymization: false,
    accessControlMfa: false,
    retentionAutomation: false,
    dpoConsulted: false,
  },
};

export const LEGAL_BASIS_LABELS: Record<LegalBasis, { label: string; article: string }> = {
  [LegalBasis.CONSENT]: { label: 'Consentimento do Titular', article: 'Art. 6(1)(a)' },
  [LegalBasis.CONTRACT]: { label: 'Execução de Contrato', article: 'Art. 6(1)(b)' },
  [LegalBasis.LEGAL_OBLIGATION]: { label: 'Obrigação Legal ou Regulatória', article: 'Art. 6(1)(c)' },
  [LegalBasis.VITAL_INTERESTS]: { label: 'Proteção de Interesses Vitais', article: 'Art. 6(1)(d)' },
  [LegalBasis.PUBLIC_TASK]: { label: 'Interesse Público / Autoridade Oficial', article: 'Art. 6(1)(e)' },
  [LegalBasis.LEGITIMATE_INTEREST]: { label: 'Interesse Legítimo (requer LIA)', article: 'Art. 6(1)(f)' },
};

export const TRANSFER_MECHANISM_LABELS: Record<TransferMechanism, string> = {
  [TransferMechanism.NONE]: 'Não aplicável (armazenamento local)',
  [TransferMechanism.ADEQUACY]: 'Decisão de Adequação (Art. 45 GDPR)',
  [TransferMechanism.SCC]: 'Cláusulas Contratuais Padrão - SCC (Art. 46 GDPR)',
  [TransferMechanism.BCR]: 'Regras Corporativas Vinculativas - BCR (Art. 47 GDPR)',
  [TransferMechanism.UNSPECIFIED]: 'Salvaguarda ainda não definida',
};

export const evaluateWP29Criteria = (data: DPIAFormData): WP29Trigger[] => {
  const hasVulnerable =
    data.dataSubjects.children || data.dataSubjects.employees || data.dataSubjects.patients;
  const hasSensitiveOrCriminal = data.dataNature.sensitive || data.dataNature.criminal;
  const isLargeScale = data.scale === 'LARGE';

  return [
    {
      id: 'scoring',
      label: 'Avaliação ou pontuação (Profiling)',
      articleRef: 'WP248 Critério 1 · Art. 35(3)(a)',
      triggered: data.autoDecision || (data.dataNature.behavioral && data.dataNature.financial),
      detail: 'Análise preditiva, perfilamento financeiro ou avaliação de desempenho/comportamento.',
    },
    {
      id: 'auto-decision',
      label: 'Decisão automatizada com efeito jurídico',
      articleRef: 'WP248 Critério 2 · Art. 22 & 35(3)(a)',
      triggered: data.autoDecision,
      detail: 'Decisões sem intervenção humana significativa que afetam acesso a direitos ou serviços.',
    },
    {
      id: 'monitoring',
      label: 'Monitoramento sistemático',
      articleRef: 'WP248 Critério 3 · Art. 35(3)(c)',
      triggered: data.monitoring,
      detail: 'Observação contínua, geolocalização, telemetria ou vigilância de áreas acessíveis ou colaboradores.',
    },
    {
      id: 'sensitive',
      label: 'Dados sensíveis ou altamente pessoais',
      articleRef: 'WP248 Critério 4 · Art. 9, 10 & 35(3)(b)',
      triggered: hasSensitiveOrCriminal,
      detail: 'Categorias especiais (saúde, biometria, origem, crenças) ou registros criminais/financeiros críticos.',
    },
    {
      id: 'large-scale',
      label: 'Tratamento em larga escala',
      articleRef: 'WP248 Critério 5 · Considerando 91',
      triggered: isLargeScale,
      detail: 'Volume expressivo de titulares, cobertura nacional/regional ou longa permanência do tratamento.',
    },
    {
      id: 'matching',
      label: 'Cruzamento de conjuntos de dados',
      articleRef: 'WP248 Critério 6',
      triggered: data.dataMatching,
      detail: 'Combinação de bases distintas que excede a expectativa razoável do titular.',
    },
    {
      id: 'vulnerable',
      label: 'Titulares vulneráveis',
      articleRef: 'WP248 Critério 7 · Considerando 75',
      triggered: hasVulnerable,
      detail: 'Crianças/adolescentes, colaboradores (assimetria de poder), pacientes ou grupos vulneráveis.',
    },
    {
      id: 'new-tech',
      label: 'Uso inovador de novas tecnologias',
      articleRef: 'WP248 Critério 8 · Art. 35(1)',
      triggered: data.newTech,
      detail: 'Aplicação de IA generativa/preditiva, reconhecimento biométrico, IoT ou tecnologias emergentes.',
    },
    {
      id: 'rights-restriction',
      label: 'Impedimento de direito ou serviço',
      articleRef: 'WP248 Critério 9',
      triggered: data.rightsRestriction,
      detail: 'Operações que bloqueiam, limitam ou condicionam o exercício de um direito ou acesso a contrato.',
    },
  ];
};

const scoreToRiskLevel = (score: number, forceHigh: boolean): RiskLevel => {
  if (forceHigh || score >= 9) return RiskLevel.HIGH;
  if (score >= 4) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

export const calculateRisk = (data: DPIAFormData): AssessmentResult => {
  let inherentScore = 0;

  // High Impact Factors (+3)
  if (data.dataNature.sensitive) inherentScore += 3;
  if (data.dataSubjects.children) inherentScore += 3;
  if (data.dataSubjects.patients) inherentScore += 3;

  // Medium-High Impact Factors (+2)
  if (data.dataNature.criminal) inherentScore += 2;
  if (data.scale === 'LARGE') inherentScore += 2;
  if (data.scale === 'MEDIUM') inherentScore += 1;
  if (data.autoDecision) inherentScore += 2;
  if (data.monitoring) inherentScore += 2;
  if (data.dataMatching) inherentScore += 2;
  if (data.rightsRestriction) inherentScore += 2;

  // Base Factors (+1)
  if (data.dataNature.financial) inherentScore += 1;
  if (data.dataNature.behavioral) inherentScore += 1;
  if (data.dataSubjects.employees) inherentScore += 1;
  if (data.newTech) inherentScore += 1;
  if (data.intlTransfer) {
    inherentScore += data.transferMechanism === TransferMechanism.UNSPECIFIED ? 2 : 1;
  }

  // Mitigation Credits from Existing Controls (max reduction capped fairly)
  let mitigationCredits = 0;
  if (data.existingControls.encryption) mitigationCredits += 1;
  if (data.existingControls.pseudonymization) mitigationCredits += 1;
  if (data.existingControls.accessControlMfa) mitigationCredits += 1;
  if (data.existingControls.retentionAutomation) mitigationCredits += 1;
  if (data.existingControls.dpoConsulted) mitigationCredits += 1;

  const residualScore = Math.max(0, inherentScore - mitigationCredits);

  const triggeredCriteria = evaluateWP29Criteria(data);
  const triggeredCount = triggeredCriteria.filter((c) => c.triggered).length;

  // Art. 35(3) explicit triggers or >= 2 WP29 criteria => DPIA Mandatory
  const explicitArt35Trigger =
    (data.dataNature.sensitive && data.scale === 'LARGE') ||
    (data.autoDecision && (data.dataNature.sensitive || data.dataNature.financial || data.rightsRestriction)) ||
    (data.monitoring && data.scale === 'LARGE');

  const dpiaMandatory = explicitArt35Trigger || triggeredCount >= 2;

  let mandatoryReason =
    'Operação abaixo do limiar de alto risco do Art. 35. Recomenda-se registro simplificado no ROPA (Art. 30).';

  if (explicitArt35Trigger) {
    mandatoryReason =
      'Obrigatória pelo Art. 35(3) do GDPR: envolve tratamento sistemático automatizado, dados especiais em larga escala ou monitoramento contínuo.';
  } else if (triggeredCount >= 2) {
    mandatoryReason = `Obrigatória pelas diretrizes EDPB/WP248: ${triggeredCount} critérios de alto risco atingidos simultaneamente (regra dos 2+ critérios).`;
  } else if (triggeredCount === 1) {
    mandatoryReason =
      'Atinge 1 critério WP248. Avaliar proporcionalidade e documentar justificativa de dispensa ou prosseguir com DPIA simplificada.';
  }

  const hasCriticalCombination =
    (data.dataNature.sensitive || data.dataSubjects.children || data.dataSubjects.patients) &&
    (data.scale === 'LARGE' || data.autoDecision || data.monitoring);

  const inherentRiskLevel = scoreToRiskLevel(inherentScore, hasCriticalCombination);
  // Residual risk can drop from HIGH to MEDIUM only if strong controls cover the exposure and score drops below threshold
  const forceResidualHigh =
    hasCriticalCombination &&
    (!data.existingControls.encryption || !data.existingControls.accessControlMfa || !data.existingControls.dpoConsulted);

  const riskLevel = scoreToRiskLevel(residualScore, forceResidualHigh);

  const recommendations: RecommendationItem[] = [];

  if (riskLevel === RiskLevel.HIGH || dpiaMandatory) {
    recommendations.push({
      id: 'rec-dpo-approval',
      priority: 'Crítica',
      category: 'Governança',
      articleRef: 'Art. 35(2) & Art. 39',
      text: 'Submeter este relatório DPIA para parecer formal do DPO (Encarregado de Dados) antes da entrada em produção.',
    });
  }

  if (data.intlTransfer) {
    const missingSafeguard =
      data.transferMechanism === TransferMechanism.UNSPECIFIED ||
      data.transferMechanism === TransferMechanism.NONE;
    recommendations.push({
      id: 'rec-intl-transfer',
      priority: missingSafeguard ? 'Crítica' : 'Alta',
      category: 'Transferência Internacional',
      articleRef: 'Art. 44–49 GDPR',
      text: missingSafeguard
        ? 'Definir imediatamente mecanismo válido de transferência internacional (Cláusulas Contratuais Padrão - SCC ou Decisão de Adequação) e conduzir Transfer Impact Assessment (TIA).'
        : `Validar vigência da salvaguarda selecionada (${TRANSFER_MECHANISM_LABELS[data.transferMechanism]}) e documentar avaliação de acesso governamental (TIA).`,
    });
  }

  if (data.autoDecision) {
    recommendations.push({
      id: 'rec-auto-decision',
      priority: 'Crítica',
      category: 'Direitos dos Titulares',
      articleRef: 'Art. 22 GDPR',
      text: 'Implementar fluxo de revisão humana significativa, canal de contestação acessível e explicação clara da lógica algorítmica utilizada.',
    });
  }

  if (data.dataNature.sensitive || data.dataNature.criminal) {
    recommendations.push({
      id: 'rec-sensitive-security',
      priority: 'Crítica',
      category: 'Segurança Técnica',
      articleRef: 'Art. 9, 10 & 32',
      text: 'Aplicar criptografia forte em repouso (AES-256) e trânsito (TLS 1.3), segregação lógica de base e autenticação multifator (MFA) obrigatória para acesso administrativo.',
    });
  }

  if (data.dataSubjects.children) {
    recommendations.push({
      id: 'rec-children',
      priority: 'Crítica',
      category: 'Direitos dos Titulares',
      articleRef: 'Art. 8 & Art. 12',
      text: 'Estabelecer mecanismo verificável de consentimento parental (idade mínima aplicável) e avisos de privacidade em linguagem clara e acessível.',
    });
  }

  if (data.legalBasis === LegalBasis.LEGITIMATE_INTEREST) {
    recommendations.push({
      id: 'rec-lia',
      priority: 'Alta',
      category: 'Governança',
      articleRef: 'Art. 6(1)(f)',
      text: 'Elaborar e anexar o Teste de Ponderação de Interesse Legítimo (LIA) demonstrando necessidade, proporcionalidade e expectativa razoável do titular.',
    });
  }

  if (data.monitoring) {
    recommendations.push({
      id: 'rec-monitoring',
      priority: 'Alta',
      category: 'Direitos dos Titulares',
      articleRef: 'Art. 5(1)(c) & Art. 13',
      text: 'Executar Teste de Proporcionalidade para o monitoramento contínuo e exibir aviso transparente informando escopo, finalidade e prazo de retenção dos logs.',
    });
  }

  if (data.newTech) {
    recommendations.push({
      id: 'rec-new-tech',
      priority: 'Alta',
      category: 'Segurança Técnica',
      articleRef: 'Art. 25 Privacy by Design',
      text: 'Documentar auditoria de viés algorítmico, minimização de atributos no treinamento/inferência e testes de robustez contra vazamento de modelo.',
    });
  }

  if (data.dataMatching) {
    recommendations.push({
      id: 'rec-data-matching',
      priority: 'Alta',
      category: 'Governança',
      articleRef: 'Art. 5(1)(b) Finalidade',
      text: 'Validar compatibilidade de finalidade para o cruzamento de bases distintas e aplicar pseudonimização antes da correlação dos registros.',
    });
  }

  if (!data.existingControls.retentionAutomation) {
    recommendations.push({
      id: 'rec-retention',
      priority: 'Moderada',
      category: 'Governança',
      articleRef: 'Art. 5(1)(e)',
      text: `Automatizar rotina de expurgo ou anonimização ao término do ciclo definido (${data.retentionPeriod || 'prazo a definir'}).`,
    });
  }

  if (!data.existingControls.pseudonymization && (data.scale === 'LARGE' || data.dataSubjects.employees)) {
    recommendations.push({
      id: 'rec-pseudonymization',
      priority: 'Moderada',
      category: 'Segurança Técnica',
      articleRef: 'Art. 25 & Art. 32(1)(a)',
      text: 'Adotar pseudonimização/tokenização de identificadores diretos em ambientes analíticos e de homologação.',
    });
  }

  return {
    inherentScore,
    mitigationCredits,
    residualScore,
    inherentRiskLevel,
    riskLevel,
    dpiaMandatory,
    mandatoryReason,
    triggeredCriteria,
    recommendations,
    timestamp: new Date().toLocaleString('pt-BR'),
  };
};

export const getRiskConfig = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.HIGH:
      return {
        label: 'Alto Risco',
        shortLabel: 'Alto',
        containerClass: 'bg-red-50 text-red-900 border-red-200',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600',
        message: 'DPIA Obrigatória. Consulta ao DPO e plano de mitigação exigidos antes do go-live.',
      };
    case RiskLevel.MEDIUM:
      return {
        label: 'Médio Risco',
        shortLabel: 'Médio',
        containerClass: 'bg-amber-50 text-amber-900 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        iconColor: 'text-amber-600',
        message: 'Requer controles adicionais documentados e revisão periódica de conformidade.',
      };
    case RiskLevel.LOW:
      return {
        label: 'Baixo Risco',
        shortLabel: 'Baixo',
        containerClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconColor: 'text-emerald-600',
        message: 'Risco residual controlado. Manter registro no ROPA e controles padrão de segurança.',
      };
  }
};

export interface DPIATemplate {
  id: string;
  name: string;
  subtitle: string;
  data: DPIAFormData;
}

export const PRESET_TEMPLATES: DPIATemplate[] = [
  {
    id: 'tpl-ai-credit',
    name: 'Motor de Crédito com IA',
    subtitle: 'Decisão automatizada · Dados financeiros',
    data: {
      projectName: 'Motor de Scoring de Crédito com IA',
      department: 'Risco & Produtos Financeiros',
      ownerName: 'Camila Ferreira',
      purposeDescription:
        'Avaliação automatizada de risco de crédito para aprovação de limites em tempo real combinando histórico financeiro e telemetria transacional.',
      legalBasis: LegalBasis.CONTRACT,
      retentionPeriod: '5 anos após encerramento da conta',
      dataNature: {
        cadastral: true,
        financial: true,
        sensitive: false,
        criminal: false,
        behavioral: true,
      },
      dataSubjects: {
        general: true,
        employees: false,
        children: false,
        patients: false,
      },
      scale: 'LARGE',
      autoDecision: true,
      monitoring: false,
      newTech: true,
      dataMatching: true,
      rightsRestriction: true,
      intlTransfer: true,
      transferMechanism: TransferMechanism.SCC,
      existingControls: {
        encryption: true,
        pseudonymization: true,
        accessControlMfa: true,
        retentionAutomation: false,
        dpoConsulted: false,
      },
    },
  },
  {
    id: 'tpl-hr-monitoring',
    name: 'Portal de RH & Ponto Biométrico',
    subtitle: 'Biometria · Funcionários',
    data: {
      projectName: 'Sistema Corporativo de Ponto Facial & RH',
      department: 'Recursos Humanos',
      ownerName: 'Ricardo Mendes',
      purposeDescription:
        'Controle de jornada de colaboradores via reconhecimento facial em estações físicas e gestão centralizada de benefícios e afastamentos médicos.',
      legalBasis: LegalBasis.LEGAL_OBLIGATION,
      retentionPeriod: '10 anos (legislação trabalhista)',
      dataNature: {
        cadastral: true,
        financial: true,
        sensitive: true,
        criminal: false,
        behavioral: false,
      },
      dataSubjects: {
        general: false,
        employees: true,
        children: false,
        patients: false,
      },
      scale: 'MEDIUM',
      autoDecision: false,
      monitoring: true,
      newTech: true,
      dataMatching: false,
      rightsRestriction: false,
      intlTransfer: false,
      transferMechanism: TransferMechanism.NONE,
      existingControls: {
        encryption: true,
        pseudonymization: false,
        accessControlMfa: true,
        retentionAutomation: true,
        dpoConsulted: true,
      },
    },
  },
  {
    id: 'tpl-newsletter-b2b',
    name: 'Portal de Eventos B2B',
    subtitle: 'Dados cadastrais · Pequena escala',
    data: {
      projectName: 'Inscrição em Webinars Corporativos',
      department: 'Marketing Institucional',
      ownerName: 'Ana Paula Costa',
      purposeDescription:
        'Coleta de nome corporativo, cargo e e-mail profissional para envio de convites e links de acesso a eventos técnicos.',
      legalBasis: LegalBasis.CONSENT,
      retentionPeriod: '24 meses ou até revogação do consentimento',
      dataNature: {
        cadastral: true,
        financial: false,
        sensitive: false,
        criminal: false,
        behavioral: false,
      },
      dataSubjects: {
        general: true,
        employees: false,
        children: false,
        patients: false,
      },
      scale: 'SMALL',
      autoDecision: false,
      monitoring: false,
      newTech: false,
      dataMatching: false,
      rightsRestriction: false,
      intlTransfer: false,
      transferMechanism: TransferMechanism.NONE,
      existingControls: {
        encryption: true,
        pseudonymization: false,
        accessControlMfa: true,
        retentionAutomation: true,
        dpoConsulted: false,
      },
    },
  },
];

export const INITIAL_RECORDS: DPIARecord[] = PRESET_TEMPLATES.map((tpl, idx) => {
  const result = calculateRisk(tpl.data);
  return {
    id: `dpia-seed-${idx + 1}`,
    formData: tpl.data,
    result,
    checkedActionIds: [],
    createdAtIso: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
  };
});

export interface ImportedDpiaPayload {
  formData: DPIAFormData;
  sourceRecordId?: string;
  checkedActionIds?: string[];
}

export const parseImportedDpiaJson = (rawText: string): ImportedDpiaPayload => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('O arquivo selecionado não contém um JSON válido.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Estrutura JSON inválida para avaliação DPIA.');
  }

  const obj = parsed as Record<string, unknown>;
  const candidate =
    obj.formData && typeof obj.formData === 'object' && !Array.isArray(obj.formData)
      ? (obj.formData as Record<string, unknown>)
      : obj;

  const hasKnownKeys =
    'projectName' in candidate ||
    'department' in candidate ||
    'dataNature' in candidate ||
    'dataSubjects' in candidate ||
    'scale' in candidate;

  if (!hasKnownKeys) {
    throw new Error('O arquivo JSON não possui os campos de uma avaliação DPIA.');
  }

  const mergeBoolGroup = <T extends Record<string, boolean>>(
    defaults: T,
    incoming: unknown
  ): T => {
    const src =
      incoming && typeof incoming === 'object' && !Array.isArray(incoming)
        ? (incoming as Record<string, unknown>)
        : {};
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      if (typeof src[key] === 'boolean') {
        (out as Record<string, boolean>)[key] = src[key] as boolean;
      }
    }
    return out;
  };

  const validLegalBases = Object.values(LegalBasis) as string[];
  const validMechanisms = Object.values(TransferMechanism) as string[];
  const validScales = ['SMALL', 'MEDIUM', 'LARGE'];

  const formData: DPIAFormData = {
    projectName: typeof candidate.projectName === 'string' ? candidate.projectName : '',
    department: typeof candidate.department === 'string' ? candidate.department : '',
    ownerName: typeof candidate.ownerName === 'string' ? candidate.ownerName : '',
    purposeDescription:
      typeof candidate.purposeDescription === 'string' ? candidate.purposeDescription : '',
    legalBasis:
      typeof candidate.legalBasis === 'string' && validLegalBases.includes(candidate.legalBasis)
        ? (candidate.legalBasis as LegalBasis)
        : initialFormState.legalBasis,
    retentionPeriod:
      typeof candidate.retentionPeriod === 'string'
        ? candidate.retentionPeriod
        : initialFormState.retentionPeriod,
    dataNature: mergeBoolGroup(initialFormState.dataNature, candidate.dataNature),
    dataSubjects: mergeBoolGroup(initialFormState.dataSubjects, candidate.dataSubjects),
    scale:
      typeof candidate.scale === 'string' && validScales.includes(candidate.scale)
        ? (candidate.scale as DPIAFormData['scale'])
        : initialFormState.scale,
    autoDecision: Boolean(candidate.autoDecision),
    monitoring: Boolean(candidate.monitoring),
    newTech: Boolean(candidate.newTech),
    dataMatching: Boolean(candidate.dataMatching),
    rightsRestriction: Boolean(candidate.rightsRestriction),
    intlTransfer: Boolean(candidate.intlTransfer),
    transferMechanism:
      typeof candidate.transferMechanism === 'string' &&
      validMechanisms.includes(candidate.transferMechanism)
        ? (candidate.transferMechanism as TransferMechanism)
        : initialFormState.transferMechanism,
    existingControls: mergeBoolGroup(
      initialFormState.existingControls,
      candidate.existingControls
    ),
  };

  const sourceRecordId = typeof obj.id === 'string' ? obj.id : undefined;
  const checkedActionIds = Array.isArray(obj.checkedActionIds)
    ? obj.checkedActionIds.filter((item): item is string => typeof item === 'string')
    : undefined;

  return {
    formData,
    sourceRecordId,
    checkedActionIds,
  };
};