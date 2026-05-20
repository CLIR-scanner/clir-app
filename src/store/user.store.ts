import { create } from 'zustand';
import { UserStore, User, Profile } from '../types';
import { signOut as authSignOut, submitSurvey, restoreSession } from '../services/auth.service';
import { setAuthToken } from '../lib/api';
import { updateLanguage as apiUpdateLanguage } from '../services/user.service';
import { languageStorage } from '../lib/storage';
import i18n from '../i18n';
import { useScanStore } from './scan.store';
import { useListStore } from './list.store';
import { DEFAULT_LANGUAGE } from '../constants/languages';

const EMPTY_PROFILE: Profile = {
  id: '',
  name: '',
  allergyProfile: [],
  dietaryRestrictions: [],
  sensitivityLevel: 'normal',
};

const EMPTY_USER: User = {
  ...EMPTY_PROFILE,
  email: '',
  language: DEFAULT_LANGUAGE,
  multiProfiles: [],
  consentFlags: { imageRetention: false, corrections: false },
};

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: EMPTY_USER,
  activeProfile: EMPTY_PROFILE,
  isInitialized: false,
  // 0 = 미초기화. setUser 가 처음 호출되면 1 부터 시작 → 첫 mount 시점의 dep 변화로 fetch 트리거.
  profileVersion: 0,
  enabledProfileIds: [],
  hasExplicitLanguage: false,
  multiProfileMode: false,
  multiProfileName: '',

  initialize: async () => {
    // AsyncStorage 에 저장된 언어를 *isInitialized=true 이전에* 하이드레이트 →
    // 첫 렌더부터 올바른 언어로 표시 (스플래시 중에 i18n 동기화 완료).
    const stored = await languageStorage.read();
    if (stored) {
      // i18n 도 즉시 동기 — App.tsx 의 useEffect 가 fire 하기 전 시점.
      try { await i18n.changeLanguage(stored); } catch { /* swallow */ }
      set(state => ({
        currentUser: { ...state.currentUser, language: stored },
        hasExplicitLanguage: true,
      }));
    }
    // ─── DEV ONLY ─── (BE 복구 후 이 블록 전체 삭제 + 아래 restoreSession 흐름 부활 — grep "DEV ONLY")
    // 로그인 과정 건너뛰기: OAuth flow 우회, mock token + mock user 강제 주입.
    // __DEV__ 가드 없이 무조건 — production build 에 박히면 실사용자가 mock 으로 보임. 출시 전 반드시 제거.
    setAuthToken('dev-mock-token');
    const devUser: User = {
      id: 'dev-user-id',
      email: 'dev@clir.app',
      name: 'Dev User',
      displayName: null,
      allergyProfile: ['ing-peanut', 'ing-dairy'],
      dietaryRestrictions: ['vegan'],
      sensitivityLevel: 'strict',
      language: get().currentUser.language || DEFAULT_LANGUAGE,
      multiProfiles: [],
      consentFlags: { imageRetention: false, corrections: false },
      hasCompletedSurvey: false,
      termsAcceptedAt: new Date().toISOString(),
      termsVersion: '1.0',
    };
    get().setUser(devUser);
    // 아래는 BE 복구 후 부활시킬 정상 자동 로그인 흐름 (현재는 dead code):
    // const restored = await restoreSession();
    // if (restored) { get().setUser(restored); }
    // ─── /DEV ONLY ───

    set({ isInitialized: true });
  },

  setUser: (user: User) => {
    const { hasExplicitLanguage, currentUser } = get();
    // 사용자가 이 디바이스에서 언어를 명시 선택했으면 그대로 유지.
    // 그렇지 않으면 BE 의 user.language 채택 + AsyncStorage 에 캐시 (다음 cold start 시 즉시 적용).
    const effectiveLanguage = hasExplicitLanguage
      ? (currentUser.language || DEFAULT_LANGUAGE)
      : (user.language || DEFAULT_LANGUAGE);
    if (!hasExplicitLanguage && user.language) {
      // BE 가 채워준 언어를 디바이스에 캐시 — fire-and-forget.
      void languageStorage.write(user.language);
    }

    const normalized: User = {
      ...user,
      multiProfiles: user.multiProfiles ?? [],
      language: effectiveLanguage,
    };

    set(state => ({
      currentUser: normalized,
      activeProfile: normalized,
      profileVersion: state.profileVersion + 1,
    }));
  },

  logout: () => {
    // Supabase 세션 + 로컬 토큰 정리 (실패해도 스토어는 반드시 초기화)
    void authSignOut();
    set(state => ({
      currentUser: { ...EMPTY_USER, language: state.currentUser.language },
      activeProfile: EMPTY_PROFILE,
    }));
  },

  toggleProfileEnabled: (profileId: string) => {
    set(state => {
      const ids = state.enabledProfileIds;
      return {
        enabledProfileIds: ids.includes(profileId)
          ? ids.filter(id => id !== profileId)
          : [...ids, profileId],
      };
    });
  },

  updateActiveProfile: (updates: Partial<Profile>) => {
    set(state => ({
      activeProfile: { ...state.activeProfile, ...updates },
    }));
  },

  syncActiveProfile: async (updates) => {
    const { activeProfile, currentUser } = get();
    const prevActive = activeProfile;
    const prevUser = currentUser;
    const nextActive: Profile = { ...activeProfile, ...updates };

    // 메인 프로필 편집만 서버로 동기화. 서브 프로필(멀티)은 현재 BE 스키마가 1:1이라 로컬만 반영.
    const isMainProfile = activeProfile.id === currentUser.id;

    set({
      activeProfile: nextActive,
      ...(isMainProfile ? { currentUser: { ...currentUser, ...updates } } : {}),
    });

    if (!isMainProfile) return;

    try {
      await submitSurvey({
        allergyProfile: nextActive.allergyProfile,
        dietaryRestrictions: nextActive.dietaryRestrictions,
        sensitivityLevel: nextActive.sensitivityLevel,
      });
      // 프로필이 바뀌면 BE 가 scan_history 를 재계산하고, GET 경로는 실시간 재판정을
      // 한다. 로컬 캐시(Zustand)는 이전 프로필 기준 결과를 보유하므로 비우고 dirty
      // 로 마킹 → 다음 화면 진입 시 새 프로필 기준으로 재조회되도록 강제.
      useScanStore.getState().clearHistory();          // clearHistory 가 dirty=true
      useListStore.getState().setFavorites([]);
      useListStore.getState().markFavoritesDirty();    // 프로필 변경 = 즐겨찾기 stale
      // profileVersion 증가 — 화면이 dep/ref 로 감지해 재조회 트리거.
      set(state => ({ profileVersion: state.profileVersion + 1 }));
    } catch (err) {
      set({ activeProfile: prevActive, currentUser: prevUser });
      throw err;
    }
  },

  updateUserName: (name: string) => {
    set(state => ({
      currentUser: { ...state.currentUser, name },
      // activeProfile이 메인 유저와 동일한 경우에만 이름 반영
      activeProfile: state.activeProfile.id === state.currentUser.id
        ? { ...state.activeProfile, name }
        : state.activeProfile,
    }));
  },

  updateUserDisplayName: (displayName: string | null) => {
    set(state => ({
      currentUser: { ...state.currentUser, displayName },
    }));
  },

  setLanguage: (language: string) => {
    // 동기: 즉시 store + i18n 갱신. UI 가 멈추지 않게.
    set(state => ({
      currentUser: { ...state.currentUser, language },
      hasExplicitLanguage: true,
    }));
    // i18n 도 즉시 (App.tsx useEffect 의 race 회피 — 호출자가 더 이상 i18n.changeLanguage 직접 호출 안 해도 됨).
    void i18n.changeLanguage(language);
    // 비동기 영속화 — AsyncStorage 가 durable 계층, BE 는 best-effort 미러.
    void languageStorage.write(language);
    void apiUpdateLanguage(language).catch(() => {
      // BE 미구현(404) 또는 네트워크 실패 — 로컬은 이미 저장됨. 다음 setLanguage 호출 또는 재로그인 시 재시도.
    });
  },

  addMultiProfile: (profile: Omit<Profile, 'id'>) => {
    const newProfile: Profile = { ...profile, id: Date.now().toString() };
    set(state => ({
      currentUser: {
        ...state.currentUser,
        multiProfiles: [...state.currentUser.multiProfiles, newProfile],
      },
    }));
  },

  updateMultiProfile: (profileId: string, updates: Partial<Omit<Profile, 'id'>>) => {
    set(state => ({
      currentUser: {
        ...state.currentUser,
        multiProfiles: state.currentUser.multiProfiles.map(p =>
          p.id === profileId ? { ...p, ...updates } : p,
        ),
      },
    }));
  },

  deleteMultiProfile: (profileId: string) => {
    set(state => ({
      currentUser: {
        ...state.currentUser,
        multiProfiles: state.currentUser.multiProfiles.filter(p => p.id !== profileId),
      },
      enabledProfileIds: state.enabledProfileIds.filter(id => id !== profileId),
    }));
  },

  setMultiProfileMode: (active: boolean, name = '') => {
    set({ multiProfileMode: active, multiProfileName: name });
  },
}));
