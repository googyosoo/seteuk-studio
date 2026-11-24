import { GenerationMode, Level, Paraphrase90Group, Paraphrase90Item, TeacherStyleOptions } from '../types';
import { autoFixFormatIssues } from './formatRules';
import { sanitizeStudentDataForLLM } from './privacyHelper';

export type LLMProvider = 'upstage' | 'claude' | 'gemini' | 'openai';

export interface GenerateOptions {
  apiKey?: string;
  model?: string;
  provider?: LLMProvider;
  studentName: string;
  studentNo?: string;
  studentEmail?: string;
  subject: string;
  context: string;
  rawDraft: string;
  curriculumCode?: string;
  curriculumDesc?: string;
  curriculumActivities?: string[];
  styleOptions?: TeacherStyleOptions;
  mode: GenerationMode;
  targetLevel?: Level;
  targetBytes?: number;
  diversityIndex?: number; // 학생별 다양화 인덱스 (0~7)
}

export interface GenerateResult {
  enrichedText: string;
  levelVariations?: {
    high: string;
    mid: string;
    low: string;
  };
  paraphrasedVariations?: string[];
  paraphrase90?: Paraphrase90Group;
  isMock: boolean;
  providerUsed?: string;
  diversityAngle?: string;
  isDraft: boolean; // 오픈소스 철학: 결과는 교사 검토용 초안임
  sanitized: boolean; // 개인정보 마스킹 전송 여부
}

// 8가지 학생별 다양화 서사 관점 (반 전체 학생 간 문구 획일화 방지)
export const DIVERSITY_ANGLES = [
  '비판적 쟁점 분석 & 학술 텍스트 구조화형',
  '실증적 데이터 대조 & 인과관계 규명형',
  '창의적 대안 설계 & 문제해결 모델링형',
  '동료 협력 토의 & 피드백 수렴 발전형',
  '실생활 융합 & 사회적 파급효과 고찰형',
  '학습전략 수정 & 메타인지적 도약형',
  '다각적 관점 비교 & 맥락적 수용형',
  '문제 정의 & 질문 중심 심화 탐구형',
];

export const DEFAULT_UPSTAGE_KEY = '';

export async function generateSeteukAdvanced(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = (options.apiKey && options.apiKey.trim().length > 5)
    ? options.apiKey.trim()
    : '';

  // Provider detection
  let provider: LLMProvider = options.provider || 'gemini';
  if (apiKey.startsWith('sk-ant-')) {
    provider = 'claude';
  } else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-ant-')) {
    provider = 'openai';
  } else if (apiKey.startsWith('AIza')) {
    provider = 'gemini';
  } else if (apiKey.startsWith('up_')) {
    provider = 'upstage';
  }

  // 1. Anthropic Claude API
  if (provider === 'claude') {
    try {
      return await callClaudeApi({ ...options, apiKey });
    } catch (err: any) {
      console.warn('Claude API call failed, trying fallback or simulator:', err);
    }
  }

  // 2. Upstage Solar API
  if (provider === 'upstage') {
    try {
      if (options.mode === 'paraphrase90') {
        return await callUpstageSolarFor90Paraphrase({ ...options, apiKey });
      }
      return await callUpstageSolarApi({ ...options, apiKey });
    } catch (err: any) {
      console.warn('Upstage Solar API call failed, falling back to smart simulation:', err);
    }
  }

  // 3. Google Gemini API
  if (provider === 'gemini') {
    try {
      return await callGeminiApi({ ...options, apiKey });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to smart simulation:', err);
    }
  }

  // 4. OpenAI API
  if (provider === 'openai') {
    try {
      return await callOpenAIApi({ ...options, apiKey });
    } catch (err: any) {
      console.warn('OpenAI API call failed, falling back to smart simulation:', err);
    }
  }

  // Fallback simulator
  if (options.mode === 'paraphrase90') {
    return simulate90Paraphrase(options);
  }
  return simulateAdvancedGeneration(options);
}

/**
 * 프롬프트 빌더 (개인정보 완벽 마스킹 + 4층 서사 + NEIS 룰)
 */
