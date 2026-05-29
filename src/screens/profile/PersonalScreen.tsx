// 프로필 탭 → 유저 카드 → 개인정보 단일 화면.
// 별도 sub-routing(PersonalName/PersonalNickname/PersonalEmail) 없이 한 화면에서 표시.
// 이름·이메일은 읽기전용, 닉네임(표시명)만 연필 토글로 인라인 편집(모달 없음).
// 색상은 디자인 시스템(Colors) 만 사용.

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
import Svg, { Path, Circle } from 'react-native-svg';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/user.store';
import { updateDisplayName } from '../../services/user.service';
import { UnauthorizedError, clearAuthToken } from '../../lib/api';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Personal'>;

const NICKNAME_MAX = 30;

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7h3l2-2.5h8L18 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function PersonalScreen() {
  const { t }      = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets     = useSafeAreaInsets();

  const currentUser           = useUserStore(s => s.currentUser);
  const updateUserDisplayName = useUserStore(s => s.updateUserDisplayName);
  const logout                = useUserStore(s => s.logout);

  const name        = currentUser.name || '';
  const displayName = currentUser.displayName ?? '';
  // 표시명 미설정 시 실명으로 대체 표시(편집은 표시명 기준).
  const shownName   = displayName || name || '—';
  const initial     = (shownName.trim()[0] || '?').toUpperCase();

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);

  function startEdit() {
    setDraft(displayName);
    setEditing(true);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const next = draft.trim();
      await updateDisplayName(next);            // 빈문자열 → BE display_name=NULL
      updateUserDisplayName(next === '' ? null : next);
      setEditing(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearAuthToken();
        logout();
        navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
        return;
      }
      Alert.alert(
        t('personal.nickname.errorTitle'),
        err instanceof Error ? err.message : t('common.error'),
      );
    } finally {
      setSaving(false);
    }
  }

  const overLimit = [...draft].length > NICKNAME_MAX;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* 헤더 — 뒤로 가기 */}
      <View style={styles.header}>
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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 아바타 + 카메라 배지 */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          {/* 사진 변경 자리 — 데이터 모델에 아바타 없음, 현재 구성(배치)만 표시 */}
          <View style={styles.cameraBadge} pointerEvents="none">
            <CameraIcon color={Colors.profileDarkGreen} />
          </View>
        </View>

        {/* 표시명(닉네임) — 연필 토글 인라인 편집 (모달 없음) */}
        {editing ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={[styles.nameInput, overLimit && styles.nameInputError]}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('personal.nickname.placeholder')}
              placeholderTextColor={Colors.gray300}
              autoFocus
              maxLength={NICKNAME_MAX + 1}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => { if (!overLimit) void saveEdit(); }}
            />
            <TouchableOpacity
              onPress={() => void saveEdit()}
              disabled={saving || overLimit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.profileDarkGreen} />
                : <CheckIcon color={overLimit ? Colors.gray300 : Colors.profileDarkGreen} />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditing(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text style={styles.cancelText}>{'✕'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>{shownName}</Text>
            <TouchableOpacity
              onPress={startEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
            >
              <PencilIcon color={Colors.profileMutedGreen} />
            </TouchableOpacity>
          </View>
        )}

        {/* 읽기전용 필드 카드 — 이름 / 이메일 (존재하는 데이터만) */}
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('personal.name')}</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>{name || '—'}</Text>
          </View>
          <View style={styles.fieldDivider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('personal.email')}</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>{currentUser.email || '—'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const AVATAR = 140;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.profileBackground },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { fontSize: 32, lineHeight: 34, color: Colors.profileDarkGreen, fontFamily: 'Pretendard-Light' },

  content: { paddingHorizontal: 28, paddingTop: 12, alignItems: 'center' },

  // 아바타
  avatarWrap: { width: AVATAR, height: AVATAR, marginBottom: 18 },
  avatar: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    backgroundColor: Colors.profileDarkGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 64, fontFamily: 'Pretendard-ExtraBold', color: Colors.white },
  cameraBadge: {
    position: 'absolute', right: 4, bottom: 8,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.profileBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  // 표시명 행
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, maxWidth: '100%' },
  nameText: { fontSize: 24, fontFamily: 'Pretendard-Bold', color: Colors.black, letterSpacing: -0.4, flexShrink: 1 },

  // 표시명 인라인 편집 행
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28, alignSelf: 'stretch' },
  nameInput: {
    flex: 1,
    fontSize: 20, fontFamily: 'Pretendard-Bold', color: Colors.black,
    textAlign: 'center',
    borderBottomWidth: 1.5, borderBottomColor: Colors.profileDarkGreen,
    paddingVertical: 6, paddingHorizontal: 8,
  },
  nameInputError: { borderBottomColor: Colors.danger },
  cancelText: { fontSize: 20, color: Colors.profileMutedGreen, fontFamily: 'Pretendard-Regular' },

  // 필드 카드
  card: {
    alignSelf: 'stretch',
    borderWidth: 1, borderColor: Colors.profileBorder, borderRadius: 16,
    paddingHorizontal: 22,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 22, gap: 16,
  },
  fieldLabel: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: Colors.profileMutedGreen },
  fieldValue: { flexShrink: 1, fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: Colors.profileDarkGreen, textAlign: 'right' },
  fieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.profileBorder },
});
