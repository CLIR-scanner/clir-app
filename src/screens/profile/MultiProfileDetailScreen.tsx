import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';

type Nav   = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileDetail'>;
type Route = RouteProp<ProfileStackParamList, 'MultiProfileDetail'>;

const BG         = '#FDFFFD';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';
const STRICT_CLR = '#FF3434';
const STRICT_BG  = '#FFECEC';

export default function MultiProfileDetailScreen() {
  const navigation    = useNavigation<Nav>();
  const route         = useRoute<Route>();
  const { t }         = useTranslation();
  const insets        = useSafeAreaInsets();
  const { profileId } = route.params;

  const currentUser          = useUserStore(s => s.currentUser);
  const enabledProfileIds    = useUserStore(s => s.enabledProfileIds);
  const deleteMultiProfile   = useUserStore(s => s.deleteMultiProfile);

  const isMainProfile = profileId === currentUser.id;
  const isEnabled     = isMainProfile || enabledProfileIds.includes(profileId);

  const profile = isMainProfile
    ? currentUser
    : currentUser.multiProfiles.find(p => p.id === profileId);

  if (!profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 16 }}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>{t('multiProfileDetail.notFound')}</Text>
      </View>
    );
  }

  const isStrict    = profile.sensitivityLevel === 'strict';
  const hasAllergy  = profile.allergyProfile.length > 0;
  const hasDiet     = profile.dietaryRestrictions.length > 0;
  const initial     = (profile.name || '?')[0].toUpperCase();

  function handleDelete() {
    Alert.alert(
      t('multiProfile.deleteTitle'),
      t('multiProfile.deleteMsg', { name: profile!.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => { deleteMultiProfile(profileId); navigation.goBack(); } },
      ],
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
            <Text style={styles.backArrow}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('multiProfileDetail.headerTitle')}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ─────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            {profile.profileImage
              ? <Image source={{ uri: profile.profileImage }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initial}</Text>
            }
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          {isMainProfile && (
            <View style={styles.activeStatusBadge}>
              <Text style={styles.activeStatusText}>{t('multiProfileDetail.badgeMain')}</Text>
            </View>
          )}
          {!isMainProfile && (
            <View style={isEnabled ? styles.activeStatusBadge : styles.inactiveStatusBadge}>
              <Text style={isEnabled ? styles.activeStatusText : styles.inactiveStatusText}>
                {isEnabled ? t('multiProfileDetail.scanEnabled') : t('multiProfileDetail.scanDisabled')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Profile info card — tap to edit ────────────────────────────── */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => navigation.navigate('MultiProfileEdit', { profileId })}
          activeOpacity={0.85}
        >
          {/* Sensitivity row */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profileUi.sensitivity')}</Text>
            <View style={[styles.sensitivityBadge, isStrict ? styles.sensitivityStrict : styles.sensitivityNormal]}>
              <Text style={[styles.sensitivityText, isStrict ? styles.sensitivityTextStrict : styles.sensitivityTextNormal]}>
                {isStrict ? t('profileUi.strictMode') : t('profileUi.normalMode')}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Allergens */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>{t('profileUi.myAllergy')}</Text>
            {hasAllergy ? (
              <View style={styles.chips}>
                {profile.allergyProfile.map(item => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('profileUi.noAllergensSet')}</Text>
            )}
          </View>

          {hasDiet && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>{t('profileUi.dietPreference')}</Text>
                <View style={styles.chips}>
                  {profile.dietaryRestrictions.map(item => (
                    <View key={item} style={styles.chip}>
                      <Text style={styles.chipText}>{item.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* ── Delete (서브 프로필 전용) ───────────────────────────────────── */}
        {!isMainProfile && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>{t('multiProfileDetail.deleteBtn')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 26, gap: 12, paddingTop: 8 },

  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerSide:    { flex: 1 },
  backArrow:     { fontSize: 32, color: DARK_GREEN, fontFamily: 'Pretendard-Light', lineHeight: 34 },
  headerTitle:   { fontSize: 16, fontFamily: 'Pretendard-Regular', color: DARK_GREEN, letterSpacing: -0.3, textAlign: 'center' },
  activeStatusBadge: {
    backgroundColor: DARK_GREEN,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 18,
  },
  activeStatusText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: '#FFFFFF' },
  inactiveStatusBadge: {
    backgroundColor: CARD_FILL,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 18,
  },
  inactiveStatusText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: MID_GREEN },

  heroSection:  { alignItems: 'center', paddingVertical: 16, gap: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: MID_GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarImg:    { width: 80, height: 80, borderRadius: 40 },
  avatarText:   { fontSize: 32, fontFamily: 'Pretendard-ExtraBold', color: '#FFFFFF' },
  profileName:  { fontSize: 20, fontFamily: 'Pretendard-Bold', color: DARK_GREEN },
  infoCard: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 15, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 17, paddingVertical: 14,
  },
  infoLabel:   { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: DARK_GREEN },
  infoBlock:   { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 16, gap: 12 },
  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 9 },

  sensitivityBadge:        { borderWidth: 1, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18 },
  sensitivityStrict:       { backgroundColor: STRICT_BG, borderColor: STRICT_CLR },
  sensitivityNormal:       { backgroundColor: CARD_FILL, borderColor: BORDER },
  sensitivityText:         { fontSize: 13, fontFamily: 'Pretendard-Regular' },
  sensitivityTextStrict:   { color: STRICT_CLR },
  sensitivityTextNormal:   { color: MID_GREEN },

  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { backgroundColor: CARD_FILL, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 18 },
  chipText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: MID_GREEN },
  emptyText:{ fontSize: 13, color: BORDER },

  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: STRICT_CLR,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: STRICT_CLR },

  notFound: { fontSize: 15, color: MID_GREEN, textAlign: 'center', marginTop: 60 },
});
