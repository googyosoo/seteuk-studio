/**
 * NEIS(나이스) 표준 바이트 계산기
 * - 한글 완성형(가~힣) 및 한글 자모: 3바이트
 * - 영문, 숫자, 공백, 줄바꿈, 아스키 기호: 1바이트
 * - 과목별 세특 표준 한도: 1,500 Byte (한글 기준 약 500자)
 */

export interface ByteCountResult {
  bytes: number;
  chars: number;
  koreanCount: number;
  asciiCount: number;
  percent: number;
  isOverflow: boolean;
  statusText: string;
}

export const NEIS_MAX_BYTES = 1500;

export function countNeisBytes(text: string, maxBytes: number = NEIS_MAX_BYTES): ByteCountResult {
  if (!text) {
    return {
      bytes: 0,
      chars: 0,
      koreanCount: 0,
      asciiCount: 0,
      percent: 0,
      isOverflow: false,
      statusText: '0 / 1,500 Byte (0%)',
    };
  }

  let bytes = 0;
  let koreanCount = 0;
  let asciiCount = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // 한글 완성형 (AC00 ~ D7AF) 및 한글 자모 (1100 ~ 11FF, 3130 ~ 318F)
    if (
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x3130 && code <= 0x318f)
    ) {
      bytes += 3;
      koreanCount++;
    } else {
      bytes += 1;
      asciiCount++;
    }
  }

  const percent = Math.min(100, Math.round((bytes / maxBytes) * 100));
  const isOverflow = bytes > maxBytes;

  let statusText = `${bytes.toLocaleString()} / ${maxBytes.toLocaleString()} Byte (${percent}%)`;
  if (isOverflow) {
    statusText += ` ⚠️ ${bytes - maxBytes} Byte 초과!`;
  }

  return {
    bytes,
    chars: text.length,
    koreanCount,
    asciiCount,
    percent,
    isOverflow,
    statusText,
  };
}
