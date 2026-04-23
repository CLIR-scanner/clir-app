개발 참고 문서
HOW-TO
CLIR 개발 시작 가이드
코딩을 해본 적 없어도 괜찮습니다.
이 문서를 따라하면 AI가 대신 코드를 작성해줍니다.
1단계: 받은 파일 확인
아래 파일들을 받았는지 확인합니다.
CLIR/                   ← 앱 프로젝트 폴더 (이 폴더 전체)
docs/
  ia.md                 ← 화면 구조 설명서
  api-spec.yaml         ← API 명세서
team/
  fe/CLAUDE.md          ← AI에게 줄 작업 지시서
  member-a/GUIDE.md     ← 담당자 A 전용 안내
  member-b/GUIDE.md     ← 담당자 B 전용 안내
​
2단계: 도구 설치 (둘 중 하나 선택) - 이미 완료되었으면 생략 가능
선택지 A — Claude Code (추천)
터미널(Terminal 앱)에서 아래 명령어를 입력합니다.
npm install -g @anthropic-ai/claude-code
​
설치 후 로그인:
claude
​
처음 실행하면 Anthropic 계정으로 로그인하는 창이 열립니다.
계정이 없으면 claude.ai 에서 먼저 가입합니다.
선택지 B — Cursor
cursor.com 에서 다운로드 후 설치합니다.
VS Code처럼 생긴 코드 편집기입니다.
3단계: CLAUDE.md 파일 배치
4단계: 프로젝트 열기
Claude Code를 쓰는 경우
터미널에서 CLIR 폴더로 이동합니다.
cd 경로/CLIR
claude
​
예시 (Mac):
cd ~/Desktop/CLIR_demo/CLIR
claude
​
Cursor를 쓰는 경우
Cursor 실행
File → Open Folder → CLIR 폴더 선택
오른쪽 상단 채팅 아이콘 클릭 (또는 Cmd+L)
Cursor 추가 설정 (중요)
Cursor는 CLAUDE.md를 자동으로 읽지 않습니다.
아래 방법으로 규칙을 등록해야 합니다.
Cursor 상단 메뉴 → Cursor → Settings → Rules for AI
CLIR/CLAUDE.md 파일 내용을 전체 복사해서 붙여넣기
Save
또는 CLIR 폴더 안에 .cursorrules 파일을 만들고
CLAUDE.md 내용을 그대로 붙여넣어도 됩니다.
5단계: 앱 실행해서 동작 확인
작업 전에 현재 앱이 실행되는지 확인합니다.
터미널에서:
cd CLIR 폴더 경로
npm install
npx expo start --web
​
약 1.5초 후 회색 화면으로 넘어가면 정상입니다.
6단계: AI에게 작업 요청하는 방법
기본 원칙
AI는 지시를 구체적으로 줄수록 좋은 결과를 냅니다.
나쁜 예시:
로그인 화면 만들어줘
​
좋은 예시:
src/screens/auth/LoginScreen.tsx 를 구현해줘.
docs/ia.md 의 /auth/login 화면이야.
이메일과 비밀번호를 입력받고,
auth.service.ts 의 login() 함수를 호출해서 로그인 처리해줘.
성공하면 useUserStore 의 setUser() 로 사용자 정보를 저장해.
​
프롬프트 템플릿
아래 형식을 복사해서 화면 이름과 설명만 바꿔서 씁니다.
[파일명] 을 구현해줘.
docs/ia.md 의 [경로] 화면이야.
[이 화면에서 해야 할 일 설명]
피그마 디자인: [피그마 링크 또는 스크린샷]
​
자주 쓰는 참조 방법
Claude Code에서 파일을 AI에게 직접 보여주려면:
@docs/ia.md 를 참고해서 AuthHomeScreen 만들어줘
​
Cursor에서는:
@docs/ia.md @src/screens/auth/AuthHomeScreen.tsx
위 파일들을 참고해서 AuthHomeScreen 을 구현해줘
​
7단계: 작업 후 확인
화면을 만들 때마다 아래 두 가지를 확인합니다.
타입 오류 확인 (터미널에서):
npx tsc --noEmit
​
아무것도 출력되지 않으면 정상입니다.
앱에서 직접 확인:
npx expo start --web
​
브라우저에서 내가 만든 화면이 보이는지 확인합니다.
자주 묻는 질문
Q. AI가 이상한 코드를 짰어요.
아래 중 하나로 해결합니다.
"이 코드에서 [문제점] 이 있어. 수정해줘" 라고 구체적으로 말한다.
파일을 삭제하고 더 구체적인 지시로 다시 요청한다.
Q. 빨간 줄(에러)이 너무 많아요.
터미널에서 npx tsc --noEmit 실행 결과를 AI에게 그대로 붙여넣고
"이 에러 고쳐줘" 라고 말하면 됩니다.
Q. 다른 팀원이 만든 화면에 영향을 주고 싶지 않아요.
각자 맡은 파일(screens/ 폴더 안 담당 화면)만 수정합니다.
types/index.ts, navigation/, services/, store/ 파일은
혼자 수정하지 말고 팀장에게 먼저 물어봅니다.
Q. Claude Code랑 Cursor 중 어떤 게 더 좋아요?
Claude Code
Cursor
사용 방법
터미널에서 채팅
에디터 안에서 채팅
파일 자동 읽기
CLAUDE.md 자동 읽음
.cursorrules 설정 필요
코드 수정
AI가 직접 수정
AI가 직접 수정
추천 대상
터미널 익숙한 경우
에디터가 편한 경우
둘 다 같은 결과를 만들 수 있습니다. 편한 걸 쓰면 됩니다.
MVP scope 개발 문서 참고
개발자 A(영준)
개발자 B(연승)
담당자 B — 스캔 + 분석 + 즐겨찾기
안녕하세요! 담당자 B는 이 앱의 핵심 기능을 담당합니다.
카메라로 식품을 찍으면 위험 성분을 알려주는 화면,
그리고 스캔 이력과 즐겨찾기 화면입니다.
시작 전에 HOW-TO.md 를 먼저 읽고 환경 설정을 완료해주세요.
담당 화면 목록
아래 순서대로 구현하면 됩니다. 위에서부터 우선순위가 높습니다.
1순위 — 반드시 구현 (MVP 핵심)
화면 파일
설명
src/screens/scan/ScanScreen.tsx
카메라 + 바코드 스캔 메인
src/screens/scan/ScanResultScreen.tsx
분석 결과 + 위협 판정 UI
src/screens/scan/OCRCaptureScreen.tsx
성분표 사진 촬영 (OCR)
src/screens/scan/ScanHistoryScreen.tsx
스캔 이력 목록
src/screens/list/FavoritesScreen.tsx
즐겨찾기 목록
src/screens/list/FavoritesAllScreen.tsx
전체 즐겨찾기
2순위 — 여유 있으면 구현
화면 파일
설명
src/screens/list/ListScreen.tsx
리스트 탭 메인 (즐겨찾기/쇼핑 메뉴)
src/screens/list/ShoppingScreen.tsx
장보기 목록
src/screens/list/ShoppingItemsScreen.tsx
장보기 항목
src/screens/list/FavoritesMemoScreen.tsx
즐겨찾기 메모
src/screens/list/FavoritesScanLogScreen.tsx
제품별 스캔 내역
각 화면 구현 방법
ScanScreen
src/screens/scan/ScanScreen.tsx 를 구현해줘.

