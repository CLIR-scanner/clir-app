# F4 — ScanFeedbackBar 컴포넌트 + ScanResultScreen 통합

**의존**: F1 (`ScanResult` ParamList 의 `scanLogId`), F2 (`submitScanFeedback`)
**산출**: `CLIR/src/components/common/ScanFeedbackBar.tsx` 신규 + `CLIR/src/screens/scan/ScanResultScreen.tsx` 1줄 import + 1곳 삽입
**예상 시간**: 45분
**검증**: `npx tsc --noEmit` + 수동 시나리오 2종

---

## 무엇을 만드는가

ScanResult 화면 verdict 표시 영역에 **👍 / 👎 1탭 피드백 버튼** 을 추가한다. 사용자가 스캔 결과가 도움됐는지 즉시 한 번 답할 수 있게.

조건:
- `route.params.scanLogId` 가 있을 때만 버튼 표시 (없으면 `null` 반환)
- 한 번 클릭 시 즉시 비활성 + "Thanks for the feedback" 표시 (재클릭 X)
- 호출 실패해도 사용자 흐름 막지 않음 (silent fail + UI 상태 동일하게 진행)

---

## 변경 1: 신규 컴포넌트 파일

파일: `CLIR/src/components/common/ScanFeedbackBar.tsx`

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { submitScanFeedback } from '../../services/scan.service';

// 베타 v1 — 1탭 피드백. scanLogId 가 있을 때만 표시.
// 영어 inline (i18n v1.1 deferred). 참조: closed-beta/README.md "공통 규칙 #2"

interface Props {
  scanLogId?: string;
}

export default function ScanFeedbackBar({ scanLogId }: Props) {
  const [submitted, setSubmitted] = useState<'helpful' | 'notHelpful' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!scanLogId) return null;

  async function send(helpful: boolean) {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      await submitScanFeedback(scanLogId!, helpful);
      setSubmitted(helpful ? 'helpful' : 'notHelpful');
    } catch {
      // 실패해도 사용자 흐름 막지 않음 — UX 우선.
      setSubmitted(helpful ? 'helpful' : 'notHelpful');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.thanks}>Thanks for the feedback</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => send(true)}
        disabled={submitting}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>👍 Helpful</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => send(false)}
        disabled={submitting}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>👎 Not helpful</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnText: {
    color: '#F9FFF3',
    fontSize: 13,
    fontWeight: '600',
  },
  thanks: {
    color: '#F9FFF3',
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
```

색상은 ScanResultScreen 의 dark camera 배경(#1A0800) 위에서 잘 보이도록 흰색 계열 + 반투명. ScanResult 외 다른 화면에서 쓸 일 없으므로 `common/` 안 두되 컴포넌트 자체는 self-contained.

---

## 변경 2: ScanResultScreen 통합

파일: `CLIR/src/screens/scan/ScanResultScreen.tsx`

### 2-1. import 추가

기존 import 블록 끝에 추가:

```typescript
import ScanFeedbackBar from '../../components/common/ScanFeedbackBar';
```

### 2-2. 컴포넌트에서 `scanLogId` 받기

기존:
```typescript
const { productId, fromHistory, ocrProduct } = route.params;
```

변경:
```typescript
const { productId, fromHistory, ocrProduct, scanLogId } = route.params;
```

### 2-3. ScanFeedbackBar 삽입 위치

ScanResult 화면의 verdict 결과 카드 (큰 원 / verdict 라벨) 가 표시되는 영역 *바로 아래* 에 끼워넣는다. 정확한 위치는 ScanResultScreen 의 return JSX 안에서 verdict 카드 컴포넌트 다음 라인:

```tsx
{/* 기존 verdict 표시 영역 */}
<View style={...}>...</View>

{/* 신규: 1탭 피드백 */}
<ScanFeedbackBar scanLogId={scanLogId} />
```

ScanResultScreen 은 약 509 라인이므로 코드 작업자가 verdict 카드 위치를 직접 찾아 삽입한다. 어림짐작 대신 다음 grep 으로 위치 확정:

```bash
grep -n "CIRCLE_D\|verdict\|riskLevel" CLIR/src/screens/scan/ScanResultScreen.tsx | head -20
```

verdict 원 (`CIRCLE_D = 152`) 을 그리는 `<View>` 직후에 `<ScanFeedbackBar />` 한 줄.

---

## scanLogId 가 어디서 오는가 (현재 vs 향후)

- **현재**: ScanResult 화면으로 navigate 하는 호출처가 `scanLogId` 를 전달하지 않음 (검색·이력에서 진입). 따라서 *피드백 버튼이 표시되지 않음* — 이게 정상.
- **향후 (별도 task)**: OCR 흐름 통합 시 `OCRCaptureScreen` / `ScanScreen` 이 `recognizeIngredients()` 결과의 `ocrResult.scanLogId` 를 `navigation.navigate('ScanResult', { ..., scanLogId })` 로 전달하면 자동으로 버튼 표시.

이 task 에서는 *컴포넌트와 ParamList 통로* 만 깔아둠. 호출처 갱신은 OCR 흐름 정리 task (별도) 에서.

---

## 하지 말 것

- ScanResultScreen 의 다른 부분 수정 (오직 import 1줄 + params 디스트럭처 1줄 + JSX 1줄)
- `comment` 입력란 추가 (베타 v1 은 1탭만)
- 진입 즉시 자동 helpful=true 호출 (사용자 의도 시그널 사라짐)
- `react-native-haptic-feedback` 같은 신규 패키지 도입 (`npx expo install` 추가 작업 발생)
- 피드백 실패 시 alert 띄우기 (silent fail — UX 우선)
- 피드백 보낸 후에도 버튼 다시 보이게 (한 번만 — 재입력 X)

---

## 수동 시나리오 검증

```
시나리오 1 (scanLogId 있음 — OCR 흐름 통합 후):
  1) OCR 캡처 → ScanResult 진입 (scanLogId 전달됨)
  2) verdict 표시 + 그 아래 👍/👎 버튼
  3) 👍 클릭 → 버튼 사라지고 "Thanks for the feedback" 표시
  4) BE: scan_logs.helpful = true 갱신 확인 (Supabase SQL editor)

시나리오 2 (scanLogId 없음 — 기존 검색·이력 진입):
  1) 검색 결과 → ScanResult 진입 (scanLogId 없음)
  2) verdict 표시, 피드백 영역 자체가 안 보임 (null 반환)
```

---

## 완료 판단

```bash
cd CLIR
npx tsc --noEmit                                                        # exit 0
ls src/components/common/ScanFeedbackBar.tsx                            # 파일 존재
grep -n "ScanFeedbackBar" src/screens/scan/ScanResultScreen.tsx
# import 1줄 + JSX 사용 1줄
```
