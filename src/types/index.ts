export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: string; // e.g. "8А"
  school?: string;
}

export interface SyllableInfo {
  text: string;
  stressed: boolean;
}

export interface LineScheme {
  originalText: string;
  syllables: string[];
  expectedStresses: boolean[]; // true = stressed (_), false = unstressed (U)
  expectedFootDividers: number[]; // indices after which a foot boundary / occurs (e.g. [1, 3, 5, 7] for trochee)
}

export interface Assignment {
  id: string;
  code: string; // Unique access code for students, e.g. "741-201"
  title: string;
  author: string;
  grade: string;
  lines: string[];
  parsedLines: LineScheme[];
  expectedScheme: string; // e.g. "_U/_U/_U/_U"
  meter: string; // e.g. "4-стопный хорей"
  meterType: 'trochee' | 'iamb' | 'dactyl' | 'amphibrach' | 'anapest' | 'other';
  rhyme: string; // e.g. "Перекрёстная (ABAB)"
  rhymeType: 'ABAB' | 'AABB' | 'ABBA' | 'other';
  createdAt: string;
  teacherId: string;
  teacherName: string;
  description?: string;
}

export interface StudentGestureLine {
  lineIndex: number;
  gestures: ('_' | 'U')[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  grade: string;
  submittedAt: string;
  isTraining: boolean;
  trainingCount: number;
  gestureLines: StudentGestureLine[];
  recordedScheme: string; // e.g. "_U_U_U_U"
  dividedFeetScheme: string; // e.g. "_U / _U / _U / _U"
  studentDividers: number[][]; // foot dividers per line
  studentMeter: string;
  studentRhyme: string;
  accuracy: number; // 0 - 100
  meterCorrect: boolean;
  rhymeCorrect: boolean;
  teacherComment?: string;
  teacherCommentDate?: string;
  aiRecommendations?: string;
  aiAnalysisDate?: string;
}
