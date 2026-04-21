const en = {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  tab: {
    scan:      'Scan',
    search:    'Search',
    list:      'List',
    recommend: 'Recommend',
    profile:   'Profile',
  },

  // ── Common ────────────────────────────────────────────────────────────────
  common: {
    save:           'Save',
    cancel:         'Cancel',
    delete:         'Delete',
    confirm:        'Confirm',
    back:           'Back',
    loading:        'Loading...',
    saving:         'Saving...',
    error:          'An error occurred.',
    retry:          'Retry',
    empty:          'No items.',
    continue:       'Continue',
    done:           'Done',
    edit:           'Edit',
    editList:       'Edit list',
    add:            'Add',
    clearAll:       'Clear all',
    selected_one:   '{{count}} selected',
    selected_other: '{{count}} selected',
    currentlyActive:'Currently active',
    tapToSelect:    'Tap to select',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    tagline:              'Worry less, eat clir',
    continueWithGoogle:   'Continue with Google',
    continueWithApple:    'Continue with Apple',
    appleComingSoon:      'Apple Sign-In coming soon',
    loginFailed:          'Login failed. Please try again.',
    signOut:              'Sign out',
    signOutConfirm:       'Are you sure you want to sign out?',
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: {
    title:            'Profile',
    myProfile:        'My Profile',
    sensitivity:      'Sensitivity',
    allergyProfile:   'Allergy Profile',
    noAllergens:      'None',
    settingsSection:  'Settings',
    menuDietary:      'Dietary Restrictions',
    menuSensitivity:  'Sensitivity Settings',
    menuPersonalization: 'Personalization',
    menuFamily:       'Family Profiles',
    menuLanguage:     'Language',
    menuSettings:     'Settings',
  },

  // ── Sensitivity ───────────────────────────────────────────────────────────
  sensitivity: {
    title:       'Sensitivity Settings',
    subtitle:    'Choose how strictly the app filters ingredients based on your allergy profile.',
    strictLabel: 'Strict Mode',
    strictDesc:  'Warns you about ingredients that may contain trace amounts of your allergens (may contain labeling).',
    strictBadge: 'Strict',
    normalLabel: 'Normal Mode',
    normalDesc:  'Only warns you about ingredients that are directly included in the product.',
    normalBadge: 'Normal',
  },

  // ── Dietary Restrictions ──────────────────────────────────────────────────
  dietary: {
    title:    'Dietary Restrictions',
    subtitle: 'Select the ingredients you want to avoid. Changes apply to your active profile.',
    tapRemove:'Tap to remove',
  },

  // ── Multi Profile ─────────────────────────────────────────────────────────
  multiProfile: {
    title:        'Multi Profiles',
    subtitle:     'Switch between profiles to filter food recommendations per person.',
    addProfile:   '+ Add Profile',
    emptyHint:    'No family profiles yet.\nAdd one to get started.',
    badgeMain:    'Main',
    badgeActive:  'Active',
    deleteTitle:  'Delete Profile',
    deleteMsg:    'Are you sure you want to delete "{{name}}"?',
    noAllergens:  'No allergens registered',
    allergenCount_one:   '{{count}} allergen',
    allergenCount_other: '{{count}} allergens',
    strict:       'Strict',
    normal:       'Normal',
  },

  // ── Multi Profile Detail ──────────────────────────────────────────────────
  multiProfileDetail: {
    headerTitle:         'Profile Detail',
    badgeMain:           'Main',
    deleteBtn:           'Delete',
    currentlyActive:     'Currently Active',
    sectionSensitivity:  'Sensitivity',
    modeLabel:           'Mode',
    strictDesc:          'Warns about ingredients that may contain trace amounts of allergens.',
    normalDesc:          'Only warns about ingredients directly included in the product.',
    sectionAllergy:      'Allergy Profile',
    sectionDietary:      'Dietary Restrictions',
    noAllergens:         'No allergens registered.',
    setActive:           'Set as Active Profile',
    notFound:            'Profile not found.',
  },

  // ── Multi Profile Add ─────────────────────────────────────────────────────
  multiProfileAdd: {
    stepNameTitle:    "What's this profile's name?",
    stepNameSubtitle: 'Enter a name for this family member\'s profile.',
    namePlaceholder:  'e.g. Mom, Child, etc.',

    stepDietTitle:    'What best describes this profile?',
    stepDietSubtitle: 'Choose the dietary category that applies.',
    dietAllergy:      'Allergy',
    dietAllergyDesc:  'Has food allergies to manage.',
    dietVegetarian:   'Vegetarian',
    dietVegetarianDesc:'Follows a plant-based diet.',
    dietBoth:         'Both',
    dietBothDesc:     'Has allergies and follows a vegetarian diet.',

    stepSeverityTitle:   'How severe is the allergy?',
    stepSeveritySubtitle:'Understanding severity helps recommend safer ingredients.',
    mild:       'Mild',      mildDesc:     'Minor discomfort or skin reactions.',
    moderate:   'Moderate',  moderateDesc: 'Significant symptoms requiring attention.',
    severe:     'Severe',    severeDesc:   'Risk of anaphylaxis or serious reaction.',

    stepReactionTitle:   'When does the reaction happen?',
    stepReactionSubtitle:'This helps filter ingredients more accurately.',
    immediate:    'Immediate',  immediateDesc:  'Symptoms occur within minutes.',
    delayed:      'Delayed',    delayedDesc:    'Symptoms appear hours later.',
    notSure:      'Not sure',   notSureDesc:    'Reaction timing is unclear.',

    stepAllergyIngrTitle:   'Select allergy categories',
    stepAllergyIngrSubtitle:'Choose the ingredient categories this profile needs to avoid.',
    addCategory:  '+ Add Category',
    tapToRemove:  'Tap to remove',
    modalAllergyTitle:   'Add Allergy Categories',
    modalAllergySubtitle:'Select categories to add to the allergy profile.',
    allAdded:     'All categories already added.',

    stepVegTypeTitle:   'What kind of diet do they follow?',
    stepVegTypeSubtitle:'Choose the option that best matches their eating preferences.',

    stepVeganStrictTitle:   'How strict is the vegan diet?',
    stepVeganStrictSubtitle:'Choose the option that best matches what they avoid.',
    strictVegan:    'Strict Vegan',
    strictVeganDesc:'No lecithin / milk sugar / honey / vitamin D3 / Omega-3',
    flexibleVegan:    'Flexible Vegan',
    flexibleVeganDesc:'Try to avoid lecithin / milk sugar / honey / vitamin D3 / Omega-3',

    stepVegIngrSubtitle:'Based on the diet preference, these ingredients will be excluded from recommendations.',
    modalVegTitle:  'Add to your list',
    modalVegSubtitle:'Choose additional categories to avoid.',
    addItem:        '+ Add',
  },

  // ── Signup ────────────────────────────────────────────────────────────────
  signup: {
    labelName:            'Name',
    labelId:              'ID (Email Address)',
    labelPassword:        'Password',
    placeholderFirstName: 'Enter your First Name',
    placeholderLastName:  'Enter your Last Name',
    placeholderEmail:     'Your Email address',
    placeholderPassword:  'Set your Password',
    placeholderConfirm:   'Confirm your Password',
    errorName:            'Please enter your name.',
    errorEmail:           'Please enter a valid email address.',
    errorPasswordLen:     'Password must be at least 8 characters.',
    errorPasswordMatch:   'Passwords do not match.',
  },

  // ── Email Code ────────────────────────────────────────────────────────────
  emailCode: {
    title:        'Check your email\nfor a code',
    subtitle:     'Please enter the verification code sent to your\nemail address',
    errorCode:    'Please enter all 6 digits of the verification code.',
    didntGet:     "Didn't get the code?  ",
    resend:       'Resend Code',
    inTimer:      '  in  ',
    goBack:       'Go back to ',
    tryAnother:   'Try another email',
  },

  // ── Language ──────────────────────────────────────────────────────────────
  language: {
    title:           'Language',
    deviceDetected:  'Device language detected:',
    deviceBadge:     'Device',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  search: {
    placeholder:    'Search your Product',
    sortBy:         'Sort by',
    sortRelevance:  'Relevance',
    sortSafety:     'Safety',
    sortName:       'Name',
    recentTitle:    'Recent Searches',
    empty:          'No results found',
    loading:        'Searching...',
    filters:        'Filters',
    categories:     'Products Categories',
    safeOnlyLabel:  'Show only safe products for me',
    priceRange:     'Price Range',
    minPrice:       'Min Price',
    maxPrice:       'Max Price',
    apply:          'Apply Filters',
    reset:          'Reset',
  },

  // ── Personal Name / Password ──────────────────────────────────────────────
  personalName: {
    title:                  'Edit Profile',
    sectionName:            'Name',
    saveName:               'Save Name',
    sectionPassword:        'Change Password',
    currentPassword:        'Current Password',
    newPassword:            'New Password',
    confirmPassword:        'Confirm New Password',
    savePassword:           'Change Password',
    placeholderName:        'Enter your name',
    placeholderCurrentPw:   'Current password',
    placeholderNewPw:       'New password (min. 8 characters)',
    placeholderConfirmPw:   'Confirm new password',
    successName:            'Name updated.',
    successPassword:        'Password changed successfully.',
    errorNameEmpty:         'Name cannot be empty.',
    errorCurrentPw:         'Please enter your current password.',
    errorPwLen:             'Password must be at least 8 characters.',
    errorPwMatch:           'Passwords do not match.',
  },
} as const;

export default en;
export type TranslationKeys = typeof en;
