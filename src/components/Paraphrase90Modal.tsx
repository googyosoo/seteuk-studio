import React, { useState } from 'react';
import { Paraphrase90Group, Paraphrase90Item, Level } from '../types';
import { Check, ClipboardCopy, Download, Filter, Sparkles, X } from 'lucide-react';

interface Paraphrase90ModalProps {
  isOpen: boolean;
  onClose: () => void;
  paraphrase90?: Paraphrase90Group;
  studentName: string;
  context: string;
  onApplyToStudent: (text: string) => void;
}

export const Paraphrase90Modal: React.FC<Paraphrase90ModalProps> = ({
  isOpen,
  onClose,
  paraphrase90,
  studentName,
  context,
  onApplyToStudent,
}) => {
  const [activeTab, setActiveTab] = useState<Level>('high');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !paraphrase90) return null;

  const currentList = paraphrase90[activeTab] || [];
  const filteredList = activeCategory === 'all'
    ? currentList
    : currentList.filter((item) => item.category === activeCategory);

  const handleCopy = (item: Paraphrase90Item) => {
    navigator.clipboard.writeText(item.text);
    setCopiedIndex(item.id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleApply = (text: string) => {
    onApplyToStudent(text);
    onClose();
  };

  const handleCopyAllGroup = () => {
    const allText = currentList.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n\n');
    navigator.clipboard.writeText(allText);
    alert(`[${activeTab.toUpperCase()} 수준] 30개 문구 전체가 클립보드에 복사되었습니다!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">
                  수준별 90개 세특 변형 문구 라이브러리 (sebu-paraphraser)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-semibold">
                  상 30 · 중 30 · 하 30
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xl">
                [{studentName}] 활동 맥락: {context}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Tabs & Filter Toolbar */}
        <div className="p-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Level Switcher */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('high')}
              className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'high'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>상 (上) — 심화·주도</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">30</span>
            </button>

            <button
              onClick={() => setActiveTab('mid')}
              className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>중 (中) — 성실·이해</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">30</span>
            </button>

            <button
              onClick={() => setActiveTab('low')}
              className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'low'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>하 (下) — 기초·발전가능성</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">30</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="text-xs bg-transparent outline-hidden font-medium text-slate-700"
              >
                <option value="all">서술 초점 전체</option>
                <option value="과정중심">과정 중심</option>
                <option value="산출물중심">산출물 중심</option>
                <option value="결과중심">결과 중심</option>
                <option value="태도중심">태도 중심</option>
              </select>
            </div>

            <button
              onClick={handleCopyAllGroup}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 shadow-2xs transition"
            >
              <ClipboardCopy className="w-3.5 h-3.5 text-slate-500" />
              <span>현재 그룹 30개 일괄 복사</span>
            </button>
          </div>
        </div>

        {/* Scrollable Item Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {filteredList.map((item) => {
            const isCopied = copiedIndex === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{item.id.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        격식체(~함/~임) 종결
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-sans pr-4">
                      {item.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1 transition"
                      title="클립보드 복사"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">복사됨</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-3 h-3 text-slate-500" />
                          <span>복사</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleApply(item.text)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>세특에 적용</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>💡 활동명·학습 내용·역량 키워드는 보존되며, 상/중/하 성취도와 서술 관점만 다양하게 변형되었습니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
