import React, { useState } from 'react';
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
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import { ALLERGY_CANDIDATES, ALLERGY_CATEGORIES } from '../../constants/allergyData';
import * as AuthService from '../../services/auth.service';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyDocResult'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyDocResult'>;

interface Category { category: string; items: string[] }

// ─── 더미 데이터 (API 연결 전) ─────────────────────────────────────────────────
const DUMMY_RESULTS: Category[] = [
  { category: 'Fish',   items: ['Tuna', 'Salmon', 'Cod'] },
  { category: 'Fruits', items: ['Apple', 'Peach'] },
];

const DEFAULT_CANDIDATES: string[] = [];
// ──────────────────────────────────────────────────────────────────────────────

export default function SurveyAllergyDocResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

  const setUser = useUserStore(s => s.setUser);

  const [categories, setCategories] = useState<Category[]>(DUMMY_RESULTS);
  const allItems = categories.flatMap(g => g.items);
  const [selected, setSelected] = useState<Set<string>>(new Set(allItems));
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // 항목 추가 모달 상태
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());

  // 카테고리 추가 모달 상태
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
      // 기존 카테고리 항목 제거 후 새 항목 추가
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
    const { name, email, password, dietaryType } = params;
    const allergyProfile = Array.from(selected);

    // Both 플로우: 알러지 데이터를 들고 채식 플로우로 이동
    if (dietaryType === 'both') {
      navigation.navigate('SurveyVegetarian', {
        ...params,
        allergyProfileJson: JSON.stringify(allergyProfile),
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.signup({ name, email, password });
      const { user } = await AuthService.login(email, password);
      await AuthService.submitSurvey(user.id, {
        allergyProfile,
        dietaryRestrictions: [],
        sensitivityLevel: 'normal',
      });
      setUser(user);
    } catch (e) {
      Alert.alert('오류가 발생했습니다.', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // 모달에서 보여줄 후보 목록 (검색 필터 적용)
  const candidates = modalCategory
    ? (ALLERGY_CANDIDATES[modalCategory] ?? DEFAULT_CANDIDATES)
    : [];
  const filteredCandidates = modalSearch.trim()
    ? candidates.filter(c => c.toLowerCase().includes(modalSearch.toLowerCase()))
    : candidates;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Here are the ingredients{'\n'}we found.</Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? 'Edit your Allergy ingredients and Confirm it.'
            : 'Review the list and confirm the ingredients you want to avoid.'}
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
                <TouchableOpacity
                  style={styles.addChip}
                  onPress={() => openModal(group.category)}
                >
                  <Text style={styles.addChipText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* 편집 모드: 새 카테고리 추가 */}
        {isEditing && (
          <TouchableOpacity
            style={styles.newCatButton}
            onPress={() => {
              setCatModalSelected(new Set());
              setCatModalSearch('');
              setShowCatModal(true);
            }}
          >
            <Text style={styles.newCatText}>+ Add new Categories</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttons}>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editText}>Edit your list</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.continueText}>{loading ? '처리 중...' : 'Complete'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 카테고리 추가 모달 ── */}
      <Modal
        visible={showCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCatModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCatModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add new Categories</Text>
                <Text style={styles.modalSubtitle}>
                  Choose allergy categories to add.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={catModalSearch}
              onChangeText={setCatModalSearch}
              placeholder="Search categories"
              placeholderTextColor={Colors.gray300}
            />

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalChips}>
                {ALLERGY_CATEGORIES
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

            <TouchableOpacity style={styles.saveButton} onPress={handleCatModalSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 항목 선택 모달 ── */}
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
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select {modalCategory}</Text>
                <Text style={styles.modalSubtitle}>
                  Choose additional {modalCategory?.toLowerCase()} ingredients to add.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 검색 */}
            <TextInput
              style={styles.searchInput}
              value={modalSearch}
              onChangeText={setModalSearch}
              placeholder="Search your ingredients"
              placeholderTextColor={Colors.gray300}
            />

            {/* 후보 칩 목록 */}
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalChips}>
                {filteredCandidates.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, modalSelected.has(item) && styles.chipSelected]}
                    onPress={() => toggleModalItem(item)}
                  >
                    <Text style={[styles.chipText, modalSelected.has(item) && styles.chipTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Save */}
            <TouchableOpacity style={styles.saveButton} onPress={handleModalSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backText: { fontSize: 22, color: Colors.black },
  progressBar: { flex: 1, height: 4, backgroundColor: Colors.gray100, borderRadius: 2 },
  progressFill: { width: '90%', height: '100%', backgroundColor: Colors.black, borderRadius: 2 },
  scroll: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.black, lineHeight: 34, marginBottom: 10 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 32 },
  group: { marginBottom: 24 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.black, backgroundColor: Colors.black },
  chipText: { fontSize: 13, color: Colors.black, fontWeight: '600' },
  chipTextSelected: { color: Colors.white },
  addChip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: Colors.white,
  },
  addChipText: { fontSize: 13, color: Colors.gray700 },
  addConfirm: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  newCatButton: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', backgroundColor: Colors.white,
  },
  newCatText: { fontSize: 13, color: Colors.gray700 },
  newCatInputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.black,
    borderRadius: 100, paddingHorizontal: 16, backgroundColor: Colors.white,
    alignSelf: 'flex-start', gap: 8,
  },
  newCatInput: { fontSize: 13, color: Colors.black, paddingVertical: 10, minWidth: 120 },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: {
    borderRadius: 100, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  editText: { fontSize: 15, fontWeight: '600', color: Colors.black },
  continueButton: { backgroundColor: Colors.white, borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  continueDisabled: { opacity: 0.5 },
  continueText: { fontSize: 15, fontWeight: '700', color: Colors.black },

  // ── 모달 ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.black },
  modalSubtitle: { fontSize: 12, color: Colors.gray500, marginTop: 4 },
  modalClose: { fontSize: 18, color: Colors.black, paddingLeft: 8 },
  searchInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: Colors.black, marginBottom: 16,
  },
  modalScroll: { maxHeight: 220 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saveButton: {
    backgroundColor: Colors.black, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', marginTop: 16,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
