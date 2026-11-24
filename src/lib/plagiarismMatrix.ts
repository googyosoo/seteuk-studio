import { StudentRecord } from '../types';

export interface DuplicatePhraseItem {
  phrase: string;
  count: number;
  studentIds: string[];
  studentNames: string[];
  severity: 'high' | 'medium' | 'low';
  replacementSuggestions: string[];
}

export interface PlagiarismAnalysisResult {
  totalAnalyzed: number;
  duplicatePhrases: DuplicatePhraseItem[];
  vocabularyDiversityScore: number; // 0 ~ 100 점 (어휘 다양성 지수)
  highRiskDuplicatesCount: number;
}

// 자주 중복되는 상투적 세특 표현 및 유의어 대체 맵
export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  '비판적 문제의식을 바탕으로': [
    '날카로운 문제의식에 착안하여',
    '심도 있는 비판적 고찰을 토대로',
    '다각적인 문제의식을 견지하며',
    '비판적 분석 시각을 중심으로'
  ],
  '인과관계를 규명하고': [
    '원인과 결과의 연계성을 면밀히 파헤치고',
    '상호 연관 메커니즘을 체계적으로 도출하고',
    '현상의 이면적 발생 경로를 추적하고',
    '구조적 상관관계를 입체적으로 분석하고'
  ],
  '학업 역량이 돋보임': [
    '지적 성취도가 뚜렷하게 확인됨',
    '학문적 탐구 잠재력이 두드러짐',
    '탁월한 개념 적용 능력을 입증함',
    '자기주도적 연구 소양이 확인됨'
  ],
  '모둠 토의 시': [
    '협력적 소통 과정에서',
    '동료들과의 논의 단계에서',
    '의견 교환 세션에서',
    '상호 토론을 진행하며'
  ],
  '자신의 논거를 한층 정교화함': [
    '주장의 논리적 완결성을 높임',
    '근거의 타당성을 빈틈없이 보완함',
    '논변의 설득력을 체계적으로 다듬음',
    '자신의 관점을 한 단계 심화함'
  ],
  '논리정연한 구술로': [
    '명료하고 설득력 있는 발표로',
    '체계적인 논증을 갖춘 언어로',
    '명확한 논지를 담은 전달력으로',
    '차분하고 조리 있는 어조로'
  ],
  '지적 호기심을 바탕으로': [
    '왕성한 탐구열을 동력 삼아',
    '새로운 개념에 대한 배움의 의지로',
    '깊이 있는 앎을 향한 능동적 열의로',
    '학문적 호기심을 능동적으로 확장하며'
  ],
  '창의적 관점에서': [
    '독창적인 시각에 입각하여',
    '기존 틀을 벗어난 새로운 관점에서',
    '차별화된 발상에 착안하여',
    '입체적이고 참신한 접근법으로'
  ]
};

// 불용어 (단순 조사 및 통상 어휘)
const STOP_WORDS = new Set([
  '활동에서', '과정에서', '수업에서', '대해', '대한', '통해', '위해', '하고', '하며',
  '있는', '있음', '학생', '모습', '자신의', '통한', '함께', '이에', '따라'
]);

/**
 * 학급 전체 세특 텍스트 간 어휘 및 문구 중복도 교차 분석 함수
 */
