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
  progressFill: { width: '75%', height: '100%', backgroundColor: Colors.black, borderRadius: 2 },
  scroll: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.black, marginBottom: 10 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 28 },
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.black, backgroundColor: Colors.black },
  chipText: { fontSize: 13, color: Colors.black, fontWeight: '600' },
  chipTextSelected: { color: Colors.white },
  addChip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 7, paddingHorizontal: 14, backgroundColor: Colors.white,
  },
  addChipText: { fontSize: 13, color: Colors.gray700 },
  continueButton: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
  },
  continueText: { fontSize: 15, fontWeight: '700', color: Colors.black },
  // 모달
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
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
