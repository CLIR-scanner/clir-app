import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { ALLERGY_CATEGORIES, ALLERGY_CANDIDATES } from '../../constants/allergyData';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyIngredients'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyIngredients'>;

// 카테고리별 선택 항목 { category: string[] }
type SelectionMap = Record<string, string[]>;

export default function SurveyAllergyIngredientsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

  const [selection, setSelection] = useState<SelectionMap>({});

  // 모달 상태
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());

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

  const candidates = modalCategory
    ? (ALLERGY_CANDIDATES[modalCategory] ?? [])
    : [];
  const filtered = modalSearch.trim()
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select ingredients to avoid.</Text>
        <Text style={styles.subtitle}>
          Choose the ingredients related to your allergy so we can personalise your filter settings.
        </Text>

        {ALLERGY_CATEGORIES.map(cat => {
          const items = selection[cat] ?? [];
          return (
            <View key={cat} style={styles.group}>
              <Text style={styles.groupLabel}>{cat}</Text>
              <View style={styles.chips}>
                {items.map(item => (
                  <View key={item} style={[styles.chip, styles.chipSelected]}>
                    <Text style={[styles.chipText, styles.chipTextSelected]}>{item}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addChip} onPress={() => openModal(cat)}>
                  <Text style={styles.addChipText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continue</Text>
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
                <Text style={styles.modalTitle}>Select {modalCategory}</Text>
                <Text style={styles.modalSubtitle}>
                  Choose {modalCategory?.toLowerCase()} ingredients to avoid.
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
              placeholder="Search your ingredients"
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

            <TouchableOpacity style={styles.saveButton} onPress={handleModalSave}>
              <Text style={styles.saveText}>Save</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  backText: { fontSize: 22, color: S.primary },
  progressBar: { flex: 1, height: 4, backgroundColor: '#D6E8D4', borderRadius: 2 },
  progressFill: { width: '75%', height: '100%', backgroundColor: S.primary, borderRadius: 2 },
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
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
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
