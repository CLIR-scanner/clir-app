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

파일: `CLIR/src/screens/auth/SurveyLandingScreen.tsx` (현 215 줄 — **통째 교체 X. 기존 화면에 surgical patch**)

> ⚠️ 이 task 의 초안 (~107 줄 inline 영어로 통째 교체) 은 화면이 100 줄대였던 시점 기준이었음. 그 사이 다음이 추가됐고 *반드시 보존* 해야 함:
> - `useTranslation` + 6 곳 i18n 키 (`survey.landingTitle`, `survey.languageTitle`, `survey.languageSubtitle`, `survey.skip`, `survey.processing`, `common.continue`, `common.error`) — 6 로케일 모두 번역됨
> - `SUPPORTED_LANGUAGES.map` 언어 선택 블록 (Splash 후 첫 진입의 언어 변경 동선)
> - `handleSkip` 의 `await AuthService.submitSurvey({})` + `fetchMe()` 동기화 (skip 시 `hasCompletedSurvey: true` 가 서버에 박혀야 재로그인 시 메인탭 직행)
> - Strict Nav/Route 타입 (`NativeStackNavigationProp<AuthStackParamList,'SurveyLanding'>`) — CLAUDE.md "any 금지"

따라서 신규 요소 (invite 게이트 + notices + Continue disable) 만 *보존된 화면 위에 추가* 한다. README §공통규칙 #2 의 "베타 v1 영어 inline 예외" 는 *신규* 카피에만 적용 — 기존 i18n 호출은 그대로 둔다.

---

## 변경 1 — import 보강

기존 import 블록 끝에 다음 추가:

```typescript
import { TextInput, ActivityIndicator } from 'react-native';   // 기존 import 에 합쳐도 됨
import { useState } from 'react';                              // React 의 useState
import { redeemInvite } from '../../services/auth.service';
import { ApiError } from '../../lib/api';
```

`React`, `View`/`Text`/`StyleSheet`/`TouchableOpacity`/`Alert` 는 이미 import 됨 — 중복 X.

---

## 변경 2 — hook + state 추가

기존 hook 블록 끝 (`const [loading, setLoading] = React.useState(false);` 다음):

```typescript
const currentUser = useUserStore(s => s.currentUser);

// 베타 게이트: betaCohort null/빈 배열 → invite 입력 필요.
// DEV/멀티프로필 모드는 자동 통과. BE 0005 마이그레이션으로 BetaCohort[] | null.
const hasCohort = (currentUser.betaCohort?.length ?? 0) > 0;
const needsInvite = !isDevMode && !multiProfileMode && !hasCohort;

const [inviteCode, setInviteCode] = useState('');
const [inviteState, setInviteState] = useState<{
  submitting: boolean;
  error?: string;
  success?: string;
}>({ submitting: false });
```

---

## 변경 3 — `handleRedeem` 함수 추가

`handleSelectLanguage` 위 또는 아래에 추가:

```typescript
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
```

---

## 변경 4 — `handleContinue` 에 게이트 가드 한 줄

기존:
```typescript
function handleContinue() {
  navigation.navigate('Survey', params);
}
```

다음으로 변경:
```typescript
function handleContinue() {
  if (needsInvite) return;   // invite 통과 전에는 진행 X
  navigation.navigate('Survey', params);
}
```

`handleSkip` 은 *건드리지 않는다* — 기존 `submitSurvey({})` + `fetchMe()` 동기화 그대로.

---

## 변경 5 — JSX: title 다음에 invite 박스 (조건부)

기존 (`SurveyLandingScreen.tsx:75-77`):
```tsx
<Text style={styles.title}>
  {t('survey.landingTitle')}
</Text>
```

다음으로 변경:
```tsx
<Text style={styles.title}>
  {t('survey.landingTitle')}
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
      style={[styles.redeemButton, inviteState.submitting && styles.buttonDisabled]}
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
```

---

## 변경 6 — JSX: 언어 블록 다음, footer 위에 notices 2 줄 (항상 표시)

기존 body `</View>` (line 102) 의 *직전* (즉 languageBlock `</View>` 닫힘 다음) 에 추가:

```tsx
{/* 베타 v1 안내 — 영양 미지원 + 의학적 조언 부정 (i18n v1.1 deferred — README §공통규칙 #2) */}
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
```

