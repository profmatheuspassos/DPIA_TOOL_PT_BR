export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum LegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTERESTS = 'VITAL_INTERESTS',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTEREST = 'LEGITIMATE_INTEREST',
}

export enum TransferMechanism {
  NONE = 'NONE',
  ADEQUACY = 'ADEQUACY',
  SCC = 'SCC',
  BCR = 'BCR',
  UNSPECIFIED = 'UNSPECIFIED',
}

export interface DPIAFormData {
  projectName: string;
  department: string;
  ownerName: string;
  purposeDescription: string;
  legalBasis: LegalBasis;
  retentionPeriod: string;
  dataNature: {
    cadastral: boolean;
    financial: boolean;
    sensitive: boolean; // Art. 9 GDPR
    criminal: boolean; // Art. 10 GDPR
    behavioral: boolean; // Localização, logs comportamentais, telemetria
  };
  dataSubjects: {
    general: boolean;
    employees: boolean;
    children: boolean;
    patients: boolean;
  };
  scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  autoDecision: boolean; // Art. 22 GDPR
  monitoring: boolean; // Art. 35(3)(c) GDPR
  newTech: boolean; // IA, biometria, reconhecimento facial, IoT
  dataMatching: boolean; // Cruzamento / combinação de bases
  rightsRestriction: boolean; // Impedimento de exercício de direito ou acesso a serviço
  intlTransfer: boolean;
  transferMechanism: TransferMechanism;
  existingControls: {
    encryption: boolean;
    pseudonymization: boolean;
    accessControlMfa: boolean;
    retentionAutomation: boolean;
    dpoConsulted: boolean;
  };
}

export interface WP29Trigger {
  id: string;
  label: string;
  articleRef: string;
  triggered: boolean;
  detail: string;
}

export interface RecommendationItem {
  id: string;
  priority: 'Crítica' | 'Alta' | 'Moderada';
  category: 'Governança' | 'Segurança Técnica' | 'Direitos dos Titulares' | 'Transferência Internacional';
  articleRef: string;
  text: string;
}

export interface AssessmentResult {
  inherentScore: number;
  mitigationCredits: number;
  residualScore: number;
  inherentRiskLevel: RiskLevel;
  riskLevel: RiskLevel; // Residual risk level
  dpiaMandatory: boolean;
  mandatoryReason: string;
  triggeredCriteria: WP29Trigger[];
  recommendations: RecommendationItem[];
  timestamp: string;
}

export interface DPIARecord {
  id: string;
  formData: DPIAFormData;
  result: AssessmentResult;
  checkedActionIds: string[];
  createdAtIso: string;
}