function buildPromptPayload(options: GenerateOptions) {
  const { studentName, studentNo, studentEmail, subject, context, rawDraft, curriculumCode, curriculumDesc, curriculumActivities, styleOptions, mode, diversityIndex = 0 } = options;

  // 개인정보 식별자 완벽 제거 (PII Stripping)
  const sanitized = sanitizeStudentDataForLLM(studentName, studentNo, studentEmail, subject, context, rawDraft);
  const selectedAngle = DIVERSITY_ANGLES[diversityIndex % DIVERSITY_ANGLES.length];

  // 교사 스타일 지침
  const pacingGuide = styleOptions?.pacing === 'concise'
    ? '간결하고 명료한 단문 위주로 군더더기 없이 핵심 역량과 사실 관계를 압축 서술'
    : styleOptions?.pacing === 'deep'
    ? '정교하고 풍부한 학술 어휘와 복합 문장 구조를 활용하여 심도 있는 탐구 과정을 입체적으로 서술'
    : '단문과 복문이 조화롭게 균형을 이루어 가독성이 높고 매끄럽게 서술';

  const toneGuide = styleOptions?.tone === 'growth'
    ? '배움에 대한 긍정적 태도, 끈기 있는 노력의 과정, 점진적인 성장과 발전 가능성에 초점을 두어 서술'
    : styleOptions?.tone === 'collaborative'
    ? '동료들과의 협력적 의사소통, 상호 피드백 수용 및 조율, 공동체 기여와 배려 역량에 초점을 두어 서술'
    : '비판적 문제의식, 논리적 인과 규명, 학술적 탐구력과 지적 통찰력에 초점을 두어 서술';

  const fewShotSection = (styleOptions?.fewShotSamples && styleOptions.fewShotSamples.filter(s => s.trim().length > 5).length > 0)
    ? `\n\n[선생님 고유 문체 퓨샷 학습 예시 (Few-shot Writing Samples)]\n선생님이 과거에 작성하신 아래 실제 우수 세특 문장의 어조, 문장 호흡, 선호 서술어 구조를 정밀하게 학습하고 복제하여 자연스럽게 일치시키세요:\n` +
      styleOptions.fewShotSamples.filter(s => s.trim().length > 5).map((s, idx) => `• 우수 예시 ${idx + 1}: "${s.trim()}"`).join('\n')
    : '';

  const systemPrompt = `당신은 대한민국 고등학교 교과 세부능력 및 특기사항(세특) 전문 작성 및 규정 감사관입니다.
반드시 아래의 [2022 개정 교육과정], [NEIS 기재요령], [setek-english-creator 4층 서사], [setek-english-natural AI 티 사전 회피] 원칙을 100% 엄수하여 작성해야 합니다:

[교사 맞춤형 문체 스타일 지침]
• 문장 호흡: ${pacingGuide}
• 서술 성향: ${toneGuide}${fewShotSection}

[다양성 보장 지침 (Diversity Directive)]
• 이번 학생 세특의 특화 서술 관점: [${selectedAngle}]
• 학급 내 다른 학생들과 문두(시작 어구)나 결말 문구가 똑같아지지 않도록, 어휘와 문장 구조를 독창적이고 다양하게 전개하세요.
• 첫 문장을 항상 '~활동에서'로 시작하지 말고, 활동의 문제의식이나 탐구 계기, 핵심 개념에 착안하여 다채로운 문두를 사용하세요.

[권장 교과 전문 서술 동사 (행동·과정 중심)]
질문함, 정의함, 진단함, 해석함, 결론을 도출함, 재구성함, 분석함, 탐구함, 비교함, 예측함, 평가함, 설정함, 의견을 공유함, 공감을 끌어냄, 토의함, 제안함, 기획함, 제작함, 설계함, 실험함, 모델링함, 구조화함, 정교화함, 시뮬레이션함, 논증함 등을 상황에 맞게 유기적으로 활용하세요.

[4층 서술 구조 (4-Layer Narrative Architecture)]
• 1층 [진단]: 학생 고유의 교과 접근 성향과 탐구 출발점 (추상어 금지)
• 2층 [전개]: 구체적 활동 근거 2~3가지 (말하기/쓰기/읽기/듣기 수행 과정 및 산출물)
• 3층 [해석]: 활동에서 드러난 인지적·메타인지적 역량과 태도의 의미화
• 4층 [전망]: 특정 직업 단정 대신 전이 가능한 역량·자질 중심의 미래지향적 잠재력

[AI 티(AI-Tells) 사전 회피 7대 규칙]
1. 번역투 '~을 통해' 남발 금지: '~활동에서', '~하는 과정에서', '~하여'로 치환 (전체 1회 이하).
2. Hype 어휘 원천 배제: '탁월한', '뛰어난', '우수한', '심도 있는', '놀라운' 등 0건.
3. 상투적 결말 공식 회피: '~한 모습을 보여줌', '~할 것으로 기대됨' 0건. 활동의 구체적 산출물 결과 자체나 역량 전이로 마무리.
4. 범용 형용사 묶음 금지: '성실하고 적극적인', '진지하고 열정적인' 대신 1개의 구체적 행동 에피소드로 명시.
5. 수식 중복 회피: '다양하고 깊이 있는' 등 형용사 나열 배제.
6. 명사형 종결어미 강제: 모든 문장은 '~함', '~임', '~음', '~보임', '~도출함'으로 종결 (절대 평어로 풀지 말 것).
7. 주어 생략: '이 학생은', '학생은' 등 주어 반복 제거.

[NEIS 절대 기재금지 11대 항목]
논문/소논문, 도서출간, 특허/실용신안, 공인어학성적(토익 등), 교외대회/수상, 모의고사/수능 성적, 부모/가족 배경, 특정 학원명/대학교명, 해외연수 일체 금지.`;

  let userPrompt = `[교과목]: ${sanitized.sanitizedSubject}
[수행평가/수업 맥락]: ${sanitized.sanitizedContext}
${curriculumCode ? `[2022 개정 성취기준]: ${curriculumCode} - ${curriculumDesc || ''}` : ''}
${curriculumActivities && curriculumActivities.length > 0 ? `[성취기준 연계 수업활동]: ${curriculumActivities.join(' / ')}` : ''}
[학생 활동 메모/원문]: ${sanitized.sanitizedDraft}
[서술 관점]: ${selectedAngle}
[요청 모드]: ${mode}`;

  if (mode === 'enrich') {
    userPrompt += `\n위 내용을 바탕으로 학생의 개성, 발전성, 미래지향적 역량이 돋보이는 완성형 고도화 세특 1문단(약 450~520자, 1,350~1,480 Byte)을 단일 문단으로 작성해 주세요.`;
  } else if (mode === 'differentiate') {
    userPrompt += `\n위 활동을 바탕으로 학생의 성취도에 따라 [상 - 자기주도·심화·확장], [중 - 성실·이해·협력], [하 - 기초·발전가능성] 3가지 버전으로 각각 작성해 주세요. 반드시 다음 JSON 포맷으로만 응답하세요: {"high": "...", "mid": "...", "low": "..."}`;
  } else if (mode === 'paraphrase') {
    userPrompt += `\n동일 활동을 한 다른 학생들과 문두/문미 표현이 겹치지 않도록, 서로 다른 문장 구조와 어휘를 사용한 3가지 대체 버전을 JSON 포맷으로 반환해 주세요: {"v1": "...", "v2": "...", "v3": "..."}`;
  } else if (mode === 'compress') {
    userPrompt += `\n사실 관계(구체적 활동, 산출물, 결론)를 전혀 훼손하지 않으면서 1,450 Byte 이내로 군더더기를 없애고 정밀하게 압축된 단일 문단 세특을 작성해 주세요.`;
  }

  return { systemPrompt, userPrompt, selectedAngle };
}

