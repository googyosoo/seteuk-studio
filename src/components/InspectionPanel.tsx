import React, { useState } from 'react';
import { InspectionResult } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Feather, Layers, ShieldCheck, Sparkles, Wrench } from 'lucide-react';

interface InspectionPanelProps {
  inspection: InspectionResult;
  onAutoFix?: () => void;
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({ inspection, onAutoFix }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { items, skillAudit, humanizeAudit } = inspection;
  const prohibitedCount = items.filter((i) => i.category === '기재금지').length;
  const formatCount = items.filter((i) => i.category === '서식규정').length;
  const observerCount = items.filter((i) => i.category === '관찰자시점').length;
  const aiTraceCount = items.filter((i) => i.category === 'AI흔적').length;
  const overflowCount = items.filter((i) => i.category === '바이트초과').length;
  const englishSkillCount = items.filter((i) => i.category === '영어과4기능').length;

  const totalIssues = items.length;
  const hasDanger = prohibitedCount > 0 || overflowCount > 0;

  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter((i) => i.category === activeFilter);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {totalIssues === 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>NEIS 기재요령 & 4대 스킬 통합 검증 통과 (100% 무결점)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              {hasDanger ? (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span className={hasDanger ? 'text-rose-900 font-bold' : 'text-slate-800'}>
                통합 검증 리포트 ({totalIssues}건 항목 감지)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {formatCount > 0 && onAutoFix && (
            <button
              onClick={onAutoFix}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition"
              title="가운데점, 인용부호, 주어 생략 등 서식 자동 정돈"
            >
              <Wrench className="w-3 h-3" />
              <span>서식 원클릭 교정</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* 4-Layer Narrative & 4-Skills Synthesis Diagnostic Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* English 4-Skills Audit (setek-english-creator) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>영어과 4기능 수행 감지:</span>
                </span>
                <span className="text-[10px] text-slate-400">2개 이상 권장</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                  skillAudit?.hasSpeaking ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  말하기 {skillAudit?.hasSpeaking ? '✓' : '△'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                  skillAudit?.hasWriting ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  쓰기 {skillAudit?.hasWriting ? '✓' : '△'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                  skillAudit?.hasReading ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  읽기 {skillAudit?.hasReading ? '✓' : '△'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                  skillAudit?.hasListening ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  듣기 {skillAudit?.hasListening ? '✓' : '△'}
                </span>
              </div>
            </div>

            {/* AI-Tells Naturalness Audit (setek-english-natural) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Feather className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI 티 사전 회피 검사:</span>
                </span>
                <span className={`text-[10px] font-bold ${humanizeAudit?.isNatural ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {humanizeAudit?.isNatural ? '자연스러움 100%' : 'AI 흔적 감지됨'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className={`px-1.5 py-0.5 rounded border ${
                  (humanizeAudit?.throughCount || 0) < 2 ? 'bg-white text-slate-700 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                }`}>
                  ~을 통해: {humanizeAudit?.throughCount || 0}회
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${
                  (humanizeAudit?.hypeCount || 0) === 0 ? 'bg-white text-slate-700 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                }`}>
                  Hype어휘: {humanizeAudit?.hypeCount || 0}건
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${
                  (humanizeAudit?.endingFormulaCount || 0) === 0 ? 'bg-white text-slate-700 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                }`}>
                  결말공식: {humanizeAudit?.endingFormulaCount || 0}건
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 ({totalIssues})
            </button>

            {prohibitedCount > 0 && (
              <button
                onClick={() => setActiveFilter('기재금지')}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === '기재금지'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                🚨 기재금지 ({prohibitedCount})
              </button>
            )}

            {overflowCount > 0 && (
              <button
                onClick={() => setActiveFilter('바이트초과')}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                  activeFilter === '바이트초과'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                ⚠️ 바이트초과 ({overflowCount})
              </button>
            )}

            {formatCount > 0 && (
              <button
                onClick={() => setActiveFilter('서식규정')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  activeFilter === '서식규정'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                📝 서식 ({formatCount})
              </button>
            )}

            {observerCount > 0 && (
              <button
                onClick={() => setActiveFilter('관찰자시점')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  activeFilter === '관찰자시점'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                👀 관찰자시점 ({observerCount})
              </button>
            )}

            {aiTraceCount > 0 && (
              <button
                onClick={() => setActiveFilter('AI흔적')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  activeFilter === 'AI흔적'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                ✨ AI 흔적 ({aiTraceCount})
              </button>
            )}
          </div>

          {/* Issue Cards */}
          {totalIssues === 0 ? (
            <div className="py-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-800">
                기재금지 단어·서식 오류·AI 흔적이 없습니다. 나이스에 즉시 복사하여 등록하셔도 안전합니다.
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isDanger = item.type === 'danger';
                const isWarning = item.type === 'warning';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs ${
                      isDanger
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : isWarning
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-blue-50/70 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 border border-current">
                          {item.category}
                        </span>
                        <span>{item.title}</span>
                      </div>
                      {item.matchText && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0 text-slate-800">
                          '{item.matchText}'
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-slate-700 leading-relaxed">{item.message}</p>

                    {item.suggestion && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-slate-600 flex items-start gap-1">
                        <span className="font-semibold text-slate-700 shrink-0">💡 교정 대안:</span>
                        <span>{item.suggestion}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
