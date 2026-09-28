import { LineScheme } from '../types';

export const RUSSIAN_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);

/**
 * Splits a Russian word or phrase into syllables based on Russian vocalic rules.
 * Each syllable contains exactly one vowel.
 */
export function splitWordIntoSyllables(word: string): string[] {
  const cleanWord = word.trim();
  if (!cleanWord) return [];

  const lower = cleanWord.toLowerCase();
  const vowelIndices: number[] = [];

  for (let i = 0; i < lower.length; i++) {
    if (RUSSIAN_VOWELS.has(lower[i])) {
      vowelIndices.push(i);
    }
  }

  // If no vowels (e.g. preposition "в", "к", "с")
  if (vowelIndices.length === 0) {
    return [cleanWord];
  }

  if (vowelIndices.length === 1) {
    return [cleanWord];
  }

  const syllables: string[] = [];
  let prevSplit = 0;

  for (let k = 0; k < vowelIndices.length - 1; k++) {
    const v1 = vowelIndices[k];
    const v2 = vowelIndices[k + 1];
    const consonantsBetween = v2 - v1 - 1;

    let splitIndex: number;
    if (consonantsBetween === 0) {
      // Two vowels adjacent (дифтонг или стечение гласных, e.g. "мгло-ю", "не-бо") -> divide between them
      splitIndex = v1 + 1;
    } else if (consonantsBetween === 1) {
      // One consonant -> in open syllable phonetics, consonant goes to the second syllable: e.g. "бу-ря", "не-бо"
      splitIndex = v1 + 1;
    } else {
      // Multiple consonants:
      // If starts with sonorant (р, л, м, н, й), usually split after sonorant: e.g. "снеж-ные", "вих-ри"
      const firstCons = lower[v1 + 1];
      if (['р', 'л', 'м', 'н', 'й'].includes(firstCons)) {
        splitIndex = v1 + 2;
      } else {
        splitIndex = v1 + 1;
      }
    }

    syllables.push(cleanWord.slice(prevSplit, splitIndex));
    prevSplit = splitIndex;
  }

  syllables.push(cleanWord.slice(prevSplit));
  return syllables.filter(s => s.length > 0);
}

/**
 * Decomposes an entire Russian poetic line into syllables, keeping punctuation or spacing readable.
 */
export function splitLineIntoSyllables(line: string): string[] {
  // Split into tokens (words and punctuation)
  const tokens = line.split(/(\s+|[.,!?;:—–"«»]+)/).filter(Boolean);
  const result: string[] = [];
  let pendingNonVowel = '';

  for (const token of tokens) {
    // If it's punctuation or spaces
    if (/^[\s.,!?;:—–"«»]+$/.test(token)) {
      if (result.length > 0) {
        result[result.length - 1] += token;
      } else {
        pendingNonVowel += token;
      }
      continue;
    }

    // Check if word has vowels
    const lower = token.toLowerCase();
    const hasVowels = Array.from(lower).some(char => RUSSIAN_VOWELS.has(char));

    if (!hasVowels) {
      // Non-vocalic preposition like "к", "в", "с" attach to following word or previous
      pendingNonVowel += token + ' ';
      continue;
    }

    const syls = splitWordIntoSyllables(token);
    if (syls.length > 0 && pendingNonVowel) {
      syls[0] = pendingNonVowel + syls[0];
      pendingNonVowel = '';
    }

    for (const s of syls) {
      result.push(s);
    }
  }

  return result;
}

/**
 * Standard Meter Templates in Russian metrics
 */
export interface MeterDefinition {
  name: string;
  type: 'trochee' | 'iamb' | 'dactyl' | 'amphibrach' | 'anapest';
  syllableFootLength: number;
  pattern: boolean[]; // true = _, false = U
  description: string;
  example: string;
}

export const METERS: MeterDefinition[] = [
  {
    name: 'Хорей',
    type: 'trochee',
    syllableFootLength: 2,
    pattern: [true, false], // _ U
    description: 'Двухсложный размер с ударением на первом слоге стопы (_U). Звучит энергично, плясово, решительно.',
    example: '«Бу́ря мглóю нéбо крóет»',
  },
  {
    name: 'Ямб',
    type: 'iamb',
    syllableFootLength: 2,
    pattern: [false, true], // U _
    description: 'Двухсложный размер с ударением на втором слоге стопы (U_). Самый популярный размер русской классики.',
    example: '«Мой дя́дя са́мых чéстных прáвил»',
  },
  {
    name: 'Дактиль',
    type: 'dactyl',
    syllableFootLength: 3,
    pattern: [true, false, false], // _ U U
    description: 'Трехсложный размер с ударением на первом слоге стопы (_UU). Звучит плавно, задумчиво, напевно.',
    example: '«Тýчки небéсные, вéчные стрáнники»',
  },
  {
    name: 'Амфибрахий',
    type: 'amphibrach',
    syllableFootLength: 3,
    pattern: [false, true, false], // U _ U
    description: 'Трехсложный размер с ударением на втором (среднем) слоге стопы (U_U). Мягкий, повествовательный ритм.',
    example: '«Сижý за решёткой в темни́це сырóй»',
  },
  {
    name: 'Анапест',
    type: 'anapest',
    syllableFootLength: 3,
    pattern: [false, false, true], // U U _
    description: 'Трехсложный размер с ударением на третьем слоге стопы (UU_). Звучит стремительно, эмоционально.',
    example: '«О, весна́ без концá и без крáю»',
  },
];

export const RHYME_TYPES = [
  { id: 'ABAB', name: 'Перекрёстная (ABAB)', description: 'Первая строка рифмуется с третьей, вторая — с четвёртой.' },
  { id: 'AABB', name: 'Смежная / Парная (AABB)', description: 'Строки рифмуются попарно: 1-я со 2-й, 3-я с 4-й.' },
  { id: 'ABBA', name: 'Кольцевая / Опоясывающая (ABBA)', description: 'Первая строка рифмуется с четвёртой, а вторая — с третьей.' },
];

/**
 * Generate scheme string (e.g. "_U/_U/_U/_U") from stresses array and foot size
 */
export function formatSchemeString(stresses: boolean[], footSize: number): string {
  const parts: string[] = [];
  let currentFoot = '';

  for (let i = 0; i < stresses.length; i++) {
    currentFoot += stresses[i] ? '_' : 'U';
    if ((i + 1) % footSize === 0 || i === stresses.length - 1) {
      parts.push(currentFoot);
      currentFoot = '';
    }
  }

  return parts.filter(Boolean).join('/');
}

/**
 * Compare student recorded scheme against expected line scheme
 */
export function compareLineScansion(
  studentStresses: ('_' | 'U')[],
  expectedStresses: boolean[]
): {
  matchesCount: number;
  totalCount: number;
  accuracy: number;
  errors: { index: number; expected: boolean; actual: string }[];
} {
  let matches = 0;
  const errors: { index: number; expected: boolean; actual: string }[] = [];
  const len = Math.max(studentStresses.length, expectedStresses.length);

  for (let i = 0; i < len; i++) {
    const exp = expectedStresses[i] ?? false;
    const act = studentStresses[i] ?? 'U';
    const isActStressed = act === '_';

    if (isActStressed === exp) {
      matches++;
    } else {
      errors.push({ index: i, expected: exp, actual: act });
    }
  }

  const accuracy = len > 0 ? Math.round((matches / len) * 100) : 100;
  return {
    matchesCount: matches,
    totalCount: len,
    accuracy,
    errors,
  };
}
