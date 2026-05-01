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
// strict/flexible 은 'vegan' modifier — DietCatalog 의 veganStrictness 와 동기.
// 화면에선 단일 라디오로 표현하기 위해 분리된 항목으로 보여준다.
function buildVegeOptions(
  dietCatalog: DietCatalog,
  veganLabels: { strict: string; flexible: string },
): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  for (const t of dietCatalog.types) {
    if (t.code === 'vegan') {
      // vegan 타입은 strictness 분기로 표현
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

/** dietKey 가 vegan modifier 인지 여부. */
function isVeganModifier(key: string): boolean {
  return key === 'strict' || key === 'flexible';
}

/** dietKey → BE products.category 회피 코드 목록 (BE catalog 기반). */
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

function CheckboxPartial({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Rect x={0.5} y={0.5} width={20} height={20} rx={4.5} stroke={MID_GREEN} />
      <Rect x={5} y={9.5} width={11} height={2} rx={1} fill={MID_GREEN} />
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

// ── Section header ─────────────────────────────────────────────────────────────
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

  // 의도적으로 hasAllergy/hasDiet 게이트를 제거 — 사용자가 처음에 알러지/식이를
  // 안 골랐어도 이 화면에서 *추가* 할 수 있어야 한다. 모든 섹션 항상 노출.
  // 저장 시 selected/dietKey 상태를 직접 그대로 반영.

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

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage).then(setCatalog).catch(() => {});
    fetchDietCatalog(catalogLanguage).then(setDietCatalog).catch(() => {});
  }, [catalogLanguage]);

  // 카탈로그 로드 후 selected 정화 — per-item 표시명을 보존한다.
  // - catalog 항목명('Milk'/'Whey') → 그대로 (사용자가 선택한 단위 유지)
  // - ing-* ID(legacy / 과거 PR 흔적) → 같은 allergenId 의 모든 항목명으로 *expand*.
  //   ing-* 는 항목 단위 정보를 잃은 표현이므로 'all-or-nothing' 으로 펼쳐 사용자가
  //   개별 토글로 정밀 조정할 수 있게 한다. 다음 Save 시 표시명만 DB 에 남아 정화.
  // - 그 외(garbage 'Meat'/'Moollusks / Shellfish') → drop.
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
        // 그 외 garbage drop
      }
      if (next.size === prev.size && [...prev].every(v => next.has(v))) return prev;
      return next;
    });
  }, [catalog]);

  // selected 는 catalog 항목명(raw 표시명) 단위로 보유. ing-* legacy 호환은
  // canonicalize useEffect 가 catalog 로드 시점에 expand 로 처리.
  function isItemChecked(item: { name: string; allergenId?: string }): boolean {
    if (selected.has(item.name)) return true;
    // ing-* legacy 잔존(canonicalize 직전 첫 렌더) 방어
    return !!(item.allergenId && selected.has(item.allergenId));
  }

  function toggleItem(item: { name: string; allergenId?: string }) {
    const checked = isItemChecked(item);
    setSelected(prev => {
      const next = new Set(prev);
      // legacy ing-* 표현이 남아 있다면 정리
      if (item.allergenId) next.delete(item.allergenId);
      next.delete(item.name);
      if (!checked) {
        // per-item 단위 보존을 위해 표시명을 저장 (ing-* 가 아니라 'Milk' 등)
        next.add(item.name);
      }
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
      if (!allChecked) {
        // per-item 단위 보존 — 항목 표시명만 추가
        cat.items.forEach(i => next.add(i.name));
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 식단 restrictions 재구성 — dietKey 가 비어있으면 빈 배열(no diet).
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
        <Text style={styles.headerTitle}>{t('profileUi.allergyProfileTitle')}</Text>
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

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — Allergy Sensitivity (항상 노출 — 사용자가 알러지 0 인
            상태에서도 sensitivity 를 미리 설정해 둘 수 있어야 한다)
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title={t('profileUi.allergySensitivitySettings')}
          subtitle={t('sensitivity.subtitle')}
        />

        {/* Strict Mode card */}
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
          <Text style={styles.sensitivityCardDesc}>
            {t('sensitivity.strictDesc')}
          </Text>
          {sensitivity === 'strict' && (
            <View style={styles.activeRow}>
              <RadioFilled size={19} />
              <Text style={styles.activeText}>{t('common.currentlyActive')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Normal Mode card */}
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
          <Text style={styles.sensitivityCardDesc}>
            {t('sensitivity.normalDesc')}
          </Text>
          {sensitivity === 'normal' && (
            <View style={styles.activeRow}>
              <RadioFilled size={19} />
              <Text style={styles.activeText}>{t('common.currentlyActive')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — Vegetarian Option (항상 노출 — 식이 미설정 사용자도
            여기서 처음 추가 가능. 'None' 옵션으로 식이 해제도 허용)
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title={t('profileUi.vegetarianOption')}
          subtitle={t('profileUi.vegetarianOptionSubtitle')}
        />

        <View style={styles.radioList}>
          {/* None 옵션 — 식이 미설정 상태로 돌릴 수 있게 */}
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

        <View style={styles.divider} />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — Ingredients Restriction Profile
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title={t('profileUi.ingredientsRestrictionProfile')}
          subtitle={t('dietary.subtitle')}
        />

        {/* ── Allergens subsection (항상 노출) ──────────────────────────── */}
        <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>

        {!catalog ? (
          <ActivityIndicator color={DARK_GREEN} style={{ marginVertical: 16 }} />
        ) : (
          catalog.categories.map(cat => {
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
          })
        )}

        {/* ── Vegetarian Diet subsection (식이 선택했을 때만 — 'None' 이면 의미 없음) ── */}
        {dietKey !== '' && (
          <>
            <Text style={[styles.subLabel, { marginTop: 12 }]}>{t('profileUi.vegetarianDiet')}</Text>

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
  sectionHeader: { gap: 4, marginTop: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: DARK_GREEN },
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
  accordionItemChecked: {
    backgroundColor: CARD_FILL,
  },
  accordionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 57,
    gap: 10,
  },
  accordionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: MID_GREEN },
  accordionLabelChecked: { fontWeight: '700', color: DARK_GREEN },
  accordionCount: { fontSize: 15, fontWeight: '500', color: BORDER, minWidth: 32, textAlign: 'right' },
  accordionChildren: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 2,
  },
  childRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
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
  dietLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dietLabel: { fontSize: 15, fontWeight: '500', color: MID_GREEN },
  dietLabelActive: { fontWeight: '700', color: DARK_GREEN },

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
