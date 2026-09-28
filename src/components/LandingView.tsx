import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Hand,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Award,
  Video,
  Camera,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../lib/soundEffects';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingViewProps {
  onStartAsStudent: () => void;
  onStartAsTeacher: () => void;
  onTryInteractiveDemo: () => void;
  onOpenTutorial: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartAsStudent,
  onStartAsTeacher,
  onTryInteractiveDemo,
  onOpenTutorial,
}) => {
  // Interactive Simulated Video Demo Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [demoStep, setDemoStep] = useState<number>(0); // 0 to 7 syllables in "Бу-ря-мгло-ю-не-бо-кро-ет"
  const [videoTime, setVideoTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.75, 1, 1.25
  const [soundOn, setSoundOn] = useState<boolean>(true);

  const demoSyllables = [
    { text: 'Бу', stress: true, char: '_' },
    { text: 'ря', stress: false, char: 'U' },
    { text: 'мгло', stress: true, char: '_' },
    { text: 'ю', stress: false, char: 'U' },
    { text: 'не', stress: true, char: '_' },
    { text: 'бо', stress: false, char: 'U' },
    { text: 'кро', stress: true, char: '_' },
    { text: 'ет', stress: false, char: 'U' },
  ];

  // Video playback loop simulation
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / playbackSpeed);

    const timer = setInterval(() => {
      setDemoStep(prev => {
        const next = (prev + 1) % demoSyllables.length;
        const currentS = demoSyllables[next];
        if (soundOn) {
          if (currentS.stress) {
            sound.playStressed();
          } else {
            sound.playUnstressed();
          }
        }
        return next;
      });
      setVideoTime(t => (t >= 8 ? 0 : t + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, soundOn]);

  const activeDemoSyl = demoSyllables[demoStep];

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 min-h-screen">
      {/* Background atmospheric glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header Section */}
      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 text-center">
        {/* Top Feature Badge */}
        <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-md mb-6 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Образовательная платформа стихосложения нового поколения</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-amber-200/80 font-normal">MediaPipe Hands AI</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto break-words">
          Определяйте стихотворные размеры{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
            жестами рук
          </span>{' '}
          перед камерой
        </h1>

        {/* Subtitle with deep pedagogical context */}
        <p className="mt-4 sm:mt-5 max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-sans px-2">
          Интерактивный тренажер <strong>«РитмоСтих»</strong> развивает физическое и моторное чувство ритма русской поэзии.
          Учащиеся читают стихи и отбивают такт жестами ребра ладони:
          <span className="text-amber-300 font-semibold"> вертикально для ударного слога [_]</span> и{' '}
          <span className="text-cyan-300 font-semibold">горизонтально для безударного [U]</span>.
          ИИ моментально считывает движение, составляет схему, а учитель оценивает прогресс.
        </p>

        {/* CTA Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-lg sm:max-w-none mx-auto">
          <button
            onClick={onStartAsStudent}
            className="flex items-center justify-center space-x-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            <GraduationCap className="h-5 w-5" />
            <span>Кабинет Ученика</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onStartAsTeacher}
            className="flex items-center justify-center space-x-2.5 rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 hover:border-slate-600 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span>Кабинет Учителя</span>
          </button>

          <button
            onClick={onTryInteractiveDemo}
            className="flex items-center justify-center space-x-2 rounded-2xl border border-cyan-500/40 bg-cyan-950/30 px-5 py-3.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-900/40 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>Демо без регистрации</span>
          </button>
        </div>

        {/* Privacy & Speed Note */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3 py-1 text-center">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Камера показывает только скелет руки, лицо скрыто</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-full px-3 py-1 text-center">
            <Activity className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Отклик: ~16–80 мс без задержек</span>
          </div>
        </div>

        {/* PWA Homescreen Install Banner */}
        <div className="mt-6 sm:mt-8 max-w-2xl mx-auto text-left">
          <PWAInstallButton variant="banner" />
        </div>
      </div>

      {/* SHOWCASE SECTION: Interactive Video Simulation & Photographic Guide */}
      <div className="relative mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            <Video className="h-4 w-4 text-amber-400" />
            <span>Видео и фото работы с сайтом</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Посмотрите, как это работает на практике
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl mx-auto">
            Ниже представлена интерактивная симуляция видео-захвата ритма и реальные фотоматериалы работы системы
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Interactive Simulated Video Player (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Top Video Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Видео-симуляция распознавания ритма
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-slate-700">
                  ● 60 FPS • MediaPipe Hands
                </span>
              </div>
            </div>

            {/* Video Stage Display */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[320px] overflow-hidden">
              {/* Syllables Flowing Bar */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-2 px-1">
                <span className="text-xs font-serif text-slate-300">
                  Строка: <strong className="text-amber-200">«Буря мглою небо кроет»</strong> (А. С. Пушкин)
                </span>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded shrink-0">
                  Хорей (_U/_U/_U/_U)
                </span>
              </div>

              {/* Syllable Bubbles with Highlight on Active */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-6 max-w-full">
                {demoSyllables.map((syl, idx) => {
                  const isActive = idx === demoStep;
                  const isPassed = idx < demoStep;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <span
                        className={`font-mono text-xs sm:text-sm font-black mb-1 transition-all ${
                          isActive
                            ? syl.stress
                              ? 'text-amber-400 scale-125'
                              : 'text-cyan-400 scale-125'
                            : isPassed
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {syl.char}
                      </span>
                      <div
                        className={`rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 font-serif text-xs sm:text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-100 shadow-lg shadow-amber-500/30 scale-110 font-bold'
                            : isPassed
                            ? 'bg-slate-800/80 border border-slate-700 text-slate-300'
                            : 'bg-slate-900/60 border border-slate-800 text-slate-600'
                        }`}
                      >
                        {syl.text}
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono mt-0.5">#{idx + 1}</span>
                    </div>
                  );
                })}
              </div>

              {/* Simulated Holographic Schematic Hand */}
              <div className="relative w-full max-w-[280px] h-36 sm:h-40 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center p-3 shadow-inner">
                {/* Laser orientation beam */}
                <div
                  className={`w-32 sm:w-36 h-2 rounded-full transition-all duration-300 transform ${
                    activeDemoSyl.stress
                      ? 'rotate-90 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.9)] scale-110'
                      : 'rotate-0 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)] scale-110'
                  }`}
                />

                {/* Hand Edge Icon Model */}
                <div className="mt-3 flex flex-col items-center text-center">
                  <div
                    className={`rounded-xl p-2.5 transition-colors ${
                      activeDemoSyl.stress
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    <Hand
                      className={`h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 ${
                        activeDemoSyl.stress ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </div>
                  <span className="mt-2 text-[10px] sm:text-[11px] font-bold tracking-wide">
                    {activeDemoSyl.stress ? (
                      <span className="text-amber-300">РЕБРО ВЕРТИКАЛЬНО [_] УДАРНЫЙ</span>
                    ) : (
                      <span className="text-cyan-300">РЕБРО ГОРИЗОНТАЛЬНО [U] БЕЗУДАРНЫЙ</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Sub-label */}
              <p className="mt-3 text-xs text-slate-400 text-center">
                Программа моментально считывает наклон ладони и фиксирует ритмический рисунок строки
              </p>
            </div>

            {/* Video Controls Bar */}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-slate-800 text-xs gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center space-x-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-slate-950" />}
                  <span>{isPlaying ? 'Пауза' : 'Воспроизвести'}</span>
                </button>
                <button
                  onClick={() => {
                    setDemoStep(0);
                    setVideoTime(0);
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Начать сначала"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setSoundOn(!soundOn)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title={soundOn ? 'Выключить звук ритма' : 'Включить звук ритма'}
                >
                  {soundOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <span>Скорость:</span>
                  {[0.75, 1, 1.25].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Слог {demoStep + 1}/8 • 00:0{videoTime} сек
              </div>
            </div>
          </div>

          {/* Photographic Guide Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Photo 1: Gestures Reference Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl overflow-hidden group">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950">
                <img
                  src="/src/assets/images/hand_gestures_guide_1790588205480.jpg"
                  alt="Инструкция по жестам MediaPipe"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4">
                  <div>
                    <span className="rounded bg-amber-500 text-slate-950 font-bold px-2 py-0.5 text-[10px] uppercase">
                      Фото-руководство
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      Два жеста: вертикальное [_] и горизонтальное [U] ребро
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo 2: Live Screen Interaction */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl overflow-hidden group">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950">
                <img
                  src="/src/assets/images/rhythm_gesture_demo_1790587949969.jpg"
                  alt="Захват ритма перед экраном компьютера"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4">
                  <div>
                    <span className="rounded bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 text-[10px] uppercase">
                      Интерактив
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      Быстрое бесконтактное считывание движений кисти
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo 3: Poetry Foot Analysis */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl overflow-hidden group flex-1">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950">
                <img
                  src="/src/assets/images/lesson_showcase_1790587971189.jpg"
                  alt="Анализ стоп поэзии с ИИ-ассистентом"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4">
                  <div>
                    <span className="rounded bg-purple-500 text-white font-bold px-2 py-0.5 text-[10px] uppercase">
                      Разбор стоп и ИИ
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      Деление на стопы и персональные подсказки Gemini
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS: Step-by-Step Architecture */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Пошаговый процесс
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
              Как работает тренажер «РитмоСтих»
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Интуитивный путь от чтения строк до экспертного анализа стоп и стихотворного метра
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold mb-4">
                  01
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Поток слогов
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ученик видит четверостишие. Каждая строка разделяется на слоги (например, «Бу - ря - мгло - ю»), побуждая проговаривать текст в естественном поэтическом темпе.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-amber-400/90 font-medium">
                Построчная подача
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold mb-4">
                  02
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Жесты ребром руки
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Перед камерой ученик отбивает такт: ребро ладони горизонтально для безударного [U], вертикально — для ударного [_]. Камера считывает наклон за 80 мс.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-blue-400/90 font-medium">
                Схематический образ руки
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold mb-4">
                  03
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Разметка стоп и размер
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  После 4 строк программа строит итоговую схему. Проводя вертикальные черты `/` между слогами, ученик выделяет стопы и указывает размер и рифму.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-purple-400/90 font-medium">
                Интерактивная доска стоп
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold mb-4">
                  04
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  ИИ и оценка учителя
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ИИ-агент Gemini анализирует ошибки, а учитель пишет рецензию. После сдачи ученик может тренироваться снова в категории «Тренировка» без снижения оценки.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-emerald-400/90 font-medium">
                Счетчик тренировок
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Gesture Rules Visual Reference */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Правила двух основных жестов тренажера
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Два естественных жеста ладонью перед объективом веб-камеры
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gesture 1: Unstressed */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-lg bg-blue-500/20 text-blue-300 font-bold px-3 py-1 text-xs border border-blue-500/30">
                    БЕЗУДАРНЫЙ СЛОГ
                  </span>
                  <span className="font-mono text-3xl font-black text-blue-400">U</span>
                </div>

                <div className="h-28 rounded-xl bg-slate-950/80 border border-blue-500/20 flex flex-col items-center justify-center p-3 mb-4">
                  <div className="w-36 h-7 rounded-md bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-md shadow-blue-500/30">
                    РЕБРО ГОРИЗОНТАЛЬНО [ U ]
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 text-center">
                    Кисть вытянута параллельно столу
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Показывайте горизонтальное ребро кисти на плавных, безударных гласных звуках. Программа мгновенно запишет символ <strong>U</strong>.
                </p>
              </div>
            </div>

            {/* Gesture 2: Stressed */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-lg bg-amber-500/20 text-amber-300 font-bold px-3 py-1 text-xs border border-amber-500/30">
                    УДАРНЫЙ СЛОГ
                  </span>
                  <span className="font-mono text-3xl font-black text-amber-400">_</span>
                </div>

                <div className="h-28 rounded-xl bg-slate-950/80 border border-amber-500/20 flex flex-col items-center justify-center p-3 mb-4">
                  <div className="w-8 h-20 rounded-md bg-gradient-to-b from-amber-400 to-rose-500 flex items-center justify-center text-[9px] font-bold text-slate-950 [writing-mode:vertical-lr] shadow-md shadow-amber-500/30">
                    РЕБРО ВЕРТИКАЛЬНО [ _ ]
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 text-center">
                    Кисть поднята ребром вертикально
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Показывайте вертикальное ребро кисти с легким акцентом на ударных гласных звуках. Программа моментально зафиксирует символ <strong>_</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Benefits (Teachers vs Students) */}
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Teachers */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Для учителей словесности</h3>
                <p className="text-xs text-slate-400">Создание заданий, журнал класса и рекомендации</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Создание заданий:</strong> загрузка первых 4 строк стихотворения, схемы размера в отдельном окне, выбор размера и рифмы.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Журнал сдачи и тренировок:</strong> просмотр результатов учеников, точности и количества тренировок.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Педагогический отзыв:</strong> написание комментария вручную или быстрая генерация ИИ-агентом.</span>
              </li>
            </ul>

            <button
              onClick={onStartAsTeacher}
              className="mt-6 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Перейти в кабинет учителя
            </button>
          </div>

          {/* For Students */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Для учащихся</h3>
                <p className="text-xs text-slate-400">Интерактивный разбор, тренировки и советы ИИ</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Физическое чувство ритма:</strong> распознавание стоп через естественные жесты ладони.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Безопасный режим «Тренировка»:</strong> возможность проходить задание заново сколько угодно раз.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Кнопка рекомендаций ИИ:</strong> персональный разбор каждой ошибки прямо в задании.</span>
              </li>
            </ul>

            <button
              onClick={onStartAsStudent}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-2.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md"
            >
              Начать как Ученик
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
