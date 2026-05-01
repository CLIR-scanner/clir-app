import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Rect } from 'react-native-svg';
import { SensitivityLevel } from '../../types';
import { fetchAllergenCatalog, AllergenCatalog } from '../../services/allergen.service';
import {
  fetchDietCatalog,
  getCachedDietCatalogOrBootstrap,
  type DietCatalog,
} from '../../services/diet.service';
import { useUserStore } from '../../store/user.store';
import { getCatalogLanguage } from '../../constants/languages';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';
const STRICT_CLR = '#FF3434';
const STRICT_BG  = '#FFECEC';

// ── Vegetarian types ──────────────────────────────────────────────────────────
function buildVegeOptions(
  dietCatalog: DietCatalog,
  veganLabels: { strict: string; flexible: string },
): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  for (const t of dietCatalog.types) {
    if (t.code === 'vegan') {
      result.push({ key: 'strict',   label: veganLabels.strict });
      result.push({ key: 'flexible', label: veganLabels.flexible });
    } else {
      result.push({ key: t.code, label: t.name });
    }
  }
  return result;
}

function getDietKey(dietaryRestrictions: string[]): string {
  if (dietaryRestrictions.includes('strict'))   return 'strict';
  if (dietaryRestrictions.includes('flexible')) return 'flexible';
  return dietaryRestrictions[0] ?? '';
}

function isVeganModifier(key: string): boolean {
  return key === 'strict' || key === 'flexible';
}

