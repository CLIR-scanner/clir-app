import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { ALLERGY_CATEGORIES } from '../../constants/allergyData';
import { useUserStore } from '../../store/user.store';

// ─── 타입 ──────────────────────────────────────────────────────────────────────
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
  | 'vegetarian_type' | 'vegan_strictness' | 'vegetarian_ingredients';

// ─── 더미 데이터 ───────────────────────────────────────────────────────────────
const AVOIDED_BY_DIET: Record<string, string[]> = {
  pescatarian:          ['Meat', 'Moollusks / Shellfish'],
  vegan:                ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy'],
  lacto_vegetarian:     ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs'],
  ovo_vegetarian:       ['Meat', 'Fish', 'Moollusks / Shellfish', 'Dairy'],
  lacto_ovo_vegetarian: ['Meat', 'Fish', 'Moollusks / Shellfish'],
  pesco_vegetarian:     ['Meat'],
  pollo_vegetarian:     ['Fish', 'Moollusks / Shellfish'],
  flexitarian:          ['Meat'],
  strict:               ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy', 'Food Additives'],
  flexible:             ['Meat', 'Fish', 'Moollusks / Shellfish', 'Eggs', 'Dairy'],
};

const DIET_TITLE: Record<string, string> = {
  pescatarian: 'a Pescatarian', vegan: 'a Vegan',
  lacto_vegetarian: 'a Lacto-Vegetarian', ovo_vegetarian: 'an Ovo-Vegetarian',
  lacto_ovo_vegetarian: 'a Lacto-ovo-Vegetarian', pesco_vegetarian: 'a Pesco-Vegetarian',
  pollo_vegetarian: 'a Pollo-Vegetarian', flexitarian: 'a Flexitarian',
  strict: 'a Strict Vegan', flexible: 'a Flexible Vegan',
};

const STEP_PROGRESS: Record<Step, number> = {
  name: 10, diet: 22,
  allergy_severity: 36, allergy_reaction: 50, allergy_ingredients: 64,
  vegetarian_type: 70, vegan_strictness: 82, vegetarian_ingredients: 92,
};

