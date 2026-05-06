# F3 — SurveyLanding 에 invite 게이트 + disclaimer 끼워넣기

**의존**: F1 (BetaCohort 타입), F2 (`redeemInvite` 함수)
**산출**: `CLIR/src/screens/auth/SurveyLandingScreen.tsx` 수정
**예상 시간**: 1시간
**검증**: `npx tsc --noEmit` + 수동 시나리오 4종

---

## 무엇을 만드는가

기존 `SurveyLandingScreen` 의 화면 *그대로 유지*하면서 다음을 *조건부로* 끼워넣는다.

1. **베타 invite 게이트** (제목 아래) — `currentUser.betaCohort` 가 null 이면 표시. 입력박스 + Verify 버튼.
2. **scope notice + disclaimer** (footer 위) — 항상 표시. 영양 미지원 안내 + 의학적 조언 부정.
3. **Continue 버튼 비활성화 조건** — invite 게이트 활성 상태에서 미통과면 비활성.

새 화면 추가 X (`ia.md` 룰). `ParamList` 변경 X. **기존 화면 수정만**.

---

## 변경 위치

파일: `CLIR/src/screens/auth/SurveyLandingScreen.tsx`

기존 컴포넌트는 약 107 라인. 이 파일을 통째로 다시 쓴다 (변경 범위가 화면 전반에 걸쳐서 patch 보다 통째 교체가 깔끔).

---

## 정확한 코드 (그대로 사용 가능)

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SurveyParams } from '../../types';
import { useUserStore } from '../../store/user.store';
import { redeemInvite } from '../../services/auth.service';
import { ApiError } from '../../lib/api';

// 베타 v1 — 영어 inline. i18n 6 로케일은 v1.1 으로 deferred.
// 참조: CLIR/docs/tasks/closed-beta/README.md "공통 규칙 #2"

export default function SurveyLandingScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const insets      = useSafeAreaInsets();
  const setUser            = useUserStore(s => s.setUser);
  const currentUser        = useUserStore(s => s.currentUser);
  const multiProfileMode   = useUserStore(s => s.multiProfileMode);
  const setMultiProfileMode = useUserStore(s => s.setMultiProfileMode);

  const params: SurveyParams = route.params ?? {};
  const isDevMode = route.name === 'DevSurveyLanding';

  // 베타 게이트: betaCohort null/빈 배열 → invite 입력 필요. DEV/멀티프로필 모드는 자동 통과.
  // BE 0005 마이그레이션 이후 betaCohort 는 BetaCohort[] 또는 null.
  const hasCohort = (currentUser.betaCohort?.length ?? 0) > 0;
  const needsInvite = !isDevMode && !multiProfileMode && !hasCohort;
  const [inviteCode, setInviteCode] = useState('');
  const [inviteState, setInviteState] = useState<{
    submitting: boolean;
    error?: string;
    success?: string;
  }>({ submitting: false });

  async function handleRedeem() {
    const code = inviteCode.trim().toLowerCase();
    if (code.length < 6) {
      setInviteState({ submitting: false, error: 'Code must be at least 6 characters.' });
      return;
    }
    setInviteState({ submitting: true });
    try {
      const { cohort } = await redeemInvite(code);
      setUser({ ...currentUser, betaCohort: cohort });
      setInviteState({ submitting: false, success: "Code verified! You're in." });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'INVALID_INVITE_CODE'
          ? 'Invalid invite code. Check your email and try again.'
          : 'Could not verify code. Please try again.';
      setInviteState({ submitting: false, error: msg });
    }
  }

  function handleContinue() {
    if (needsInvite) return;
    navigation.navigate('Survey', params);
  }

  function handleSkip() {
    if (multiProfileMode) {
      setMultiProfileMode(false);
      navigation.getParent()?.goBack();
    } else if (isDevMode) {
      navigation.goBack();
    } else {
      setUser(currentUser);
    }
  }

  const continueDisabled = needsInvite;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {'Please answer\na few quick questions\nto help us get you\nset up.'}
        </Text>

        {needsInvite && (
          <View style={styles.inviteBox}>
            <Text style={styles.inviteTitle}>Beta Invite Code</Text>
            <Text style={styles.inviteDesc}>
              This is a closed beta. Please enter the invite code we sent to your email.
            </Text>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter invite code"
              placeholderTextColor="#999"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
              editable={!inviteState.submitting}
            />
            <TouchableOpacity
              style={[styles.redeemButton, inviteState.submitting && styles.redeemDisabled]}
              onPress={handleRedeem}
              disabled={inviteState.submitting || inviteCode.trim().length < 6}
              activeOpacity={0.8}
            >
              {inviteState.submitting
                ? <ActivityIndicator color="#F9FFF3" />
                : <Text style={styles.redeemText}>Verify code</Text>}
            </TouchableOpacity>
            {inviteState.error && <Text style={styles.errorText}>{inviteState.error}</Text>}
            {inviteState.success && <Text style={styles.successText}>{inviteState.success}</Text>}
          </View>
        )}
      </View>

      {/* 베타 v1 안내 — 영양 미지원 + 의학적 조언 부정 */}
      <View style={styles.notices}>
        <Text style={styles.noticeBody}>
          Currently we focus on allergen and dietary preference matching only — we do not measure
          nutrition values (sodium, sugar, calories) yet. Nutrition tracking coming in a future update.
        </Text>
        <Text style={styles.noticeBody}>
          This app is for informational purposes only and is not medical advice. Always consult your
          doctor for medical decisions. Allergen labeling is based on FDA Big 9 + Sesame; verify the
          label yourself before consuming.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip this Process</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, continueDisabled && styles.continueDisabled]}
          onPress={handleContinue}
          disabled={continueDisabled}
          activeOpacity={0.8}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FFF3', paddingHorizontal: 17 },
  body: { flex: 1, paddingTop: 80, paddingHorizontal: 22 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 28 * 1.35 },
  inviteBox: {
    marginTop: 28, padding: 16, borderRadius: 16, backgroundColor: '#EAF1E2', gap: 8,
  },
  inviteTitle: { fontSize: 18, fontWeight: '700', color: '#1C3A19' },
  inviteDesc: { fontSize: 13, color: '#3A4D38', lineHeight: 18 },
  inviteInput: {
    height: 44, marginTop: 6, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#9FB59B', backgroundColor: '#FFFFFF',
    fontSize: 15, color: '#000000',
  },
  redeemButton: {
    height: 44, borderRadius: 22, backgroundColor: '#1C3A19',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  redeemDisabled: { opacity: 0.6 },
  redeemText: { fontSize: 15, fontWeight: '700', color: '#F9FFF3' },
  errorText: { color: '#B0421F', fontSize: 13, marginTop: 4 },
  successText: { color: '#1C3A19', fontSize: 13, fontWeight: '700', marginTop: 4 },
  notices: { paddingHorizontal: 22, paddingVertical: 12, gap: 8 },
  noticeBody: { fontSize: 11, color: '#5A6B58', lineHeight: 15 },
  footer: { gap: 12, paddingBottom: 24 },
  skipButton: {
    height: 53, borderRadius: 35, borderWidth: 1, borderColor: '#556C53',
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { fontSize: 16, fontWeight: '700', color: '#556C53' },
  continueButton: {
    height: 53, borderRadius: 35, backgroundColor: '#1C3A19',
    alignItems: 'center', justifyContent: 'center',
  },
  continueDisabled: { opacity: 0.5 },
  continueText: { fontSize: 16, fontWeight: '700', color: '#F9FFF3' },
});
```

---

## 디자인 메모

- 색상은 모두 기존 화면 (#1C3A19 dark green / #F9FFF3 cream / #556C53 olive) 재사용. 신규 토큰 도입 X.
- `inviteBox` 배경 `#EAF1E2` 는 cream 보다 약간 짙은 톤 — 입력 영역임을 시각적으로 구분.
- title `paddingTop` 을 140 → 80 으로 줄임 (invite box 가 들어와도 화면 균형 유지).
- Notices 는 footer 바로 위, `fontSize: 11 + lineHeight: 15` 로 작고 부드럽게.