function getAvoidedCategories(dietKey: string, dietCatalog: DietCatalog): string[] {
  const typeCode = isVeganModifier(dietKey) ? 'vegan' : dietKey;
  const t = dietCatalog.types.find(x => x.code === typeCode);
  if (!t) return [];
  return [...new Set([...t.avoidedCategories, ...t.cautionCategories])];
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function RadioFilled({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      <Path d="M9.5 0.5C4.53 0.5 0.5 4.53 0.5 9.5S4.53 18.5 9.5 18.5 18.5 14.47 18.5 9.5 14.47 0.5 9.5 0.5Z"
        stroke={DARK_GREEN} strokeWidth={1.5} fill="none" />
      <Path d="M9.5 4.5C6.74 4.5 4.5 6.74 4.5 9.5S6.74 14.5 9.5 14.5 14.5 12.26 14.5 9.5 12.26 4.5 9.5 4.5Z"
        fill={DARK_GREEN} />
    </Svg>
  );
}

function RadioEmpty({ size = 19, color = BORDER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      <Path d="M9.5 0.5C4.53 0.5 0.5 4.53 0.5 9.5S4.53 18.5 9.5 18.5 18.5 14.47 18.5 9.5 14.47 0.5 9.5 0.5Z"
        stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function CheckboxFilled({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Rect x={0.5} y={0.5} width={20} height={20} rx={4.5} fill={DARK_GREEN} stroke={DARK_GREEN} />
      <Path d="M5 10.5L9 14.5L16 7" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckboxEmpty({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Rect x={0.5} y={0.5} width={20} height={20} rx={4.5} stroke={MID_GREEN} />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
      <Path d="M1 1L6 6L1 11" stroke={BORDER} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PersonalizationAllergyScreen() {
  const navigation    = useNavigation();
  const insets        = useSafeAreaInsets();
  const { t }         = useTranslation();
  const activeProfile = useUserStore(s => s.activeProfile);
  const syncProfile   = useUserStore(s => s.syncActiveProfile);
  const updateActive  = useUserStore(s => s.updateActiveProfile);
  const currentLanguage = useUserStore(s => s.currentUser.language);
  const catalogLanguage = getCatalogLanguage(currentLanguage);

  // 저장된 프로필 기준 레이아웃 분기
  const isVegetarianOnly =
    activeProfile.allergyProfile.length === 0 &&
    activeProfile.dietaryRestrictions.length > 0;
  const isAllergyOnly =
    activeProfile.allergyProfile.length > 0 &&
    activeProfile.dietaryRestrictions.length === 0;

  // ── Sensitivity ────────────────────────────────────────────────────────────
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(
    activeProfile.sensitivityLevel,
  );

  // ── Vegetarian type ────────────────────────────────────────────────────────
  const [dietKey, setDietKey] = useState(() =>
    getDietKey(activeProfile.dietaryRestrictions),
  );

  // ── Allergen accordion ─────────────────────────────────────────────────────
  const [catalog,     setCatalog]     = useState<AllergenCatalog | null>(null);
  const [dietCatalog, setDietCatalog] = useState<DietCatalog>(() => getCachedDietCatalogOrBootstrap());
  const [selected,    setSelected]    = useState<Set<string>>(new Set(activeProfile.allergyProfile));
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());
  const [saving,      setSaving]      = useState(false);

  // Layout A 전용: 알러지 섹션 펼침 여부
  const [showAllergySection, setShowAllergySection] = useState(false);
  // Layout C 전용: 식단 섹션 펼침 여부
  const [showDietSection, setShowDietSection] = useState(false);

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage).then(setCatalog).catch(() => {});
    fetchDietCatalog(catalogLanguage).then(setDietCatalog).catch(() => {});
  }, [catalogLanguage]);

  useEffect(() => {
    if (!catalog) return;
    const validNames = new Set<string>();
    const idToNames = new Map<string, string[]>();
    for (const cat of catalog.categories) {
      for (const item of cat.items) {
        validNames.add(item.name);
        if (item.allergenId) {
          const arr = idToNames.get(item.allergenId) ?? [];
          arr.push(item.name);
          idToNames.set(item.allergenId, arr);
        }
      }
    }
    setSelected(prev => {
      const next = new Set<string>();
      for (const v of prev) {
        if (validNames.has(v)) next.add(v);
        else if (idToNames.has(v)) idToNames.get(v)!.forEach(n => next.add(n));
      }
      if (next.size === prev.size && [...prev].every(v => next.has(v))) return prev;
      return next;
    });
  }, [catalog]);

  function isItemChecked(item: { name: string; allergenId?: string }): boolean {
    if (selected.has(item.name)) return true;
    return !!(item.allergenId && selected.has(item.allergenId));
  }

  function toggleItem(item: { name: string; allergenId?: string }) {
    const checked = isItemChecked(item);
    setSelected(prev => {
      const next = new Set(prev);
      if (item.allergenId) next.delete(item.allergenId);
      next.delete(item.name);
      if (!checked) next.add(item.name);
      return next;
    });
  }

  function toggleCategory(code: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function toggleAllInCategory(code: string) {
    const cat = catalog?.categories.find(c => c.code === code);
    if (!cat) return;
    const allChecked = cat.items.length > 0 && cat.items.every(i => isItemChecked(i));
    setSelected(prev => {
      const next = new Set(prev);
      cat.items.forEach(i => {
        next.delete(i.name);
        if (i.allergenId) next.delete(i.allergenId);
      });
      if (!allChecked) cat.items.forEach(i => next.add(i.name));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      let newDiet: string[] = [];
      if (dietKey) {
        if (dietKey === 'strict' || dietKey === 'flexible') {
          newDiet = ['vegan', dietKey];
        } else {
          newDiet = [dietKey];
        }
      }
      const newAllergy = Array.from(selected);
      await syncProfile({
        allergyProfile: newAllergy,
        dietaryRestrictions: newDiet,
        sensitivityLevel: sensitivity,
      });
      updateActive({
        allergyProfile: newAllergy,
        dietaryRestrictions: newDiet,
        sensitivityLevel: sensitivity,
      });
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('profileUi.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const vegeOptions = buildVegeOptions(dietCatalog, {
    strict: t('survey.strictVegan'),
    flexible: t('survey.flexibleVegan'),
  });
  const avoidedCategoryCodes = getAvoidedCategories(dietKey, dietCatalog);
  const allCategoryCodes = dietCatalog.categories.map(c => c.code);
  const orderedDietCategoryCodes = [
    ...allCategoryCodes.filter(code => avoidedCategoryCodes.includes(code)),
    ...allCategoryCodes.filter(code => !avoidedCategoryCodes.includes(code)),
  ];

  // ── 공통: 알러지 카테고리 아코디언 ────────────────────────────────────────
  function renderAllergenAccordion() {
    if (!catalog) {
      return <ActivityIndicator color={DARK_GREEN} style={{ marginVertical: 16 }} />;
    }
    return (
      <>
        {catalog.categories.map(cat => {
          const checked    = cat.items.filter(isItemChecked).length;
          const totalItems = cat.items.length;
          const allChecked = totalItems > 0 && checked === totalItems;
          const isExpanded = expanded.has(cat.code);

          return (
            <View key={cat.code} style={[styles.accordionItem, checked > 0 && styles.accordionItemChecked]}>
              <TouchableOpacity
                style={styles.accordionRow}
                onPress={() => toggleCategory(cat.code)}
                activeOpacity={0.8}
              >
                <TouchableOpacity
                  onPress={() => toggleAllInCategory(cat.code)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {allChecked && checked > 0
                    ? <CheckboxFilled />
                    : checked > 0
                    ? <CheckboxFilled />
                    : <CheckboxEmpty />
                  }
                </TouchableOpacity>
                <Text style={[styles.accordionLabel, checked > 0 && styles.accordionLabelChecked]}>
                  {cat.name}
                </Text>
                <Text style={styles.accordionCount}>
                  {checked > 0 ? `${checked}/${totalItems}` : ''}
                </Text>
                <ChevronRight />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.accordionChildren}>
                  {cat.items.map(item => {
                    const isChecked = isItemChecked(item);
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={styles.childRow}
                        onPress={() => toggleItem(item)}
                        activeOpacity={0.7}
                      >
                        {isChecked ? <CheckboxFilled size={18} /> : <CheckboxEmpty size={18} />}
                        <Text style={styles.childLabel}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </>
    );
  }

  // ── 공통: 채식 라디오 리스트 ───────────────────────────────────────────────
  function renderVegeRadioList() {
    return (
      <View style={styles.radioList}>
        <TouchableOpacity
          style={styles.radioRow}
          onPress={() => setDietKey('')}
          activeOpacity={0.7}
        >
          {dietKey === '' ? <RadioFilled /> : <RadioEmpty color={BORDER} />}
          <Text style={[styles.radioLabel, dietKey === '' && styles.radioLabelActive]}>
            {t('profile.noAllergens')}
          </Text>
        </TouchableOpacity>
        {vegeOptions.map(opt => {
          const active = dietKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.radioRow}
              onPress={() => setDietKey(opt.key)}
              activeOpacity={0.7}
            >
              {active ? <RadioFilled /> : <RadioEmpty color={BORDER} />}
              <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── 공통: 민감도 카드 2개 ─────────────────────────────────────────────────
  function renderSensitivityCards() {
    return (
      <>
        <TouchableOpacity
          style={[styles.sensitivityCard, sensitivity === 'strict' && styles.sensitivityCardActive]}
          onPress={() => setSensitivity('strict')}
          activeOpacity={0.85}
        >
          <View style={styles.sensitivityCardTop}>
            <Text style={styles.sensitivityCardTitle}>{t('profileUi.strictMode')}</Text>
            <View style={styles.strictBadge}>
              <Text style={styles.strictBadgeText}>{t('profileUi.strict')}</Text>
            </View>
          </View>
          <Text style={styles.sensitivityCardDesc}>{t('sensitivity.strictDesc')}</Text>
          {sensitivity === 'strict' && (
            <View style={styles.activeRow}>
              <RadioFilled size={19} />
              <Text style={styles.activeText}>{t('common.currentlyActive')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sensitivityCard, sensitivity === 'normal' && styles.sensitivityCardActive]}
          onPress={() => setSensitivity('normal')}
          activeOpacity={0.85}
        >
          <View style={styles.sensitivityCardTop}>
            <Text style={styles.sensitivityCardTitle}>{t('profileUi.normalMode')}</Text>
            <View style={styles.normalBadge}>
              <Text style={styles.normalBadgeText}>{t('profileUi.normal')}</Text>
            </View>
          </View>
          <Text style={styles.sensitivityCardDesc}>{t('sensitivity.normalDesc')}</Text>
          {sensitivity === 'normal' && (
            <View style={styles.activeRow}>
              <RadioFilled size={19} />
              <Text style={styles.activeText}>{t('common.currentlyActive')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </>
    );
  }

  // ── 공통: 식단 카테고리 행 목록 ───────────────────────────────────────────
  function renderDietCategories() {
    return (
      <>
        {orderedDietCategoryCodes.map(code => {
          const isActive = avoidedCategoryCodes.includes(code);
          const label = dietCatalog.categories.find(c => c.code === code)?.name ?? code;
          return (
            <View
              key={code}
              style={[styles.dietRow, isActive ? styles.dietRowActive : styles.dietRowInactive]}
            >
              <View style={styles.dietLeft}>
                {isActive
                  ? <RadioFilled size={21} />
                  : <RadioEmpty size={21} color={BORDER} />
                }
                <Text style={[styles.dietLabel, isActive && styles.dietLabelActive]}>
                  {label}
                </Text>
              </View>
            </View>
          );
        })}
      </>
    );
  }

  const headerTitle = activeProfile.allergyProfile.length > 0 && activeProfile.dietaryRestrictions.length === 0
    ? t('profileUi.allergyProfileTitle')
    : activeProfile.allergyProfile.length === 0 && activeProfile.dietaryRestrictions.length > 0
      ? t('profileUi.dietaryProfileTitle')
      : t('profileUi.healthProfileTitle');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            style={[styles.headerSaveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving
              ? <ActivityIndicator size="small" color={DARK_GREEN} />
              : <Text style={styles.headerSaveBtnText}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isVegetarianOnly ? (
          // ── Layout A: 채식만 설정 — 채식 옵션 우선, 알러지는 하단 버튼으로 접근 ──
          <>
            {/* Section 1: Vegetarian Option */}
            <SectionHeader
              title={t('profileUi.vegetarianOption')}
              subtitle={t('profileUi.vegetarianOptionSubtitle')}
            />
            {renderVegeRadioList()}

            {dietKey !== '' && (
              <>
                <View style={styles.divider} />
                <SectionHeader
                  title={t('profileUi.ingredientsRestrictionProfile')}
                  subtitle={t('dietary.subtitle')}
                />
                <Text style={styles.subLabel}>{t('profileUi.vegetarianDiet')}</Text>
                {renderDietCategories()}
              </>
            )}

            <View style={styles.divider} />

            {/* Add Allergy toggle button */}
            <TouchableOpacity
              style={styles.addAllergyBtn}
              onPress={() => setShowAllergySection(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.addAllergyBtnText}>
                {showAllergySection
                  ? t('profileUi.hideAllergySection')
                  : `+ ${t('profileUi.addAllergy')}`}
              </Text>
            </TouchableOpacity>

            {/* 알러지 섹션 (펼쳤을 때) */}
            {showAllergySection && (
              <>
                <SectionHeader
                  title={t('profileUi.allergySensitivitySettings')}
                  subtitle={t('sensitivity.subtitle')}
                />
                {renderSensitivityCards()}

                <View style={styles.divider} />

                <SectionHeader
                  title={t('profileUi.ingredientsRestrictionProfile')}
                  subtitle={t('dietary.subtitle')}
                />
                <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>
                {renderAllergenAccordion()}
              </>
            )}
          </>
        ) : isAllergyOnly ? (
          // ── Layout C: 알러지만 설정 — 알러지 우선, 식단은 하단 버튼으로 접근 ──
          <>
            {/* Section 1: Allergy Sensitivity */}
            <SectionHeader
              title={t('profileUi.allergySensitivitySettings')}
              subtitle={t('sensitivity.subtitle')}
            />
            {renderSensitivityCards()}

            <View style={styles.divider} />

            {/* Section 2: Allergens */}
            <SectionHeader
              title={t('profileUi.ingredientsRestrictionProfile')}
              subtitle={t('dietary.subtitle')}
            />
            <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>
            {renderAllergenAccordion()}

            <View style={styles.divider} />

            {/* Add Diet toggle button */}
            <TouchableOpacity
              style={styles.addAllergyBtn}
              onPress={() => setShowDietSection(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.addAllergyBtnText}>
                {showDietSection
                  ? t('profileUi.hideDietSection')
                  : `+ ${t('profileUi.addDiet')}`}
              </Text>
            </TouchableOpacity>

            {/* 식단 섹션 (펼쳤을 때) */}
            {showDietSection && (
              <>
                <SectionHeader
                  title={t('profileUi.vegetarianOption')}
                  subtitle={t('profileUi.vegetarianOptionSubtitle')}
                />
                {renderVegeRadioList()}

                {dietKey !== '' && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.subLabel}>{t('profileUi.vegetarianDiet')}</Text>
                    {renderDietCategories()}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          // ── Layout B: 둘 다 있거나 아무것도 없음 — 기존 순서 유지 ──
          <>
            {/* Section 1: Allergy Sensitivity */}
            <SectionHeader
              title={t('profileUi.allergySensitivitySettings')}
              subtitle={t('sensitivity.subtitle')}
            />
            {renderSensitivityCards()}

            <View style={styles.divider} />

            {/* Section 2: Vegetarian Option */}
            <SectionHeader
              title={t('profileUi.vegetarianOption')}
              subtitle={t('profileUi.vegetarianOptionSubtitle')}
            />
            {renderVegeRadioList()}

            <View style={styles.divider} />

            {/* Section 3: Ingredients Restriction Profile */}
            <SectionHeader
              title={t('profileUi.ingredientsRestrictionProfile')}
              subtitle={t('dietary.subtitle')}
            />
            <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>
            {renderAllergenAccordion()}

            {dietKey !== '' && (
              <>
                <Text style={[styles.subLabel, { marginTop: 12 }]}>{t('profileUi.vegetarianDiet')}</Text>
                {renderDietCategories()}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 26, gap: 10, paddingTop: 8 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  headerSide:  { flex: 1 },
  backBtn:     { fontSize: 32, lineHeight: 34, color: DARK_GREEN, fontWeight: '300' },
  headerTitle: { fontSize: 16, fontWeight: '500', color: DARK_GREEN, letterSpacing: -0.3, textAlign: 'center' },

  // ── Section header
  sectionHeader:   { gap: 4, marginTop: 12 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: DARK_GREEN },
  sectionSubtitle: { fontSize: 12, color: DARK_GREEN, lineHeight: 18 },

  // ── Sensitivity cards
  sensitivityCard: {
    borderWidth: 1,
    borderColor: MID_GREEN,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  sensitivityCardActive: {
    backgroundColor: CARD_FILL,
    borderWidth: 2,
    borderColor: DARK_GREEN,
  },
  sensitivityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensitivityCardTitle: { fontSize: 16, fontWeight: '700', color: DARK_GREEN },
  sensitivityCardDesc:  { fontSize: 12, color: MID_GREEN, lineHeight: 18 },
  strictBadge: {
    backgroundColor: STRICT_BG,
    borderWidth: 1,
    borderColor: STRICT_CLR,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 3,
  },
  strictBadgeText: { fontSize: 13, fontWeight: '500', color: STRICT_CLR },
  normalBadge: {
    backgroundColor: MID_GREEN,
    borderWidth: 1,
    borderColor: MID_GREEN,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 3,
  },
  normalBadgeText: { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  activeText: { fontSize: 11, fontWeight: '800', color: MID_GREEN },

  // ── Divider
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 8, marginHorizontal: 6 },

  // ── Vegetarian radio list
  radioList: { gap: 14 },
  radioRow:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
  radioLabel: { fontSize: 16, color: MID_GREEN, fontWeight: '400' },
  radioLabelActive: { fontWeight: '700', color: DARK_GREEN },

  // ── Sub label
  subLabel: { fontSize: 12, fontWeight: '700', color: MID_GREEN, marginTop: 4 },

  // ── Accordion (allergen)
  accordionItem: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    overflow: 'hidden',
  },
  accordionItemChecked: { backgroundColor: CARD_FILL },
  accordionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 57,
    gap: 10,
  },
  accordionLabel:        { flex: 1, fontSize: 15, fontWeight: '500', color: MID_GREEN },
  accordionLabelChecked: { fontWeight: '700', color: DARK_GREEN },
  accordionCount:        { fontSize: 15, fontWeight: '500', color: BORDER, minWidth: 32, textAlign: 'right' },
  accordionChildren: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 2,
  },
  childRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  childLabel: { fontSize: 14, color: DARK_GREEN },

  // ── Diet restriction rows
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 57,
    overflow: 'hidden',
  },
  dietRowActive:   { backgroundColor: CARD_FILL },
  dietRowInactive: { backgroundColor: BG },
  dietLeft:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dietLabel:       { fontSize: 15, fontWeight: '500', color: MID_GREEN },
  dietLabelActive: { fontWeight: '700', color: DARK_GREEN },

  // ── Add Allergy button (Layout A 전용)
  addAllergyBtn: {
    borderWidth: 1.5,
    borderColor: DARK_GREEN,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: BG,
  },
  addAllergyBtnText: { fontSize: 14, fontWeight: '700', color: DARK_GREEN },

  // ── Header Save button
  headerSaveBtn: {
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  headerSaveBtnText: { fontSize: 13, fontWeight: '600', color: DARK_GREEN },
});
