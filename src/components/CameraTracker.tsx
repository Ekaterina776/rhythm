import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  detectEdgeGesture,
  drawHandSkeleton,
  GestureType,
  Landmark,
} from '../lib/handDetector';
import { Camera, CameraOff, Sparkles, RefreshCw, AlertCircle, Shield, Hand, Power } from 'lucide-react';

interface CameraTrackerProps {
  onGestureTriggered: (gesture: '_' | 'U') => void;
  disabled?: boolean;
  activeSyllableText?: string;
  expectedStress?: boolean;
  isCameraEnabled?: boolean;
  onToggleCamera?: (enabled: boolean) => void;
}

export const CameraTracker: React.FC<CameraTrackerProps> = ({
  onGestureTriggered,
  disabled = false,
  activeSyllableText,
  expectedStress,
  isCameraEnabled,
  onToggleCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera Power state (on / off)
  const [internalCameraEnabled, setInternalCameraEnabled] = useState<boolean>(true);
  const cameraEnabled = isCameraEnabled !== undefined ? isCameraEnabled : internalCameraEnabled;

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [detectedAngle, setDetectedAngle] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Включение камеры...');
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%

  // Gesture hold tracking
  const activeGestureRef = useRef<GestureType>('none');
  const holdStartTimeRef = useRef<number>(0);
  const lastTriggerTimeRef = useRef<number>(0);
  const handsInstanceRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const HOLD_DURATION_MS = 80; // Instantaneous detection (~80ms hold)
  const COOLDOWN_MS = 220; // Snappy rhythm pace matching natural poetry cadence

  const toggleCamera = () => {
    const nextState = !cameraEnabled;
    if (onToggleCamera) {
      onToggleCamera(nextState);
    } else {
      setInternalCameraEnabled(nextState);
    }
  };

  const handleTriggerGesture = useCallback(
    (g: '_' | 'U') => {
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < COOLDOWN_MS) return;
      lastTriggerTimeRef.current = now;
      setHoldProgress(100);
      onGestureTriggered(g);
      setTimeout(() => setHoldProgress(0), 200);
    },
    [onGestureTriggered]
  );

  // Keyboard shortcut listener (Space/Up = stressed _, U/Left = unstressed U)
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === '1') {
        e.preventDefault();
        handleTriggerGesture('_');
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'ArrowLeft' || e.key === '0') {
        e.preventDefault();
        handleTriggerGesture('U');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleTriggerGesture]);

  // Initial render of empty schematic guide on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawHandSkeleton(ctx, null, 'none', canvas.width, canvas.height, 0);
      }
    }
  }, []);

  // Native Camera and MediaPipe Hands initialization or shutdown
  useEffect(() => {
    let isMounted = true;

    // If camera is explicitly turned off by the user:
    if (!cameraEnabled) {
      setCameraActive(false);
      setCameraError(null);
      setStatusMessage('Камера отключена пользователем');
      setCurrentGesture('none');
      setDetectedAngle(0);
      setHoldProgress(0);

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawHandSkeleton(ctx, null, 'none', canvasRef.current.width, canvasRef.current.height, 0);
        }
      }
      return;
    }

    async function ensureHandsLoaded(): Promise<boolean> {
      const Win = window as any;
      if (typeof Win.Hands !== 'undefined') return true;

      // Check if script tag is in document
      let script = document.querySelector('script[src*="hands.js"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Wait up to 5 seconds
      for (let i = 0; i < 40; i++) {
        if (typeof (window as any).Hands !== 'undefined') {
          return true;
        }
        await new Promise(r => setTimeout(r, 120));
      }
      return typeof (window as any).Hands !== 'undefined';
    }

    async function startCameraAndMediaPipe() {
      try {
        setCameraError(null);
        setStatusMessage('Запуск веб-камеры...');

        // 1. Start native webcam stream
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Браузер не поддерживает getUserMedia');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 60, min: 30 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setStatusMessage('Камера активна. Подключение схематического анализатора...');
        }

        // 2. Initialize MediaPipe Hands
        const handsLoaded = await ensureHandsLoaded();
        if (!isMounted) return;

        const WindowAny = window as any;
        if (handsLoaded && typeof WindowAny.Hands !== 'undefined') {
          const hands = new WindowAny.Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
            },
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0, // Lite model for ultra-low latency inference
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          hands.onResults((results: any) => {
            if (!isMounted || disabled) return;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let detected: GestureType = 'none';
            let angle = 0;

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const rawLandmarks: Landmark[] = results.multiHandLandmarks[0];
              const res = detectEdgeGesture(rawLandmarks);
              detected = res.gesture;
              angle = res.angleDeg;
              setStatusMessage(res.message);
              // Draw pure schematic model of the hand
              drawHandSkeleton(ctx, rawLandmarks, detected, canvas.width, canvas.height, angle);
            } else {
              // Draw schematic calibration guide when no hand
              drawHandSkeleton(ctx, null, 'none', canvas.width, canvas.height, 0);
              setStatusMessage('Поместите ладонь перед камерой ребром к объективу');
            }

            setCurrentGesture(detected);
            setDetectedAngle(angle);

            // Gesture hold logic
            const now = Date.now();
            if (detected !== 'none' && detected === activeGestureRef.current) {
              const elapsed = now - holdStartTimeRef.current;
              const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
              setHoldProgress(progress);

              if (elapsed >= HOLD_DURATION_MS) {
                const gestureSymbol = detected === 'vertical_edge' ? '_' : 'U';
                handleTriggerGesture(gestureSymbol);
                activeGestureRef.current = 'none';
                holdStartTimeRef.current = 0;
              }
            } else if (detected !== 'none') {
              activeGestureRef.current = detected;
              holdStartTimeRef.current = now;
              setHoldProgress(10);
            } else {
              activeGestureRef.current = 'none';
              holdStartTimeRef.current = 0;
              setHoldProgress(0);
            }
          });

          handsInstanceRef.current = hands;
          setStatusMessage('Схематический трекер активен. Покажите жест рукой.');

          // 3. Native requestAnimationFrame ultra-fast processing loop
          let isProcessingFrame = false;

          const processVideoFrame = async () => {
            if (!isMounted) return;

            if (
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              handsInstanceRef.current &&
              !isProcessingFrame
            ) {
              isProcessingFrame = true;
              try {
                await handsInstanceRef.current.send({ image: videoRef.current });
              } catch (e) {
                // Ignore transient frame drop
              } finally {
                isProcessingFrame = false;
              }
            }

            animFrameRef.current = requestAnimationFrame(processVideoFrame);
          };

          animFrameRef.current = requestAnimationFrame(processVideoFrame);
        } else {
          setStatusMessage('Камера работает. Распознавание доступно через кнопки и клавиши [U]/[Пробел]');
        }
      } catch (err: any) {
        console.error('Camera init error:', err);
        if (isMounted) {
          setCameraError(err.message || 'Не удалось получить доступ к веб-камере');
          setStatusMessage('Камера недоступна (используйте кнопки управления или клавиатуру)');
        }
      }
    }

    startCameraAndMediaPipe();

    return () => {
      isMounted = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (handsInstanceRef.current && handsInstanceRef.current.close) {
        try {
          handsInstanceRef.current.close();
        } catch {}
      }
    };
  }, [cameraEnabled, disabled, handleTriggerGesture]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Top Bar with Camera Status, Schematic Badge, and Power Switch */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-3.5 py-2.5">
        <div className="flex items-center space-x-2">
          <div className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                cameraEnabled && cameraActive ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                cameraEnabled && cameraActive ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </div>
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Hand className="h-3.5 w-3.5 text-amber-400" />
            <span>Схематический трекер</span>
          </span>
        </div>

        {/* Action Controls: Camera ON/OFF toggle and Recognized Gesture Badge */}
        <div className="flex items-center space-x-2">
          {/* Prominent Camera Power Toggle Button */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
              cameraEnabled
                ? 'border-slate-700 bg-slate-800/90 text-slate-300 hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300'
                : 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-500/20'
            }`}
            title={cameraEnabled ? 'Выключить веб-камеру' : 'Включить веб-камеру'}
          >
            {cameraEnabled ? (
              <>
                <CameraOff className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">Выкл камеру</span>
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Вкл камеру</span>
              </>
            )}
          </button>

          {/* Current Gesture Badge */}
          {cameraEnabled && (
            <>
              {currentGesture === 'vertical_edge' ? (
                <span className="flex items-center space-x-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>УДАРНЫЙ [ _ ]</span>
                </span>
              ) : currentGesture === 'horizontal_edge' ? (
                <span className="flex items-center space-x-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>БЕЗУДАРНЫЙ [ U ]</span>
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hidden sm:inline">
                  Ожидание...
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schematic Viewport (Video is invisible to protect privacy, only schematic canvas is shown) */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Hidden video element used strictly as data source for MediaPipe Hands */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full object-cover -scale-x-100 opacity-0 pointer-events-none"
        />

        {/* Schematic Hand Canvas: Renders only the schematic representation of the hand */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Framing & Status Overlay when camera is active */}
        {cameraEnabled && !cameraError && (
          <div className="absolute inset-3 pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="rounded bg-slate-900/80 px-2 py-0.5 border border-slate-800">
                Оптический захват кисти
              </span>
              {detectedAngle > 0 && (
                <span className="rounded bg-slate-900/80 px-2 py-0.5 border border-slate-800 font-mono text-amber-300">
                  Наклон: {detectedAngle}°
                </span>
              )}
            </div>

            {/* Visual Hold Progress Indicator */}
            {holdProgress > 0 && (
              <div className="mx-auto w-48 rounded-full bg-slate-950/90 p-1 border border-slate-700 shadow-lg">
                <div
                  className={`h-2 rounded-full transition-all duration-75 ${
                    currentGesture === 'vertical_edge' ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            )}

            <div className="text-center text-[11px] font-medium text-slate-200 bg-slate-950/80 py-1 px-3 rounded-lg backdrop-blur-md mx-auto border border-slate-800">
              {statusMessage}
            </div>
          </div>
        )}

        {/* Overlay when Camera is Powered Off */}
        {!cameraEnabled && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center z-10 animate-in fade-in duration-200">
            <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <CameraOff className="h-8 w-8 text-amber-400/80" />
            </div>
            <h4 className="text-base font-serif font-bold text-white">Камера выключена</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-5 leading-relaxed">
              Вы можете включить камеру в любой момент или отбивать стихотворный ритм кнопками внизу и клавишами [U] / [Пробел].
            </p>
            <button
              type="button"
              onClick={toggleCamera}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Включить камеру</span>
            </button>
          </div>
        )}

        {/* Fallback overlay if camera error */}
        {cameraEnabled && cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center z-10">
            <CameraOff className="h-10 w-10 text-amber-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Камера не обнаружена</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-3">
              Разрешите доступ к веб-камере в браузере или используйте кнопки внизу и клавиатуру ([Пробел] и [U]).
            </p>
            <button
              type="button"
              onClick={toggleCamera}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              Выключить камеру
            </button>
          </div>
        )}
      </div>

      {/* Manual Gesture Buttons & Keyboard Shortcuts */}
      <div className="border-t border-slate-800 bg-slate-950/90 p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>Кнопки управления / Клавиатура:</span>
          <span>Клавиши: [U] / [Пробел]</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTriggerGesture('U')}
            disabled={disabled}
            className="group flex flex-col items-center justify-center rounded-xl border border-blue-500/40 bg-blue-950/40 py-2.5 px-3 transition-all hover:border-blue-400 hover:bg-blue-900/50 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 text-blue-300 font-bold text-sm">
              <span className="font-mono text-base">U</span>
              <span>Безударный</span>
            </div>
            <span className="text-[10px] text-blue-400/80">Ребро горизонтально</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerGesture('_')}
            disabled={disabled}
            className="group flex flex-col items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/40 py-2.5 px-3 transition-all hover:border-amber-400 hover:bg-amber-900/50 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-sm">
              <span className="font-mono text-base font-black">_</span>
              <span>Ударный</span>
            </div>
            <span className="text-[10px] text-amber-400/80">Ребро вертикально</span>
          </button>
        </div>
      </div>
    </div>
  );
};
