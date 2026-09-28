import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode (from home screen), no need to prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 p-4 shadow-xl backdrop-blur-sm ${className}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <img
                src="/pwa-192x192.png"
                alt="РитмоСтих"
                className="h-11 w-11 rounded-xl shadow-md border border-amber-500/30"
              />
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Установите РитмоСтих на экран «Домой»
                </h4>
                <p className="text-xs text-slate-300">
                  Быстрый запуск без браузерной строки, стабильная работа оффлайн и полноэкранный режим.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>{isInstalling ? 'Установка...' : 'Установить на экран'}</span>
            </button>
          </div>
        </div>
      ) : variant === 'full' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center justify-center space-x-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 active:scale-95 transition-all shadow-sm cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4 text-amber-300" />
          <span>Установить приложение</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Установить РитмоСтих на экран «Домой»"
          className={`inline-flex items-center space-x-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">На экран «Домой»</span>
          <span className="sm:hidden">Установить</span>
        </button>
      )}

      {/* Cross-Device / iOS Install Instructions Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 scrollbar-thin">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/pwa-192x192.png"
                alt="РитмоСтих"
                className="h-12 w-12 rounded-xl border border-amber-500/40 shadow-lg"
              />
              <div>
                <h3 className="text-base font-bold text-amber-200 font-cinzel">
                  Установка «РитмоСтих»
                </h3>
                <p className="text-xs text-slate-400">
                  Добавление на экран смартфона, планшета или ноутбука
                </p>
              </div>
            </div>

            {isIOS ? (
              /* Apple iOS / Safari instructions */
              <div className="space-y-3.5 text-sm text-slate-300">
                <div className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                    <Share className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">1. Нажмите «Поделиться»</p>
                    <p className="text-xs text-slate-400">
                      В нижней (или верхней) панели Safari нажмите значок со стрелочкой вверх.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                    <PlusSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">2. Выберите «На экран «Домой»</p>
                    <p className="text-xs text-slate-400">
                      Прокрутите меню вниз и выберите «На экран «Домой»» (Add to Home Screen).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">3. Нажмите «Добавить»</p>
                    <p className="text-xs text-slate-400">
                      Иконка приложения «РитмоСтих» появится среди ваших обычных приложений!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Desktop Chrome / Edge / Firefox instructions */
              <div className="space-y-3.5 text-sm text-slate-300">
                <div className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">В браузере (Chrome / Edge / Яндекс)</p>
                    <p className="text-xs text-slate-400">
                      Нажмите на три точки в меню браузера (⋮) или значок монитора со стрелкой в адресной строке и выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90 leading-relaxed">
                  💡 Приложение работает как полноценная программа: открывается мгновенно, не занимает лишнее место в браузере и надежно работает на уроках литературы.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
};
