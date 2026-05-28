import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { updateDisplayName } from '../../services/user.service';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';
import { UnauthorizedError, clearAuthToken } from '../../lib/api';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PersonalNickname'>;

const MAX_LENGTH = 30;

export default function PersonalNicknameScreen() {
  const { t }                = useTranslation();
  const navigation           = useNavigation<Nav>();
  const insets               = useSafeAreaInsets();
  const currentUser          = useUserStore(s => s.currentUser);
  const updateUserDisplayName = useUserStore(s => s.updateUserDisplayName);
  const logout               = useUserStore(s => s.logout);

  const initialValue = currentUser.displayName ?? '';
  const [value,   setValue]   = useState<string>(initialValue);
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<string | null>(null);

  const S = Strings.personalNickname;

  async function handleSave() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await updateDisplayName(value.trim());
      // 저장 성공 → store 갱신 (빈문자열=익명 복귀 → null 저장)
      updateUserDisplayName(value.trim() === '' ? null : value.trim());
      Alert.alert('', S.successMessage, [
        { text: Strings.confirm, onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearAuthToken();
        logout();
        navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        return;
      }
      const message = err instanceof Error ? err.message : Strings.error;
      setError(message);
      Alert.alert(S.errorTitle, message);
    } finally {
      setLoading(false);
    }
  }

  const charCount = [...value].length;
  const isOverLimit = charCount > MAX_LENGTH;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.back')}
          >
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{S.screenTitle}</Text>
        <View style={styles.headerSide} />
      </View>

      {/* ── Section pill ───────────────────────────────────────────────── */}
      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText}>{S.sectionLabel}</Text>
      </View>

      {/* ── Input block ────────────────────────────────────────────────── */}
      <View style={styles.fieldsBlock}>
        <Text style={styles.fieldLabel}>{S.fieldLabel}</Text>
        <TextInput
          style={[styles.input, isOverLimit && styles.inputError]}
          value={value}
          onChangeText={text => {
            setError(null);
            setValue(text);
          }}
          placeholder={S.placeholder}
          placeholderTextColor={Colors.gray300}
          maxLength={MAX_LENGTH + 1} // +1 so user can see they're over; we block save
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        {/* char count + hint row */}
        <View style={styles.inputMeta}>
          <Text style={styles.emptyHint}>{S.emptyHint}</Text>
          <Text style={[styles.charCount, isOverLimit && styles.charCountError]}>
            {S.charCountFormat(charCount, MAX_LENGTH)}
          </Text>
        </View>
        <View style={styles.fieldDivider} />

        {/* inline error */}
        {error !== null && (
          <Text style={styles.inlineError}>{error}</Text>
        )}
      </View>

      {/* ── Save button ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.saveBtn, (loading || isOverLimit) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading || isOverLimit}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>{loading ? S.savingButton : S.saveButton}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.profileBackground },
  content: { paddingHorizontal: 26, gap: 18 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 4,
  },
  headerSide:  { flex: 1 },
  backBtn:     { fontSize: 32, lineHeight: 34, color: Colors.profileDarkGreen, fontFamily: 'Pretendard-Light' },
  headerTitle: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: Colors.profileDarkGreen, letterSpacing: -0.3, textAlign: 'center' },

  sectionPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.profileDarkGreen,
    borderRadius: 10, paddingVertical: 5, paddingHorizontal: 17,
  },
  sectionPillText: { fontSize: 12, fontFamily: 'Pretendard-ExtraBold', color: Colors.profileDarkGreen },

  fieldsBlock: { gap: 0 },
  fieldLabel: {
    fontSize: 10, fontFamily: 'Pretendard-Regular', color: Colors.profileMutedGreen,
    lineHeight: 20, marginTop: 8,
  },

  input: {
    fontSize: 15, fontFamily: 'Pretendard-Regular', color: Colors.profileText,
    borderWidth: 1, borderColor: Colors.profileBorder,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  inputError: {
    borderColor: Colors.danger,
  },

  inputMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginTop: 6,
  },
  emptyHint: {
    flex: 1, fontSize: 11, color: Colors.gray500, lineHeight: 16,
    marginRight: 8,
  },
  charCount: {
    fontSize: 11, color: Colors.gray500,
  },
  charCountError: {
    color: Colors.danger,
  },

  fieldDivider: { height: 1, backgroundColor: Colors.profileBorder, marginTop: 12 },

  inlineError: {
    fontSize: 12, color: Colors.danger, marginTop: 6,
  },

  saveBtn: {
    marginTop: 8,
    backgroundColor: Colors.profileDarkGreen,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontSize: 15, fontFamily: 'Pretendard-Bold', color: Colors.white,
  },
});
