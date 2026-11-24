import { InspectionItem } from '../types';
import { splitSentences } from './formatRules';

export const OBSERVER_RISK_WORDS = [
  '관심이 많음', '열정적임', '열정을 보임', '열의가 높음', '재능을 보임',
  '역량이 뛰어남', '소질이 있음', '자부심을 느낌', '잠재력이 큼', '흥미를 느낌',
  '깊이 깨달음', '큰 감명을 받음', '의지가 강함'
];

export const VAGUE_PRAISE_WORDS = [
  '우수함', '뛰어남', '탁월함', '훌륭함', '완벽함', '매우 우수함'
];

export function checkObserverRisk(text: string): InspectionItem[] {
  if (!text) return [];
  const results: InspectionItem[] = [];
  const sentences = splitSentences(text);

  // 관찰자 시점 위험 어휘 (내적 심리 단정)
  OBSERVER_RISK_WORDS.forEach((word) => {
    if (text.includes(word)) {
      const matchSentence = sentences.find((s) => s.includes(word)) || word;
      results.push({
        id: `observer-${word}`,
        type: 'warning',
        category: '관찰자시점',
        title: `관찰자 시점 의심 표현 감지: '${word}'`,
        message: `학생의 내적 심리·동기("${word}")를 근거 없이 단정하고 있습니다: "${matchSentence.slice(0, 30)}..."`,
        matchText: word,
        suggestion: `내적 감정 단정 대신 구체적인 산출물(예: 질문 목록 작성, 통계 데이터 비교, 모형 설계 등)을 통해 드러난 역량으로 서술하세요.`,
        autoFixable: false,
      });
    }
  });

  // 막연한 칭찬 표현
  VAGUE_PRAISE_WORDS.forEach((word) => {
    if (text.includes(word)) {
      results.push({
        id: `vague-praise-${word}`,
        type: 'info',
        category: '관찰자시점',
        title: `추상적 칭찬 표현 감지: '${word}'`,
        message: `근거 없는 막연한 수식어("${word}")는 대입 평가에서 신뢰도가 떨어집니다.`,
        matchText: word,
        suggestion: `어떤 구체적 탐구 결과물이 그 평가를 뒷받침하는지 사실 중심으로 서술하세요.`,
        autoFixable: false,
      });
    }
  });

  return results;
}
