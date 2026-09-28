import { User, Assignment, Submission, LineScheme } from '../types';
import { splitLineIntoSyllables, formatSchemeString } from './poetryEngine';

const STORAGE_KEY_USER = 'ritmostikh_user_v1';
const STORAGE_KEY_ASSIGNMENTS = 'ritmostikh_assignments_v1';
const STORAGE_KEY_SUBMISSIONS = 'ritmostikh_submissions_v1';

export const INITIAL_TEACHER: User = {
  id: 'teacher_1',
  name: 'Анна Сергеевна Воронцова',
  email: 'vorontsova@school.edu',
  role: 'teacher',
  school: 'Лицей русской классической словесности',
};

export const INITIAL_STUDENT_1: User = {
  id: 'student_1',
  name: 'Иван Петров',
  email: 'ivan.petrov@school.edu',
  role: 'student',
  grade: '8А',
};

export const INITIAL_STUDENT_2: User = {
  id: 'student_2',
  name: 'София Лебедева',
  email: 'sofia.lebedeva@school.edu',
  role: 'student',
  grade: '8А',
};

export function generateAssignmentCode(): string {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(100 + Math.random() * 900);
  return `${p1}-${p2}`;
}

export function normalizeCode(code: string): string {
  return code.replace(/[\s\-_]/g, '').toUpperCase();
}

