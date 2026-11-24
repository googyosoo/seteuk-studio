export type Level = 'high' | 'mid' | 'low';

export interface Paraphrase90Item {
  id: number;
  level: Level;
  category: '과정중심' | '결과중심' | '태도중심' | '산출물중심';
  text: string;
}

export interface Paraphrase90Group {
  high: Paraphrase90Item[];
  mid: Paraphrase90Item[];
  low: Paraphrase90Item[];
}

export interface EnglishSkillAudit {
  hasSpeaking: boolean;
  hasWriting: boolean;
  hasReading: boolean;
  hasListening: boolean;
  detectedSkillsCount: number;
}

export interface HumanizeAudit {
  throughCount: number; // '~을 통해' 출현 횟수 (2회 이하 권장)
  hypeCount: number;    // '탁월한', '뛰어난', '우수한' 등 감지
  endingFormulaCount: number; // '~한 모습을 보여줌', '~할 것으로 기대됨' 감지
  genericAdjCount: number;    // '성실하고 적극적인' 등 범용 형용사 쌍 감지
  isNatural: boolean;
}

export interface StudentRecord {
  id: string;
  studentNo: string; // 학번 (예: 10101)
  name: string;      // 이름 (예: 김하늘)
  email?: string;    // 학생 이메일 (예: student101@school.hs.kr)
  subject: string;   // 과목명 (예: 공통영어1)
  context: string;   // 수행평가/활동 맥락 (예: 기후변화 해결방안 TED식 3분 스피치)
  rawDraft: string;  // 거친 메모 또는 학생 활동지 원문
  curriculumCode?: string; // 2022 개정 성취기준 코드
  
  // 고도화 결과
  enrichedDraft: string;
  byteCount: number;
  charCount: number;
  diversityAngle?: string; // 적용된 다양화 관점 (예: 가설검증형, 융합탐구형, 논증구조형)
  levelVariations?: {
    high: string;
    mid: string;
    low: string;
  };
  paraphrasedVariations?: string[];
  paraphrase90?: Paraphrase90Group;
  
  // 영어과 4기능 및 자연어 진단
  skillAudit?: EnglishSkillAudit;
  humanizeAudit?: HumanizeAudit;

  // 검사 결과
  inspection: InspectionResult;
  status: 'idle' | 'processing' | 'done' | 'error';
  lastUpdated?: string;
  selectedForBatch?: boolean;
  styleOptions?: TeacherStyleOptions;

  // 인앱 에이전트 스웜 파이프라인 결과
  swarmTrace?: SwarmTracePost[];
  extractedEvidence?: ExtractedEvidence;
  swarmRetryCount?: number;
}

export interface InspectionItem {
  id: string;
  type: 'danger' | 'warning' | 'info';
  category: '기재금지' | '서식규정' | '관찰자시점' | 'AI흔적' | '바이트초과' | '영어과4기능';
  title: string;
  message: string;
  matchText?: string;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface InspectionResult {
  hasProhibited: boolean;
  hasFormatIssue: boolean;
  hasObserverRisk: boolean;
  hasAITrace: boolean;
  isByteOverflow: boolean;
  byteCount: number;
  maxBytes: number;
  items: InspectionItem[];
  skillAudit?: EnglishSkillAudit;
  humanizeAudit?: HumanizeAudit;
}

export type SentencePacing = 'concise' | 'balanced' | 'deep'; // 간결형(단문 위주) | 균형형 | 심화형(정교한 복문)
export type WritingTone = 'academic' | 'growth' | 'collaborative'; // 학술논증형 | 성장관찰형 | 협력배려형

export interface TeacherStyleOptions {
  pacing: SentencePacing;
  tone: WritingTone;
  fewShotSamples?: string[]; // 교사 고유 문체 우수 예시문 1~3건
}

export interface CurriculumStandard {
  code: string;
  subject: string;
  grade: string;
  name: string;
  description: string;
  category?: '공통교과' | '일반선택' | '진로선택' | '융합선택';
  skillFocus?: '말하기' | '쓰기' | '읽기' | '듣기' | '통합';
  keyCompetencies?: string[]; // 핵심 역량 키워드
  recommendedActivities: string[]; // 추천 연계 활동 (수행평가/탐구과제 3~4종)
  sampleDraftTemplate?: string; // 학생 활동 메모 예시 템플릿
}

export type GenerationMode = 'enrich' | 'differentiate' | 'paraphrase' | 'compress' | 'paraphrase90';

/** Role identifier for an agent participating in the in-app seteuk swarm pipeline. */
export type SwarmAgentRole = 'coordinator' | 'extractor' | 'writer' | 'verifier' | 'monitor';

/** Message category recorded on the in-app swarm trace feed. */
export type SwarmPostType = 'dispatch' | 'evidence' | 'draft' | 'critique' | 'approval' | 'fallback' | 'done';

/** Single trace entry emitted during an in-app swarm execution. */
export interface SwarmTracePost {
  seq: number;
  timestamp: string;
  from: SwarmAgentRole;
  to: SwarmAgentRole | 'all';
  type: SwarmPostType;
  summary: string;
  detail?: string;
  byteCount?: number;
  providerUsed?: string;
  passed?: boolean;
}

/** Structured factual evidence extracted from sanitized student records before drafting. */
export interface ExtractedEvidence {
  observedActions: string[];
  artifactsProduced: string[];
  curriculumKeywords: string[];
  competencies: string[];
  rawFactAnchors: string[];
}

/** Shared class-wide duplicate avoidance blackboard state across batch generation. */
export interface SwarmBlackboardState {
  forbiddenPhrases: string[];
  usedOpeners: string[];
  completedCount: number;
}

/** Abstraction for LLM operations required by the evidence extractor and draft writer agents. */
export interface SwarmLLMRunner {
  extractEvidence(input: {
    subject: string;
    sanitizedContext: string;
    sanitizedDraft: string;
    curriculumCode?: string;
    curriculumDesc?: string;
    apiKey?: string;
    model?: string;
    provider?: string;
  }): Promise<{
    evidence: ExtractedEvidence;
    providerUsed: string;
    isMock: boolean;
    usedFallback?: boolean;
  }>;

  writeDraftFromEvidence(input: {
    evidence: ExtractedEvidence;
    subject: string;
    sanitizedContext: string;
    sanitizedDraft: string;
    curriculumCode?: string;
    curriculumDesc?: string;
    curriculumActivities?: string[];
    styleOptions?: TeacherStyleOptions;
    targetLevel?: Level;
    diversityIndex?: number;
    diversityAngle?: string;
    forbiddenPhrases?: string[];
    usedOpeners?: string[];
    verifierFeedback?: string;
    previousDraft?: string;
    apiKey?: string;
    model?: string;
    provider?: string;
  }): Promise<{
    draftText: string;
    providerUsed: string;
    isMock: boolean;
    diversityAngle: string;
    usedFallback?: boolean;
  }>;
}

/** Final output bundle produced by running the in-app agentic swarm pipeline for one student. */
export interface SwarmRunResult {
  enrichedText: string;
  evidence: ExtractedEvidence;
  inspection: InspectionResult;
  trace: SwarmTracePost[];
  retryCount: number;
  providerUsed: string;
  isMock: boolean;
  diversityAngle: string;
  usedFallback: boolean;
}
