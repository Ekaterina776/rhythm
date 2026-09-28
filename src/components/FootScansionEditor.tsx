import React, { useState } from 'react';
import { Assignment, StudentGestureLine } from '../types';
import { METERS, RHYME_TYPES } from '../lib/poetryEngine';
import { sound } from '../lib/soundEffects';
import {
  Scissors,
  Check,
  Send,
  HelpCircle,
  Sparkles,
  BookOpen,
  Split,
  ChevronRight,
} from 'lucide-react';

interface FootScansionEditorProps {
  assignment: Assignment;
  isTraining: boolean;
  gestureLines: StudentGestureLine[];
  onSubmit: (data: {
    dividedScheme: string;
    studentDividers: number[][];
    studentMeter: string;
    studentRhyme: string;
  }) => void;
  onOpenTutorial: () => void;
}

export const FootScansionEditor: React.FC<FootScansionEditorProps> = ({
  assignment,
  isTraining,
  gestureLines,
  onSubmit,
  onOpenTutorial,
}) => {
  // Dividers for each line: array of syllable indices after which a vertical bar is placed
  const [dividers, setDividers] = useState<number[][]>(() => {
    return assignment.lines.map(() => []);
  });

  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [customMeterText, setCustomMeterText] = useState<string>('');
  const [selectedRhyme, setSelectedRhyme] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Toggle vertical separator line after syllable index `sIdx` in line `lineIdx`
  const toggleDivider = (lineIdx: number, sIdx: number) => {
    sound.playSeparator();
    setDividers(prev => {
      const copy = prev.map((arr, i) => (i === lineIdx ? [...arr] : arr));
      const lineDividers = copy[lineIdx];
      const existing = lineDividers.indexOf(sIdx);
      if (existing >= 0) {
        lineDividers.splice(existing, 1);
      } else {
        lineDividers.push(sIdx);
        lineDividers.sort((a, b) => a - b);
      }
      return copy;
    });
  };

  // Quick auto-split button (for guidance / assistance)
  const applyFootPattern = (footLength: number) => {
    sound.playSeparator();
    setDividers(prev => {
      return assignment.lines.map((_, lIdx) => {
        const sylCount = assignment.parsedLines[lIdx]?.syllables.length || 8;
        const autoCuts: number[] = [];
        for (let s = footLength - 1; s < sylCount; s += footLength) {
          autoCuts.push(s);
        }
        return autoCuts;
      });
    });
  };

  // Construct readable formula with /
  const getLineSchemeString = (lineIdx: number): string => {
    const gestures = gestureLines[lineIdx]?.gestures || [];
    const lineCuts = new Set(dividers[lineIdx] || []);
    let str = '';
    for (let i = 0; i < gestures.length; i++) {
      str += gestures[i];
      if (lineCuts.has(i) && i < gestures.length - 1) {
        str += ' / ';
      }
    }
    return str;
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const finalMeter = selectedMeter || customMeterText.trim();
    if (!finalMeter) {
      setValidationError('Пожалуйста, выберите или впишите стихотворный размер.');
      return;
    }

    if (!selectedRhyme) {
      setValidationError('Пожалуйста, укажите тип рифмовки.');
      return;
    }

    // Build overall divided scheme
    const fullDivided = assignment.lines
      .map((_, i) => getLineSchemeString(i))
      .filter(Boolean)
      .join(' \n ');

    onSubmit({
      dividedScheme: fullDivided,
      studentDividers: dividers,
      studentMeter: finalMeter,
      studentRhyme: selectedRhyme,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                Этап 2: Разметка стоп и схема
              </span>
              {isTraining && (
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                  Тренировка
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
              {assignment.title} — определение размера
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ваши жесты распознаны! Нажмите между слогами, чтобы провести вертикальную линию и разделить стопы. Затем укажите размер и рифму.
            </p>
          </div>

          <button
            onClick={onOpenTutorial}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>Справка по размерам</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        {/* Scansion Board: 4 lines with gestures and clickable vertical foot cut slots */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Scissors className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-white">
                Расстановка границ стоп (вертикальные линии)
              </h2>
            </div>

            {/* Quick helper shortcuts */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Быстрое деление:</span>
              <button
                type="button"
                onClick={() => applyFootPattern(2)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                По 2 слога (ямб/хорей)
              </button>
              <button
                type="button"
                onClick={() => applyFootPattern(3)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                По 3 слога (дактиль/...)
              </button>
            </div>
          </div>

          {/* Lines breakdown */}
          <div className="space-y-6">
            {assignment.lines.map((originalLine, lineIdx) => {
              const parsed = assignment.parsedLines[lineIdx];
              const syllables = parsed?.syllables || [];
              const recordedGestures = gestureLines[lineIdx]?.gestures || [];
              const lineDividersSet = new Set(dividers[lineIdx] || []);

              return (
                <div
                  key={lineIdx}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-serif font-semibold text-slate-300">
                      Строка {lineIdx + 1}: «{originalLine}»
                    </span>
                    <span className="font-mono text-amber-300 font-semibold text-[11px]">
                      Схема: {getLineSchemeString(lineIdx) || '—'}
                    </span>
                  </div>

                  {/* Syllables and vertical separator click zones */}
                  <div className="flex flex-wrap items-center gap-y-3 py-2">
                    {syllables.map((syl, sIdx) => {
                      const gesture = recordedGestures[sIdx] || 'U';
                      const isStressed = gesture === '_';
                      const hasDividerAfter = lineDividersSet.has(sIdx);
                      const isLastSyllable = sIdx === syllables.length - 1;

                      return (
                        <React.Fragment key={sIdx}>
                          {/* Syllable Block */}
                          <div className="flex flex-col items-center">
                            {/* Stressed / Unstressed mark */}
                            <span
                              className={`font-mono text-base font-black mb-1 ${
                                isStressed
                                  ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                  : 'text-blue-400'
                              }`}
                            >
                              {gesture}
                            </span>

                            {/* Syllable text bubble */}
                            <div className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 font-serif text-sm text-slate-100 shadow-sm">
                              {syl}
                            </div>
                          </div>

                          {/* Interactive Separator Slot */}
                          {!isLastSyllable && (
                            <button
                              type="button"
                              onClick={() => toggleDivider(lineIdx, sIdx)}
                              title="Нажмите, чтобы провести или убрать вертикальную черту стопы (/)"
                              className="group relative flex h-14 w-6 items-center justify-center cursor-pointer transition-all mx-0.5"
                            >
                              {hasDividerAfter ? (
                                <div className="h-10 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                              ) : (
                                <div className="h-8 w-0.5 rounded-full bg-slate-700/50 group-hover:bg-amber-400/60 group-hover:w-1 transition-all" />
                              )}
                              <span className="sr-only">Разделитель стопы</span>
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

        {/* Meter and Rhyme Selection Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Poetic Meter Field */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <label className="block font-serif text-sm font-bold text-white mb-2">
              Стихотворный размер
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Выберите или впишите определенный размер (например, Хорей, Ямб, Дактиль):
            </p>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {METERS.map(m => (
                <button
                  type="button"
                  key={m.name}
                  onClick={() => {
                    setSelectedMeter(`${m.name}`);
                    setCustomMeterText(`${m.name}`);
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedMeter === m.name
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Input field with custom specification (e.g. 4-стопный хорей) */}
            <input
              type="text"
              value={customMeterText}
              onChange={e => {
                setCustomMeterText(e.target.value);
                setSelectedMeter(e.target.value);
              }}
              placeholder="Например: 4-стопный хорей"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Rhyme Type Field */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <label className="block font-serif text-sm font-bold text-white mb-2">
              Тип рифмовки
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Определите порядок рифмующихся строк четверостишия:
            </p>

            <div className="space-y-2">
              {RHYME_TYPES.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedRhyme === r.name
                      ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="rhyme"
                      checked={selectedRhyme === r.name}
                      onChange={() => setSelectedRhyme(r.name)}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {validationError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300">
            {validationError}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-bold text-slate-950 shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all text-sm"
          >
            <span>Сдать на проверку</span>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
