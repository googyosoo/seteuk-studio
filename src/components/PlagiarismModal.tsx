import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Shuffle, Sparkles, Users, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { StudentRecord } from '../types';
import { analyzeClassPlagiarism, DuplicatePhraseItem, SYNONYM_DICTIONARY } from '../lib/plagiarismMatrix';
import { inspectSeteuk } from '../lib/inspector';

interface PlagiarismModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  onUpdateStudents: (updated: StudentRecord[]) => void;
}

export const PlagiarismModal: React.FC<PlagiarismModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents,
}) => {
  const [selectedPhrase, setSelectedPhrase] = useState<DuplicatePhraseItem | null>(null);
  const [replaceNotice, setReplaceNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const analysis = analyzeClassPlagiarism(students);

  // 선택한 중복 구절을 학생들에게 각각 다른 유의어로 자동 분산 교체
  const handleShufflePhrase = (item: DuplicatePhraseItem) => {
    const suggestions = item.replacementSuggestions;
    if (suggestions.length === 0) return;

    let modifiedCount = 0;
    const updated = students.map((student) => {
      if (item.studentIds.includes(student.id)) {
        // 학생마다 다른 인덱스의 유의어 배정
        const studentIdx = item.studentIds.indexOf(student.id);
        const replacement = suggestions[studentIdx % suggestions.length];

        if (student.enrichedDraft.includes(item.phrase)) {
          const newText = student.enrichedDraft.replace(item.phrase, replacement);
          const inspection = inspectSeteuk(newText);
          modifiedCount++;
          return {
            ...student,
            enrichedDraft: newText,
            byteCount: inspection.byteCount,
            charCount: newText.length,
            inspection,
          };
        }
      }
      return student;
    });

    onUpdateStudents(updated);
    setReplaceNotice(`✨ ${modifiedCount}명의 학생 세특에서 '${item.phrase}' 문구를 유의어로 자동 분산 교체했습니다!`);
    setTimeout(() => setReplaceNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  학급 전체 세특 어휘 및 문구 중복도 교차 감사 (Anti-Plagiarism)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {analysis.totalAnalyzed}명 분석 완료
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                대입 서류 평가 및 감사에서 판박이 문구로 오인되지 않도록, 학급 내 중복 출현한 구절을 교차 검증하고 분산합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Stat Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border-b border-slate-100 text-xs">
          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium text-[11px]">학급 어휘 다양성 지수</span>
              <div className="text-lg font-bold text-purple-900 mt-0.5">
                {analysis.vocabularyDiversityScore}점 <span className="text-xs font-normal text-purple-700">/ 100</span>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-purple-500/80" />
          </div>

          <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium text-[11px]">고위험 판박이 구절</span>
              <div className="text-lg font-bold text-rose-800 mt-0.5">
                {analysis.highRiskDuplicatesCount}건 <span className="text-xs font-normal text-rose-600">감지</span>
              </div>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-500/80" />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium text-[11px]">중복 감지 총 구절수</span>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">
                {analysis.duplicatePhrases.length}개 <span className="text-xs font-normal text-emerald-600">발견</span>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/80" />
          </div>
        </div>

        {replaceNotice && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{replaceNotice}</span>
          </div>
        )}

        {/* Duplicate Phrase List & Shuffler */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {analysis.duplicatePhrases.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">학급 내 판박이 문구가 발견되지 않았습니다!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                모든 학생의 세특이 고유한 서사 구조와 다채로운 어휘로 작성되어 있습니다.
              </p>
            </div>
          ) : (
            analysis.duplicatePhrases.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition ${
                  item.severity === 'high'
                    ? 'bg-rose-50/40 border-rose-200'
                    : item.severity === 'medium'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        item.severity === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.count}명 중복 ({item.severity === 'high' ? '고위험' : '주의'})
                    </span>
                    <strong className="text-xs font-mono text-slate-900">"{item.phrase}"</strong>
                  </div>

                  <button
                    onClick={() => handleShufflePhrase(item)}
                    className="self-start sm:self-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>유의어로 자동 분산 교체</span>
                  </button>
                </div>

                {/* Duplicated Students List */}
                <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 mr-1">중복 포함 학생:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {item.studentNames.map((name, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Replacement Suggestions */}
                {item.replacementSuggestions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 text-[11px] space-y-1">
                    <span className="font-semibold text-purple-900">추천 대체 유의어 (학생별 순환 적용):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.replacementSuggestions.map((sug, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 bg-white text-purple-800 border border-purple-200 rounded-lg text-[10px]">
                          ➔ {sug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>대입 학생부종합전형 감사 기준(판박이 공통문구 배제) 준수 검사</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
