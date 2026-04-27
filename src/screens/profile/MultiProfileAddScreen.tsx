import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { DIET_AVOIDED_CATEGORIES, DIET_RESTRICTION_CATEGORIES, DIET_TITLES } from '../../constants/dietary';
import { fetchAllergenCatalog, AllergenCatalog } from '../../services/allergen.service';
import { useUserStore } from '../../store/user.store';
import VegetarianDietConfirmCircle, {
  VEGETARIAN_LABELS,
  VEGAN_LABELS,
} from '../../components/common/VegetarianDietConfirmCircle';

// 각 subcomponent 에서 동일하게 호출 — 모듈 캐시 덕에 실제 fetch 는 1회만 발생.
function useCategoryCodes(): string[] {
  const [codes, setCodes] = useState<string[]>([]);
  useEffect(() => {
    fetchAllergenCatalog('en')
      .then((c: AllergenCatalog) => setCodes(c.categories.map(x => x.code)))
      .catch(() => {});
  }, []);
  return codes;
}

type DietaryType    = 'allergy' | 'vegetarian' | 'both';
type Severity       = 'mild' | 'moderate' | 'severe';
type ReactionType   = 'immediate' | 'delayed' | 'not_sure';
type VegetarianType =
  | 'pescatarian' | 'vegan' | 'lacto_vegetarian' | 'ovo_vegetarian'
  | 'lacto_ovo_vegetarian' | 'pesco_vegetarian' | 'pollo_vegetarian' | 'flexitarian';
type VeganStrictness = 'strict' | 'flexible';
type Step =
  | 'name' | 'diet'
  | 'allergy_severity' | 'allergy_reaction' | 'allergy_ingredients'
  | 'vegetarian_type' | 'vegan_strictness' | 'vege_confirm' | 'vegetarian_ingredients';

const STEP_PROGRESS: Record<Step, number> = {
  name: 10, diet: 22,
  allergy_severity: 36, allergy_reaction: 50, allergy_ingredients: 64,
  vegetarian_type: 70, vegan_strictness: 78, vege_confirm: 85, vegetarian_ingredients: 92,
};