/**
 * Anthropic Claude API 호출 함수 (claude-3-7-sonnet / claude-3-5-sonnet)
 */
async function callClaudeApi(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, model = 'claude-3-7-sonnet-20250219', mode } = options;
  const { systemPrompt, userPrompt, selectedAngle } = buildPromptPayload(options);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-3-7-sonnet-20250219',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || '';
  const cleaned = autoFixFormatIssues(text.trim());

  if (mode === 'differentiate') {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          enrichedText: autoFixFormatIssues(parsed.high || cleaned),
          levelVariations: {
            high: autoFixFormatIssues(parsed.high || ''),
            mid: autoFixFormatIssues(parsed.mid || ''),
            low: autoFixFormatIssues(parsed.low || ''),
          },
          isMock: false,
          providerUsed: `Claude (${model})`,
          diversityAngle: selectedAngle,
          isDraft: true,
          sanitized: true,
        };
      }
    } catch (e) {
      console.debug('Claude API response was not formatted as JSON variations, using raw text:', e);
    }
  }

  return {
    enrichedText: cleaned,
    isMock: false,
    providerUsed: `Claude (${model})`,
    diversityAngle: selectedAngle,
    isDraft: true,
    sanitized: true,
  };
}

/**
 * 업스테이지 Solar API (solar-pro / solar-mini) 다양화 강화 호출 함수
 */
