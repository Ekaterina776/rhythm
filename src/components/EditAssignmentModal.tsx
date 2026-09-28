import React, { useState, useEffect } from 'react';
import { Assignment, LineScheme } from '../types';
import { splitLineIntoSyllables, METERS, RHYME_TYPES } from '../lib/poetryEngine';
import {
  X,
  Edit3,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Plus,
  BookOpen,
} from 'lucide-react';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSave: (updatedAssignment: Assignment) => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [grade, setGrade] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [parsedLines, setParsedLines] = useState<LineScheme[]>([]);
  const [meter, setMeter] = useState('4-стопный хорей');
  const [rhyme, setRhyme] = useState('Перекрёстная (ABAB)');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    if (assignment) {
      setCode(assignment.code || '');
      setGrade(assignment.grade);
      setTitle(assignment.title);
      setAuthor(assignment.author);
      setLines(assignment.lines);
      setParsedLines(assignment.parsedLines);
      setMeter(assignment.meter);
      setRhyme(assignment.rhyme);
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleLineChange = (index: number, val: string) => {
    const updatedLines = [...lines];
    updatedLines[index] = val;
    setLines(updatedLines);

    const syls = splitLineIntoSyllables(val);
    const updatedParsed = [...parsedLines];
    if (updatedParsed[index]) {
      updatedParsed[index] = {
        originalText: val,
        syllables: syls,
        expectedStresses: syls.map((_, i) =>
          updatedParsed[index].expectedStresses[i] !== undefined
            ? updatedParsed[index].expectedStresses[i]
            : i % 2 === 0
        ),
        expectedFootDividers: updatedParsed[index].expectedFootDividers.filter(d => d < syls.length),
      };
    } else {
      updatedParsed[index] = {
        originalText: val,
        syllables: syls,
        expectedStresses: syls.map((_, i) => i % 2 === 0),
        expectedFootDividers: [1, 3, 5, 7],
      };
    }
    setParsedLines(updatedParsed);
  };

  const handleAddLine = () => {
    setLines([...lines, '']);
    setParsedLines([
      ...parsedLines,
      {
        originalText: '',
        syllables: [],
        expectedStresses: [],
        expectedFootDividers: [],
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
    setParsedLines(parsedLines.filter((_, i) => i !== index));
  };

  const toggleStress = (lineIdx: number, sylIdx: number) => {
    const copy = [...parsedLines];
    if (!copy[lineIdx]) return;
    copy[lineIdx].expectedStresses[sylIdx] = !copy[lineIdx].expectedStresses[sylIdx];
    setParsedLines(copy);
  };

  const toggleFootDivider = (lineIdx: number, sylIdx: number) => {
    const copy = [...parsedLines];
    if (!copy[lineIdx]) return;
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

  const handleAiAutoDecompose = async () => {
    setAiAnalyzing(true);
    try {
      const fullText = lines.join('\n');
      const res = await fetch('/api/ai/syllables-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      });
      const data = await res.json();
      if (data.success && data.data && data.data.lines) {
        const linesData = data.data.lines;
        const newParsed = lines.map((original, i) => {
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
        if (data.data.meter) setMeter(data.data.meter);
        if (data.data.rhyme) setRhyme(data.data.rhyme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const firstLineStresses = parsedLines[0]?.expectedStresses || [true, false];
    const schemeStr = firstLineStresses.map(s => (s ? '_' : 'U')).join('');

    const updated: Assignment = {
      ...assignment,
      code: code.trim() || assignment.code,
      title: title.trim(),
      author: author.trim() || 'Классик русской литературы',
      grade: grade.trim() || '8А',
      lines: lines.filter(l => l.trim().length > 0),
      parsedLines,
      expectedScheme: schemeStr,
      meter,
      meterType: meter.toLowerCase().includes('хорей')
        ? 'trochee'
        : meter.toLowerCase().includes('ямб')
        ? 'iamb'
        : 'other',
      rhyme,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Редактирование задания</h2>
              <p className="text-xs text-slate-400">
                Изменение стихотворного текста, разметки стоп и кода доступа для учеников
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAiAutoDecompose}
              disabled={aiAnalyzing}
              className="flex items-center space-x-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition-colors cursor-pointer"
            >
              {aiAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Анализ ИИ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>ИИ авто-разметка</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Code, Grade, Title, Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Код для учеников
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="741-201"
                required
                className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3.5 py-2.5 text-sm text-white font-mono font-bold tracking-wider focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Класс учащихся
              </label>
              <input
                type="text"
                value={grade}
                onChange={e => setGrade(e.target.value)}
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
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Автор стихотворения
              </label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Lines input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Стихотворные строки
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Добавить строку</span>
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-6 text-center text-xs font-mono text-slate-500">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={line}
                    onChange={e => handleLineChange(idx, e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white font-serif focus:border-amber-400 focus:outline-none"
                  />
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Interactive syllable scansion editor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Интерактивная разметка слогов и стоп
              </span>
              <span className="text-[11px] text-slate-400">
                Кликайте по слогу для смены ударности [_] / [U]
              </span>
            </div>

            <div className="space-y-3">
              {parsedLines.map((pLine, lIdx) => (
                <div key={lIdx} className="space-y-1">
                  <div className="text-[11px] text-slate-400 font-serif">
                    {lIdx + 1}. {pLine.originalText || lines[lIdx]}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pLine.syllables.map((syl, sIdx) => {
                      const isStressed = pLine.expectedStresses[sIdx];
                      const isDivider = pLine.expectedFootDividers?.includes(sIdx);

                      return (
                        <React.Fragment key={sIdx}>
                          <button
                            type="button"
                            onClick={() => toggleStress(lIdx, sIdx)}
                            className={`flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              isStressed
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span className="font-mono text-[10px]">
                              {isStressed ? '— [_]' : '∪ [U]'}
                            </span>
                            <span>{syl}</span>
                          </button>

                          {/* Foot Divider toggle button */}
                          <button
                            type="button"
                            onClick={() => toggleFootDivider(lIdx, sIdx)}
                            title="Граница стопы"
                            className={`h-7 px-1 rounded transition-colors text-xs font-mono font-bold cursor-pointer ${
                              isDivider
                                ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
                                : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            /
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Meter & Rhyme selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Стихотворный размер
              </label>
              <select
                value={meter}
                onChange={e => setMeter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                {METERS.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Тип рифмовки
              </label>
              <select
                value={rhyme}
                onChange={e => setRhyme(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              >
                {RHYME_TYPES.map(r => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
