import { RiskLevel } from '../types';
import { Colors } from './colors';

export const RISK_LABEL: Record<RiskLevel, string> = {
  danger: '위험',
  caution: '주의',
  safe: '안전',
};

export const RISK_EMOJI: Record<RiskLevel, string> = {
  danger: '⚠️',
  caution: '⚡',
  safe: '✅',
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  danger: Colors.danger,
  caution: Colors.caution,
  safe: Colors.safe,
};

export const RISK_BG: Record<RiskLevel, string> = {
  danger: Colors.dangerBg,
  caution: Colors.cautionBg,
  safe: Colors.safeBg,
};

/** 알러겐 선택 옵션 (MultiProfileAdd/Detail, PersonalizationAllergy 공용) */
export const ALLERGEN_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'ing-peanut',    label: '땅콩',         emoji: '🥜' },
  { id: 'ing-milk',      label: '유제품 (우유)', emoji: '🥛' },
  { id: 'ing-wheat',     label: '밀 (글루텐)',   emoji: '🌾' },
  { id: 'ing-egg',       label: '달걀',         emoji: '🥚' },
  { id: 'ing-soy',       label: '대두 (콩)',     emoji: '🫘' },
  { id: 'ing-fish',      label: '생선',         emoji: '🐟' },
  { id: 'ing-shellfish', label: '갑각류',       emoji: '🦐' },
  { id: 'ing-treenut',   label: '견과류',       emoji: '🌰' },
  { id: 'ing-sesame',    label: '참깨',         emoji: '🌿' },
  { id: 'ing-oat',       label: '귀리',         emoji: '🥣' },
];

/** 알러겐 ID → 한국어 이름 (프로필 표시용) */
export const ALLERGEN_NAME_KO: Record<string, string> = {
  'ing-peanut': '땅콩',
  'ing-milk': '유제품',
  'ing-wheat': '밀',
  'ing-egg': '달걀',
  'ing-soy': '대두',
  'ing-fish': '생선',
  'ing-shellfish': '갑각류',
  'ing-treenut': '견과류',
  'ing-sesame': '참깨',
  'ing-oat': '귀리',
};

/** 알러겐 ID 배열을 한국어 레이블 문자열로 변환 */
export function allergenLabel(ids: string[]): string {
  return ids.map(id => ALLERGEN_NAME_KO[id] ?? id).join(', ');
}
