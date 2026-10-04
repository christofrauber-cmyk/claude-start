import type { PoseDef, SequenceStep, Side } from './types';

export interface ParsedItem {
  text: string;
  step: SequenceStep | null;
  pose: PoseDef | null;
}

/**
 * Normalize text for comparison:
 * - lowercase
 * - strip diacritics (NFD + remove combining marks)
 * - map ß → ss
 * - treat hyphens/underscores as spaces
 * - collapse whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove combining marks
    .replace(/ß/g, 'ss')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Create a loose key for fuzzy matching:
 * - remove 'h' after consonants
 * - collapse doubled letters
 * - map w → v
 */
function getLooseKey(text: string): string {
  const normalized = normalizeText(text);

  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    // Skip 'h' after consonants
    if (char === 'h' && i > 0) {
      const prev = normalized[i - 1];
      if (prev !== ' ' && !'aeiou'.includes(prev)) {
        continue;
      }
    }

    // Skip duplicate letters (keep first)
    if (char === next) {
      result += char;
      continue;
    }

    // Map w to v
    if (char === 'w') {
      result += 'v';
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[a.length][b.length];
}

/**
 * Get all candidate names for a pose (id with underscores as spaces, sanskrit, nameDe, nameEn, aliases)
 * Also includes numeral-normalized variants
 */
function getCandidateNames(pose: PoseDef): string[] {
  const baseCandidates = [
    pose.id.replace(/_/g, ' '),
    pose.sanskrit,
    pose.nameDe,
    pose.nameEn,
  ];
  if (pose.aliases) {
    baseCandidates.push(...pose.aliases);
  }

  // Add numeral-normalized variants
  const allCandidates = [...baseCandidates];
  for (const base of baseCandidates) {
    const normalized = normalizeNumerals(base);
    if (normalized !== base) {
      allCandidates.push(normalized);
    }
  }

  return allCandidates;
}

/**
 * Filler words to ignore
 */
const FILLER_WORDS = new Set(['und', 'and', 'dann', 'then', 'pose', 'haltung', 'asana']);

/**
 * Side words and their meanings
 */
const SIDE_PATTERNS: Record<string, Side> = {
  'rechts': 'right',
  're': 'right',
  'r': 'right',
  'right': 'right',
  'links': 'left',
  'li': 'left',
  'l': 'left',
  'left': 'left',
};

/**
 * Convert Roman numerals to Arabic
 */
function romanToArabic(roman: string): string | null {
  const romanMap: Record<string, number> = {
    'i': 1,
    'ii': 2,
    'iii': 3,
    'iv': 4,
    'v': 5,
    'vi': 6,
    'vii': 7,
    'viii': 8,
    'ix': 9,
    'x': 10,
  };
  const lower = roman.toLowerCase();
  if (lower in romanMap) {
    return String(romanMap[lower as keyof typeof romanMap]);
  }
  return null;
}

/**
 * Normalize text by converting Roman numerals to Arabic
 */
function normalizeNumerals(text: string): string {
  return text.replace(/\b([ivxlcdm]+)\b/gi, (match) => {
    const arabic = romanToArabic(match);
    return arabic !== null ? arabic : match;
  });
}

/**
 * Split input text by various delimiters
 */
function splitByDelimiters(text: string): string[] {
  // Replace delimiters with newlines, then split
  let processed = text
    .replace(/[,;/|→]/g, '\n')
    .replace(/->/g, '\n')
    .replace(/ - | – /g, '\n')
    .replace(/\+/g, '\n')
    // Handle numbered lists (e.g., "1." "2)")
    .replace(/^\s*\d+[.)]\s+/gm, '\n')
    .replace(/\s+\d+[.)]\s+/g, '\n');

  return processed
    .split('\n')
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
}

/**
 * Try to match tokens starting at a given position against pose names
 */
