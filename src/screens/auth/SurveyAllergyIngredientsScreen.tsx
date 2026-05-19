import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { getCatalogLanguage } from '../../constants/languages';
import { fetchAllergenCatalog, AllergenCatalog } from '../../services/allergen.service';
import { useUserStore } from '../../store/user.store';
import { getCatalogCategoryDisplayName, getIngredientDisplayName } from '../../lib/display-names';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyIngredients'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyIngredients'>;

// 카테고리별 선택 항목 { category: string[] }
type SelectionMap = Record<string, string[]>;

export default function SurveyAllergyIngredientsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyAllergyIngredients', params.dietaryType);
  const currentLanguage = useUserStore(s => s.currentUser.language);
  const catalogLanguage = getCatalogLanguage(currentLanguage);

  const [catalog, setCatalog] = useState<AllergenCatalog | null>(null);
  const [selection, setSelection] = useState<SelectionMap>({});

  // 모달 상태
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage)
      .then(setCatalog)
      .catch(() => { /* 네트워크 실패 시 빈 카탈로그 — 사용자는 Back 으로 재시도 */ });
  }, [catalogLanguage]);

  function openModal(category: string) {
    setModalSelected(new Set(selection[category] ?? []));
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
    setSelection(prev => ({
      ...prev,
      [modalCategory]: Array.from(modalSelected),
    }));
    setModalCategory(null);
  }

  function handleContinue() {
    navigation.navigate('SurveyAllergyConfirm', {
      ...params,
      selectionJson: JSON.stringify(selection),
    });
  }

  const activeCategory = modalCategory && catalog
    ? catalog.categories.find(c => c.code === modalCategory)
    : null;
  const candidates = activeCategory ? activeCategory.items : [];
  const filtered = modalSearch.trim()
    ? candidates.filter(c => {
        const query = modalSearch.toLowerCase();
        return c.name.toLowerCase().includes(query) ||
          getIngredientDisplayName(c, currentLanguage).toLowerCase().includes(query);
      })
    : candidates;

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('survey.ingredientsTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('survey.ingredientsSubtitle')}
        </Text>

        {!catalog && (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.black} />
          </View>
        )}

        {catalog?.categories.map((cat, index) => {
          const items = selection[cat.code] ?? [];
          const isLast = index === catalog.categories.length - 1;
          return (
            <React.Fragment key={cat.code}>
              <View style={styles.group}>
                <Text style={styles.groupLabel}>{getCatalogCategoryDisplayName(cat, currentLanguage)}</Text>
                <View style={styles.chips}>
                  {items.map(item => (
                    <View key={item} style={[styles.chip, styles.chipSelected]}>
                      <Text style={[styles.chipText, styles.chipTextSelected]}>
                        {getIngredientDisplayName(item, currentLanguage)}
                      </Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addChip} onPress={() => openModal(cat.code)}>
                    <Text style={styles.addChipText}>{t('survey.add')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!isLast && <View style={styles.separator} />}
            </React.Fragment>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </TouchableOpacity>

      {/* 항목 선택 모달 */}
      <Modal
        visible={modalCategory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCategory(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalCategory(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('survey.selectCategoryTitle', {
                    category: activeCategory
                      ? getCatalogCategoryDisplayName(activeCategory, currentLanguage)
                      : modalCategory,
                  })}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('survey.selectCategorySubtitle', {
                    category: activeCategory
                      ? getCatalogCategoryDisplayName(activeCategory, currentLanguage)
                      : modalCategory ?? '',
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={modalSearch}
              onChangeText={setModalSearch}
              placeholder={t('survey.searchIngredients')}
              placeholderTextColor={Colors.gray300}
            />

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalChips}>
                {filtered.map(item => (
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
  groupLabel: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: S.primary, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: '#8BC8B0', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: '#F9FFFB' },
  chipSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  chipText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.textLight },
  chipTextSelected: { color: S.textLight },
  addChip: { borderWidth: 1, borderColor: '#A9B6A8', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: S.bg },
  addChipText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: '#A9B6A8' },
  continueButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  continueText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: S.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 32, paddingTop: 36, paddingBottom: 40, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 19, fontFamily: 'Pretendard-ExtraBold', color: '#000000' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, marginTop: 4 },
  modalClose: { fontSize: 18, color: S.primary, paddingLeft: 8 },
  searchInput: { borderWidth: 1, borderColor: '#A9B6A8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: S.primary, marginBottom: 32, backgroundColor: S.bg },
  modalScroll: { maxHeight: 220 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saveButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
});