export function analyzeClassPlagiarism(students: StudentRecord[]): PlagiarismAnalysisResult {
  const activeStudents = students.filter(
    (s) => s.enrichedDraft && s.enrichedDraft.trim().length > 30
  );

  if (activeStudents.length === 0) {
    return {
      totalAnalyzed: 0,
      duplicatePhrases: [],
      vocabularyDiversityScore: 100,
      highRiskDuplicatesCount: 0,
    };
  }

  // 1. n-gram 및 2~4어절 구절 빈도 카운팅
  const phraseMap = new Map<string, { studentIds: Set<string>; studentNames: Set<string> }>();
  const totalTokens: string[] = [];

  activeStudents.forEach((student) => {
    const text = student.enrichedDraft.replace(/[^\w\s가-힣]/g, ' ');
    const tokens = text.split(/\s+/).filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
    totalTokens.push(...tokens);

    // 2-gram, 3-gram 구절 추출
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (!phraseMap.has(bigram)) {
        phraseMap.set(bigram, { studentIds: new Set(), studentNames: new Set() });
      }
      phraseMap.get(bigram)!.studentIds.add(student.id);
      phraseMap.get(bigram)!.studentNames.add(student.name);

      if (i < tokens.length - 2) {
        const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
        if (!phraseMap.has(trigram)) {
          phraseMap.set(trigram, { studentIds: new Set(), studentNames: new Set() });
        }
        phraseMap.get(trigram)!.studentIds.add(student.id);
        phraseMap.get(trigram)!.studentNames.add(student.name);
      }
    }

    // 정의된 상투적 문구 감지
    Object.keys(SYNONYM_DICTIONARY).forEach((keyPhrase) => {
      if (student.enrichedDraft.includes(keyPhrase)) {
        if (!phraseMap.has(keyPhrase)) {
          phraseMap.set(keyPhrase, { studentIds: new Set(), studentNames: new Set() });
        }
        phraseMap.get(keyPhrase)!.studentIds.add(student.id);
        phraseMap.get(keyPhrase)!.studentNames.add(student.name);
      }
    });
  });

  // 2. 2명 이상 중복 출현한 구절 필터링
  const duplicatePhrases: DuplicatePhraseItem[] = [];

  phraseMap.forEach((meta, phrase) => {
    const count = meta.studentIds.size;
    // 2인 이상 중복된 경우 대상
    if (count >= 2) {
      let severity: 'high' | 'medium' | 'low' = 'low';
      if (count >= 5 || (count >= 3 && phrase.length >= 7)) {
        severity = 'high';
      } else if (count >= 3) {
        severity = 'medium';
      }

      // 유의어 추천 찾기
      const directSynonyms = SYNONYM_DICTIONARY[phrase];
      let replacementSuggestions: string[] = directSynonyms || [];

      if (!directSynonyms) {
        // 부분 매칭되는 유의어 검색
        const matchedKey = Object.keys(SYNONYM_DICTIONARY).find((k) => k.includes(phrase) || phrase.includes(k));
        if (matchedKey) {
          replacementSuggestions = SYNONYM_DICTIONARY[matchedKey];
        } else {
          replacementSuggestions = [
            `'${phrase}' 대신 고유한 활동 산출물 명칭으로 구체화`,
            `문장 구조를 능동형 또는 행위 주체 중심으로 전환`
          ];
        }
      }

      duplicatePhrases.push({
        phrase,
        count,
        studentIds: Array.from(meta.studentIds),
        studentNames: Array.from(meta.studentNames),
        severity,
        replacementSuggestions,
      });
    }
  });

  // 빈도 높은 순 정렬
  duplicatePhrases.sort((a, b) => b.count - a.count || b.phrase.length - a.phrase.length);

  // 3. 고유 어휘 비율(TTR, Type-Token Ratio) 기반 다양성 점수 계산
  const uniqueTokenCount = new Set(totalTokens).size;
  const rawRatio = totalTokens.length > 0 ? (uniqueTokenCount / totalTokens.length) * 100 : 100;
  // 60% 이상이면 100점 만점 스케일링
  const diversityScore = Math.min(100, Math.round(rawRatio * 1.4));
  const highRiskCount = duplicatePhrases.filter((d) => d.severity === 'high').length;

  return {
    totalAnalyzed: activeStudents.length,
    duplicatePhrases: duplicatePhrases.slice(0, 20), // 상위 20개
    vocabularyDiversityScore: diversityScore,
    highRiskDuplicatesCount: highRiskCount,
  };
}
