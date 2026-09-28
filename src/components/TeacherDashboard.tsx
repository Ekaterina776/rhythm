import React, { useState } from 'react';
import { Assignment, Submission, LineScheme } from '../types';
import { splitLineIntoSyllables, METERS, RHYME_TYPES } from '../lib/poetryEngine';
import { generateAssignmentCode } from '../lib/store';
import { EditAssignmentModal } from './EditAssignmentModal';
import {
  BookOpen,
  PlusCircle,
  Users,
  Award,
  Sparkles,
  Bot,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Scissors,
  Loader2,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

interface TeacherDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  activeTab: 'teacher_assignments' | 'create_assignment' | 'teacher_submissions';
  onSelectTab: (tab: any) => void;
  onCreateAssignment: (assignment: Assignment) => void;
  onUpdateAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onSaveTeacherComment: (submissionId: string, comment: string) => void;
  teacherName: string;
  teacherId: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  assignments,
  submissions,
  activeTab,
  onSelectTab,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onSaveTeacherComment,
  teacherName,
  teacherId,
}) => {
  // --- Assignment Management State ---
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // --- Creation Form State ---
  const [formCode, setFormCode] = useState<string>(() => generateAssignmentCode());
  const [formGrade, setFormGrade] = useState<string>('8А');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('');
  const [formLines, setFormLines] = useState<string[]>([
    'Буря мглою небо кроет,',
    'Вихри снежные крутя;',
    'То, как зверь, она завоет,',
    'То заплачет, как дитя,',
  ]);
  const [formMeter, setFormMeter] = useState<string>('4-стопный хорей');
  const [formRhyme, setFormRhyme] = useState<string>('Перекрёстная (ABAB)');
  const [parsedLines, setParsedLines] = useState<LineScheme[]>(() => {
    return [
      {
        originalText: 'Буря мглою небо кроет,',
        syllables: ['Бу', 'ря', 'мгло', 'ю', 'не', 'бо', 'кро', 'ет,'],
        expectedStresses: [true, false, true, false, true, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'Вихри снежные крутя;',
        syllables: ['Вих', 'ри', 'снеж', 'ны', 'е', 'кру', 'тя;'],
        expectedStresses: [true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5],
      },
      {
        originalText: 'То, как зверь, она завоет,',
        syllables: ['То,', 'как', 'зверь,', 'о', 'на', 'за', 'во', 'ет,'],
        expectedStresses: [true, false, true, false, false, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'То заплачет, как дитя,',
        syllables: ['То', 'за', 'пла', 'чет,', 'как', 'ди', 'тя,'],
        expectedStresses: [true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5],
      },
    ];
  });
  const [aiAnalyzingPoem, setAiAnalyzingPoem] = useState<boolean>(false);

  // --- Submissions Inspection Modal State ---
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editingComment, setEditingComment] = useState<string>('');
  const [loadingAiComment, setLoadingAiComment] = useState<boolean>(false);
  const [selectedFilterAssignmentId, setSelectedFilterAssignmentId] = useState<string>('all');

  // Parse lines when text changes
  const handleLineTextChange = (index: number, value: string) => {
    const updated = [...formLines];
    updated[index] = value;
    setFormLines(updated);

    const syls = splitLineIntoSyllables(value);
    const updatedParsed = [...parsedLines];
    updatedParsed[index] = {
      originalText: value,
      syllables: syls,
      expectedStresses: syls.map((_, i) => i % 2 === 0), // default alternate
      expectedFootDividers: [],
    };
    setParsedLines(updatedParsed);
  };

  // Toggle stress of syllable in scheme builder window
  const toggleStress = (lineIdx: number, sylIdx: number) => {
    const copy = [...parsedLines];
    copy[lineIdx].expectedStresses[sylIdx] = !copy[lineIdx].expectedStresses[sylIdx];
    setParsedLines(copy);
  };

  // Toggle foot divider in scheme builder window
  const toggleFootDivider = (lineIdx: number, sylIdx: number) => {
    const copy = [...parsedLines];
    const dividers = copy[lineIdx].expectedFootDividers;
    const exists = dividers.indexOf(sylIdx);
    if (exists >= 0) {
      dividers.splice(exists, 1);
    } else {
      dividers.push(sylIdx);
      dividers.sort((a, b) => a - b);
    }
    setParsedLines(copy);
  };

  // Auto-decompose poem with AI helper
  const handleAiAutoDecompose = async () => {
    setAiAnalyzingPoem(true);
    try {
      const fullText = formLines.join('\n');
      const res = await fetch('/api/ai/syllables-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      });
      const data = await res.json();
      if (data.success && data.data && data.data.lines) {
        const linesData = data.data.lines;
        const newParsed = formLines.map((original, i) => {
          const lData = linesData[i];
          if (lData) {
            return {
              originalText: original,
              syllables: lData.syllables || splitLineIntoSyllables(original),
              expectedStresses: lData.stresses || [true, false],
              expectedFootDividers: [1, 3, 5, 7],
            };
          }
          return parsedLines[i];
        });
        setParsedLines(newParsed);
        if (data.data.meter) setFormMeter(data.data.meter);
        if (data.data.rhyme) setFormRhyme(data.data.rhyme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzingPoem(false);
    }
  };

  // Submit new assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Build overall expected scheme string (e.g. _U/_U/_U/_U)
    const firstLineStresses = parsedLines[0]?.expectedStresses || [true, false];
    const schemeStr = firstLineStresses.map(s => (s ? '_' : 'U')).join('');

    const newAssignment: Assignment = {
      id: `assign_${Date.now()}`,
      code: formCode.trim() || generateAssignmentCode(),
      title: formTitle.trim(),
      author: formAuthor.trim() || 'Классик русской литературы',
      grade: formGrade,
      lines: formLines.filter(l => l.trim().length > 0),
      parsedLines,
      expectedScheme: schemeStr,
      meter: formMeter,
      meterType: formMeter.toLowerCase().includes('хорей')
        ? 'trochee'
        : formMeter.toLowerCase().includes('ямб')
        ? 'iamb'
        : 'other',
      rhyme: formRhyme,
      rhymeType: 'ABAB',
      createdAt: new Date().toISOString(),
      teacherId,
      teacherName,
    };

    onCreateAssignment(newAssignment);
    setFormCode(generateAssignmentCode());
    onSelectTab('teacher_assignments');
  };

  // Generate AI comment for teacher
  const handleGenerateAiComment = async () => {
    if (!selectedSubmission) return;
    setLoadingAiComment(true);
    try {
      const targetAssign = assignments.find(a => a.id === selectedSubmission.assignmentId);
      const res = await fetch('/api/ai/teacher-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedSubmission.studentName,
          poemTitle: targetAssign?.title || 'Стихотворение',
          expectedMeter: targetAssign?.meter || 'Хорей',
          studentMeter: selectedSubmission.studentMeter,
          accuracyPercent: selectedSubmission.accuracy,
          errors:
            selectedSubmission.accuracy < 100
              ? 'Ритмическая неточность в некоторых безударных слогах'
              : 'Ошибок нет',
        }),
      });
      const data = await res.json();
      if (data.recommendation) {
        setEditingComment(data.recommendation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAiComment(false);
    }
  };

  // Save comment to submission
  const handleSaveComment = () => {
    if (!selectedSubmission) return;
    onSaveTeacherComment(selectedSubmission.id, editingComment);
    setSelectedSubmission(prev => (prev ? { ...prev, teacherComment: editingComment } : null));
  };

  const filteredSubmissions = submissions.filter(s => {
    if (selectedFilterAssignmentId === 'all') return true;
    return s.assignmentId === selectedFilterAssignmentId;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Teacher Profile Banner */}
      <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
              УЧ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Кабинет преподавателя
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  Словесность
                </span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white">{teacherName}</h1>
              <p className="text-xs text-slate-400">
                Создание ритмических упражнений и контроль успеваемости учащихся
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSelectTab('create_assignment')}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Создать задание</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Counter */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Созданных заданий</span>
            <span className="text-xl font-bold text-white font-mono">{assignments.length}</span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Сданных работ</span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {submissions.filter(s => !s.isTraining).length}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Всего тренировок</span>
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {submissions.reduce((acc, s) => acc + (s.trainingCount || 0), 0)}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Средняя точность</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {submissions.length > 0
                ? Math.round(submissions.reduce((a, b) => a + b.accuracy, 0) / submissions.length)
                : 90}
              %
            </span>
          </div>
        </div>
      </div>

      {/* View 1: Created Assignments List */}
      {activeTab === 'teacher_assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              Созданные задания
            </h2>
            <button
              onClick={() => onSelectTab('create_assignment')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Добавить стихотворение</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map(a => {
              const relatedSubs = submissions.filter(s => s.assignmentId === a.id);
              const totalTrainings = relatedSubs.reduce((sum, s) => sum + (s.trainingCount || 0), 0);

              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                        {a.grade} класс
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 mb-2">{a.author}</p>

                    {/* Assignment Code for Students */}
                    <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 mb-3">
                      <div className="flex items-center space-x-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Код задания:
                        </span>
                        <span className="font-mono text-xs font-black text-white tracking-widest">
                          {a.code || 'НЕТ КОДА'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (a.code) {
                            navigator.clipboard.writeText(a.code);
                            setCopiedCode(a.code);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }
                        }}
                        className="flex items-center space-x-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Скопировать код для учеников"
                      >
                        {copiedCode === a.code ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[10px]">Копировать</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Preview 4 lines */}
                    <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 mb-3 space-y-1">
                      {a.lines.map((l, i) => (
                        <div key={i} className="font-serif text-xs text-slate-300 truncate">
                          {i + 1}. {l}
                        </div>
                      ))}
                    </div>

                    {/* Scheme and meter badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] mb-4">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300 font-mono">
                        Схема: {a.expectedScheme}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-amber-300">
                        {a.meter}
                      </span>
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-400">
                        {a.rhyme}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>
                        Сдач: <strong className="text-white">{relatedSubs.length}</strong> (тренировок: {totalTrainings})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFilterAssignmentId(a.id);
                          onSelectTab('teacher_submissions');
                        }}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ученики</span>
                        <Users className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Edit and Delete Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => setEditingAssignment(a)}
                        className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/40 hover:bg-slate-700 hover:text-amber-300 transition-colors cursor-pointer"
                        title="Редактировать стихотворение и схему"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Редактировать</span>
                      </button>
                      <button
                        onClick={() => setDeletingAssignment(a)}
                        className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Удалить задание"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Create Assignment Form */}
      {activeTab === 'create_assignment' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-400" />
                Создание нового задания по стихосложению
              </h2>
              <p className="text-xs text-slate-400">
                Заполните данные стихотворения и настройте схему размера в интерактивном окне
              </p>
            </div>

            <button
              type="button"
              onClick={handleAiAutoDecompose}
              disabled={aiAnalyzingPoem}
              className="flex items-center space-x-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition-colors"
            >
              {aiAnalyzingPoem ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ИИ анализирует строки...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>ИИ авто-схема и размер</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-6">
            {/* Row 1: Code, Grade, Title, Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-amber-400">
                    Код задания
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormCode(generateAssignmentCode())}
                    className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    title="Сгенерировать другой код"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Другой</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-amber-400/70" />
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    placeholder="742-918"
                    required
                    className="w-full rounded-xl border border-amber-500/40 bg-slate-950 pl-9 pr-3 py-2.5 text-sm text-white font-mono font-bold tracking-wider focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Класс учащихся
                </label>
                <input
                  type="text"
                  value={formGrade}
                  onChange={e => setFormGrade(e.target.value)}
                  placeholder="Например: 8А, 9Б"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название стихотворения
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Например: Зимний вечер"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Автор
                </label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={e => setFormAuthor(e.target.value)}
                  placeholder="Например: А. С. Пушкин"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: 4 lines input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Первые 4 строчки стихотворения
              </label>
              <div className="space-y-2">
                {formLines.map((line, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={line}
                      onChange={e => handleLineTextChange(idx, e.target.value)}
                      placeholder={`Строка ${idx + 1}`}
                      required
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none font-serif"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Interactive Scheme Window */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <h3 className="font-serif text-sm font-bold text-white">
                    Интерактивное окно схемы размера (_ = ударный, U = безударный, / = граница стопы)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Нажмите на слог для смены ударения • Нажмите между слогами для черты /
                </span>
              </div>

              <div className="space-y-4">
                {parsedLines.map((pLine, lIdx) => {
                  const lineDividers = new Set(pLine.expectedFootDividers);

                  return (
                    <div key={lIdx} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                      <div className="text-xs font-serif text-slate-400 mb-2">
                        {lIdx + 1}. {pLine.originalText}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2">
                        {pLine.syllables.map((syl, sIdx) => {
                          const isStressed = pLine.expectedStresses[sIdx];
                          const hasDividerAfter = lineDividers.has(sIdx);
                          const isLast = sIdx === pLine.syllables.length - 1;

                          return (
                            <React.Fragment key={sIdx}>
                              {/* Syllable bubble */}
                              <div
                                onClick={() => toggleStress(lIdx, sIdx)}
                                className="group flex flex-col items-center cursor-pointer select-none"
                              >
                                <span
                                  className={`font-mono font-bold text-sm mb-1 ${
                                    isStressed ? 'text-amber-400' : 'text-blue-400'
                                  }`}
                                >
                                  {isStressed ? '_' : 'U'}
                                </span>
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-xs font-serif border transition-colors ${
                                    isStressed
                                      ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                                      : 'border-slate-700 bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {syl}
                                </span>
                              </div>

                              {/* Vertical cut slot */}
                              {!isLast && (
                                <button
                                  type="button"
                                  onClick={() => toggleFootDivider(lIdx, sIdx)}
                                  className="h-10 w-4 flex items-center justify-center cursor-pointer mx-0.5"
                                  title="Граница стопы (/)"
                                >
                                  {hasDividerAfter ? (
                                    <div className="h-6 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                                  ) : (
                                    <div className="h-4 w-0.5 rounded-full bg-slate-800 hover:bg-amber-400/50" />
                                  )}
                                </button>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Meter and Rhyme selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Стихотворный размер
                </label>
                <input
                  type="text"
                  value={formMeter}
                  onChange={e => setFormMeter(e.target.value)}
                  placeholder="Например: 4-стопный хорей"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Тип рифмовки
                </label>
                <select
                  value={formRhyme}
                  onChange={e => setFormRhyme(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Перекрёстная (ABAB)">Перекрёстная (ABAB)</option>
                  <option value="Смежная / Парная (AABB)">Смежная / Парная (AABB)</option>
                  <option value="Кольцевая / Опоясывающая (ABBA)">Кольцевая / Опоясывающая (ABBA)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onSelectTab('teacher_assignments')}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
              >
                <span>Опубликовать задание для учащихся</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View 3: Student Submissions Table & Review Drawer */}
      {activeTab === 'teacher_submissions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Результаты учащихся и тренировки
            </h2>

            {/* Filter by assignment */}
            <select
              value={selectedFilterAssignmentId}
              onChange={e => setSelectedFilterAssignmentId(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="all">Все задания ({assignments.length})</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Submissions Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Ученик</th>
                    <th className="px-4 py-3">Задание</th>
                    <th className="px-4 py-3">Точность</th>
                    <th className="px-4 py-3">Кол-во тренировок</th>
                    <th className="px-4 py-3">Размер и рифма</th>
                    <th className="px-4 py-3">Статус отзыва</th>
                    <th className="px-4 py-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Пока нет сданных работ по выбранному заданию.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(sub => {
                      const assign = assignments.find(a => a.id === sub.assignmentId);
                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{sub.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {sub.grade || '8А'} класс
                            </div>
                          </td>
                          <td className="px-4 py-3 font-serif">
                            {assign?.title || 'Стихотворение'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-300">
                            {sub.accuracy}%
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/20">
                              {sub.trainingCount || 0} тренировок
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              {sub.meterCorrect ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              )}
                              <span className="text-[11px] text-slate-300">{sub.studentMeter}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {sub.teacherComment ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                Проверено
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                Требует отзыва
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setEditingComment(sub.teacherComment || '');
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              Проверить / Отзыв
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal / Inspector */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-amber-400">
                  Разбор работы ученика
                </span>
                <h3 className="font-serif text-xl font-bold text-white">
                  {selectedSubmission.studentName} ({selectedSubmission.grade || '8А'})
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Точность жестов</span>
                <span className="font-mono text-lg font-bold text-amber-300">
                  {selectedSubmission.accuracy}%
                </span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Количество тренировок</span>
                <span className="font-mono text-lg font-bold text-cyan-300">
                  {selectedSubmission.trainingCount || 0}
                </span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Схема стоп</span>
                <span className="font-mono text-xs font-bold text-slate-300 truncate block">
                  {selectedSubmission.dividedFeetScheme || selectedSubmission.recordedScheme}
                </span>
              </div>
            </div>

            {/* Student's Meter & Rhyme choices */}
            <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 mb-5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Определенный учеником размер:</span>
                <span className="font-semibold text-white">{selectedSubmission.studentMeter}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Определенная учеником рифма:</span>
                <span className="font-semibold text-white">{selectedSubmission.studentRhyme}</span>
              </div>
            </div>

            {/* Teacher's recommendation text field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-amber-400" />
                  <span>Рекомендации и комментарий учителя</span>
                </label>

                {/* Button: Generate comment with Gemini AI */}
                <button
                  type="button"
                  onClick={handleGenerateAiComment}
                  disabled={loadingAiComment}
                  className="flex items-center space-x-1 text-xs font-semibold text-purple-300 hover:text-purple-200"
                >
                  {loadingAiComment ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>ИИ пишет отзыв...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3.5 w-3.5 text-purple-400" />
                      <span>Сгенерировать агентом</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={editingComment}
                onChange={e => setEditingComment(e.target.value)}
                rows={4}
                placeholder="Напишите комментарий ученику (например: «Отличная ритмика, обрати внимание на 3-ю стопу...»)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 mt-5 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Закрыть
              </button>
              <button
                onClick={handleSaveComment}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md shadow-amber-500/20"
              >
                Сохранить комментарий
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Assignment Confirmation Modal */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Удалить задание?</h3>
                <p className="text-xs text-slate-400">Это действие нельзя будет отменить</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div>
                Вы действительно хотите удалить стихотворение:
              </div>
              <div className="text-sm font-bold text-white font-serif">
                «{deletingAssignment.title}»
              </div>
              <div className="text-slate-400">
                {deletingAssignment.author} • {deletingAssignment.grade} класс
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingAssignment(null)}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  onDeleteAssignment(deletingAssignment.id);
                  setDeletingAssignment(null);
                }}
                className="flex items-center space-x-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Да, удалить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        onSave={updated => {
          onUpdateAssignment(updated);
          setEditingAssignment(null);
        }}
      />
    </div>
  );
};
