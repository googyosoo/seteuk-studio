import { InspectionItem } from '../types';
import { splitSentences } from './formatRules';

export const AI_CLICHE_WORDS = [
  '핵심적인', '효과적인', '지속가능한', '혁신적인', '체계적인 접근',
  '능동적인 태도로', '다각도로 분석하여', '다양한 관점에서', '유의미한 시사점을',
  '눈부신 성장을', '괄목할 만한', '주목할 만한'
];

export const TRANSLATION_PATTERNS = [
  { pattern: /에\s*대해(서)?/g, name: '~에 대해', suggestion: `'~을/를' 또는 특정 주제어로 간결화` },
  { pattern: /을\s*통해(서)?/g, name: '~를 통해', suggestion: `'~하여', '~함으로' 등 연결어미로 교정` },
  { pattern: /되어지/g, name: '이중피동(~되어짐)', suggestion: `'되다', '나타나다' 등 단일 능동/피동으로 교정` },
  { pattern: /을\s*가지고\s*있/g, name: '~을 가지고 있다', suggestion: `'~이 있다', '~을 갖추다'로 교정` },
];

export function checkHumanizerRules(text: string): InspectionItem[] {
  if (!text) return [];
  const results: InspectionItem[] = [];
  const sentences = splitSentences(text);

  // 1. AI 상투어 및 유행어 감지
  AI_CLICHE_WORDS.forEach((word) => {
    if (text.includes(word)) {
      results.push({
        id: `ai-cliche-${word}`,
        type: 'info',
        category: 'AI흔적',
        title: `AI 특유의 상투적 수식어 감지: '${word}'`,
        message: `인공지능 모델이 자주 남발하는 전형적인 수식어("${word}")입니다.`,
        matchText: word,
        suggestion: `추상적 형용사 대신 실제 수행한 구체적 분석 기법이나 도출한 사실로 바꾸세요.`,
        autoFixable: false,
      });
    }
  });

  // 2. 번역투 및 피동 남용 감지
  TRANSLATION_PATTERNS.forEach((tp, idx) => {
    if (tp.pattern.test(text)) {
      results.push({
        id: `ai-trans-${idx}`,
        type: 'info',
        category: 'AI흔적',
        title: `번역투/피동 표현 감지: '${tp.name}'`,
        message: `영어 번역투 표현("${tp.name}")이 문장에 포함되어 글의 자연스러움을 해칩니다.`,
        matchText: tp.name,
        suggestion: tp.suggestion,
        autoFixable: false,
      });
    }
  });

  // 3. 문장 내 쉼표(,) 과다 감지 (영어식 쉼표 나열)
  sentences.forEach((sentence, sIdx) => {
    const commaCount = (sentence.match(/,/g) || []).length;
    if (commaCount >= 3) {
      results.push({
        id: `ai-comma-${sIdx}`,
        type: 'info',
        category: 'AI흔적',
        title: `문장 내 쉼표(${commaCount}개) 과다 감지`,
        message: `한 문장에 쉼표가 너무 많아 문맥 호흡이 끊깁니다: "${sentence.slice(0, 35)}..."`,
        matchText: ',',
        suggestion: `문장을 두 개로 분리하거나 불필요한 삽입구를 정리하세요.`,
        autoFixable: false,
      });
    }
  });

  return results;
}
