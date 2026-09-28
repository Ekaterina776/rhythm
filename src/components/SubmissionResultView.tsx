import React, { useState } from 'react';
import { Assignment, Submission } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Bot,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmissionResultViewProps {
  assignment: Assignment;
  submission: Submission;
  onRestartAsTraining: () => void;
  onBackToList: () => void;
  onUpdateSubmissionAi: (subId: string, aiText: string) => void;
}

export const SubmissionResultView: React.FC<SubmissionResultViewProps> = ({
  assignment,
  submission,
  onRestartAsTraining,
  onBackToList,
  onUpdateSubmissionAi,
}) => {
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Trigger confetti if score is high
  React.useEffect(() => {
    if (submission.accuracy >= 75) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [submission.accuracy]);

  const handleRequestAiRecommendations = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/analyze-student-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poemTitle: assignment.title,
          poemAuthor: assignment.author,
          lines: assignment.lines,
          expectedScheme: assignment.expectedScheme,
          expectedMeter: assignment.meter,
          expectedRhyme: assignment.rhyme,
          studentRecordedScheme: submission.recordedScheme,
          studentFeetScheme: submission.dividedFeetScheme,
          studentMeter: submission.studentMeter,
          studentRhyme: submission.studentRhyme,
          attemptsCount: submission.trainingCount,
          isTraining: submission.isTraining,
        }),
      });

      const data = await response.json();
      if (data.text) {
        onUpdateSubmissionAi(submission.id, data.text);
      } else {
        setAiError('Не удалось получить ответ ИИ-агента');
      }
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setAiError('Ошибка соединения с ИИ-сервером');
    } finally {
      setLoadingAi(false);
    }
  };

  const isHighAccuracy = submission.accuracy >= 80;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToList}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>К списку заданий</span>
        </button>

        <div className="flex items-center space-x-2">
          {submission.isTraining ? (
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
              Категория: Тренировка (не влияет на оценку)
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              Основная сдача
            </span>
          )}
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
            Тренировок: {submission.trainingCount || 0}
          </span>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Результат выполнения задания
            </span>
            <h1 className="mt-1 font-serif text-3xl font-bold text-white tracking-wide">
              {assignment.title}
            </h1>
            <p className="text-sm text-slate-400">{assignment.author}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2">
                <span className="text-[11px] text-slate-500 block">Стихотворный размер</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {submission.meterCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="text-xs font-semibold text-white">
                    {submission.studentMeter}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2">
                <span className="text-[11px] text-slate-500 block">Тип рифмовки</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {submission.rhymeCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="text-xs font-semibold text-white">
                    {submission.studentRhyme}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accuracy Score Dial */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={289}
                  strokeDashoffset={289 - (289 * submission.accuracy) / 100}
                  strokeLinecap="round"
                  className={isHighAccuracy ? 'text-amber-400' : 'text-blue-400'}
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white font-mono">
                  {submission.accuracy}%
                </span>
                <span className="text-[10px] text-slate-400 block">Точность</span>
              </div>
            </div>
            <span className="mt-2 text-xs font-medium text-slate-300">
              {isHighAccuracy ? 'Отличное чувство ритма!' : 'Хорошая попытка!'}
            </span>
          </div>
        </div>
      </div>

      {/* Rhythmic Scansion Breakdown Table */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-400" />
          Детальное сравнение схемы (Жесты ученика vs Эталон)
        </h2>

        <div className="space-y-4">
          {assignment.lines.map((lineText, lIdx) => {
            const parsed = assignment.parsedLines[lIdx];
            const syllables = parsed?.syllables || [];
            const gestures = submission.gestureLines[lIdx]?.gestures || [];

            return (
              <div
                key={lIdx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4"
              >
                <div className="text-xs font-serif text-slate-300 font-medium mb-3">
                  Строка {lIdx + 1}: «{lineText}»
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {syllables.map((syl, sIdx) => {
                    const studentGesture = gestures[sIdx] || 'U';
                    const expStress = parsed?.expectedStresses[sIdx] ?? false;
                    const isStudentStressed = studentGesture === '_';
                    const isMatch = isStudentStressed === expStress;

                    return (
                      <div
                        key={sIdx}
                        className={`flex flex-col items-center rounded-lg border p-2 min-w-[42px] ${
                          isMatch
                            ? 'border-emerald-500/30 bg-emerald-950/20'
                            : 'border-rose-500/40 bg-rose-950/20'
                        }`}
                      >
                        <span
                          className={`font-mono font-black text-sm ${
                            isMatch ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {studentGesture}
                        </span>
                        <span className="font-serif text-xs text-slate-200 mt-1">{syl}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                          эт: {expStress ? '_' : 'U'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Literary Coach Recommendations (Gemini Powered) */}
      <div className="mb-8 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Анализ и персональные рекомендации ИИ-агента
              </h3>
              <p className="text-xs text-purple-300/80">
                Литературоведческий разбор ритма и советы по жестикуляции
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestAiRecommendations}
            disabled={loadingAi}
            className="flex items-center space-x-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingAi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>ИИ анализирует...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  {submission.aiRecommendations
                    ? 'Обновить разбор агентом'
                    : 'Просмотреть ошибки и рекомендации'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* AI Content Area */}
        {submission.aiRecommendations ? (
          <div className="rounded-xl border border-purple-500/20 bg-slate-950/80 p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {submission.aiRecommendations}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-purple-500/30 bg-slate-950/40 p-6 text-center">
            <Sparkles className="h-6 w-6 text-purple-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-slate-400">
              Нажмите кнопку выше, чтобы ИИ-агент проанализировал каждую стопу, выявил ритмические сбои и дал советы по движениям рук.
            </p>
          </div>
        )}

        {aiError && (
          <div className="mt-2 text-xs text-rose-400 font-medium">{aiError}</div>
        )}
      </div>

      {/* Teacher's Personal Feedback Card */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center space-x-2.5 mb-3">
          <MessageSquare className="h-5 w-5 text-amber-400" />
          <h3 className="font-serif text-base font-bold text-white">
            Комментарий учителя ({assignment.teacherName})
          </h3>
        </div>

        {submission.teacherComment ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 text-xs text-slate-200 leading-relaxed">
            <p className="font-serif text-sm italic text-amber-100 mb-2">
              «{submission.teacherComment}»
            </p>
            {submission.teacherCommentDate && (
              <span className="text-[10px] text-slate-500">
                Дата отзыва: {new Date(submission.teacherCommentDate).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-xs text-slate-500">
            Учитель еще не проверил работу. Как только комментарий будет оставлен, он появится здесь.
          </div>
        )}
      </div>

      {/* Action Footer: Practice Again */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h4 className="text-sm font-semibold text-white">Хотите улучшить технику жестов?</h4>
          <p className="text-xs text-slate-400">
            Повторный запуск не изменит первую зачетную оценку, а добавит тренировку в ваш профиль.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRestartAsTraining}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 transition-all active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Начать заново (Тренировка)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
