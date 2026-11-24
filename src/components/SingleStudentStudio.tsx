import React, { useState } from 'react';
import { StudentRecord, GenerationMode, Level, SentencePacing, WritingTone } from '../types';
import { CURRICULUM_STANDARDS } from '../lib/curriculumData';
import { countNeisBytes, NEIS_MAX_BYTES } from '../lib/byteCounter';
import { ByteGauge } from './ByteGauge';
import { Paraphrase90Modal } from './Paraphrase90Modal';
import { CurriculumActivityPickerModal } from './CurriculumActivityPickerModal';
import { inspectSeteuk } from '../lib/inspector';
import { autoFixFormatIssues } from '../lib/formatRules';
import { generateSeteukAdvanced } from '../lib/geminiApi';
import {
  Check,
  ClipboardCopy,
  Layers,
  Library,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileEdit,
  RotateCcw,
  BookOpen,
  Sliders,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
} from 'lucide-react';

interface SingleStudentStudioProps {
  students: StudentRecord[];
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
  onUpdateStudent: (student: StudentRecord) => void;
  onAddStudent: () => void;
  onDeleteStudent: (id: string) => void;
  apiKey: string;
  selectedModel: string;
}

export const SingleStudentStudio: React.FC<SingleStudentStudioProps> = ({
  students,
  activeStudentId,
  onSelectStudent,
  onUpdateStudent,
  onAddStudent,
  onDeleteStudent,
  apiKey,
  selectedModel,
}) => {
  const currentStudent = students.find((s) => s.id === activeStudentId) || students[0];

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLevel, setActiveLevel] = useState<Level>('high');
  const [copied, setCopied] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [is90ModalOpen, setIs90ModalOpen] = useState(false);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);

  // 교사 맞춤형 스타일 파라미터 상태
  const [pacing, setPacing] = useState<SentencePacing>('balanced');
  const [tone, setTone] = useState<WritingTone>('academic');

  // 교사 과거 우수 세특 Few-shot 학습 샘플 상태
  const [isFewShotOpen, setIsFewShotOpen] = useState(false);
  const [fewShotInput, setFewShotInput] = useState<string>(() => {
    return localStorage.getItem('seteuk_teacher_fewshots') || '';
  });

  const handleSaveFewShots = (val: string) => {
    setFewShotInput(val);
    localStorage.setItem('seteuk_teacher_fewshots', val);
  };

  const fewShotSamples = fewShotInput
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (!currentStudent) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-white rounded-3xl p-8 border border-slate-200">
        <p className="text-slate-600 mb-4 text-sm">등록된 학생 데이터가 없습니다.</p>
        <button
          onClick={onAddStudent}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
        >
          새 학생 추가하기
        </button>
      </div>
    );
  }

  const selectedStandard = CURRICULUM_STANDARDS.find((c) => c.code === currentStudent.curriculumCode);

  const handleFieldChange = (field: keyof StudentRecord, value: any) => {
    const updated = { ...currentStudent, [field]: value };
    if (field === 'enrichedDraft') {
      const inspection = inspectSeteuk(value);
      updated.inspection = inspection;
      updated.byteCount = inspection.byteCount;
      updated.charCount = value.length;
      updated.skillAudit = inspection.skillAudit;
      updated.humanizeAudit = inspection.humanizeAudit;
    }
    onUpdateStudent(updated);
  };

  const handleSelectStandardAndActivity = (std: any, activity?: string, template?: string) => {
    const updated = {
      ...currentStudent,
      curriculumCode: std.code,
      subject: currentStudent.subject || std.subject.split('·')[0],
    };

    if (activity) {
      updated.context = activity;
    }

    if (template && (!currentStudent.rawDraft || currentStudent.rawDraft.trim().length === 0)) {
      updated.rawDraft = template;
    }

    onUpdateStudent(updated);
  };

  const handleGenerate = async (mode: GenerationMode) => {
    if (!currentStudent.rawDraft.trim() && !currentStudent.context.trim()) {
      alert('활동 맥락이나 학생 활동 메모를 먼저 입력해 주세요!');
      return;
    }

    setIsGenerating(true);
    setGenerationNotice(null);

    try {
      const res = await generateSeteukAdvanced({
        apiKey,
        model: selectedModel,
        studentName: currentStudent.name,
        studentNo: currentStudent.studentNo,
        studentEmail: currentStudent.email,
        subject: currentStudent.subject,
        context: currentStudent.context,
        rawDraft: currentStudent.rawDraft,
        curriculumCode: currentStudent.curriculumCode,
        curriculumDesc: selectedStandard?.description,
        curriculumActivities: selectedStandard?.recommendedActivities,
        styleOptions: { pacing, tone, fewShotSamples },
        mode,
        targetLevel: activeLevel,
      });

      const updated = { ...currentStudent };
      updated.enrichedDraft = res.enrichedText;
      if (res.levelVariations) {
        updated.levelVariations = res.levelVariations;
      }
      if (res.paraphrasedVariations) {
        updated.paraphrasedVariations = res.paraphrasedVariations;
      }
      if (res.paraphrase90) {
        updated.paraphrase90 = res.paraphrase90;
      }

      const inspection = inspectSeteuk(res.enrichedText);
      updated.inspection = inspection;
      updated.byteCount = inspection.byteCount;
      updated.charCount = res.enrichedText.length;
      updated.skillAudit = inspection.skillAudit;
      updated.humanizeAudit = inspection.humanizeAudit;
      updated.diversityAngle = res.diversityAngle;
      updated.status = 'done';

      onUpdateStudent(updated);

      if (mode === 'paraphrase90') {
        setIs90ModalOpen(true);
      }

      if (res.isMock) {
        setGenerationNotice('💡 [오프라인 시뮬레이터 모드] API 키 미입력 상태로 로컬 규칙 기반 가상 초안이 생성되었습니다. 실제 AI 실시간 생성을 원하시면 우측 상단 [AI 모델 / 키 설정]에서 본인 키(Gemini 무료 권장)를 입력해 주세요.');
      } else {
        setGenerationNotice(`⚡ [${res.providerUsed || 'AI'}] 2022 개정 성취기준 연계 초안 작성을 완료했습니다! (식별정보 자동 마스킹)`);
      }
    } catch (err: any) {
      alert(`세특 작성 중 오류 발생: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoFix = () => {
    const fixed = autoFixFormatIssues(currentStudent.enrichedDraft);
    handleFieldChange('enrichedDraft', fixed);
  };

  const handleCopyNeis = () => {
    if (!currentStudent.enrichedDraft) return;
    navigator.clipboard.writeText(currentStudent.enrichedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectLevel = (level: Level) => {
    setActiveLevel(level);
    if (currentStudent.levelVariations && currentStudent.levelVariations[level]) {
      handleFieldChange('enrichedDraft', currentStudent.levelVariations[level]);
    }
  };

  const { inspection } = currentStudent;
  const prohibitedItems = inspection.items.filter((i) => i.category === '기재금지');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      {/* Privacy Assurance & Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-300 mr-1.5">[Zero-DB 세션 보호]</span>
            <span className="text-slate-200">
              서버 영구 저장이 없으며, 2022 개정 성취기준과 학생 관찰기록만 안전하게 연계됩니다.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg shrink-0">
          <FileEdit className="w-3.5 h-3.5 text-amber-300" />
          <span>결과는 교사 검토용 초안(Draft)입니다</span>
        </div>
      </div>

      {/* 1. Student Switcher Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-slate-400 px-1">학생 선택:</span>
          {students.map((student) => {
            const isSelected = student.id === currentStudent.id;
            return (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <span>{student.studentNo} {student.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {student.subject}
                </span>
              </button>
            );
          })}

          <button
            onClick={onAddStudent}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 hover:bg-purple-50 border border-dashed border-purple-300 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 학생</span>
          </button>
        </div>

        {students.length > 1 && (
          <button
            onClick={() => onDeleteStudent(currentStudent.id)}
            className="text-xs text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition shrink-0 ml-2"
            title="현재 학생 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Main 2-Column Working Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Input Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>1. 2022 성취기준 & 활동 메모 입력</span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{currentStudent.email || `${currentStudent.studentNo}@school.hs.kr`}</span>
            </div>
          </div>

          {/* Student Meta Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">학번</label>
              <input
                type="text"
                value={currentStudent.studentNo}
                onChange={(e) => handleFieldChange('studentNo', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">이름</label>
              <input
                type="text"
                value={currentStudent.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">학생 이메일</label>
              <input
                type="email"
                placeholder="student@school.hs.kr"
                value={currentStudent.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">과목명</label>
              <input
                type="text"
                value={currentStudent.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* ⭐ 2022 개정 교육과정 성취기준 선택 & 연계 영역 ⭐ */}
          <div className="p-3.5 bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>2022 개정 교육과정 성취기준 연계</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCurriculumModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1 transition shadow-2xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>{selectedStandard ? '성취기준 변경' : '성취기준 & 활동 선택'}</span>
              </button>
            </div>

            {selectedStandard ? (
              <div className="bg-white p-3 rounded-xl border border-purple-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {selectedStandard.code}
                  </span>
                  <span className="text-[11px] text-slate-500">{selectedStandard.subject}</span>
                </div>
                <div className="font-bold text-slate-900 text-[11px]">{selectedStandard.name}</div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {selectedStandard.description}
                </p>

                {/* 성취기준 연계 추천 활동 바로가기 칩 */}
                {selectedStandard.recommendedActivities && selectedStandard.recommendedActivities.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-purple-800 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span>추천 연계 활동 (클릭 시 맥락에 즉시 반영):</span>
                    </span>
                    <div className="flex flex-col gap-1">
                      {selectedStandard.recommendedActivities.slice(0, 2).map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFieldChange('context', act)}
                          className="text-left text-[10px] p-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg transition flex items-center justify-between"
                        >
                          <span className="truncate pr-1">• {act}</span>
                          <ArrowRight className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setIsCurriculumModalOpen(true)}
                className="bg-white/80 p-3 rounded-xl border border-dashed border-purple-300 text-center cursor-pointer hover:bg-white transition"
              >
                <p className="text-xs text-purple-700 font-semibold">
                  + 2022 개정 성취기준을 선택하고 추천 수행평가 활동을 연계해 보세요
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  클릭하면 과목별 표준 성취기준과 추천 활동 목록이 열립니다.
                </p>
              </div>
            )}
          </div>

          {/* Context Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">
                수행평가 / 수업 활동 맥락
              </label>
              {selectedStandard && (
                <button
                  type="button"
                  onClick={() => setIsCurriculumModalOpen(true)}
                  className="text-[10px] text-purple-600 hover:underline font-semibold"
                >
                  성취기준 연계 활동 보기
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="예: 기후변화 해결방안 TED식 3분 영어 스피치"
              value={currentStudent.context}
              onChange={(e) => handleFieldChange('context', e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white text-slate-800"
            />
          </div>

          {/* Raw Notes / Memo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">
                활동 메모 / 학생 답변 / 산출물 내용
              </label>
              <span className="text-[11px] text-slate-400">{currentStudent.rawDraft.length}자</span>
            </div>
            <textarea
              rows={4}
              placeholder="학생이 제출한 보고서 내용, 발표 대본, 질문 내용 등을 거친 메모 형태로 자유롭게 입력하세요."
              value={currentStudent.rawDraft}
              onChange={(e) => handleFieldChange('rawDraft', e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-hidden leading-relaxed resize-none bg-slate-50/50 text-slate-800"
            />
          </div>

          {/* 🎛️ 교사 맞춤형 문체 스타일 조절 바 (선택하신 슬라이더형 제어) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>교사 스타일 조절 (문체 슬라이더)</span>
              </span>
              <span className="text-[10px] text-slate-400">선생님 고유 스타일 반영</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  문장 호흡 (길이)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPacing('concise')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      pacing === 'concise' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    간결
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacing('balanced')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      pacing === 'balanced' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    균형
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacing('deep')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      pacing === 'deep' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    심화
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  서술 성향
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTone('academic')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      tone === 'academic' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    학술
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone('growth')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      tone === 'growth' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    성장
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone('collaborative')}
                    className={`py-1 rounded-lg font-bold transition text-center ${
                      tone === 'collaborative' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    협력
                  </button>
                </div>
              </div>
            </div>

            {/* 교사 고유 Few-shot 문체 학습 접기/펼치기 아코디언 */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setIsFewShotOpen(!isFewShotOpen)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-purple-700 transition py-1"
              >
                <span className="flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>선생님 고유 문체 퓨샷(Few-shot) 학습</span>
                  {fewShotSamples.length > 0 && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.2 rounded-full">
                      {fewShotSamples.length}문장 학습 중
                    </span>
                  )}
                </span>
                {isFewShotOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isFewShotOpen && (
                <div className="mt-2 p-2.5 bg-white border border-indigo-100 rounded-xl space-y-2 text-[11px]">
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    선생님께서 과거에 작성하셨던 대표적인 우수 세특 문장(1~3문장)을 줄바꿈으로 입력하시면 AI가 해당 어조와 서술 방식을 그대로 계승하여 작성합니다 (브라우저 로컬 저장, 서버 미전송).
                  </p>
                  <textarea
                    rows={3}
                    placeholder="예시)&#10;과학적 가설 검증 단계에서 오차 원인을 스스로 분석하고 통계적 검정 절차를 도입하여 탐구 신뢰도를 향상시킴.&#10;질문 생성 활동에서 개념 간 위계 구조를 도식화하여 동료 학습자들에게 명확히 설명하는 학업 주도성을 발휘함."
                    value={fewShotInput}
                    onChange={(e) => handleSaveFewShots(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-[11px] leading-relaxed outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{fewShotSamples.length}개 유효 문장 인식됨</span>
                    {fewShotSamples.length > 0 && (
                      <span className="text-emerald-600 font-medium">✓ 로컬 캐시에 안전하게 보관됨</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 space-y-2">
            <button
              disabled={isGenerating}
              onClick={() => handleGenerate('enrich')}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>⚡ 2022 성취기준 연계 4층 서사 세특 생성</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isGenerating}
                onClick={() => handleGenerate('differentiate')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>수준별 3종(상·중·하)</span>
              </button>

              <button
                disabled={isGenerating}
                onClick={() => handleGenerate('paraphrase90')}
                className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Library className="w-3.5 h-3.5" />
                <span>90개 변형 라이브러리</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Result & NEIS Copy Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Byte Progress Gauge */}
          <ByteGauge text={currentStudent.enrichedDraft} />

          {/* Enriched Result Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-purple-600" />
                  <span>2. 교사 검토 및 편집용 초안 (Draft)</span>
                </h3>
                {currentStudent.diversityAngle && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline-block">
                    {currentStudent.diversityAngle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Retry Button */}
                <button
                  disabled={isGenerating}
                  onClick={() => handleGenerate('enrich')}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-slate-200 flex items-center gap-1 transition"
                  title="새로운 관점으로 다시 생성"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>다시 생성</span>
                </button>

                {/* Level Variations Tabs if available */}
                {currentStudent.levelVariations && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                    <button
                      onClick={() => handleSelectLevel('high')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        activeLevel === 'high' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      상 (심화)
                    </button>
                    <button
                      onClick={() => handleSelectLevel('mid')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        activeLevel === 'mid' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      중 (충실)
                    </button>
                    <button
                      onClick={() => handleSelectLevel('low')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        activeLevel === 'low' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      하 (기초)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Final Textarea */}
            <textarea
              rows={9}
              placeholder="왼쪽의 [2022 성취기준 연계 4층 서사 세특 생성] 버튼을 누르면 AI가 규정과 성취기준에 맞춘 완성형 초안을 즉시 작성해 드립니다. 직접 텍스트를 수정할 수 있습니다."
              value={currentStudent.enrichedDraft}
              onChange={(e) => handleFieldChange('enrichedDraft', e.target.value)}
              className="w-full p-4 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-hidden leading-relaxed font-sans text-slate-800 bg-white"
            />

            {/* 초안 아래 실시간 글자수 및 NEIS 바이트 표시 */}
            {(() => {
              const liveByteInfo = countNeisBytes(currentStudent.enrichedDraft || '');
              return (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">초안 분량 실시간 표시:</span>
                    <span className="text-slate-600">
                      글자수(공백 포함) <strong className="text-slate-900">{liveByteInfo.chars}자</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                      NEIS 바이트{' '}
                      <strong className={liveByteInfo.isOverflow ? 'text-rose-600 font-extrabold' : 'text-purple-700 font-bold'}>
                        {liveByteInfo.bytes.toLocaleString()} / {NEIS_MAX_BYTES.toLocaleString()} Byte
                      </strong>
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      (한글 3바이트, 영문·숫자·공백 1바이트)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {liveByteInfo.isOverflow ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        {liveByteInfo.bytes - NEIS_MAX_BYTES} Byte 초과
                      </span>
                    ) : liveByteInfo.bytes >= 1350 && liveByteInfo.bytes <= 1480 ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        ✨ NEIS 최적 안전 구간
                      </span>
                    ) : liveByteInfo.bytes > 0 ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 text-slate-700">
                        {liveByteInfo.percent}% 완료
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">초안 작성 대기</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Actions: Big Primary NEIS Copy Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                onClick={handleAutoFix}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>서식 자동 정돈 (~함 종결/가운데점 치환)</span>
              </button>

              <button
                onClick={handleCopyNeis}
                disabled={!currentStudent.enrichedDraft}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>나이스(NEIS) 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>나이스(NEIS) 원클릭 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Independent Rule Engine 2nd Pass Audit Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>독립 룰 엔진 2차 실시간 검증 (Dual-Layer Engine)</span>
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                  prohibitedItems.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  금기어 {prohibitedItems.length === 0 ? '통과 0건' : `${prohibitedItems.length}건 감지`}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                  !inspection.isByteOverflow ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  바이트 {!inspection.isByteOverflow ? '정상' : '초과'}
                </span>
              </div>
            </div>

            {prohibitedItems.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="font-bold flex items-center gap-1 text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>교육부 기재금지 표현 감지 경고 ({prohibitedItems.length}건):</span>
                </div>
                <div className="space-y-1.5">
                  {prohibitedItems.map((item, idx) => (
                    <div key={idx} className="text-[11px] p-2 bg-white/90 rounded-lg border border-rose-200">
                      • <strong>'{item.matchText}'</strong> : {item.message}
                      {item.suggestion && (
                        <div className="text-[10px] text-rose-700 mt-0.5 font-medium">💡 수정 가이드: {item.suggestion}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7대 기재금지 표현 경고 목록 강조 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>교육부 훈령 7대 기재금지 표현 목록 실시간 강조:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">NEIS 규격 상시 검증</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                {[
                  { name: '교외대회·수상', key: '대회', categoryKey: '교외 대회/수상' },
                  { name: '공인어학시험(TOEIC·TOEFL 등)', key: '공인', categoryKey: '공인인증시험' },
                  { name: '논문', key: '논문', categoryKey: '논문/학술지' },
                  { name: '대학명', key: '대학', categoryKey: '특정 기관/대학명' },
                  { name: '상호·브랜드', key: '브랜드', categoryKey: '상용 플랫폼/브랜드' },
                  { name: '부모 직업', key: '부모', categoryKey: '부모/가족 배경' },
                  { name: '해외 연수', key: '해외', categoryKey: '해외활동' },
                ].map((rule) => {
                  const violated = prohibitedItems.some(
                    (item) => item.title.includes(rule.categoryKey) || item.message.includes(rule.categoryKey)
                  );
                  return (
                    <div
                      key={rule.name}
                      className={`px-2 py-1.5 rounded-lg border flex items-center gap-1.5 text-[10px] font-medium transition ${
                        violated
                          ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {violated ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      <span className="truncate">{rule.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 90 Paraphrase Modal */}
      <Paraphrase90Modal
        isOpen={is90ModalOpen}
        onClose={() => setIs90ModalOpen(false)}
        paraphrase90={currentStudent.paraphrase90}
        studentName={currentStudent.name}
        context={currentStudent.context}
        onApplyToStudent={(text) => handleFieldChange('enrichedDraft', text)}
      />

      {/* 2022 Curriculum & Activity Picker Modal */}
      <CurriculumActivityPickerModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        currentSubject={currentStudent.subject}
        selectedCode={currentStudent.curriculumCode}
        onSelectStandardAndActivity={handleSelectStandardAndActivity}
      />
    </div>
  );
};
