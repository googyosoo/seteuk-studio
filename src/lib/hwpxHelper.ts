import JSZip from 'jszip';
import { StudentRecord } from '../types';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * HWPX 표준 형식으로 교과 세부능력 및 특기사항 기록부 생성 및 다운로드
 */
export async function exportResultsToHwpx(
  students: StudentRecord[],
  meta?: { title?: string; schoolYear?: string; subject?: string }
): Promise<void> {
  const zip = new JSZip();

  // 1. mimetype (압축하지 않는 비압축 파일)
  zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container">
  <ocf:rootfiles>
    <ocf:rootfile ocf:full-path="Contents/content.hpf" ocf:media-type="application/hwp+zip"/>
  </ocf:rootfiles>
</ocf:container>`;
  zip.folder('META-INF')!.file('container.xml', containerXml);

  // 3. Contents/content.hpf (패키지 정보)
  const contentHpf = `<?xml version="1.0" encoding="UTF-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0" unique-identifier="hwpx-doc">
  <opf:metadata>
    <opf:title>${escapeXml(meta?.title || '학교생활기록부 교과 세부능력 및 특기사항 기록부')}</opf:title>
    <opf:language>ko</opf:language>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="header"/>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`;
  zip.folder('Contents')!.file('content.hpf', contentHpf);

  // 4. Contents/header.xml (글꼴 및 스타일)
  const headerXml = `<?xml version="1.0" encoding="UTF-8"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" version="1.0">
  <hh:fontfaces itemCnt="1">
    <hh:fontface lang="ko" fontCnt="1">
      <hh:font id="0" face="맑은 고딕" type="TTF"/>
    </hh:fontface>
  </hh:fontfaces>
  <hh:borderFills itemCnt="1">
    <hh:borderFill id="1">
      <hh:slash type="NONE"/>
      <hh:backSlash type="NONE"/>
      <hh:leftBorder type="SOLID" width="0.12 mm" color="#000000"/>
      <hh:rightBorder type="SOLID" width="0.12 mm" color="#000000"/>
      <hh:topBorder type="SOLID" width="0.12 mm" color="#000000"/>
      <hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/>
    </hh:borderFill>
  </hh:borderFills>
</hh:head>`;
  zip.folder('Contents')!.file('header.xml', headerXml);

  // 5. Contents/section0.xml (본문 표 데이터 생성)
  const now = new Date();
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  const rowsXml = students
    .map((s, idx) => {
      const studentNo = escapeXml(s.studentNo || `${idx + 1}`);
      const studentName = escapeXml(s.name);
      const subject = escapeXml(s.subject);
      const code = escapeXml(s.curriculumCode || '-');
      const text = escapeXml(s.enrichedDraft || s.rawDraft || '미작성');
      const bytes = `${s.byteCount || 0} Byte`;

      return `
      <hp:tr>
        <hp:tc><hp:p><hp:t>${studentNo}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>${studentName}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>${subject}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>${code}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>${text}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>${bytes}</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p><hp:t>확인</hp:t></hp:p></hp:tc>
      </hp:tr>`;
    })
    .join('');

  const section0Xml = `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:p align="CENTER">
    <hp:run>
      <hp:secPr/>
      <hp:t font="HY헤드라인M" bold="true" size="18 pt">[2026학년도] 교과 세부능력 및 특기사항 기록부</hp:t>
    </hp:run>
  </hp:p>
  <hp:p align="RIGHT">
    <hp:t size="10 pt">출력일자: ${dateStr} / 총 ${students.length}명 / NEIS 기재요령 표준</hp:t>
  </hp:p>
  <hp:p/>
  <hp:p>
    <hp:tbl rowCnt="${students.length + 1}" colCnt="7" borderFillIDRef="1">
      <hp:tr>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">학번</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">성명</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">교과목</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">성취기준코드</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">교과 세부능력 및 특기사항 (NEIS 기재용)</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">바이트수</hp:t></hp:p></hp:tc>
        <hp:tc><hp:p align="CENTER"><hp:t bold="true">교사확인</hp:t></hp:p></hp:tc>
      </hp:tr>
      ${rowsXml}
    </hp:tbl>
  </hp:p>
</hs:sec>`;

  zip.folder('Contents')!.file('section0.xml', section0Xml);

  // 6. 브라우저에서 다운로드 실행
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/hwp+zip' });
  const filename = `세특_고도화_기록부_${now.toISOString().slice(0, 10)}.hwpx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
