import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';
import { ALLERGY_CATEGORIES } from '../../constants/allergyData';
import { useUserStore } from '../../store/user.store';
import * as AuthService from '../../services/auth.service';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarianIngredients'>;

// ─── 식단별 더미 avoided 식품 리스트 ───────────────────────────────────────────
const AVOIDED_BY_DIET: Record<string, string[]> = {
  pescatarian:          ['Meat', 'Moollusks / Shellfish'],
  vegan:                ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy'],
  lacto_vegetarian:     ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs'],
  ovo_vegetarian:       ['Meat', 'Fish', 'Moollusks / Shellfish', 'Dairy'],
  lacto_ovo_vegetarian: ['Meat', 'Fish', 'Moollusks / Shellfish'],
  pesco_vegetarian:     ['Meat'],
  pollo_vegetarian:     ['Fish', 'Moollusks / Shellfish'],
  flexitarian:          ['Meat'],
  // Vegan 엄격도 분기
  strict:               ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy', 'Food Additives'],
  flexible:             ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy'],
};

// ─── 타이틀용 라벨 ──────────────────────────────────────────────────────────
const DIET_TITLE: Record<string, string> = {
  pescatarian:          'a Pescatarian',
  vegan:                'a Vegan',
  lacto_vegetarian:     'a Lacto-Vegetarian',
  ovo_vegetarian:       'an Ovo-Vegetarian',
  lacto_ovo_vegetarian: 'a Lacto-ovo-Vegetarian',
  pesco_vegetarian:     'a Pesco-Vegetarian',
  pollo_vegetarian:     'a Pollo-Vegetarian',
  flexitarian:          'a Flexitarian',
  strict:               'a Strict Vegan',
  flexible:             'a Flexible Vegan',
};

function getDietKey(params: SurveyParams): string {
  return params.veganStrictness ?? params.vegetarianType ?? '';
}

export default function SurveyVegetarianIngredientsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;
  const setUser = useUserStore(s => s.setUser);

  const dietKey = getDietKey(params);
  const initialItems = AVOIDED_BY_DIET[dietKey] ?? [];

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
    const { name, email, password, vegetarianType, veganStrictness, allergyProfileJson } = params;

    const dietaryRestrictions: string[] = [];
    if (vegetarianType) dietaryRestrictions.push(vegetarianType);
    if (veganStrictness) dietaryRestrictions.push(veganStrictness);

    // Both 플로우: 알러지 플로우에서 전달된 allergyProfile과 합산
    const prevAllergyProfile: string[] = allergyProfileJson
      ? (JSON.parse(allergyProfileJson) as string[])
      : [];
    const mergedAllergyProfile = [...new Set([...prevAllergyProfile, ...items])];

    setLoading(true);
    try {
      const { userId } = await AuthService.signup({ name, email, password });
      await AuthService.submitSurvey(userId, {
        allergyProfile: mergedAllergyProfile,
        dietaryRestrictions,
        sensitivityLevel: veganStrictness === 'strict' ? 'strict' : 'normal',
      });
      const { user } = await AuthService.login(email, password);
      setUser(user);
    } catch (e) {
      Alert.alert('오류가 발생했습니다.', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const titleLabel = DIET_TITLE[dietKey] ?? dietKey;

  // 모달에 표시할 카테고리 (이미 목록에 있는 것 제외)
  const availableCategories = ALLERGY_CATEGORIES.filter(c => !items.includes(c));

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
                  <View style={[styles.checkbox, styles.checkboxChecked]} />
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
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
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
    marginBottom: 40,
  },
  backText: {
    fontSize: 22,
    color: Colors.black,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
  },
  progressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 30,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  itemText: {
    fontSize: 15,
    color: Colors.black,
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: Colors.black,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  buttons: {
    gap: 10,
    marginTop: 8,
  },
  editButton: {
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },

  // ─── 모달 ───────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.gray500,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalList: {
    gap: 10,
    paddingBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  modalItemText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '500',
  },
  modalEmpty: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalSave: {
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