카메라로 바코드를 스캔하는 화면이야.
expo-camera 패키지를 사용해. (react-native-vision-camera 사용 금지)

기능:
1. 카메라 권한 요청
2. 바코드 감지 시 scan.service.ts 의 scanBarcode(barcode) 호출
3. 성공하면 ScanResult 화면으로 이동 (productId 전달)
   navigation.navigate('ScanResult', { productId: product.id })
4. 제품을 찾지 못하면 OCRCapture 화면으로 이동 유도
5. 우측 상단에 "이력" 버튼 → ScanHistory 화면으로 이동
6. 화면 하단에 "성분표 촬영(OCR)" 버튼 → OCRCapture 화면으로 이동

로딩 중에는 스캔을 일시 중단해줘.
​
OCRCaptureScreen
src/screens/scan/OCRCaptureScreen.tsx 를 구현해줘.

식품 성분표를 카메라로 찍어서 OCR 처리하는 화면이야.
expo-camera 를 사용해.

useRoute() 로 barcode (optional) 파라미터를 받아.

기능:
1. 카메라 미리보기 표시
2. 촬영 버튼 → 사진 찍기
3. 찍은 사진을 미리보기로 보여주기
4. "분석하기" 버튼 누르면:
   scan.service.ts 의 recognizeIngredients(imageUri) 호출
