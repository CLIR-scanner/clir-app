import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList, SensitivityLevel } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import { ALLERGY_CATEGORIES, ALLERGY_CANDIDATES } from '../../constants/allergyData';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MyProfileEdit'>;

export default function MyProfileEditScreen() {
  const navigation        = useNavigation<Nav>();
  const { t }             = useTranslation();
  const allergyProfile    = useUserStore(s => s.activeProfile.allergyProfile);
  const sensitivityLevel  = useUserStore(s => s.activeProfile.sensitivityLevel);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const [selectedSensitivity, setSelectedSensitivity] = useState<SensitivityLevel>(sensitivityLevel);
  const [selectedAllergy, setSelectedAllergy]         = useState<Set<string>>(new Set(allergyProfile));
  const [expandedCats, setExpandedCats]               = useState<Set<string>>(new Set());

  // ── 저장 ──────────────────────────────────────────────────────────────────
  const isDirty =
    selectedSensitivity !== sensitivityLevel ||
    !(selectedAllergy.size === allergyProfile.length &&
      allergyProfile.every(i => selectedAllergy.has(i)));

  function handleSave() {
    updateActiveProfile({
      sensitivityLevel: selectedSensitivity,
      allergyProfile: Array.from(selectedAllergy),
    });
    navigation.goBack();
  }

  // ── 알러지 토글 ──────────────────────────────────────────────────────────
  function toggleItem(item: string) {
    setSelectedAllergy(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function toggleAllInCategory(cat: string) {
    const items     = ALLERGY_CANDIDATES[cat] ?? [];
    const allChecked = items.every(i => selectedAllergy.has(i));
    setSelectedAllergy(prev => {
      const next = new Set(prev);
      if (allChecked) items.forEach(i => next.delete(i));
      else            items.forEach(i => next.add(i));
      return next;
    });
  }

  // ── 민감도 옵션 ──────────────────────────────────────────────────────────
  const SENSITIVITY_OPTIONS: {
    value: SensitivityLevel;
    label: string;
    desc: string;
    badge: string;
    badgeColor: string;
    badgeBg: string;
  }[] = [
    {
      value:      'strict',
      label:      t('sensitivity.strictLabel'),
      desc:       t('sensitivity.strictDesc'),
      badge:      t('sensitivity.strictBadge'),
      badgeColor: Colors.danger,
      badgeBg:    Colors.dangerLight,
    },
    {
      value:      'normal',
      label:      t('sensitivity.normalLabel'),
      desc:       t('sensitivity.normalDesc'),
      badge:      t('sensitivity.normalBadge'),
      badgeColor: Colors.safe,
      badgeBg:    Colors.safeLight,
    },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.backBtn}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 민감도 섹션 ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('sensitivity.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('sensitivity.subtitle')}</Text>

        <View style={styles.sensitivityOptions}>
          {SENSITIVITY_OPTIONS.map(opt => {
            const isSelected = selectedSensitivity === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sensitivityCard, isSelected && styles.sensitivityCardSelected]}
                onPress={() => setSelectedSensitivity(opt.value)}
                activeOpacity={0.8}
              >
                <View style={styles.sensitivityTop}>
                  <Text style={styles.sensitivityLabel}>{opt.label}</Text>
                  <View style={[styles.badge, { backgroundColor: opt.badgeBg }]}>
                    <Text style={[styles.badgeText, { color: opt.badgeColor }]}>{opt.badge}</Text>
                  </View>
                </View>
                <Text style={styles.sensitivityDesc}>{opt.desc}</Text>
                <View style={styles.radioRow}>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                    {isSelected ? t('common.currentlyActive') : t('common.tapToSelect')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 구분선 ──────────────────────────────────────────────────── */}
        <View style={styles.sectionDivider} />

        {/* ── 알러지 프로필 섹션 ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>{t('profile.allergyProfile')}</Text>
        <Text style={styles.sectionSubtitle}>{t('dietary.subtitle')}</Text>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {t('common.selected', { count: selectedAllergy.size })}
          </Text>
          {selectedAllergy.size > 0 && (
            <TouchableOpacity onPress={() => setSelectedAllergy(new Set())}>
              <Text style={styles.clearText}>{t('common.clearAll')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.allergyList}>
          {ALLERGY_CATEGORIES.map(cat => {
            const items        = ALLERGY_CANDIDATES[cat] ?? [];
            const checkedCount = items.filter(i => selectedAllergy.has(i)).length;
            const isExpanded   = expandedCats.has(cat);
            const allChecked   = checkedCount === items.length;

            return (
              <View key={cat} style={styles.categoryBlock}>
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.8}
                >
                  <TouchableOpacity
                    style={[styles.checkbox, allChecked && checkedCount > 0 && styles.checkboxChecked]}
                    onPress={() => toggleAllInCategory(cat)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {checkedCount > 0 && !allChecked && (
                      <View style={styles.checkboxPartial} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.categoryLabelWrap}>
                    <Text style={styles.categoryLabel}>{cat}</Text>
                    {checkedCount > 0 && (
                      <Text style={styles.categoryCount}>{checkedCount}/{items.length}</Text>
                    )}
                  </View>
                  <Text style={[styles.chevron, isExpanded && styles.chevronOpen]}>{'›'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.itemList}>
                    {items.map(item => {
                      const checked = selectedAllergy.has(item);
                      return (
                        <TouchableOpacity
                          key={item}
                          style={styles.itemRow}
                          onPress={() => toggleItem(item)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                          <Text style={styles.itemText}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, !isDirty && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isDirty}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>{t('common.save')}</Text>
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

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn:     { fontSize: 22, color: Colors.black, width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.black },

  scroll: { flex: 1 },

  // 섹션 타이틀
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 28,
  },

  // 민감도 옵션
  sensitivityOptions: { gap: 12 },
  sensitivityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    gap: 10,
  },
  sensitivityCardSelected: { borderColor: Colors.black },
  sensitivityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sensitivityLabel: { fontSize: 16, fontWeight: '700', color: Colors.black },
  sensitivityDesc:  { fontSize: 13, color: Colors.gray500, lineHeight: 20 },
  badge:     { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  radioRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Colors.black },
  radioInner:         { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.black },
  radioLabel:         { fontSize: 12, color: Colors.gray300 },
  radioLabelSelected: { color: Colors.black, fontWeight: '600' },

  // 알러지 카운트 행
  countRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countText: { fontSize: 13, color: Colors.gray500, fontWeight: '600' },
  clearText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },

  // 알러지 카테고리
  allergyList:    { gap: 8 },
  categoryBlock: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, gap: 12,
  },
  categoryLabelWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryLabel:     { fontSize: 15, fontWeight: '600', color: Colors.black },
  categoryCount:     { fontSize: 12, color: Colors.gray500 },
  chevron:     { fontSize: 20, color: Colors.gray300, lineHeight: 22 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  itemList: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 8, gap: 2,
  },
  itemRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  itemText: { fontSize: 14, color: Colors.black },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.black, borderColor: Colors.black },
  checkboxPartial: { width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.gray300 },

  // 저장 버튼
  saveButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontWeight: '700', color: Colors.black },
});
