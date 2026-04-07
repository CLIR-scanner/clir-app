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
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;
};

type MenuRow = { label: string; sub?: string; onPress: () => void; destructive?: boolean };
type MenuSection = { title: string; rows: MenuRow[] };

export default function SettingsScreen({ navigation }: Props) {
  const sections: MenuSection[] = [
    {
      title: '지원',
      rows: [
        {
          label: '도움말',
          onPress: () => navigation.navigate('SettingsHelp'),
        },
        {
          label: '고객 상담',
          onPress: () => navigation.navigate('SettingsConsult'),
        },
        {
          label: '오류 신고',
          onPress: () => navigation.navigate('SettingsReport'),
        },
      ],
    },
    {
      title: '법적 고지',
      rows: [
        {
          label: '개인정보 처리방침',
          onPress: () => navigation.navigate('SettingsPrivacy'),
        },
      ],
    },
    {
      title: '계정',
      rows: [
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
        <Text style={styles.headerTitle}>{Strings.profileSettings}</Text>
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
                  <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDestructive]}>
                    {row.label}
                  </Text>
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
  rowLabel: { flex: 1, fontSize: 16, color: Colors.text },
  rowLabelDestructive: { color: Colors.danger },
  chevron: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
});
