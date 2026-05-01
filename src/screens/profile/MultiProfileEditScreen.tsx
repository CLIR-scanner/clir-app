import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Image, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList, SensitivityLevel } from '../../types';
import { useUserStore } from '../../store/user.store';
import { fetchAllergenCatalog, AllergenCatalog } from '../../services/allergen.service';
import {
  fetchDietCatalog,
  getCachedDietCatalogOrBootstrap,
  type DietCatalog,
} from '../../services/diet.service';
import { getCatalogLanguage } from '../../constants/languages';

type Nav   = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileEdit'>;
type Route = RouteProp<ProfileStackParamList, 'MultiProfileEdit'>;

const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';
const STRICT_CLR = '#FF3434';
const STRICT_BG  = '#FFECEC';

function buildVegeOptions(dietCatalog: DietCatalog, veganLabels: { strict: string; flexible: string }) {
  const result: { key: string; label: string }[] = [];
  for (const dt of dietCatalog.types) {
    if (dt.code === 'vegan') {
      result.push({ key: 'strict', label: veganLabels.strict });
      result.push({ key: 'flexible', label: veganLabels.flexible });
    } else {
      result.push({ key: dt.code, label: dt.name });
    }
  }
  return result;
}

function getDietKey(d: string[]): string {
  if (d.includes('strict'))   return 'strict';
  if (d.includes('flexible')) return 'flexible';
  return d[0] ?? '';
}

function isVeganModifier(k: string) { return k === 'strict' || k === 'flexible'; }

