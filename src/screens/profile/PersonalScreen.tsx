import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Personal'>;

interface MenuRowProps {
  label: string;
  description?: string;
  onPress: () => void;
  noDivider?: boolean;
}

function MenuRow({ label, description, onPress, noDivider }: MenuRowProps) {
  return (
    <View>
      <TouchableOpacity
        style={styles.menuRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuRowContent}>
          <Text style={styles.menuLabel}>{label}</Text>
          {description !== undefined && (
            <Text style={styles.menuDescription}>{description}</Text>
          )}
        </View>
        <Text style={styles.menuChevron}>{'›'}</Text>
      </TouchableOpacity>
      {!noDivider && <View style={styles.menuDivider} />}
    </View>
  );
}

export default function PersonalScreen() {
  const { t }      = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets     = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.back')}
          >
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('personal.title')}</Text>
        <View style={styles.headerSide} />
      </View>

      {/* ── Section pill ──────────────────────────────────────────────── */}
      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText}>{t('personal.section')}</Text>
      </View>

      {/* ── Menu items ────────────────────────────────────────────────── */}
      <View style={styles.menuBlock}>
        <MenuRow
          label={t('personal.name')}
          onPress={() => navigation.navigate('PersonalName')}
        />
        <MenuRow
          label={t('personal.nickname.menuLabel')}
          description={t('personal.nickname.menuDescription')}
          onPress={() => navigation.navigate('PersonalNickname')}
        />
        <MenuRow
          label={t('personal.email')}
          onPress={() => navigation.navigate('PersonalEmail')}
          noDivider
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.profileBackground },
  content: { paddingHorizontal: 26, gap: 18 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 4,
  },
  headerSide:  { flex: 1 },
  backBtn:     { fontSize: 32, lineHeight: 34, color: Colors.profileDarkGreen, fontFamily: 'Pretendard-Light' },
  headerTitle: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: Colors.profileDarkGreen, letterSpacing: -0.3, textAlign: 'center' },

  sectionPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.profileDarkGreen,
    borderRadius: 10, paddingVertical: 5, paddingHorizontal: 17,
  },
  sectionPillText: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold', color: Colors.profileDarkGreen },

  menuBlock: { gap: 0 },

  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuRowContent: { flex: 1 },
  menuLabel: {
    fontSize: 14, fontFamily: 'Pretendard-Regular', color: Colors.profileText,
  },
  menuDescription: {
    fontSize: 11, color: Colors.gray500, marginTop: 2, lineHeight: 16,
  },
  menuChevron: {
    fontSize: 22, color: Colors.profileMutedGreen, lineHeight: 26,
    marginLeft: 8,
  },
  menuDivider: { height: 1, backgroundColor: Colors.profileBorder },
});
