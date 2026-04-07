import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, SensitivityLevel } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { ALLERGEN_OPTIONS } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileAdd'>;
};

export default function MultiProfileAddScreen({ navigation }: Props) {
  const addMultiProfile = useUserStore(s => s.addMultiProfile);

  const [name, setName] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('normal');

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('이름 필요', '프로필 이름을 입력해주세요.');
      return;
    }
    addMultiProfile({
      name: name.trim(),
      allergyProfile: selectedAllergies,
      dietaryRestrictions: [],
      sensitivityLevel: sensitivity,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 추가</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={styles.sectionLabel}>이름</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="프로필 이름 (예: 아이, 배우자)"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Sensitivity */}
        <Text style={styles.sectionLabel}>민감도 설정</Text>
        <View style={styles.sensitivityRow}>
          {(['normal', 'strict'] as SensitivityLevel[]).map(val => (
            <TouchableOpacity
              key={val}
              style={[styles.sensitivityCard, sensitivity === val && styles.sensitivityCardActive]}
              onPress={() => setSensitivity(val)}
              activeOpacity={0.7}>
              <Text style={styles.sensitivityEmoji}>{val === 'strict' ? '🛡️' : '✅'}</Text>
              <Text style={[styles.sensitivityLabel, sensitivity === val && styles.sensitivityLabelActive]}>
                {val === 'strict' ? '엄격 모드' : '일반 모드'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Allergies */}
        <Text style={styles.sectionLabel}>알러지 설정</Text>
        <View style={styles.allergyList}>
          {ALLERGEN_OPTIONS.map((opt, idx) => {
            const selected = selectedAllergies.includes(opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.allergyRow,
                  idx < ALLERGEN_OPTIONS.length - 1 && styles.allergyRowBorder,
                  selected && styles.allergyRowSelected,
                ]}
                onPress={() => toggleAllergy(opt.id)}
                activeOpacity={0.6}>
                <Text style={styles.allergyEmoji}>{opt.emoji}</Text>
                <Text style={[styles.allergyLabel, selected && styles.allergyLabelSelected]}>
                  {opt.label}
                </Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: { width: 52 },
  backText: { fontSize: 17, color: Colors.primary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  saveBtn: { fontSize: 16, fontWeight: '600', color: Colors.primary },

  content: { padding: 16 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 20,
  },

  nameInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.separator,
  },

  sensitivityRow: { flexDirection: 'row', gap: 10 },
  sensitivityCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sensitivityCardActive: { borderColor: Colors.primary, backgroundColor: '#F0F8FF' },
  sensitivityEmoji: { fontSize: 24 },
  sensitivityLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  sensitivityLabelActive: { color: Colors.primary, fontWeight: '700' },

  allergyList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  allergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  allergyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  allergyRowSelected: { backgroundColor: '#F0F8FF' },
  allergyEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  allergyLabel: { flex: 1, fontSize: 15, color: Colors.text },
  allergyLabelSelected: { color: Colors.primary, fontWeight: '600' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
