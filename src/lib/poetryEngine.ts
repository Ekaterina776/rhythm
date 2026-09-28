import { LineScheme } from '../types';

export const RUSSIAN_VOWELS = new Set(['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);

// Plosive/fricative + liquid clusters that start a syllable onset in Russian:
// бр, пр, др, тр, гр, кр, фр, хр, бл, пл, гл, кл, вл, фл, сл, зл
const ONSET_CLUSTERS_WITH_LIQUIDS = new Set([
  'бр', 'пр', 'др', 'тр', 'гр', 'кр', 'фр', 'хр',
  'бл', 'пл', 'гл', 'кл', 'вл', 'фл', 'сл', 'зл',
]);

// Plosives/fricatives that combine with 'в': кв, св, зв, тв, дв, хв
const ONSET_CLUSTERS_WITH_V = new Set(['кв', 'св', 'зв', 'тв', 'дв', 'хв']);

/**
 * Splits a Russian word into syllables based on Russian school grammar & phonetic scansion rules:
 * 1. Each syllable contains exactly one vowel.
 * 2. 'ь', 'ъ' never start a syllable (they attach to the preceding consonant or combine with onset).
 * 3. 'й' always closes the preceding syllable ('май-ка', 'вой-на', 'чай-ник').
 * 4. Double consonants split between syllables ('стран-ни-ки', 'рус-ский', 'ван-на').
 * 5. Consonant combinations:
 *    - plosive + sonorant ('до-бро', 'ка-пля', 'за-пла-чет', 'хи-трый', 'кру-тя') stay together in the next syllable.
 *    - clusters split according to traditional scansion: 'буд-то', 'ког-да', 'луч-ше', 'вих-ри', 'снеж-ные', 'туч-ки', 'веч-ные', 'юж-ная', 'чест-ных', 'зас-та-вил', 'из-гнан-ни-ки'.
 */
export function splitWordIntoSyllables(word: string): string[] {
  const cleanWord = word.trim();
  if (!cleanWord) return [];

  // Handle hyphenated words (e.g. кто-то, из-за, по-прежнему)
  if (cleanWord.includes('-')) {
    const parts = cleanWord.split('-');
    const res: string[] = [];
    for (let p = 0; p < parts.length; p++) {
      const partSyls = splitWordIntoSyllables(parts[p]);
      if (p < parts.length - 1 && partSyls.length > 0) {
        partSyls[partSyls.length - 1] += '-';
      }
      res.push(...partSyls);
    }
    return res;
  }

  const lower = cleanWord.toLowerCase();
  const vowelIndices: number[] = [];

  for (let i = 0; i < lower.length; i++) {
    if (RUSSIAN_VOWELS.has(lower[i])) {
      vowelIndices.push(i);
    }
  }

  // If 0 or 1 vowel, cannot be divided
  if (vowelIndices.length <= 1) {
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
      // Adjacent vowels (мгло-ю, не-бес-ны-е, ла-зур-но-ю, по-э-т)
      splitIndex = v1 + 1;
    } else if (consonantsBetween === 1) {
      // Exactly one consonant between vowels
      const singleChar = lower[v1 + 1];
      if (singleChar === 'й') {
        // 'й' closes syllable: май-ор, рай-он
        splitIndex = v1 + 2;
      } else {
        // Single consonant goes to the second syllable: бу-ря, не-бо, ди-тя
        splitIndex = v1 + 1;
      }
    } else {
      // 2 or more consonants between v1 and v2
      const betweenStr = lower.slice(v1 + 1, v2);
      const firstChar = betweenStr[0];
      const secondChar = betweenStr[1];

      // Case A: check for 'ь' or 'ъ'
      if (betweenStr.length === 2 && (secondChar === 'ь' || secondChar === 'ъ')) {
        // e.g. сте-пью, це-пью, вью-га, чью
        splitIndex = v1 + 1;
      } else if (firstChar === 'й') {
        // 'й' always closes first syllable: май-ка, вой-на, тай-на
        splitIndex = v1 + 2;
      } else if (betweenStr.includes('ь') || betweenStr.includes('ъ')) {
        // 'ь' or 'ъ' closes with previous consonant: маль-чик, пись-мо, коль-цо, толь-ко, подъ-езд
        const signIdx = Math.max(betweenStr.indexOf('ь'), betweenStr.indexOf('ъ'));
        splitIndex = v1 + 1 + signIdx + 1;
      } else if (consonantsBetween === 2) {
        // Two consonants:
        if (firstChar === secondChar) {
          // Double consonants: стран-ник, рус-ский, ван-на, кас-са
          splitIndex = v1 + 2;
        } else if (ONSET_CLUSTERS_WITH_LIQUIDS.has(betweenStr)) {
          // Plosive + liquid: за-пла-чет, до-бро, ка-пля, хи-трый
          splitIndex = v1 + 1;
        } else {
          // School syllable division for two consonants:
          // вих-ри, снеж-ные, туч-ки, веч-ные, ког-да, буд-то, луч-ше, юж-ная, пар-та, пол-ка, бан-ка
          splitIndex = v1 + 2;
        }
      } else {
        // 3 or more consonants between vowels
        // e.g. сес-тра (с | тр), быс-тро (с | тр), из-гнан-ни-ки (з | гн)
        const lastTwo = betweenStr.slice(-2);
        if (ONSET_CLUSTERS_WITH_LIQUIDS.has(lastTwo) || lastTwo === 'гн' || ONSET_CLUSTERS_WITH_V.has(lastTwo)) {
          splitIndex = v2 - 2;
        } else if (['н', 'к', 'т', 'м'].includes(betweenStr.slice(-1))) {
          // e.g. чест-ных (ст | н), рожд-ный
          splitIndex = v2 - 1;
        } else {
          // e.g. зас-та-вил (с | та)
          splitIndex = v1 + 2;
        }
      }
    }

    // Safety checks for valid string slice range
    if (splitIndex <= prevSplit) {
      splitIndex = prevSplit + 1;
    }
    if (splitIndex >= v2 + 1) {
      splitIndex = v2;
    }

    syllables.push(cleanWord.slice(prevSplit, splitIndex));
    prevSplit = splitIndex;
  }

  syllables.push(cleanWord.slice(prevSplit));
  return syllables.filter(s => s.length > 0);
}

/**
 * Decomposes an entire Russian poetic line into syllables,
 * keeping punctuation readable and attaching non-vocalic prepositions (в, к, с)
 * cleanly to the following word's first syllable.
 */
export function splitLineIntoSyllables(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // Match words and tokens
  const wordsWithPunct = trimmed.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let pendingPrefix = '';

  for (const rawToken of wordsWithPunct) {
    // Separate leading punctuation (e.g. «, (, —), core word, and trailing punctuation (e.g. ,, ., !, ?, », ))
    const match = rawToken.match(/^([^a-zA-Zа-яА-ЯёЁ0-9]*)(.*?)([^a-zA-Zа-яА-ЯёЁ0-9]*)$/);
    if (!match) continue;

    const leadPunct = match[1] || '';
    const core = match[2] || '';
    const trailPunct = match[3] || '';

    if (!core) {
      // Just standalone punctuation like '—'
      if (result.length > 0) {
        result[result.length - 1] += ' ' + rawToken;
      } else {
        pendingPrefix += rawToken + ' ';
      }
      continue;
    }

    // Check if the core word has any vowels
    const lowerCore = core.toLowerCase();
    const vowelCount = Array.from(lowerCore).filter(ch => RUSSIAN_VOWELS.has(ch)).length;

    if (vowelCount === 0) {
      // Non-vocalic preposition or particle (e.g. 'в', 'к', 'с', 'ж', 'б')
      pendingPrefix += (leadPunct + core + trailPunct) + ' ';
      continue;
    }

    // Split core word into syllables
    const syls = splitWordIntoSyllables(core);

    if (syls.length === 0) continue;

    // Attach leading punctuation and any pending non-vowel prefix to the first syllable
    syls[0] = (pendingPrefix + leadPunct + syls[0]).trimStart();
    pendingPrefix = '';

    // Attach trailing punctuation to the last syllable
    if (trailPunct) {
      syls[syls.length - 1] = syls[syls.length - 1] + trailPunct;
    }

    for (const s of syls) {
      result.push(s);
    }
  }

  // If there was any trailing prefix without following words
  if (pendingPrefix && result.length > 0) {
    result[result.length - 1] += ' ' + pendingPrefix.trim();
  } else if (pendingPrefix) {
    result.push(pendingPrefix.trim());
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
