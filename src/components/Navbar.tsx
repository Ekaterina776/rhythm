import React from 'react';
import { User } from '../types';
import { sound } from '../lib/soundEffects';
import {
  BookOpen,
  Volume2,
  VolumeX,
  UserCheck,
  GraduationCap,
  Sparkles,
  HelpCircle,
  PlusCircle,
  ListOrdered,
  Award,
  LogOut,
  Home,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTutorial: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenTutorial,
  currentTab,
  onSelectTab,
  onLogout,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase() || 'РC';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div
            onClick={() => onSelectTab('landing')}
            className="flex cursor-pointer items-center space-x-3 transition-transform hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20">
              <Sparkles className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl font-bold tracking-tight text-white">РитмоСтих</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 border border-amber-500/20">
                  MediaPipe Hands
                </span>
              </div>
              <p className="text-xs text-slate-400">Тренажер стихосложения и ритма</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden items-center space-x-1 md:flex">
          {/* Always available Landing/Home link */}
          <button
            onClick={() => onSelectTab('landing')}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              currentTab === 'landing'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Главная</span>
          </button>

          {currentUser?.role === 'teacher' ? (
            <>
              <button
                onClick={() => onSelectTab('teacher_assignments')}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'teacher_assignments'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Созданные задания</span>
              </button>
              <button
                onClick={() => onSelectTab('create_assignment')}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'create_assignment'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Создать задание</span>
              </button>
              <button
                onClick={() => onSelectTab('teacher_submissions')}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'teacher_submissions'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Ученики и результаты</span>
              </button>
            </>
          ) : currentUser?.role === 'student' ? (
            <>
              <button
                onClick={() => onSelectTab('student_available')}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'student_available'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>Задания по коду</span>
              </button>
              <button
                onClick={() => onSelectTab('student_completed')}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'student_completed'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Пройденные задания</span>
              </button>
            </>
          ) : null}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Gesture rules guide button */}
          <button
            onClick={onOpenTutorial}
            title="Инструкция по жестам MediaPipe"
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700/60 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-amber-500/40 hover:bg-slate-800 hover:text-amber-300 cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Жесты</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* User profile / Auth button */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenProfile}
                title="Открыть личный профиль"
                className="flex cursor-pointer items-center space-x-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 transition-colors hover:border-amber-500/40 hover:bg-slate-850"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 font-bold text-[11px] text-slate-950 shadow-sm shadow-amber-500/20">
                  {getInitials(currentUser.name)}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-400/90">
                    {currentUser.role === 'teacher' ? 'Учитель' : `Ученик • ${currentUser.grade || '8А'}`}
                  </div>
                </div>
              </button>
              <button
                onClick={onLogout}
                title="Выйти из аккаунта"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-950/40 hover:text-rose-400 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 cursor-pointer active:scale-95"
            >
              <UserCheck className="h-4 w-4" />
              <span>Войти / Регистрация</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
