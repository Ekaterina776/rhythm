import React, { useState } from 'react';
import { Assignment, StudentGestureLine } from '../types';
import { CameraTracker } from './CameraTracker';
import { sound } from '../lib/soundEffects';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Volume2,
  Bookmark,
  Camera,
  CameraOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveRhythmRunnerProps {
  assignment: Assignment;
  isTraining: boolean;
  onFinishExercise: (gestureLines: StudentGestureLine[]) => void;
  onOpenTutorial: () => void;
  onCancel: () => void;
}

export const InteractiveRhythmRunner: React.FC<InteractiveRhythmRunnerProps> = ({
  assignment,
  isTraining,
  onFinishExercise,
  onOpenTutorial,
  onCancel,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState<number>(0);
  const [allRecordedLines, setAllRecordedLines] = useState<StudentGestureLine[]>([]);
  const [currentLineGestures, setCurrentLineGestures] = useState<('_' | 'U')[]>([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);

  // Get current line details
  const parsedLine = assignment.parsedLines[currentLineIndex] || {
    originalText: assignment.lines[currentLineIndex] || '',
    syllables: ['—'],
    expectedStresses: [false],
    expectedFootDividers: [],
  };

  const syllables = parsedLine.syllables;
  const isLineComplete = currentSyllableIndex >= syllables.length;
  const isLastLine = currentLineIndex === assignment.lines.length - 1;

  // Handle gesture triggered by Camera or buttons
  const handleGesture = (gesture: '_' | 'U') => {
    if (isLineComplete) return;

    if (gesture === '_') {
      sound.playStressed();
    } else {
      sound.playUnstressed();
    }

    const updated = [...currentLineGestures, gesture];
    setCurrentLineGestures(updated);
    const nextIdx = currentSyllableIndex + 1;
    setCurrentSyllableIndex(nextIdx);

    if (nextIdx >= syllables.length) {
      sound.playSuccess();
      try {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  // Reset the current line to try again
  const handleResetCurrentLine = () => {
    setCurrentSyllableIndex(0);
    setCurrentLineGestures([]);
  };

  // Advance to next line or finish
  const handleNextLine = () => {
    const recordedLine: StudentGestureLine = {
      lineIndex: currentLineIndex,
      gestures: currentLineGestures,
    };
    const newRecordedLines = [...allRecordedLines, recordedLine];
    setAllRecordedLines(newRecordedLines);

    if (isLastLine) {
      // Finished all 4 lines!
      onFinishExercise(newRecordedLines);
    } else {
      // Go to next line
      setCurrentLineIndex(prev => prev + 1);
      setCurrentSyllableIndex(0);
      setCurrentLineGestures([]);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Exercise Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
              {assignment.grade} класс
            </span>
            {isTraining && (
              <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                Режим тренировки
              </span>
            )}
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold text-white tracking-wide">
            {assignment.title}
          </h1>
          <p className="text-xs text-slate-400">{assignment.author}</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Header Camera Toggle */}
          <button
            onClick={() => setIsCameraEnabled(prev => !prev)}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isCameraEnabled
                ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
            }`}
            title={isCameraEnabled ? 'Выключить веб-камеру' : 'Включить веб-камеру'}
          >
            {isCameraEnabled ? (
              <>
                <CameraOff className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Камера вкл</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Включить камеру</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenTutorial}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Инструкция по жестам</span>
            <span className="sm:hidden">Жесты</span>
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Main Grid: Left side poem runner, Right side camera tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Syllable Flow & Rhythm Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Progress tracker */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4 text-amber-400" />
              <span>
                Строка <strong className="text-white">{currentLineIndex + 1}</strong> из{' '}
                <strong className="text-white">{assignment.lines.length}</strong>
              </span>
            </div>
            <div className="flex space-x-1.5">
              {assignment.lines.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-8 rounded-full transition-all ${
                    idx === currentLineIndex
                      ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                      : idx < currentLineIndex
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Poetic Lines Context View */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Четверостишие
            </div>
            <div className="space-y-1.5 font-serif text-sm">
              {assignment.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-2 rounded-lg px-2.5 py-1 transition-all ${
                    idx === currentLineIndex
                      ? 'bg-amber-500/15 text-amber-200 font-semibold border-l-2 border-amber-400'
                      : idx < currentLineIndex
                      ? 'text-slate-400 line-through decoration-slate-600'
                      : 'text-slate-600'
                  }`}
                >
                  <span className="text-[10px] opacity-60 w-4">{idx + 1}.</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Flowing Syllables Stage */}
          <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl overflow-hidden min-h-[260px] flex flex-col justify-between">
            {/* Ambient lighting effect */}
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ритмический поток слогов
                </span>
                <span className="text-xs text-slate-400">
                  Слог {Math.min(currentSyllableIndex + 1, syllables.length)} из {syllables.length}
                </span>
              </div>

              {/* Syllables stream */}
              <div className="flex flex-wrap gap-2.5 items-center justify-center py-6">
                {syllables.map((syl, sIdx) => {
                  const isActive = sIdx === currentSyllableIndex;
                  const isDone = sIdx < currentSyllableIndex;
                  const recordedGesture = currentLineGestures[sIdx];

                  return (
                    <div
                      key={sIdx}
                      className={`relative flex flex-col items-center transition-all duration-200 ${
                        isActive ? 'scale-110' : ''
                      }`}
                    >
                      {/* Gesture Mark above syllable */}
                      <div className="h-8 flex items-center justify-center">
                        {isDone ? (
                          <span
                            className={`font-mono text-lg font-black transition-all animate-in zoom-in-50 ${
                              recordedGesture === '_'
                                ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                            }`}
                          >
                            {recordedGesture}
                          </span>
                        ) : isActive ? (
                          <div className="flex flex-col items-center">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                            <span className="text-[10px] text-amber-300 font-sans font-medium">ЖЕСТ</span>
                          </div>
                        ) : (
                          <span className="text-slate-700 font-mono text-xs">·</span>
                        )}
                      </div>

                      {/* Syllable bubble */}
                      <div
                        className={`rounded-xl px-3.5 py-2 font-serif text-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-b from-amber-500/30 to-amber-600/30 border-2 border-amber-400 text-amber-100 shadow-lg shadow-amber-500/30 font-bold'
                            : isDone
                            ? 'bg-slate-800/80 border border-slate-700 text-slate-200'
                            : 'bg-slate-900/60 border border-slate-800/60 text-slate-500'
                        }`}
                      >
                        {syl}
                      </div>

                      {/* Sub-label */}
                      <span className="mt-1 text-[9px] text-slate-500 font-mono">#{sIdx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line Completion & Actions Banner */}
            {isLineComplete ? (
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <span className="font-semibold text-emerald-200 text-sm">
                      Строка {currentLineIndex + 1} разобрана!
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-300 bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-700">
                    Схема: {currentLineGestures.join(' ')}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={handleResetCurrentLine}
                    className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Повторить строку</span>
                  </button>
                  <button
                    onClick={handleNextLine}
                    className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <span>
                      {isLastLine ? 'Перейти к разметке стоп' : 'Далее к следующей строке'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <span>
                  Активный слог:{' '}
                  <strong className="text-amber-300 font-serif text-sm">
                    «{syllables[currentSyllableIndex]}»
                  </strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  Покажите ребро ладони перед камерой
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: MediaPipe Hands Camera View (5 cols) */}
        <div className="lg:col-span-5">
          <CameraTracker
            onGestureTriggered={handleGesture}
            disabled={isLineComplete}
            activeSyllableText={syllables[currentSyllableIndex]}
            expectedStress={parsedLine.expectedStresses[currentSyllableIndex]}
            isCameraEnabled={isCameraEnabled}
            onToggleCamera={setIsCameraEnabled}
          />
        </div>
      </div>
    </div>
  );
};
