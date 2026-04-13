import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { ALLERGY_CATEGORIES, ALLERGY_CANDIDATES } from '../../constants/allergyData';
import * as AuthService from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyConfirm'>;

type SelectionMap = Record<string, string[]>;

export default function SurveyAllergyConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { selectionJson, ...surveyParams } = route.params;
  const setUser = useUserStore(s => s.setUser);

  const [categories, setCategories] = useState<SelectionMap>(
    JSON.parse(selectionJson) as SelectionMap,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const { name, email, password, dietaryType } = surveyParams;
    const allergyProfile = Object.values(categories).flat();

    // Both 플로우: 알러지 데이터를 들고 채식 플로우로 이동
    if (dietaryType === 'both') {
      navigation.navigate('SurveyVegetarian', {
        ...surveyParams,
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

  const candidates = modalCategory ? (ALLERGY_CANDIDATES[modalCategory] ?? []) : [];
  const filteredCandidates = modalSearch.trim()
    ? candidates.filter(c => c.toLowerCase().includes(modalSearch.toLowerCase()))
    : candidates;

  const availableCats = ALLERGY_CATEGORIES.filter(
    name => !Object.keys(categories).some(c => c.toLowerCase() === name.toLowerCase()),
  );
  const filteredCats = catSearch.trim()
    ? availableCats.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
    : availableCats;

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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Here are the ingredients{'\n'}you selected.</Text>
        <Text style={styles.subtitle}>Review the list and confirm the ingredients you want to avoid.</Text>

        {displayCategories.map(cat => {
          const items = categories[cat] ?? [];
          return (
            <View key={cat} style={styles.group}>
              <Text style={styles.groupLabel}>{cat}</Text>
              <View style={styles.chips}>
                {items.map(item => (
                  <View key={item} style={[styles.chip, styles.chipSelected]}>
                    <Text style={[styles.chipText, styles.chipTextSelected]}>{item}</Text>
                  </View>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addChip} onPress={() => openModal(cat)}>
                    <Text style={styles.addChipText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {isEditing && (
          <TouchableOpacity
            style={styles.newCatButton}
            onPress={() => { setCatSelected(new Set()); setCatSearch(''); setShowCatModal(true); }}
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
          style={[styles.completeButton, loading && styles.completeDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={styles.completeText}>{loading ? '처리 중...' : 'Complete'}</Text>
        </TouchableOpacity>
      </View>

      {/* 항목 추가 모달 */}
      <Modal visible={modalCategory !== null} transparent animationType="slide" onRequestClose={() => setModalCategory(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalCategory(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select {modalCategory}</Text>
                <Text style={styles.modalSubtitle}>Choose {modalCategory?.toLowerCase()} ingredients to avoid.</Text>
              </View>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} value={modalSearch} onChangeText={setModalSearch} placeholder="Search your ingredients" placeholderTextColor={Colors.gray300} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {filteredCandidates.map(item => (
                  <TouchableOpacity key={item} style={[styles.chip, modalSelected.has(item) && styles.chipSelected]} onPress={() => toggleModalItem(item)}>
                    <Text style={[styles.chipText, modalSelected.has(item) && styles.chipTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={handleModalSave}>
              <Text style={styles.saveText}>Save</Text>
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
                <Text style={styles.modalTitle}>Add new Categories</Text>
                <Text style={styles.modalSubtitle}>Choose allergy categories to add.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} value={catSearch} onChangeText={setCatSearch} placeholder="Search categories" placeholderTextColor={Colors.gray300} />
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalChips}>
                {filteredCats.map(name => (
                  <TouchableOpacity key={name} style={[styles.chip, catSelected.has(name) && styles.chipSelected]}
                    onPress={() => setCatSelected(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; })}>
                    <Text style={[styles.chipText, catSelected.has(name) && styles.chipTextSelected]}>{name}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  backText: { fontSize: 22, color: Colors.black },
  progressBar: { flex: 1, height: 4, backgroundColor: Colors.gray100, borderRadius: 2 },
  progressFill: { width: '100%', height: '100%', backgroundColor: Colors.black, borderRadius: 2 },
  scroll: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.black, lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 28 },
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.white },
  chipSelected: { borderColor: Colors.black, backgroundColor: Colors.black },
  chipText: { fontSize: 13, color: Colors.black, fontWeight: '600' },
  chipTextSelected: { color: Colors.white },
  addChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.white },
  addChipText: { fontSize: 13, color: Colors.gray700 },
  newCatButton: { borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', backgroundColor: Colors.white, marginTop: 4 },
  newCatText: { fontSize: 13, color: Colors.gray700 },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: { borderRadius: 100, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  editText: { fontSize: 15, fontWeight: '600', color: Colors.black },
  completeButton: { backgroundColor: Colors.white, borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  completeDisabled: { opacity: 0.5 },
  completeText: { fontSize: 15, fontWeight: '700', color: Colors.black },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.black },
  modalSubtitle: { fontSize: 12, color: Colors.gray500, marginTop: 4 },
  modalClose: { fontSize: 18, color: Colors.black, paddingLeft: 8 },
  searchInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.black, marginBottom: 16 },
  modalScroll: { maxHeight: 220 },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  saveButton: { backgroundColor: Colors.black, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  saveText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
