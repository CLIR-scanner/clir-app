import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * 스캔 결과 상세 화면 공통 중증 알러지 경고 박스.
 * 모든 상세 화면에서 동일 스타일·동일 위치(제품명/브랜드 아래, 맨 위)로 사용한다.
 * 문구는 i18n product.severeDisclaimer ("** For severe allergies, ...").
 */
export default function SevereDisclaimerBox({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>{t('product.severeDisclaimer')}</Text>
    </View>
  );
}

const RED = '#FF3434';

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 12,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // 전체 성분 박스(ingredientSection)와 동일 폭 — 3개 상세 화면 모두
    // scroll.paddingHorizontal:24 + ingredientSection.marginHorizontal:12 구조 공유.
    marginHorizontal: 12,
    marginBottom: 20,
  },
  text: {
    color: RED,
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 14,
  },
});
