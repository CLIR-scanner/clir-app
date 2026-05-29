import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';
import PressableScale from '../../components/common/PressableScale';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarian'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarian'>;

type VegetarianType = NonNullable<SurveyParams['vegetarianType']>;

const OPTIONS: { value: VegetarianType }[] = [
  { value: 'fruitarian' },
  { value: 'vegan' },
  { value: 'lacto_vegetarian' },
  { value: 'ovo_vegetarian' },
  { value: 'lacto_ovo_vegetarian' },
  { value: 'pesco_vegetarian' },
  { value: 'pollo_vegetarian' },
  { value: 'flexitarian' },
];

export default function SurveyVegetarianScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyVegetarian', params.dietaryType);
  const [selected, setSelected] = useState<VegetarianType | null>(null);
  const [infoType, setInfoType] = useState<VegetarianType | null>(null);

  function handleContinue() {
    if (!selected) return;
    const next = { ...params, vegetarianType: selected };
    if (selected === 'vegan') {
      navigation.navigate('SurveyVeganStrictness', next);
    } else {
      navigation.navigate('SurveyDietConfirm', next);
    }
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 스크롤 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('survey.dietKindTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('survey.dietKindSubtitle')}
        </Text>

        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {t(`survey.vegetarianTypes.${opt.value}`)}
                </Text>
                <TouchableOpacity
                  style={[styles.infoButton, isSelected && styles.infoButtonSelected]}
                  onPress={() => setInfoType(opt.value)}
                  hitSlop={8}
                >
                  <Text style={[styles.infoButtonText, isSelected && styles.infoButtonTextSelected]}>?</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 설명 모달 */}
      <Modal
        visible={infoType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoType(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoType(null)}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle} numberOfLines={1}>
              {infoType ? t(`survey.vegetarianTypes.${infoType}`) : ''}
            </Text>
            <View style={styles.infoBodyWrapper}>
              {infoType && t(`survey.dietTypeDescriptions.${infoType}`).split('\n').map((line, i) => (
                <Text key={i} style={[styles.infoBody, line.startsWith('✗') && styles.infoBodyDanger]}>
                  {line}
                </Text>
              ))}
            </View>
            <TouchableOpacity style={styles.infoClose} onPress={() => setInfoType(null)}>
              <Text style={styles.infoCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 하단 고정 버튼 */}
      <PressableScale
        style={[styles.continueButton, !selected && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </PressableScale>
    </View>
  );
}

const S = { bg: '#FDFFFD', primary: '#044733', selectedFill: '#044733', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  title: { fontSize: 30, fontFamily: 'Pretendard-ExtraBold', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 13 * 1.35, marginBottom: 32 },
  options: { gap: 12 },
  option: { height: 100, borderWidth: 1, borderColor: '#B8DDD4', borderRadius: 16, paddingLeft: 36, paddingRight: 36, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FFFB' },
  optionSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  optionText: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: S.primary, flex: 1 },
  optionTextSelected: { fontFamily: 'Pretendard-SemiBold', color: S.textLight },
  infoButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 0.8, borderColor: S.primary, alignItems: 'center', justifyContent: 'center' },
  infoButtonSelected: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.15)' },
  infoButtonText: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: S.primary },
  infoButtonTextSelected: { color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  infoCard: { backgroundColor: S.bg, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, marginHorizontal: 24, alignSelf: 'stretch' },
  infoTitle: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: '#000000', height: 24, marginBottom: 12 },
  infoBodyWrapper: { marginBottom: 36 },
  infoBody: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 22 },
  infoBodyDanger: { color: '#FF3B30' },
  infoClose: { height: 48, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  infoCloseText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: S.textLight },
  continueButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
});
