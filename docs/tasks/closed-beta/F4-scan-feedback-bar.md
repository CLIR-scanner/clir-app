# F4 — ScanFeedbackBar 컴포넌트 + ScanScreen / OCRCaptureScreen 통합

**의존**: F2 (`submitScanFeedback`)
**산출**: `CLIR/src/components/common/ScanFeedbackBar.tsx` 신규 + `CLIR/src/screens/scan/ScanScreen.tsx` 통합 + `CLIR/src/screens/scan/OCRCaptureScreen.tsx` 통합
**예상 시간**: 1시간 (45분 → 1h, 통합 지점 2곳으로 확장)
**검증**: `npx tsc --noEmit` + 수동 시나리오 3종

---

## 무엇을 만드는가

OCR 결과 sheet 안에 **👍 / 👎 1탭 피드백 버튼** 을 추가한다. 사용자가 스캔 결과가 도움됐는지 즉시 한 번 답할 수 있게.

조건:
- `scanLogId` prop 이 있을 때만 버튼 표시 (없으면 `null` 반환)
- 한 번 클릭 시 즉시 비활성 + "Thanks for the feedback" 표시 (재클릭 X)
- 네트워크 실패는 silent — 사용자 흐름 막지 않음
- **단 401 (UnauthorizedError) 만 예외**: 재던져서 상위 화면이 로그인 화면으로 redirect (CLAUDE.md "401 처리 패턴")

> ⚠️ **통합 위치 — `ScanResultScreen` 가 *아니다*.**
> `grep -rn "navigate.*'ScanResult'" CLIR/src/` → 0 건. ScanResultScreen 은 ScanNavigator 에 등록만 되어 있고 도달 가능한 entry point 가 없는 dead route. 실제 OCR 결과 UX 는:
> - `ScanScreen.tsx` 의 inline overlay sheet (`scanResult` state + `sheetY` Animated)
> - `OCRCaptureScreen.tsx` 의 result sheet (`ocrProduct` state + `sheetAnim`)
> 두 곳에 ScanFeedbackBar 를 추가해야 사용자가 실제로 보게 됨. 바코드 흐름은 `scan_logs` row 가 없어 `scanLogId` undefined → 자연스럽게 안 보임 (의도된 동작).

---

## 변경 1: 신규 컴포넌트 파일

