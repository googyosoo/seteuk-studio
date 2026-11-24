import { InspectionItem } from '../types';

export function splitSentences(text: string): string[] {
  if (!text) return [];
  // 마침표/느낌표/물음표 뒤 줄바꿈 또는 공백으로 분리
  const parts = text.split(/(?<=[.!?])\s*\n|(?<=[.!?])\s+/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// 서술형 종결어미 패턴 (~했다, ~한다, ~합니다, ~하였다, ~이다 등)
const INVALID_VERB_ENDINGS = [
  /했다\.?$/,
  /한다\.?$/,
  /합니다\.?$/,
  /하였다\.?$/,
  /이다\.?$/,
  /습니다\.?$/,
  /됨\.?$/, // '됨' 단독보다는 '확인됨', '완성함' 등으로 구체화
];

// 주어 반복 패턴
const SUBJECT_PATTERNS = [
  /^(이\s*학생은|본\s*학생은|위\s*학생은|해당\s*학생은)/,
  /\s+(이\s*학생은|본\s*학생은|위\s*학생은)\s+/,
];

export function checkFormatRules(text: string): InspectionItem[] {
  if (!text) return [];
  const results: InspectionItem[] = [];

  const sentences = splitSentences(text);

  // 1. 명사형 종결어미 검사
  sentences.forEach((sentence, idx) => {
    for (const pattern of INVALID_VERB_ENDINGS) {
      if (pattern.test(sentence)) {
        const match = sentence.slice(-8);
        results.push({
          id: `format-ending-${idx}`,
          type: 'warning',
          category: '서식규정',
          title: `명사형 종결어미 미준수 문장 감지`,
          message: `문장 끝이 '~다'로 끝납니다: "...${match}". 세특은 명사형 종결(~함, ~임, ~음, ~보임)이 규정입니다.`,
          matchText: match,
          suggestion: `'~함', '~임', '~보임', '~도출함' 등 명사형 종결어미로 변경하세요.`,
          autoFixable: true,
        });
        break;
      }
    }
  });

  // 2. 주어 반복 검사 (주어 생략 원칙)
  SUBJECT_PATTERNS.forEach((pattern, pIdx) => {
    if (pattern.test(text)) {
      results.push({
        id: `format-subject-${pIdx}`,
        type: 'warning',
        category: '서식규정',
        title: `불필요한 주어 반복 감지 ('이 학생은' 등)`,
        message: `세특은 학생 주어를 생략하고 바로 관찰된 활동 및 사고 과정으로 서술하는 것이 규정입니다.`,
        matchText: '이 학생은 / 본 학생은',
        suggestion: `문장 첫머리의 주어('이 학생은', 'OOO는')를 생략하세요.`,
        autoFixable: true,
      });
    }
  });

  // 3. 가운데점(·) 사용 검사
  const middleDotCount = (text.match(/·/g) || []).length;
  if (middleDotCount > 0) {
    results.push({
      id: 'format-middle-dot',
      type: 'warning',
      category: '서식규정',
      title: `가운데점(·) ${middleDotCount}회 사용 감지`,
      message: `나이스(NEIS) 시스템에서 가운데점(·)은 글자 깨짐 및 규정 지양 기호입니다.`,
      matchText: '·',
      suggestion: `쉼표(,) 또는 '와/과', '및'으로 치환하세요.`,
      autoFixable: true,
    });
  }

  // 4. 이중 인용부호(큰따옴표) 검사
  const dquoteCount = (text.match(/["“”]/g) || []).length;
  if (dquoteCount > 0) {
    results.push({
      id: 'format-dquote',
      type: 'info',
      category: '서식규정',
      title: `큰따옴표/이중 인용부호 사용 발견`,
      message: `인용 및 강조는 작은따옴표(' ')로 통일하는 것이 권장됩니다.`,
      matchText: '"',
      suggestion: `큰따옴표 대신 작은따옴표(')로 변경하세요.`,
      autoFixable: true,
    });
  }

  // 5. 줄바꿈(엔터) 검사 (세특은 단일 문단 규정)
  if (text.includes('\n')) {
    results.push({
      id: 'format-newline',
      type: 'warning',
      category: '서식규정',
      title: `줄바꿈(엔터) 감지`,
      message: `과목 세특은 문단을 나누지 않고 하나의 단일 문단으로 이어 쓰는 것이 표준입니다.`,
      matchText: '\\n',
      suggestion: `줄바꿈을 제거하고 한 문단으로 연결하세요.`,
      autoFixable: true,
    });
  }

  return results;
}

export function autoFixFormatIssues(text: string): string {
  let fixed = text;

  // 가운데점 -> 쉼표
  fixed = fixed.replace(/·/g, ', ');

  // 큰따옴표 -> 작은따옴표
  fixed = fixed.replace(/["“”]/g, "'");

  // 불필요한 주어 생략
  fixed = fixed.replace(/(^|\n|\.\s+)(이\s*학생은|본\s*학생은|위\s*학생은)\s+/g, '$1');

  // 줄바꿈 제거 (공백 1개로 연결)
  fixed = fixed.replace(/\r?\n\s*/g, ' ');

  // 명사형 어미 일부 단순 치환
  fixed = fixed.replace(/하였다\./g, '함.');
  fixed = fixed.replace(/했다\./g, '함.');
  fixed = fixed.replace(/한다\./g, '함.');
  fixed = fixed.replace(/이다\./g, '임.');
  fixed = fixed.replace(/보였다\./g, '보임.');

  return fixed.trim();
}
