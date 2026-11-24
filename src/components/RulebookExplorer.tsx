import React, { useState } from 'react';
import { PROHIBITED_DATABASE } from '../lib/prohibitedRules';
import { AlertCircle, BookOpen, CheckCircle, Feather, Layers, Library, Search, ShieldAlert, Sparkles } from 'lucide-react';

export const RulebookExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [guideTab, setGuideTab] = useState<'narrative' | 'natural' | 'paraphraser' | 'prohibited'>('narrative');

  const filteredRules = PROHIBITED_DATABASE.filter(
    (item) =>
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* 4 Skills Synthesis Quick Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>4대 핵심 스킬 종합 규격 탑재</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          세특 작성 및 검수 통합 프레임워크 가이드
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          <strong>seteuk-workflow</strong>(3단계 파이프라인) × <strong>setek-english-creator</strong>(4층 서사 구조 및 4기능) × <strong>setek-english-natural</strong>(AI 티 사전 회피) × <strong>sebu-paraphraser</strong>(수준별 90개 변형 문구)의 원칙을 총망라하였습니다.
        </p>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <button
            onClick={() => setGuideTab('narrative')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              guideTab === 'narrative'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4층 서사 구조 (setek-english-creator)</span>
          </button>

          <button
            onClick={() => setGuideTab('natural')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              guideTab === 'natural'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>AI 티 사전 회피 (setek-english-natural)</span>
          </button>

          <button
            onClick={() => setGuideTab('paraphraser')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              guideTab === 'paraphraser'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>수준별 90개 변형 축 (sebu-paraphraser)</span>
          </button>

          <button
            onClick={() => setGuideTab('prohibited')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              guideTab === 'prohibited'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>NEIS 11대 절대 기재금지어</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 4-Layer Narrative Architecture */}
      {guideTab === 'narrative' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>[setek-english-creator] 4층 서술 구조 (개성 × 발전성 × 미래지향)</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            단순 활동 나열이나 추상적 칭찬을 배제하고, 하나의 완성된 유기적 서사로 흐르도록 구성합니다:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
              <div className="font-bold text-blue-800 mb-1">1층 [진단 — Motivation]</div>
              <p className="text-slate-700 leading-relaxed">
                학생 고유의 교과/영어과 접근 성향과 탐구 출발점. "열심히 참여함" 같은 범용 형용사 금지.
              </p>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
              <div className="font-bold text-blue-800 mb-1">2층 [전개 — Action]</div>
              <p className="text-slate-700 leading-relaxed">
                구체적 활동 근거 2~3가지 (말하기/쓰기/읽기/듣기 4기능 수행 과정 및 산출물의 구체적 논거).
              </p>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
              <div className="font-bold text-blue-800 mb-1">3층 [해석 — Meaning]</div>
              <p className="text-slate-700 leading-relaxed">
                활동에서 드러난 인지적·메타인지적 역량, 피드백 수용 및 수정 궤적의 의미화.
              </p>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
              <div className="font-bold text-blue-800 mb-1">4층 [전망 — Prospect]</div>
              <p className="text-slate-700 leading-relaxed">
                특정 직업 단정 대신 '맥락 독해력', '논증적 의사소통' 등 전이 가능한 역량 중심의 발전 잠재력.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Natural AI-Tells Avoidance */}
      {guideTab === 'natural' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Feather className="w-4 h-4 text-indigo-600" />
            <span>[setek-english-natural] AI 티 사전 회피 7대 규칙</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">회피 대상</th>
                  <th className="py-2.5 px-3">금기 표현 예시 (AI 흔적)</th>
                  <th className="py-2.5 px-3">권장 대체 패턴 (교사의 자연어)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">번역투 '~을 통해'</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">"활동을 통해 역량을 함양함"</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">"활동에서 ~을 보임", "~하는 과정에서 ~이 드러남"</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">Hype 어휘</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">"탁월한·뛰어난·심도 있는"</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">"초안보다 논거 배치가 명료해짐" 등 구체적 관찰 사실</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">결말 공식</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">"~한 모습을 보여줌", "~것으로 기대됨"</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">"자신의 입장을 영문 대본으로 완성함" (산출물 자체로 종결)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">범용 형용사 쌍</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">"성실하고 적극적인 태도로"</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">"동료 발표마다 후속 질문을 준비해 옴" 등 구체적 에피소드 1개</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">수식 중복</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">"다양하고 깊이 있는 관점에서"</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">하나의 명확한 형용사로 수렴하거나 삭제</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-rose-700">격식체 보존</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">평어체(~했다, ~한다)</td>
                  <td className="py-2.5 px-3 text-emerald-800 font-medium">격식체(~함, ~임, ~음) 100% 엄수 (세특 공식 규정)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sebu-Paraphraser 90 Axis */}
      {guideTab === 'paraphraser' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Library className="w-4 h-4 text-purple-600" />
            <span>[sebu-paraphraser] 학생 수준별 90개 변형 축 및 핵심 보존 요소</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4">
              <div className="font-bold text-purple-900 mb-1.5">상 (上) — 30개</div>
              <p className="text-slate-600 mb-2">자기주도성, 심화 탐구, 비판적 사고, 타 교과/실생활 융합, 토론 방향 제시 및 학습 공동체 리더십</p>
              <div className="text-[11px] text-purple-700 font-mono">권장어: 주도적으로, 심층적으로, 정교하게, 구조화하여, 독창적인 관점에서</div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
              <div className="font-bold text-blue-900 mb-1.5">중 (中) — 30개</div>
              <p className="text-slate-600 mb-2">성실한 참여, 핵심 개념의 정확한 이해와 적용, 모둠 협력 및 원활한 소통, 점진적 성장 궤적</p>
              <div className="text-[11px] text-blue-700 font-mono">권장어: 성실하게, 충실하게, 명료하게 정리하여, 또래와 협력하여, 안정적으로</div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
              <div className="font-bold text-emerald-900 mb-1.5">하 (下) — 30개</div>
              <p className="text-slate-600 mb-2">부정어 일체 배제, 기초 개념 다지기 노력, 진솔한 질문, 소소한 성취와 긍정적 변화의 시작</p>
              <div className="text-[11px] text-emerald-700 font-mono">권장어: 노력하는 모습이, 성장 가능성이, 기초를 다지며, 자신감을 키워가며</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Prohibited Database */}
      {guideTab === 'prohibited' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-900">
                교육부 학교생활기록부 기재요령 기재금지어 사전 (11대 카테고리)
              </h2>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="금지어 또는 카테고리 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRules.map((rule, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 text-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {rule.category}
                      </span>
                      <span className="text-slate-700 font-medium">{rule.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-slate-400 text-[11px]">감지 키워드:</span>
                      {rule.keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="bg-slate-100 text-slate-700 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="max-w-md bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 shrink-0">
                    <span className="font-semibold block mb-0.5">💡 올바른 기재 대안:</span>
                    <span>{rule.suggestion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
