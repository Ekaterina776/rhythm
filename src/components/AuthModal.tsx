import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
} from 'lucide-react';
import {
  loginWithFirebase,
  registerWithFirebase,
  loginWithGoogleFirebase,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  currentUser?: User | null;
  onOpenProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onOpenProfile,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [grade, setGrade] = useState<string>('8А');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format Firebase error codes into helpful Russian text
  const formatFirebaseError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/operation-not-allowed') {
      return 'Вход по Email временно обрабатывается через облачную базу данных. Также вы можете использовать «Продолжить с Google».';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Неверная электронная почта или пароль.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Пользователь с такой почтой уже зарегистрирован. Переключитесь на вкладку «Вход».';
    }
    if (code === 'auth/weak-password') {
      return 'Слишком простой пароль. Пароль должен содержать минимум 6 символов.';
    }
    if (code === 'auth/invalid-email') {
      return 'Пожалуйста, введите корректный адрес электронной почты.';
    }
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      return 'Всплывающее окно было заблокировано браузером. Пожалуйста, разрешите всплывающие окна или используйте вход по почте.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Ошибка сети. Проверьте интернет-соединение.';
    }
    return message || 'Произошла ошибка при авторизации. Попробуйте еще раз.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Заполните адрес почты и пароль');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const user = await registerWithFirebase(
          name.trim() || (role === 'teacher' ? 'Преподаватель словесности' : 'Ученик'),
          cleanEmail,
          password,
          role,
          grade
        );
        onLogin(user);
        onClose();
      } else {
        const user = await loginWithFirebase(cleanEmail, password, role, grade);
        onLogin(user);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogleFirebase(role, grade);
      onLogin(user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4 font-bold text-lg">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="font-serif text-xl font-bold text-white">Вы уже вошли в систему</h3>
            <p className="text-xs text-slate-300 mt-1 mb-0.5 font-semibold">{currentUser.name}</p>
            <p className="text-xs text-amber-400">
              {currentUser.role === 'teacher' ? 'Преподаватель словесности' : `Ученик • ${currentUser.grade || '8А'} класс`}
            </p>
            <p className="text-xs text-slate-400 mt-3 mb-6">
              Вы успешно авторизованы в Firebase. Все ваши задания и результаты синхронизируются в реальном времени.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenProfile?.();
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                Открыть личный профиль
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          /* Standard Auth Form */
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold mb-3 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                {mode === 'login' ? 'Вход в РитмоСтих' : 'Регистрация'}
              </h3>
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400/90 mt-1">
                <Cloud className="w-3.5 h-3.5" />
                <span>Облачная база данных Firebase</span>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 py-2.5 px-4 text-xs font-semibold text-white transition-all shadow-sm mb-4 cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Продолжить с Google (Firebase)</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-mono">
                ИЛИ EMAIL
              </span>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Role selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Выберите роль
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center space-x-2 rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
                      role === 'student'
                        ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Ученик</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex items-center justify-center space-x-2 rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
                      role === 'teacher'
                        ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Учитель</span>
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    ФИО
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={role === 'teacher' ? 'Иванова Мария Николаевна' : 'Алексей Смирнов'}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {role === 'student' && mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Класс
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="8А"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Электронная почта
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Пароль {mode === 'register' && '(минимум 6 символов)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 px-4 font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 mt-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Подождите...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Logins */}
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[10px] text-center text-slate-500 mb-2 font-medium">
                  Быстрый вход для проверки в 1 клик:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const demoTeacher = await loginWithFirebase(
                          'teacher.demo@school.edu',
                          'teacher123',
                          'teacher',
                          undefined,
                          'Лицей классической словесности'
                        );
                        onLogin({ ...demoTeacher, name: demoTeacher.name || 'Мария Николаевна (Учитель)' });
                        onClose();
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-2 px-2 text-[11px] font-semibold text-amber-300 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Учитель словесности</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const demoStudent = await loginWithFirebase(
                          'student.demo@school.edu',
                          'student123',
                          'student',
                          '8А'
                        );
                        onLogin({ ...demoStudent, name: demoStudent.name || 'Алексей Смирнов (Ученик)' });
                        onClose();
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 py-2 px-2 text-[11px] font-semibold text-blue-300 transition-colors cursor-pointer"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Ученик 8А</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
