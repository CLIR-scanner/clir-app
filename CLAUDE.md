# CLIR

식품 바코드/OCR 스캔 → 성분 분석 → 알러지·식이 프로필 대조 → 개인화 위협 판정
전체 화면 구조·데이터 엔티티·MVP Scope: docs/ia.md (CLIR_demo/docs/ia.md)
작업 현황: tasks/todo.md | 실수 로그: tasks/lessons.md

## 런타임: Expo SDK 54 + RN 0.81.5
- 실행: `npx expo start` → Expo Go 앱에서 QR 스캔
- 빌드 검증: `npx tsc --noEmit` (src/**/*.ts, *.tsx 수정 후 필수)
- 카메라: `expo-camera` 사용 — `react-native-vision-camera` 사용 금지 (Expo Go 미지원)

## 개발 모드: Mock 우선 (백엔드 미정)
백엔드 스택 확정 전까지 프론트가 블로킹되지 않도록 Mock 모드로 완전 독립 개발.
API 확정 시 src/services/ 구현부만 교체 — 화면 코드는 건드리지 않음.

## Rules (코드·패키지에서 추론 불가한 규칙만)

### TypeScript
- `any` 금지. 타입은 src/types/index.ts 에만 추가.
- 새 화면 추가 시 해당 *ParamList 에 반드시 등록.

### Service Layer (src/services/)
- 함수 시그니처 FROZEN. 구현부만 교체 가능. simplify 포함 어떤 도구도 시그니처 변경 금지.
- 파일 상단 `// TODO: Real API 연동 시 이 파일의 구현부만 교체` 주석 유지.
- Real API 전환: 백엔드 엔드포인트 확정 시 서비스 파일 단위로 독립 교체.

### Mock Data (src/mocks/)
- API 응답과 동일한 shape 유지.
- 화면 컴포넌트에서 mocks/ 직접 import 금지. 반드시 services/ 경유.

### Navigation
- 경로명은 docs/ia.md 기준 고정.

### 패키지 추가 규칙
- 새 패키지는 반드시 `npx expo install <패키지>` 사용 (npm install 금지).
- Expo Go 호환 여부 확인 후 설치: https://docs.expo.dev/versions/latest/