---

## 하지 말 것

- `ParamList` 또는 `ia.md` 변경 (베타 게이트는 *기존 화면에 끼워넣기*만)
- 새 navigation 추가 (예: BetaInvite 화면 분리)
- DEV ONLY 블록 우회 로직 추가 (이 task 는 DEV 모드 자동 통과만 제공, DEV 블록 자체 X)
- `useTranslation()` import (i18n 은 v1.1 deferred — 영어 inline)
- `setUser({ ...currentUser, betaCohort: cohort })` 외 다른 store mutation 추가 (활성 프로필 변경 X)
- 입력 후 Continue 자동 호출 — 사용자가 명시적으로 Continue 눌러야 다음 화면

---

## 수동 시나리오 검증

```
시나리오 1 (정상 흐름):
  1) 앱 실행 → social login (또는 DEV ONLY 자동 로그인 비활성 상태)
  2) SurveyLanding 진입 시 "Beta Invite Code" 박스 노출
  3) "abc12" 입력 → Verify 버튼 비활성 (6자 미만)
  4) "abc1234567" 입력 → Verify 버튼 활성
  5) Verify 클릭 → 잘못된 코드 → "Invalid invite code..." 표시
  6) 정답 입력 → "Code verified! You're in." 표시 + Continue 활성
  7) Continue → Survey 진입

시나리오 2 (이미 redeem):
  1) 앞서 redeem 완료 후 앱 재시작
  2) SurveyLanding 진입 시 betaCohort 채워져 있어 invite 박스 안 보임
  3) Continue 바로 활성 → Survey 진입

시나리오 3 (DEV 모드):
  1) route.name === 'DevSurveyLanding' (개발자 화면 진입)
  2) invite 박스 안 보임 → Continue 바로 활성

시나리오 4 (멀티 프로필 모드):
  1) 프로필에서 "가족 추가" → SurveyLanding 진입
  2) multiProfileMode=true → invite 박스 안 보임 → 정상 흐름
```

---

## 완료 판단

```bash
cd CLIR
npx tsc --noEmit                                         # exit 0
grep -n "redeemInvite\|inviteBox\|noticeBody" src/screens/auth/SurveyLandingScreen.tsx
# 3개 모두 grep hit
```