function tryMatchPose(
  tokens: string[],
  startIdx: number,
  poses: PoseDef[],
  looseKeyMap: Map<string, PoseDef[]>
): { endIdx: number; pose: PoseDef } | null {
  // Try longest match first (greedy)
  for (let length = Math.min(6, tokens.length - startIdx); length >= 1; length--) {
    const testTokens = tokens.slice(startIdx, startIdx + length);
    const testText = testTokens.join(' ');
    const testLooseKey = getLooseKey(testText);

    // Try exact match on loose key
    const candidates = looseKeyMap.get(testLooseKey) || [];
    if (candidates.length > 0) {
      return { endIdx: startIdx + length, pose: candidates[0] };
    }

    // Try fuzzy match if length is in range
    if (testLooseKey.length >= 6) {
      const maxDist = testLooseKey.length > 10 ? 2 : 1;
      for (const pose of poses) {
        for (const name of getCandidateNames(pose)) {
          const nameLooseKey = getLooseKey(name);
          const dist = levenshteinDistance(testLooseKey, nameLooseKey);
          if (dist <= maxDist) {
            return { endIdx: startIdx + length, pose };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Parse a sequence from free text input
 */
export function parseSequence(input: string, poses: PoseDef[]): ParsedItem[] {
  const result: ParsedItem[] = [];

  // Build a map of loose keys to poses
  const looseKeyMap = new Map<string, PoseDef[]>();
  for (const pose of poses) {
    for (const name of getCandidateNames(pose)) {
      const key = getLooseKey(name);
      if (!looseKeyMap.has(key)) {
        looseKeyMap.set(key, []);
      }
      looseKeyMap.get(key)!.push(pose);
    }
  }

  // Replace b/s with beide seiten before splitting (to avoid "/" split breaking it)
  let preprocessed = input.replace(/\bb\/s\b/gi, 'beide seiten');

  // Split by delimiters
  const chunks = splitByDelimiters(preprocessed);

  for (const chunk of chunks) {
    // Normalize numerals
    const normalized = normalizeNumerals(chunk);

    // Split chunk into tokens (keep all tokens)
    const tokens = normalizeText(normalized)
      .split(/\s+/)
      .filter(token => token.length > 0);

    if (tokens.length === 0) {
      continue;
    }

    // Greedily scan tokens
    let idx = 0;
    let unknownTokens: string[] = [];

    while (idx < tokens.length) {
      const token = tokens[idx];

      // Skip filler words
      if (FILLER_WORDS.has(token)) {
        idx++;
        continue;
      }

      const match = tryMatchPose(tokens, idx, poses, looseKeyMap);

      if (match) {
        // Push any accumulated unknown tokens first
        if (unknownTokens.length > 0) {
          const unknownText = unknownTokens.join(' ');
          result.push({
            text: unknownText,
            step: null,
            pose: null,
          });
          unknownTokens = [];
        }

        // Extract side from tokens after the matched pose
        let sideIdx = match.endIdx;
        let sideAfter: Side | null = null;
        let sideText = '';
        let isBothSides = false;

        // Scan tokens after the pose for side indicators
        while (sideIdx < tokens.length) {
          const sideToken = tokens[sideIdx];

          // Check for side patterns
          if (SIDE_PATTERNS[sideToken] !== undefined) {
            sideAfter = SIDE_PATTERNS[sideToken];
            sideText += (sideText ? ' ' : '') + sideToken;
            sideIdx++;
          } else if (sideToken === '(rechts)' || sideToken === '(links)' ||
                     sideToken === '(re)' || sideToken === '(li)' ||
                     sideToken === '(right)' || sideToken === '(left)') {
            // Handle parenthesized sides
            const matched = sideToken.match(/\((rechts|re|r|right|links|li|l|left)\)/i);
            if (matched) {
              const sideWord = matched[1].toLowerCase();
              sideAfter = SIDE_PATTERNS[sideWord];
              sideText += (sideText ? ' ' : '') + sideToken;
              sideIdx++;
            } else {
              break;
            }
          } else if (sideToken === 'beide' || sideToken === 'both' || sideToken === 'b/s') {
            // Check for both sides patterns
            if (sideToken === 'beide' && sideIdx + 1 < tokens.length && tokens[sideIdx + 1] === 'seiten') {
              isBothSides = true;
              sideText += (sideText ? ' ' : '') + 'beide seiten';
              sideIdx += 2;
            } else if (sideToken === 'both' && sideIdx + 1 < tokens.length && tokens[sideIdx + 1] === 'sides') {
              isBothSides = true;
              sideText += (sideText ? ' ' : '') + 'both sides';
              sideIdx += 2;
            } else if (sideToken === 'b/s') {
              isBothSides = true;
              sideText += (sideText ? ' ' : '') + 'b/s';
              sideIdx++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // Build the matched text
        let matchedText = tokens.slice(idx, match.endIdx).join(' ');
        if (sideText) {
          matchedText += ' ' + sideText;
        }

        // Add step(s)
        if (match.pose.sided && isBothSides) {
          // Emit twice: right then left
          result.push({
            text: matchedText,
            step: { poseId: match.pose.id, side: 'right' },
            pose: match.pose,
          });
          result.push({
            text: matchedText,
            step: { poseId: match.pose.id, side: 'left' },
            pose: match.pose,
          });
        } else if (match.pose.sided && sideAfter) {
          result.push({
            text: matchedText,
            step: { poseId: match.pose.id, side: sideAfter },
            pose: match.pose,
          });
        } else {
          result.push({
            text: matchedText,
            step: { poseId: match.pose.id },
            pose: match.pose,
          });
        }

        idx = sideIdx;
      } else {
        unknownTokens.push(tokens[idx]);
        idx++;
      }
    }

    // Push any remaining unknown tokens
    if (unknownTokens.length > 0) {
      const unknownText = unknownTokens.join(' ');
      result.push({
        text: unknownText,
        step: null,
        pose: null,
      });
    }
  }

  return result;
}
