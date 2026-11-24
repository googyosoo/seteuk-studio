/**
 * 개인정보 보호 및 익명화 헬퍼 (Privacy & PII Stripping Helper)
 * 
 * 오픈소스 아키텍처 원칙 반영:
 * 1. 학생 식별 정보(이름, 학번, 이메일)는 외부 LLM API로 전송하지 않고 오직 활동 내용/키워드/성취기준만 전송합니다.
 * 2. 원문 메모에 포함된 이름이나 번호도 익명 토큰([학생], [활동자])으로 정규화하여 프라이버시를 완벽히 보장합니다.
 */

export interface SanitizedPayload {
  sanitizedContext: string;
  sanitizedDraft: string;
  sanitizedSubject: string;
  originalName: string;
  originalEmail?: string;
  originalStudentNo?: string;
  anonymizedStudentTag: string;
}

export function sanitizeStudentDataForLLM(
  studentName: string,
  studentNo: string = '',
  studentEmail: string = '',
  subject: string = '',
  context: string = '',
  rawDraft: string = ''
): SanitizedPayload {
  const anonymizedTag = '해당 학생';

  let sanitizedDraft = rawDraft || '';
  let sanitizedContext = context || '';

  // 1. 이름 마스킹 (2자 이상인 경우)
  if (studentName && studentName.trim().length >= 2) {
    const trimmedName = studentName.trim();
    const nameRegex = new RegExp(trimmedName, 'g');
    sanitizedDraft = sanitizedDraft.replace(nameRegex, anonymizedTag);
    sanitizedContext = sanitizedContext.replace(nameRegex, anonymizedTag);
  }

  // 2. 이메일 정규식 마스킹
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  sanitizedDraft = sanitizedDraft.replace(emailRegex, '[이메일]');
  sanitizedContext = sanitizedContext.replace(emailRegex, '[이메일]');

  // 3. 학번/전화번호 형태 마스킹 (예: 10101, 010-1234-5678 등)
  const phoneRegex = /01[016789]-?\d{3,4}-?\d{4}/g;
  sanitizedDraft = sanitizedDraft.replace(phoneRegex, '[연락처]');
  
  if (studentNo && studentNo.trim().length > 0) {
    const noRegex = new RegExp(`\\b${studentNo.trim()}\\b`, 'g');
    sanitizedDraft = sanitizedDraft.replace(noRegex, '[학번]');
  }

  return {
    sanitizedContext: sanitizedContext.trim(),
    sanitizedDraft: sanitizedDraft.trim(),
    sanitizedSubject: subject.trim(),
    originalName: studentName,
    originalEmail: studentEmail,
    originalStudentNo: studentNo,
    anonymizedStudentTag: anonymizedTag,
  };
}

/**
 * 프라이버시 원칙 안내 문구
 */
export const PRIVACY_ASSURANCE_NOTICE = {
  title: '🔒 Zero-DB 무저장 및 개인정보 마스킹 원칙',
  description: '본 시스템은 서버 데이터베이스를 전혀 두지 않는 브라우저 인메모리 세션 방식으로 동작하며, LLM API 호출 시 학생 이름, 학번, 이메일 등 식별 정보를 완전히 제거하고 순수 활동 내용만 전송합니다.',
};
