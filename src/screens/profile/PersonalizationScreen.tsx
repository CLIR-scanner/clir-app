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
import { allergenLabel } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Personalization'>;
};

type MenuRow = { label: string; sub?: string; onPress: () => void };
type MenuSection = { title: string; rows: MenuRow[] };

export default function PersonalizationScreen({ navigation }: Props) {
  const activeProfile = useUserStore(s => s.activeProfile);

  const allergyText =
    activeProfile.allergyProfile.length > 0
      ? allergenLabel(activeProfile.allergyProfile)
      : '설정된 알러지 없음';

  const sensitivityText =
    activeProfile.sensitivityLevel === 'strict' ? '엄격 모드' : '일반 모드';

  const sections: MenuSection[] = [
    {
      title: '알러지 및 민감도',
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
      ],
    },
    {
      title: '건강 정보',
      rows: [
        {
          label: '관련 성분',
          onPress: () => navigation.navigate('PersonalizationRelated'),
        },
        {
          label: '건강 체크',
          onPress: () => navigation.navigate('PersonalizationHealthCheck'),
        },
        {
          label: '밴드에이드 성분',
          onPress: () => navigation.navigate('PersonalizationBandAid'),
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
        <Text style={styles.headerTitle}>{Strings.profilePersonalization}</Text>
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
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    {row.sub && (
                      <Text style={styles.rowSub} numberOfLines={1}>{row.sub}</Text>
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
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
});
