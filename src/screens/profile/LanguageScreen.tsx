import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Language'>;
};

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function LanguageScreen({ navigation }: Props) {
  const currentUser = useUserStore(s => s.currentUser);
  const activeProfileId = useUserStore(s => s.activeProfile.id);
  const setUser = useUserStore(s => s.setUser);
  const switchProfile = useUserStore(s => s.switchProfile);

  const handleSelect = (code: string) => {
    if (code === currentUser.language) return;
    setUser({ ...currentUser, language: code });
    // setUser resets activeProfile to currentUser; restore the previously active profile
    // if a multi-profile was selected before the language change.
    if (activeProfileId !== currentUser.id) {
      switchProfile(activeProfileId);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>언어 설정</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>앱 표시 언어를 선택하세요</Text>
        <View style={styles.list}>
          {LANGUAGES.map((lang, idx) => {
            const selected = currentUser.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.row,
                  idx < LANGUAGES.length - 1 && styles.rowBorder,
                  selected && styles.rowSelected,
                ]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.6}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[styles.label, selected && styles.labelSelected]}>
                  {lang.label}
                </Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
    marginLeft: 4,
  },

  list: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  rowSelected: { backgroundColor: '#F0F8FF' },
  flag: { fontSize: 24 },
  label: { flex: 1, fontSize: 17, color: Colors.text },
  labelSelected: { color: Colors.primary, fontWeight: '600' },
  check: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
});
