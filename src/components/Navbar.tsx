import React, { useState } from 'react';
import { User } from '../types';
import { sound } from '../lib/soundEffects';
import { PWAInstallButton } from './PWAInstallButton';
import {
  BookOpen,
  Volume2,
  VolumeX,
  UserCheck,
  GraduationCap,
  HelpCircle,
  PlusCircle,
  Award,
  LogOut,
  Home,
  KeyRound,
  Menu,
  X,
  User as UserIcon,
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
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
          {/* Brand Logo - Compact and adaptive on mobile */}
          <div
            onClick={() => handleTabClick('landing')}
            className="flex cursor-pointer items-center space-x-2 sm:space-x-3 shrink-0"
          >
            <img
              src="/pwa-192x192.png"
              alt="РитмоСтих"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shadow-md border border-amber-500/30 object-cover"
            />
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-white">
                  РитмоСтих
                </span>
                <span className="hidden sm:inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20">
                  MediaPipe
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                Тренажер стихосложения и ритма
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => handleTabClick('landing')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
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
                  onClick={() => handleTabClick('teacher_assignments')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'teacher_assignments'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Задания</span>
                </button>
                <button
                  onClick={() => handleTabClick('create_assignment')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'create_assignment'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Создать</span>
                </button>
                <button
                  onClick={() => handleTabClick('teacher_submissions')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'teacher_submissions'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Ученики</span>
                </button>
              </>
            ) : currentUser?.role === 'student' ? (
              <>
                <button
                  onClick={() => handleTabClick('student_available')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'student_available'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>По коду</span>
                </button>
                <button
                  onClick={() => handleTabClick('student_completed')}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    currentTab === 'student_completed'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Мои работы</span>
                </button>
              </>
            ) : null}
          </nav>

          {/* Right side controls - strictly sized to never wrap or overlap */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* PWA Install Button on tablets & desktop */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>

            {/* Gesture Tutorial button on desktop */}
            <button
              onClick={onOpenTutorial}
              title="Инструкция по жестам MediaPipe"
              className="hidden md:flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Жесты</span>
            </button>

            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
              className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 sm:p-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* User Profile / Auth Button */}
            {currentUser ? (
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <button
                  onClick={onOpenProfile}
                  title="Личный кабинет"
                  className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2 py-1 transition-colors hover:border-amber-500/40 cursor-pointer"
                >
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 font-bold text-[10px] sm:text-[11px] text-slate-950 shadow-sm">
                    {getInitials(currentUser.name)}
                  </div>
                  <span className="hidden xl:inline text-xs font-semibold text-white max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Выйти"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer hidden sm:block"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Вход</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Открыть меню"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/90 bg-slate-950/98 px-4 py-3.5 backdrop-blur-xl animate-fadeIn space-y-3">
            {/* Homescreen install on mobile */}
            <div>
              <PWAInstallButton variant="full" />
            </div>

            <div className="flex flex-col space-y-1">
              <button
                onClick={() => handleTabClick('landing')}
                className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'landing'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Home className="h-4 w-4 text-amber-400" />
                <span>Главная страница</span>
              </button>

              {currentUser?.role === 'teacher' ? (
                <>
                  <button
                    onClick={() => handleTabClick('teacher_assignments')}
                    className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'teacher_assignments'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <span>Созданные задания</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('create_assignment')}
                    className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'create_assignment'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4 text-amber-400" />
                    <span>Создать задание</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('teacher_submissions')}
                    className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'teacher_submissions'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-amber-400" />
                    <span>Ученики и работы</span>
                  </button>
                </>
              ) : currentUser?.role === 'student' ? (
                <>
                  <button
                    onClick={() => handleTabClick('student_available')}
                    className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'student_available'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <KeyRound className="h-4 w-4 text-amber-400" />
                    <span>Вход по коду</span>
                  </button>
                  <button
                    onClick={() => handleTabClick('student_completed')}
                    className={`flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'student_completed'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Пройденные задания</span>
                  </button>
                </>
              ) : null}

              {/* Tutorial gesture trigger in mobile menu */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTutorial();
                }}
                className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 text-amber-400" />
                <span>Инструкция по жестам рук</span>
              </button>

              {currentUser ? (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="flex items-center space-x-2 text-xs font-semibold text-amber-300 cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Личный профиль ({currentUser.name})</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center space-x-1 text-xs text-rose-400 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-900">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Войти / Зарегистрироваться</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
