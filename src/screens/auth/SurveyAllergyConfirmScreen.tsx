import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { getCatalogLanguage } from '../../constants/languages';
import {
  fetchAllergenCatalog, AllergenCatalog,
} from '../../services/allergen.service';
import * as AuthService from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';
import { getCatalogCategoryDisplayName, getIngredientDisplayName } from '../../lib/display-names';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyConfirm'>;

type SelectionMap = Record<string, string[]>;

export default function SurveyAllergyConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const { selectionJson, ...surveyParams } = route.params;
  const { step, total } = getSurveyProgress('SurveyAllergyConfirm', surveyParams.dietaryType);
  const setUser             = useUserStore(s => s.setUser);
  const currentLanguage     = useUserStore(s => s.currentUser.language);
  const multiProfileMode    = useUserStore(s => s.multiProfileMode);
  const multiProfileName    = useUserStore(s => s.multiProfileName);
  const addMultiProfile     = useUserStore(s => s.addMultiProfile);
  const setMultiProfileMode = useUserStore(s => s.setMultiProfileMode);
  const catalogLanguage = getCatalogLanguage(currentLanguage);

  const [catalog, setCatalog] = useState<AllergenCatalog | null>(null);
  const [categories, setCategories] = useState<SelectionMap>(
    JSON.parse(selectionJson) as SelectionMap,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage).then(setCatalog).catch(() => {});
  }, [catalogLanguage]);

  // 항목 추가 모달
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());

  // 카테고리 추가 모달
  const [showCatModal, setShowCatModal] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [catSelected, setCatSelected] = useState<Set<string>>(new Set());

  // 항목이 있거나 편집 모드에서 추가된 카테고리만 표시
  const displayCategories = Object.keys(categories).filter(
    cat => isEditing || (categories[cat] ?? []).length > 0,
  );

  function openModal(category: string) {
    setModalSelected(new Set(categories[category] ?? []));
    setModalSearch('');
    setModalCategory(category);
  }

  function toggleModalItem(item: string) {
    setModalSelected(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function handleModalSave() {
    if (!modalCategory) return;
    setCategories(prev => ({ ...prev, [modalCategory]: Array.from(modalSelected) }));
    setModalCategory(null);
  }

  function handleCatModalSave() {
    const toAdd = Array.from(catSelected).filter(
      name => !Object.keys(categories).some(c => c.toLowerCase() === name.toLowerCase()),
    );
    if (toAdd.length > 0) {
      setCategories(prev => {
        const next = { ...prev };
        toAdd.forEach(name => { next[name] = []; });
        return next;
      });
    }
    setShowCatModal(false);
    setCatSelected(new Set());
    setCatSearch('');
  }

  async function handleComplete() {
    const { dietaryType } = surveyParams;
    // ⚠️ 사용자가 명시 선택한 catalog 항목명을 그대로 저장한다 (이전엔
    // selectionToAllergenIds 로 ing-* ID 로 변환했는데, ing-* 는 항목 단위
    // 정보를 잃어 같은 allergenId 를 공유하는 모든 항목이 일괄 체크되는
    // UX 버그가 있었다). BE 판정은 activeProfile 에서 normalize 가 알아서
    // ing-* 로 변환하므로 보호 효과는 동일.
    const allergyProfile: string[] = [...new Set(Object.values(categories).flat())];

    // Both 플로우: 알러지 데이터를 들고 채식 플로우로 이동
    if (dietaryType === 'both') {
      navigation.navigate('SurveyVegetarian', {
        ...surveyParams,
        allergyProfileJson: JSON.stringify(allergyProfile),
      });
      return;
    }

    // 멀티 프로필 추가 모드: addMultiProfile 호출 후 ProfileStack으로 복귀
    if (multiProfileMode) {
      addMultiProfile({
        name: multiProfileName || 'New Profile',
        allergyProfile,
        dietaryRestrictions: [],
        sensitivityLevel: 'normal',
      });
      setMultiProfileMode(false);
      navigation.getParent()?.goBack();
      return;
    }

    setLoading(true);
    try {
      // ─── DEV ONLY ─── (BE 복구 후 if 블록 삭제, else 본문만 남기기)
      const devUser = __DEV__ ? useUserStore.getState().currentUser : null;
      if (devUser && devUser.id === 'dev-user-id') {
        setUser({
          ...devUser,
          allergyProfile,
          dietaryRestrictions: [],
          sensitivityLevel: 'normal',
          hasCompletedSurvey: true,
        });
      } else {
        // ─── /DEV ONLY ───
        await AuthService.submitSurvey({
          allergyProfile,
          dietaryRestrictions: [],
          sensitivityLevel: 'normal',
        });
        const { user } = await AuthService.fetchMe();
        setUser({ ...user, language: currentLanguage });
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const activeCategory = modalCategory && catalog
    ? catalog.categories.find(c => c.code === modalCategory || c.name === modalCategory)
    : null;
  const candidates = activeCategory ? activeCategory.items : [];
  const filteredCandidates = modalSearch.trim()
    ? candidates.filter(c => {
        const query = modalSearch.toLowerCase();
        return c.name.toLowerCase().includes(query) ||
          getIngredientDisplayName(c, currentLanguage).toLowerCase().includes(query);
      })
    : candidates;

  const allCategoryCodes = catalog?.categories.map(c => c.code) ?? [];
  const availableCats = allCategoryCodes.filter(
    name => !Object.keys(categories).some(c => c.toLowerCase() === name.toLowerCase()),
  );
  const filteredCats = catSearch.trim()
    ? availableCats.filter(c => {
        const query = catSearch.toLowerCase();
        return c.toLowerCase().includes(query) ||
          getCatalogCategoryDisplayName(c, currentLanguage).toLowerCase().includes(query);
      })
    : availableCats;

  function getCategoryLabel(category: string): string {
    const catalogCategory = catalog?.categories.find(c => c.code === category || c.name === category);
    return catalogCategory
      ? getCatalogCategoryDisplayName(catalogCategory, currentLanguage)
      : getCatalogCategoryDisplayName(category, currentLanguage);
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('survey.selectedTitle')}</Text>
        <Text style={styles.subtitle}>{t('survey.selectedSubtitle')}</Text>

        {displayCategories.map((cat, index) => {
          const items = categories[cat] ?? [];
          const isLast = index === displayCategories.length - 1;
          return (
            <React.Fragment key={cat}>
              <View style={styles.group}>
                <Text style={styles.groupLabel}>{getCategoryLabel(cat)}</Text>
                <View style={styles.chips}>
                  {items.map(item => (
                    <View key={item} style={[styles.chip, styles.chipSelected]}>
                      <Text style={[styles.chipText, styles.chipTextSelected]}>
                        {getIngredientDisplayName(item, currentLanguage)}
                      </Text>
                    </View>
                  ))}
                  {isEditing && (
                    <TouchableOpacity style={styles.addChip} onPress={() => openModal(cat)}>
                      <Text style={styles.addChipText}>{t('survey.add')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {!isLast && <View style={styles.separator} />}
            </React.Fragment>
          );
        })}

        {isEditing && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.newCatButton}
              onPress={() => { setCatSelected(new Set()); setCatSearch(''); setShowCatModal(true); }}
            >
              <Text style={styles.newCatText}>{t('survey.addNewCategories')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttons}>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editText}>{t('survey.editList')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.completeDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.completeText}>{loading ? t('survey.processing') : t('survey.complete')}</Text>
        </TouchableOpacity>
      </View>

      {/* 항목 추가 모달 */}
      <Modal visible={modalCategory !== null} transparent animationType="slide" onRequestClose={() => setModalCategory(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalCategory(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('survey.selectCategoryTitle', { category: modalCategory ? getCategoryLabel(modalCategory) : '' })}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('survey.selectCategorySubtitle', { category: modalCategory ? getCategoryLabel(modalCategory) : '' })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} value={modalSearch} onChangeText={setModalSearch} placeholder={t('survey.searchIngredients')} placeholderTextColor={'#B7BDB6'} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {filteredCandidates.map(item => (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.chip, modalSelected.has(item.name) && styles.chipSelected]}
                    onPress={() => toggleModalItem(item.name)}
                  >
                    <Text style={[styles.chipText, modalSelected.has(item.name) && styles.chipTextSelected]}>
                      {getIngredientDisplayName(item, currentLanguage)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={handleModalSave}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 카테고리 추가 모달 */}
      <Modal visible={showCatModal} transparent animationType="slide" onRequestClose={() => setShowCatModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCatModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('survey.addCategoryModalTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('survey.addCategoryModalSubtitle')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} value={catSearch} onChangeText={setCatSearch} placeholder={t('survey.searchCategories')} placeholderTextColor={'#B7BDB6'} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {filteredCats.map(name => (
                  <TouchableOpacity key={name} style={[styles.chip, catSelected.has(name) && styles.chipSelected]}
                    onPress={() => setCatSelected(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; })}>
                    <Text style={[styles.chipText, catSelected.has(name) && styles.chipTextSelected]}>
                      {getCategoryLabel(name)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={handleCatModalSave}>
              <Text style={styles.saveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const S = { bg: '#FDFFFD', primary: '#044733', selectedFill: '#044733', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  scroll: { flex: 1 },
  title: { fontSize: 30, fontFamily: 'Pretendard-ExtraBold', color: '#000000', lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 13 * 1.35, marginBottom: 28 },
  group: { marginBottom: 20 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#A9B6A8', marginBottom: 20 },
  groupLabel: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: '#1A1A1A', marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: '#F9FFFB' },
  chipSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  chipText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary },
  chipTextSelected: { color: S.textLight },
  addChip: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: S.bg },
  addChipText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary },
  newCatButton: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', backgroundColor: S.bg, marginTop: 4 },
  newCatText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: { height: 58, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A9B6A8' },
  editText: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: '#A9B6A8' },
  completeButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  completeDisabled: { opacity: 0.5 },
  completeText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: S.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 32, paddingTop: 36, paddingBottom: 40, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitle: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: '#000000' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, marginTop: 4 },
  modalClose: { fontSize: 18, color: S.primary, paddingLeft: 8 },
  searchInput: { borderWidth: 1, borderColor: '#B7BDB6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: S.primary, marginBottom: 32, backgroundColor: S.bg },
  modalScroll: { maxHeight: 220 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saveButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
});
