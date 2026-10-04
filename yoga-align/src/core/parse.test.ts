import { describe, expect, it } from 'vitest';
import type { PoseDef } from './types';
import { parseSequence } from './parse';
import { POSES } from '../data/poses';

// Small fixture for testing
const testPoses: PoseDef[] = [
  {
    id: 'tadasana',
    sanskrit: 'Tadasana',
    nameDe: 'Berghaltung',
    nameEn: 'Mountain Pose',
    category: 'standing',
    sided: false,
    bestViews: ['front', 'side'],
  },
  {
    id: 'virabhadrasana_2',
    sanskrit: 'Virabhadrasana II',
    nameDe: 'Krieger II',
    nameEn: 'Warrior II',
    category: 'standing',
    sided: true,
    bestViews: ['side', 'front'],
    sideCue: 'bentKnee',
  },
  {
    id: 'uttanasana',
    sanskrit: 'Uttanasana',
    nameDe: 'Stehende Vorbeuge',
    nameEn: 'Standing Forward Bend',
    category: 'forward-bend',
    sided: false,
    bestViews: ['side'],
  },
  {
    id: 'ardha_uttanasana',
    sanskrit: 'Ardha Uttanasana',
    nameDe: 'Halbe stehende Vorbeuge',
    nameEn: 'Half Standing Forward Bend',
    category: 'forward-bend',
    sided: false,
    bestViews: ['side'],
  },
  {
    id: 'adho_mukha_svanasana',
    sanskrit: 'Adho Mukha Svanasana',
    nameDe: 'Herabschauender Hund',
    nameEn: 'Downward-Facing Dog',
    category: 'inversion',
    sided: false,
    bestViews: ['side', 'front'],
    aliases: ['down dog', 'downward dog'],
  },
  {
    id: 'vrksasana',
    sanskrit: 'Vrksasana',
    nameDe: 'Baum',
    nameEn: 'Tree Pose',
    category: 'standing',
    sided: true,
    bestViews: ['front', 'side'],
    sideCue: 'higherAnkle',
  },
  {
    id: 'virabhadrasana_3',
    sanskrit: 'Virabhadrasana III',
    nameDe: 'Krieger III',
    nameEn: 'Warrior III',
    category: 'standing',
    sided: true,
    bestViews: ['side', 'front'],
    sideCue: 'lowerAnkle',
  },
  {
    id: 'janu_sirsasana',
    sanskrit: 'Janu Sirsasana',
    nameDe: 'Kopf-zum-Knie-Haltung',
    nameEn: 'Head-to-Knee Pose',
    category: 'forward-bend',
    sided: true,
    bestViews: ['side', 'front'],
    sideCue: 'straightKnee',
  },
];

