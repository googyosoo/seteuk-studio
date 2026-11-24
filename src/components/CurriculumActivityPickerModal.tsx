import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, Sparkles, Check, ArrowRight, Layers, Lightbulb, Tag } from 'lucide-react';
import { CURRICULUM_STANDARDS, SUBJECT_CATEGORIES, getSubjectGroup } from '../lib/curriculumData';
import { CurriculumStandard } from '../types';

interface CurriculumActivityPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject?: string;
  selectedCode?: string;
  onSelectStandardAndActivity: (standard: CurriculumStandard, activity?: string, template?: string) => void;
}

export const CurriculumActivityPickerModal: React.FC<CurriculumActivityPickerModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  selectedCode,
  onSelectStandardAndActivity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (currentSubject) {
      const group = getSubjectGroup(currentSubject);
      if (SUBJECT_CATEGORIES.includes(group)) return group;
    }
    return '전체';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStandardCode, setExpandedStandardCode] = useState<string | null>(selectedCode || null);

  const filteredStandards = useMemo(() => {
    return CURRICULUM_STANDARDS.filter((item) => {
      // 1. 카테고리 필터
      if (selectedCategory !== '전체') {
        const group = getSubjectGroup(item.subject);
        if (group !== selectedCategory) return false;
      }

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const inCode = item.code.toLowerCase().includes(query);
        const inName = item.name.toLowerCase().includes(query);
        const inDesc = item.description.toLowerCase().includes(query);
        const inSubject = item.subject.toLowerCase().includes(query);
        const inCompetencies = item.keyCompetencies?.some((c) => c.toLowerCase().includes(query));
        const inActivities = item.recommendedActivities.some((a) => a.toLowerCase().includes(query));

        return inCode || inName || inDesc || inSubject || inCompetencies || inActivities;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  2022 개정 교육과정 성취기준 & 수행평가 활동 연계
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  총 {CURRICULUM_STANDARDS.length}개 기준 탑재
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                성취기준을 선택하고, 추천되는 연계 활동을 클릭하면 맥락과 활동 메모 가이드가 즉시 자동 연계됩니다.
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

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          {/* Subject Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {SUBJECT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="성취기준 코드([10공영02-03]), 교과목명, 탐구 키워드(기후변화, TED, 모델링 등) 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-slate-50/50"
            />
          </div>
        </div>

        {/* Standards & Activities Scrollable List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredStandards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              검색 조건에 일치하는 2022 개정 성취기준이 없습니다.
            </div>
          ) : (
            filteredStandards.map((std) => {
              const isSelected = selectedCode === std.code;
              const isExpanded = expandedStandardCode === std.code;

              return (
                <div
                  key={std.code}
                  className={`border rounded-2xl p-4 transition ${
                    isSelected
                      ? 'border-purple-400 bg-purple-50/30 ring-1 ring-purple-300'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Standard Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                        {std.code}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {std.subject} ({std.grade})
                      </span>
                      {std.skillFocus && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {std.skillFocus} 중심
                        </span>
                      )}
                      <h3 className="text-xs font-bold text-slate-900">{std.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setExpandedStandardCode(isExpanded ? null : std.code);
                        }}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-purple-50 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isExpanded ? '활동 닫기' : `추천 연계 활동 (${std.recommendedActivities.length})`}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectStandardAndActivity(std);
                          onClose();
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition shadow-2xs ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{isSelected ? '선택됨' : '성취기준 적용'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Standard Official Description */}
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {std.description}
                  </p>

                  {/* Competencies Badges */}
                  {std.keyCompetencies && std.keyCompetencies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-semibold mr-1">핵심 역량:</span>
                      {std.keyCompetencies.map((comp) => (
                        <span
                          key={comp}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Recommended Activities (연계 활동 선택 구역) */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-purple-100/70 bg-purple-50/40 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-2.5 animate-in fade-in duration-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>이 성취기준과 100% 매칭되는 추천 수행평가 활동 (클릭 시 즉시 연계):</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {std.recommendedActivities.map((act, actIdx) => (
                          <div
                            key={actIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 hover:shadow-xs transition"
                          >
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {actIdx + 1}
                              </span>
                              <span className="text-xs text-slate-800 font-medium leading-relaxed">
                                {act}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                onSelectStandardAndActivity(std, act, std.sampleDraftTemplate);
                                onClose();
                              }}
                              className="self-end sm:self-center px-3 py-1.5 text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center gap-1 shadow-2xs shrink-0"
                            >
                              <span>이 활동으로 세특 연계</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {std.sampleDraftTemplate && (
                        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                          <span className="font-bold mr-1">📝 활동 메모 추천 가이드:</span>
                          <span className="text-slate-700">{std.sampleDraftTemplate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>2022 개정 고등학교 교육과정 성취기준 총론 및 각론 표준 연계</span>
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