// Initial Russian Poetic Assignments
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign_pushkin_storm',
    code: '741-201',
    title: 'Зимний вечер',
    author: 'Александр Пушкин',
    grade: '8А',
    lines: [
      'Буря мглою небо кроет,',
      'Вихри снежные крутя;',
      'То, как зверь, она завоет,',
      'То заплачет, как дитя,',
    ],
    parsedLines: [
      {
        originalText: 'Буря мглою небо кроет,',
        syllables: ['Бу', 'ря', 'мгло', 'ю', 'не', 'бо', 'кро', 'ет,'],
        expectedStresses: [true, false, true, false, true, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'Вихри снежные крутя;',
        syllables: ['Вих', 'ри', 'снеж', 'ны', 'е', 'кру', 'тя;'],
        expectedStresses: [true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5],
      },
      {
        originalText: 'То, как зверь, она завоет,',
        syllables: ['То,', 'как', 'зверь,', 'о', 'на', 'за', 'во', 'ет,'],
        expectedStresses: [true, false, true, false, false, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'То заплачет, как дитя,',
        syllables: ['То', 'за', 'пла', 'чет,', 'как', 'ди', 'тя,'],
        expectedStresses: [true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5],
      },
    ],
    expectedScheme: '_U/_U/_U/_U',
    meter: '4-стопный хорей',
    meterType: 'trochee',
    rhyme: 'Перекрёстная (ABAB)',
    rhymeType: 'ABAB',
    createdAt: '2026-09-20T10:00:00.000Z',
    teacherId: 'teacher_1',
    teacherName: 'Анна Сергеевна Воронцова',
    description: 'Определите размер знаменитого пушкинского стихотворения с помощью жестов рук перед камерой.',
  },
  {
    id: 'assign_pushkin_onegin',
    code: '815-302',
    title: 'Евгений Онегин (Глава 1)',
    author: 'Александр Пушкин',
    grade: '8А',
    lines: [
      'Мой дядя самых честных правил,',
      'Когда не в шутку занемог,',
      'Он уважать себя заставил',
      'И лучше выдумать не мог.',
    ],
    parsedLines: [
      {
        originalText: 'Мой дядя самых честных правил,',
        syllables: ['Мой', 'дя', 'дя', 'са', 'мых', 'чест', 'ных', 'пра', 'вил,'],
        expectedStresses: [false, true, false, true, false, true, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'Когда не в шутку занемог,',
        syllables: ['Ког', 'да', 'не', 'в шут', 'ку', 'за', 'не', 'мог,'],
        expectedStresses: [false, true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'Он уважать себя заставил',
        syllables: ['Он', 'у', 'ва', 'жать', 'се', 'бя', 'зас', 'та', 'вил'],
        expectedStresses: [false, false, false, true, false, true, false, true, false],
        expectedFootDividers: [1, 3, 5, 7],
      },
      {
        originalText: 'И лучше выдумать не мог.',
        syllables: ['И', 'луч', 'ше', 'вы', 'ду', 'мать', 'не', 'мог.'],
        expectedStresses: [false, true, false, true, false, false, false, true],
        expectedFootDividers: [1, 3, 5, 7],
      },
    ],
    expectedScheme: 'U_/U_/U_/U_U',
    meter: '4-стопный ямб',
    meterType: 'iamb',
    rhyme: 'Перекрёстная (ABAB)',
    rhymeType: 'ABAB',
    createdAt: '2026-09-22T14:30:00.000Z',
    teacherId: 'teacher_1',
    teacherName: 'Анна Сергеевна Воронцова',
    description: 'Онегинская строфа и классический ямб. Следите за вторым ударным слогом в стопе!',
  },
  {
    id: 'assign_lermontov_clouds',
    code: '629-403',
    title: 'Тучи',
    author: 'Михаил Лермонтов',
    grade: '8А',
    lines: [
      'Тучки небесные, вечные странники!',
      'Степью лазурною, цепью жемчужною',
      'Мчитесь вы, будто как я же, изгнанники',
      'С милого севера в сторону южную.',
    ],
    parsedLines: [
      {
        originalText: 'Тучки небесные, вечные странники!',
        syllables: ['Туч', 'ки', 'не', 'бес', 'ны', 'е,', 'веч', 'ны', 'е', 'стран', 'ни', 'ки!'],
        expectedStresses: [true, false, false, true, false, false, true, false, false, true, false, false],
        expectedFootDividers: [2, 5, 8, 11],
      },
      {
        originalText: 'Степью лазурною, цепью жемчужною',
        syllables: ['Сте', 'пью', 'ла', 'зур', 'но', 'ю,', 'це', 'пью', 'жем', 'чуж', 'но', 'ю'],
        expectedStresses: [true, false, false, true, false, false, true, false, false, true, false, false],
        expectedFootDividers: [2, 5, 8, 11],
      },
      {
        originalText: 'Мчитесь вы, будто как я же, изгнанники',
        syllables: ['Мчи', 'тесь', 'вы,', 'буд', 'то', 'как', 'я', 'же,', 'из', 'гнан', 'ни', 'ки'],
        expectedStresses: [true, false, false, true, false, false, true, false, false, true, false, false],
        expectedFootDividers: [2, 5, 8, 11],
      },
      {
        originalText: 'С милого севера в сторону южную.',
        syllables: ['С ми', 'ло', 'го', 'се', 'ве', 'ра', 'в сто', 'ро', 'ну', 'юж', 'ну', 'ю.'],
        expectedStresses: [true, false, false, true, false, false, true, false, false, true, false, false],
        expectedFootDividers: [2, 5, 8, 11],
      },
    ],
    expectedScheme: '_UU/_UU/_UU/_UU',
    meter: '4-стопный дактиль',
    meterType: 'dactyl',
    rhyme: 'Дактилическая перекрёстная (ABAB)',
    rhymeType: 'ABAB',
    createdAt: '2026-09-25T09:15:00.000Z',
    teacherId: 'teacher_1',
    teacherName: 'Анна Сергеевна Воронцова',
    description: 'Трехсложный размер: ударный слог и два безударных (_ U U). Почувствуйте напевность дактиля.',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_1',
    assignmentId: 'assign_pushkin_storm',
    studentId: 'student_1',
    studentName: 'Иван Петров',
    studentEmail: 'ivan.petrov@school.edu',
    grade: '8А',
    submittedAt: '2026-09-24T11:20:00.000Z',
    isTraining: false,
    trainingCount: 3, // Student practiced 3 times!
    gestureLines: [
      { lineIndex: 0, gestures: ['_', 'U', '_', 'U', '_', 'U', '_', 'U'] },
      { lineIndex: 1, gestures: ['_', 'U', '_', 'U', 'U', 'U', '_'] },
      { lineIndex: 2, gestures: ['_', 'U', '_', 'U', 'U', 'U', '_', 'U'] },
      { lineIndex: 3, gestures: ['_', 'U', '_', 'U', 'U', 'U', '_'] },
    ],
    recordedScheme: '_U_U_U_U',
    dividedFeetScheme: '_U / _U / _U / _U',
    studentDividers: [[1, 3, 5, 7], [1, 3, 5], [1, 3, 5, 7], [1, 3, 5]],
    studentMeter: '4-стопный хорей',
    studentRhyme: 'Перекрёстная (ABAB)',
    accuracy: 94,
    meterCorrect: true,
    rhymeCorrect: true,
    teacherComment: 'Отличная работа, Иван! Ритм передан очень точно, жесты четкие. В слове «снежные» обрати внимание на безударное окончание.',
    teacherCommentDate: '2026-09-24T12:00:00.000Z',
    aiRecommendations: 'Прекрасный ритмический слух! Ты уверенно зафиксировал хореический шаг (_U). Чередование ребра ладони синхронизировано с темпом Пушкина.',
  },
  {
    id: 'sub_2',
    assignmentId: 'assign_pushkin_storm',
    studentId: 'student_2',
    studentName: 'София Лебедева',
    studentEmail: 'sofia.lebedeva@school.edu',
    grade: '8А',
    submittedAt: '2026-09-24T15:40:00.000Z',
    isTraining: false,
    trainingCount: 1,
    gestureLines: [
      { lineIndex: 0, gestures: ['_', 'U', '_', 'U', '_', 'U', '_', 'U'] },
      { lineIndex: 1, gestures: ['_', 'U', '_', 'U', 'U', 'U', '_'] },
      { lineIndex: 2, gestures: ['_', 'U', '_', 'U', '_', 'U', '_', 'U'] },
      { lineIndex: 3, gestures: ['_', 'U', '_', 'U', 'U', 'U', '_'] },
    ],
    recordedScheme: '_U_U_U_U',
    dividedFeetScheme: '_U / _U / _U / _U',
    studentDividers: [[1, 3, 5, 7], [1, 3, 5], [1, 3, 5, 7], [1, 3, 5]],
    studentMeter: '4-стопный хорей',
    studentRhyme: 'Перекрёстная (ABAB)',
    accuracy: 98,
    meterCorrect: true,
    rhymeCorrect: true,
    teacherComment: 'Безукоризненный результат! Отделение стоп вертикальными чертами выполнено верно.',
    teacherCommentDate: '2026-09-24T16:10:00.000Z',
  },
];

// Helper functions for localStorage
export function getSavedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) {
      const user = JSON.parse(raw);
      // Remove any test mock accounts from earlier versions
      if (
        user &&
        (user.id === 'teacher_1' ||
          user.id === 'student_1' ||
          user.id === 'student_2' ||
          user.id?.startsWith('mock_'))
      ) {
        localStorage.removeItem(STORAGE_KEY_USER);
        return null;
      }
      return user;
    }
  } catch {}
  return null; // Start as unauthenticated visitor on Landing Screen
}

export function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}

export function getAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (raw) {
      const parsed: Assignment[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a, i) => ({
          ...a,
          code: a.code || INITIAL_ASSIGNMENTS[i]?.code || generateAssignmentCode(),
        }));
      }
    }
  } catch {}
  return INITIAL_ASSIGNMENTS;
}

export function saveAssignments(assignments: Assignment[]) {
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
}

export function getSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_SUBMISSIONS;
}

export function saveSubmissions(submissions: Submission[]) {
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
}
