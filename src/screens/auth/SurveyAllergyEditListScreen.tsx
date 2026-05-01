import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyEditList'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyEditList'>;

interface Category {
  category: string;
  items: string[];
}

export default function SurveyAllergyEditListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const { categoriesJson, ...surveyParams } = route.params;

  const [categories, setCategories] = useState<Category[]>(
    JSON.parse(categoriesJson) as Category[],
  );

  // 카테고리별 입력 중인 텍스트
  const [addingItem, setAddingItem] = useState<{ [cat: string]: string }>({});
  // 새 카테고리 입력
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  function handleAddItem(category: string) {
    const text = (addingItem[category] ?? '').trim();
    if (!text) return;
    setCategories(prev =>
      prev.map(c =>
        c.category === category
          ? { ...c, items: [...c.items, text] }
          : c,
      ),
    );
    setAddingItem(prev => ({ ...prev, [category]: '' }));
  }

  function handleRemoveItem(category: string, item: string) {
    setCategories(prev =>
      prev.map(c =>
        c.category === category
          ? { ...c, items: c.items.filter(i => i !== item) }
          : c,
      ),
    );
  }

  function handleAddCategory() {
    const name = newCatInput.trim();
    if (!name) return;
    if (categories.some(c => c.category.toLowerCase() === name.toLowerCase())) {
      Alert.alert(t('survey.duplicateCategory'));
      return;
    }
    setCategories(prev => [...prev, { category: name, items: [] }]);
    setNewCatInput('');
    setShowNewCatInput(false);
  }

  function handleContinue() {
    // TODO: 편집된 categories를 다음 플로우로 전달
  }

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
        <Text style={styles.title}>{t('survey.foundTitle')}</Text>
        <Text style={styles.subtitle}>{t('survey.docEditSubtitle')}</Text>

        {categories.map(group => (
          <View key={group.category} style={styles.group}>
            <Text style={styles.groupLabel}>{group.category}</Text>
            <View style={styles.chips}>
              {group.items.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.chip}
                  onLongPress={() => handleRemoveItem(group.category, item)}
                  onPress={() => handleRemoveItem(group.category, item)}
                >
                  <Text style={styles.chipText}>{item}</Text>
                  <Text style={styles.chipRemove}>  ×</Text>
                </TouchableOpacity>
              ))}

              {/* + Add 입력 */}
              {addingItem[group.category] !== undefined ? (
                <View style={styles.addInputWrap}>
                  <TextInput
                    style={styles.addInput}
                    value={addingItem[group.category]}
                    onChangeText={text =>
                      setAddingItem(prev => ({ ...prev, [group.category]: text }))
                    }
                    placeholder={t('survey.itemInputPlaceholder')}
                    placeholderTextColor={Colors.gray300}
                    autoFocus
                    onSubmitEditing={() => handleAddItem(group.category)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={() => handleAddItem(group.category)}>
                    <Text style={styles.addConfirm}>{t('common.confirm')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addChip}
                  onPress={() =>
                    setAddingItem(prev => ({ ...prev, [group.category]: '' }))
                  }
                >
                  <Text style={styles.addChipText}>{t('survey.add')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* 새 카테고리 추가 */}
        {showNewCatInput ? (
          <View style={styles.newCatInputWrap}>
            <TextInput
              style={styles.newCatInput}
              value={newCatInput}
              onChangeText={setNewCatInput}
              placeholder={t('survey.categoryNamePlaceholder')}
              placeholderTextColor={Colors.gray300}
              autoFocus
              onSubmitEditing={handleAddCategory}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAddCategory}>
              <Text style={styles.addConfirm}>{t('common.add')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.newCatButton}
            onPress={() => setShowNewCatInput(true)}
          >
            <Text style={styles.newCatText}>{t('survey.addNewCategories')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </TouchableOpacity>
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
    width: '90%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 32,
  },
  group: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  chipText: {
    fontSize: 13,
    color: Colors.black,
  },
  chipRemove: {
    fontSize: 13,
    color: Colors.gray500,
  },
  addChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  addChipText: {
    fontSize: 13,
    color: Colors.gray700,
  },
  addInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 100,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    gap: 6,
  },
  addInput: {
    fontSize: 13,
    color: Colors.black,
    paddingVertical: 8,
    minWidth: 80,
  },
  addConfirm: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  newCatButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
  },
  newCatText: {
    fontSize: 13,
    color: Colors.gray700,
  },
  newCatInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 100,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    gap: 8,
  },
  newCatInput: {
    fontSize: 13,
    color: Colors.black,
    paddingVertical: 10,
    minWidth: 120,
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
