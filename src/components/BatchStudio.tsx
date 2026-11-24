import React, { useState } from 'react';
import { StudentRecord } from '../types';
import { downloadSampleTemplate, exportResultsToExcel, exportResultsToCsv, parseExcelFile } from '../lib/excelHelper';
import { exportResultsToHwpx } from '../lib/hwpxHelper';
import { fetchGoogleSheetData } from '../lib/googleSheetsHelper';
import { inspectSeteuk } from '../lib/inspector';
import { generateSeteukAdvanced, DIVERSITY_ANGLES } from '../lib/geminiApi';
import { CURRICULUM_STANDARDS } from '../lib/curriculumData';
import { CurriculumActivityPickerModal } from './CurriculumActivityPickerModal';
import { PlagiarismModal } from './PlagiarismModal';
import {
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  Globe,
  Link,
  Loader2,
  Lock,
  Mail,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Upload,
  Users,
  FileEdit,
  Lightbulb,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface BatchStudioProps {
  students: StudentRecord[];
  onSetStudents: (students: StudentRecord[]) => void;
  apiKey: string;
  selectedModel: string;
}

export const BatchStudio: React.FC<BatchStudioProps> = ({
  students,
  onSetStudents,
  apiKey,
  selectedModel,
}) => {
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // 성취기준 & 활동 일괄 연계 모달 상태
  const [isCurriculumBatchModalOpen, setIsCurriculumBatchModalOpen] = useState(false);

  // 학급 전체 어휘 중복도 검사 (Anti-Plagiarism) 모달 상태
  const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);

  // 분할 작성 설정 상태
  const [batchScope, setBatchScope] = useState<'all' | 'chunk5' | 'chunk10' | 'selected'>('all');
  const [chunkIndex, setChunkIndex] = useState(0); // 몇 번째 묶음인지

  // 구글 시트 링크로 즉시 불러오기
  const handleLoadGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      alert('구글 시트 링크(URL)를 입력해 주세요.');
      return;
    }

    setIsLoadingSheet(true);
    setStatusMessage('구글 시트 데이터를 읽어오는 중...');

    try {
      const records = await fetchGoogleSheetData(googleSheetUrl);
      onSetStudents(records);
      setStatusMessage(`✅ 구글 시트에서 총 ${records.length}명의 학생 데이터를 성공적으로 불러왔습니다!`);
    } catch (err: any) {
      alert(`구글 시트 불러오기 실패: ${err.message}`);
      setStatusMessage(null);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // 엑셀 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        alert('엑셀 파일에 유효한 데이터가 없습니다.');
        return;
      }
      onSetStudents(parsed as StudentRecord[]);
      setStatusMessage(`✅ 엑셀 파일에서 ${parsed.length}명의 학생 데이터를 불러왔습니다.`);
    } catch (err: any) {
      alert(`엑셀 파싱 실패: ${err.message}`);
    }
  };

  // 체크박스 선택 토글
  const handleToggleSelect = (id: string) => {
    const updated = students.map((s) =>
      s.id === id ? { ...s, selectedForBatch: !s.selectedForBatch } : s
    );
    onSetStudents(updated);
  };

  // 전체 선택/해제 토글
  const handleToggleSelectAll = () => {
    const allSelected = students.every((s) => s.selectedForBatch);
    const updated = students.map((s) => ({ ...s, selectedForBatch: !allSelected }));
    onSetStudents(updated);
  };

  // 2022 개정 성취기준 & 활동 일괄 적용 핸들러
  const handleApplyCurriculumToBatch = (std: any, activity?: string, template?: string) => {
    const hasSelected = students.some((s) => s.selectedForBatch);

    const updated = students.map((s) => {
      // 선택된 학생이 있으면 선택된 학생만, 없으면 전체 학생에게 적용
      if (!hasSelected || s.selectedForBatch) {
        return {
          ...s,
          curriculumCode: std.code,
          subject: s.subject || std.subject.split('·')[0],
          context: activity || s.context,
          rawDraft: template && (!s.rawDraft || s.rawDraft.trim().length === 0) ? template : s.rawDraft,
        };
      }
      return s;
    });

    onSetStudents(updated);
    setStatusMessage(
      `🎯 [${std.code}] 성취기준${activity ? ` 및 연계활동("${activity}")` : ''}이 학생 명단에 일괄 적용되었습니다.`
    );
  };

  // 단일 학생 텍스트 실시간 인라인 수정
  const handleTextChange = (id: string, newText: string) => {
    const updated = students.map((s) => {
      if (s.id === id) {
        const inspection = inspectSeteuk(newText);
        return {
          ...s,
          enrichedDraft: newText,
          byteCount: inspection.byteCount,
          charCount: newText.length,
          inspection,
        };
      }
      return s;
    });
    onSetStudents(updated);
  };

  // 단일 학생 원클릭 개별 재시도 (Retry)
  const handleRetrySingle = async (id: string) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;

    setRetryingId(id);
    const originalIdx = students.findIndex((s) => s.id === id);
    const std = CURRICULUM_STANDARDS.find((c) => c.code === target.curriculumCode);

    try {
      const res = await generateSeteukAdvanced({
        apiKey,
        model: selectedModel,
        studentName: target.name,
        studentNo: target.studentNo,
        studentEmail: target.email,
        subject: target.subject,
        context: target.context,
        rawDraft: target.rawDraft,
        curriculumCode: target.curriculumCode,
        curriculumDesc: std?.description,
        curriculumActivities: std?.recommendedActivities,
        mode: 'enrich',
        diversityIndex: (originalIdx + Math.floor(Math.random() * 5) + 1) % DIVERSITY_ANGLES.length,
      });

      const inspection = inspectSeteuk(res.enrichedText);
      const updated = students.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            enrichedDraft: res.enrichedText,
            byteCount: inspection.byteCount,
            charCount: res.enrichedText.length,
            diversityAngle: res.diversityAngle,
            inspection,
            status: 'done' as const,
          };
        }
        return s;
      });
      onSetStudents(updated);
    } catch (err: any) {
      alert(`재시도 중 오류: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  // 실행 대상 학생 목록 결정
  const getTargetStudents = (): { targets: StudentRecord[]; indices: number[] } => {
    if (batchScope === 'all') {
      return { targets: students, indices: students.map((_, i) => i) };
    }
    if (batchScope === 'chunk5') {
      const start = chunkIndex * 5;
      const end = Math.min(start + 5, students.length);
      const targets = students.slice(start, end);
      const indices = Array.from({ length: end - start }, (_, i) => start + i);
      return { targets, indices };
    }
    if (batchScope === 'chunk10') {
      const start = chunkIndex * 10;
      const end = Math.min(start + 10, students.length);
      const targets = students.slice(start, end);
      const indices = Array.from({ length: end - start }, (_, i) => start + i);
      return { targets, indices };
    }
    // selected
    const targets: StudentRecord[] = [];
    const indices: number[] = [];
    students.forEach((s, i) => {
      if (s.selectedForBatch) {
        targets.push(s);
        indices.push(i);
      }
    });
    return { targets, indices };
  };

  // 일괄 또는 분할 세특 작성 실행 (다양성 엔진 적용)
  const handleRunBatch = async () => {
    const { targets, indices } = getTargetStudents();

    if (targets.length === 0) {
      alert('작성 대상 학생이 선택되지 않았습니다.');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: targets.length });

    const updatedList = [...students];

    for (let k = 0; k < targets.length; k++) {
      const originalIdx = indices[k];
      const student = updatedList[originalIdx];
      setProgress({ current: k + 1, total: targets.length });

      const std = CURRICULUM_STANDARDS.find((c) => c.code === student.curriculumCode);

      try {
        const res = await generateSeteukAdvanced({
          apiKey,
          model: selectedModel,
          studentName: student.name,
          studentNo: student.studentNo,
          studentEmail: student.email,
          subject: student.subject,
          context: student.context,
          rawDraft: student.rawDraft,
          curriculumCode: student.curriculumCode,
          curriculumDesc: std?.description,
          curriculumActivities: std?.recommendedActivities,
          mode: 'enrich',
          diversityIndex: originalIdx, // 학생마다 고유한 다양화 서사 관점 적용!
        });

        const inspection = inspectSeteuk(res.enrichedText);
        updatedList[originalIdx] = {
          ...student,
          enrichedDraft: res.enrichedText,
          byteCount: inspection.byteCount,
          charCount: res.enrichedText.length,
          diversityAngle: res.diversityAngle,
          inspection,
          status: 'done',
        };

        onSetStudents([...updatedList]);
      } catch (err) {
        console.error(`학생 ${student.name} 처리 중 오류:`, err);
        updatedList[originalIdx] = { ...student, status: 'error' };
      }
    }

    setIsProcessing(false);
    if (!apiKey || apiKey.trim().length <= 5) {
      setStatusMessage(`🎉 ${targets.length}명의 학생 세특 초안 작성이 [오프라인 시뮬레이터]로 완료되었습니다. 실제 AI 생성을 원하시면 상단 [AI 모델 / 키 설정]에서 본인 키(Gemini 무료 권장)를 등록해 주세요.`);
    } else {
      setStatusMessage(`🎉 ${targets.length}명의 학생 세특 초안 작성이 2022 성취기준 연계 엔진으로 완료되었습니다!`);
    }
  };

  const handleCopyRow = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const { targets } = getTargetStudents();

  // 분할 청크 개수 계산
  const totalChunks5 = Math.ceil(students.length / 5);
  const totalChunks10 = Math.ceil(students.length / 10);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Privacy Assurance & Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-300 mr-1.5">[Zero-DB 세션 보호]</span>
            <span className="text-slate-200">
              구글 시트나 엑셀의 개인정보(이름·학번·이메일)는 LLM API 전송 시 원천 마스킹되며 서버에 남지 않습니다.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg shrink-0">
          <FileEdit className="w-3.5 h-3.5 text-amber-300" />
          <span>결과는 교사 검토용 초안(Draft)입니다</span>
        </div>
      </div>

      {/* 1. Google Sheets & Excel Import Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>구글 시트(Google Sheets) 또는 엑셀로 일괄 불러오기</span>
              </h2>
              <p className="text-xs text-slate-500">
                구글 시트 링크만 넣으면 학생 명단, 이메일, 수행평가 메모를 즉시 읽어와 세특을 완성합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleTemplate}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>양식 엑셀 다운로드</span>
            </button>

            <label className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>엑셀 파일 업로드</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Google Sheet URL Input Bar */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            구글 시트 공유 링크 (URL) 입력:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono bg-slate-50/50"
              />
            </div>

            <button
              disabled={isLoadingSheet}
              onClick={handleLoadGoogleSheet}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
            >
              {isLoadingSheet ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>구글 시트 불러오기</span>
            </button>
          </div>

          <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
            <span className="font-bold">💡 팁:</span>
            <span>
              구글 시트 우측 상단 [공유] → <strong>"링크가 있는 모든 사용자(뷰어)"</strong>로 설정된 링크를 복사하여 붙여넣으시면 됩니다. (이메일 열 포함 지원)
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Batch Scope Selector Card & Curriculum Batch Tool */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>세특 작성 방식 & 2022 성취기준 연계</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>2022 개정 교육과정 연동</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              반 전체를 한 번에 작성하거나, 5명/10명씩 나누어 검토하며 작성할 수 있습니다.
            </p>
          </div>

          {/* Scope Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => { setBatchScope('all'); setChunkIndex(0); }}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                batchScope === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 일괄 ({students.length}명)
            </button>

            <button
              onClick={() => { setBatchScope('chunk5'); setChunkIndex(0); }}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                batchScope === 'chunk5'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5명씩 분할
            </button>

            <button
              onClick={() => { setBatchScope('chunk10'); setChunkIndex(0); }}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                batchScope === 'chunk10'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              10명씩 분할
            </button>

            <button
              onClick={() => setBatchScope('selected')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                batchScope === 'selected'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              선택한 학생만 ({students.filter((s) => s.selectedForBatch).length}명)
            </button>
          </div>
        </div>

        {/* 🎯 성취기준 & 연계 활동 일괄 배정 툴바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-900">2022 개정 성취기준 & 수행평가 활동 일괄 배정</span>
              <p className="text-[11px] text-slate-500">
                선택한 성취기준과 추천 활동을 학급 학생들에게 한 번에 적용합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCurriculumBatchModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>성취기준 & 활동 일괄 선택</span>
          </button>
        </div>

        {/* Chunk Pager if chunk mode active */}
        {(batchScope === 'chunk5' || batchScope === 'chunk10') && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <span className="font-bold text-slate-700">작성할 구간 선택:</span>
            {Array.from(
              { length: batchScope === 'chunk5' ? totalChunks5 : totalChunks10 },
              (_, idx) => {
                const chunkSize = batchScope === 'chunk5' ? 5 : 10;
                const startNum = idx * chunkSize + 1;
                const endNum = Math.min((idx + 1) * chunkSize, students.length);
                const isCurrent = chunkIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setChunkIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {startNum}번 ~ {endNum}번 ({endNum - startNum + 1}명)
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-600 font-medium">
            현재 작성 대상: <strong className="text-purple-700">{targets.length}명</strong>
            <span className="text-slate-400 mx-2">|</span>
            각 학생마다 8대 서사 관점이 자동 회전 배정됩니다. (2022 성취기준 연계)
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={isProcessing || targets.length === 0}
              onClick={handleRunBatch}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>작성 중 ({progress.current}/{progress.total}명)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{targets.length}명 세특 초안 생성 시작 ⚡</span>
                </>
              )}
            </button>

            {/* 어휘 중복도 검사 (Anti-Plagiarism) */}
            <button
              onClick={() => setIsPlagiarismModalOpen(true)}
              disabled={students.length === 0 || students.every((s) => !s.enrichedDraft)}
              className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="학급 전체 세특 초안 간 중복 어휘/상투어구 검사 및 유의어 자동 분산 교체"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>어휘 중복도 검사 (Anti-Plagiarism) 🔍</span>
            </button>

            {/* 결과 엑셀 다운로드 */}
            <button
              onClick={() => exportResultsToExcel(students)}
              disabled={students.length === 0}
              className="px-3.5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="세특 고도화 결과를 엑셀(.xlsx) 파일로 다운로드"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>결과 엑셀</span>
            </button>

            {/* 결과 CSV 다운로드 */}
            <button
              onClick={() => exportResultsToCsv(students)}
              disabled={students.length === 0}
              className="px-3.5 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="세특 고도화 결과를 CSV(.csv) 파일로 다운로드"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>결과 CSV</span>
            </button>

            {/* 결과 HWPX 다운로드 */}
            <button
              onClick={() => exportResultsToHwpx(students)}
              disabled={students.length === 0 || students.every((s) => !s.enrichedDraft)}
              className="px-4 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="공식 NEIS 나이스 양식 규격 .hwpx 파일로 즉시 다운로드"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>결과 HWPX 다운로드 📄</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar during Batch */}
      {isProcessing && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-900">
            <span>학생 세특 초안 다양화 작성 진행 중...</span>
            <span>{progress.current} / {progress.total}명 ({Math.round((progress.current / progress.total) * 100)}%)</span>
          </div>
          <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Student List Table (Includes Email, Diversity Tag, Curriculum Code & Copy) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-bold text-slate-700 hover:text-purple-700 flex items-center gap-1.5"
            >
              {students.every((s) => s.selectedForBatch) ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>전체 선택</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-xs text-slate-800">
              학급 명단 ({students.length}명)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            생성된 초안을 직접 클릭하여 수정하거나, [재시도] 버튼으로 다시 작성할 수 있습니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">선택</th>
                <th className="py-3 px-3 w-16">학번</th>
                <th className="py-3 px-3 w-20">이름</th>
                <th className="py-3 px-3 w-32">학생 이메일</th>
                <th className="py-3 px-3 w-24">성취기준</th>
                <th className="py-3 px-3 w-36">수행평가 맥락</th>
                <th className="py-3 px-3">고도화 세특 초안 (클릭하여 수정 가능)</th>
                <th className="py-3 px-3 w-20 text-center">바이트</th>
                <th className="py-3 px-3 w-24 text-center">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const isOverflow = student.inspection?.isByteOverflow;
                const byteCount = student.byteCount || 0;
                const isRetrying = retryingId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(student.selectedForBatch)}
                        onChange={() => handleToggleSelect(student.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-600">
                      {student.studentNo}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <div className="flex items-center gap-1 font-mono text-[11px] truncate max-w-[120px]" title={student.email}>
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{student.email || `${student.studentNo}@school.hs.kr`}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {student.curriculumCode ? (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {student.curriculumCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]" title={student.context}>
                      {student.context}
                    </td>
                    <td className="py-3 px-3 text-slate-800">
                      {student.enrichedDraft ? (
                        <div className="space-y-1">
                          {student.diversityAngle && (
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              ✨ {student.diversityAngle}
                            </span>
                          )}
                          <textarea
                            rows={2}
                            value={student.enrichedDraft}
                            onChange={(e) => handleTextChange(student.id, e.target.value)}
                            className="w-full p-2 text-[11px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-hidden bg-white text-slate-800 resize-y leading-relaxed"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">작성 대기 중</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {student.enrichedDraft ? (
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isOverflow
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : byteCount >= 1200
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {byteCount}B
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRetrySingle(student.id)}
                          disabled={isRetrying}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition"
                          title="이 학생만 다시 작성"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleCopyRow(student.id, student.enrichedDraft)}
                          disabled={!student.enrichedDraft}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 font-semibold disabled:opacity-30 transition text-[11px]"
                          title="NEIS 복사"
                        >
                          {copiedId === student.id ? (
                            <span className="text-emerald-600 font-bold">복사됨!</span>
                          ) : (
                            <span>복사</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2022 Curriculum & Activity Batch Modal */}
      <CurriculumActivityPickerModal
        isOpen={isCurriculumBatchModalOpen}
        onClose={() => setIsCurriculumBatchModalOpen(false)}
        onSelectStandardAndActivity={handleApplyCurriculumToBatch}
      />

      {/* Anti-Plagiarism Cross-Audit Modal */}
      <PlagiarismModal
        isOpen={isPlagiarismModalOpen}
        onClose={() => setIsPlagiarismModalOpen(false)}
        students={students}
        onUpdateStudents={onSetStudents}
      />
    </div>
  );
};
