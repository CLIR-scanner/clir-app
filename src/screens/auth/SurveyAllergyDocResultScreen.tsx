import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { getCatalogLanguage } from '../../constants/languages';
import { useUserStore } from '../../store/user.store';
import {
  fetchAllergenCatalog, AllergenCatalog,
} from '../../services/allergen.service';
import * as AuthService from '../../services/auth.service';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyDocResult'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyDocResult'>;

interface Category { category: string; items: string[] }

const DUMMY_RESULTS: Category[] = [
  { category: 'Fish',   items: ['Tuna', 'Salmon', 'Cod'] },
  { category: 'Fruits', items: ['Apple', 'Peach'] },
];

export default function SurveyAllergyDocResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyAllergyDocResult', params.dietaryType);

  const setUser = useUserStore(s => s.setUser);
  const currentLanguage = useUserStore(s => s.currentUser.language);
  const catalogLanguage = getCatalogLanguage(currentLanguage);

  const [catalog, setCatalog] = useState<AllergenCatalog | null>(null);
  const [categories, setCategories] = useState<Category[]>(DUMMY_RESULTS);
  const allItems = categories.flatMap(g => g.items);
  const [selected, setSelected] = useState<Set<string>>(new Set(allItems));
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage).then(setCatalog).catch(() => {});
  }, [catalogLanguage]);

  // 항목 추가 모달 상태
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());

  const [showCatModal, setShowCatModal] = useState(false);
  const [catModalSearch, setCatModalSearch] = useState('');
  const [catModalSelected, setCatModalSelected] = useState<Set<string>>(new Set());

  function toggleItem(item: string) {
    if (isEditing) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function openModal(category: string) {
    const currentItems = categories.find(c => c.category === category)?.items ?? [];
    setModalSelected(new Set(currentItems));
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
    const newItems = Array.from(modalSelected);
    setCategories(prev =>
      prev.map(c => c.category === modalCategory ? { ...c, items: newItems } : c),
    );
    setSelected(prev => {
      const next = new Set(prev);
      const old = categories.find(c => c.category === modalCategory)?.items ?? [];
      old.forEach(i => next.delete(i));
      newItems.forEach(i => next.add(i));
      return next;
    });
    setModalCategory(null);
  }

  function handleCatModalSave() {
    const toAdd = Array.from(catModalSelected).filter(
      name => !categories.some(c => c.category.toLowerCase() === name.toLowerCase()),
    );
    if (toAdd.length > 0) {
      setCategories(prev => [...prev, ...toAdd.map(name => ({ category: name, items: [] }))]);
    }
    setShowCatModal(false);
    setCatModalSelected(new Set());
    setCatModalSearch('');
  }

  async function handleComplete() {
    const { dietaryType } = params;
    // ⚠️ 사용자가 명시 선택한 항목명("Salmon" 등) 을 그대로 저장한다.
    // 이전엔 카탈로그로 ing-* ID 변환했는데, ing-* 는 항목 단위 정보를 잃어
    // Personalization 진입 시 같은 allergenId 공유 항목 전체가 체크된 것처럼
    // 보이는 UX 버그가 있었다. BE 판정의 normalize 가 raw → ing-* 변환을
    // 런타임에 처리하므로 보호 효과는 동일.
    const allergyProfile: string[] = Array.from(selected);

    if (dietaryType === 'both') {
      navigation.navigate('SurveyVegetarian', {
        ...params,
        allergyProfileJson: JSON.stringify(allergyProfile),
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.submitSurvey({
        allergyProfile,
        dietaryRestrictions: [],
        sensitivityLevel: 'normal',
      });
      const { user } = await AuthService.fetchMe();
      setUser({ ...user, language: currentLanguage });
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // 모달에서 보여줄 후보 목록 (검색 필터 적용) — 카탈로그 기반
  const activeCategory = modalCategory && catalog
    ? catalog.categories.find(c => c.code === modalCategory || c.name === modalCategory)
    : null;
  const candidates = activeCategory
    ? activeCategory.items.map(i => i.name)
    : [];
  const filteredCandidates = modalSearch.trim()
    ? candidates.filter(c => c.toLowerCase().includes(modalSearch.toLowerCase()))
    : candidates;

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('survey.foundTitle')}</Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? t('survey.docEditSubtitle')
            : t('survey.selectedSubtitle')}
        </Text>

        {categories.map(group => (
          <View key={group.category} style={styles.group}>
            <Text style={styles.groupLabel}>{group.category}</Text>
            <View style={styles.chips}>
              {group.items.map(item => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, selected.has(item) && styles.chipSelected]}
                  onPress={() => toggleItem(item)}
                >
                  <Text style={[styles.chipText, selected.has(item) && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
              {isEditing && (
                <TouchableOpacity style={styles.addChip} onPress={() => openModal(group.category)}>
                  <Text style={styles.addChipText}>{t('survey.add')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {isEditing && (
          <TouchableOpacity
            style={styles.newCatButton}
            onPress={() => { setCatModalSelected(new Set()); setCatModalSearch(''); setShowCatModal(true); }}
          >
            <Text style={styles.newCatText}>{t('survey.addNewCategories')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

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
                  {t('survey.selectCategoryTitle', { category: modalCategory })}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('survey.selectCategorySubtitle', { category: modalCategory ?? '' })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} value={modalSearch} onChangeText={setModalSearch} placeholder={t('survey.searchIngredients')} placeholderTextColor={Colors.gray300} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {(catalog?.categories.map(c => c.code) ?? [])
                  .filter(name =>
                    !categories.some(c => c.category.toLowerCase() === name.toLowerCase() ) &&
                    (catModalSearch.trim()
                      ? name.toLowerCase().includes(catModalSearch.toLowerCase())
                      : true),
                  )
                  .map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, catModalSelected.has(name) && styles.chipSelected]}
                      onPress={() => {
                        setCatModalSelected(prev => {
                          const next = new Set(prev);
                          next.has(name) ? next.delete(name) : next.add(name);
                          return next;
                        });
                      }}
                    >
                      <Text style={[styles.chipText, catModalSelected.has(name) && styles.chipTextSelected]}>
                        {name}
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
            <TextInput style={styles.searchInput} value={catModalSearch} onChangeText={setCatModalSearch} placeholder={t('survey.searchCategories')} placeholderTextColor={Colors.gray300} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {(catalog?.categories.map(c => c.name) ?? [])
                  .filter((name: string) =>
                    !categories.some(c => c.category.toLowerCase() === name.toLowerCase()) &&
                    (catModalSearch.trim() ? name.toLowerCase().includes(catModalSearch.toLowerCase()) : true),
                  )
                  .map((name: string) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, catModalSelected.has(name) && styles.chipSelected]}
                      onPress={() => setCatModalSelected(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; })}
                    >
                      <Text style={[styles.chipText, catModalSelected.has(name) && styles.chipTextSelected]}>{name}</Text>
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

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  scroll: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 28 },
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: S.primary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: S.bg },
  chipSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  chipText: { fontSize: 13, color: S.primary, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  addChip: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: S.bg },
  addChipText: { fontSize: 13, color: S.primary },
  newCatButton: { borderWidth: 1, borderColor: S.primary, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', backgroundColor: S.bg, marginTop: 4 },
  newCatText: { fontSize: 13, color: S.primary },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: { height: 53, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: S.primary },
  editText: { fontSize: 16, fontWeight: '600', color: S.primary },
  completeButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  completeDisabled: { opacity: 0.5 },
  completeText: { fontSize: 16, fontWeight: '700', color: S.textLight },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: S.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  modalSubtitle: { fontSize: 12, color: S.primary, marginTop: 4 },
  modalClose: { fontSize: 18, color: S.primary, paddingLeft: 8 },
  searchInput: { borderWidth: 1, borderColor: S.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: S.primary, marginBottom: 16, backgroundColor: S.bg },
  modalScroll: { maxHeight: 220 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saveButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