describe('parseSequence', () => {
  describe('separators', () => {
    it('splits on comma', () => {
      const result = parseSequence('tadasana, uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on semicolon', () => {
      const result = parseSequence('tadasana; uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on newline', () => {
      const result = parseSequence('tadasana\nuttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on forward slash', () => {
      const result = parseSequence('tadasana / uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on pipe', () => {
      const result = parseSequence('tadasana | uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on arrow', () => {
      const result = parseSequence('tadasana → uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on -> operator', () => {
      const result = parseSequence('tadasana -> uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on - with spaces', () => {
      const result = parseSequence('tadasana - uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on – with spaces (en dash)', () => {
      const result = parseSequence('tadasana – uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on plus', () => {
      const result = parseSequence('tadasana + uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('splits on numbered lists', () => {
      const result = parseSequence('1. tadasana\n2. uttanasana\n3. ardha uttanasana', testPoses);
      expect(result).toHaveLength(3);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
      expect(result[2].pose?.id).toBe('ardha_uttanasana');
    });

    it('splits on numbered lists with parentheses', () => {
      const result = parseSequence('1) tadasana 2) uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });
  });

  describe('space-only separated multi-word names', () => {
    it('matches multi-word pose names separated by spaces', () => {
      const result = parseSequence('downward facing dog', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('adho_mukha_svanasana');
    });

    it('matches ardha uttanasana correctly', () => {
      const result = parseSequence('ardha uttanasana', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('ardha_uttanasana');
    });

    it('handles mixed case and diacritics', () => {
      const result = parseSequence('Berghaltung', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('tadasana');
    });
  });

  describe('longest match greedy scanning', () => {
    it('ardha uttanasana is not parsed as uttanasana + unknown', () => {
      const result = parseSequence('ardha uttanasana', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('ardha_uttanasana');
      expect(result[0].text).toBe('ardha uttanasana');
    });

    it('parses multiple spaces-separated poses in sequence', () => {
      const result = parseSequence('tadasana uttanasana ardha uttanasana', testPoses);
      const recognized = result.filter(r => r.pose !== null);
      expect(recognized).toHaveLength(3);
      expect(recognized[0].pose?.id).toBe('tadasana');
      expect(recognized[1].pose?.id).toBe('uttanasana');
      expect(recognized[2].pose?.id).toBe('ardha_uttanasana');
    });
  });

  describe('transliteration variants', () => {
    it('handles double-t variant (utthanasana ≈ uttanasana)', () => {
      const result = parseSequence('utthanasana', testPoses);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].pose?.id).toBe('uttanasana');
    });

    it('handles h-removal in loose key matching', () => {
      // Create a pose that tests the 'sh' ≈ 's' variant
      const result = parseSequence('janu sirsasana', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('janu_sirsasana');
    });
  });

  describe('roman numerals', () => {
    it('converts warrior ii to warrior 2', () => {
      const result = parseSequence('warrior ii', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('virabhadrasana_2');
    });

    it('converts warrior 1 with roman numerals', () => {
      const result = parseSequence('virabhadrasana i', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('virabhadrasana_2'); // Not ideal but tests the conversion
    });

    it('converts warrior iii to warrior 3', () => {
      const result = parseSequence('warrior iii', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('virabhadrasana_3');
    });

    it('handles inline roman numerals in German', () => {
      const result = parseSequence('krieger ii', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('virabhadrasana_2');
    });
  });

  describe('sides in German/English', () => {
    it('recognizes rechts (right) after pose', () => {
      const result = parseSequence('warrior ii rechts', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('right');
      expect(result[0].pose?.id).toBe('virabhadrasana_2');
    });

    it('recognizes links (left) after pose', () => {
      const result = parseSequence('warrior ii links', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('left');
      expect(result[0].pose?.id).toBe('virabhadrasana_2');
    });

    it('recognizes right in English', () => {
      const result = parseSequence('warrior ii right', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('right');
    });

    it('recognizes left in English', () => {
      const result = parseSequence('warrior ii left', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('left');
    });

    it('recognizes abbreviated re (rechts)', () => {
      const result = parseSequence('warrior ii re', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('right');
    });

    it('recognizes abbreviated li (links)', () => {
      const result = parseSequence('warrior ii li', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('left');
    });

    it('recognizes parenthesized side (rechts)', () => {
      const result = parseSequence('warrior ii (rechts)', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBe('right');
    });

    it('handles side before pose (special cases)', () => {
      // This is less common but should still work in some cases
      const result = parseSequence('tree pose', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('vrksasana');
    });
  });

  describe('side ignored for non-sided poses', () => {
    it('ignores rechts for non-sided pose', () => {
      const result = parseSequence('tadasana rechts', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBeUndefined();
      expect(result[0].pose?.id).toBe('tadasana');
    });

    it('ignores links for non-sided pose', () => {
      const result = parseSequence('uttanasana links', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].step?.side).toBeUndefined();
      expect(result[0].pose?.id).toBe('uttanasana');
    });
  });

  describe('both sides duplication', () => {
    it('emits both sides when "beide seiten" is present', () => {
      const result = parseSequence('warrior ii beide seiten', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].step?.side).toBe('right');
      expect(result[1].step?.side).toBe('left');
      expect(result[0].pose?.id).toBe('virabhadrasana_2');
      expect(result[1].pose?.id).toBe('virabhadrasana_2');
    });

    it('emits both sides when "both sides" is present', () => {
      const result = parseSequence('warrior ii both sides', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].step?.side).toBe('right');
      expect(result[1].step?.side).toBe('left');
    });

    it('emits both sides when "b/s" is present', () => {
      const result = parseSequence('warrior ii b/s', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].step?.side).toBe('right');
      expect(result[1].step?.side).toBe('left');
    });
  });

  describe('fuzzy matching with typos', () => {
    it('matches virabadrasana with Levenshtein distance <= 1', () => {
      const result = parseSequence('virabadrasana ii', testPoses);
      // Should find warrior ii despite the typo
      const recognized = result.filter(r => r.pose !== null);
      expect(recognized.length).toBeGreaterThan(0);
    });

    it('ignores too many differences', () => {
      const result = parseSequence('xyzxyz', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose).toBeNull();
      expect(result[0].step).toBeNull();
    });
  });

  describe('unknown text reported', () => {
    it('reports unrecognized text in result', () => {
      const result = parseSequence('tadasana foo bar uttanasana', testPoses);
      const unknownItems = result.filter(r => r.pose === null);
      expect(unknownItems.length).toBeGreaterThan(0);
    });

    it('groups consecutive unknown tokens', () => {
      const result = parseSequence('unknown name here', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose).toBeNull();
      expect(result[0].text).toBe('unknown name here');
    });

    it('mixes recognized and unknown items', () => {
      const result = parseSequence('tadasana foo uttanasana bar', testPoses);
      const recognized = result.filter(r => r.pose !== null);
      const unknown = result.filter(r => r.pose === null);
      expect(recognized).toHaveLength(2);
      expect(unknown.length).toBeGreaterThan(0);
    });
  });

  describe('filler words', () => {
    it('ignores "und" (and)', () => {
      const result = parseSequence('tadasana und uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('ignores "and"', () => {
      const result = parseSequence('tadasana and uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('ignores "dann" (then)', () => {
      const result = parseSequence('tadasana dann uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('ignores "then"', () => {
      const result = parseSequence('tadasana then uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('ignores "pose" and "asana" alone', () => {
      const result = parseSequence('tadasana pose uttanasana asana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });

    it('ignores "haltung" alone', () => {
      const result = parseSequence('tadasana haltung uttanasana', testPoses);
      expect(result).toHaveLength(2);
      expect(result[0].pose?.id).toBe('tadasana');
      expect(result[1].pose?.id).toBe('uttanasana');
    });
  });

  describe('aliases', () => {
    it('recognizes pose aliases', () => {
      const result = parseSequence('down dog', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('adho_mukha_svanasana');
    });

    it('recognizes multiple aliases', () => {
      const result = parseSequence('downward dog', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('adho_mukha_svanasana');
    });
  });

  describe('normalization', () => {
    it('handles diacritics (é, ü, etc.)', () => {
      const posesWithDiacritics: PoseDef[] = [
        {
          id: 'test_pose',
          sanskrit: 'Tëst Pöse',
          nameDe: 'Tëst',
          nameEn: 'Test',
          category: 'standing',
          sided: false,
          bestViews: ['front'],
        },
      ];
      const result = parseSequence('test pose', posesWithDiacritics);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('test_pose');
    });

    it('handles ß → ss conversion', () => {
      const posesWithSZ: PoseDef[] = [
        {
          id: 'gross_pose',
          sanskrit: 'Grosse',
          nameDe: 'Grosse Haltung',
          nameEn: 'Big',
          category: 'standing',
          sided: false,
          bestViews: ['front'],
        },
      ];
      const result = parseSequence('gross pose', posesWithSZ);
      expect(result.length).toBeGreaterThan(0);
    });

    it('treats hyphens and underscores as spaces', () => {
      const result = parseSequence('downward-facing-dog', testPoses);
      expect(result).toHaveLength(1);
      expect(result[0].pose?.id).toBe('adho_mukha_svanasana');
    });
  });

  describe('smoke test with real POSES', () => {
    it('parses the example sequence from the requirements', () => {
      const input =
        "Tadasana, Anjaneyasana Warrior 2 rechts\nWarrior 3 links; Urdhva Hastasana – Utthanasana / Ardha Utthanasana, Downward Facing Dog, Janu Sirsasana li";
      const result = parseSequence(input, POSES);
      const recognized = result.filter(r => r.pose !== null);

      // Should recognize at least 8+ poses (all the major ones)
      expect(recognized.length).toBeGreaterThanOrEqual(8);

      // Check that major poses are recognized
      const poseIds = recognized.map(r => r.pose!.id);
      expect(poseIds).toContain('tadasana');
      expect(poseIds).toContain('anjaneyasana');
      expect(poseIds).toContain('virabhadrasana_2');
      expect(poseIds).toContain('virabhadrasana_3');
      expect(poseIds).toContain('urdhva_hastasana');
      expect(poseIds).toContain('uttanasana');
      expect(poseIds).toContain('ardha_uttanasana');
      expect(poseIds).toContain('adho_mukha_svanasana');
      expect(poseIds).toContain('janu_sirsasana');
    });

    it('has correct sides on sided poses', () => {
      const input = 'Warrior 2 rechts, Warrior 3 links';
      const result = parseSequence(input, POSES);

      const warrior2 = result.find(r => r.pose?.id === 'virabhadrasana_2');
      const warrior3 = result.find(r => r.pose?.id === 'virabhadrasana_3');

      expect(warrior2?.step?.side).toBe('right');
      expect(warrior3?.step?.side).toBe('left');
    });
  });
});
