import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList, SensitivityLevel } from '../../types';
import { signup } from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Survey'>;
  route: RouteProp<AuthStackParamList, 'Survey'>;
};

const SENSITIVITY_OPTIONS: { value: SensitivityLevel; label: string; emoji: string; desc: string }[] = [
  { value: 'normal', label: Strings.sensitivityNormal, emoji: '✅', desc: Strings.sensitivityNormalDesc },
  { value: 'strict', label: Strings.sensitivityStrict, emoji: '🛡️', desc: Strings.sensitivityStrictDesc },
];

const ALLERGEN_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: 'ing-peanut',    label: '땅콩',         emoji: '🥜' },
  { id: 'ing-milk',      label: '유제품 (우유)', emoji: '🥛' },
  { id: 'ing-wheat',     label: '밀 (글루텐)',   emoji: '🌾' },
  { id: 'ing-egg',       label: '달걀',         emoji: '🥚' },
  { id: 'ing-soy',       label: '대두 (콩)',     emoji: '🫘' },
  { id: 'ing-fish',      label: '생선',         emoji: '🐟' },
  { id: 'ing-shellfish', label: '갑각류',       emoji: '🦐' },
  { id: 'ing-tree-nut',  label: '견과류',       emoji: '🌰' },
  { id: 'ing-sesame',    label: '참깨',         emoji: '🌿' },
  { id: 'ing-oat',       label: '귀리',         emoji: '🥣' },
];

export default function SurveyScreen({ navigation, route }: Props) {
  const { name, email, password } = route.params;
  const setUser = useUserStore(s => s.setUser);

  const [allergyProfile, setAllergyProfile] = useState<string[]>([]);
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAllergen = (id: string) => {
    setAllergyProfile(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signup({
        name,
        email,
        password,
        allergyProfile,
        dietaryRestrictions: [],
        sensitivityLevel,
      });
      setUser(user);
      // setUser가 isInitialized: true + currentUser.id를 설정하면
      // RootNavigator가 자동으로 MainNavigator로 전환함 — 명시적 navigate 불필요
    } catch {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알러지 설정</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <View style={styles.step} />
          <View style={[styles.step, styles.stepActive]} />
        </View>

        <Text style={styles.sectionTitle}>{Strings.allergyTitle}</Text>
        <Text style={styles.subtitle}>{Strings.allergySubtitle}</Text>

        <View style={styles.allergenList}>
          {ALLERGEN_OPTIONS.map((opt, idx) => {
            const selected = allergyProfile.includes(opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.allergenRow,
                  idx < ALLERGEN_OPTIONS.length - 1 && styles.allergenBorder,
                  selected && styles.allergenSelected,
                ]}
                onPress={() => toggleAllergen(opt.id)}
                activeOpacity={0.6}>
                <Text style={styles.allergenEmoji}>{opt.emoji}</Text>
                <Text style={[styles.allergenLabel, selected && styles.allergenLabelSelected]}>
                  {opt.label}
                </Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{Strings.sensitivityTitle}</Text>

        <View style={styles.sensitivityList}>
          {SENSITIVITY_OPTIONS.map((opt, idx) => {
            const selected = sensitivityLevel === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.sensitivityRow,
                  idx === 0 && styles.sensitivityBorder,
                  selected && styles.sensitivitySelected,
                ]}
                onPress={() => setSensitivityLevel(opt.value)}
                activeOpacity={0.7}>
                <Text style={styles.sensitivityEmoji}>{opt.emoji}</Text>
                <View style={styles.sensitivityInfo}>
                  <Text style={[styles.sensitivityLabel, selected && styles.sensitivityLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.sensitivityDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleComplete}
          disabled={loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>완료 — 시작하기 🎉</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>나중에 프로필 설정에서 언제든지 변경할 수 있습니다.</Text>
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

  content: { padding: 20, paddingBottom: 40 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.separator },
  stepActive: { backgroundColor: Colors.primary },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 14 },

  allergenList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  allergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  allergenBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  allergenSelected: { backgroundColor: '#F0F8FF' },
  allergenEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  allergenLabel: { flex: 1, fontSize: 15, color: Colors.text },
  allergenLabelSelected: { color: Colors.primary, fontWeight: '600' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sensitivityList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sensitivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sensitivityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  sensitivitySelected: { backgroundColor: '#F0F8FF' },
  sensitivityEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  sensitivityInfo: { flex: 1 },
  sensitivityLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  sensitivityLabelSelected: { color: Colors.primary },
  sensitivityDesc: { fontSize: 12, color: Colors.textSecondary },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  errorText: { fontSize: 14, color: Colors.danger, marginTop: 8 },

  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  note: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 },
});
