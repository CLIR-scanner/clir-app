import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TouchableWithoutFeedback,
} from 'react-native';
import i18n from '../../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { getAllergenDisplay } from '../../services/allergen.service';
import { Colors } from '../../constants/colors';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { DIET_AVOIDED_CATEGORIES } from '../../constants/dietary';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

// ── Design tokens (Figma node 270:4667) ──────────────────────────────────────
const BG          = Colors.profileBackground;
const DARK_GREEN  = Colors.profileDarkGreen;
const MID_GREEN   = Colors.profileMutedGreen;
const BORDER      = Colors.profileBorder;
const CARD_FILL   = Colors.profileCard;
const STRICT_BG   = Colors.profileStrictBackground;
const STRICT_CLR  = Colors.profileStrict;
const CHIP_TEXT   = MID_GREEN;

// ── Dietary helpers ───────────────────────────────────────────────────────────

function getDietKey(dietaryRestrictions: string[]): string {
  if (dietaryRestrictions.includes('strict'))   return 'strict';
  if (dietaryRestrictions.includes('flexible')) return 'flexible';
  return dietaryRestrictions[0] ?? '';
}

// ── Caret up-down icon (Language 행용) ───────────────────────────────────────
function CaretUpDown() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 9l5-5 5 5"
        stroke={DARK_GREEN} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M7 15l5 5 5-5"
        stroke={DARK_GREEN} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { t }      = useTranslation();
  const insets     = useSafeAreaInsets();

  const currentUser   = useUserStore(s => s.currentUser);
  const activeProfile = useUserStore(s => s.activeProfile);
  const logout        = useUserStore(s => s.logout);

  const initial = activeProfile.name ? activeProfile.name[0].toUpperCase() : '?';
  const isStrict = activeProfile.sensitivityLevel === 'strict';

  const hasAllergy = activeProfile.allergyProfile.length > 0;
  const hasDiet    = activeProfile.dietaryRestrictions.length > 0;

  const dietKey      = hasDiet ? getDietKey(activeProfile.dietaryRestrictions) : '';
  const dietLabel    = dietKey ? t(`survey.dietTitles.${dietKey}`) : '';
  const avoidedFoods = DIET_AVOIDED_CATEGORIES[dietKey] ?? [];

  const currentLanguage = useUserStore(s => s.currentUser.language);
  const setLanguage     = useUserStore(s => s.setLanguage);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const currentLangLabel = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.native ?? 'English';

  function handleSelectLanguage(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLangPicker(false);
  }

  function handleLogout() {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.root}>
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Text style={styles.headerTitle}>{t('profile.title')}</Text>

      {/* ── User card ────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => navigation.navigate('PersonalName')}
        activeOpacity={0.75}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{activeProfile.name || '—'}</Text>
          <Text style={styles.userEmail}>{currentUser.email || '—'}</Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* ── My Allergy / Dietary / Health Profile section ───────────────── */}
      <Text style={styles.sectionLabel}>
        {hasAllergy && !hasDiet
          ? t('profileUi.allergyProfileTitle')
          : !hasAllergy && hasDiet
            ? t('profileUi.dietaryProfileTitle')
            : t('profileUi.healthProfileTitle')}
      </Text>

      <TouchableOpacity
        style={styles.allergyCard}
        onPress={() => navigation.navigate('PersonalizationAllergy')}
        activeOpacity={0.85}
      >

        {/* ── Case A: 알러지만 ──────────────────────────────────────── */}
        {hasAllergy && !hasDiet && (
          <>
            <View style={styles.allergyRow}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.sensitivity')}</Text>
              <View style={[styles.sensitivityBadge, isStrict ? styles.sensitivityBadgeStrict : styles.sensitivityBadgeNormal]}>
                <Text style={[styles.sensitivityBadgeText, isStrict ? styles.sensitivityBadgeTextStrict : styles.sensitivityBadgeTextNormal]}>
                  {isStrict ? t('profileUi.strictMode') : t('profileUi.normalMode')}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.allergyBlock}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.myAllergy')}</Text>
              <View style={styles.chips}>
                {activeProfile.allergyProfile.map(item => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{getAllergenDisplay(item).name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Case B: 식단만 ───────────────────────────────────────── */}
        {!hasAllergy && hasDiet && (
          <>
            <View style={styles.allergyRow}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.preference')}</Text>
              <View style={styles.preferenceBadge}>
                <Text style={styles.preferenceBadgeText}>{dietLabel}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.allergyBlock}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.dietRestriction')}</Text>
              {avoidedFoods.length === 0 ? (
                <Text style={styles.emptyChip}>—</Text>
              ) : (
                <View style={styles.chips}>
                  {avoidedFoods.map(food => (
                    <View key={food} style={styles.chip}>
                      <Text style={styles.chipText}>{t(`survey.dietCategories.${food === 'Fruits / Grains' ? 'fruitsGrains' : food === 'Red Meat' ? 'redMeat' : food.toLowerCase()}`)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Case C: 둘 다 (Figma 294:5491) ─────────────────────── */}
        {hasAllergy && hasDiet && (
          <>
            {/* Sensitivity row */}
            <View style={styles.allergyRow}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.sensitivity')}</Text>
              <View style={[styles.sensitivityBadge, isStrict ? styles.sensitivityBadgeStrict : styles.sensitivityBadgeNormal]}>
                <Text style={[styles.sensitivityBadgeText, isStrict ? styles.sensitivityBadgeTextStrict : styles.sensitivityBadgeTextNormal]}>
                  {isStrict ? t('profileUi.strictMode') : t('profileUi.normalMode')}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Preference row */}
            <View style={styles.allergyRow}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.preference')}</Text>
              <View style={styles.preferenceBadge}>
                <Text style={styles.preferenceBadgeText}>{dietLabel}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Diet Restriction */}
            <View style={styles.allergyBlock}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.dietRestriction')}</Text>
              {avoidedFoods.length === 0 ? (
                <Text style={styles.emptyChip}>—</Text>
              ) : (
                <View style={styles.chips}>
                  {avoidedFoods.map(food => (
                    <View key={food} style={styles.chip}>
                      <Text style={styles.chipText}>{t(`survey.dietCategories.${food === 'Fruits / Grains' ? 'fruitsGrains' : food === 'Red Meat' ? 'redMeat' : food.toLowerCase()}`)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Case D: 아무것도 없을 때 — Sensitivity + 빈 알러지 블록 노출
              사용자가 카드를 탭하면 Personalization 으로 이동해 추가 가능. */}
        {!hasAllergy && !hasDiet && (
          <>
            <View style={styles.allergyRow}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.sensitivity')}</Text>
              <View style={[styles.sensitivityBadge, isStrict ? styles.sensitivityBadgeStrict : styles.sensitivityBadgeNormal]}>
                <Text style={[styles.sensitivityBadgeText, isStrict ? styles.sensitivityBadgeTextStrict : styles.sensitivityBadgeTextNormal]}>
                  {isStrict ? t('profileUi.strictMode') : t('profileUi.normalMode')}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.allergyBlock}>
              <Text style={styles.allergyRowLabel}>{t('profileUi.myAllergy')}</Text>
              <Text style={styles.emptyChip}>{t('profileUi.noAllergensTap')}</Text>
            </View>
          </>
        )}

      </TouchableOpacity>

      {/* ── Settings section ─────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>{t('profile.settingsSection')}</Text>

      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('MultiProfile')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuLabel}>{t('profileUi.multiProfiles')}</Text>
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setShowLangPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuLabel}>{currentLangLabel}</Text>
          <CaretUpDown />
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuLabel}>{t('profile.menuSettings')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Logout ───────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* ── Language picker bottom sheet ──────────────────────────────────── */}
    <Modal
      visible={showLangPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLangPicker(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowLangPicker(false)}>
        <View style={styles.langBackdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.langSheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.langHandle} />
        <Text style={styles.langSheetTitle}>{t('language.title')}</Text>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {SUPPORTED_LANGUAGES.map((lang, idx) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langRowLeft}>
                    <Text style={styles.langNative}>{lang.native}</Text>
                    <Text style={styles.langLabel}>{lang.label}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.langCheckCircle}>
                      <Text style={styles.langCheckMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {idx < SUPPORTED_LANGUAGES.length - 1 && <View style={styles.langDivider} />}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  // ── Language bottom sheet
  langBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.profileBackdrop,
  },
  langSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '60%',
  },
  langHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  langSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  langRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langNative:  { fontSize: 16, fontWeight: '600', color: DARK_GREEN },
  langLabel:   { fontSize: 13, color: MID_GREEN },
  langCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DARK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCheckMark: { fontSize: 13, color: Colors.white, fontWeight: '700' },
  langDivider:   { height: 1, backgroundColor: BORDER },
  content: {
    paddingHorizontal: 26,
    gap: 12,
  },

  // ── Header
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GREEN,
    textAlign: 'center',
    letterSpacing: -0.38,
    marginBottom: 14,
  },

  // ── User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_FILL,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    height: 94,
    paddingHorizontal: 17,
    gap: 16,
    marginBottom: 4,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: MID_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 32,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.profileText,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: MID_GREEN,
  },
  chevron: {
    fontSize: 22,
    color: DARK_GREEN,
    lineHeight: 28,
  },

  // ── Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK_GREEN,
    marginLeft: 2,
    marginTop: 4,
    marginBottom: 2,
  },

  // ── Allergy card
  allergyCard: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 4,
  },
  allergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  allergyRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GREEN,
  },
  sensitivityBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 16,
  },
  sensitivityBadgeStrict: {
    backgroundColor: STRICT_BG,
    borderColor: STRICT_CLR,
  },
  sensitivityBadgeNormal: {
    backgroundColor: CARD_FILL,
    borderColor: BORDER,
  },
  sensitivityBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sensitivityBadgeTextStrict: {
    color: STRICT_CLR,
  },
  sensitivityBadgeTextNormal: {
    color: MID_GREEN,
  },
  // Preference badge follows the profile card, muted green border, and dark green text tokens.
  preferenceBadge: {
    backgroundColor: CARD_FILL,
    borderWidth: 1,
    borderColor: MID_GREEN,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 20,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK_GREEN,
  },
  allergyBlock: {
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: CARD_FILL,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 12,
    color: CHIP_TEXT,
    lineHeight: 20,
  },
  emptyChip: {
    fontSize: 13,
    color: BORDER,
  },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 9,
  },

  // ── Settings card
  settingsCard: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 51,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.profileText,
  },

  // ── Logout
  logoutBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: STRICT_CLR,
  },
});
