import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, NativeModules, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Language'>;

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'ko', label: 'Korean',   native: '한국어' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese',  native: '中文' },
  { code: 'es', label: 'Spanish',  native: 'Español' },
  { code: 'fr', label: 'French',   native: 'Français' },
];

function getDeviceLanguageCode(): string {
  try {
    const raw: string | undefined =
      Platform.OS === 'ios'
        ? (NativeModules.SettingsManager?.settings?.AppleLocale as string | undefined) ??
          (NativeModules.SettingsManager?.settings?.AppleLanguages as string[] | undefined)?.[0]
        : (NativeModules.I18nManager?.localeIdentifier as string | undefined);
    if (!raw) return 'en';
    return raw.split(/[-_]/)[0].toLowerCase();
  } catch {
    return 'en';
  }
}

export default function LanguageScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const currentLanguage = useUserStore(s => s.currentUser.language);
  const setLanguage     = useUserStore(s => s.setLanguage);

  const [deviceCode] = useState<string>(getDeviceLanguageCode);

  useEffect(() => {
    const supported = LANGUAGES.some(l => l.code === deviceCode);
    if (currentLanguage === 'en' && supported && deviceCode !== 'en') {
      setLanguage(deviceCode);
      i18n.changeLanguage(deviceCode);
    }
  }, []);

  function handleSelect(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('language.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {LANGUAGES.some(l => l.code === deviceCode) && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {t('language.deviceDetected')}{' '}
              <Text style={styles.noticeHighlight}>
                {LANGUAGES.find(l => l.code === deviceCode)?.native}
              </Text>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          {LANGUAGES.map((lang, idx) => {
            const isSelected = currentLanguage === lang.code;
            const isDevice   = deviceCode === lang.code;
            return (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemNative}>{lang.native}</Text>
                    <Text style={styles.itemLabel}>{lang.label}</Text>
                    {isDevice && (
                      <View style={styles.deviceBadge}>
                        <Text style={styles.deviceBadgeText}>{t('language.deviceBadge')}</Text>
                      </View>
                    )}
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {idx < LANGUAGES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20,
  },
  backBtn: { width: 36, alignItems: 'center' },
  backText: { fontSize: 32, color: Colors.black, lineHeight: 36 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.black },
  list: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, gap: 12 },
  notice: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  noticeText: { fontSize: 13, color: Colors.primary },
  noticeHighlight: { fontWeight: '700' },
  section: {
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 20,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 16,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemNative: { fontSize: 16, fontWeight: '600', color: Colors.black },
  itemLabel: { fontSize: 14, color: Colors.gray500 },
  deviceBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  deviceBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  checkmark: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border },
});
