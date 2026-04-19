import { create } from 'zustand';
import { UserStore, User, Profile } from '../types';
import { signOut as authSignOut } from '../services/auth.service';

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
    const normalized: User = { multiProfiles: [], language: 'en', ...user };
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
