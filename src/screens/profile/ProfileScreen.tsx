import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const SENSITIVITY_KEY: Record<string, string> = {
  strict: 'sensitivity.strictBadge',
  normal: 'sensitivity.normalBadge',
};

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const currentUser   = useUserStore(s => s.currentUser);
  const activeProfile = useUserStore(s => s.activeProfile);
  const logout        = useUserStore(s => s.logout);

  const MENU_ITEMS: { label: string; screen: keyof ProfileStackParamList }[] = [
    { label: t('profile.menuDietary'),         screen: 'PersonalizationAllergy' },
    { label: t('profile.menuSensitivity'),     screen: 'PersonalizationSensitivity' },
    { label: t('profile.menuPersonalization'), screen: 'Personalization' },
    { label: t('profile.menuFamily'),          screen: 'MultiProfile' },
    { label: t('profile.menuLanguage'),        screen: 'Language' },
    { label: t('profile.menuSettings'),        screen: 'Settings' },
  ];

  function handleLogout() {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t('profile.title')}</Text>
      </View>

      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {activeProfile.name ? activeProfile.name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{activeProfile.name || '—'}</Text>
          <Text style={styles.profileEmail}>{currentUser.email || '—'}</Text>
        </View>
      </View>

      {/* 알러지 & 민감도 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.myProfile')}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.sensitivity')}</Text>
          <View style={[
            styles.badge,
            activeProfile.sensitivityLevel === 'strict' ? styles.badgeStrict : styles.badgeNormal,
          ]}>
            <Text style={[
              styles.badgeText,
              activeProfile.sensitivityLevel === 'strict' ? styles.badgeTextStrict : styles.badgeTextNormal,
            ]}>
              {t(SENSITIVITY_KEY[activeProfile.sensitivityLevel] ?? 'sensitivity.normalBadge')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>{t('profile.allergyProfile')}</Text>
          {activeProfile.allergyProfile.length === 0 ? (
            <Text style={styles.emptyText}>{t('profile.noAllergens')}</Text>
          ) : (
            <View style={styles.chips}>
              {activeProfile.allergyProfile.map(item => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 메뉴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.settingsSection')}</Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>{'›'}</Text>
              </TouchableOpacity>
              {idx < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.black,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.gray500,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBlock: {
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray300,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.gray100,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 13,
    color: Colors.black,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeStrict: {
    backgroundColor: Colors.dangerLight,
  },
  badgeNormal: {
    backgroundColor: Colors.safeLight,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeTextStrict: {
    color: Colors.danger,
  },
  badgeTextNormal: {
    color: Colors.safe,
  },
  menuList: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLabel: {
    fontSize: 15,
    color: Colors.black,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.gray300,
    lineHeight: 22,
  },
  logoutButton: {
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
});
