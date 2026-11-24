import React from 'react';
import { countNeisBytes, NEIS_MAX_BYTES } from '../lib/byteCounter';

interface ByteGaugeProps {
  text: string;
  maxBytes?: number;
}

export const ByteGauge: React.FC<ByteGaugeProps> = ({ text, maxBytes = NEIS_MAX_BYTES }) => {
  const result = countNeisBytes(text, maxBytes);

  let barColor = 'bg-blue-600';
  let badgeColor = 'text-blue-700 bg-blue-50 border-blue-200';

  if (result.bytes === 0) {
    barColor = 'bg-slate-300';
    badgeColor = 'text-slate-600 bg-slate-50 border-slate-200';
  } else if (result.isOverflow) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200 font-bold';
  } else if (result.percent >= 80 && result.percent <= 98) {
    barColor = 'bg-emerald-500';
    badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
  } else if (result.percent > 98) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NEIS 바이트 게이지</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {result.bytes.toLocaleString()} / {maxBytes.toLocaleString()} Byte ({result.percent}%)
          </span>
          {result.percent >= 80 && !result.isOverflow && (
            <span className="text-[11px] text-emerald-600 font-medium">✨ 최적 분량 구간</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          <span>글자수(공백포함): {result.chars}자</span>
          <span className="mx-1 text-slate-300">|</span>
          <span>한글: {result.koreanCount}자 (3B)</span>
          <span className="mx-1 text-slate-300">|</span>
          <span>기타·공백: {result.asciiCount}자 (1B)</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, result.percent)}%` }}
        />
        {/* 80%~95% Optimal Guideline Marker */}
        <div className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-emerald-400 opacity-60 pointer-events-none" title="최적 시작점 (80%)" />
        <div className="absolute top-0 bottom-0 left-[97%] w-[1px] bg-rose-400 opacity-60 pointer-events-none" title="한도 도달점 (97%)" />
      </div>

      {result.isOverflow && (
        <div className="mt-2 text-xs text-rose-600 font-medium flex items-center justify-between bg-rose-50 px-2.5 py-1.5 rounded-md border border-rose-200">
          <span>⚠️ <strong>{result.bytes - maxBytes} Byte 초과되었습니다!</strong> 나이스 입력 시 문장 끝이 잘릴 수 있습니다.</span>
          <span className="text-[11px] underline cursor-pointer">압축 추천</span>
        </div>
      )}
    </div>
  );
};
