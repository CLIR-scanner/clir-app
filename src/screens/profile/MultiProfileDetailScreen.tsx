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

const BG         = '#F9FFF3';
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
  const toggleProfileEnabled = useUserStore(s => s.toggleProfileEnabled);
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
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          {isMainProfile
            ? <Text style={styles.mainLabel}>{t('multiProfileDetail.badgeMain')}</Text>
            : <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.deleteLabel}>{t('multiProfileDetail.deleteBtn')}</Text>
              </TouchableOpacity>
          }
        </View>
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
          {!isMainProfile && isEnabled && (
            <View style={styles.enabledBadge}>
              <Text style={styles.enabledBadgeText}>{t('multiProfileDetail.scanEnabled')}</Text>
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
                    <View key={item} style={[styles.chip, styles.chipDiet]}>
                      <Text style={styles.chipText}>{item.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* ── Enable / Disable (서브 프로필 전용) ─────────────────────────── */}
        {!isMainProfile && (
          <TouchableOpacity
            style={[styles.toggleBtn, isEnabled && styles.toggleBtnDisable]}
            onPress={() => toggleProfileEnabled(profileId)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, isEnabled && styles.toggleBtnTextDisable]}>
              {isEnabled ? t('multiProfileDetail.disableProfile') : t('multiProfileDetail.enableProfile')}
            </Text>
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
  backArrow:     { fontSize: 32, color: DARK_GREEN, fontWeight: '300', lineHeight: 34 },
  headerTitle:   { fontSize: 16, fontWeight: '500', color: DARK_GREEN, letterSpacing: -0.3, textAlign: 'center' },
  mainLabel:     { fontSize: 13, fontWeight: '600', color: MID_GREEN },
  deleteLabel:   { fontSize: 13, fontWeight: '600', color: STRICT_CLR },

  heroSection:  { alignItems: 'center', paddingVertical: 16, gap: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: MID_GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarImg:    { width: 80, height: 80, borderRadius: 40 },
  avatarText:   { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  profileName:  { fontSize: 20, fontWeight: '700', color: DARK_GREEN },
  enabledBadge:     { backgroundColor: DARK_GREEN, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 14 },
  enabledBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  infoCard: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 15, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 17, paddingVertical: 14,
  },
  infoLabel:   { fontSize: 16, fontWeight: '600', color: DARK_GREEN },
  infoBlock:   { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 16, gap: 10 },
  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 9 },

  sensitivityBadge:        { borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 16 },
  sensitivityStrict:       { backgroundColor: STRICT_BG, borderColor: STRICT_CLR },
  sensitivityNormal:       { backgroundColor: CARD_FILL, borderColor: BORDER },
  sensitivityText:         { fontSize: 13, fontWeight: '500' },
  sensitivityTextStrict:   { color: STRICT_CLR },
  sensitivityTextNormal:   { color: MID_GREEN },

  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { backgroundColor: CARD_FILL, borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 16 },
  chipDiet: { borderColor: MID_GREEN },
  chipText: { fontSize: 12, color: MID_GREEN, lineHeight: 20 },
  emptyText:{ fontSize: 13, color: BORDER },

  toggleBtn:            { backgroundColor: DARK_GREEN, borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  toggleBtnDisable:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: STRICT_CLR },
  toggleBtnText:        { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  toggleBtnTextDisable: { color: STRICT_CLR },

  notFound: { fontSize: 15, color: MID_GREEN, textAlign: 'center', marginTop: 60 },
});
