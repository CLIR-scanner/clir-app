import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, Profile } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { allergenLabel } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'MultiProfile'>;
};

export default function MultiProfileScreen({ navigation }: Props) {
  const currentUser = useUserStore(s => s.currentUser);
  const activeProfile = useUserStore(s => s.activeProfile);
  const switchProfile = useUserStore(s => s.switchProfile);

  const renderProfile = (profile: Profile, isMain: boolean) => {
    const isActive = activeProfile.id === profile.id;
    const allergyText =
      profile.allergyProfile.length > 0
        ? allergenLabel(profile.allergyProfile)
        : '알러지 없음';

    return (
      // W1 수정: 카드 전체를 TouchableOpacity로 감싸지 않고 View + 개별 터치 영역으로 분리
      <View key={profile.id} style={[styles.card, isActive && styles.cardActive]}>
        {/* 왼쪽 영역 — 탭 시 프로필 전환 */}
        <TouchableOpacity
          style={styles.cardPressArea}
          onPress={() => switchProfile(profile.id)}
          activeOpacity={0.6}>
          <View style={[styles.avatar, isActive && styles.avatarActive]}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, isActive && styles.nameActive]}>{profile.name}</Text>
              {isMain && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>메인</Text>
                </View>
              )}
            </View>
            <Text style={styles.allergy} numberOfLines={1}>{allergyText}</Text>
            <Text style={styles.sensitivity}>
              {profile.sensitivityLevel === 'strict' ? '🛡️ 엄격 모드' : '✅ 일반 모드'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 오른쪽 영역 — 활성 표시 또는 편집 버튼 */}
        {isActive && <Text style={styles.activeCheck}>✓</Text>}
        {/* W2 수정: 메인 프로필 편집은 설정 화면(Personal/Personalization) 경유 —
            멀티프로필만 MultiProfileDetail로 직접 편집 가능 */}
        {!isActive && !isMain && (
          <TouchableOpacity
            style={styles.editBtnWrap}
            onPress={() => navigation.navigate('MultiProfileDetail', { profileId: profile.id })}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.editBtn}>편집</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>멀티 프로필</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MultiProfileAdd')}>
          <Text style={styles.addBtn}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          프로필을 탭해 활성 프로필을 전환하세요.{'\n'}
          스캔 결과는 활성 프로필 기준으로 분석됩니다.
        </Text>

        <Text style={styles.sectionLabel}>내 프로필</Text>
        {renderProfile(currentUser, true)}

        {currentUser.multiProfiles.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>추가 프로필</Text>
            {currentUser.multiProfiles.map(p => renderProfile(p, false))}
          </>
        )}

        {currentUser.multiProfiles.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              가족이나 다른 사람의 프로필을 추가하면{'\n'}
              해당 프로필로 스캔할 수 있습니다.
            </Text>
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => navigation.navigate('MultiProfileAdd')}>
              <Text style={styles.addCardText}>＋ 프로필 추가</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: { width: 52 },
  backText: { fontSize: 17, color: Colors.primary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  addBtn: { fontSize: 16, color: Colors.primary, fontWeight: '600' },

  content: { padding: 16 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 20 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cardActive: { borderColor: Colors.primary, backgroundColor: '#F0F8FF' },
  cardPressArea: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: { backgroundColor: Colors.primary },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  nameActive: { color: Colors.primary },
  mainBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  allergy: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  sensitivity: { fontSize: 12, color: Colors.textSecondary },

  activeCheck: { fontSize: 20, color: Colors.primary, fontWeight: '700', paddingRight: 16 },
  editBtnWrap: { paddingHorizontal: 16, paddingVertical: 20 },
  editBtn: { fontSize: 13, color: Colors.primary },

  emptyBox: { alignItems: 'center', paddingTop: 24, gap: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  addCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addCardText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
