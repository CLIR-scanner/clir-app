import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput, TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileStackParamList, Profile } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfile'>;

function ProfileCard({
  profile, isMain, isEnabled, onPress, onToggle, t,
}: {
  profile: Profile;
  isMain: boolean;
  isEnabled: boolean;
  onPress: () => void;
  onToggle?: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const allergenCount = profile.allergyProfile.length;
  const sub = allergenCount > 0
    ? t('multiProfile.allergenCount', { count: allergenCount })
    : t('multiProfile.noAllergens');

  return (
    <TouchableOpacity
      style={[styles.card, !isMain && !isEnabled && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, isMain && styles.avatarMain, !isMain && isEnabled && styles.avatarEnabled, !isMain && !isEnabled && styles.avatarDisabled]}>
          <Text style={[styles.avatarText, isMain && styles.avatarTextMain, !isMain && isEnabled && styles.avatarTextEnabled]}>
            {profile.name ? profile.name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{profile.name || '—'}</Text>
            {isMain && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>{t('multiProfile.badgeMain')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>
            {sub}
            {' · '}
            {profile.sensitivityLevel === 'strict'
              ? t('multiProfile.strict')
              : t('multiProfile.normal')}
          </Text>
        </View>
      </View>

      {!isMain && onToggle && (
        <TouchableOpacity
          style={[styles.toggleBtn, isEnabled && styles.toggleBtnActive]}
          onPress={onToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.75}
        >
          <View style={[styles.toggleKnob, isEnabled && styles.toggleKnobActive]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function MultiProfileScreen() {
  const navigation          = useNavigation<Nav>();
  const { t }               = useTranslation();
  const insets              = useSafeAreaInsets();
  const currentUser          = useUserStore(s => s.currentUser);
  const enabledProfileIds    = useUserStore(s => s.enabledProfileIds);
  const toggleProfileEnabled = useUserStore(s => s.toggleProfileEnabled);
  const setMultiProfileMode  = useUserStore(s => s.setMultiProfileMode);

  const [showNameModal, setShowNameModal] = useState(false);
  const [profileName,   setProfileName]   = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('multiProfile.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {/* 메인 프로필 — 항상 스캔에 적용, 토글 없음 */}
          <ProfileCard
            profile={currentUser}
            isMain
            isEnabled
            onPress={() => navigation.navigate('MultiProfileDetail', { profileId: currentUser.id })}
            t={t}
          />
          {currentUser.multiProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isMain={false}
              isEnabled={enabledProfileIds.includes(profile.id)}
              onPress={() => navigation.navigate('MultiProfileDetail', { profileId: profile.id })}
              onToggle={() => toggleProfileEnabled(profile.id)}
              t={t}
            />
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { setProfileName(''); setShowNameModal(true); }}
          >
            <Text style={styles.addButtonText}>{t('multiProfile.addProfile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Profile name modal ─────────────────────────────────────────── */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowNameModal(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t('profileUi.profileName')}</Text>
          <Text style={styles.modalSub}>{t('profileUi.profileNamePrompt')}</Text>
          <TextInput
            style={styles.modalInput}
            value={profileName}
            onChangeText={setProfileName}
            placeholder={t('profileUi.profileNamePlaceholder')}
            placeholderTextColor={BORDER}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.modalBtn, !profileName.trim() && { opacity: 0.4 }]}
            disabled={!profileName.trim()}
            onPress={() => {
              setShowNameModal(false);
              setMultiProfileMode(true, profileName.trim());
              navigation.navigate('MultiProfileAdd');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.modalBtnText}>{t('profileUi.startSurvey')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const BG         = '#FDFFFD';
const DARK_GREEN = '#044733';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backText: { fontSize: 32, lineHeight: 34, color: DARK_GREEN, fontFamily: 'Pretendard-Light', width: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: DARK_GREEN,
    letterSpacing: -0.3,
  },
  headerRight: { width: 32 },
  subtitle: { fontSize: 13, color: MID_GREEN, lineHeight: 20, marginBottom: 24, paddingHorizontal: 24 },
  scroll: { flex: 1 },
  list: { gap: 10, paddingHorizontal: 26 },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: CARD_FILL, borderRadius: 15,
    borderWidth: 1, borderColor: BORDER,
    height: 94,
    paddingHorizontal: 17,
  },
  cardDisabled: { backgroundColor: BG },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },

  avatar: {
    width: 66, height: 66, borderRadius: 33,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_FILL, alignItems: 'center', justifyContent: 'center',
  },
  avatarMain: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  avatarEnabled: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  avatarDisabled: { backgroundColor: BG, borderColor: BORDER },
  avatarText: { fontSize: 28, lineHeight: 32, fontFamily: 'Pretendard-ExtraBold', color: MID_GREEN },
  avatarTextMain: { color: '#FFFFFF' },
  avatarTextEnabled: { color: '#FFFFFF' },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: DARK_GREEN },
  cardSub:  { fontSize: 13, fontFamily: 'Pretendard-Regular', color: MID_GREEN },

  mainBadge: {
    backgroundColor: CARD_FILL, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  mainBadgeText: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: MID_GREEN },

  // Toggle switch
  toggleBtn: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    backgroundColor: BORDER,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  toggleBtnActive: {
    backgroundColor: DARK_GREEN,
    alignItems: 'flex-end',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BG,
  },
  toggleKnobActive: {
    backgroundColor: '#FFFFFF',
  },

  emptyText: {
    textAlign: 'center', fontSize: 14, color: BORDER,
    lineHeight: 22, marginTop: 32,
  },
  addButton: {
    backgroundColor: BG, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: BORDER,
  },
  addButtonText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: DARK_GREEN },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    position: 'absolute', left: 24, right: 24, top: '35%',
    backgroundColor: BG, borderRadius: 20,
    padding: 24, gap: 12, borderWidth: 1, borderColor: BORDER,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Pretendard-Bold', color: DARK_GREEN },
  modalSub:   { fontSize: 13, color: MID_GREEN },
  modalInput: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: DARK_GREEN, backgroundColor: BG,
  },
  modalBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalBtnText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: '#FFFFFF' },
});