function StepLayout({ title, subtitle, children, footer }: {
  title: string; subtitle?: string;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'height' : undefined} keyboardVerticalOffset={0}>
      <ScrollView
        style={s.stepScroll} contentContainerStyle={s.stepContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        {children}
      </ScrollView>
      <View style={s.footer}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

function ContinueBtn({ label, disabled, onPress }: { label?: string; disabled?: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[s.btn, disabled && s.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.btnText}>{label ?? t('common.continue')}</Text>
    </TouchableOpacity>
  );
}

function StepName({ value, onChange, onNext }: {
  value: string; onChange: (v: string) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  return (
    <StepLayout
      title={t('multiProfileAdd.stepNameTitle')}
      subtitle={t('multiProfileAdd.stepNameSubtitle')}
      footer={<ContinueBtn disabled={!value.trim()} onPress={onNext} />}
    >
      <TextInput
        style={s.textInput}
        placeholder={t('multiProfileAdd.namePlaceholder')}
        placeholderTextColor={BORDER}
        value={value}
        onChangeText={onChange}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => value.trim() && onNext()}
      />
    </StepLayout>
  );
}

function StepDiet({ selected, onSelect, onNext }: {
  selected: DietaryType | null; onSelect: (v: DietaryType) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const options: { value: DietaryType; label: string; desc: string }[] = [
    { value: 'allergy',    label: t('multiProfileAdd.dietAllergy'),    desc: t('multiProfileAdd.dietAllergyDesc') },
    { value: 'vegetarian', label: t('multiProfileAdd.dietVegetarian'), desc: t('multiProfileAdd.dietVegetarianDesc') },
    { value: 'both',       label: t('multiProfileAdd.dietBoth'),       desc: t('multiProfileAdd.dietBothDesc') },
  ];
  return (
    <StepLayout
      title={t('multiProfileAdd.stepDietTitle')}
      subtitle={t('multiProfileAdd.stepDietSubtitle')}
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.option, selected === opt.value && s.optionSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
            <Text style={[s.optionDesc, selected === opt.value && s.optionDescSel]}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

function StepAllergySeverity({ selected, onSelect, onNext }: {
  selected: Severity | null; onSelect: (v: Severity) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const options: { value: Severity; label: string; desc: string }[] = [
    { value: 'mild',     label: t('multiProfileAdd.mild'),     desc: t('multiProfileAdd.mildDesc') },
    { value: 'moderate', label: t('multiProfileAdd.moderate'), desc: t('multiProfileAdd.moderateDesc') },
    { value: 'severe',   label: t('multiProfileAdd.severe'),   desc: t('multiProfileAdd.severeDesc') },
  ];
  return (
    <StepLayout
      title={t('multiProfileAdd.stepSeverityTitle')}
      subtitle={t('multiProfileAdd.stepSeveritySubtitle')}
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.option, selected === opt.value && s.optionSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
            <Text style={[s.optionDesc, selected === opt.value && s.optionDescSel]}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

function StepAllergyReaction({ selected, onSelect, onNext }: {
  selected: ReactionType | null; onSelect: (v: ReactionType) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const options: { value: ReactionType; label: string; desc: string }[] = [
    { value: 'immediate', label: t('multiProfileAdd.immediate'), desc: t('multiProfileAdd.immediateDesc') },
    { value: 'delayed',   label: t('multiProfileAdd.delayed'),   desc: t('multiProfileAdd.delayedDesc') },
    { value: 'not_sure',  label: t('multiProfileAdd.notSure'),   desc: t('multiProfileAdd.notSureDesc') },
  ];
  return (
    <StepLayout
      title={t('multiProfileAdd.stepReactionTitle')}
      subtitle={t('multiProfileAdd.stepReactionSubtitle')}
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.option, selected === opt.value && s.optionSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
            <Text style={[s.optionDesc, selected === opt.value && s.optionDescSel]}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

function StepAllergyIngredients({ selected, onChange, onNext, isFinal }: {
  selected: Set<string>; onChange: (v: Set<string>) => void;
  onNext: () => void; isFinal: boolean;
}) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [modalSel, setModalSel] = useState<string[]>([]);
  const categoryCodes = useCategoryCodes();
  const available = categoryCodes.filter(c => !selected.has(c));

  function toggleItem(cat: string) {
    const next = new Set<string>(selected);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    onChange(next);
  }
  function openModal() { setModalSel([]); setShowModal(true); }
  function saveModal() {
    const next = new Set<string>(selected);
    modalSel.forEach(c => next.add(c));
    onChange(next);
    setShowModal(false);
  }

  return (
    <StepLayout
      title={t('multiProfileAdd.stepAllergyIngrTitle')}
      subtitle={t('multiProfileAdd.stepAllergyIngrSubtitle')}
      footer={<ContinueBtn label={isFinal ? t('common.save') : t('common.continue')} onPress={onNext} />}
    >
      <View style={s.options}>
        {Array.from(selected).map(cat => (
          <TouchableOpacity
            key={cat} style={[s.option, s.optionSelected]}
            onPress={() => toggleItem(cat)} activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, s.optionLabelSel]}>{cat}</Text>
            <Text style={[s.optionDesc, s.optionDescSel]}>{t('multiProfileAdd.tapToRemove')}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={openModal}>
          <Text style={s.addBtnText}>{t('multiProfileAdd.addCategory')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t('multiProfileAdd.modalAllergyTitle')}</Text>
            <Text style={s.modalSubtitle}>{t('multiProfileAdd.modalAllergySubtitle')}</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={s.modalList}>
                {available.length === 0
                  ? <Text style={s.emptyText}>{t('multiProfileAdd.allAdded')}</Text>
                  : available.map(cat => {
                      const checked = modalSel.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat} style={s.modalItem}
                          onPress={() => setModalSel(p => checked ? p.filter(c => c !== cat) : [...p, cat])}
                        >
                          <Text style={s.modalItemText}>{cat}</Text>
                          <View style={[s.checkbox, checked && s.checkboxChecked]} />
                        </TouchableOpacity>
                      );
                    })
                }
              </View>
            </ScrollView>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveModal}>
              <Text style={s.modalSaveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

function StepVegetarianType({ selected, onSelect, onNext }: {
  selected: VegetarianType | null; onSelect: (v: VegetarianType) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const options: { value: VegetarianType; label: string }[] = [
    { value: 'pescatarian',          label: 'Pescatarian' },
    { value: 'vegan',                label: 'Vegan' },
    { value: 'lacto_vegetarian',     label: 'Lacto-vegetarian' },
    { value: 'ovo_vegetarian',       label: 'Ovo-vegetarian' },
    { value: 'lacto_ovo_vegetarian', label: 'Lacto-ovo-vegetarian' },
    { value: 'pesco_vegetarian',     label: 'Pesco-vegetarian' },
    { value: 'pollo_vegetarian',     label: 'Pollo-vegetarian' },
    { value: 'flexitarian',          label: 'Flexitarian' },
  ];
  return (
    <StepLayout
      title={t('multiProfileAdd.stepVegTypeTitle')}
      subtitle={t('multiProfileAdd.stepVegTypeSubtitle')}
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.optionRow, selected === opt.value && s.optionRowSelected]}
            onPress={() => onSelect(opt.value)} activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

function StepVeganStrictness({ selected, onSelect, onNext }: {
  selected: VeganStrictness | null; onSelect: (v: VeganStrictness) => void; onNext: () => void;
}) {
  const { t } = useTranslation();
  const options: { value: VeganStrictness; label: string; desc: string }[] = [
    { value: 'strict',   label: t('multiProfileAdd.strictVegan'),   desc: t('multiProfileAdd.strictVeganDesc') },
    { value: 'flexible', label: t('multiProfileAdd.flexibleVegan'), desc: t('multiProfileAdd.flexibleVeganDesc') },
  ];
  return (
    <StepLayout
      title={t('multiProfileAdd.stepVeganStrictTitle')}
      subtitle={t('multiProfileAdd.stepVeganStrictSubtitle')}
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.option, selected === opt.value && s.optionSelected]}
            onPress={() => onSelect(opt.value)} activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
            <Text style={[s.optionDesc, selected === opt.value && s.optionDescSel]}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

function StepVegeConfirm({ label, onNext }: { label: string; onNext: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Your diet preference is ...</Text>
        <Text style={s.subtitle}>
          {'Your selected diet preference will be applied\nto your recommendations.'}
        </Text>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <VegetarianDietConfirmCircle label={label} />
        </View>
      </View>
      <View style={s.footer}>
        <ContinueBtn onPress={onNext} />
      </View>
    </View>
  );
}

function StepVegetarianIngredients({ items, onChange, dietKey, onSave }: {
  items: string[]; onChange: (v: string[]) => void; dietKey: string; onSave: () => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalSel, setModalSel] = useState<string[]>([]);
  const available = DIET_RESTRICTION_CATEGORIES.filter(c => !items.includes(c));
  const titleLabel = DIET_TITLES[dietKey] ?? dietKey;

  function openModal() { setModalSel([]); setShowModal(true); }
  function saveModal() {
    onChange([...new Set([...items, ...modalSel])]);
    setShowModal(false);
  }

  return (
    <StepLayout
      title={`As ${titleLabel},\nthey avoid`}
      subtitle={t('multiProfileAdd.stepVegIngrSubtitle')}
      footer={
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={[s.editBtn, isEditing && s.editBtnActive]}
            onPress={() => setIsEditing(e => !e)}
          >
            <Text style={s.editBtnText}>
              {isEditing ? t('common.done') : t('common.editList')}
            </Text>
          </TouchableOpacity>
          <ContinueBtn label={t('common.save')} onPress={onSave} />
        </View>
      }
    >
      <View style={s.options}>
        {items.map(item => (
          <TouchableOpacity
            key={item} style={[s.optionRow, s.optionRowSelected]}
            onPress={() => isEditing && onChange(items.filter(i => i !== item))}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            <Text style={s.optionLabelSel}>{item}</Text>
            {isEditing && <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✕</Text>}
          </TouchableOpacity>
        ))}
        {isEditing && (
          <TouchableOpacity style={s.addBtn} onPress={openModal}>
            <Text style={s.addBtnText}>{t('multiProfileAdd.addItem')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t('multiProfileAdd.modalVegTitle')}</Text>
            <Text style={s.modalSubtitle}>{t('multiProfileAdd.modalVegSubtitle')}</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={s.modalList}>
                {available.length === 0
                  ? <Text style={s.emptyText}>{t('multiProfileAdd.allAdded')}</Text>
                  : available.map(cat => {
                      const checked = modalSel.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat} style={s.modalItem}
                          onPress={() => setModalSel(p => checked ? p.filter(c => c !== cat) : [...p, cat])}
                        >
                          <Text style={s.modalItemText}>{cat}</Text>
                          <View style={[s.checkbox, checked && s.checkboxChecked]} />
                        </TouchableOpacity>
                      );
                    })
                }
              </View>
            </ScrollView>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveModal}>
              <Text style={s.modalSaveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

export default function MultiProfileAddScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const addMultiProfile = useUserStore(s => s.addMultiProfile);
  const [catalog, setCatalog] = useState<AllergenCatalog | null>(null);

  useEffect(() => {
    fetchAllergenCatalog('en').then(setCatalog).catch(() => {});
  }, []);

  const [step, setStep]               = useState<Step>('name');
  const [name, setName]               = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType | null>(null);
  const [severity, setSeverity]       = useState<Severity | null>(null);
  const [reactionType, setReactionType] = useState<ReactionType | null>(null);
  const [allergyItems, setAllergyItems] = useState<Set<string>>(new Set());
  const [vegetarianType, setVegetarianType] = useState<VegetarianType | null>(null);
  const [veganStrictness, setVeganStrictness] = useState<VeganStrictness | null>(null);
  const [avoidedItems, setAvoidedItems] = useState<string[]>([]);

  const PREV_STEP: Record<Step, Step | null> = {
    name: null, diet: 'name',
    allergy_severity: 'diet', allergy_reaction: 'allergy_severity',
    allergy_ingredients: 'allergy_reaction',
    vegetarian_type: dietaryType === 'both' ? 'allergy_ingredients' : 'diet',
    vegan_strictness: 'vegetarian_type',
    vege_confirm: vegetarianType === 'vegan' ? 'vegan_strictness' : 'vegetarian_type',
    vegetarian_ingredients: 'vege_confirm',
  };

  function goBack() {
    const prev = PREV_STEP[step];
    if (prev) setStep(prev);
    else navigation.goBack();
  }

  function handleSave() {
    const dietaryRestrictions: string[] = [];
    if (vegetarianType) dietaryRestrictions.push(vegetarianType);
    if (veganStrictness) dietaryRestrictions.push(veganStrictness);

    // StepAllergyIngredients 가 카탈로그 카테고리 코드(예: 'Dairy', 'Crustaceans')
    // 를 allergyItems 에 담는다. BE/표시 화면이 모두 ing-* ID 를 단일 표현으로
    // 사용하므로, 저장 직전 각 카테고리의 항목들에서 ing-* allergenId 의 합집합
    // 으로 변환. 매핑 없는 카테고리(Meat / Fruits / Food Additives 등) 는 drop —
    // BE 알러지 판정 범위 밖.
    const allergenIds = new Set<string>();
    if (catalog) {
      for (const code of allergyItems) {
        const cat = catalog.categories.find(c => c.code === code);
        if (!cat) continue;
        for (const item of cat.items) {
          if (item.allergenId) allergenIds.add(item.allergenId);
        }
      }
    }

    // ⚠️ avoidedItems (식이 회피 카테고리 라벨) 는 의도적으로 allergyProfile 에
    // 합치지 않는다. 자세한 이유: SurveyVegetarianIngredientsScreen 동일 주석.
    addMultiProfile({
      name: name.trim(),
      allergyProfile: [...allergenIds],
      dietaryRestrictions,
      sensitivityLevel: severity === 'severe' || veganStrictness === 'strict' ? 'strict' : 'normal',
    });
    navigation.goBack();
  }

  function renderStep() {
    switch (step) {
      case 'name':
        return <StepName value={name} onChange={setName} onNext={() => setStep('diet')} />;
      case 'diet':
        return (
          <StepDiet
            selected={dietaryType} onSelect={setDietaryType}
            onNext={() => setStep(dietaryType === 'vegetarian' ? 'vegetarian_type' : 'allergy_severity')}
          />
        );
      case 'allergy_severity':
        return <StepAllergySeverity selected={severity} onSelect={setSeverity} onNext={() => setStep('allergy_reaction')} />;
      case 'allergy_reaction':
        return <StepAllergyReaction selected={reactionType} onSelect={setReactionType} onNext={() => setStep('allergy_ingredients')} />;
      case 'allergy_ingredients':
        return (
          <StepAllergyIngredients
            selected={allergyItems} onChange={setAllergyItems}
            onNext={() => { if (dietaryType === 'both') setStep('vegetarian_type'); else handleSave(); }}
            isFinal={dietaryType === 'allergy'}
          />
        );
      case 'vegetarian_type':
        return (
          <StepVegetarianType
            selected={vegetarianType} onSelect={setVegetarianType}
            onNext={() => {
              if (vegetarianType === 'vegan') setStep('vegan_strictness');
              else setStep('vege_confirm');
            }}
          />
        );
      case 'vegan_strictness':
        return (
          <StepVeganStrictness
            selected={veganStrictness} onSelect={setVeganStrictness}
            onNext={() => setStep('vege_confirm')}
          />
        );
      case 'vege_confirm': {
        const confirmLabel = veganStrictness
          ? VEGAN_LABELS[veganStrictness]
          : VEGETARIAN_LABELS[vegetarianType ?? 'pescatarian'];
        return (
          <StepVegeConfirm
            label={confirmLabel}
            onNext={() => {
              setAvoidedItems(DIET_AVOIDED_CATEGORIES[veganStrictness ?? vegetarianType ?? ''] ?? []);
              setStep('vegetarian_ingredients');
            }}
          />
        );
      }
      case 'vegetarian_ingredients':
        return (
          <StepVegetarianIngredients
            items={avoidedItems} onChange={setAvoidedItems}
            dietKey={veganStrictness ?? vegetarianType ?? ''} onSave={handleSave}
          />
        );
    }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={s.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${STEP_PROGRESS[step]}%` }]} />
        </View>
      </View>
      {renderStep()}
    </View>
  );
}

const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  backText: { fontSize: 22, color: DARK_GREEN },
  progressBar: { flex: 1, height: 4, backgroundColor: CARD_FILL, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: DARK_GREEN, borderRadius: 2 },
  stepScroll: { flex: 1 },
  stepContent: { paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: DARK_GREEN, lineHeight: 30, marginBottom: 10 },
  subtitle: { fontSize: 13, color: MID_GREEN, lineHeight: 20, marginBottom: 28 },
  footer: { paddingBottom: 40, paddingTop: 12 },
  btn: { backgroundColor: DARK_GREEN, borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  options: { gap: 12 },
  option: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    paddingVertical: 18, paddingHorizontal: 20, backgroundColor: BG, gap: 4,
  },
  optionSelected: { borderColor: DARK_GREEN, backgroundColor: DARK_GREEN },
  optionLabel: { fontSize: 15, fontWeight: '600', color: DARK_GREEN },
  optionLabelSel: { color: '#FFFFFF' },
  optionDesc: { fontSize: 13, color: MID_GREEN },
  optionDescSel: { color: BORDER },
  optionRow: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    paddingVertical: 20, paddingHorizontal: 20, backgroundColor: BG,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionRowSelected: { borderColor: DARK_GREEN, backgroundColor: DARK_GREEN },
  textInput: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: DARK_GREEN,
  },
  addBtn: {
    borderWidth: 1.5, borderColor: DARK_GREEN, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 18, alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: DARK_GREEN },
  editBtn: {
    borderWidth: 2, borderColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', backgroundColor: BG,
  },
  editBtnActive: { backgroundColor: CARD_FILL },
  editBtnText: { fontSize: 15, fontWeight: '700', color: DARK_GREEN },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', maxHeight: '75%',
    backgroundColor: BG, borderRadius: 20,
    paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: DARK_GREEN, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: MID_GREEN, marginBottom: 20, lineHeight: 18 },
  modalList: { gap: 10, paddingBottom: 8 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    paddingVertical: 18, paddingHorizontal: 16, backgroundColor: CARD_FILL,
  },
  modalItemText: { fontSize: 14, color: DARK_GREEN, fontWeight: '500' },
  emptyText: { fontSize: 14, color: MID_GREEN, textAlign: 'center', paddingVertical: 20 },
  modalSaveBtn: {
    marginTop: 16, backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: DARK_GREEN,
  },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: BORDER, backgroundColor: BG,
  },
  checkboxChecked: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
});
