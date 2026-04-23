import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { fetchAllergenCatalog, AllergenCatalog } from '../../services/allergen.service';
import { useUserStore } from '../../store/user.store';

export default function PersonalizationAllergyScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const allergyProfile      = useUserStore(s => s.activeProfile.allergyProfile);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const [catalog, setCatalog] = useState<AllergenCatalog | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(allergyProfile));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllergenCatalog('en').then(setCatalog).catch(() => {});
  }, []);

  function toggleItem(item: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function itemsOfCategory(cat: string): string[] {
    const c = catalog?.categories.find(x => x.code === cat);
    return c ? c.items.map(i => i.name) : [];
  }

  function toggleAllInCategory(cat: string) {
    const items = itemsOfCategory(cat);
    const allChecked = items.length > 0 && items.every(i => selected.has(i));
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) {
        items.forEach(i => next.delete(i));
      } else {
        items.forEach(i => next.add(i));
      }
      return next;
    });
  }

  function handleSave() {
    updateActiveProfile({ allergyProfile: Array.from(selected) });
    navigation.goBack();
  }

  const isDirty = !(
    selected.size === allergyProfile.length &&
    allergyProfile.every(i => selected.has(i))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dietary.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <Text style={styles.subtitle}>{t('dietary.subtitle')}</Text>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{t('common.selected', { count: selected.size })}</Text>
        {selected.size > 0 && (
          <TouchableOpacity onPress={() => setSelected(new Set())}>
            <Text style={styles.clearText}>{t('common.clearAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {!catalog && (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.black} />
            </View>
          )}
          {catalog?.categories.map(cat => {
            const items = cat.items.map(i => i.name);
            const checkedCount = items.filter(i => selected.has(i)).length;
            const isExpanded = expanded.has(cat.code);
            const allChecked = items.length > 0 && checkedCount === items.length;

            return (
              <View key={cat.code} style={styles.categoryBlock}>
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => toggleCategory(cat.code)}
                  activeOpacity={0.8}
                >
                  <TouchableOpacity
                    style={[styles.checkbox, allChecked && checkedCount > 0 && styles.checkboxChecked]}
                    onPress={() => toggleAllInCategory(cat.code)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {checkedCount > 0 && !allChecked && (
                      <View style={styles.checkboxPartial} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.categoryLabelWrap}>
                    <Text style={styles.categoryLabel}>{cat.name}</Text>
                    {checkedCount > 0 && (
                      <Text style={styles.categoryCount}>{checkedCount}/{items.length}</Text>
                    )}
                  </View>

                  <Text style={[styles.chevron, isExpanded && styles.chevronOpen]}>{'›'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.itemList}>
                    {items.map(item => {
                      const checked = selected.has(item);
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
        <View style={{ height: 16 }} />
      </ScrollView>

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
    flex: 1, backgroundColor: Colors.background,
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 22, color: Colors.black, width: 32 },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.black,
  },
  headerRight: { width: 32 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 16 },
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  countText: { fontSize: 13, color: Colors.gray500, fontWeight: '600' },
  clearText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },
  scroll: { flex: 1 },
  list: { gap: 8 },
  categoryBlock: {
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, gap: 12,
  },
  categoryLabelWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: Colors.black },
  categoryCount: { fontSize: 12, color: Colors.gray500 },
  chevron: { fontSize: 20, color: Colors.gray300, lineHeight: 22 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  itemList: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 8, gap: 2,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  itemText: { fontSize: 14, color: Colors.black, fontWeight: '400' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: Colors.gray300, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.black, borderColor: Colors.black },
  checkboxPartial: { width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.gray300 },
  saveButton: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 16,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontWeight: '700', color: Colors.black },
});
