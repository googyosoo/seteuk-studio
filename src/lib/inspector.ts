import { InspectionResult, InspectionItem } from '../types';
import { countNeisBytes, NEIS_MAX_BYTES } from './byteCounter';
import { checkProhibitedItems } from './prohibitedRules';
import { checkFormatRules } from './formatRules';
import { checkObserverRisk } from './observerRisk';
import { checkHumanizerRules } from './humanizerRules';
import { analyzeEnglishSkills, auditHumanizeSetek } from './englishSkillsHelper';

export function inspectSeteuk(text: string, maxBytes: number = NEIS_MAX_BYTES): InspectionResult {
  const byteRes = countNeisBytes(text, maxBytes);
  const prohibitedItems = checkProhibitedItems(text);
  const formatItems = checkFormatRules(text);
  const observerItems = checkObserverRisk(text);
  const humanizerItems = checkHumanizerRules(text);
  const { audit: humanizeAudit, items: humanizeSkillItems } = auditHumanizeSetek(text);
  const skillAudit = analyzeEnglishSkills(text);

  const items: InspectionItem[] = [
    ...prohibitedItems,
    ...formatItems,
    ...observerItems,
    ...humanizerItems,
    ...humanizeSkillItems,
  ];

  if (byteRes.isOverflow) {
    items.unshift({
      id: 'byte-overflow',
      type: 'danger',
      category: '바이트초과',
      title: `NEIS 바이트 초과 (${byteRes.bytes} / ${maxBytes} Byte)`,
      message: `허용 기준 ${maxBytes}Byte를 ${byteRes.bytes - maxBytes}Byte 초과했습니다. 나이스 입력 시 뒷부분이 잘릴 수 있습니다.`,
      matchText: `${byteRes.bytes} Byte`,
      suggestion: '글을 1,500Byte 이내로 압축하거나 핵심 활동 위주로 간결화하세요.',
      autoFixable: false,
    });
  }

  // 4기능 누락 알림 (영어 세특 작성 시 권장: 최소 2개 기능 언급)
  if (text.trim().length > 50 && skillAudit.detectedSkillsCount < 2) {
    items.push({
      id: 'skill-audit-sparse',
      type: 'info',
      category: '영어과4기능',
      title: `영어 4기능 언급 권장 (현재 ${skillAudit.detectedSkillsCount}개 감지)`,
      message: `2022 개정 영어과 세특은 듣기·말하기·읽기·쓰기 중 최소 2개 이상의 수행 과정과 산출물이 명시될 때 변별력이 극대화됩니다.`,
      suggestion: `말하기(발표, 질의응답) 또는 쓰기(영작 에세이, 대본) 중 1가지를 추가 서술하세요.`,
      autoFixable: false,
    });
  }

  return {
    hasProhibited: prohibitedItems.length > 0,
    hasFormatIssue: formatItems.length > 0,
    hasObserverRisk: observerItems.length > 0,
    hasAITrace: humanizerItems.length > 0 || !humanizeAudit.isNatural,
    isByteOverflow: byteRes.isOverflow,
    byteCount: byteRes.bytes,
    maxBytes,
    items,
    skillAudit,
    humanizeAudit,
  };
}
