import React from 'react';
import { BookOpen, FileSpreadsheet, KeyRound, Lock, RefreshCw, Sparkles, UserCheck, Zap, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'batch' | 'rulebook';
  onTabChange: (tab: 'single' | 'batch' | 'rulebook') => void;
  onOpenApiKeyModal: () => void;
  onResetSamples: () => void;
  hasApiKey: boolean;
  selectedModel: string;
  isMiniDockOpen?: boolean;
  onToggleMiniDock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenApiKeyModal,
  onResetSamples,
  hasApiKey,
  selectedModel,
  isMiniDockOpen,
  onToggleMiniDock,
}) => {
  const getModelLabel = () => {
    if (selectedModel.includes('claude')) return 'Claude 3.7/3.5';
    if (selectedModel.includes('gpt')) return 'OpenAI GPT-4o';
    if (selectedModel.includes('gemini')) return 'Gemini 2.5 Flash';
    return 'Upstage Solar Pro';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  교사용 세특 고도화 스튜디오
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 whitespace-nowrap">
                  <Zap className="w-3 h-3 text-purple-600 fill-current" />
                  <span>{getModelLabel()}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden md:flex items-center gap-1 whitespace-nowrap">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Zero-DB 세션</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden lg:block whitespace-nowrap">
                구글 시트 연동 · 4층 서사 완성형 초안 · 수준별 90개 변형 · 독립 룰엔진 검증
              </p>
            </div>
          </div>

          {/* Main 2 Workflows Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0 overflow-x-auto">
            <button
              onClick={() => onTabChange('single')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'single'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>개별 학생 작성</span>
            </button>

            <button
              onClick={() => onTabChange('batch')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'batch'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>구글 시트 & 엑셀 일괄 작성</span>
            </button>

            <button
              onClick={() => onTabChange('rulebook')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                activeTab === 'rulebook'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>기재요령</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleMiniDock && (
              <button
                onClick={onToggleMiniDock}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${
                  isMiniDockOpen
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="나이스(NEIS) 창 옆에 1:1로 띄워두고 빠른 복사하기"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isMiniDockOpen ? '나이스 도크 닫기' : '나이스 분할 모드 📌'}</span>
              </button>
            )}

            <button
              onClick={onResetSamples}
              className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition hidden sm:flex"
              title="예시 데이터 4건 새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>샘플 리셋</span>
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${
                hasApiKey
                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>AI 모델 / 키 설정</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