async function callUpstageSolarApi(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, model = 'solar-pro', mode } = options;
  const { systemPrompt, userPrompt, selectedAngle } = buildPromptPayload(options);

  const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'solar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstage API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const cleaned = autoFixFormatIssues(text.trim());

  if (mode === 'differentiate') {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          enrichedText: autoFixFormatIssues(parsed.high || cleaned),
          levelVariations: {
            high: autoFixFormatIssues(parsed.high || ''),
            mid: autoFixFormatIssues(parsed.mid || ''),
            low: autoFixFormatIssues(parsed.low || ''),
          },
          isMock: false,
          providerUsed: 'Upstage Solar',
          diversityAngle: selectedAngle,
          isDraft: true,
          sanitized: true,
        };
      }
    } catch (e) {
      console.debug('Upstage differentiate response was not formatted as JSON, using raw text:', e);
    }
  }

  if (mode === 'paraphrase') {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const variations = [parsed.v1, parsed.v2, parsed.v3].filter(Boolean).map(autoFixFormatIssues);
        return {
          enrichedText: variations[0] || cleaned,
          paraphrasedVariations: variations,
          isMock: false,
          providerUsed: 'Upstage Solar',
          diversityAngle: selectedAngle,
          isDraft: true,
          sanitized: true,
        };
      }
    } catch (e) {
      console.debug('Upstage paraphrase response was not formatted as JSON, using raw text:', e);
    }
  }

  return {
    enrichedText: cleaned,
    isMock: false,
    providerUsed: 'Upstage Solar',
    diversityAngle: selectedAngle,
    isDraft: true,
    sanitized: true,
  };
}

/**
 * OpenAI API 호출 함수 (gpt-4o / gpt-4o-mini)
 */
async function callOpenAIApi(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, model = 'gpt-4o', mode } = options;
  const { systemPrompt, userPrompt, selectedAngle } = buildPromptPayload(options);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const cleaned = autoFixFormatIssues(text.trim());

  return {
    enrichedText: cleaned,
    isMock: false,
    providerUsed: `OpenAI (${model})`,
    diversityAngle: selectedAngle,
    isDraft: true,
    sanitized: true,
  };
}

/**
 * 업스테이지 Solar 90개 수준별 변형 생성
 */
