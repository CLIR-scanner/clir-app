import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput, TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
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
      style={[styles.card, isEnabled && !isMain && styles.cardEnabled]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, (isMain || isEnabled) && styles.avatarActive]}>
          <Text style={[styles.avatarText, (isMain || isEnabled) && styles.avatarTextActive]}>
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
            {!isMain && isEnabled && (
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledBadgeText}>{t('multiProfile.badgeEnabled')}</Text>
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
          <Text style={[styles.toggleBtnText, isEnabled && styles.toggleBtnTextActive]}>
            {isEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function MultiProfileScreen() {
  const navigation          = useNavigation<Nav>();
  const { t }               = useTranslation();
  const currentUser          = useUserStore(s => s.currentUser);
  const enabledProfileIds    = useUserStore(s => s.enabledProfileIds);
  const toggleProfileEnabled = useUserStore(s => s.toggleProfileEnabled);
  const setMultiProfileMode  = useUserStore(s => s.setMultiProfileMode);

  const [showNameModal, setShowNameModal] = useState(false);
  const [profileName,   setProfileName]   = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('multiProfile.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <Text style={styles.subtitle}>{t('multiProfile.subtitle')}</Text>

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
        </View>

        {currentUser.multiProfiles.length === 0 && (
          <Text style={styles.emptyText}>{t('multiProfile.emptyHint')}</Text>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => { setProfileName(''); setShowNameModal(true); }}
      >
        <Text style={styles.addButtonText}>{t('multiProfile.addProfile')}</Text>
      </TouchableOpacity>

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

const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 22, color: DARK_GREEN, width: 32 },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: DARK_GREEN,
  },
  headerRight: { width: 32 },
  subtitle: { fontSize: 13, color: MID_GREEN, lineHeight: 20, marginBottom: 24 },
  scroll: { flex: 1 },
  list: { gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER, padding: 16,
  },
  cardEnabled: { borderColor: DARK_GREEN, backgroundColor: CARD_FILL },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },

  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: CARD_FILL, alignItems: 'center', justifyContent: 'center',
  },
  avatarActive: { backgroundColor: DARK_GREEN },
  avatarText: { fontSize: 20, fontWeight: '700', color: MID_GREEN },
  avatarTextActive: { color: '#FFFFFF' },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: DARK_GREEN },
  cardSub:  { fontSize: 12, color: MID_GREEN },

  mainBadge: {
    backgroundColor: CARD_FILL, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  mainBadgeText: { fontSize: 11, fontWeight: '600', color: MID_GREEN },

  enabledBadge: {
    backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  enabledBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },

  // ON/OFF 토글 버튼
  toggleBtn: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: BG,
  },
  toggleBtnActive: { borderColor: DARK_GREEN, backgroundColor: DARK_GREEN },
  toggleBtnText: { fontSize: 11, fontWeight: '700', color: BORDER },
  toggleBtnTextActive: { color: '#FFFFFF' },

  emptyText: {
    textAlign: 'center', fontSize: 14, color: BORDER,
    lineHeight: 22, marginTop: 32,
  },
  addButton: {
    backgroundColor: BG, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 16, borderWidth: 1.5, borderColor: DARK_GREEN,
  },
  addButtonText: { fontSize: 15, fontWeight: '700', color: DARK_GREEN },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    position: 'absolute', left: 24, right: 24, top: '35%',
    backgroundColor: BG, borderRadius: 20,
    padding: 24, gap: 12, borderWidth: 1, borderColor: BORDER,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: DARK_GREEN },
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
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
