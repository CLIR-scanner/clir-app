import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { updateName } from '../../services/user.service';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PersonalName'>;

// ── Design tokens (Figma node 272:4756) ──────────────────────────────────────
const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';

// ── Pencil (edit) icon ────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Camera icon (badge on avatar) ────────────────────────────────────────────
function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={DARK_GREEN}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={DARK_GREEN} strokeWidth={2} />
    </Svg>
  );
}

// ── Field row (label + value + optional divider) ──────────────────────────────
function FieldRow({
  label,
  children,
  noDivider,
}: {
  label: string;
  children: React.ReactNode;
  noDivider?: boolean;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>{children}</View>
      {!noDivider && <View style={styles.fieldDivider} />}
    </View>
  );
}

export default function PersonalNameScreen() {
  const navigation    = useNavigation<Nav>();
  const insets        = useSafeAreaInsets();
  const currentUser   = useUserStore(s => s.currentUser);
  const updateUserName = useUserStore(s => s.updateUserName);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  // ── 이름 분리 (firstName / lastName) ─────────────────────────────────────
  const parts = (currentUser.name ?? '').split(' ');
  const [firstName,     setFirstName]     = useState(parts[0] ?? '');
  const [lastName,      setLastName]      = useState(parts.slice(1).join(' '));
  const [saving,        setSaving]        = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  // ── 프로필 사진 ──────────────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState<string | undefined>(
    currentUser.profileImage,
  );

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      updateActiveProfile({ profileImage: uri });
    }
  }

  // ── 이름 저장 ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const combined = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!combined) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    setSaving(true);
    try {
      await updateName(combined);
      updateUserName(combined);
      setIsEditingName(false);
      Alert.alert('', 'Saved.');
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error)?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const initial = (firstName || currentUser.name || '?')[0].toUpperCase();
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
            <View style={styles.avatarWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <CameraIcon />
              </View>
            </View>
          </TouchableOpacity>

          {isEditingName ? (
            <TextInput
              ref={nameInputRef}
              style={styles.displayNameInput}
              value={displayName}
              onChangeText={text => {
                const p = text.split(' ');
                setFirstName(p[0] ?? '');
                setLastName(p.slice(1).join(' '));
              }}
              placeholder="Nickname"
              placeholderTextColor={BORDER}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
              textAlign="center"
              autoFocus
            />
          ) : (
            <View style={styles.displayNameRow}>
              <Text style={styles.displayName}>
                {displayName || currentUser.name || '—'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEditingName(true);
                  setTimeout(() => nameInputRef.current?.focus(), 50);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <PencilIcon />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Personal Information ────────────────────────────────────────── */}
        <View style={styles.sectionPill}>
          <Text style={styles.sectionPillText}>Personal Information</Text>
        </View>

        <View style={styles.fieldsBlock}>
          {/* First name — editable */}
          <FieldRow label="First name">
            <TextInput
              style={styles.fieldInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={BORDER}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </FieldRow>

          {/* Last name — editable */}
          <FieldRow label="Last name">
            <TextInput
              style={styles.fieldInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={BORDER}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </FieldRow>

          {/* Email — display only with edit pill */}
          <FieldRow label="Email Address" noDivider>
            <Text style={styles.fieldValueText}>{currentUser.email || '—'}</Text>
            <TouchableOpacity style={styles.editPill} activeOpacity={0.7}>
              <Text style={styles.editPillText}>edit</Text>
            </TouchableOpacity>
          </FieldRow>
        </View>

        {/* ── Save button ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 26,
    gap: 18,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    fontSize: 32,
    lineHeight: 34,
    color: DARK_GREEN,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: DARK_GREEN,
    letterSpacing: -0.3,
  },

  // ── Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: MID_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 32,
  },
  displayNameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 32,
    borderBottomWidth: 1.5,
    borderBottomColor: DARK_GREEN,
    minWidth: 120,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },

  // ── Section pill
  sectionPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 17,
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_GREEN,
  },

  // ── Fields
  fieldsBlock: {
    gap: 0,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: MID_GREEN,
    lineHeight: 20,
    marginTop: 8,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
    paddingVertical: 4,
  },
  fieldValueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: BORDER,
    paddingVertical: 4,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 4,
  },
  editPill: {
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 30,
    paddingVertical: 2,
    paddingHorizontal: 10,
    minWidth: 38,
    alignItems: 'center',
  },
  editPillText: {
    fontSize: 10,
    fontWeight: '500',
    color: BORDER,
    lineHeight: 20,
  },

  // ── Save
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: DARK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
