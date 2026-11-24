import * as XLSX from 'xlsx';
import { StudentRecord } from '../types';
import { inspectSeteuk } from './inspector';

export function downloadSampleTemplate() {
  const sampleData = [
    {
      학번: '10101',
      이름: '김하늘',
      이메일: 'haneul101@school.hs.kr',
      과목: '공통영어1',
      수행평가맥락: '기후변화와 패스트패션 환경오염 TED식 3분 영어 스피치',
      학생활동메모: '패스트패션 산업의 수질오염 통계 자료를 스스로 찾아 제시함. 친환경 생분해 섬유 기술을 대안으로 제안하며 영문 대본을 작성하고 유창하게 발표함.',
      성취기준코드: '[10공영04-01]',
    },
    {
      학번: '10102',
      이름: '이준호',
      이메일: 'junho102@school.hs.kr',
      과목: '통합사회',
      수행평가맥락: '우리 지역 도시재생 및 사회적 약자 배려 모둠 프로젝트',
      학생활동메모: '노후 주거지 실태 사진을 직접 촬영하고 배리어프리 지도 제작을 제안함. 모둠장을 맡아 팀원들의 의견을 경청하고 최종 보고서를 도식화함.',
      성취기준코드: '[10통사04-03]',
    },
    {
      학번: '10103',
      이름: '박지민',
      이메일: 'jimin103@school.hs.kr',
      과목: '통합과학',
      수행평가맥락: '자연 모사 신소재 원리 탐구 및 미래 활용 발표',
      학생활동메모: '연잎 표면의 연꽃효과(나노 돌기 구조)를 현미경으로 관찰하고 자가세정 페인트 적용 사례를 보고서로 정리함. 질문에 성실히 답변함.',
      성취기준코드: '[10통과01-03]',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 10 }, // 학번
    { wch: 12 }, // 이름
    { wch: 24 }, // 이메일
    { wch: 15 }, // 과목
    { wch: 35 }, // 수행평가맥락
    { wch: 50 }, // 학생활동메모
    { wch: 18 }, // 성취기준코드
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '학생수행평가_입력양식');
  XLSX.writeFile(workbook, '세특고도화_입력양식.xlsx');
}

export async function parseExcelFile(file: File): Promise<Partial<StudentRecord>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

  return jsonRows.map((row, index) => {
    const studentNo = String(row['학번'] || row['번호'] || row['ID'] || `101${String(index + 1).padStart(2, '0')}`);
    const name = String(row['이름'] || row['성명'] || `학생${index + 1}`);
    const email = String(row['이메일'] || row['Email'] || row['email'] || `${studentNo}@school.hs.kr`);
    const subject = String(row['과목'] || row['교과'] || '공통교과');
    const context = String(row['수행평가맥락'] || row['수행평가'] || row['활동맥락'] || '수업 탐구 활동');
    const rawDraft = String(row['학생활동메모'] || row['초안'] || row['메모'] || row['활동내용'] || '');
    const curriculumCode = row['성취기준코드'] ? String(row['성취기준코드']) : undefined;

    return {
      id: `student-${Date.now()}-${index}`,
      studentNo,
      name,
      email,
      subject,
      context,
      rawDraft,
      curriculumCode,
      enrichedDraft: '',
      byteCount: 0,
      charCount: 0,
      status: 'idle',
      inspection: inspectSeteuk(''),
      selectedForBatch: true,
    };
  });
}

export function exportResultsToExcel(records: StudentRecord[]) {
  const exportRows = records.map((r) => {
    const prohibitedSummary = r.inspection.items
      .filter((i) => i.category === '기재금지')
      .map((i) => i.matchText)
      .join(', ');

    return {
      학번: r.studentNo,
      이름: r.name,
      이메일: r.email || '',
      과목: r.subject,
      수행평가맥락: r.context,
      성취기준코드: r.curriculumCode || '',
      원문메모: r.rawDraft,
      고도화세특_최종: r.enrichedDraft || '미생성',
      NEIS_바이트수: r.byteCount,
      바이트_초과여부: r.inspection.isByteOverflow ? '초과(경고)' : '정상',
      기재금지_감지: prohibitedSummary ? `위반(${prohibitedSummary})` : '안전',
      서식_상태: r.inspection.hasFormatIssue ? '점검필요' : '양호',
      최종_검토: r.enrichedDraft ? '완료' : '대기',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  worksheet['!cols'] = [
    { wch: 10 }, // 학번
    { wch: 12 }, // 이름
    { wch: 24 }, // 이메일
    { wch: 14 }, // 과목
    { wch: 25 }, // 맥락
    { wch: 16 }, // 성취기준
    { wch: 30 }, // 원문
    { wch: 60 }, // 고도화세특
    { wch: 14 }, // 바이트수
    { wch: 14 }, // 초과여부
    { wch: 16 }, // 기재금지
    { wch: 12 }, // 서식상태
    { wch: 10 }, // 최종검토
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '세특_고도화_결과');
  XLSX.writeFile(workbook, `세특_고도화_결과_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportResultsToCsv(records: StudentRecord[]) {
  const exportRows = records.map((r) => {
    const prohibitedSummary = r.inspection.items
      .filter((i) => i.category === '기재금지')
      .map((i) => i.matchText)
      .join(', ');

    return {
      학번: r.studentNo,
      이름: r.name,
      이메일: r.email || '',
      과목: r.subject,
      수행평가맥락: r.context,
      성취기준코드: r.curriculumCode || '',
      원문메모: r.rawDraft,
      고도화세특_최종: r.enrichedDraft || '미생성',
      NEIS_바이트수: r.byteCount,
      바이트_초과여부: r.inspection.isByteOverflow ? '초과(경고)' : '정상',
      기재금지_감지: prohibitedSummary ? `위반(${prohibitedSummary})` : '안전',
      서식_상태: r.inspection.hasFormatIssue ? '점검필요' : '양호',
      최종_검토: r.enrichedDraft ? '완료' : '대기',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `세특_고도화_결과_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
