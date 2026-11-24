import { EnglishSkillAudit, HumanizeAudit, InspectionItem } from '../types';

// 영어과 4기능 키워드 사전
const SPEAKING_KEYWORDS = ['발표', '스피치', '구술', '질의응답', '토론', '디베이트', '롤플레이', '낭독', '대화', '발화', '프레젠테이션', '설득'];
const WRITING_KEYWORDS = ['에세이', '영작', '작성', '보고서', '대본', '개요', '논증문', '소감문', '요약문', '초안', '퇴고', '수정'];
const READING_KEYWORDS = ['독해', '원서', '텍스트', '맥락', '어휘', '논지', '문헌', '기사', '자료 분석', '읽기'];
const LISTENING_KEYWORDS = ['청취', '듣기', '강연', '경청', '음원', '오디오', '동료 발표', '피드백 수렴'];

// setek-english-natural AI-Tells 탐지 패턴
const HYPE_WORDS = ['탁월한', '뛰어난', '우수한', '심도 있는', '놀라운', '눈부신', '완벽한', '비범한'];
const ENDING_FORMULAS = [/모습을\s*보여줌\.?$/, /것으로\s*기대됨\.?$/, /점이\s*인상적임\.?$/, /측면이\s*확인됨\.?$/];
const GENERIC_ADJ_PAIRS = [/성실하고\s*적극적인/, /적극적이고\s*성실한/, /진지하고\s*열정적인/, /다양하고\s*깊이\s*있는/, /체계적이고\s*논리적인/];

export function analyzeEnglishSkills(text: string): EnglishSkillAudit {
  if (!text) {
    return {
      hasSpeaking: false,
      hasWriting: false,
      hasReading: false,
      hasListening: false,
      detectedSkillsCount: 0,
    };
  }

  const hasSpeaking = SPEAKING_KEYWORDS.some((kw) => text.includes(kw));
  const hasWriting = WRITING_KEYWORDS.some((kw) => text.includes(kw));
  const hasReading = READING_KEYWORDS.some((kw) => text.includes(kw));
  const hasListening = LISTENING_KEYWORDS.some((kw) => text.includes(kw));

  let count = 0;
  if (hasSpeaking) count++;
  if (hasWriting) count++;
  if (hasReading) count++;
  if (hasListening) count++;

  return {
    hasSpeaking,
    hasWriting,
    hasReading,
    hasListening,
    detectedSkillsCount: count,
  };
}

export function auditHumanizeSetek(text: string): { audit: HumanizeAudit; items: InspectionItem[] } {
  if (!text) {
    return {
      audit: {
        throughCount: 0,
        hypeCount: 0,
        endingFormulaCount: 0,
        genericAdjCount: 0,
        isNatural: true,
      },
      items: [],
    };
  }

  const items: InspectionItem[] = [];

  // 1. 번역투 '~을 통해' 출현 횟수 검사 (setek-english-natural 권장: 2회 이하)
  const throughMatches = text.match(/을\s*통해(서)?|를\s*통해(서)?/g) || [];
  const throughCount = throughMatches.length;
  if (throughCount >= 2) {
    items.push({
      id: 'humanize-through',
      type: 'warning',
      category: 'AI흔적',
      title: `번역투 '~을 통해' ${throughCount}회 반복 감지`,
      message: `'~을 통해'가 문장마다 반복되면 전형적인 AI 생성물처럼 읽힙니다.`,
      matchText: '~을 통해',
      suggestion: `'~활동에서', '~하는 과정에서', '~하여' 등 다양한 연결어미로 교체하세요.`,
      autoFixable: false,
    });
  }

  // 2. Hype 어휘 감지 (setek-english-natural 원칙: 0건 엄수)
  let hypeCount = 0;
  HYPE_WORDS.forEach((hw) => {
    if (text.includes(hw)) {
      hypeCount++;
      items.push({
        id: `humanize-hype-${hw}`,
        type: 'warning',
        category: 'AI흔적',
        title: `과도한 Hype 어휘 감지: '${hw}'`,
        message: `추상적 상찬('${hw}')은 입학사정관에게 변별력을 주지 못합니다.`,
        matchText: hw,
        suggestion: `추상적 수식어를 제거하고 구체적 산출물(초안 대비 수정 궤적, 논거 배치 등)로 사실을 보여주세요.`,
        autoFixable: false,
      });
    }
  });

  // 3. 결말 공식 감지 (~한 모습을 보여줌, ~할 것으로 기대됨)
  let endingFormulaCount = 0;
  ENDING_FORMULAS.forEach((ef, idx) => {
    if (ef.test(text.trim())) {
      endingFormulaCount++;
      items.push({
        id: `humanize-ending-${idx}`,
        type: 'warning',
        category: 'AI흔적',
        title: `상투적 결말 공식 감지`,
        message: `문장 끝이 '~모습을 보여줌' 또는 '~것으로 기대됨' 같은 기계적 클리셰로 닫혔습니다.`,
        matchText: '결말 공식',
        suggestion: `활동의 구체적 산출물 결과 자체로 마무리하거나 역량의 전이 가능성(예: '비판적 텍스트 독해력의 단초가 보임')으로 매듭지으세요.`,
        autoFixable: false,
      });
    }
  });

  // 4. 범용 형용사 쌍 감지 (성실하고 적극적인 등)
  let genericAdjCount = 0;
  GENERIC_ADJ_PAIRS.forEach((gap, idx) => {
    if (gap.test(text)) {
      genericAdjCount++;
      items.push({
        id: `humanize-generic-adj-${idx}`,
        type: 'info',
        category: 'AI흔적',
        title: `범용 형용사 묶음 감지`,
        message: `'성실하고 적극적인'과 같은 뻔한 수식어 묶음이 감지되었습니다.`,
        matchText: '형용사 묶음',
        suggestion: `추상적 형용사 묶음 대신 '동료 발표마다 후속 질문을 준비해 옴'처럼 단 1개의 구체적 행동 에피소드로 명시하세요.`,
        autoFixable: false,
      });
    }
  });

  const isNatural = throughCount < 2 && hypeCount === 0 && endingFormulaCount === 0 && genericAdjCount === 0;

  return {
    audit: {
      throughCount,
      hypeCount,
      endingFormulaCount,
      genericAdjCount,
      isNatural,
    },
    items,
  };
}
