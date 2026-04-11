import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';

type Nav   = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileDetail'>;
type Route = RouteProp<ProfileStackParamList, 'MultiProfileDetail'>;

const SENSITIVITY_LABEL: Record<string, string> = {
  strict: 'Strict',
  normal: 'Normal',
};

export default function MultiProfileDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { profileId } = route.params;

  const currentUser        = useUserStore(s => s.currentUser);
  const activeProfile      = useUserStore(s => s.activeProfile);
  const switchProfile      = useUserStore(s => s.switchProfile);
  const deleteMultiProfile = useUserStore(s => s.deleteMultiProfile);

  const isMainProfile = profileId === currentUser.id;
  const profile: import('../../types').Profile | undefined = isMainProfile
    ? currentUser
    : currentUser.multiProfiles.find(p => p.id === profileId);

  if (!profile) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.empty}>Profile not found.</Text>
      </View>
    );
  }

  const isActive = activeProfile.id === profileId;

  function handleSwitch() {
    switchProfile(profileId);
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile!.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (isActive) switchProfile(currentUser.id);
            deleteMultiProfile(profileId);
            navigation.goBack();
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
        <Text style={styles.headerTitle}>Profile Detail</Text>
        {isMainProfile ? (
          <Text style={styles.mainBadgeText}>Main</Text>
        ) : (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* 아바타 + 이름 */}
        <View style={styles.profileHero}>
          <View style={[styles.avatar, isActive && styles.avatarActive]}>
            <Text style={[styles.avatarText, isActive && styles.avatarTextActive]}>
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Currently Active</Text>
            </View>
          )}
        </View>

        {/* 민감도 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensitivity</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mode</Text>
            <View style={[
              styles.badge,
              profile.sensitivityLevel === 'strict' ? styles.badgeStrict : styles.badgeNormal,
            ]}>
              <Text style={[
                styles.badgeText,
                profile.sensitivityLevel === 'strict' ? styles.badgeTextStrict : styles.badgeTextNormal,
              ]}>
                {SENSITIVITY_LABEL[profile.sensitivityLevel] ?? profile.sensitivityLevel}
              </Text>
            </View>
          </View>
          <Text style={styles.infoDesc}>
            {profile.sensitivityLevel === 'strict'
              ? 'Warns about ingredients that may contain trace amounts of allergens.'
              : 'Only warns about ingredients directly included in the product.'}
          </Text>
        </View>

        {/* 알러지 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergy Profile</Text>
          {profile.allergyProfile.length === 0 ? (
            <Text style={styles.emptyText}>No allergens registered.</Text>
          ) : (
            <View style={styles.chips}>
              {profile.allergyProfile.map(item => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 식이 제한 */}
        {profile.dietaryRestrictions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
            <View style={styles.chips}>
              {profile.dietaryRestrictions.map(item => (
                <View key={item} style={[styles.chip, styles.chipDiet]}>
                  <Text style={styles.chipText}>{item.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      {!isActive && (
        <TouchableOpacity style={styles.switchButton} onPress={handleSwitch}>
          <Text style={styles.switchButtonText}>Set as Active Profile</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 24,
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
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.danger,
    width: 48,
    textAlign: 'right',
  },
  mainBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray500,
    width: 48,
    textAlign: 'right',
  },
  scroll: { flex: 1 },

  // 프로필 히어로
  profileHero: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: Colors.black,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray500,
  },
  avatarTextActive: {
    color: Colors.white,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
  },
  activeBadge: {
    backgroundColor: Colors.black,
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },

  // 섹션
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  infoDesc: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeStrict: { backgroundColor: Colors.dangerLight },
  badgeNormal: { backgroundColor: Colors.safeLight },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeTextStrict: { color: Colors.danger },
  badgeTextNormal: { color: Colors.safe },

  // 칩
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
  chipDiet: {
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    color: Colors.black,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray300,
  },

  // 활성화 버튼
  switchButton: {
    backgroundColor: Colors.black,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  switchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  empty: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: 'center',
    marginTop: 60,
  },
});
