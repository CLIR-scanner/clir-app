import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalizationAllergy'>;
};

const ALLERGEN_OPTIONS: { id: string; label: string; desc: string; emoji: string }[] = [
  { id: 'ing-peanut',    label: '땅콩',         desc: '아나필락시스 위험 — 극소량도 주의',    emoji: '🥜' },
  { id: 'ing-milk',      label: '유제품 (우유)', desc: '카세인·유청 단백질 알러지',            emoji: '🥛' },
  { id: 'ing-wheat',     label: '밀 (글루텐)',   desc: '셀리악병·글루텐 민감성',               emoji: '🌾' },
  { id: 'ing-egg',       label: '달걀',         desc: '난백·난황 알러지',                      emoji: '🥚' },
  { id: 'ing-soy',       label: '대두 (콩)',     desc: '대두 단백질 알러지',                    emoji: '🫘' },
  { id: 'ing-fish',      label: '생선',         desc: '어류 알러지 (연어, 참치 등)',            emoji: '🐟' },
  { id: 'ing-shellfish', label: '갑각류',       desc: '새우, 게, 랍스터 등',                   emoji: '🦐' },
  { id: 'ing-tree-nut',  label: '견과류',       desc: '호두, 캐슈넛, 아몬드 등',               emoji: '🌰' },
  { id: 'ing-sesame',    label: '참깨',         desc: '참깨 및 참기름 포함 제품',              emoji: '🌿' },
  { id: 'ing-oat',       label: '귀리',         desc: '글루텐 교차 오염 위험',                 emoji: '🥣' },
];

export default function PersonalizationAllergyScreen({ navigation }: Props) {
  const allergyProfile = useUserStore(s => s.activeProfile.allergyProfile);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const toggle = (id: string) => {
    const next = allergyProfile.includes(id)
      ? allergyProfile.filter(a => a !== id)
      : [...allergyProfile, id];
    updateActiveProfile({ allergyProfile: next });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.allergyTitle}</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{Strings.allergySubtitle}</Text>

        <View style={styles.list}>
          {ALLERGEN_OPTIONS.map((opt, idx) => {
            const selected = allergyProfile.includes(opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.row,
                  idx < ALLERGEN_OPTIONS.length - 1 && styles.rowBorder,
                  selected && styles.rowSelected,
                ]}
                onPress={() => toggle(opt.id)}
                activeOpacity={0.6}>
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.rowDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>
          선택한 알러지 성분이 포함된 제품은 스캔 시 즉시 위험·주의로 표시됩니다.
        </Text>
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

  content: { padding: 16 },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },

  list: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  rowSelected: {
    backgroundColor: '#F0F8FF',
  },
  emoji: { fontSize: 24, width: 32, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  rowLabelSelected: { color: Colors.primary, fontWeight: '600' },
  rowDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  note: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
