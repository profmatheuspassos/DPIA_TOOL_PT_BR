import React, { useMemo, useState } from 'react';
import { DPIARecord, RiskLevel } from '../types';
import { getRiskConfig } from '../utils/riskLogic';
import {
  AlertTriangle,
  Copy,
  Eye,
  FilePlus2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface RegistryViewProps {
  records: DPIARecord[];
  onViewReport: (record: DPIARecord) => void;
  onDuplicate: (record: DPIARecord) => void;
  onDelete: (recordId: string) => void;
  onNewAssessment: () => void;
}

type RiskFilter = 'ALL' | RiskLevel;

export const RegistryView: React.FC<RegistryViewProps> = ({
  records,
  onViewReport,
  onDuplicate,
  onDelete,
  onNewAssessment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');

  const stats = useMemo(() => {
    const highCount = records.filter((r) => r.result.riskLevel === RiskLevel.HIGH).length;
    const mandatoryCount = records.filter((r) => r.result.dpiaMandatory).length;
    const pendingActions = records.reduce(
      (sum, r) => sum + Math.max(0, r.result.recommendations.length - r.checkedActionIds.length),
      0
    );
    return {
      total: records.length,
      highCount,
      mandatoryCount,
      pendingActions,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      const matchesRisk = riskFilter === 'ALL' || rec.result.riskLevel === riskFilter;
      if (!matchesRisk) return false;
      if (!q) return true;
      return (
        rec.formData.projectName.toLowerCase().includes(q) ||
        rec.formData.department.toLowerCase().includes(q) ||
        rec.formData.ownerName.toLowerCase().includes(q)
      );
    });
  }, [records, riskFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4 md:p-5">
          <div className="text-xs font-medium text-slate-500">Avaliações Registradas</div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Inventário DPIA ativo</div>
        </div>
        <div className="p-4 md:p-5">
          <div className="text-xs font-medium text-slate-500">Alto Risco Residual</div>
          <div className="text-2xl font-mono font-bold text-red-700 tabular-nums mt-1">
            {stats.highCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Exigem aprovação do DPO</div>
        </div>
        <div className="p-4 md:p-5">
          <div className="text-xs font-medium text-slate-500">DPIA Obrigatória (Art. 35)</div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
            {stats.mandatoryCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">2+ critérios WP248 ou Art. 35(3)</div>
        </div>
        <div className="p-4 md:p-5">
          <div className="text-xs font-medium text-slate-500">Ações Pendentes</div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
            {stats.pendingActions}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Recomendações em aberto</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por projeto, departamento ou responsável..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0F4C81]"
            />
          </div>

          <div
            role="group"
            aria-label="Filtrar por nível de risco"
            className="inline-flex items-center p-1 bg-slate-100 rounded-md self-start md:self-auto"
          >
            {(
              [
                { key: 'ALL', label: 'Todos' },
                { key: RiskLevel.HIGH, label: 'Alto Risco' },
                { key: RiskLevel.MEDIUM, label: 'Médio Risco' },
                { key: RiskLevel.LOW, label: 'Baixo Risco' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRiskFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  riskFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table or Empty State */}
        {records.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <h3 className="text-base font-semibold text-slate-900">
              Nenhuma avaliação DPIA registrada
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Inicie uma nova avaliação de impacto para calcular o risco residual GDPR e gerar o
              relatório oficial de mitigação.
            </p>
            <button
              type="button"
              onClick={onNewAssessment}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F4C81] hover:bg-[#0c3c66] rounded-md transition-colors cursor-pointer"
            >
              <FilePlus2 size={16} />
              Criar Primeira DPIA
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Nenhum registro corresponde aos filtros atuais.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRiskFilter('ALL');
              }}
              className="text-xs font-medium text-[#0F4C81] hover:underline cursor-pointer"
            >
              Limpar busca e filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Projeto / Processo</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Nível de Risco</th>
                  <th className="py-3 px-4 text-right">Score (Iner. / Res.)</th>
                  <th className="py-3 px-4 text-right">Mitigações</th>
                  <th className="py-3 px-4 text-right">Data</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredRecords.map((rec) => {
                  const cfg = getRiskConfig(rec.result.riskLevel);
                  const RiskIcon =
                    rec.result.riskLevel === RiskLevel.HIGH
                      ? ShieldAlert
                      : rec.result.riskLevel === RiskLevel.MEDIUM
                      ? AlertTriangle
                      : ShieldCheck;
                  const doneCount = rec.checkedActionIds.length;
                  const totalActions = rec.result.recommendations.length;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onViewReport(rec)}
                          className="font-semibold text-slate-900 hover:text-[#0F4C81] text-left cursor-pointer"
                        >
                          {rec.formData.projectName}
                        </button>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{rec.formData.ownerName || 'Responsável não definido'}</span>
                          {rec.result.dpiaMandatory && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-red-700 font-medium">Art. 35 Obrigatória</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{rec.formData.department}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 font-medium text-xs ${cfg.iconColor}`}>
                          <RiskIcon size={14} />
                          <span className="text-slate-900">{cfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {rec.result.inherentScore} / {rec.result.residualScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {doneCount}/{totalActions}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                        {new Date(rec.createdAtIso).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewReport(rec)}
                            title="Abrir relatório"
                            className="p-1.5 text-slate-600 hover:text-[#0F4C81] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(rec)}
                            title="Reavaliar / Duplicar"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(rec.id)}
                            title="Excluir avaliação"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
