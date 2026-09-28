import React from 'react';
import { X, Hand, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface GestureTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureTutorialModal: React.FC<GestureTutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-4 sm:p-6 scrollbar-thin">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">Правила распознавания жестов MediaPipe</h3>
            <p className="text-xs text-slate-400">Как показывать ударные и безударные слоги перед веб-камерой • Схематический режим (видео лица скрыто)</p>
          </div>
        </div>

        {/* Two Gesture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Unstressed */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  Безударный слог [ U ]
                </span>
                <span className="text-2xl font-mono font-bold text-blue-400">U</span>
              </div>

              {/* Graphic Representation */}
              <div className="h-32 rounded-lg bg-slate-950/60 border border-blue-500/20 flex flex-col items-center justify-center p-3 relative overflow-hidden mb-3">
                {/* Horizontal hand icon/diagram */}
                <div className="relative flex items-center justify-center w-full">
                  <div className="w-28 h-6 rounded-md bg-gradient-to-r from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-[11px] font-bold text-slate-950 tracking-wider">
                    РЕБРО ГОРИЗОНТАЛЬНО
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-center text-blue-200">
                  Ладонь повернута ребром к камере горизонтально, пальцы вытянуты в линию
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Держите кисть параллельно столу / полу. Программа зафиксирует безударную гласную и добавит символ <strong>U</strong>.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-blue-500/20 text-[11px] text-blue-400/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Клавиша-дублер: <strong>U</strong> или <strong>Стрелка влево</strong></span>
            </div>
          </div>

          {/* Card 2: Stressed */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  Ударный слог [ _ ]
                </span>
                <span className="text-2xl font-mono font-bold text-amber-400">_</span>
              </div>

              {/* Graphic Representation */}
              <div className="h-32 rounded-lg bg-slate-950/60 border border-amber-500/20 flex flex-col items-center justify-center p-3 relative overflow-hidden mb-3">
                {/* Vertical hand icon/diagram */}
                <div className="relative flex items-center justify-center w-full">
                  <div className="w-8 h-24 rounded-md bg-gradient-to-b from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-[10px] font-bold text-slate-950 [writing-mode:vertical-lr] tracking-wider">
                    РЕБРО ВЕРТИКАЛЬНО
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-center text-amber-200">
                  Ладонь повернута ребром вертикально (рубящий вертикальный жест)
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Поднимите кисть ребром вертикально вверх как акцент ритма. Программа зафиксирует ударную гласную <strong>_</strong>.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-amber-400/80 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Клавиша-дублер: <strong>Пробел</strong> или <strong>Стрелка вверх</strong></span>
            </div>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Последовательность выполнения упражнения:
          </h4>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
            <li>
              Перед вами последовательно проплывают слоги строки (например, <strong>«Бу - ря - мгло - ю»</strong>).
            </li>
            <li>
              Для каждого слога покажите соответствующий жест (вертикально = ударный, горизонтально = безударный).
            </li>
            <li>
              Завершив первую строку, нажмите <strong>«Далее»</strong>, чтобы разобрать следующую.
            </li>
            <li>
              В конце программа сформирует общую схему. Вы сможете <strong>отделить стопы чертой</strong>, ввести стихотворный размер (хорей, ямб, дактиль...) и тип рифмы.
            </li>
          </ol>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <span>Понятно, начать тренировку</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
