import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, X, ExternalLink, Check, Sparkles, Lock, Cpu, Trash2 } from 'lucide-react';
import { LLMProvider } from '../lib/geminiApi';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string, model: string, provider?: LLMProvider) => void;
  selectedModel: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
}) => {
  const [provider, setProvider] = useState<LLMProvider>(() => {
    if (apiKey?.startsWith('sk-ant-') || selectedModel?.includes('claude')) return 'claude';
    if (apiKey?.startsWith('sk-') || selectedModel?.includes('gpt')) return 'openai';
    if (apiKey?.startsWith('up_') || selectedModel?.includes('solar')) return 'upstage';
    return 'gemini';
  });

  const [inputKey, setInputKey] = useState(apiKey || '');
  const [model, setModel] = useState(selectedModel || 'gemini-2.5-flash');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const currentKey = apiKey || '';
    setInputKey(currentKey);
    setModel(selectedModel || 'gemini-2.5-flash');
    if (currentKey.startsWith('sk-ant-') || selectedModel?.includes('claude')) {
      setProvider('claude');
    } else if (currentKey.startsWith('sk-') && !currentKey.startsWith('sk-ant-')) {
      setProvider('openai');
    } else if (currentKey.startsWith('up_') || selectedModel?.includes('solar')) {
      setProvider('upstage');
    } else {
      setProvider('gemini');
    }
  }, [apiKey, selectedModel, isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    if (newProvider === 'gemini') {
      setInputKey((prev) => (prev.startsWith('AIza') ? prev : ''));
      setModel('gemini-2.5-flash');
    } else if (newProvider === 'upstage') {
      setInputKey((prev) => (prev.startsWith('up_') ? prev : ''));
      setModel('solar-pro');
    } else if (newProvider === 'claude') {
      setInputKey((prev) => (prev.startsWith('sk-ant-') ? prev : ''));
      setModel('claude-3-7-sonnet-20250219');
    } else if (newProvider === 'openai') {
      setInputKey((prev) => (prev.startsWith('sk-') && !prev.startsWith('sk-ant-') ? prev : ''));
      setModel('gpt-4o');
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim(), model, provider);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleClearKey = () => {
    setInputKey('');
    onSaveApiKey('', model, provider);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <span>AI 엔진 및 멀티 프로바이더 설정</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Provider Selection (4 Providers, Gemini First) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">
                사용할 AI 프로바이더 선택 (BYOK 본인 키 입력)
              </label>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                Gemini 무료 등급 우선 권장
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  provider === 'gemini'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Google Gemini</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('upstage')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  provider === 'upstage'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Upstage Solar</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('claude')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  provider === 'claude'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Cpu className="w-4 h-4 text-amber-600" />
                <span>Anthropic Claude</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  provider === 'openai'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>OpenAI GPT</span>
              </button>
            </div>
          </div>

          {/* Privacy & Zero-DB Assurance Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-start gap-2.5 leading-relaxed">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <div className="font-bold text-slate-900 mb-0.5">🔒 개인정보 보호 & Zero-DB 세션 원칙</div>
              <p className="text-slate-600">
                어떤 LLM을 선택하셔도 학생 식별 정보(이름, 학번, 이메일)는 API 호출 전 <strong>자동 마스킹(익명화)</strong>되어 순수 활동 내용만 전송되며, 서버에 데이터가 영구 저장되지 않습니다.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {provider === 'gemini' && 'Google Gemini API Key (무료 등급 권장)'}
              {provider === 'upstage' && 'Upstage API Key (Solar)'}
              {provider === 'claude' && 'Anthropic API Key (Claude)'}
              {provider === 'openai' && 'OpenAI API Key'}
            </label>
            <input
              type="password"
              placeholder={
                provider === 'gemini' ? 'AIzaSy...' :
                provider === 'upstage' ? 'up_...' :
                provider === 'claude' ? 'sk-ant-api03-...' : 'sk-proj-...'
              }
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-hidden font-mono text-xs"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              {provider === 'gemini' ? (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Google AI Studio에서 무료 키 발급</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : provider === 'upstage' ? (
                <a
                  href="https://console.upstage.ai/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:underline flex items-center gap-0.5"
                >
                  <span>Upstage Console에서 키 발급</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : provider === 'claude' ? (
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Anthropic Console에서 키 발급</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>OpenAI Platform에서 키 발급</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {inputKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-slate-400 hover:text-rose-600 transition flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>키 삭제</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              사용할 AI 모델
            </label>
            {provider === 'upstage' && (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-hidden text-xs bg-white font-medium"
              >
                <option value="solar-pro">solar-pro (권장: 최고 지능 & 완벽한 4층 서사)</option>
                <option value="solar-mini">solar-mini (초경량 및 초고속 생성)</option>
              </select>
            )}

            {provider === 'claude' && (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden text-xs bg-white font-medium"
              >
                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (최신 프론티어)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (최상위 자연어)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (초고속)</option>
              </select>
            )}

            {provider === 'openai' && (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden text-xs bg-white font-medium"
              >
                <option value="gpt-4o">GPT-4o (플래그십 다국어 모델)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (경제적 경량 모델)</option>
              </select>
            )}

            {provider === 'gemini' && (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden text-xs bg-white font-medium"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (권장: 초고속)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (심층 추론)</option>
              </select>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>설정 완료!</span>
              </>
            ) : (
              <span>설정 저장</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