async function callUpstageSolarFor90Paraphrase(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, model = 'solar-pro', subject, context, rawDraft } = options;

  const sanitized = sanitizeStudentDataForLLM(options.studentName, options.studentNo, options.studentEmail, subject, context, rawDraft);

  const systemPrompt = `당신은 대한민국 고등학교 세특 문구 수준별 변형 생성 전문가입니다.
주어진 활동과 초안을 바탕으로 학생 수준(상/중/하)별 각 30개씩 총 90개의 정밀 변형 문구를 JSON 형태로 생성해야 합니다.

[핵심 규칙]
1. 모든 문구는 명사형 종결어미(-함, -음, -임)로 끝납니다.
2. 학생 이름이나 주어(이 학생은)는 생략합니다.
3. 부정적 표현, 점수/등급, 논문/외부수상 등 금기어를 일체 배제합니다.
4. 상(上): 자기주도성, 심화 탐구, 비판적 사고, 연계 융합 (30개)
5. 중(中): 성실한 참여, 개념 이해, 협력적 태도, 명료한 정리 (30개)
6. 하(下): 기초 다지기, 노력하는 모습, 긍정적 변화 (30개, 부정어 금지)

반드시 다음 순수 JSON 포맷으로만 응답하세요:
{
  "high": ["문구1", ... 30개],
  "mid": ["문구1", ... 30개],
  "low": ["문구1", ... 30개]
}`;

  const userPrompt = `[과목]: ${sanitized.sanitizedSubject}\n[맥락]: ${sanitized.sanitizedContext}\n[원문 메모]: ${sanitized.sanitizedDraft}\n위 내용을 바탕으로 상 30개, 중 30개, 하 30개 총 90개의 세특 변형 문구를 JSON으로 생성해 주세요.`;

  const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'solar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstage 90 Paraphrase Error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || '{}';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);

  const categories: ('과정중심' | '결과중심' | '태도중심' | '산출물중심')[] = ['과정중심', '산출물중심', '결과중심', '태도중심'];

  const formatList = (list: string[], level: Level): Paraphrase90Item[] => {
    return (list || []).map((t, idx) => ({
      id: idx + 1,
      level,
      category: categories[idx % categories.length],
      text: autoFixFormatIssues(t),
    }));
  };

  const group: Paraphrase90Group = {
    high: formatList(parsed.high || [], 'high'),
    mid: formatList(parsed.mid || [], 'mid'),
    low: formatList(parsed.low || [], 'low'),
  };

  return {
    enrichedText: group.high[0]?.text || '',
    paraphrase90: group,
    isMock: false,
    providerUsed: 'Upstage Solar',
    diversityAngle: '90개 다차원 변형 라이브러리',
    isDraft: true,
    sanitized: true,
  };
}

/**
 * Google Gemini API 호출 함수
 */
async function callGeminiApi(options: GenerateOptions): Promise<GenerateResult> {
  const { apiKey, model = 'gemini-2.5-flash', mode } = options;
  const { systemPrompt, userPrompt, selectedAngle } = buildPromptPayload(options);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    enrichedText: autoFixFormatIssues(text.trim()),
    isMock: false,
    providerUsed: 'Google Gemini',
    diversityAngle: selectedAngle,
    isDraft: true,
    sanitized: true,
  };
}

/**
 * 90개 수준별 변형 문구 스마트 시뮬레이터 (sebu-paraphraser)
 */
