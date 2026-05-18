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
    backgroundColor: '#FFF6F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  text: {
    color: RED,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
