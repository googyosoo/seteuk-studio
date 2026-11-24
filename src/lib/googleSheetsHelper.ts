import * as XLSX from 'xlsx';
import { StudentRecord } from '../types';
import { inspectSeteuk } from './inspector';

/**
 * 구글 시트 URL에서 Sheet ID와 GID를 추출
 */
export function extractGoogleSheetId(url: string): { sheetId: string | null; gid: string | null } {
  if (!url) return { sheetId: null, gid: null };

  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : null;

  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  return { sheetId, gid };
}

/**
 * 구글 시트 공개 링크를 읽어서 학생 세특 목록으로 변환
 */
export async function fetchGoogleSheetData(url: string): Promise<StudentRecord[]> {
  const { sheetId, gid } = extractGoogleSheetId(url.trim());

  if (!sheetId) {
    throw new Error('올바른 구글 시트 링크(URL) 형식이 아닙니다. docs.google.com/spreadsheets/d/... 링크를 입력해 주세요.');
  }

  const gidParam = gid ? `&gid=${gid}` : '';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;

  let csvText = '';

  try {
    const res = await fetch(exportUrl);
    if (res.ok) {
      csvText = await res.text();
    } else {
      const gvizRes = await fetch(gvizUrl);
      if (gvizRes.ok) {
        csvText = await gvizRes.text();
      }
    }
  } catch (err) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        csvText = await proxyRes.text();
      }
    } catch (proxyErr) {
      console.warn('Proxy fetch failed:', proxyErr);
    }
  }

  if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
    throw new Error(
      '구글 시트에 접근할 수 없습니다. 시트 우측 상단 [공유] 버튼에서 "링크가 있는 모든 사용자에게 공개(보기 권한)"로 설정되어 있는지 확인해 주세요.'
    );
  }

  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (!jsonRows || jsonRows.length === 0) {
    throw new Error('구글 시트 내에 읽을 수 있는 데이터가 없습니다.');
  }

  return jsonRows.map((row, index) => {
    const studentNo = String(
      row['학번'] || row['번호'] || row['ID'] || row['순번'] || `101${String(index + 1).padStart(2, '0')}`
    );
    const name = String(row['이름'] || row['성명'] || row['학생명'] || `학생${index + 1}`);
    const email = String(
      row['이메일'] || row['Email'] || row['email'] || row['메일'] || row['학생이메일'] || `${studentNo}@school.hs.kr`
    );
    const subject = String(row['과목'] || row['교과'] || row['과목명'] || '영어');
    const context = String(
      row['수행평가맥락'] || row['수행평가'] || row['활동맥락'] || row['단원'] || row['활동명'] || '수업 탐구 활동'
    );
    const rawDraft = String(
      row['학생활동메모'] ||
      row['초안'] ||
      row['메모'] ||
      row['활동내용'] ||
      row['관찰기록'] ||
      row['산출물'] ||
      row['답변'] ||
      ''
    );
    const curriculumCode = row['성취기준코드'] || row['성취기준'] ? String(row['성취기준코드'] || row['성취기준']) : undefined;

    return {
      id: `gsheet-${Date.now()}-${index}`,
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