5. 성공하면 ScanResult 화면으로 이동
   navigation.navigate('ScanResult', { productId: '', ocrProduct: product })
   (ocrProduct 에 OCR 결과로 만든 임시 Product 객체를 넣어줘)
6. 재촬영 버튼도 제공
​
ScanResultScreen
src/screens/scan/ScanResultScreen.tsx 를 구현해줘.
이 화면이 이 앱에서 가장 중요한 화면이야.

useRoute() 로 productId, fromHistory(optional), ocrProduct(optional) 를 받아.

화면 구성:

1. 제품 정보 상단 표시:
   - 제품 이름, 브랜드, 이미지

2. 판정 결과 (크고 눈에 띄게):
   - safe: 초록색 "먹어도 괜찮아요"
   - caution: 주황색 "주의가 필요해요"
   - danger: 빨간색 "먹으면 안 돼요"
   색상은 src/constants/risk.ts 의 RISK_COLOR, VERDICT_COPY 를 사용해.

3. 위험 성분 목록 (triggeredBy):
   - 각 성분 이름과 이유 표시
   - 성분을 탭하면 바텀시트로 상세 설명 표시
     (상세: description, riskLevel, sources 링크)

4. 안전 성분 목록 (safeIngredients):
   - 접을 수 있는 섹션으로 표시

5. 즐겨찾기 버튼 (별표 아이콘):
   - list.service.ts 의 addFavorite(productId) 호출
   - useListStore 의 addFavorite() 로 로컬 상태도 업데이트

6. 대체 제품 추천 (danger/caution 일 때만):
   - scan.service.ts 의 analyzeProduct() 반환값에 있으면 표시

데이터 로드 방법:
- ocrProduct 가 있으면 그걸 바로 사용
- productId 가 있으면 scan.service.ts 의 scanBarcode(productId) 로 조회
- 조회 후 scan.service.ts 의 analyzeProduct({ productId, ingredientIds }) 호출
- fromHistory 가 true 가 아닐 때만 scan.service.ts 의 saveScanHistory() 호출
- saveScanHistory 결과를 useScanStore 의 addHistory() 로 저장

로딩 상태와 에러 상태도 UI 로 표시해줘.
​
ScanHistoryScreen
src/screens/scan/ScanHistoryScreen.tsx 를 구현해줘.

스캔 이력을 최신순으로 보여주는 화면이야.
useScanStore 의 history 를 가져와.

각 이력 항목에 표시할 것:
- 제품 이미지 (없으면 기본 이미지)
- 제품 이름
- 브랜드
- 판정 결과 배지 (safe/caution/danger, 색상 표시)
- 스캔 날짜

항목 탭 시 ScanResult 화면으로 이동:
navigation.navigate('ScanResult', { productId: item.productId, fromHistory: true })

이력이 없을 때는 "아직 스캔한 제품이 없습니다." 메시지 표시.
​
FavoritesScreen
src/screens/list/FavoritesScreen.tsx 를 구현해줘.

