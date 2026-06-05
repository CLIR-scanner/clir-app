import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import * as AuthService from '../../services/auth.service';
import { DIET_AVOIDED_CATEGORIES, DIET_RESTRICTION_CATEGORIES, DIET_TITLES } from '../../constants/dietary';
import PressableScale from '../../components/common/PressableScale';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;

function getDietKey(params: SurveyParams): string {
  return params.veganStrictness ?? params.vegetarianType ?? '';
}

const DIET_CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  'Fruits / Grains': 'survey.dietCategories.fruitsGrains',
  Vegetables:        'survey.dietCategories.vegetables',
  Dairy:             'survey.dietCategories.dairy',
  Eggs:              'survey.dietCategories.eggs',
  Seafood:           'survey.dietCategories.seafood',
  Poultry:           'survey.dietCategories.poultry',
  'Red Meat':        'survey.dietCategories.redMeat',
};

export default function SurveyVegetarianIngredientsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyVegetarianIngredients', params.dietaryType);
  const setUser             = useUserStore(s => s.setUser);
  const currentLanguage     = useUserStore(s => s.currentUser.language);
  const multiProfileMode    = useUserStore(s => s.multiProfileMode);
  const multiProfileName    = useUserStore(s => s.multiProfileName);
  const addMultiProfile     = useUserStore(s => s.addMultiProfile);
  const setMultiProfileMode = useUserStore(s => s.setMultiProfileMode);

  const dietKey = getDietKey(params);
  const initialItems = DIET_AVOIDED_CATEGORIES[dietKey] ?? [];

  const [items, setItems] = useState<string[]>(initialItems);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalSelected, setModalSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [infoCategory, setInfoCategory] = useState<string | null>(null);

  // 편집 모드: 기존 항목 토글 (제거/복원)
  function toggleItem(item: string) {
    setItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  }

  // 모달 열기: 이미 목록에 있는 항목은 제외하고 선택 초기화
  function openModal() {
    setModalSelected([]);
    setShowModal(true);
  }

  // 모달 내 카테고리 토글
  function toggleModalItem(cat: string) {
    setModalSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  }

  // 모달 Save: 선택한 카테고리를 목록에 추가 (중복 제외)
  function handleModalSave() {
    setItems(prev => {
      const toAdd = modalSelected.filter(c => !prev.includes(c));
      return [...prev, ...toAdd];
    });
    setShowModal(false);
  }

  function getDietCategoryLabel(category: string): string {
    const key = DIET_CATEGORY_TRANSLATION_KEYS[category];
    return key ? t(key) : category;
  }

  function getDietCategoryDescription(category: string): string {
    const key = DIET_CATEGORY_TRANSLATION_KEYS[category];
    return key ? t(key.replace('dietCategories', 'dietCategoryDescriptions')) : '';
  }

  async function handleContinue() {
    const { vegetarianType, veganStrictness, allergyProfileJson } = params;

    const dietaryRestrictions: string[] = [];
    if (vegetarianType) dietaryRestrictions.push(vegetarianType);
    if (veganStrictness) dietaryRestrictions.push(veganStrictness);

    // Both 플로우: 알러지 플로우에서 수집한 ing-* ID 만 그대로 전달.
    // ⚠️ items (식이 회피 카테고리 라벨 — 'Dairy'/'Eggs'/'Poultry'/...) 는
    // 의도적으로 allergy_profile 에 합치지 않는다. 합치면 BE 정규화 과정에서
    // 'Dairy' → ing-milk, 'Eggs' → ing-egg 로 둔갑해 가짜 알러지가 영구히
    // 박혔다(비건 사용자가 milk 알러지 인 것처럼 판정되던 버그).
    // 식이 회피는 dietaryRestrictions 만으로 충분히 표현된다 — 동일 룰을
    // BE DIET_RULES 가 카테고리/알러겐 단위로 적용한다.
    const allergyProfile: string[] = allergyProfileJson
      ? (JSON.parse(allergyProfileJson) as string[])
      : [];

    const sensitivityLevel = veganStrictness === 'strict' ? 'strict' : 'normal';

    // 멀티 프로필 추가 모드
    if (multiProfileMode) {
      addMultiProfile({
        name: multiProfileName || 'New Profile',
        allergyProfile,
        dietaryRestrictions,
        sensitivityLevel,
      });
      setMultiProfileMode(false);
      navigation.getParent()?.goBack();
      return;
    }

    setLoading(true);
    try {
      await AuthService.submitSurvey({
        allergyProfile,
        dietaryRestrictions,
        sensitivityLevel,
      });
      const { user } = await AuthService.fetchMe();
      // 설문 완료 확정 — hasCompletedSurvey 강제(이유: SurveyAllergyConfirmScreen 참고).
      setUser({ ...user, language: currentLanguage, hasCompletedSurvey: true });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const titleLabel = dietKey ? t(`survey.dietTitles.${dietKey}`) : (DIET_TITLES[dietKey] ?? dietKey);

  const availableCategories = DIET_RESTRICTION_CATEGORIES.filter(c => !items.includes(c));

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>{t('survey.vegetarianAvoidTitle', { diet: titleLabel })}</Text>
        <Text style={styles.subtitle}>
          {t('survey.vegetarianAvoidSubtitle')}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.list}>
            {items.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.item}
                onPress={() => isEditing && toggleItem(item)}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                <Text style={styles.itemText}>{getDietCategoryLabel(item)}</Text>
              </TouchableOpacity>
            ))}

            {/* 편집 모드: +Add 버튼 */}
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={openModal}>
                <Text style={styles.addButtonText}>{t('survey.add')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttons}>
        <PressableScale
          style={[styles.continueButton, loading && styles.continueDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueText}>{loading ? t('common.loading') : t('survey.complete')}</Text>
        </PressableScale>
      </View>

      {/* 카테고리 설명 모달 */}
      <Modal
        visible={infoCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoCategory(null)}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{infoCategory ? getDietCategoryLabel(infoCategory) : ''}</Text>
            <Text style={styles.infoBody}>
              {infoCategory ? getDietCategoryDescription(infoCategory) : ''}
            </Text>
            <TouchableOpacity style={styles.infoClose} onPress={() => setInfoCategory(null)}>
              <Text style={styles.infoCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* +Add 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('survey.addToListTitle')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('survey.addToListSubtitle')}
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalList}>
                {availableCategories.length === 0 ? (
                  <Text style={styles.modalEmpty}>{t('survey.allCategoriesAdded')}</Text>
                ) : (
                  availableCategories.map(cat => {
                    const checked = modalSelected.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={styles.modalItem}
                        onPress={() => toggleModalItem(cat)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalItemText}>{getDietCategoryLabel(cat)}</Text>
                        <View style={[styles.addBox, checked && styles.addBoxChecked]}>
                          <Text style={[styles.addBoxIcon, checked && styles.addBoxIconChecked]}>{checked ? '✓' : '+'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalSave} onPress={handleModalSave}>
              <Text style={styles.modalSaveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = { bg: '#FDFFFD', primary: '#044733', selectedFill: '#044733', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  body: { flex: 1 },
  title: { fontSize: 30, fontFamily: 'Pretendard-ExtraBold', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 13 * 1.35, marginBottom: 24 },
  scroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: S.primary,
    borderRadius: 16,
    height: 100,
    paddingLeft: 36,
    paddingRight: 36,
    backgroundColor: S.selectedFill,
  },
  itemText: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: '#FFFFFF', flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  removeBox: { width: 22, height: 22, borderRadius: 11, borderWidth: 0.8, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: '#FFFFFF', lineHeight: 14 },
  infoButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 0.8, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  infoButtonText: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: '#FFFFFF' },
  infoCard: { backgroundColor: S.bg, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, marginHorizontal: 24 },
  infoTitle: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: '#000000', marginBottom: 12 },
  infoBody: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 22, marginBottom: 36 },
  infoClose: { height: 48, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  infoCloseText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: S.textLight },
  addBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: S.primary, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  addBoxChecked: { backgroundColor: S.primary },
  addBoxIcon: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: S.primary, lineHeight: 16 },
  addBoxIconChecked: { color: '#FFFFFF' },
  addButton: {
    borderWidth: 1,
    borderColor: S.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: S.primary },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: { height: 58, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: S.primary },
  editButtonText: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: S.textLight },
  continueButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxHeight: '75%', backgroundColor: S.bg, borderRadius: 24, paddingTop: 28, paddingHorizontal: 24, paddingBottom: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Pretendard-Bold', color: '#000000', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, marginBottom: 20, lineHeight: 18 },
  modalScroll: { flexGrow: 0 },
  modalList: { gap: 10, paddingBottom: 8 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#B8DDD4',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: S.bg,
  },
  modalItemText: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: S.primary },
  modalEmpty: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: S.primary, textAlign: 'center', paddingVertical: 20 },
  modalSave: { marginTop: 16, height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
});
