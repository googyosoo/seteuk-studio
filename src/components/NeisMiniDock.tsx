import React, { useState, useEffect } from 'react';
import { X, ClipboardCopy, Check, ArrowDown, ChevronRight, Sparkles, Minimize2, Maximize2, Zap, AlertCircle } from 'lucide-react';
import { StudentRecord } from '../types';

interface NeisMiniDockProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
}

export const NeisMiniDock: React.FC<NeisMiniDockProps> = ({
  isOpen,
  onClose,
  students,
  activeStudentId,
  onSelectStudent,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // 학번 순서 정렬
  const sortedStudents = [...students].sort((a, b) => {
    return (a.studentNo || '').localeCompare(b.studentNo || '', undefined, { numeric: true });
  });

  const currentIndex = sortedStudents.findIndex((s) => s.id === activeStudentId);
  const currentStudent = sortedStudents[currentIndex >= 0 ? currentIndex : 0];

  // 단축키 (Alt+C 또는 Ctrl+Space)로 복사 및 자동 전진
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'c') || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        handleCopyAndAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStudent, currentIndex, sortedStudents]);

  if (!isOpen) return null;

  // 복사 후 자동으로 다음 학생으로 포커스 이동 (Auto-Advance)
  const handleCopyAndAdvance = () => {
    if (!currentStudent || !currentStudent.enrichedDraft) return;

    navigator.clipboard.writeText(currentStudent.enrichedDraft);
    setCopiedId(currentStudent.id);

    setTimeout(() => {
      setCopiedId(null);
      // 다음 학생으로 자동 전진
      if (currentIndex < sortedStudents.length - 1) {
        onSelectStudent(sortedStudents[currentIndex + 1].id);
      }
    }, 400);
  };

  const handleCopySingle = (student: StudentRecord) => {
    if (!student.enrichedDraft) return;
    navigator.clipboard.writeText(student.enrichedDraft);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <aside
      aria-label="나이스(NEIS) 병렬 입력 도크"
      className={`fixed right-4 bottom-4 z-40 bg-white rounded-3xl shadow-2xl border border-purple-300 transition-all duration-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 ${
        isMinimized ? 'w-80 h-16' : 'w-96 max-h-[85vh] h-[720px]'
      }`}
    >
      {/* Dock Header */}
      <div className="p-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>나이스(NEIS) 병렬 입력 도크</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-white/20">
                {currentIndex + 1}/{sortedStudents.length}
              </span>
            </h3>
            <p className="text-[10px] text-purple-200">단축키: Alt + C (복사 ➔ 다음 학생 자동 이동)</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
            title={isMinimized ? '창 키우기' : '창 최소화'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
            title="도크 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Current Active Student Focus Box */}
          {currentStudent && (
            <div className="p-3.5 bg-purple-50/70 border-b border-purple-100 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-purple-600 text-white">
                    {currentStudent.studentNo}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{currentStudent.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({currentStudent.subject})</span>
                </div>

                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentStudent.byteCount >= 1200
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {currentStudent.byteCount || 0} Byte
                </span>
              </div>

              {/* Draft Preview Text */}
              <div className="p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 line-clamp-3 leading-relaxed max-h-24 overflow-y-auto">
                {currentStudent.enrichedDraft || (
                  <span className="text-slate-400 italic">아직 작성된 세특이 없습니다.</span>
                )}
              </div>

              {/* Big Advance Button */}
              <button
                disabled={!currentStudent.enrichedDraft}
                onClick={handleCopyAndAdvance}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40"
              >
                {copiedId === currentStudent.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>클립보드 복사됨! 다음 학생으로 이동 ➔</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" />
                    <span>복사하고 다음 학생으로 이동 ⚡ (Alt + C)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Student List View */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {sortedStudents.map((student, idx) => {
              const isActive = student.id === currentStudent?.id;
              const hasDraft = Boolean(student.enrichedDraft);

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between text-xs ${
                    isActive
                      ? 'bg-purple-100/70 border border-purple-300 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-500 shrink-0">
                      {student.studentNo}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">{student.name}</span>
                    <p className="text-[11px] text-slate-500 truncate">
                      {student.enrichedDraft || '미작성'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {student.byteCount || 0}B
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySingle(student);
                      }}
                      disabled={!hasDraft}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-600 disabled:opacity-30 transition"
                      title="이 학생만 복사"
                    >
                      {copiedId === student.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ClipboardCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Guide */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
            나이스 창 옆에 두고 <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono">Alt+C</kbd> ➔ 나이스 <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono">Ctrl+V</kbd>로 빠르게 입력하세요.
          </div>
        </>
      )}
    </aside>
  );
};
