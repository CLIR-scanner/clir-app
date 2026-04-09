# Information Architecture
앱명: [앱명]
업데이트: 2026-03-31

## 앱 개요
식품 바코드/OCR 스캔을 통해 성분을 분석하고,
사용자의 알러지·식이 프로필과 대조해 개인화된 건강 정보를 제공하는 앱

---

## 전체 화면 구조

### 온보딩
- /splash
- /auth                     ← 회원가입/로그인 선택
- /auth/signup              ← 회원가입
- /auth/signup/survey       ← 설문조사 (알러지, 식이제한, 건강목표)
- /auth/login

### 메인 (로그인 후)
로그인 후 5개 탭으로 구성:
- Tab 1: 바코드/사진 스캔
- Tab 2: 검색
- Tab 3: List 리스트
- Tab 4: 추천
- Tab 5: 프로필/설정

---

## Tab 1: 바코드/사진 스캔

### 화면 목록
- /scan                     ← 카메라 스캔 메인
- /scan/result              ← 스캔 결과
- /scan/result/detail       ← 성분 상세 설명
- /scan/history             ← 스캔 이력

### 기능 상세

**스캔 모드 (카메라 스캔)**
- 바코드 스캔: 바코드 API 호출
- OCR 스캔: 텍스트 인식 → 성분 정보 추출
- 듀얼 스캔: 바코드 + OCR 동시 지원

**스캔 결과 화면 (/scan/result)**
- 결과 표시, 주요 성분 표시
- 구매 가능 여부 (예/아니요) → 장보기 모드 연동
- 즐겨찾기 저장
- 사용자 건강 DB ↔ 성분 정보 대조
  - 알러지·식이 프로필과 자동 매핑
  - 개인 위협 판정 UI (민감도 설정: 엄격/일반 모드)
  - 사용자가 직접 민감도를 미세하게 조정하는 기능
  - May contain 분석
- 다국어 번역: 해외 식재료 구매 시 해당 성분의 목적과 부작용 번역
- 대체 제품 추천 (위험 성분 감지 시)
- 먹으면 안 되는 제품 → 대체 제품 제안

**성분 상세 설명 (/scan/result/detail)**
- 성분 탭 시 바텀시트로 상세 설명 표시
- 근거자료 링크 제공 (링크 클릭 시 근거자료로 바로 이동)

**스캔 이력 (/scan/history)**
- 개인 안전 식품 DB 구축 (스캔 이력 자동 축적)
- 동일 카테고리 재구매 시: 이전에 안전했던 유사 제품 추천
  예) 토마토 소스 새로 구매 시, 알러지 유발 성분 감지되면
      이전에 스캔해서 안전했던 다른 토마토 소스 추천
- 히스토리 및 즐겨찾기 조회

---

## Tab 2: 검색

### 화면 목록
- /search                   ← 검색 메인
- /search/result            ← 검색 결과

### 기능 상세

**검색 바 (/search)**
- 검색어 자동완성
- 식품 카테고리 선택
- 특정 성분만 필터링하는 버튼
- 정렬 기준 선택

**검색 결과 (/search/result)**
- 스크롤 목록
- 상세 정보
- 위험 등급 색상 표시
- 즐겨찾기 버튼

---

## Tab 3: List 리스트

### 화면 목록
- /list                       ← 리스트 메인
- /list/favorites             ← My Favorites
- /list/favorites/memo        ← 메모
- /list/favorites/scan-log    ← 스캔 내역 보기
- /list/favorites/all         ← 전체 목록
- /list/shopping              ← Shopping List
- /list/shopping/items        ← 장보기 목록
- /list/shopping/purchase     ← 구매 완료 / 구매 예정 관리

### 기능 상세

**My Favorites**
- 즐겨찾기 목록
- 메모: 직접 스캔한 제품 또는 외부에서 발견한 제품에 메모 추가
- 스캔 내역 보기
- 전체 목록 조회
- 장보기 목록에 담기 버튼

**Shopping List**
- 장보기 목록
- 구매 완료 / 구매 예정 상태 관리
- 장보기 목록 추가 → 알림 기능 연동

---

## Tab 4: 추천

