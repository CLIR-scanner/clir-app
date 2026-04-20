const ko = {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  tab: {
    scan:      '스캔',
    search:    '검색',
    list:      '리스트',
    recommend: '추천',
    profile:   '프로필',
  },

  // ── Common ────────────────────────────────────────────────────────────────
  common: {
    save:           '저장',
    cancel:         '취소',
    delete:         '삭제',
    confirm:        '확인',
    back:           '뒤로',
    loading:        '불러오는 중...',
    error:          '오류가 발생했습니다.',
    retry:          '다시 시도',
    empty:          '항목이 없습니다.',
    continue:       '계속',
    done:           '완료',
    edit:           '편집',
    editList:       '목록 편집',
    add:            '추가',
    clearAll:       '전체 삭제',
    selected_one:   '{{count}}개 선택됨',
    selected_other: '{{count}}개 선택됨',
    currentlyActive:'현재 적용 중',
    tapToSelect:    '탭하여 선택',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    tagline:          'Worry less, eat clir',
    signIn:           '로그인',
    createAccount:    '새 계정 만들기',
    signOut:          '로그아웃',
    signOutConfirm:   '정말 로그아웃 하시겠어요?',
    email:            '이메일',
    password:         '비밀번호',
    name:             '이름',
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: {
    title:            '프로필',
    myProfile:        '내 프로필',
    sensitivity:      '민감도',
    allergyProfile:   '알러지 프로필',
    noAllergens:      '없음',
    settingsSection:  '설정',
    menuDietary:      '식이 제한',
    menuSensitivity:  '민감도 설정',
    menuPersonalization: '맞춤 설정',
    menuFamily:       '가족 프로필',
    menuLanguage:     '언어',
    menuSettings:     '설정',
  },

  // ── Sensitivity ───────────────────────────────────────────────────────────
  sensitivity: {
    title:       '민감도 설정',
    subtitle:    '알러지 프로필에 따라 앱이 성분을 얼마나 엄격하게 필터링할지 선택하세요.',
    strictLabel: '엄격 모드',
    strictDesc:  '알러겐이 미량 포함될 수 있는 성분(may contain 표기 포함)에 대해서도 경고합니다.',
    strictBadge: '엄격',
    normalLabel: '일반 모드',
    normalDesc:  '제품에 직접 포함된 성분에 대해서만 경고합니다.',
    normalBadge: '일반',
  },

  // ── Dietary Restrictions ──────────────────────────────────────────────────
  dietary: {
    title:    '식이 제한',
    subtitle: '피하고 싶은 성분을 선택하세요. 현재 활성 프로필에 적용됩니다.',
    tapRemove:'탭하여 삭제',
  },

  // ── Multi Profile ─────────────────────────────────────────────────────────
  multiProfile: {
    title:        '멀티 프로필',
    subtitle:     '프로필을 전환하여 각 가족 구성원에 맞게 음식 추천을 필터링하세요.',
    addProfile:   '+ 프로필 추가',
    emptyHint:    '아직 가족 프로필이 없습니다.\n추가하여 시작해 보세요.',
    badgeMain:    '메인',
    badgeActive:  '활성',
    deleteTitle:  '프로필 삭제',
    deleteMsg:    '"{{name}}" 프로필을 삭제하시겠어요?',
    noAllergens:  '등록된 알러겐 없음',
    allergenCount_one:   '알러겐 {{count}}개',
    allergenCount_other: '알러겐 {{count}}개',
    strict:       '엄격',
    normal:       '일반',
  },

  // ── Multi Profile Detail ──────────────────────────────────────────────────
  multiProfileDetail: {
    headerTitle:         '프로필 상세',
    badgeMain:           '메인',
    deleteBtn:           '삭제',
    currentlyActive:     '현재 활성 중',
    sectionSensitivity:  '민감도',
    modeLabel:           '모드',
    strictDesc:          '알러겐이 미량 포함될 수 있는 성분에 대해서도 경고합니다.',
    normalDesc:          '제품에 직접 포함된 성분에 대해서만 경고합니다.',
    sectionAllergy:      '알러지 프로필',
    sectionDietary:      '식이 제한',
    noAllergens:         '등록된 알러겐이 없습니다.',
    setActive:           '활성 프로필로 설정',
    notFound:            '프로필을 찾을 수 없습니다.',
  },

  // ── Multi Profile Add ─────────────────────────────────────────────────────
  multiProfileAdd: {
    stepNameTitle:    '이 프로필의 이름은 무엇인가요?',
    stepNameSubtitle: '가족 구성원의 프로필 이름을 입력하세요.',
    namePlaceholder:  '예: 엄마, 아이 등',

    stepDietTitle:    '이 프로필을 가장 잘 설명하는 것은?',
    stepDietSubtitle: '해당하는 식이 유형을 선택하세요.',
    dietAllergy:      '알러지',
    dietAllergyDesc:  '관리해야 할 식품 알러지가 있어요.',
    dietVegetarian:   '채식',
    dietVegetarianDesc:'식물성 식품 위주의 식단을 따릅니다.',
    dietBoth:         '둘 다',
    dietBothDesc:     '알러지도 있고 채식도 해요.',

    stepSeverityTitle:   '알러지 심각도는 어느 정도인가요?',
    stepSeveritySubtitle:'심각도를 파악하면 더 안전한 성분을 추천할 수 있어요.',
    mild:       '경증',      mildDesc:     '가벼운 불편감 또는 피부 반응.',
    moderate:   '중등도',    moderateDesc: '주의가 필요한 상당한 증상.',
    severe:     '중증',      severeDesc:   '아나필락시스 또는 심각한 반응 위험.',

    stepReactionTitle:   '반응은 언제 나타나나요?',
    stepReactionSubtitle:'성분을 더 정확하게 필터링하는 데 도움이 됩니다.',
    immediate:    '즉각',    immediateDesc:  '증상이 수 분 내에 나타납니다.',
    delayed:      '지연',    delayedDesc:    '증상이 몇 시간 후에 나타납니다.',
    notSure:      '모름',    notSureDesc:    '반응 시간이 불분명합니다.',

    stepAllergyIngrTitle:   '알러지 카테고리 선택',
    stepAllergyIngrSubtitle:'이 프로필에서 피해야 할 성분 카테고리를 선택하세요.',
    addCategory:  '+ 카테고리 추가',
    tapToRemove:  '탭하여 삭제',
    modalAllergyTitle:   '알러지 카테고리 추가',
    modalAllergySubtitle:'알러지 프로필에 추가할 카테고리를 선택하세요.',
    allAdded:     '모든 카테고리가 이미 추가되었습니다.',

    stepVegTypeTitle:   '어떤 식단을 따르나요?',
    stepVegTypeSubtitle:'식습관에 가장 잘 맞는 옵션을 선택하세요.',

    stepVeganStrictTitle:   '비건 식단의 엄격도는?',
    stepVeganStrictSubtitle:'피하는 항목에 가장 잘 맞는 옵션을 선택하세요.',
    strictVegan:    '엄격한 비건',
    strictVeganDesc:'레시틴 / 유당 / 꿀 / 비타민D3 / 오메가3 불포함',
    flexibleVegan:    '유연한 비건',
    flexibleVeganDesc:'레시틴 / 유당 / 꿀 / 비타민D3 / 오메가3 최대한 기피',

    stepVegIngrSubtitle:'선택한 식단 기준으로 해당 성분들이 추천에서 제외됩니다.',
    modalVegTitle:  '목록에 추가',
    modalVegSubtitle:'추가로 피할 카테고리를 선택하세요.',
    addItem:        '+ 추가',
  },

  // ── Signup ────────────────────────────────────────────────────────────────
  signup: {
    labelName:            '이름',
    labelId:              'ID (이메일 주소)',
    labelPassword:        '비밀번호',
    placeholderFirstName: '이름(First Name)을 입력하세요',
    placeholderLastName:  '성(Last Name)을 입력하세요',
    placeholderEmail:     '이메일 주소를 입력하세요',
    placeholderPassword:  '비밀번호를 설정하세요',
    placeholderConfirm:   '비밀번호를 다시 입력하세요',
    errorName:            '이름을 입력해주세요.',
    errorEmail:           '올바른 이메일 주소를 입력해주세요.',
    errorPasswordLen:     '비밀번호는 8자 이상이어야 합니다.',
    errorPasswordMatch:   '비밀번호가 일치하지 않습니다.',
  },

  // ── Email Code ────────────────────────────────────────────────────────────
  emailCode: {
    title:        '이메일에서\n인증 코드를 확인하세요',
    subtitle:     '아래 이메일 주소로 발송된\n인증 코드를 입력해주세요',
    errorCode:    '인증 코드 6자리를 모두 입력해주세요.',
    didntGet:     '코드를 받지 못하셨나요?  ',
    resend:       '재전송',
    inTimer:      '  후  ',
    goBack:       '돌아가기 ',
    tryAnother:   '다른 이메일 사용',
  },

  // ── Language ──────────────────────────────────────────────────────────────
  language: {
    title:           '언어',
    deviceDetected:  '기기 언어 감지됨:',
    deviceBadge:     '기기',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  search: {
    placeholder:    '제품명 또는 브랜드 검색',
    sortBy:         '보기 필터순',
    sortRelevance:  '관련도순',
    sortSafety:     '안전도순',
    sortName:       '이름순',
    recentTitle:    '최근 검색',
    empty:          '검색 결과가 없습니다',
    loading:        '검색 중...',
    filters:        '필터',
    categories:     '제품 카테고리',
    safeOnlyLabel:  '나에게 안전한 제품만 보기',
    priceRange:     '가격 범위',
    minPrice:       '최소 가격',
    maxPrice:       '최대 가격',
    apply:          '필터 적용',
    reset:          '초기화',
  },

  // ── Personal Name / Password ──────────────────────────────────────────────
  personalName: {
    title:                  '프로필 편집',
    sectionName:            '이름',
    saveName:               '이름 저장',
    sectionPassword:        '비밀번호 변경',
    currentPassword:        '현재 비밀번호',
    newPassword:            '새 비밀번호',
    confirmPassword:        '새 비밀번호 확인',
    savePassword:           '비밀번호 변경',
    placeholderName:        '이름을 입력하세요',
    placeholderCurrentPw:   '현재 비밀번호',
    placeholderNewPw:       '새 비밀번호 (8자 이상)',
    placeholderConfirmPw:   '새 비밀번호 확인',
    successName:            '이름이 변경되었습니다.',
    successPassword:        '비밀번호가 변경되었습니다.',
    errorNameEmpty:         '이름을 입력해주세요.',
    errorCurrentPw:         '현재 비밀번호를 입력해주세요.',
    errorPwLen:             '비밀번호는 8자 이상이어야 합니다.',
    errorPwMatch:           '비밀번호가 일치하지 않습니다.',
  },
} as const;

export default ko;
