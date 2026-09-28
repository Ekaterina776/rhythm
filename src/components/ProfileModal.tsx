import React, { useState } from 'react';
import { User } from '../types';
import {
  X,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  Mail,
  School,
  Check,
  LogOut,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  assignmentsCount: number;
  submissionsCount: number;
  onNavigateToDashboard: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  assignmentsCount,
  submissionsCount,
  onNavigateToDashboard,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [grade, setGrade] = useState(currentUser.grade || '8А');
  const [school, setSchool] = useState(currentUser.school || 'Лицей классической словесности');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Extract initials from user name (e.g. "Иван Петров" -> "ИП")
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase() || 'РC';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      grade: currentUser.role === 'student' ? grade.trim() || '8А' : undefined,
      school: school.trim() || undefined,
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Info without Photo */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
            {getInitials(currentUser.name)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                {currentUser.role === 'teacher' ? 'Преподаватель словесности' : 'Ученик'}
              </span>
              {currentUser.role === 'student' && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                  {currentUser.grade || '8А'} класс
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mt-1">{currentUser.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>{currentUser.email}</span>
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {currentUser.role === 'teacher' ? 'Создано заданий' : 'Пройдено заданий'}
            </span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {assignmentsCount}
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {currentUser.role === 'teacher' ? 'Проверено работ' : 'Тренировок ритма'}
            </span>
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {submissionsCount}
            </span>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Фамилия, Имя и Отчество
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {currentUser.role === 'student' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Класс обучения
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="Например: 8А, 9Б"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Учебное заведение
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  placeholder="Школа / Лицей / Гимназия"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-slate-950" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить профиль</span>
              )}
            </button>

            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              {currentUser.role === 'teacher' ? 'К заданиям' : 'Мои уроки'}
            </button>
          </div>
        </form>

        {/* Footer Logout */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Учетная запись: <strong className="text-slate-400">{currentUser.email}</strong>
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors p-1.5 rounded-lg hover:bg-rose-950/30 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Выйти из профиля</span>
          </button>
        </div>
      </div>
    </div>
  );
};