### 화면 목록
- /recommend                  ← 추천 메인
- /recommend/weekend          ← Weekend Popular
- /recommend/similar-users    ← 나와 비슷한 성분을 피하는 사람들의 이번 주 페이보릿

### 기능 상세

**Weekend Popular**
- 주요 카테고리별 인기 제품
- 큐레이션 기반 추천 (알고리즘 추천 아님)

**나와 비슷한 성분을 피하는 사람들의 이번 주 페이보릿**
- 유사 프로필 사용자 기반 추천
- 추후 커뮤니티 기능으로 확장 가능

---

## Tab 5: 프로필/설정

### 화면 목록

**개인정보 설정**
- /profile                        ← 프로필 메인
- /profile/personal               ← 개인정보 설정
- /profile/personal/name          ← 이름 변경
- /profile/personal/email         ← 이메일 변경
- /profile/personal/push          ← 푸시 알림 설정
- /profile/personal/membership    ← 멤버십 관리

**Personalization**
- /profile/personalization              ← 개인화 설정 메인
- /profile/personalization/allergy      ← 식이 제한 관리 (알러지, 식습관, 다이어트)
- /profile/personalization/sensitivity  ← 민감도 설정
- /profile/personalization/related      ← 연관 성분 / 피하기 설정
- /profile/personalization/health-check ← 건강검진 결과 등록 및 정보 관리
- /profile/personalization/band-aid     ← 반응도 설정

**멀티 프로필**
- /profile/multi                  ← 멀티 프로필 메인
- /profile/multi/add              ← 프로필 추가 (가족 등 타인 설정)
- /profile/multi/list             ← 프로필 목록 관리
- /profile/multi/detail           ← 프로필 상세

**기타 설정**
- /profile/language               ← 언어 설정
- /profile/settings               ← 설정 메인
- /profile/settings/help          ← 도움말 및 공식 문서 링크
- /profile/settings/privacy       ← 개인정보 처리방침
- /profile/settings/consult       ← 약사/전문가 상담 연결
- /profile/settings/report        ← 로그아웃
- /profile/settings/delete        ← 계정 삭제

---

## 데이터 엔티티

### User
- id, email, name, profileImage
- allergyProfile: string[]        ← 알러지 목록
- dietaryRestrictions: string[]   ← 식이제한
- sensitivityLevel: 'strict' | 'normal'
- language: string
- multiProfiles: Profile[]

### Product (스캔 결과)
- id, barcode, name, brand
- ingredients: Ingredient[]
- isSafe: boolean                 ← 사용자 프로필 기반 안전 여부
- alternatives: Product[]         ← 대체 제품
- image: string

### Ingredient (성분)
- id, name, nameKo
- description: string
- riskLevel: 'safe' | 'caution' | 'danger'
- sources: string[]               ← 근거자료 링크

### ScanHistory
- id, productId, userId
- scannedAt: Date
- result: 'safe' | 'caution' | 'danger'

### FavoriteItem
- id, productId, userId
- memo: string
- addedAt: Date

### ShoppingItem
- id, productId, userId
- isPurchased: boolean
- addedAt: Date

---

## MVP Scope

### 반드시 포함
1. 알러지/식이 프로필 + 파생 성분 자동 매핑
2. 바코드 + OCR 듀얼 스캔 시스템
3. 개인화 위협 판정 UI + 성분 상세 해설
4. 민감도 설정 (엄격/일반 모드) + 사용자 직접 미세 조정
5. 개인 안전 식품 DB (스캔 이력 자동 축적) + 유사 제품 추천 + 히스토리/즐겨찾기
6. 가족 멀티 프로필 + 프로필 전환
7. 다국어 지원 기능
8. 근거자료 링크 제공
9. 건강검진 결과 / 혈액검사 결과 업로드 → 개인화 고도화
10. 성분 설명 기능 (바텀시트)
11. 요약 결과 제공 (예/아니요 + 설명 + 추천 상품)
12. 대체 제품 추천
13. 즐겨찾기 (자주 사용하는 제품 저장)

### 후순위 (추후 적용)
1. 민감도 설정 → 건강 설정으로 통합 대체
2. 커뮤니티 (지도 기반 식당별 알러지 메뉴 공유) → 제외
3. 다이어트 전용 기능 → 추후 적용
4. 국가별 성분 표시 기준 차이 대응 → 제외