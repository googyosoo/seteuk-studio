import { InspectionItem } from '../types';

export interface ProhibitedCategory {
  category: string;
  description: string;
  keywords: string[];
  suggestion: string;
}

export const PROHIBITED_DATABASE: ProhibitedCategory[] = [
  {
    category: '논문/학술지',
    description: '논문 투고·등재·발표 사실 기재 절대 금지',
    keywords: ['논문', '소논문', '학회지', '저널에 발표', '학술지 게재', 'R&E 논문'],
    suggestion: '논문 명칭 대신 교내 탐구활동, 프로젝트 보고서, 심층 탐구 산출물로 대체 서술하세요.',
  },
  {
    category: '도서출간',
    description: '학생 개인 저서 출간 사실 기재 금지',
    keywords: ['출간함', '저서를 발간', '책을 출판', '단행본을 출간', '출판 등록'],
    suggestion: '출간 사실 대신 교내 발표자료 또는 학급 문집/탐구 산출물 제작으로 서술하세요.',
  },
  {
    category: '지식재산권',
    description: '특허·실용신안·디자인 출원 또는 등록 사실 기재 금지',
    keywords: ['특허 출원', '특허 등록', '실용신안', '지식재산권', '디자인권 출원'],
    suggestion: '특허 출원 대신 창의적인 아이디어 도출 및 모형/프로토타입 설계 과정으로 변경하세요.',
  },
  {
    category: '공인인증시험',
    description: '교내외 공인인증시험(어학, 한자, 컴퓨터 등) 점수/등급/참여 사실 기재 금지',
    keywords: [
      '토익', 'TOEIC', '토플', 'TOEFL', '텝스', 'TEPS', '오픽', 'OPIC', 'opic',
      '토익스피킹', '한자능력검정', '컴활', '컴퓨터활용능력', '정보처리기사', '어학인증', '인증시험', 'HSK', 'JLPT'
    ],
    suggestion: '공인시험 점수 대신 수업 내 말하기/쓰기/자료 분석 역량으로 환원하여 서술하세요.',
  },
  {
    category: '모의고사 성적',
    description: '전국연합학력평가/모의고사 성적, 등급, 백분위 기재 금지',
    keywords: ['모의고사 등급', '모의고사 점수', '전국연합학력평가', '모의고사 성적', '수능 등급', '백분위 1등급', '학력평가 점수'],
    suggestion: '모의고사 성적 대신 수업 중 지문 독해력, 개념 이해도, 문제 해결 과정으로 서술하세요.',
  },
  {
    category: '교외 대회/수상',
    description: '교외 대회 참가 사실 및 수상 실적 일체 기재 금지',
    keywords: [
      '대회 참가', '대회 수상', '상 수상', '전국대회', '교육청 주최 대회',
      '경진대회 수상', '공모전 수상', '최우수상 수상', '금상 수상', '장려상 수상',
      '올림피아드', '교외대회', '경시대회', '은상 수상', '동상 수상', '대상 수상'
    ],
    suggestion: '수상 결과 대신 해당 과제를 수업 중 스스로 탐구하고 교실에서 공유한 배움 과정으로 서술하세요.',
  },
  {
    category: '해외활동',
    description: '해외 어학연수, 해외 봉사활동, 교환학생 등 기재 금지',
    keywords: ['해외연수', '해외봉사', '교환학생', '어학연수', '해외캠프'],
    suggestion: '해외 활동 대신 학교 교육과정 내 다문화 이해 및 국제 이슈 탐구 활동으로 서술하세요.',
  },
  {
    category: '부모/가족 배경',
    description: '부모 및 친인척의 사회·경제적 지위 암시 내용 기재 금지',
    keywords: [
      '아버지가', '어머니가', '부모님 직업', '집안 형편', '가정 형편',
      '의사인 아버지', '교수인 부모님', '변호사 부모', '부모님의 직장',
      '교수이신', '의사이신', '변호사이신', '법조인이신', '연구원이신'
    ],
    suggestion: '가족 배경 언급은 즉시 삭제하고 학생 본인의 학업적 탐구 계기로만 시작하세요.',
  },
  {
    category: '장학 관련',
    description: '장학생 선발 사실 및 장학금 수혜 사실 기재 금지',
    keywords: ['장학생', '장학금'],
    suggestion: '장학금 관련 언급은 삭제하고 학교 수업에서의 성실성과 협력 태도로 대체하세요.',
  },
  {
    category: '특정 기관/대학명',
    description: '사교육 학원명, 특정 대학교명, 영재교육원 등 외부 기관 명칭 기재 금지',
    keywords: [
      '학원', '메가스터디', '이투스', '대성마이맥', '스카이에듀',
      '서울대', '연세대', '고려대', 'KAIST', '카이스트', '포항공대', '하버드', 'MIT', '옥스퍼드',
      '영재교육원', '영재원'
    ],
    suggestion: '특정 대학명이나 사설 기관 명칭 대신 공교육 학교 수업 및 교과 심화 탐구 과정으로 변경하세요.',
  },
  {
    category: '상용 플랫폼/브랜드',
    description: '유튜브, ChatGPT 등 특정 상용 플랫폼 및 상표 브랜드명 기재 지양',
    keywords: ['유튜브', 'YouTube', 'ChatGPT', '챗GPT', '파파고', '구글 검색', '네이버 지식인'],
    suggestion: '특정 상용 플랫폼 브랜드명 대신 동영상 매체, 생성형 AI 도구, 검색 엔진 등 일반 명사로 순화하세요.',
  },
  {
    category: '자격증',
    description: '국가기술자격 외 민간/교외 자격증 취득 사실 기재 금지',
    keywords: ['자격증 취득', '자격증을 취득', '인증 획득', '민간자격증'],
    suggestion: '자격증 명칭 대신 관련 전공 분야의 기본 소양과 실습 숙련도로 서술하세요.',
  },
];

export function checkProhibitedItems(text: string): InspectionItem[] {
  if (!text) return [];
  const results: InspectionItem[] = [];

  PROHIBITED_DATABASE.forEach((item, catIdx) => {
    item.keywords.forEach((kw) => {
      if (text.includes(kw)) {
        results.push({
          id: `prohibited-${catIdx}-${kw}`,
          type: 'danger',
          category: '기재금지',
          title: `[절대 기재금지] ${item.category} 감지: '${kw}'`,
          message: `${item.description}. 학교생활기록부 기재요령 위반 소지가 있습니다.`,
          matchText: kw,
          suggestion: item.suggestion,
          autoFixable: false,
        });
      }
    });
  });

  return results;
}
