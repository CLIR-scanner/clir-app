# F9 — App Store Connect + Play Console 운영 runbook

베타 빌드 컷 *전* 필수. 콘솔 메타데이터 등록 click-by-click 절차. 코드 변경 0.

**전제 조건**:
- ✅ `https://clir-beta.vercel.app/privacy` 200 OK (waitlist-landing PR #2 머지 후)
- ✅ `https://clir-beta.vercel.app/terms` 200 OK (동일)
- ✅ Apple Developer Program 가입 ($99/년)
- ✅ Google Play Console 가입 ($25 1회)
- ✅ App ID `com.clir.app` Apple Developer Console 등록
- ✅ App Store Connect / Play Console 에서 신규 앱 레코드 생성 완료

---

## A. App Store Connect

### A.1 Privacy Policy URL 등록 (5분)

1. https://appstoreconnect.apple.com → **My Apps** → **CLIR**
2. 좌측 메뉴 → **General** → **App Information**
3. **General Information** 섹션:
   - **Privacy Policy URL**: `https://clir-beta.vercel.app/privacy`
4. 우측 상단 **Save**

**검증**: 페이지 새로고침 시 URL 유지 확인.

---

### A.2 App Privacy 질문지 (30분)

1. 좌측 메뉴 → **App Privacy** → **Get Started**
2. **Data Collection** → "Do you or your third-party partners collect data from this app?" → **Yes**
3. **Data Types** 페이지에서 다음 항목 체크 (privacy.html Section 1 과 일치):

#### Contact Info
- [x] **Email Address**
  - Linked to user: **Yes**
  - Used for tracking: **No**
  - Purposes: **App Functionality** (account creation/login)
- [x] **Name**
  - Linked: Yes / Tracking: No / Purpose: App Functionality

#### Health & Fitness
- [x] **Health** (allergen + dietary restriction profile 이 health-related)
  - Linked: Yes / Tracking: No / Purpose: App Functionality

#### User Content
- [x] **Photos or Videos** (avatar — 선택적, MultiProfile 사진)
  - Linked: Yes / Tracking: No / Purpose: App Functionality
- [x] **Other User Content** (OCR로 촬영한 식품 라벨 이미지)
  - Linked: No (이미지 자체 영구 저장 X — consent_image_retention 동의 시만)
  - Tracking: No
  - Purpose: App Functionality

#### Identifiers
- [x] **User ID**
  - Linked: Yes / Tracking: No / Purpose: App Functionality

#### Usage Data
- [x] **Product Interaction**
  - Linked: No / Tracking: No / Purpose: Analytics
- [x] **Crash Data**
  - Linked: No / Tracking: No / Purpose: App Functionality

#### Diagnostics
- [x] **Performance Data**
  - Linked: No / Tracking: No / Purpose: App Functionality
- [x] **Other Diagnostic Data**
  - Linked: No / Tracking: No / Purpose: App Functionality

#### 미체크 항목 (privacy.html 와 일치)
- ❌ Financial Info — 직접 수집 안 함 (Apple Pay/Stripe 가 처리)
- ❌ Location — 베타 v1 미사용 (privacy.html 에 언급되지만 *현재 화면 동선에 location 권한 요청 없음*. 만약 구현되면 체크)
- ❌ Sensitive Info — 명시적 수집 X
- ❌ Search History / Browsing History
- ❌ Audio Data
- ❌ Contacts

4. 모든 답변 완료 후 **Publish** 클릭

**중요**: 실제 코드 동작과 1:1 일치해야 함. Apple 사후 audit 시 reject 위험.

**검증**: App Privacy 상태 = "Provided" (녹색).

---

### A.3 Custom EULA 업로드 (15분)

Apple Standard EULA 가 본 약관의 *binding arbitration + class action waiver* 와 충돌 가능 → **Custom EULA 필수**.

1. **My Apps** → **CLIR** → 좌측 **App Information**
2. **License Agreement** 섹션 → **Edit**
3. **Custom Agreement** 라디오 선택
4. Agreement Text 영역에 `https://clir-beta.vercel.app/terms` 의 본문 *전체 plain text* 붙여넣기
   - 또는 RTF 업로드 (변환: `pandoc terms.html -o terms.rtf`)
5. **Save**

**중요**: Terms 변경 시마다 *수동 재업로드 필수*. terms.html 만 변경하면 Apple Custom EULA 가 stale 됨.

**검증**: License Agreement = "Custom" 표시.

---

### A.4 Age Rating + Category (10분)

1. **App Information** → **Age Rating** → **Edit**
2. 모든 카테고리에 **None** (CLIR 은 의료·폭력·약물 등 미해당)
3. **Save** → 결과 = **4+** (전 연령) 예상
4. **Category**:
   - Primary: **Food & Drink** 또는 **Health & Fitness**
   - Secondary: 다른 하나

**참고**: Health & Fitness 카테고리는 의료기기 판정 시 추가 검토 트리거 가능 — 약관 4.3 의 "의료기기 아님" 명시로 방어 가능하지만, 첫 베타엔 **Food & Drink** primary 가 안전.

---

## B. Google Play Console

### B.1 Privacy Policy URL 등록 (5분)

1. https://play.google.com/console → **CLIR** 선택
2. 좌측 메뉴 → **Policy** → **App content**
3. **Privacy policy** 섹션 → **Start**
4. URL 입력: `https://clir-beta.vercel.app/privacy`
5. **Save**

**검증**: App content 메뉴에서 Privacy policy = "Provided".

---

### B.2 Data Safety 폼 (45분)

App Store Connect 의 App Privacy 답변과 *완전 일치* 해야 함 (cross-platform consistency).

1. **Policy** → **App content** → **Data safety** → **Start**

#### Q: Does your app collect or share any of the required user data types?
- **Yes**

#### Q: Is all of the user data collected by your app encrypted in transit?
- **Yes** (HTTPS only — Railway BE)

#### Q: Do you provide a way for users to request that their data is deleted?
- **Yes** (privacy.html Section 11 + 인앱 SettingsDelete 화면 — Task 외 별도 구현 필요)

#### Data types 체크 (App Store Connect A.2 와 1:1 매핑):
- **Personal info → Name, Email address, User IDs**: Collected, Not shared, Required
- **Health and fitness**: Collected, Not shared, Required
- **Photos and videos**: Collected, Not shared, Optional (avatar 만)
- **App activity → Product interactions**: Collected, Not shared, Required
- **App info and performance → Crash logs, Diagnostics**: Collected, Not shared, Required

각 항목마다:
- **Why is this user data collected?**: App functionality
- **Is this data processed ephemerally?**: 해당 항목별 Yes/No
- **Is collection of this user data required?**: Required / Optional

2. **Save** → **Submit**

**검증**: Data safety = "Approved" (green checkmark).

---

### B.3 Cross-platform consistency 검증 (10분)

A.2 + B.2 의 답변을 텍스트 파일에 백업해 diff:

```bash
# privacy-answers-apple.txt
# Email: collected, not shared, app functionality
# Name: collected, not shared, app functionality
# ...

# privacy-answers-google.txt
# Personal info > Email: collected, not shared, app functionality
# Personal info > Name: collected, not shared, app functionality
# ...
```

`docs/tasks/closed-beta/privacy-answers/` 폴더에 둘 다 commit. 추후 audit 시 추적 가능.

**의무**: Apple 답변 = Google 답변. 하나라도 거짓이면 두 플랫폼 *둘 다* 제재 위험.

---

## C. 검증 체크리스트

### URL 응답
- [ ] `curl -sI https://clir-beta.vercel.app/privacy` → 200
- [ ] `curl -sI https://clir-beta.vercel.app/terms` → 200

### Apple
- [ ] App Information → Privacy Policy URL = `https://clir-beta.vercel.app/privacy`
- [ ] App Privacy 상태 = "Provided"
- [ ] License Agreement = "Custom"
- [ ] Age Rating = 4+ (또는 합의된 값)
- [ ] Category 설정됨

### Google
- [ ] Policy → App content → Privacy policy = "Provided"
- [ ] Data safety = "Approved"
- [ ] 답변이 Apple App Privacy 와 일치

### 양쪽 일관성
- [ ] `docs/tasks/closed-beta/privacy-answers/apple.txt` + `google.txt` commit 완료
- [ ] 두 파일 diff 의미적으로 일치

---

## D. 운영 절차 (Terms 변경 시)

terms.html 변경 시 *3 곳* 동기 필요:

1. `waitlist-landing/terms.html` 수정 → Vercel auto-deploy ✓
2. **Apple Custom EULA 재업로드** ← 잊기 쉬움 (수동 작업)
3. (Task 7 머지 후) `TERMS_VERSION` build-time 상수 bump → 앱 재배포

→ runbook 또는 PR 템플릿에 체크리스트 추가 권장.

---

## E. 알려진 한계

- **Apple Sign-In 미구현**: AuthHomeScreen 의 Apple 버튼이 throws — F8 의 S3 미해결. 정식 출시 (App Store 리뷰) 전엔 *Apple Sign-In 정식 구현* 또는 *iOS 빌드에서 버튼 숨김* 필수. TestFlight 자체는 통과 가능.
- **Privacy Policy 의 location/notification 항목**: 현재 코드 동선에 *실제로* 사용 안 됨. privacy.html 에 언급된 건 *향후* 사용 가능성. App Privacy 질문지엔 *현재 코드 기준* 답변 (= location 미체크). 향후 location 기능 구현 시 *동시* 갱신 의무.
- **Beta 종료 후**: TestFlight build 는 90일 후 자동 만료. 베타 기간 90일 초과 시 신규 빌드 컷 + 재배포 필요.

---

## 운영자 지정

- App Store Connect / Play Console 작업 책임자: **[지정 필요]**
- Privacy 답변 cross-check 책임자: **[지정 필요]**
- 약관 변경 시 EULA 재업로드 트리거: **[지정 필요]**