export function simulate90Paraphrase(options: GenerateOptions): GenerateResult {
  const { context, rawDraft } = options;
  const keywords = extractKeywords(rawDraft, context);
  const k1 = keywords[0] || '주제 관련 텍스트';
  const k2 = keywords[1] || '현상 분석';
  const k3 = keywords[2] || '창의적 대안 도출';

  const generateItems = (level: Level): Paraphrase90Item[] => {
    const items: Paraphrase90Item[] = [];
    const categories: ('과정중심' | '결과중심' | '태도중심' | '산출물중심')[] = ['과정중심', '산출물중심', '결과중심', '태도중심'];

    for (let i = 1; i <= 30; i++) {
      const cat = categories[(i - 1) % categories.length];
      let text = '';

      if (level === 'high') {
        switch (i % 6) {
          case 0:
            text = `'${context}' 활동에서 ${k1}의 구조적 쟁점을 능동적으로 확장하여 시사 자료와 문헌을 정교하게 분석하고, 모둠 토의 시 ${k2}에 대한 논리적 반론을 주도적으로 제시함.`;
            break;
          case 1:
            text = `${k1}에 대한 비판적 문제의식을 바탕으로 '${context}' 과제에서 ${k2}의 인과관계를 심층 규명하고, 독창적 관점에서 ${k3}을 도출하는 지적 통찰력을 발휘함.`;
            break;
          case 2:
            text = `'${context}' 탐구에서 ${k1}과 타 교과 개념을 융합적으로 고찰하여 ${k2}의 파급 효과를 구조화된 보고서로 작성하고, 동료들의 다각적 이해를 돕는 발표를 완수함.`;
            break;
          case 3:
            text = `${k2}의 한계를 극복하고자 주도적으로 추가 학술 자료를 탐색하였으며, '${context}' 과정에서 ${k3}에 대한 실천적 해법을 논증적으로 제시함.`;
            break;
          case 4:
            text = `'${context}' 수행 시 ${k1}의 핵심 논지를 입체적으로 재구성하여 ${k2}을 면밀히 검토하고, 팀원들의 피드백을 수용하여 자신의 논거를 한층 정교화함.`;
            break;
          default:
            text = `${k1}을 다룬 '${context}' 활동에서 교과 지식을 실생활 쟁점에 능동적으로 적용하여 ${k3}을 설계하고, 논리정연한 구술로 학습 공동체의 토론 깊이를 더함.`;
            break;
        }
      } else if (level === 'mid') {
        switch (i % 6) {
          case 0:
            text = `'${context}' 활동에서 ${k1}의 핵심 개념을 정확하게 이해한 뒤 ${k2}에 충실히 적용하여 명료하게 정리하였고, 모둠 토의에 자기 역할을 다하며 적극적으로 참여함.`;
            break;
          case 1:
            text = `${k1}의 기본 원리를 성실히 학습하여 '${context}' 과제에서 ${k2}에 관한 사례 분석을 안정적으로 수행하였으며, 또래와 협력하여 ${k3}을 도출함.`;
            break;
          case 2:
            text = `'${context}' 과제를 준비하는 과정에서 ${k1}을 단계적으로 익혀 점차 향상된 분석 능력을 보였고, 모둠원들과의 원활한 소통으로 발표 자료의 완성도를 높임.`;
            break;
          case 3:
            text = `${k2}에 필요한 통계 자료와 기초 사례를 꼼꼼하게 수집하여 '${context}' 활동에 기여하였으며, 배운 내용을 자신의 언어로 명확히 설명함.`;
            break;
          case 4:
            text = `'${context}' 수업에서 주어진 가이드라인을 성실히 준수하며 ${k1}과 ${k2}의 연관성을 차분하게 정리하고, 모둠원들의 의견을 경청하여 결론을 완성함.`;
            break;
          default:
            text = `${k1} 관련 실습 과제에서 침착하게 ${k2}을 수행하며 성실한 학업 태도를 견지하였고, 지속적인 질문을 통해 ${k3}에 대한 이해를 확실히 다짐.`;
            break;
        }
      } else {
        switch (i % 6) {
          case 0:
            text = `'${context}' 활동에서 ${k1}의 기초 개념을 차분하게 익히며 실생활 사례에 연결해 보려 노력하였고, 모둠 활동에 묵묵히 참여하며 점차 익숙해지는 모습을 보임.`;
            break;
          case 1:
            text = `${k1}의 기본 구조를 다지며 '${context}' 과제에 성실히 임하였고, 동료의 설명을 경청하며 한 걸음씩 이해를 넓혀 가는 태도에서 성장 가능성이 확인됨.`;
            break;
          case 2:
            text = `'${context}' 수업에서 교사의 안내에 따라 ${k2}에 필요한 기본 용어를 꾸준히 정리하며 과제를 끝까지 완수하려는 도전적 자세를 나타냄.`;
            break;
          case 3:
            text = `${k1}을 학습하는 과정에서 진솔한 질문을 통해 기본 개념을 파악하려 애썼으며, 모둠 활동에서 맡은 역할을 성실히 수행하여 자신감을 키워감.`;
            break;
          case 4:
            text = `'${context}' 과제 수행에 긍정적인 배움의 태도로 참여하여 ${k2}의 기초 사실을 차근차근 확인하였으며, 향후 학업적 발전 가능성이 기대됨.`;
            break;
          default:
            text = `${k1}의 주요 내용을 교재와 대조하며 성실하게 기록하였고, '${context}' 모둠 활동에서 협조적인 태도로 소통하며 기초 소양을 다져 나감.`;
            break;
        }
      }

      items.push({
        id: i,
        level,
        category: cat,
        text: autoFixFormatIssues(text),
      });
    }

    return items;
  };

  const group: Paraphrase90Group = {
    high: generateItems('high'),
    mid: generateItems('mid'),
    low: generateItems('low'),
  };

  return {
    enrichedText: group.high[0].text,
    paraphrase90: group,
    isMock: true,
    providerUsed: '오프라인 스마트 시뮬레이터',
    diversityAngle: '90개 다차원 변형 라이브러리',
    isDraft: true,
    sanitized: true,
  };
}

