import React, { useState, useEffect } from 'react';
import { Assignment, Submission, User } from '../types';
import { normalizeCode } from '../lib/store';
import {
  ListOrdered,
  Award,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  BookOpen,
  KeyRound,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  assignments: Assignment[];
  submissions: Submission[];
  activeTab: 'student_available' | 'student_completed';
  onStartAssignment: (assignment: Assignment, isTraining: boolean) => void;
  onViewSubmission: (assignment: Assignment, submission: Submission) => void;
  onOpenTutorial: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  assignments,
  submissions,
  activeTab,
  onStartAssignment,
  onViewSubmission,
  onOpenTutorial,
}) => {
  const STORAGE_KEY_UNLOCKED = `ritmostikh_unlocked_assignments_${currentUser.id}`;

  // Submissions made by this student
  const studentSubs = submissions.filter(
    s => s.studentId === currentUser.id || s.studentEmail === currentUser.email
  );

  // Unlocked assignment IDs for this student
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    // Auto-include assignments the student has already submitted
    return studentSubs.map(s => s.assignmentId);
  });

  const [codeInput, setCodeInput] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);
  const [showDemoCodes, setShowDemoCodes] = useState<boolean>(false);

  // Sync unlocked assignments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedIds));
    } catch {}
  }, [unlockedIds, STORAGE_KEY_UNLOCKED]);

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase() || 'УЧ';
  };

  // Handle entering assignment code
  const handleOpenByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);

    const trimmed = codeInput.trim();
    if (!trimmed) {
      setCodeError('Пожалуйста, введите код задания');
      return;
    }

    const norm = normalizeCode(trimmed);

    // Look for matching assignment by code or id
    const matched = assignments.find(
      a => (a.code && normalizeCode(a.code) === norm) || normalizeCode(a.id) === norm
    );

    if (!matched) {
      setCodeError(
        `Задание с кодом «${trimmed}» не найдено. Проверьте правильность кода или уточните его у учителя.`
      );
      return;
    }

    // Unlock assignment
    if (!unlockedIds.includes(matched.id)) {
      setUnlockedIds(prev => [...prev, matched.id]);
    }

    setCodeSuccess(`Задание «${matched.title}» (${matched.author}) успешно открыто!`);
    setCodeInput('');

    // Smooth scroll down to the newly unlocked assignment card
    setTimeout(() => {
      const el = document.getElementById(`assignment_card_${matched.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Filter only the unlocked assignments for this student
  const visibleAssignments = assignments.filter(
    a => unlockedIds.includes(a.id) || studentSubs.some(s => s.assignmentId === a.id)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Student Welcome Banner */}
      <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
              {getInitials(currentUser.name)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Ученик {currentUser.grade || '8А'} класса
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  Интерактивная словесность
                </span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white">{currentUser.name}</h1>
              <p className="text-xs text-slate-400">
                Введите код задания от учителя для доступа к стихотворению и разбору размера жестами
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTutorial}
            className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>Памятка жестов</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4">
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Открыто по коду</span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {visibleAssignments.length}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Пройдено заданий</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {studentSubs.length}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Количество тренировок</span>
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {studentSubs.reduce((acc, s) => acc + (s.trainingCount || 0), 0)}
            </span>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Средняя точность</span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {studentSubs.length > 0
                ? Math.round(studentSubs.reduce((a, b) => a + b.accuracy, 0) / studentSubs.length)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>

      {/* Available Assignments / Code Input Tab */}
      {activeTab === 'student_available' && (
        <div className="space-y-8">
          {/* 1. Enter Assignment Code Card */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center space-x-2 text-amber-400 mb-2">
                <KeyRound className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Доступ к заданию по коду
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-white mb-2">
                Введите код задания от учителя
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Учитель генерирует специальный код при создании задания. Введите его ниже, чтобы открыть стихотворение и выполнить разбор стоп и размера.
              </p>

              {/* Code Input Form */}
              <form onSubmit={handleOpenByCode} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-400/80" />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => {
                      setCodeInput(e.target.value.toUpperCase());
                      setCodeError(null);
                    }}
                    placeholder="Например: 741-201"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 pl-10 pr-4 py-3 text-base text-white font-mono font-bold tracking-widest placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-600 focus:border-amber-400 focus:outline-none shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Unlock className="h-4 w-4" />
                  <span>Открыть задание</span>
                </button>
              </form>

              {/* Error Message */}
              {codeError && (
                <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{codeError}</span>
                </div>
              )}

              {/* Success Message */}
              {codeSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{codeSuccess}</span>
                </div>
              )}

              {/* Demo Codes Helper Toggle */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowDemoCodes(prev => !prev)}
                  className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{showDemoCodes ? 'Скрыть демонстрационные коды' : 'Показать примеры кодов для проверки'}</span>
                </button>

                {showDemoCodes && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs animate-in fade-in">
                    {assignments.slice(0, 3).map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setCodeInput(a.code);
                          setCodeError(null);
                        }}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-mono font-bold text-amber-400">{a.code}</span>
                        <span className="text-slate-400">({a.title})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Unlocked Assignments List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-400" />
                Мои открытые задания
              </h3>
              <span className="text-xs text-slate-400">
                Открыто: {visibleAssignments.length}
              </span>
            </div>

            {visibleAssignments.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-10 text-center">
                <Lock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="font-serif text-lg font-bold text-white">Список заданий пуст</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Вы пока не открыли ни одного задания. Введите код от учителя в поле выше, чтобы добавить стихотворение в свой личный список.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleAssignments.map(assign => {
                  const userSub = studentSubs.find(s => s.assignmentId === assign.id);

                  return (
                    <div
                      key={assign.id}
                      id={`assignment_card_${assign.id}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                            {assign.grade} класс
                          </span>
                          {/* Code pill */}
                          <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-amber-400 border border-slate-800 font-bold">
                            Код: {assign.code}
                          </span>
                        </div>

                        <h4 className="font-serif text-lg font-bold text-white">{assign.title}</h4>
                        <p className="text-xs text-slate-400 mb-2">{assign.author}</p>

                        {/* Teacher attribution */}
                        <p className="text-[11px] text-slate-500 mb-3">
                          Учитель: <span className="text-slate-400">{assign.teacherName}</span>
                        </p>

                        {/* Poetic preview */}
                        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 mb-4 space-y-1">
                          {assign.lines.slice(0, 2).map((l, i) => (
                            <div key={i} className="font-serif text-xs text-slate-300 italic">
                              «{l}»
                            </div>
                          ))}
                        </div>

                        {/* Status */}
                        {userSub ? (
                          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold mb-3">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Сдано • Точность {userSub.accuracy}%</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 mb-3">
                            Статус: ожидает выполнения
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                        {userSub ? (
                          <div className="flex items-center space-x-2 w-full">
                            <button
                              onClick={() => onViewSubmission(assign, userSub)}
                              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors text-center cursor-pointer"
                            >
                              Результат и отзыв
                            </button>
                            <button
                              onClick={() => onStartAssignment(assign, true)}
                              title="Тренироваться заново"
                              className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-2 text-cyan-300 hover:bg-cyan-900/40 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onStartAssignment(assign, false)}
                            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 cursor-pointer"
                          >
                            <Play className="h-4 w-4 fill-slate-950" />
                            <span>Начать разбор жестами</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Assignments Tab */}
      {activeTab === 'student_completed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Пройденные задания и отзывы
            </h2>
            <span className="text-xs text-slate-400">
              Сдано: {studentSubs.length} заданий
            </span>
          </div>

          {studentSubs.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
              <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-white">Вы еще не сдали ни одного задания</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Введите код от учителя во вкладке «Задания» и выполните интерактивный разбор стихотворения жестами рук.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {studentSubs.map(sub => {
                const assign = assignments.find(a => a.id === sub.assignmentId);

                return (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 font-mono">
                          {sub.accuracy}% точности
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-white">
                        {assign?.title || 'Стихотворение'}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">{assign?.author}</p>

                      {/* Scansion scheme */}
                      <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 mb-3 font-mono text-xs flex items-center justify-between">
                        <span className="text-slate-400">Схема стоп:</span>
                        <span className="text-amber-300 font-bold">
                          {sub.dividedFeetScheme || sub.recordedScheme}
                        </span>
                      </div>

                      {/* Training counter */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>Тренировок:</span>
                        <span className="font-semibold text-cyan-300">
                          {sub.trainingCount || 0} раз
                        </span>
                      </div>

                      {/* Teacher's comment preview */}
                      {sub.teacherComment && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-3 mb-3 text-xs">
                          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px] mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>Отзыв преподавателя:</span>
                          </div>
                          <p className="italic text-slate-300 line-clamp-2">
                            «{sub.teacherComment}»
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                      <button
                        onClick={() => assign && onViewSubmission(assign, sub)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Открыть разбор и рекомендации</span>
                      </button>

                      {assign && (
                        <button
                          onClick={() => onStartAssignment(assign, true)}
                          className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Тренировка</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
