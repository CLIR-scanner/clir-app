import { RiskLevel } from '../types';
import { Colors } from './colors';
import { Strings } from './strings';

export const RISK_COLOR: Record<RiskLevel, string> = {
  safe: Colors.safe,
  caution: Colors.caution,
  danger: Colors.danger,
};

export const RISK_BACKGROUND: Record<RiskLevel, string> = {
  safe: Colors.safeLight,
  caution: Colors.cautionLight,
  danger: Colors.dangerLight,
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  safe: Strings.verdictSafe,
  caution: Strings.verdictCaution,
  danger: Strings.verdictDanger,
};

/** 판정 결과 한 줄 요약 문구 */
export const VERDICT_COPY: Record<RiskLevel, { title: string; subtitle: string }> = {
  safe: {
    title: '먹어도 괜찮아요',
    subtitle: '알러지·식이 프로필과 충돌하는 성분이 없습니다.',
  },
  caution: {
    title: '주의가 필요해요',
    subtitle: '미량 포함 가능성이 있는 성분이 감지되었습니다.',
  },
  danger: {
    title: '먹으면 안 돼요',
    subtitle: '알러지를 유발하는 성분이 직접 포함되어 있습니다.',
  },
};
