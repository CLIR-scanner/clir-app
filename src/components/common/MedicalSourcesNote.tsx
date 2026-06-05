// 의료/건강 정보 출처 표기 — App Store Guideline 1.4.1 (Safety - Physical Harm) 준수.
// 알레르기 판정의 근거(미국 FDA 주요 식품 알레르기원 표시 기준)와 제품·성분 데이터
// 출처(Open Food Facts)를 결과·상세 화면에 노출하고 원문 링크를 제공한다.
// 각 화면에 이미 면책 문구(disclaimer)가 있으므로 이 컴포넌트는 "출처 링크"만 담당한다.

import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

const SOURCES: { key: string; url: string }[] = [
  { key: 'scanUi.sourceFda', url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies' },
  { key: 'scanUi.sourceOff', url: 'https://world.openfoodfacts.org' },
];

const C = { heading: '#6B7280', link: '#2563EB' };

export default function MedicalSourcesNote() {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <Text style={styles.heading}>{t('scanUi.sourcesHeading')}</Text>
      {SOURCES.map(s => (
        <TouchableOpacity
          key={s.url}
          onPress={() => { void Linking.openURL(s.url); }}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={t(s.key)}
        >
          <Text style={styles.link}>↗ {t(s.key)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 12, gap: 4 },
  heading: { fontSize: 12, lineHeight: 16, fontFamily: 'Pretendard-Bold', color: C.heading },
  link: { fontSize: 12, lineHeight: 18, fontFamily: 'Pretendard-Regular', color: C.link, textDecorationLine: 'underline' },
});