즐겨찾기 목록을 보여주는 화면이야.
화면 진입 시 list.service.ts 의 getFavorites() 호출해서
useListStore 의 setFavorites() 로 저장해.
화면에는 useListStore 의 favorites 를 표시해.

각 항목에 표시할 것:
- 제품 이미지
- 제품 이름, 브랜드
- 즐겨찾기 추가 날짜
- 삭제 버튼 → list.service.ts 의 removeFavorite(id) 호출 후
  useListStore 의 removeFavorite(id) 로 로컬도 삭제

항목 탭 시 ScanResult 화면으로 이동.
즐겨찾기가 없으면 "저장된 즐겨찾기가 없습니다." 메시지 표시.
​
FavoritesAllScreen
src/screens/list/FavoritesAllScreen.tsx 를 구현해줘.

전체 즐겨찾기 목록을 그리드 형태로 보여주는 화면이야.
useListStore 의 favorites 를 가져와서 2열 그리드로 표시해.

각 항목:
- 제품 이미지 (정사각형)
- 제품 이름
- 위험도 배지

항목 탭 시 ScanResult 화면으로 이동.
​
서비스 함수 사용법
import * as scanService from '../../services/scan.service';
import * as listService from '../../services/list.service';
import { useScanStore } from '../../store/scan.store';
import { useListStore } from '../../store/list.store';
import { useUserStore } from '../../store/user.store';

// 바코드 스캔 예시
const handleBarcodeScan = async (barcode: string) => {
  try {
    const product = await scanService.scanBarcode(barcode);
    navigation.navigate('ScanResult', { productId: product.id });
  } catch (error) {
    Alert.alert('제품을 찾을 수 없습니다.');
  }
};

// 즐겨찾기 추가 예시
const handleAddFavorite = async (productId: string) => {
  try {
    const item = await listService.addFavorite(productId);
    useListStore.getState().addFavorite(item);
  } catch (error) {
    Alert.alert('즐겨찾기 추가에 실패했습니다.');
  }
};
​
바텀시트 사용법 (성분 상세)
ScanResultScreen 에서 성분을 탭하면 바텀시트가 열려야 합니다.
@gorhom/bottom-sheet 패키지가 설치되어 있습니다.
ScanResultScreen 에 성분 상세 바텀시트를 추가해줘.
@gorhom/bottom-sheet 패키지를 사용해.
성분 목록에서 항목을 탭하면 바텀시트가 열리고
선택한 성분의 description, riskLevel, sources 를 표시해.
sources 는 링크로 표시해서 탭하면 외부 브라우저로 열려야 해.
​
로그인 없이 바로 시작하는 방법
현재 앱을 실행하면 로그인 없이 바로 메인 탭으로 진입합니다.
src/store/user.store.ts 에 개발용 임시 유저가 자동으로 주입되어 있기 때문입니다.
임시 유저 프로필 (테스트 기준):
알러지: 땅콩(ing-peanut), 유제품(ing-dairy)
식이 제한: vegan
민감도: strict (엄격 모드)
이 설정 덕분에 담당자 A의 로그인 구현을 기다리지 않고 스캔/즐겨찾기 화면을 바로 테스트할 수 있습니다.
작업 순서 팁
ScanResultScreen 부터 시작하는 게 좋습니다.
이 앱의 핵심 화면이고, 다른 화면들이 이 화면으로 이동합니다.
처음에는 하드코딩된 mock 데이터로 UI를 먼저 잡아도 됩니다.
ScanScreen — 카메라 연동.
ScanHistoryScreen — 이력 조회.
FavoritesScreen + FavoritesAllScreen.
모르면 이렇게 물어보세요
ScanResultScreen 에서 판정 결과에 따라 다른 색상을 표시하고 싶어.
src/constants/risk.ts 의 RISK_COLOR 를 어떻게 쓰면 돼?
​
expo-camera 로 바코드를 감지하는 코드 예시 보여줘.
onBarcodeScanned 콜백 형태로.
​
@gorhom/bottom-sheet 로 성분 상세 바텀시트 여는 예시 코드 보여줘.
​