// ─── 공통 레이아웃 ─────────────────────────────────────────────────────────────
function StepLayout({
  title, subtitle, children, footer,
}: {
  title: string; subtitle?: string;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.stepScroll}
        contentContainerStyle={s.stepContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        {children}
      </ScrollView>
      <View style={s.footer}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

function ContinueBtn({
  label = 'Continue', disabled, onPress,
}: { label?: string; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.btn, disabled && s.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── 단계별 컴포넌트 ───────────────────────────────────────────────────────────

/** Step 1: 이름 */
function StepName({ value, onChange, onNext }: {
  value: string; onChange: (v: string) => void; onNext: () => void;
}) {
  return (
    <StepLayout
      title="What's this profile's name?"
      subtitle="Enter a name for this family member's profile."
      footer={<ContinueBtn disabled={!value.trim()} onPress={onNext} />}
    >
      <TextInput
        style={s.textInput}
        placeholder="e.g. Mom, Child, etc."
        placeholderTextColor={Colors.gray300}
        value={value}
        onChangeText={onChange}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => value.trim() && onNext()}
      />
    </StepLayout>
  );
}

/** Step 2: 식이 유형 */
const DIET_OPTIONS: { value: DietaryType; label: string; desc: string }[] = [
  { value: 'allergy',    label: 'Allergy',    desc: 'Has food allergies to manage.' },
  { value: 'vegetarian', label: 'Vegetarian', desc: 'Follows a plant-based diet.' },
  { value: 'both',       label: 'Both',       desc: 'Has allergies and follows a vegetarian diet.' },
];
function StepDiet({ selected, onSelect, onNext }: {
  selected: DietaryType | null;
  onSelect: (v: DietaryType) => void;
  onNext: () => void;
}) {
  return (
    <StepLayout
      title="What best describes this profile?"
      subtitle="Choose the dietary category that applies."
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {DIET_OPTIONS.map(opt => (
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

/** Step 3a: 알러지 심각도 */
const SEVERITY_OPTIONS: { value: Severity; label: string; desc: string }[] = [
  { value: 'mild',     label: 'Mild',     desc: 'Minor discomfort or skin reactions.' },
  { value: 'moderate', label: 'Moderate', desc: 'Significant symptoms requiring attention.' },
  { value: 'severe',   label: 'Severe',   desc: 'Risk of anaphylaxis or serious reaction.' },
];
function StepAllergySeverity({ selected, onSelect, onNext }: {
  selected: Severity | null; onSelect: (v: Severity) => void; onNext: () => void;
}) {
  return (
    <StepLayout
      title="How severe is the allergy?"
      subtitle="Understanding severity helps recommend safer ingredients."
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {SEVERITY_OPTIONS.map(opt => (
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

/** Step 3b: 반응 유형 */
const REACTION_OPTIONS: { value: ReactionType; label: string; desc: string }[] = [
  { value: 'immediate', label: 'Immediate', desc: 'Symptoms occur within minutes.' },
  { value: 'delayed',   label: 'Delayed',   desc: 'Symptoms appear hours later.' },
  { value: 'not_sure',  label: 'Not sure',  desc: 'Reaction timing is unclear.' },
];
function StepAllergyReaction({ selected, onSelect, onNext }: {
  selected: ReactionType | null; onSelect: (v: ReactionType) => void; onNext: () => void;
}) {
  return (
    <StepLayout
      title="When does the reaction happen?"
      subtitle="This helps filter ingredients more accurately."
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {REACTION_OPTIONS.map(opt => (
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

/** Step 3c: 알러지 재료 (카테고리 단위 선택) */
function StepAllergyIngredients({ selected, onChange, onNext, isFinal }: {
  selected: Set<string>;
  onChange: (v: Set<string>) => void;
  onNext: () => void;
  isFinal: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalSel, setModalSel] = useState<string[]>([]);

  function toggleItem(cat: string) {
    const next = new Set<string>(selected);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    onChange(next);
  }

  const available = ALLERGY_CATEGORIES.filter(c => !selected.has(c));

  function openModal() { setModalSel([]); setShowModal(true); }
  function saveModal() {
    const next = new Set<string>(selected);
    modalSel.forEach(c => next.add(c));
    onChange(next);
    setShowModal(false);
  }

  return (
    <StepLayout
      title="Select allergy categories"
      subtitle="Choose the ingredient categories this profile needs to avoid."
      footer={<ContinueBtn label={isFinal ? 'Save' : 'Continue'} onPress={onNext} />}
    >
      <View style={s.options}>
        {Array.from(selected).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.option, s.optionSelected]}
            onPress={() => toggleItem(cat)}
            activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, s.optionLabelSel]}>{cat}</Text>
            <Text style={[s.optionDesc, s.optionDescSel]}>Tap to remove</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={openModal}>
          <Text style={s.addBtnText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Allergy Categories</Text>
            <Text style={s.modalSubtitle}>Select categories to add to the allergy profile.</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={s.modalList}>
                {available.length === 0
                  ? <Text style={s.emptyText}>All categories already added.</Text>
                  : available.map(cat => {
                      const checked = modalSel.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={s.modalItem}
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
              <Text style={s.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

/** Step 4a: 채식 유형 */
const VEG_OPTIONS: { value: VegetarianType; label: string }[] = [
  { value: 'pescatarian',          label: 'Pescatarian' },
  { value: 'vegan',                label: 'Vegan' },
  { value: 'lacto_vegetarian',     label: 'Lacto-vegetarian' },
  { value: 'ovo_vegetarian',       label: 'Ovo-vegetarian' },
  { value: 'lacto_ovo_vegetarian', label: 'Lacto-ovo-vegetarian' },
  { value: 'pesco_vegetarian',     label: 'Pesco-vegetarian' },
  { value: 'pollo_vegetarian',     label: 'Pollo-vegetarian' },
  { value: 'flexitarian',          label: 'Flexitarian' },
];
function StepVegetarianType({ selected, onSelect, onNext }: {
  selected: VegetarianType | null; onSelect: (v: VegetarianType) => void; onNext: () => void;
}) {
  return (
    <StepLayout
      title="What kind of diet do they follow?"
      subtitle="Choose the option that best matches their eating preferences."
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {VEG_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.optionRow, selected === opt.value && s.optionRowSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.optionLabel, selected === opt.value && s.optionLabelSel]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </StepLayout>
  );
}

/** Step 4b: Vegan 엄격도 */
const VEGAN_OPTIONS: { value: VeganStrictness; label: string; desc: string }[] = [
  { value: 'strict',   label: 'Strict Vegan',   desc: 'No lecithin / milk sugar / honey / vitamin D3 / Omega-3' },
  { value: 'flexible', label: 'Flexible Vegan',  desc: 'Try to avoid lecithin / milk sugar / honey / vitamin D3 / Omega-3' },
];
function StepVeganStrictness({ selected, onSelect, onNext }: {
  selected: VeganStrictness | null; onSelect: (v: VeganStrictness) => void; onNext: () => void;
}) {
  return (
    <StepLayout
      title="How strict is the vegan diet?"
      subtitle="Choose the option that best matches what they avoid."
      footer={<ContinueBtn disabled={!selected} onPress={onNext} />}
    >
      <View style={s.options}>
        {VEGAN_OPTIONS.map(opt => (
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

/** Step 4c: 채식 회피 재료 확인 */
function StepVegetarianIngredients({ items, onChange, dietKey, onSave }: {
  items: string[]; onChange: (v: string[]) => void;
  dietKey: string; onSave: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalSel, setModalSel] = useState<string[]>([]);
  const available = ALLERGY_CATEGORIES.filter(c => !items.includes(c));
  const titleLabel = DIET_TITLE[dietKey] ?? dietKey;

  function openModal() { setModalSel([]); setShowModal(true); }
  function saveModal() {
    onChange([...new Set([...items, ...modalSel])]);
    setShowModal(false);
  }

  return (
    <StepLayout
      title={`As ${titleLabel},\nthey avoid`}
      subtitle="Based on the diet preference, these ingredients will be excluded from recommendations."
      footer={
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={[s.editBtn, isEditing && s.editBtnActive]}
            onPress={() => setIsEditing(e => !e)}
          >
            <Text style={s.editBtnText}>{isEditing ? 'Done' : 'Edit list'}</Text>
          </TouchableOpacity>
          <ContinueBtn label="Save" onPress={onSave} />
        </View>
      }
    >
      <View style={s.options}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[s.optionRow, s.optionRowSelected]}
            onPress={() => isEditing && onChange(items.filter(i => i !== item))}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            <Text style={s.optionLabelSel}>{item}</Text>
            {isEditing && <Text style={{ color: Colors.white, fontSize: 16 }}>✕</Text>}
          </TouchableOpacity>
        ))}
        {isEditing && (
          <TouchableOpacity style={s.addBtn} onPress={openModal}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add to your list</Text>
            <Text style={s.modalSubtitle}>Choose additional categories to avoid.</Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <View style={s.modalList}>
                {available.length === 0
                  ? <Text style={s.emptyText}>All categories already added.</Text>
                  : available.map(cat => {
                      const checked = modalSel.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={s.modalItem}
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
              <Text style={s.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StepLayout>
  );
}

// ─── 메인 화면 ─────────────────────────────────────────────────────────────────
export default function MultiProfileAddScreen() {
  const navigation = useNavigation();
  const addMultiProfile = useUserStore(s => s.addMultiProfile);

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
    name: null,
    diet: 'name',
    allergy_severity: 'diet',
    allergy_reaction: 'allergy_severity',
    allergy_ingredients: 'allergy_reaction',
    vegetarian_type: dietaryType === 'both' ? 'allergy_ingredients' : 'diet',
    vegan_strictness: 'vegetarian_type',
    vegetarian_ingredients: vegetarianType === 'vegan' ? 'vegan_strictness' : 'vegetarian_type',
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

    addMultiProfile({
      name: name.trim(),
      allergyProfile: [...Array.from(allergyItems), ...avoidedItems].filter(
        (v, i, arr) => arr.indexOf(v) === i,
      ),
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
            selected={dietaryType}
            onSelect={setDietaryType}
            onNext={() => setStep(dietaryType === 'vegetarian' ? 'vegetarian_type' : 'allergy_severity')}
          />
        );

      case 'allergy_severity':
        return (
          <StepAllergySeverity
            selected={severity}
            onSelect={setSeverity}
            onNext={() => setStep('allergy_reaction')}
          />
        );

      case 'allergy_reaction':
        return (
          <StepAllergyReaction
            selected={reactionType}
            onSelect={setReactionType}
            onNext={() => setStep('allergy_ingredients')}
          />
        );

      case 'allergy_ingredients':
        return (
          <StepAllergyIngredients
            selected={allergyItems}
            onChange={setAllergyItems}
            onNext={() => {
              if (dietaryType === 'both') setStep('vegetarian_type');
              else handleSave();
            }}
            isFinal={dietaryType === 'allergy'}
          />
        );

      case 'vegetarian_type':
        return (
          <StepVegetarianType
            selected={vegetarianType}
            onSelect={setVegetarianType}
            onNext={() => {
              if (vegetarianType === 'vegan') {
                setStep('vegan_strictness');
              } else {
                setAvoidedItems(AVOIDED_BY_DIET[vegetarianType ?? ''] ?? []);
                setStep('vegetarian_ingredients');
              }
            }}
          />
        );

      case 'vegan_strictness':
        return (
          <StepVeganStrictness
            selected={veganStrictness}
            onSelect={setVeganStrictness}
            onNext={() => {
              setAvoidedItems(AVOIDED_BY_DIET[veganStrictness ?? ''] ?? []);
              setStep('vegetarian_ingredients');
            }}
          />
        );

      case 'vegetarian_ingredients':
        return (
          <StepVegetarianIngredients
            items={avoidedItems}
            onChange={setAvoidedItems}
            dietKey={veganStrictness ?? vegetarianType ?? ''}
            onSave={handleSave}
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

// ─── 스타일 ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backText: { fontSize: 22, color: Colors.black },
  progressBar: { flex: 1, height: 4, backgroundColor: Colors.gray100, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.black, borderRadius: 2 },

  stepScroll: { flex: 1 },
  stepContent: { paddingBottom: 16 },

  title: { fontSize: 22, fontWeight: '700', color: Colors.black, lineHeight: 30, marginBottom: 10 },
  subtitle: { fontSize: 13, color: Colors.gray500, lineHeight: 20, marginBottom: 28 },

  footer: { paddingBottom: 40, paddingTop: 12 },
  btn: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: '700', color: Colors.black },

  // 옵션 (설명 포함)
  options: { gap: 12 },
  option: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 18, paddingHorizontal: 20, backgroundColor: Colors.white, gap: 4,
  },
  optionSelected: { borderColor: Colors.black, backgroundColor: Colors.black },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.black },
  optionLabelSel: { color: Colors.white },
  optionDesc: { fontSize: 13, color: Colors.gray500 },
  optionDescSel: { color: Colors.gray300 },

  // 옵션 (설명 없는 단순 행)
  optionRow: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 20, paddingHorizontal: 20, backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionRowSelected: { borderColor: Colors.black, backgroundColor: Colors.black },

  textInput: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.black,
  },

  addBtn: {
    borderWidth: 1.5, borderColor: Colors.black, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 18, alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: Colors.black },

  editBtn: {
    borderWidth: 2, borderColor: Colors.black, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', backgroundColor: Colors.background,
  },
  editBtnActive: { backgroundColor: Colors.gray100 },
  editBtnText: { fontSize: 15, fontWeight: '700', color: Colors.black },

  // 모달
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', maxHeight: '75%',
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.black, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: Colors.gray500, marginBottom: 20, lineHeight: 18 },
  modalList: { gap: 10, paddingBottom: 8 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 18, paddingHorizontal: 16, backgroundColor: Colors.white,
  },
  modalItemText: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  emptyText: { fontSize: 14, color: Colors.gray500, textAlign: 'center', paddingVertical: 20 },
  modalSaveBtn: {
    marginTop: 16, backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: Colors.black,
  },
  modalSaveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.black },

  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    borderColor: Colors.gray300, backgroundColor: Colors.white,
  },
  checkboxChecked: { backgroundColor: Colors.black, borderColor: Colors.black },
});
