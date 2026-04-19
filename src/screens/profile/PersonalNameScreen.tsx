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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import { updateName, updatePassword } from '../../services/user.service';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PersonalName'>;

export default function PersonalNameScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const currentUser    = useUserStore(s => s.currentUser);
  const updateUserName = useUserStore(s => s.updateUserName);

  // ── 이름 ──────────────────────────────────────────────────────────────────
  const [name, setName]           = useState(currentUser.name);
  const [savingName, setSavingName] = useState(false);

  // ── 비밀번호 ─────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [savingPw, setSavingPw]     = useState(false);

  // ── 이름 저장 ─────────────────────────────────────────────────────────────
  async function handleSaveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('common.error'), t('personalName.errorNameEmpty'));
      return;
    }
    setSavingName(true);
    try {
      await updateName(trimmed);
      updateUserName(trimmed);
      Alert.alert('', t('personalName.successName'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setSavingName(false);
    }
  }

  // ── 비밀번호 변경 ─────────────────────────────────────────────────────────
  async function handleSavePassword() {
    if (!currentPw) {
      Alert.alert(t('common.error'), t('personalName.errorCurrentPw'));
      return;
    }
    if (newPw.length < 8) {
      Alert.alert(t('common.error'), t('personalName.errorPwLen'));
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert(t('common.error'), t('personalName.errorPwMatch'));
      return;
    }
    setSavingPw(true);
    try {
      await updatePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      Alert.alert('', t('personalName.successPassword'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('personalName.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 이름 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalName.sectionName')}</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('personalName.placeholderName')}
            placeholderTextColor={Colors.gray300}
            returnKeyType="done"
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.saveBtn, savingName && styles.saveBtnDisabled]}
            onPress={handleSaveName}
            disabled={savingName}
            activeOpacity={0.8}
          >
            {savingName ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('personalName.saveName')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 비밀번호 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalName.sectionPassword')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('personalName.currentPassword')}</Text>
            <TextInput
              style={styles.input}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder={t('personalName.placeholderCurrentPw')}
              placeholderTextColor={Colors.gray300}
              secureTextEntry
              returnKeyType="next"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('personalName.newPassword')}</Text>
            <TextInput
              style={styles.input}
              value={newPw}
              onChangeText={setNewPw}
              placeholder={t('personalName.placeholderNewPw')}
              placeholderTextColor={Colors.gray300}
              secureTextEntry
              returnKeyType="next"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('personalName.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder={t('personalName.placeholderConfirmPw')}
              placeholderTextColor={Colors.gray300}
              secureTextEntry
              returnKeyType="done"
              autoCapitalize="none"
              onSubmitEditing={handleSavePassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingPw && styles.saveBtnDisabled]}
            onPress={handleSavePassword}
            disabled={savingPw}
            activeOpacity={0.8}
          >
            {savingPw ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('personalName.savePassword')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 20,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    fontSize: 32,
    lineHeight: 34,
    color: Colors.black,
    fontWeight: '300',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },

  // 섹션 카드
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // 필드
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray700,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.black,
    backgroundColor: Colors.background,
  },

  // 저장 버튼
  saveBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
