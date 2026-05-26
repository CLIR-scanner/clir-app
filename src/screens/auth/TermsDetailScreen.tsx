import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { getLegalSections } from '../../constants/legal-content';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'TermsDetail'>;
type Route = RouteProp<AuthStackParamList, 'TermsDetail'>;

const S = {
  bg: Colors.scanLightGreen,
  primary: '#044733',
  muted: Colors.searchMutedGreen,
  border: Colors.scanMutedGreen,
  black: Colors.profileText,
};

export default function TermsDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t, i18n } = useTranslation();
  const sections = getLegalSections(i18n.language);
  const section = sections[route.params.section];
  const [agreed, setAgreed] = React.useState(route.params.agreed ?? false);

  function handleAgree() {
    setAgreed(true);
    setTimeout(() => {
      navigation.navigate('TermsAgreement', { agreedSection: section.id });
    }, 160);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {section.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.badge}>
              {section.required ? t('auth.termsAgreement.required') : t('auth.termsAgreement.optional')}
            </Text>
            <Text style={styles.updated}>Last Updated: {section.lastUpdated}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.body} selectable>
            {section.body}
          </Text>
          <Text style={styles.contact}>Contact: clir.pbl2026@gmail.com</Text>
          <TouchableOpacity
            style={[styles.agreeButton, agreed && styles.agreeButtonActive]}
            onPress={handleAgree}
            activeOpacity={0.82}
          >
            <Text style={styles.agreeButtonText}>{t('auth.termsAgreement.agreeButton')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: S.bg,
  },
  container: {
    flex: 1,
    backgroundColor: S.bg,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backText: {
    color: S.primary,
    fontSize: 22,
    fontFamily: 'Pretendard-Regular',
  },
  headerTitle: {
    flex: 1,
    color: S.primary,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 44,
  },
  title: {
    color: S.black,
    fontSize: 28,
    fontFamily: 'Pretendard-ExtraBold',
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    color: S.primary,
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 16,
  },
  updated: {
    color: S.muted,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: S.border,
    marginTop: 22,
    marginBottom: 22,
  },
  body: {
    color: S.black,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 20,
  },
  contact: {
    color: S.primary,
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 20,
    marginTop: 28,
  },
  agreeButton: {
    height: 53,
    borderRadius: 35,
    backgroundColor: S.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  agreeButtonActive: {
    backgroundColor: S.primary,
  },
  agreeButtonText: {
    color: S.bg,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 22,
  },
});
