import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { SensitivityLevel } from '../../types';
import { useUserStore } from '../../store/user.store';

export default function PersonalizationSensitivityScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const sensitivityLevel    = useUserStore(s => s.activeProfile.sensitivityLevel);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const [selected, setSelected] = useState<SensitivityLevel>(sensitivityLevel);
  const isDirty = selected !== sensitivityLevel;

  const OPTIONS: {
    value: SensitivityLevel;
    label: string;
    description: string;
    badge: string;
    badgeColor: string;
    badgeBg: string;
  }[] = [
    {
      value: 'strict',
      label:       t('sensitivity.strictLabel'),
      description: t('sensitivity.strictDesc'),
      badge:       t('sensitivity.strictBadge'),
      badgeColor:  Colors.danger,
      badgeBg:     Colors.dangerLight,
    },
    {
      value: 'normal',
      label:       t('sensitivity.normalLabel'),
      description: t('sensitivity.normalDesc'),
      badge:       t('sensitivity.normalBadge'),
      badgeColor:  Colors.safe,
      badgeBg:     Colors.safeLight,
    },
  ];

  function handleSave() {
    updateActiveProfile({ sensitivityLevel: selected });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('sensitivity.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <Text style={styles.subtitle}>{t('sensitivity.subtitle')}</Text>

      <View style={styles.options}>
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setSelected(opt.value)}
              activeOpacity={0.8}
            >
              <View style={styles.optionTop}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <View style={[styles.badge, { backgroundColor: opt.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: opt.badgeColor }]}>{opt.badge}</Text>
                </View>
              </View>
              <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                {opt.description}
              </Text>
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

      <TouchableOpacity
        style={[styles.saveButton, !isDirty && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isDirty}
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
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: { fontSize: 22, color: Colors.black, width: 32 },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.black,
  },
  headerRight: { width: 32 },
  subtitle: {
    fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 32,
  },
  options: { gap: 14 },
  option: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, padding: 20, gap: 10,
  },
  optionSelected: { borderColor: Colors.black },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionLabel: { fontSize: 16, fontWeight: '700', color: Colors.black },
  optionLabelSelected: { color: Colors.black },
  badge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  optionDesc: { fontSize: 13, color: Colors.gray500, lineHeight: 20 },
  optionDescSelected: { color: Colors.gray700 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  radioOuter: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Colors.black },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.black },
  radioLabel: { fontSize: 12, color: Colors.gray300 },
  radioLabelSelected: { color: Colors.black, fontWeight: '600' },
  saveButton: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 32,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontWeight: '700', color: Colors.black },
});
