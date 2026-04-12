import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
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
  const currentUser        = useUserStore(s => s.currentUser);
  const activeProfile      = useUserStore(s => s.activeProfile);
  const switchProfile      = useUserStore(s => s.switchProfile);
  const deleteMultiProfile = useUserStore(s => s.deleteMultiProfile);

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
        onPress={() => navigation.navigate('MultiProfileAdd')}
      >
        <Text style={styles.addButtonText}>{t('multiProfile.addProfile')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 22, color: Colors.black, width: 32 },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.black,
  },
  headerRight: { width: 32 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 24 },
  scroll: { flex: 1 },
  list: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border, padding: 16,
  },
  cardActive: { borderColor: Colors.black },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  avatarActive: { backgroundColor: Colors.black },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.gray500 },
  avatarTextActive: { color: Colors.white },
  cardInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.black },
  cardSub: { fontSize: 12, color: Colors.gray500 },
  mainBadge: {
    backgroundColor: Colors.gray100, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  mainBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.gray700 },
  activeBadge: {
    backgroundColor: Colors.black, borderRadius: 100,
    paddingVertical: 2, paddingHorizontal: 8,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.white },
  deleteButton: { paddingLeft: 12 },
  deleteText: { fontSize: 16, color: Colors.gray300 },
  emptyText: {
    textAlign: 'center', fontSize: 14, color: Colors.gray300,
    lineHeight: 22, marginTop: 32,
  },
  addButton: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center',
    marginTop: 16, borderWidth: 1.5, borderColor: Colors.black,
  },
  addButtonText: { fontSize: 15, fontWeight: '700', color: Colors.black },
});
