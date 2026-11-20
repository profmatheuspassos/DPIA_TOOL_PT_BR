import React, { useEffect, useRef, useState } from 'react';
import { DPIAFormData, DPIARecord } from './types';
import {
  calculateRisk,
  ImportedDpiaPayload,
  INITIAL_RECORDS,
  initialFormState,
  parseImportedDpiaJson,
} from './utils/riskLogic';
import { AssessmentForm } from './components/AssessmentForm';
import { Report } from './components/Report';
import { RegistryView } from './components/RegistryView';
import { MethodologyView } from './components/MethodologyView';
import {
  BookOpen,
  FilePlus2,
  FolderKanban,
  Menu,
  Shield,
  X,
} from 'lucide-react';

type ActiveView = 'form' | 'registry' | 'report' | 'methodology';

const STORAGE_KEY = 'enterprise_dpia_records_v1';
const DRAFT_STORAGE_KEY = 'enterprise_dpia_draft_v1';
const AUTO_SAVE_INTERVAL_MS = 3000;

const loadStoredRecords = (): DPIARecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_RECORDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback to initial records
  }
  return INITIAL_RECORDS;
};

const loadStoredDraft = (): DPIAFormData => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return initialFormState;
    return parseImportedDpiaJson(raw).formData;
  } catch {
    // Fallback to clean initial form state
  }
  return initialFormState;
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('form');
  const [formData, setFormData] = useState<DPIAFormData>(loadStoredDraft);
  const [records, setRecords] = useState<DPIARecord[]>(loadStoredRecords);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [importedCheckedActionIds, setImportedCheckedActionIds] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const latestFormDataRef = useRef<DPIAFormData>(formData);
  const activeViewRef = useRef<ActiveView>(activeView);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Ignore storage quota issues
    }
  }, [records]);

  useEffect(() => {
    const saveDraft = () => {
      if (activeViewRef.current !== 'form') return;
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(latestFormDataRef.current));
      } catch {
        // Ignore storage quota issues
      }
    };

    const intervalId = window.setInterval(saveDraft, AUTO_SAVE_INTERVAL_MS);
    window.addEventListener('beforeunload', saveDraft);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', saveDraft);
    };
  }, []);

  const activeRecord = records.find((r) => r.id === activeRecordId) || null;

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateRisk(formData);
    const validRecommendationIds = new Set(result.recommendations.map((r) => r.id));

    if (editingRecordId) {
      const existing = records.find((r) => r.id === editingRecordId);
      const baseChecked = existing ? existing.checkedActionIds : importedCheckedActionIds;
      const preservedChecked = baseChecked.filter((id) => validRecommendationIds.has(id));
      const updatedRecord: DPIARecord = {
        id: editingRecordId,
        formData: { ...formData },
        result,
        checkedActionIds: preservedChecked,
        createdAtIso: existing?.createdAtIso || new Date().toISOString(),
      };
      setRecords((prev) =>
        existing
          ? prev.map((r) => (r.id === editingRecordId ? updatedRecord : r))
          : [updatedRecord, ...prev]
      );
      setActiveRecordId(updatedRecord.id);
    } else {
      const newRecord: DPIARecord = {
        id: `dpia-${Date.now()}`,
        formData: { ...formData },
        result,
        checkedActionIds: importedCheckedActionIds.filter((id) => validRecommendationIds.has(id)),
        createdAtIso: new Date().toISOString(),
      };
      setRecords((prev) => [newRecord, ...prev]);
      setActiveRecordId(newRecord.id);
    }

    setEditingRecordId(null);
    setImportedCheckedActionIds([]);
    activeViewRef.current = 'report';
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage access issues
    }
    setActiveView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportPayload = (payload: ImportedDpiaPayload) => {
    setFormData(payload.formData);
    setEditingRecordId(payload.sourceRecordId || null);
    setImportedCheckedActionIds(payload.checkedActionIds || []);
  };

  const handleResetEditingState = () => {
    setEditingRecordId(null);
    setImportedCheckedActionIds([]);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage access issues
    }
  };

  const handleToggleAction = (recordId: string, actionId: string) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        const exists = rec.checkedActionIds.includes(actionId);
        return {
          ...rec,
          checkedActionIds: exists
            ? rec.checkedActionIds.filter((id) => id !== actionId)
            : [...rec.checkedActionIds, actionId],
        };
      })
    );
  };

  const handleViewReport = (record: DPIARecord) => {
    setActiveRecordId(record.id);
    setActiveView('report');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateToForm = (record: DPIARecord) => {
    setFormData(record.formData);
    setEditingRecordId(record.id);
    setImportedCheckedActionIds(record.checkedActionIds);
    setActiveView('form');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (activeRecordId === recordId) {
      setActiveRecordId(null);
      setActiveView('registry');
    }
    if (editingRecordId === recordId) {
      setEditingRecordId(null);
      setImportedCheckedActionIds([]);
    }
  };

  const handleStartNew = () => {
    setFormData(initialFormState);
    setEditingRecordId(null);
    setImportedCheckedActionIds([]);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore storage access issues
    }
    setActiveView('form');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const breadcrumbLabel =
    activeView === 'form'
      ? 'Nova Avaliação DPIA'
      : activeView === 'registry'
      ? 'Registro de Avaliações'
      : activeView === 'methodology'
      ? 'Critérios GDPR Art. 35'
      : activeRecord?.formData.projectName || 'Relatório DPIA';

  const navItems: { id: ActiveView; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'form', label: 'Nova Avaliação', icon: FilePlus2 },
    { id: 'registry', label: 'Registro de DPIAs', icon: FolderKanban },
    { id: 'methodology', label: 'Critérios GDPR Art. 35', icon: BookOpen },
  ];

  return (
    <div className="print-root-layout min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#0F4C81] text-white flex items-center justify-center shrink-0">
            <Shield size={17} />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
            Enterprise DPIA
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id || (activeView === 'report' && item.id === 'registry');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F4C81]/8 text-[#0F4C81]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'registry' && (
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {records.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-700">Regulamento (UE) 2016/679</div>
          <div>Triagem preliminar conforme Art. 35 e diretrizes EDPB WP248.</div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-full bg-white h-full border-r border-slate-200 flex flex-col">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#0F4C81] text-white flex items-center justify-center">
                  <Shield size={17} />
                </div>
                <span className="font-display font-bold text-base text-slate-900">
                  Enterprise DPIA
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0F4C81]/8 text-[#0F4C81]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'registry' && (
                      <span className="font-mono text-xs tabular-nums text-slate-500">
                        {records.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="print-content-column flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="no-print h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
              aria-label="Abrir navegação"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                Governança GDPR
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">{breadcrumbLabel}</h1>
            </div>
          </div>

          <div className="shrink-0">
            {activeView === 'form' ? (
              <button
                type="button"
                onClick={() => navigateTo('registry')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver Registro ({records.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartNew}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0c3c66] rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePlus2 size={14} />
                Nova Avaliação
              </button>
            )}
          </div>
        </header>

        {/* Viewport Container */}
        <main className="print-main-container flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'form' && (
            <AssessmentForm
              formData={formData}
              isEditingRecord={Boolean(editingRecordId)}
              onChange={setFormData}
              onImportPayload={handleImportPayload}
              onResetForm={handleResetEditingState}
              onSubmit={handleSubmitAssessment}
            />
          )}

          {activeView === 'registry' && (
            <RegistryView
              records={records}
              onViewReport={handleViewReport}
              onDuplicate={handleDuplicateToForm}
              onDelete={handleDeleteRecord}
              onNewAssessment={handleStartNew}
            />
          )}

          {activeView === 'report' && activeRecord && (
            <Report
              record={activeRecord}
              onToggleAction={handleToggleAction}
              onDuplicateToForm={handleDuplicateToForm}
              onBackToRegistry={() => navigateTo('registry')}
            />
          )}

          {activeView === 'methodology' && <MethodologyView />}
        </main>
      </div>
    </div>
  );
};

export default App;