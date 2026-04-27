import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import * as AuthService from '../../services/auth.service';
import { DIET_AVOIDED_CATEGORIES, DIET_RESTRICTION_CATEGORIES, DIET_TITLES } from '../../constants/dietary';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;

function getDietKey(params: SurveyParams): string {
  return params.veganStrictness ?? params.vegetarianType ?? '';
}

export default function SurveyVegetarianIngredientsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyVegetarianIngredients', params.dietaryType);
  const setUser             = useUserStore(s => s.setUser);
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
      setUser(user);
    } catch (e) {
      Alert.alert('오류가 발생했습니다.', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const titleLabel = DIET_TITLES[dietKey] ?? dietKey;

  const availableCategories = DIET_RESTRICTION_CATEGORIES.filter(c => !items.includes(c));

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>As {titleLabel},{'\n'}you avoid</Text>
        <Text style={styles.subtitle}>
          Based on your diet preference, these ingredients will be{'\n'}
          excluded from your food recommendations.
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
                <Text style={styles.itemText}>{item}</Text>
                {isEditing && (
                  <View style={styles.removeBox}>
                    <Text style={styles.removeIcon}>−</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* 편집 모드: +Add 버튼 */}
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={openModal}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(e => !e)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Done' : 'Edit your list'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.continueText}>{loading ? 'Loading...' : 'Complete'}</Text>
        </TouchableOpacity>
      </View>

      {/* +Add 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to your list</Text>
            <Text style={styles.modalSubtitle}>
              Choose additional categories to avoid.
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalList}>
                {availableCategories.length === 0 ? (
                  <Text style={styles.modalEmpty}>All categories are already added.</Text>
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
                        <Text style={styles.modalItemText}>{cat}</Text>
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
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  body: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 24 },
  scroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: S.primary,
    borderRadius: 16,
    height: 94,
    paddingHorizontal: 44,
    backgroundColor: S.selectedFill,
  },
  itemText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  removeBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', lineHeight: 18 },
  addBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: S.primary, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  addBoxChecked: { backgroundColor: S.primary },
  addBoxIcon: { fontSize: 14, fontWeight: '700', color: S.primary, lineHeight: 16 },
  addBoxIconChecked: { color: '#FFFFFF' },
  addButton: {
    borderWidth: 1,
    borderColor: S.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontSize: 15, fontWeight: '600', color: S.primary },
  buttons: { gap: 12, paddingTop: 16 },
  editButton: { height: 53, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: S.primary },
  editButtonText: { fontSize: 16, fontWeight: '600', color: S.primary },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxHeight: '75%', backgroundColor: S.bg, borderRadius: 24, paddingTop: 28, paddingHorizontal: 24, paddingBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000000', marginBottom: 6 },
  modalSubtitle: { fontSize: 12, color: S.primary, marginBottom: 20, lineHeight: 18 },
  modalScroll: { flexGrow: 0 },
  modalList: { gap: 10, paddingBottom: 8 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: S.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: S.bg,
  },
  modalItemText: { fontSize: 14, color: S.primary, fontWeight: '500' },
  modalEmpty: { fontSize: 14, color: S.primary, textAlign: 'center', paddingVertical: 20 },
  modalSave: { marginTop: 16, height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
