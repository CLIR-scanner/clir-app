import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput, TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList, Profile } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfile'>;

function ProfileCard({
  profile, isActive, isMain, onSwitch, onDelete, t,
}: {
  profile: Profile; isActive: boolean; isMain: boolean;
  onSwitch: () => void; onDelete?: () => void;
  t: (key: string, opts?: any) => string;
}) {
  const allergenCount = profile.allergyProfile.length;
  const sub = allergenCount > 0
    ? t('multiProfile.allergenCount', { count: allergenCount })
    : t('multiProfile.noAllergens');

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onSwitch}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, isActive && styles.avatarActive]}>
          <Text style={[styles.avatarText, isActive && styles.avatarTextActive]}>
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
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('multiProfile.badgeActive')}</Text>
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

      {!isMain && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function MultiProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const currentUser          = useUserStore(s => s.currentUser);
  const activeProfile        = useUserStore(s => s.activeProfile);
  const switchProfile        = useUserStore(s => s.switchProfile);
  const deleteMultiProfile   = useUserStore(s => s.deleteMultiProfile);
  const setMultiProfileMode  = useUserStore(s => s.setMultiProfileMode);

  const [showNameModal, setShowNameModal] = useState(false);
  const [profileName,   setProfileName]   = useState('');

  function handleDelete(profile: Profile) {
    Alert.alert(
      t('multiProfile.deleteTitle'),
      t('multiProfile.deleteMsg', { name: profile.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            if (activeProfile.id === profile.id) switchProfile(currentUser.id);
            deleteMultiProfile(profile.id);
          },
        },
      ],
    );
  }

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
          <ProfileCard
            profile={currentUser}
            isActive={activeProfile.id === currentUser.id}
            isMain
            onSwitch={() => navigation.navigate('MultiProfileDetail', { profileId: currentUser.id })}
            t={t}
          />
          {currentUser.multiProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={activeProfile.id === profile.id}
              isMain={false}
              onSwitch={() => navigation.navigate('MultiProfileDetail', { profileId: profile.id })}
              onDelete={() => handleDelete(profile)}
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
          <Text style={styles.modalTitle}>Profile Name</Text>
          <Text style={styles.modalSub}>Enter a name for this profile.</Text>
          <TextInput
            style={styles.modalInput}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="e.g. Mom, Child, etc."
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
            <Text style={styles.modalBtnText}>Start Survey</Text>
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
  cardActive: { borderColor: DARK_GREEN, backgroundColor: CARD_FILL },
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
  cardSub: { fontSize: 12, color: MID_GREEN },
  mainBadge: {
    backgroundColor: CARD_FILL, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  mainBadgeText: { fontSize: 11, fontWeight: '600', color: MID_GREEN },
  activeBadge: {
    backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  deleteButton: { paddingLeft: 12 },
  deleteText: { fontSize: 16, color: BORDER },
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

  // ── Name modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    position: 'absolute', left: 24, right: 24,
    top: '35%',
    backgroundColor: BG, borderRadius: 20,
    padding: 24, gap: 12,
    borderWidth: 1, borderColor: BORDER,
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