/**
 * 4층 서사 & AI 티 사전 회피 스마트 시뮬레이터 (다양성 회전)
 */
function simulateAdvancedGeneration(options: GenerateOptions): GenerateResult {
  const { context, rawDraft, curriculumCode, mode, diversityIndex = 0 } = options;

  const coreKeywords = extractKeywords(rawDraft, context);
  const keyword1 = coreKeywords[0] || '주제 관련 텍스트';
  const keyword2 = coreKeywords[1] || '현상 분석';
  const keyword3 = coreKeywords[2] || '창의적 대안 제시';

  const selectedAngle = DIVERSITY_ANGLES[diversityIndex % DIVERSITY_ANGLES.length];
  const citeText = curriculumCode ? `${curriculumCode} 성취기준과 연계하여 ` : '';

  // 4가지 다양한 서사 템플릿
  const templates = [
    `${citeText}'${context}' 활동에서 ${keyword1}에 대한 비판적 문제의식을 바탕으로 심화 영문 자료와 시사 텍스트를 정밀하게 분석함. ${keyword2} 과정에서 나타나는 원인과 파급 효과를 논리적 인과관계에 기반하여 규명하고, 단순 현상 파악을 넘어 ${keyword3}을 도출하는 영문 발표 대본을 완성함. 모둠 협력 시 텍스트의 맥락적 함의를 명료한 어휘로 설명하며 동료들과 질의응답을 주도하였고, 제시된 피드백을 반영하여 논거 배치를 재구성함. 교과 지식을 실생활 쟁점과 연결하여 실천적 해결 방안을 모색하는 등 맥락 독해력과 논증적 의사소통 역량이 돋보임.`,

    `${keyword1}을 다룬 '${context}' 과제에서 핵심 논지의 타당성을 입체적으로 검토하고자 관련 통계와 학술 문헌을 주도적으로 비교 분석함. ${keyword2}의 배후 원인을 다각도로 규명하는 과정에서 ${keyword3}을 설계하여 산출물의 완성도를 높임. 토론 과정에서 동료들의 의견을 경청하며 자신의 논지를 논리정연하게 보완하였으며, 배운 개념을 새로운 문제 상황에 적용하여 유의미한 시사점을 도출하는 학업 역량이 확인됨.`,

    `수업 중 ${keyword1} 쟁점에 주목하여 스스로 질문을 구성하고, '${context}' 탐구를 통해 ${keyword2}의 실제 사례를 면밀히 조사함. 텍스트 이면의 인과구조를 분석한 뒤 ${keyword3}에 관한 구체적 실행 방안을 제안하는 보고서를 완성함. 모둠원들과의 상호 피드백을 수용하여 모호한 표현을 정교하게 다듬었으며, 지적 호기심을 바탕으로 탐구를 지속적으로 심화해 나가는 자기주도성이 두드러짐.`,

    `${context} 수행 시 ${keyword1}의 개념적 한계를 극복하고자 실증 데이터를 수집하고, ${keyword2}의 메커니즘을 체계적으로 구조화함. 단순 요약에 그치지 않고 ${keyword3}을 독창적인 시각에서 모색하여 프레젠테이션을 완성함. 질문에 침착하게 근거를 들어 설명하는 전달력을 발휘하였으며, 사회적 맥락과 융합하여 교과 지식을 실천적으로 확장하는 잠재력이 큼.`
  ];

  const highText = templates[diversityIndex % templates.length];

  const midText = `${citeText}'${context}' 활동에 성실하게 참여하여 ${keyword1} 관련 핵심 개념과 텍스트의 맥락을 정확하게 파악함. 모둠 과제 수행 시 ${keyword2}에 필요한 기본 통계와 사례 자료를 체계적으로 정리하여 발표 자료의 완성도를 높이는 데 기여함. 동료들과의 협력적 의사소통을 통해 서로 다른 의견을 조율하며 ${keyword3}에 관한 실행 가능한 결론을 도출함. 주어진 과제 기준을 충실히 준수하며 수업 중 배운 내용을 자신의 언어로 요약하여 설명하는 학업 성취도가 확인됨.`;

  const lowText = `'${context}' 수업 활동에서 교사의 안내에 따라 ${keyword1}의 기초 개념을 학습하고 성실히 과제를 수행함. ${keyword2} 과정에서 모둠원들의 도움을 받아 주요 용어와 사실 관계를 차근차근 확인하며 탐구 과정에 끝까지 참여함. ${keyword3}을 정리하는 모둠 활동에서 자신의 역할을 책임감 있게 수행하며 배움에 대한 긍정적인 태도와 발전 의지를 보임.`;

  const paraphrased1 = `'${context}' 과제에서 ${keyword1}에 착안하여 관련 텍스트의 논리적 구조를 다각도로 비교 분석함. ${keyword2}의 함의를 입체적으로 고찰하고 창의적 관점에서 ${keyword3}을 구체화한 탐구 보고서를 작성함. 질문을 두려워하지 않고 새로운 탐구 시각을 모색하는 지적 호기심과 논증력이 인상적임.`;
  const paraphrased2 = `수업 중 다룬 ${keyword1} 쟁점에 주목하여 심화 문헌을 주도적으로 탐색하고, ${keyword2}을 중심으로 핵심 논지를 정밀하게 구조화함. 모둠 협업에서 ${keyword3}을 실현 가능한 방향으로 제안하여 토론의 깊이를 더했으며, 탐구 결과를 논리정연하게 구술하는 역량이 확인됨.`;
  const paraphrased3 = `${keyword1}을 다룬 '${context}' 탐구에서 텍스트 이면의 인과관계를 밝히고자 주도적으로 자료를 수집·대조함. ${keyword2}에 대한 날카로운 분석을 바탕으로 ${keyword3}을 체계적으로 도출하였으며, 비판적 사고력과 자기주도적 학업 태도가 두드러짐.`;

  let primaryText = highText;
  if (mode === 'compress') {
    primaryText = `'${context}' 활동에서 ${keyword1}을 비판적으로 탐구함. ${keyword2}의 원인을 규명하고 ${keyword3}을 구체화한 산출물을 완성함. 모둠 토의에서 논리적 근거로 동료들과 소통하며 배움을 실천적으로 확장하는 역량이 확인됨.`;
  }

  const cleaned = autoFixFormatIssues(primaryText);

  return {
    enrichedText: cleaned,
    levelVariations: {
      high: autoFixFormatIssues(highText),
      mid: autoFixFormatIssues(midText),
      low: autoFixFormatIssues(lowText),
    },
    paraphrasedVariations: [
      autoFixFormatIssues(paraphrased1),
      autoFixFormatIssues(paraphrased2),
      autoFixFormatIssues(paraphrased3),
    ],
    isMock: true,
    providerUsed: '오프라인 스마트 시뮬레이터',
    diversityAngle: selectedAngle,
    isDraft: true,
    sanitized: true,
  };
}

function extractKeywords(raw: string, context: string): string[] {
  const combined = `${context} ${raw}`;
  const tokens = combined
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !['학생', '활동', '통해', '대해', '있음', '수업', '매우'].includes(w));

  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 4);
}
