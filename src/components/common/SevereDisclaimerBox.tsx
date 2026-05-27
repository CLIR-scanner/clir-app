import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../lib/responsive';

/**
 * 스캔 결과 상세 화면 공통 중증 알러지 경고 박스.
 * 모든 상세 화면에서 동일 스타일·동일 위치(제품명/브랜드 아래, 맨 위)로 사용한다.
 * 문구는 i18n product.severeDisclaimer ("** For severe allergies, ...").
 *
 * 가로 폭은 ingredientSection 과 같은 marginHorizontal 토큰(boxOuterH)으로 정합.
 * paddingHorizontal 은 박스 내부 가로 패딩 토큰(boxH).
 */
export default function SevereDisclaimerBox({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const { pad } = useResponsive();
  return (
    <View
      style={[
        styles.box,
        { marginHorizontal: pad.boxOuterH, paddingHorizontal: pad.boxH },
        style,
      ]}
    >
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
    paddingVertical: 10,
    marginBottom: 20,
  },
  text: {
    color: RED,
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 16,
    textAlign: 'left',
  },
});
