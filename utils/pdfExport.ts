import { jsPDF } from 'jspdf';
import { DPIARecord, RiskLevel } from '../types';
import {
  getRiskConfig,
  LEGAL_BASIS_LABELS,
  TRANSFER_MECHANISM_LABELS,
} from './riskLogic';

export const generateDpiaPdf = (record: DPIARecord): void => {
  const { formData, result, checkedActionIds } = record;
  const residualCfg = getRiskConfig(result.riskLevel);
  const inherentCfg = getRiskConfig(result.inherentRiskLevel);
  const basisInfo = LEGAL_BASIS_LABELS[formData.legalBasis];

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  const drawDivider = () => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const writeWrapped = (
    text: string,
    x: number,
    maxW: number,
    lineHeight = 4.8,
    fontSize = 9.5,
    color: [number, number, number] = [51, 65, 85],
    fontStyle: 'normal' | 'bold' = 'normal'
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  // Header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Relatório de Avaliação de Impacto (DPIA) · GDPR Art. 35 · Gerado em ${result.timestamp}`,
    margin,
    y
  );
  y += 6.5;

  writeWrapped(
    formData.projectName || 'Projeto sem denominação',
    margin,
    contentWidth,
    6.5,
    16,
    [15, 23, 42],
    'bold'
  );

  const metaParts = [
    `Departamento: ${formData.department || 'Não informado'}`,
    formData.ownerName ? `Responsável: ${formData.ownerName}` : null,
    result.dpiaMandatory ? 'Enquadramento: DPIA Obrigatória (Art. 35)' : 'Enquadramento: Triagem Preliminar',
  ].filter(Boolean) as string[];

  writeWrapped(metaParts.join('  |  '), margin, contentWidth, 4.8, 9, [71, 85, 105], 'normal');
  y += 2;
  drawDivider();

  // Risk Box
  ensureSpace(26);
  const riskColors: Record<RiskLevel, { bg: [number, number, number]; border: [number, number, number]; text: [number, number, number] }> = {
    [RiskLevel.HIGH]: { bg: [254, 242, 242], border: [254, 202, 202], text: [153, 27, 27] },
    [RiskLevel.MEDIUM]: { bg: [255, 251, 235], border: [253, 230, 138], text: [146, 64, 14] },
    [RiskLevel.LOW]: { bg: [236, 253, 245], border: [167, 243, 208], text: [6, 95, 70] },
  };
  const rc = riskColors[result.riskLevel];
  doc.setFillColor(rc.bg[0], rc.bg[1], rc.bg[2]);
  doc.setDrawColor(rc.border[0], rc.border[1], rc.border[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(rc.text[0], rc.text[1], rc.text[2]);
  doc.text(`Risco Residual: ${residualCfg.label}`, margin + 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `Inerente: ${result.inherentScore} (${inherentCfg.shortLabel})  |  Controles: -${result.mitigationCredits}  |  Residual: ${result.residualScore} pts`,
    margin + 4,
    y + 13
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(residualCfg.message, margin + 4, y + 18.5);
  y += 28;

  // Scope & Legal Basis
  ensureSpace(16);
  writeWrapped('1. Escopo, Base Legal e Categorias de Dados', margin, contentWidth, 5.5, 11.5, [15, 23, 42], 'bold');
  y += 1;

  const activeDataNature = [
    formData.dataNature.cadastral && 'Dados Cadastrais',
    formData.dataNature.financial && 'Dados Financeiros',
    formData.dataNature.behavioral && 'Localização / Comportamental',
    formData.dataNature.sensitive && 'Dados Sensíveis (Art. 9)',
    formData.dataNature.criminal && 'Condenações Penais (Art. 10)',
  ].filter(Boolean) as string[];

  const activeSubjects = [
    formData.dataSubjects.general && 'Clientes / Usuários',
    formData.dataSubjects.employees && 'Colaboradores',
    formData.dataSubjects.patients && 'Pacientes',
    formData.dataSubjects.children && 'Crianças / Adolescentes',
  ].filter(Boolean) as string[];

  const scaleLabel =
    formData.scale === 'LARGE'
      ? 'Grande Escala / Nacional'
      : formData.scale === 'MEDIUM'
      ? 'Média Escala / Regional'
      : 'Pequena Escala / Local';

  const scopeRows: [string, string][] = [
    ['Base Legal (Art. 6)', `${basisInfo.article} — ${basisInfo.label}`],
    ['Escala do Tratamento', scaleLabel],
    ['Prazo de Retenção', formData.retentionPeriod || 'Não especificado'],
    [
      'Transferência Internacional',
      formData.intlTransfer
        ? TRANSFER_MECHANISM_LABELS[formData.transferMechanism]
        : 'Não aplicável',
    ],
    ['Categorias de Dados', activeDataNature.join(', ') || 'Nenhuma informada'],
    ['Grupos de Titulares', activeSubjects.join(', ') || 'Nenhum informado'],
  ];

  for (const [label, val] of scopeRows) {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const valLines = doc.splitTextToSize(val, contentWidth - 48) as string[];
    doc.text(valLines, margin + 48, y);
    y += Math.max(5.2, valLines.length * 4.5);
  }

  if (formData.purposeDescription) {
    y += 1.5;
    writeWrapped(
      `Finalidade declarada: ${formData.purposeDescription}`,
      margin,
      contentWidth,
      4.6,
      9,
      [51, 65, 85],
      'normal'
    );
  }

  // Existing Controls
  y += 2;
  const controls = [
    formData.existingControls.encryption && 'Criptografia em repouso/trânsito',
    formData.existingControls.pseudonymization && 'Pseudonimização/Anonimização',
    formData.existingControls.accessControlMfa && 'RBAC + MFA',
    formData.existingControls.retentionAutomation && 'Expurgo automático',
    formData.existingControls.dpoConsulted && 'Consulta prévia ao DPO',
  ].filter(Boolean) as string[];

  writeWrapped(
    `Controles ativos declarados: ${controls.length > 0 ? controls.join(' · ') : 'Nenhum controle marcado'}`,
    margin,
    contentWidth,
    4.6,
    9,
    [15, 23, 42],
    'normal'
  );

  y += 3;
  drawDivider();

  // WP29 Triggers
  ensureSpace(16);
  const triggered = result.triggeredCriteria.filter((c) => c.triggered);
  writeWrapped(
    `2. Obrigatoriedade Art. 35 & Critérios EDPB/WP248 (${triggered.length}/9 ativos)`,
    margin,
    contentWidth,
    5.5,
    11.5,
    [15, 23, 42],
    'bold'
  );
  writeWrapped(result.mandatoryReason, margin, contentWidth, 4.6, 9, [71, 85, 105], 'normal');
  y += 1.5;

  if (triggered.length > 0) {
    for (const item of triggered) {
      ensureSpace(11);
      writeWrapped(
        `• ${item.label} (${item.articleRef})`,
        margin + 2,
        contentWidth - 2,
        4.6,
        9.2,
        [15, 23, 42],
        'bold'
      );
      writeWrapped(item.detail, margin + 5, contentWidth - 5, 4.4, 8.5, [71, 85, 105], 'normal');
      y += 1;
    }
  } else {
    writeWrapped(
      'Nenhum dos 9 critérios de alto risco WP248 foi acionado.',
      margin,
      contentWidth,
      4.6,
      9,
      [71, 85, 105],
      'normal'
    );
  }

  y += 3;
  drawDivider();

  // Recommendations
  ensureSpace(16);
  writeWrapped(
    `3. Plano de Ação e Medidas de Mitigação (${checkedActionIds.length}/${result.recommendations.length} concluídas)`,
    margin,
    contentWidth,
    5.5,
    11.5,
    [15, 23, 42],
    'bold'
  );
  y += 1;

  if (result.recommendations.length > 0) {
    result.recommendations.forEach((rec, idx) => {
      const done = checkedActionIds.includes(rec.id);
      const header = `${String(idx + 1).padStart(2, '0')}. [Prioridade ${rec.priority} · ${rec.category} · ${rec.articleRef}] ${done ? '(Concluído)' : '(Pendente)'}`;
      ensureSpace(12);
      writeWrapped(header, margin, contentWidth, 4.5, 8.5, [15, 76, 129], 'bold');
      writeWrapped(rec.text, margin + 4, contentWidth - 4, 4.6, 9.2, [30, 41, 59], 'normal');
      y += 1.5;
    });
  } else {
    writeWrapped(
      'Nenhuma recomendação crítica adicional identificada. Manter revisão anual no ROPA.',
      margin,
      contentWidth,
      4.6,
      9,
      [71, 85, 105],
      'normal'
    );
  }

  // Sign-off footer block
  y += 4;
  ensureSpace(24);
  drawDivider();
  writeWrapped(
    'Nota Metodológica: Avaliação preliminar estruturada conforme Art. 35 do Regulamento (UE) 2016/679 (GDPR) e diretrizes WP248 rev.01 do EDPB. Não substitui parecer jurídico formal.',
    margin,
    contentWidth,
    4.2,
    8,
    [100, 116, 139],
    'normal'
  );
  y += 8;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y, margin + 85, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Validação DPO / Comitê de Privacidade · Data: ____/____/______', margin, y);

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Enterprise DPIA Tool · Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  const slug = (formData.projectName || 'dpia-report')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  doc.save(`${slug || 'dpia-report'}.pdf`);
};