---

## 변경 7 — Continue 버튼 비활성화 조건

기존 (`SurveyLandingScreen.tsx:116-118`):
```tsx
<TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
  <Text style={styles.continueText}>{t('common.continue')}</Text>
</TouchableOpacity>
```

다음으로 변경:
```tsx
<TouchableOpacity
  style={[styles.continueButton, needsInvite && styles.buttonDisabled]}
  onPress={handleContinue}
  disabled={needsInvite}
  activeOpacity={0.8}
>
  <Text style={styles.continueText}>{t('common.continue')}</Text>
</TouchableOpacity>
```

`buttonDisabled: { opacity: 0.4 }` 는 이미 styles 에 정의돼 있어 재사용.

---

## 변경 8 — styles 보강 (추가만, 기존 변경 X)

기존 `StyleSheet.create({...})` 블록 끝에 다음 키 추가:

```typescript
inviteBox: {
  marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#EAF1E2', gap: 8,
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
redeemText: { fontSize: 15, fontWeight: '700', color: '#F9FFF3' },
errorText: { color: '#B0421F', fontSize: 13, marginTop: 4 },
successText: { color: '#1C3A19', fontSize: 13, fontWeight: '700', marginTop: 4 },
notices: { paddingHorizontal: 22, paddingVertical: 12, gap: 8 },
noticeBody: { fontSize: 11, color: '#5A6B58', lineHeight: 15 },
```

기존 `body.paddingTop: 106` 등 다른 값은 *건드리지 않는다*.

---

## 디자인 메모

- 색상은 기존 화면 토큰 재사용 (`#1C3A19` / `#F9FFF3` / `#556C53`). 신규 토큰 도입 X.
- `inviteBox` 배경 `#EAF1E2` 는 cream 보다 약간 짙은 톤 — 입력 영역임을 시각적으로 구분.
- 기존 `body.paddingTop: 106` + 언어 블록까지의 여백 유지. invite 박스가 추가되면 자연스럽게 스크롤 (현 화면이 ScrollView 가 아니지만, invite + 언어 블록 둘 다 보일 정도의 세로 여유는 있음 — 실측 후 필요 시 외부 ScrollView 로 감싸기).
- Notices 는 footer 바로 위, `fontSize: 11 + lineHeight: 15` 로 작고 부드럽게.

---

## 보존되어야 하는 것 (건드리지 않음)

- `useTranslation` + 모든 i18n 키 호출 (`t('survey.landingTitle')`, `t('survey.languageTitle')`, `t('survey.languageSubtitle')`, `t('survey.skip')`, `t('survey.processing')`, `t('common.continue')`, `t('common.error')`)
- `SUPPORTED_LANGUAGES.map` 언어 선택 블록 + `handleSelectLanguage`
- `handleSkip` 안의 `AuthService.submitSurvey({...})` + `AuthService.fetchMe()` 동기화 + `loading` state
- Strict Nav/Route 타입 (`NativeStackNavigationProp` / `RouteProp`)
- 기존 styles 키 (`buttonDisabled`, `body.paddingTop` 등 모든 값)

---

## 하지 말 것

- 파일 통째 교체 (i18n / 언어 블록 / submitSurvey 동기화 회귀)
- `useNavigation<any>()` / `useRoute<any>()` (CLAUDE.md "any 금지")
- 기존 i18n 키 호출을 inline 영어로 *교체* (신규 카피에만 inline 영어 허용)
- `ParamList` 또는 `ia.md` 변경 (게이트는 *기존 화면 안* 에 끼워넣기만)
- 새 navigation 추가 (예: BetaInvite 화면 분리)
- DEV ONLY 블록 우회 로직 추가 (이 task 는 DEV 모드 자동 통과만 제공)
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

# 보존 확인 (회귀 방지)
grep -c "useTranslation\|SUPPORTED_LANGUAGES\|AuthService.submitSurvey" src/screens/auth/SurveyLandingScreen.tsx
# ≥ 3 — i18n / 언어 블록 / skip 동기화 모두 살아 있음

# any 금지 룰 확인
! grep -n "useNavigation<any>\|useRoute<any>" src/screens/auth/SurveyLandingScreen.tsx
# 매치 0건이어야 통과
```
