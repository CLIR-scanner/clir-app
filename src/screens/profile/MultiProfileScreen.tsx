import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, Profile } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfile'>;

function ProfileCard({
  profile,
  isActive,
  isMain,
  onSwitch,
  onDelete,
}: {
  profile: Profile;
  isActive: boolean;
  isMain: boolean;
  onSwitch: () => void;
  onDelete?: () => void;
}) {
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
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>
            {profile.allergyProfile.length > 0
              ? `${profile.allergyProfile.length} allergen${profile.allergyProfile.length > 1 ? 's' : ''}`
              : 'No allergens registered'}
            {' · '}
            {profile.sensitivityLevel === 'strict' ? 'Strict' : 'Normal'}
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
  const currentUser   = useUserStore(s => s.currentUser);
  const activeProfile = useUserStore(s => s.activeProfile);
  const switchProfile    = useUserStore(s => s.switchProfile);
  const deleteMultiProfile = useUserStore(s => s.deleteMultiProfile);

  function handleDelete(profile: Profile) {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // 삭제할 프로필이 현재 활성이면 메인으로 전환
            if (activeProfile.id === profile.id) {
              switchProfile(currentUser.id);
            }
            deleteMultiProfile(profile.id);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Multi Profiles</Text>
        <View style={styles.headerRight} />
      </View>

      <Text style={styles.subtitle}>
        Switch between profiles to filter food recommendations per person.
      </Text>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {/* 메인 프로필 */}
          <ProfileCard
            profile={currentUser}
            isActive={activeProfile.id === currentUser.id}
            isMain
            onSwitch={() => navigation.navigate('MultiProfileDetail', { profileId: currentUser.id })}
          />

          {/* 추가 프로필 목록 */}
          {currentUser.multiProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={activeProfile.id === profile.id}
              isMain={false}
              onSwitch={() => navigation.navigate('MultiProfileDetail', { profileId: profile.id })}
              onDelete={() => handleDelete(profile)}
            />
          ))}
        </View>

        {currentUser.multiProfiles.length === 0 && (
          <Text style={styles.emptyText}>
            No family profiles yet.{'\n'}Add one to get started.
          </Text>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* 추가 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('MultiProfileAdd')}
      >
        <Text style={styles.addButtonText}>+ Add Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 22,
    color: Colors.black,
    width: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.black,
  },
  headerRight: {
    width: 32,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  list: {
    gap: 10,
  },

  // 프로필 카드
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  cardActive: {
    borderColor: Colors.black,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: Colors.black,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray500,
  },
  avatarTextActive: {
    color: Colors.white,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.gray500,
  },
  mainBadge: {
    backgroundColor: Colors.gray100,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray700,
  },
  activeBadge: {
    backgroundColor: Colors.black,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteButton: {
    paddingLeft: 12,
  },
  deleteText: {
    fontSize: 16,
    color: Colors.gray300,
  },

  // 빈 상태
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.gray300,
    lineHeight: 22,
    marginTop: 32,
  },

  // 추가 버튼
  addButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: Colors.black,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
