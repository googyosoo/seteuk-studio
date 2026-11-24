import { StudentRecord } from '../types';
import { inspectSeteuk } from './inspector';

export const SAMPLE_STUDENTS: StudentRecord[] = [
  {
    id: 'sample-1',
    studentNo: '10101',
    name: '김하늘',
    email: 'sky101@school.hs.kr',
    subject: '공통영어1',
    context: '기후변화와 패스트패션 환경오염 TED식 3분 영어 스피치',
    curriculumCode: '[10공영04-01]',
    rawDraft: '패스트패션 산업이 매년 유발하는 막대한 수질오염과 탄소 배출량 통계를 다각도로 조사함. 생분해성 섬유 신기술을 대안으로 제안하는 영어 발표 대본을 주도적으로 구성하고, 모둠원들과의 모의 발표를 거쳐 전달력 높은 제스처와 명확한 억양으로 스피치를 성공적으로 완수함.',
    enrichedDraft: "[10공영04-01] '기후변화와 패스트패션 환경오염 TED식 3분 영어 스피치' 활동에서 패스트패션 산업의 환경 파괴 실태에 문제의식을 갖고 글로벌 통계 자료와 환경 보고서를 주도적으로 분석함. 합성섬유 생산 과정에서 발생하는 수질오염 및 탄소 배출 데이터를 논리적으로 구조화하여 생분해성 섬유 기술을 대안으로 제안하는 영문 발표 대본을 완성함. 모둠 협력 과정에서 동료들의 발음과 전달력을 점검하며 상호 피드백을 제공하였으며, 실제 발표 시 시각 자료와 핵심 통계를 효과적으로 결합하여 설득력 있는 스피치를 선보임. 환경 윤리와 현대 소비 문화의 연관성을 깊이 있게 고찰하며 글로벌 시민으로서의 비판적 사고력과 실천적 의지를 발휘함.",
    byteCount: 818,
    charCount: 298,
    status: 'done',
    selectedForBatch: true,
    diversityAngle: '비판적 쟁점 분석 및 글로벌 대안 모델링형',
    inspection: inspectSeteuk(
      "[10공영04-01] '기후변화와 패스트패션 환경오염 TED식 3분 영어 스피치' 활동에서 패스트패션 산업의 환경 파괴 실태에 문제의식을 갖고 글로벌 통계 자료와 환경 보고서를 주도적으로 분석함. 합성섬유 생산 과정에서 발생하는 수질오염 및 탄소 배출 데이터를 논리적으로 구조화하여 생분해성 섬유 기술을 대안으로 제안하는 영문 발표 대본을 완성함. 모둠 협력 과정에서 동료들의 발음과 전달력을 점검하며 상호 피드백을 제공하였으며, 실제 발표 시 시각 자료와 핵심 통계를 효과적으로 결합하여 설득력 있는 스피치를 선보임. 환경 윤리와 현대 소비 문화의 연관성을 깊이 있게 고찰하며 글로벌 시민으로서의 비판적 사고력과 실천적 의지를 발휘함."
    ),
  },
  {
    id: 'sample-2',
    studentNo: '10102',
    name: '이지우',
    email: 'jiwoo102@school.hs.kr',
    subject: '영어I',
    context: '인공지능 윤리와 저작권 분쟁 심층 에세이 작성',
    curriculumCode: '[12영I03-03]',
    rawDraft: '토익 900점 수준의 실력을 바탕으로 전국청소년영어대회 수상 실적이 있음. 생성형 AI가 학습 데이터 저작권을 침해하는 법적 쟁점을 조사하고 아버지가 변호사인 배경을 살려 논거를 정리함.',
    enrichedDraft: '토익 900점 수준의 유창한 영작 실력으로 생성형 AI 학습 데이터 저작권 쟁점을 탐구함. 전국청소년영어대회 수상 경험과 아버지가 변호사인 배경을 참고하여 법적 판례를 조사하고 영문 에세이를 작성했다.',
    byteCount: 292,
    charCount: 110,
    status: 'done',
    selectedForBatch: true,
    diversityAngle: '법적 판례 대조 및 논증 구조화형',
    inspection: inspectSeteuk(
      '토익 900점 수준의 유창한 영작 실력으로 생성형 AI 학습 데이터 저작권 쟁점을 탐구함. 전국청소년영어대회 수상 경험과 아버지가 변호사인 배경을 참고하여 법적 판례를 조사하고 영문 에세이를 작성했다.'
    ),
  },
  {
    id: 'sample-3',
    studentNo: '10103',
    name: '박민준',
    email: 'minjun103@school.hs.kr',
    subject: '통합과학',
    context: '자연 모사 신소재 원리 탐구 및 미래 활용 발표',
    curriculumCode: '[10통과01-03]',
    rawDraft: '이 학생은 연잎 효과와 게코도마뱀 발바닥을 조사했다. 탄소·나노·튜브 신소재의 장단점을 친구들에게 "미래의 핵심 기술"이라고 발표했다. 과학에 대한 열정이 매우 우수함.',
    enrichedDraft: '이 학생은 연잎 표면의 연꽃효과와 게코도마뱀 발바닥 미세섬모 구조를 조사했다. 탄소·나노·튜브 신소재의 구조적 특성을 친구들에게 "미래의 혁신 기술"이라고 발표했다. 과학에 대한 열정이 매우 우수함.',
    byteCount: 299,
    charCount: 113,
    status: 'done',
    selectedForBatch: true,
    diversityAngle: '자연 원리 관찰 및 공학적 응용형',
    inspection: inspectSeteuk(
      '이 학생은 연잎 표면의 연꽃효과와 게코도마뱀 발바닥 미세섬모 구조를 조사했다. 탄소·나노·튜브 신소재의 구조적 특성을 친구들에게 "미래의 혁신 기술"이라고 발표했다. 과학에 대한 열정이 매우 우수함.'
    ),
  },
  {
    id: 'sample-4',
    studentNo: '10104',
    name: '정수진',
    email: 'sujin104@school.hs.kr',
    subject: '통합사회',
    context: '우리 지역 노후 주거지 도시재생과 배리어프리 모둠 프로젝트',
    curriculumCode: '[10통사04-03]',
    rawDraft: '학교 주변 구도심 보행로의 턱과 경사로 실태를 직접 걸으며 현장 조사함. 휠체어 이용자를 위한 개선 지도를 도식화하고 지자체 건의안을 작성함.',
    enrichedDraft: '',
    byteCount: 0,
    charCount: 0,
    status: 'idle',
    selectedForBatch: true,
    diversityAngle: '현장 실태 조사 및 정책 제안형',
    inspection: inspectSeteuk(''),
  },
];
