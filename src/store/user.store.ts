import { create } from 'zustand';
import { UserStore, User, Profile, MemberProfile, MemberProfileInput, MemberProfileUpdate } from '../types';
import { signOut as authSignOut, submitSurvey, restoreSession } from '../services/auth.service';
import {
  updateLanguage as apiUpdateLanguage,
  listMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../services/user.service';
import { setActiveProfileId } from '../lib/api';
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

function memberToProfile(m: MemberProfile): Profile {
  return {
    id: m.id, name: m.name, profileImage: m.profileImage,
    allergyProfile: m.allergyProfile, dietaryRestrictions: m.dietaryRestrictions,
    sensitivityLevel: m.sensitivityLevel,
  };
}
function profileToMemberInput(p: Omit<Profile, 'id'>): MemberProfileInput {
  return {
    name: p.name, profileImage: p.profileImage,
    allergyProfile: p.allergyProfile, dietaryRestrictions: p.dietaryRestrictions,
    sensitivityLevel: p.sensitivityLevel,
  };
}

/**
 * MainNavigator(바텀 네비게이션) 노출 조건 = 로그인 완료 + 설문 완료.
 * RootNavigator 의 Main/Auth 분기와 스플래시의 tuck(로고→스캔버튼) 진행 여부가
 * 항상 동일 기준을 쓰도록 단일화. false 면 Auth 플로우(약관·로그인)라 바텀 네비가 없음.
 */
export function selectIsLoggedIn(currentUser: User): boolean {
  return currentUser.id !== '' && currentUser.hasCompletedSurvey !== false;
}

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
    const restored = await restoreSession();
    if (restored) {
      get().setUser(restored);
    }

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

    // 로그인/복원 시 활성 프로필은 항상 메인으로 초기화 (X-Active-Profile-Id 헤더 해제).
    setActiveProfileId(null);
    set(state => ({
      currentUser: normalized,
      activeProfile: normalized,
      enabledProfileIds: [],
      profileVersion: state.profileVersion + 1,
    }));

    // BE 멤버 프로필 목록 동기화 (fire-and-forget).
    void get().loadMultiProfiles();
  },

  logout: () => {
    // Supabase 세션 + 로컬 토큰 정리 (실패해도 스토어는 반드시 초기화)
    void authSignOut();
    setActiveProfileId(null);   // X-Active-Profile-Id 헤더 해제
    set(state => ({
      currentUser: { ...EMPTY_USER, language: state.currentUser.language },
      activeProfile: EMPTY_PROFILE,
      enabledProfileIds: [],
    }));
  },

  toggleProfileEnabled: (profileId: string) => {
    // BE 는 X-Active-Profile-Id 헤더로 "단일 활성 프로필 전환"을 지원한다.
    // 멤버 토글 = 그 멤버로 전환(헤더 set), 다시 누르면 메인 복귀(헤더 clear).
    // 헤더가 모든 판정 엔드포인트(analysis/scan-history/products/favorites/search)에
    // 주입되므로 스캔·List·History 가 전부 활성 프로필 기준으로 재판정된다.
    const isActive = get().enabledProfileIds.includes(profileId);
    const nextActiveId = isActive ? null : profileId;
    setActiveProfileId(nextActiveId);              // X-Active-Profile-Id 헤더 갱신
    set(state => ({
      enabledProfileIds: nextActiveId ? [nextActiveId] : [],   // 단일 활성 (BE 는 단일 프로필)
      profileVersion: state.profileVersion + 1,
    }));
    // 프로필 전환 = 이전 프로필 기준 캐시 무효화 → 다음 진입 시 재조회·재판정.
    useScanStore.getState().clearHistory();
    useListStore.getState().markFavoritesDirty();
  },

  updateActiveProfile: (updates: Partial<Profile>) => {
    set(state => ({
      activeProfile: { ...state.activeProfile, ...updates },
    }));
    // 안전망: allergyProfile / sensitivityLevel / dietaryRestrictions 가 바뀌면
    // history·favorites 의 BE 재판정 결과를 다시 받아야 한다. 이 메서드를 BE 동기화
    // 없이 사용하는 호출처(예: optimistic update before syncActiveProfile 완료)에서도
    // 캐시가 stale 임을 자동으로 인식하도록 보장.
    const touchesJudgment =
      'allergyProfile' in updates ||
      'sensitivityLevel' in updates ||
      'dietaryRestrictions' in updates;
    if (touchesJudgment) {
      set(state => ({ profileVersion: state.profileVersion + 1 }));
      useScanStore.getState().clearHistory();
      useListStore.getState().markFavoritesDirty();
    }
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

  loadMultiProfiles: async () => {
    if (!get().currentUser.id) return;
    try {
      const members = await listMembers();
      set(state => ({
        currentUser: { ...state.currentUser, multiProfiles: members.map(memberToProfile) },
      }));
    } catch (err) {
      if (__DEV__) console.warn('[user.store] loadMultiProfiles 실패:', err);
    }
  },

  addMultiProfile: async (profile) => {
    const created = await createMember(profileToMemberInput(profile));
    const next = memberToProfile(created);
    set(state => ({
      currentUser: { ...state.currentUser, multiProfiles: [...state.currentUser.multiProfiles, next] },
    }));
    return next;
  },

  updateMultiProfile: async (profileId, updates) => {
    const updated = await updateMember(profileId, updates as MemberProfileUpdate);
    const next = memberToProfile(updated);
    set(state => ({
      currentUser: {
        ...state.currentUser,
        multiProfiles: state.currentUser.multiProfiles.map(p => (p.id === profileId ? next : p)),
      },
    }));
    if (get().enabledProfileIds.includes(profileId)) {
      set(state => ({ profileVersion: state.profileVersion + 1 }));
      useScanStore.getState().clearHistory();
      useListStore.getState().markFavoritesDirty();
    }
  },

  deleteMultiProfile: async (profileId) => {
    await deleteMember(profileId);
    const wasEnabled = get().enabledProfileIds.includes(profileId);
    if (wasEnabled) setActiveProfileId(null);   // 활성 멤버 삭제 → 메인 복귀 (헤더 해제)
    set(state => ({
      currentUser: {
        ...state.currentUser,
        multiProfiles: state.currentUser.multiProfiles.filter(p => p.id !== profileId),
      },
      enabledProfileIds: state.enabledProfileIds.filter(id => id !== profileId),
    }));
    if (wasEnabled) {
      set(state => ({ profileVersion: state.profileVersion + 1 }));
      useScanStore.getState().clearHistory();
      useListStore.getState().markFavoritesDirty();
    }
  },

  setMultiProfileMode: (active: boolean, name = '') => {
    set({ multiProfileMode: active, multiProfileName: name });
  },
}));
