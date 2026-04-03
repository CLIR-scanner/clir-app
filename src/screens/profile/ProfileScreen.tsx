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
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { allergenLabel } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;
};

type MenuRow = {
  label: string;
  sub?: string;
  onPress: () => void;
};

type MenuSection = {
  title: string;
  rows: MenuRow[];
};

export default function ProfileScreen({ navigation }: Props) {
  const activeProfile = useUserStore(s => s.activeProfile);
  const currentUser = useUserStore(s => s.currentUser);

  const allergyText =
    activeProfile.allergyProfile.length > 0
      ? allergenLabel(activeProfile.allergyProfile)
      : '설정된 알러지 없음';

  const sensitivityText =
    activeProfile.sensitivityLevel === 'strict' ? '엄격 모드' : '일반 모드';

  const sections: MenuSection[] = [
    {
      title: '개인화 설정',
      rows: [
        {
          label: Strings.allergyTitle,
          sub: allergyText,
          onPress: () => navigation.navigate('PersonalizationAllergy'),
        },
        {
          label: Strings.sensitivityTitle,
          sub: sensitivityText,
          onPress: () => navigation.navigate('PersonalizationSensitivity'),
        },
        {
          label: '멀티 프로필',
          sub: `프로필 ${currentUser.multiProfiles.length + 1}개`,
          onPress: () => navigation.navigate('MultiProfile'),
        },
      ],
    },
    {
      title: '계정',
      rows: [
        {
          label: Strings.profilePersonal,
          onPress: () => navigation.navigate('Personal'),
        },
        {
          label: Strings.profileLanguage,
          sub: currentUser.language === 'ko' ? '한국어' : currentUser.language,
          onPress: () => navigation.navigate('Language'),
        },
      ],
    },
    {
      title: '앱 설정',
      rows: [
        {
          label: Strings.profileSettings,
          onPress: () => navigation.navigate('Settings'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.profileTitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {activeProfile.name ? activeProfile.name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{activeProfile.name || '이름 없음'}</Text>
            <Text style={styles.profileEmail}>{currentUser.email || '이메일 없음'}</Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <TouchableOpacity
                  key={`${section.title}-${idx}`}
                  style={[
                    styles.row,
                    idx < section.rows.length - 1 && styles.rowBorder,
                  ]}
                  onPress={row.onPress}
                  activeOpacity={0.6}>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {row.sub && (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {row.sub}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },

  section: { marginHorizontal: 16, marginBottom: 12 },
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
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 16, color: Colors.text },
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
});
