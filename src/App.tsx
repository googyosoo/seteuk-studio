import { useState, useEffect } from 'react';
import { StudentRecord } from './types';
import { SAMPLE_STUDENTS } from './lib/sampleData';
import { Header } from './components/Header';
import { SingleStudentStudio } from './components/SingleStudentStudio';
import { BatchStudio } from './components/BatchStudio';
import { RulebookExplorer } from './components/RulebookExplorer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { NeisMiniDock } from './components/NeisMiniDock';
import { inspectSeteuk } from './lib/inspector';

const STORAGE_KEY_STUDENTS = 'seteuk_students_v1';
const STORAGE_KEY_API_KEY = 'seteuk_ai_key_v1';
const STORAGE_KEY_MODEL = 'seteuk_ai_model_v1';

export function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'rulebook'>('single');
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved students:', e);
      }
    }
    return SAMPLE_STUDENTS;
  });

  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return students[0]?.id || 'sample-1';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-2.5-flash';
  });

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isMiniDockOpen, setIsMiniDockOpen] = useState(false);

  // 학생 명단 변경 시 LocalStorage 영구 보존
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  const handleUpdateStudent = (updatedStudent: StudentRecord) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleAddStudent = () => {
    const newId = `student-${Date.now()}`;
    const nextNo = `101${String(students.length + 1).padStart(2, '0')}`;
    const newStudent: StudentRecord = {
      id: newId,
      studentNo: nextNo,
      name: `학생${students.length + 1}`,
      subject: '공통영어1',
      context: '수업 탐구 활동 및 과제',
      rawDraft: '',
      enrichedDraft: '',
      byteCount: 0,
      charCount: 0,
      status: 'idle',
      inspection: inspectSeteuk(''),
    };
    setStudents((prev) => [...prev, newStudent]);
    setActiveStudentId(newId);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('해당 학생의 세특 데이터를 삭제하시겠습니까?')) {
      const filtered = students.filter((s) => s.id !== id);
      setStudents(filtered);
      if (filtered.length > 0) {
        setActiveStudentId(filtered[0].id);
      }
    }
  };

  const handleResetSamples = () => {
    if (confirm('샘플 데이터 4건으로 초기화하시겠습니까? 기존 작업 내용은 덮어씌워집니다.')) {
      setStudents(SAMPLE_STUDENTS);
      setActiveStudentId(SAMPLE_STUDENTS[0].id);
    }
  };

  const handleSaveApiKey = (key: string, model: string) => {
    setApiKey(key);
    setSelectedModel(model);
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
    localStorage.setItem(STORAGE_KEY_MODEL, model);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onResetSamples={handleResetSamples}
        hasApiKey={Boolean(apiKey && apiKey.length > 5)}
        selectedModel={selectedModel}
        isMiniDockOpen={isMiniDockOpen}
        onToggleMiniDock={() => setIsMiniDockOpen((prev) => !prev)}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'single' && (
          <SingleStudentStudio
            students={students}
            activeStudentId={activeStudentId}
            onSelectStudent={setActiveStudentId}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            apiKey={apiKey}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === 'batch' && (
          <BatchStudio
            students={students}
            onSetStudents={setStudents}
            apiKey={apiKey}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === 'rulebook' && <RulebookExplorer />}
      </main>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
      />

      <NeisMiniDock
        isOpen={isMiniDockOpen}
        onClose={() => setIsMiniDockOpen(false)}
        students={students}
        activeStudentId={activeStudentId}
        onSelectStudent={setActiveStudentId}
      />

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SOHO Seteuk Optimizer</span>
            <span>·</span>
            <span>2026 대한민국 교육부 학교생활기록부 기재요령 표준 준수</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Upstage Solar Pro AI 실시간 추론</span>
            <span>·</span>
            <span>NEIS 1500B 바이트 엔진 (한글 3B)</span>
            <span>·</span>
            <span>개인정보 100% 로컬 암호화</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