function getAvoidedCategories(dietKey: string, dietCatalog: DietCatalog): string[] {
  const typeCode = isVeganModifier(dietKey) ? 'vegan' : dietKey;
  const found = dietCatalog.types.find(x => x.code === typeCode);
  if (!found) return [];
  return [...new Set([...found.avoidedCategories, ...found.cautionCategories])];
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function RadioFilled({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      <Path d="M9.5 0.5C4.53 0.5 0.5 4.53 0.5 9.5S4.53 18.5 9.5 18.5 18.5 14.47 18.5 9.5 14.47 0.5 9.5 0.5Z" stroke={DARK_GREEN} strokeWidth={1.5} fill="none" />
      <Path d="M9.5 4.5C6.74 4.5 4.5 6.74 4.5 9.5S6.74 14.5 9.5 14.5 14.5 12.26 14.5 9.5 12.26 4.5 9.5 4.5Z" fill={DARK_GREEN} />
    </Svg>
  );
}

function RadioEmpty({ size = 19, color = BORDER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      <Path d="M9.5 0.5C4.53 0.5 0.5 4.53 0.5 9.5S4.53 18.5 9.5 18.5 18.5 14.47 18.5 9.5 14.47 0.5 9.5 0.5Z" stroke={color} strokeWidth={1.5} fill="none" />
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

function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={DARK_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={DARK_GREEN} strokeWidth={2} />
    </Svg>
  );
}

function PencilIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MultiProfileEditScreen() {
  const navigation    = useNavigation<Nav>();
  const route         = useRoute<Route>();
  const { t }         = useTranslation();
  const insets        = useSafeAreaInsets();
  const { profileId } = route.params;

  const currentUser         = useUserStore(s => s.currentUser);
  const updateMultiProfile  = useUserStore(s => s.updateMultiProfile);
  const syncActiveProfile   = useUserStore(s => s.syncActiveProfile);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);
  const updateUserName      = useUserStore(s => s.updateUserName);
  const currentLanguage     = useUserStore(s => s.currentUser.language);
  const catalogLanguage     = getCatalogLanguage(currentLanguage);

  const isMainProfile = profileId === currentUser.id;
  const profile = isMainProfile
    ? currentUser
    : currentUser.multiProfiles.find(p => p.id === profileId);

  // ── State ──────────────────────────────────────────────────────────────────
  const [photoUri,      setPhotoUri]      = useState<string | undefined>(profile?.profileImage);
  const [editedName,    setEditedName]    = useState(profile?.name ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const nameRef = useRef<TextInput>(null);

  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(profile?.sensitivityLevel ?? 'normal');
  const [dietKey,     setDietKey]     = useState(() => getDietKey(profile?.dietaryRestrictions ?? []));
  const [catalog,     setCatalog]     = useState<AllergenCatalog | null>(null);
  const [dietCatalog, setDietCatalog] = useState<DietCatalog>(() => getCachedDietCatalogOrBootstrap());
  const [selected,    setSelected]    = useState<Set<string>>(new Set(profile?.allergyProfile ?? []));
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());
  const [saving,      setSaving]      = useState(false);
  const [showAllergySection, setShowAllergySection] = useState(false);
  const [showDietSection,    setShowDietSection]    = useState(false);

  const isVegetarianOnly = (profile?.allergyProfile.length ?? 0) === 0 && (profile?.dietaryRestrictions.length ?? 0) > 0;
  const isAllergyOnly    = (profile?.allergyProfile.length ?? 0) > 0  && (profile?.dietaryRestrictions.length ?? 0) === 0;

  useEffect(() => {
    fetchAllergenCatalog(catalogLanguage).then(setCatalog).catch(() => {});
    fetchDietCatalog(catalogLanguage).then(setDietCatalog).catch(() => {});
  }, [catalogLanguage]);

  useEffect(() => {
    if (!catalog) return;
    const validNames = new Set<string>();
    const idToNames  = new Map<string, string[]>();
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

  if (!profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 16 }}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function isItemChecked(item: { name: string; allergenId?: string }) {
    return selected.has(item.name) || !!(item.allergenId && selected.has(item.allergenId));
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
      cat.items.forEach(i => { next.delete(i.name); if (i.allergenId) next.delete(i.allergenId); });
      if (!allChecked) cat.items.forEach(i => next.add(i.name));
      return next;
    });
  }

  async function handleSave() {
    const trimmedName = editedName.trim();
    if (!trimmedName) { Alert.alert(t('common.error'), t('profileUi.enterName')); return; }
    setSaving(true);
    try {
      let newDiet: string[] = [];
      if (dietKey) newDiet = isVeganModifier(dietKey) ? ['vegan', dietKey] : [dietKey];
      const newAllergy = Array.from(selected);
      if (isMainProfile) {
        await syncActiveProfile({ allergyProfile: newAllergy, dietaryRestrictions: newDiet, sensitivityLevel: sensitivity });
        updateActiveProfile({ allergyProfile: newAllergy, dietaryRestrictions: newDiet, sensitivityLevel: sensitivity });
        if (trimmedName !== currentUser.name) updateUserName(trimmedName);
      } else {
        updateMultiProfile(profileId, { name: trimmedName, profileImage: photoUri, allergyProfile: newAllergy, dietaryRestrictions: newDiet, sensitivityLevel: sensitivity });
      }
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('profileUi.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('profileUi.permissionRequired'), t('profileUi.photoPermissionProfile')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  }

  const vegeOptions = buildVegeOptions(dietCatalog, { strict: t('survey.strictVegan'), flexible: t('survey.flexibleVegan') });
  const avoidedCategoryCodes     = getAvoidedCategories(dietKey, dietCatalog);
  const allCategoryCodes         = dietCatalog.categories.map(c => c.code);
  const orderedDietCategoryCodes = [
    ...allCategoryCodes.filter(c =>  avoidedCategoryCodes.includes(c)),
    ...allCategoryCodes.filter(c => !avoidedCategoryCodes.includes(c)),
  ];

  const initial = ((isEditingName ? editedName : profile.name) || '?')[0].toUpperCase();

  function renderSensitivityCards() {
    return (
      <>
        {(['strict', 'normal'] as SensitivityLevel[]).map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.sensitivityCard, sensitivity === level && styles.sensitivityCardActive]}
            onPress={() => setSensitivity(level)}
            activeOpacity={0.85}
          >
            <View style={styles.sensitivityCardTop}>
              <Text style={styles.sensitivityCardTitle}>
                {level === 'strict' ? t('profileUi.strictMode') : t('profileUi.normalMode')}
              </Text>
              <View style={level === 'strict' ? styles.strictBadge : styles.normalBadge}>
                <Text style={level === 'strict' ? styles.strictBadgeText : styles.normalBadgeText}>
                  {level === 'strict' ? t('profileUi.strict') : t('profileUi.normal')}
                </Text>
              </View>
            </View>
            <Text style={styles.sensitivityCardDesc}>
              {level === 'strict' ? t('sensitivity.strictDesc') : t('sensitivity.normalDesc')}
            </Text>
            {sensitivity === level && (
              <View style={styles.activeRow}>
                <RadioFilled size={19} />
                <Text style={styles.activeText}>{t('common.currentlyActive')}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </>
    );
  }

  function renderVegeRadioList() {
    return (
      <View style={styles.radioList}>
        <TouchableOpacity style={styles.radioRow} onPress={() => setDietKey('')} activeOpacity={0.7}>
          {dietKey === '' ? <RadioFilled /> : <RadioEmpty color={BORDER} />}
          <Text style={[styles.radioLabel, dietKey === '' && styles.radioLabelActive]}>{t('profile.noAllergens')}</Text>
        </TouchableOpacity>
        {vegeOptions.map(opt => {
          const active = dietKey === opt.key;
          return (
            <TouchableOpacity key={opt.key} style={styles.radioRow} onPress={() => setDietKey(opt.key)} activeOpacity={0.7}>
              {active ? <RadioFilled /> : <RadioEmpty color={BORDER} />}
              <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderAllergenAccordion() {
    if (!catalog) return <ActivityIndicator color={DARK_GREEN} style={{ marginVertical: 16 }} />;
    return (
      <>
        {catalog.categories.map(cat => {
          const checked    = cat.items.filter(isItemChecked).length;
          const totalItems = cat.items.length;
          const isExp      = expanded.has(cat.code);
          return (
            <View key={cat.code} style={[styles.accordionItem, checked > 0 && styles.accordionItemChecked]}>
              <TouchableOpacity style={styles.accordionRow} onPress={() => toggleCategory(cat.code)} activeOpacity={0.8}>
                <TouchableOpacity onPress={() => toggleAllInCategory(cat.code)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {checked > 0 ? <CheckboxFilled /> : <CheckboxEmpty />}
                </TouchableOpacity>
                <Text style={[styles.accordionLabel, checked > 0 && styles.accordionLabelChecked]}>{cat.name}</Text>
                <Text style={styles.accordionCount}>{checked > 0 ? `${checked}/${totalItems}` : ''}</Text>
                <ChevronRight />
              </TouchableOpacity>
              {isExp && (
                <View style={styles.accordionChildren}>
                  {cat.items.map(item => {
                    const isChecked = isItemChecked(item);
                    return (
                      <TouchableOpacity key={item.name} style={styles.childRow} onPress={() => toggleItem(item)} activeOpacity={0.7}>
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

  function renderDietCategories() {
    return (
      <>
        {orderedDietCategoryCodes.map(code => {
          const isActive = avoidedCategoryCodes.includes(code);
          const label    = dietCatalog.categories.find(c => c.code === code)?.name ?? code;
          return (
            <View key={code} style={[styles.dietRow, isActive ? styles.dietRowActive : styles.dietRowInactive]}>
              <View style={styles.dietLeft}>
                {isActive ? <RadioFilled size={21} /> : <RadioEmpty size={21} color={BORDER} />}
                <Text style={[styles.dietLabel, isActive && styles.dietLabelActive]}>{label}</Text>
              </View>
            </View>
          );
        })}
      </>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
            <Text style={styles.backArrow}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('multiProfileDetail.headerTitle')}</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving
              ? <ActivityIndicator size="small" color={DARK_GREEN} />
              : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ─────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85}>
            <View style={styles.avatarWrap}>
              {photoUri
                ? <Image source={{ uri: photoUri }} style={styles.avatarImg} />
                : <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initial}</Text></View>
              }
              <View style={styles.cameraBadge}><CameraIcon /></View>
            </View>
          </TouchableOpacity>

          {isEditingName ? (
            <TextInput
              ref={nameRef}
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder={t('profileUi.profileName')}
              placeholderTextColor={BORDER}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => setIsEditingName(false)}
              textAlign="center"
              autoFocus
            />
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{editedName || profile.name}</Text>
              {!isMainProfile && (
                <TouchableOpacity
                  onPress={() => { setIsEditingName(true); setTimeout(() => nameRef.current?.focus(), 50); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <PencilIcon />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Layout A / B / C ─────────────────────────────────────────────── */}
        {isVegetarianOnly ? (
          <>
            <SectionHeader title={t('profileUi.vegetarianOption')} subtitle={t('profileUi.vegetarianOptionSubtitle')} />
            {renderVegeRadioList()}
            {dietKey !== '' && (
              <>
                <View style={styles.divider} />
                <SectionHeader title={t('profileUi.ingredientsRestrictionProfile')} subtitle={t('dietary.subtitle')} />
                <Text style={styles.subLabel}>{t('profileUi.vegetarianDiet')}</Text>
                {renderDietCategories()}
              </>
            )}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.addToggleBtn} onPress={() => setShowAllergySection(v => !v)} activeOpacity={0.8}>
              <Text style={styles.addToggleBtnText}>
                {showAllergySection ? t('profileUi.hideAllergySection') : `+ ${t('profileUi.addAllergy')}`}
              </Text>
            </TouchableOpacity>
            {showAllergySection && (
              <>
                <SectionHeader title={t('profileUi.allergySensitivitySettings')} subtitle={t('sensitivity.subtitle')} />
                {renderSensitivityCards()}
                <View style={styles.divider} />
                <SectionHeader title={t('profileUi.ingredientsRestrictionProfile')} subtitle={t('dietary.subtitle')} />
                <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>
                {renderAllergenAccordion()}
              </>
            )}
          </>
        ) : isAllergyOnly ? (
          <>
            <SectionHeader title={t('profileUi.allergySensitivitySettings')} subtitle={t('sensitivity.subtitle')} />
            {renderSensitivityCards()}
            <View style={styles.divider} />
            <SectionHeader title={t('profileUi.ingredientsRestrictionProfile')} subtitle={t('dietary.subtitle')} />
            <Text style={styles.subLabel}>{t('profileUi.allergens')}</Text>
            {renderAllergenAccordion()}
            <View style={styles.divider} />
            <TouchableOpacity style={styles.addToggleBtn} onPress={() => setShowDietSection(v => !v)} activeOpacity={0.8}>
              <Text style={styles.addToggleBtnText}>
                {showDietSection ? t('profileUi.hideDietSection') : `+ ${t('profileUi.addDiet')}`}
              </Text>
            </TouchableOpacity>
            {showDietSection && (
              <>
                <SectionHeader title={t('profileUi.vegetarianOption')} subtitle={t('profileUi.vegetarianOptionSubtitle')} />
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
          <>
            <SectionHeader title={t('profileUi.allergySensitivitySettings')} subtitle={t('sensitivity.subtitle')} />
            {renderSensitivityCards()}
            <View style={styles.divider} />
            <SectionHeader title={t('profileUi.vegetarianOption')} subtitle={t('profileUi.vegetarianOptionSubtitle')} />
            {renderVegeRadioList()}
            <View style={styles.divider} />
            <SectionHeader title={t('profileUi.ingredientsRestrictionProfile')} subtitle={t('dietary.subtitle')} />
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

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, paddingVertical: 12 },
  headerSide:  { flex: 1 },
  backArrow:   { fontSize: 32, color: DARK_GREEN, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: DARK_GREEN, letterSpacing: -0.3, textAlign: 'center' },
  saveBtn:     { borderWidth: 1, borderColor: DARK_GREEN, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: DARK_GREEN },

  heroSection:  { alignItems: 'center', paddingVertical: 16, gap: 10 },
  avatarWrap:   { position: 'relative' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: MID_GREEN, alignItems: 'center', justifyContent: 'center' },
  avatarImg:    { width: 80, height: 80, borderRadius: 40 },
  avatarText:   { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  cameraBadge:  {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 20, fontWeight: '700', color: DARK_GREEN, textAlign: 'center' },
  nameInput:   {
    fontSize: 20, fontWeight: '700', color: DARK_GREEN, textAlign: 'center',
    borderBottomWidth: 1.5, borderBottomColor: DARK_GREEN,
    minWidth: 120, padding: 0, margin: 0, includeFontPadding: false,
  },

  sectionHeader:   { gap: 4, marginTop: 12 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: DARK_GREEN },
  sectionSubtitle: { fontSize: 12, color: DARK_GREEN, lineHeight: 18 },
  divider:         { height: 1, backgroundColor: BORDER, marginVertical: 8, marginHorizontal: 6 },

  sensitivityCard:       { borderWidth: 1, borderColor: MID_GREEN, borderRadius: 16, padding: 20, gap: 10 },
  sensitivityCardActive: { backgroundColor: CARD_FILL, borderWidth: 2, borderColor: DARK_GREEN },
  sensitivityCardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sensitivityCardTitle:  { fontSize: 16, fontWeight: '700', color: DARK_GREEN },
  sensitivityCardDesc:   { fontSize: 12, color: MID_GREEN, lineHeight: 18 },
  strictBadge:           { backgroundColor: STRICT_BG, borderWidth: 1, borderColor: STRICT_CLR, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 3 },
  strictBadgeText:       { fontSize: 13, fontWeight: '500', color: STRICT_CLR },
  normalBadge:           { backgroundColor: MID_GREEN, borderWidth: 1, borderColor: MID_GREEN, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 3 },
  normalBadgeText:       { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  activeRow:             { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  activeText:            { fontSize: 11, fontWeight: '800', color: MID_GREEN },

  radioList:        { gap: 14 },
  radioRow:         { flexDirection: 'row', alignItems: 'center', gap: 16 },
  radioLabel:       { fontSize: 16, color: MID_GREEN, fontWeight: '400' },
  radioLabelActive: { fontWeight: '700', color: DARK_GREEN },
  subLabel:         { fontSize: 12, fontWeight: '700', color: MID_GREEN, marginTop: 4 },

  accordionItem:         { backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 15, overflow: 'hidden' },
  accordionItemChecked:  { backgroundColor: CARD_FILL },
  accordionRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 57, gap: 10 },
  accordionLabel:        { flex: 1, fontSize: 15, fontWeight: '500', color: MID_GREEN },
  accordionLabelChecked: { fontWeight: '700', color: DARK_GREEN },
  accordionCount:        { fontSize: 15, fontWeight: '500', color: BORDER, minWidth: 32, textAlign: 'right' },
  accordionChildren:     { borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
  childRow:              { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  childLabel:            { fontSize: 14, color: DARK_GREEN },

  dietRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: BORDER, borderRadius: 15, paddingHorizontal: 14, height: 57, overflow: 'hidden' },
  dietRowActive:   { backgroundColor: CARD_FILL },
  dietRowInactive: { backgroundColor: BG },
  dietLeft:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dietLabel:       { fontSize: 15, fontWeight: '500', color: MID_GREEN },
  dietLabelActive: { fontWeight: '700', color: DARK_GREEN },

  addToggleBtn:     { borderWidth: 1.5, borderColor: DARK_GREEN, borderRadius: 100, paddingVertical: 14, alignItems: 'center', backgroundColor: BG },
  addToggleBtnText: { fontSize: 14, fontWeight: '700', color: DARK_GREEN },
});
