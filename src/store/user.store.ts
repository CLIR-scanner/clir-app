import { create } from 'zustand';
import { UserStore, User, Profile } from '../types';
import { signOut as authSignOut, submitSurvey } from '../services/auth.service';
import { useScanStore } from './scan.store';
import { useListStore } from './list.store';

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
  language: 'en',
  multiProfiles: [],
  consentFlags: { imageRetention: false, corrections: false },
};

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: EMPTY_USER,
  activeProfile: EMPTY_PROFILE,
  isInitialized: false,

  initialize: async () => {

    // TODO: 저장된 토큰으로 세션 복원

    set({ isInitialized: true });
  },

  setUser: (user: User) => {


    const normalized: User = { ...user, multiProfiles: user.multiProfiles ?? [], language: user.language ?? 'en' };

    set({ currentUser: normalized, activeProfile: normalized });
  },

  logout: () => {
    // Supabase 세션 + 로컬 토큰 정리 (실패해도 스토어는 반드시 초기화)
    void authSignOut();
    set({ currentUser: EMPTY_USER, activeProfile: EMPTY_PROFILE });
  },

  switchProfile: (profileId: string) => {
    const { currentUser } = get();
    if (profileId === currentUser.id) {
      set({ activeProfile: currentUser });
      return;
    }
    const target = currentUser.multiProfiles.find(p => p.id === profileId);
    if (target) set({ activeProfile: target });
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
      // 한다. 로컬 캐시(Zustand)는 이전 프로필 기준 결과를 보유하므로 무효화해
      // 다음 화면 진입 시 최신 값을 받도록 강제.
      useScanStore.getState().clearHistory();
      useListStore.getState().setFavorites([]);
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

  setLanguage: (language: string) => {
    set(state => ({
      currentUser: { ...state.currentUser, language },
    }));
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
    }));
  },
}));