파일: `CLIR/src/components/common/ScanFeedbackBar.tsx`

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { submitScanFeedback } from '../../services/scan.service';
import { UnauthorizedError } from '../../lib/api';

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
    } catch (err) {
      // 401 은 silent 처리 X — 상위 화면이 로그인으로 보내야 함 (CLAUDE.md "401 처리 패턴").
      if (err instanceof UnauthorizedError) throw err;
      // 그 외 네트워크 에러는 silent fail — UX 우선.
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

## 변경 2-A: OCRCaptureScreen 통합

파일: `CLIR/src/screens/scan/OCRCaptureScreen.tsx`

### 2-A-1. import 추가

기존 import 블록 끝에 한 줄:
```typescript
import ScanFeedbackBar from '../../components/common/ScanFeedbackBar';
```

### 2-A-2. scanLogId state 추가

기존 (`OCRCaptureScreen.tsx:124-129` 부근):
```typescript
const [ocrProduct, setOcrProduct]   = useState<Product | null>(null);
```

다음으로 변경:
```typescript
const [ocrProduct, setOcrProduct]   = useState<Product | null>(null);
const [scanLogId, setScanLogId]     = useState<string | undefined>(undefined);
```

### 2-A-3. recognizeIngredients 결과에서 scanLogId 보존

기존 (`OCRCaptureScreen.tsx:168` 부근):
```typescript
const ocrResult = await recognizeIngredients(targetUri);
const beProductId = ocrResult.productId;
```

다음으로 변경:
```typescript
const ocrResult = await recognizeIngredients(targetUri);
const beProductId = ocrResult.productId;
setScanLogId(ocrResult.scanLogId);   // OCR 결과의 scanLogId 를 sheet 내 피드백 버튼으로 전달
```

`OCRResult.scanLogId?: string` 은 이미 FE `types/index.ts:92` 에 정의돼 있음.

### 2-A-4. handleReset 에서 초기화

기존 (`OCRCaptureScreen.tsx:261` 부근):
```typescript
setOcrProduct(null);
```

다음으로 변경 (한 줄 추가):
```typescript
setOcrProduct(null);
setScanLogId(undefined);
```

### 2-A-5. result sheet 안에 ScanFeedbackBar 삽입

기존 (`OCRCaptureScreen.tsx:443-454`) — `Alternatives — Bad only` 블록:
```tsx
{hasAlts && (
  <View style={styles.altsSection}>
    ...
  </View>
)}
```

다음으로 변경 (alternatives 블록 *다음*, sheet 닫는 `</Animated.View>` *직전*):
```tsx
{hasAlts && (
  <View style={styles.altsSection}>
    ...
  </View>
)}

{/* 베타 v1 — 1탭 피드백 (scanLogId 있을 때만 표시) */}
<ScanFeedbackBar scanLogId={scanLogId} />
```

---

## 변경 2-B: ScanScreen 통합 (OCR 모드)

파일: `CLIR/src/screens/scan/ScanScreen.tsx`

ScanScreen 은 바코드/OCR 토글이 한 화면에 있고 결과를 inline overlay sheet 로 보여줌. OCR 모드의 `recognizeIngredients()` 결과만 scanLogId 를 가짐 — 바코드 흐름은 자연스럽게 미표시.

### 2-B-1. import 추가

기존 import 블록 끝에 한 줄:
```typescript
import ScanFeedbackBar from '../../components/common/ScanFeedbackBar';
```

### 2-B-2. scanResult state 에 scanLogId 추가

기존 (`ScanScreen.tsx:104`):
```typescript
const [scanResult, setScanResult] = useState<{ product: Product; analysis: AnalysisResult } | null>(null);
```

다음으로 변경:
```typescript
const [scanResult, setScanResult] = useState<{ product: Product; analysis: AnalysisResult; scanLogId?: string } | null>(null);
```

### 2-B-3. showOverlay signature 확장

기존 (`ScanScreen.tsx:191-193`):
```typescript
function showOverlay(product: Product, analysis: AnalysisResult) {
  const currentFavs = useListStore.getState().favorites;
  setScanResult({ product, analysis });
```

다음으로 변경:
```typescript
function showOverlay(product: Product, analysis: AnalysisResult, scanLogId?: string) {
  const currentFavs = useListStore.getState().favorites;
  setScanResult({ product, analysis, scanLogId });
```

### 2-B-4. processOCRPhoto 에서 scanLogId 전달

기존 (`ScanScreen.tsx:394` 부근, processOCRPhoto 끝):
```typescript
showOverlay(product, analysis);
```

다음으로 변경:
```typescript
showOverlay(product, analysis, ocrResult.scanLogId);
```

`processBarcode` 의 `showOverlay(product, analysis);` (line 307) 는 그대로 둔다 — 바코드 흐름은 scanLogId 없음 → undefined 가 자동으로 전달돼 피드백 버튼 안 보임.

### 2-B-5. result sheet 안에 ScanFeedbackBar 삽입

기존 (`ScanScreen.tsx:810-812`):
```tsx
{!isSafe && (
  <RiskAlternatives alternatives={scanResult.product.alternatives} />
)}
```

다음으로 변경 (RiskAlternatives 다음, sheet 닫는 `</Animated.View>` 직전):
```tsx
{!isSafe && (
  <RiskAlternatives alternatives={scanResult.product.alternatives} />
)}

{/* 베타 v1 — 1탭 피드백 (OCR 결과 = scanLogId 있을 때만 표시) */}
<ScanFeedbackBar scanLogId={scanResult.scanLogId} />
```

---

## 하지 말 것

- **`ScanResultScreen` 에 ScanFeedbackBar 끼워넣기** — dead route 라 사용자가 도달 못 함. ScanScreen + OCRCaptureScreen 의 result sheet 가 정답.
- `catch{}` 로 모든 에러 삼키기 — `UnauthorizedError` 만은 재던져야 401 redirect 동작 (CLAUDE.md 패턴).
- `comment` 입력란 추가 (베타 v1 은 1탭만)
- 진입 즉시 자동 helpful=true 호출 (사용자 의도 시그널 사라짐)
- `react-native-haptic-feedback` 같은 신규 패키지 도입 (`npx expo install` 추가 작업 발생)
- 피드백 실패 시 alert 띄우기 (401 외엔 silent fail — UX 우선)
- 피드백 보낸 후에도 버튼 다시 보이게 (한 번만 — 재입력 X)
- 바코드 흐름에 강제로 scanLogId 채워넣기 (`scan_logs` row 가 OCR 전용이라 fake id 보내면 BE 404 / 본인 row 검증 실패)

---

## 수동 시나리오 검증

```
시나리오 1 (OCR 흐름 — OCRCaptureScreen):
  1) OCRCaptureScreen 진입 → 사진 촬영 → 분석 완료
  2) result sheet 안에 product row + alternatives + 그 아래 👍/👎 버튼
  3) 👍 클릭 → 버튼 사라지고 "Thanks for the feedback" 표시
  4) BE: scan_logs.helpful = true 갱신 확인 (Supabase SQL editor)

시나리오 2 (OCR 흐름 — ScanScreen 의 OCR 토글):
  1) ScanScreen 에서 OCR 모드로 전환 → 사진 촬영 → 분석 완료
  2) inline overlay sheet 안에 product row + (위험 시 alternatives) + 그 아래 👍/👎 버튼
  3) 👎 클릭 → 버튼 사라지고 "Thanks for the feedback" 표시
  4) BE: scan_logs.helpful = false 갱신 확인

시나리오 3 (바코드 흐름):
  1) ScanScreen 에서 바코드 모드 → 바코드 스캔 → 분석 완료
  2) inline overlay sheet 표시. **피드백 영역 안 보임** (scanLogId undefined)

시나리오 4 (401 토큰 만료):
  1) 백그라운드에서 토큰 만료
  2) OCR 결과 sheet 에서 👍 클릭 → submitScanFeedback 이 UnauthorizedError throw
  3) ScanFeedbackBar 가 throw 재전파 → 상위 화면이 catch (또는 ErrorBoundary) → clearAuthToken + 로그인으로 reset
```

---

## 완료 판단

```bash
cd CLIR
npx tsc --noEmit                                                        # exit 0
ls src/components/common/ScanFeedbackBar.tsx                            # 파일 존재
grep -n "ScanFeedbackBar" src/screens/scan/ScanScreen.tsx \
                          src/screens/scan/OCRCaptureScreen.tsx
# 각 파일 2 hit (import + JSX)

# 401 재던짐 패턴 확인
grep -n "UnauthorizedError" src/components/common/ScanFeedbackBar.tsx
# import + instanceof 체크 2 hit

# dead route 에 잘못 끼워넣지 않았는지 확인
! grep -n "ScanFeedbackBar" src/screens/scan/ScanResultScreen.tsx
# 매치 0건이어야 통과
```
