import type { PoseDef } from '../core/types';

// The 15 poses of version 1. Inversions such as Sirsasana are left out on
// purpose: pose estimation is unreliable upside down.
export const POSES: PoseDef[] = [
  { id: 'tadasana', sanskrit: 'Tadasana', nameDe: 'Berghaltung', nameEn: 'Mountain Pose', category: 'standing', sided: false, bestViews: ['front', 'side'] },
  { id: 'utkatasana', sanskrit: 'Utkatasana', nameDe: 'Stuhlhaltung', nameEn: 'Chair Pose', category: 'standing', sided: false, bestViews: ['side', 'front'] },
  { id: 'vrksasana', sanskrit: 'Vrksasana', nameDe: 'Baum', nameEn: 'Tree Pose', category: 'standing', sided: true, bestViews: ['front', 'side'] },
  { id: 'utthita_trikonasana', sanskrit: 'Utthita Trikonasana', nameDe: 'Gestrecktes Dreieck', nameEn: 'Extended Triangle', category: 'standing', sided: true, bestViews: ['side', 'front'] },
  { id: 'virabhadrasana_2', sanskrit: 'Virabhadrasana II', nameDe: 'Krieger II', nameEn: 'Warrior II', category: 'standing', sided: true, bestViews: ['side', 'front'] },
  { id: 'virabhadrasana_1', sanskrit: 'Virabhadrasana I', nameDe: 'Krieger I', nameEn: 'Warrior I', category: 'standing', sided: true, bestViews: ['side', 'front'], limits: 'Becken-Ausrichtung (Rotation) ist aus 2D-Video nur grob abschätzbar.' },
  { id: 'utthita_parsvakonasana', sanskrit: 'Utthita Parsvakonasana', nameDe: 'Gestreckter Seitwinkel', nameEn: 'Extended Side Angle', category: 'standing', sided: true, bestViews: ['side', 'front'] },
  { id: 'ardha_chandrasana', sanskrit: 'Ardha Chandrasana', nameDe: 'Halbmond', nameEn: 'Half Moon', category: 'standing', sided: true, bestViews: ['side', 'front'] },
  { id: 'uttanasana', sanskrit: 'Uttanasana', nameDe: 'Stehende Vorbeuge', nameEn: 'Standing Forward Bend', category: 'forward-bend', sided: false, bestViews: ['side'], limits: 'Kopf und Arme verdecken sich gegenseitig, Rundrücken nur von der Seite sichtbar.' },
  { id: 'adho_mukha_svanasana', sanskrit: 'Adho Mukha Svanasana', nameDe: 'Herabschauender Hund', nameEn: 'Downward-Facing Dog', category: 'inversion', sided: false, bestViews: ['side', 'front'] },
  { id: 'chaturanga_dandasana', sanskrit: 'Chaturanga Dandasana', nameDe: 'Stockhaltung auf vier Gliedern', nameEn: 'Four-Limbed Staff Pose', category: 'arm-balance', sided: false, bestViews: ['side'] },
  { id: 'urdhva_mukha_svanasana', sanskrit: 'Urdhva Mukha Svanasana', nameDe: 'Heraufschauender Hund', nameEn: 'Upward-Facing Dog', category: 'backbend', sided: false, bestViews: ['side'] },
  { id: 'dandasana', sanskrit: 'Dandasana', nameDe: 'Stockhaltung', nameEn: 'Staff Pose', category: 'seated', sided: false, bestViews: ['side'] },
  { id: 'paschimottanasana', sanskrit: 'Paschimottanasana', nameDe: 'Sitzende Vorbeuge', nameEn: 'Seated Forward Bend', category: 'forward-bend', sided: false, bestViews: ['side'], limits: 'Rumpf und Beine überlagern sich; Wirbelsäulenrundung ist mit 33 Punkten nur grob messbar.' },
  { id: 'setu_bandha_sarvangasana', sanskrit: 'Setu Bandha Sarvangasana', nameDe: 'Schulterbrücke', nameEn: 'Bridge Pose', category: 'backbend', sided: false, bestViews: ['side'] },
];

export const POSE_BY_ID: Record<string, PoseDef> = Object.fromEntries(POSES.map((p) => [p.id, p]));
