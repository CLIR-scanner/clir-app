import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { logout } from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Personal'>;
};

type MenuRow = { label: string; sub?: string; onPress: () => void; destructive?: boolean };
type MenuSection = { title: string; rows: MenuRow[] };

export default function PersonalScreen({ navigation }: Props) {
  const currentUser = useUserStore(s => s.currentUser);
  const setUser = useUserStore(s => s.setUser);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout().catch(() => {});
          // currentUser를 빈 guest로 리셋 → RootNavigator가 AuthNavigator로 전환
          setUser({
            id: '',
            email: '',
            name: '',
            allergyProfile: [],
            dietaryRestrictions: [],
            sensitivityLevel: 'normal',
            language: 'ko',
            multiProfiles: [],
          });
        },
      },
    ]);
  };

  const sections: MenuSection[] = [
    {
      title: '계정 정보',
      rows: [
        {
          label: '이름',
          sub: currentUser.name || '이름 없음',
          onPress: () => navigation.navigate('PersonalName'),
        },
        {
          label: '이메일',
          sub: currentUser.email || '이메일 없음',
          onPress: () => navigation.navigate('PersonalEmail'),
        },
      ],
    },
    {
      title: '알림 및 구독',
      rows: [
        {
          label: '푸시 알림',
          onPress: () => navigation.navigate('PersonalPush'),
        },
        {
          label: '멤버십',
          onPress: () => navigation.navigate('PersonalMembership'),
        },
      ],
    },
    {
      title: '계정 관리',
      rows: [
        {
          label: '로그아웃',
          onPress: handleLogout,
          destructive: true,
        },
        {
          label: '회원 탈퇴',
          onPress: () => navigation.navigate('SettingsDelete'),
          destructive: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <TouchableOpacity
                  key={`${section.title}-${idx}`}
                  style={[styles.row, idx < section.rows.length - 1 && styles.rowBorder]}
                  onPress={row.onPress}
                  activeOpacity={0.6}>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDestructive]}>
                      {row.label}
                    </Text>
                    {row.sub && (
                      <Text style={styles.rowSub} numberOfLines={1}>{row.sub}</Text>
                    )}
                  </View>
                  {!row.destructive && <Text style={styles.chevron}>›</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 16, color: Colors.text },
  rowLabelDestructive: { color: Colors.danger },
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
});
