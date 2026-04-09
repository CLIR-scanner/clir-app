import { create } from 'zustand';
import { UserStore, User, Profile } from '../types';

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
  language: 'ko',
  multiProfiles: [],
};

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: EMPTY_USER,
  activeProfile: EMPTY_PROFILE,
  isInitialized: false,

  initialize: async () => {
    // TODO: 저장된 토큰으로 세션 복원

    // ─── DEV ONLY ────────────────────────────────────────────────────────────
    // 담당자 A가 실제 로그인 흐름(auth.service → setUser)을 완성하면 이 블록 삭제.
    // 목적: 담당자 B가 auth 구현을 기다리지 않고 스캔/즐겨찾기 화면을 바로 테스트.
    const DEV_USER: User = {
      id: 'dev-user-001',
      name: '테스트 유저',
      email: 'dev@clir.app',
      language: 'ko',
      allergyProfile: ['ing-peanut', 'ing-dairy'],
      dietaryRestrictions: ['vegan'],
      sensitivityLevel: 'strict',
      multiProfiles: [],
    };
    set({ currentUser: DEV_USER, activeProfile: DEV_USER, isInitialized: true });
    return;
    // ─────────────────────────────────────────────────────────────────────────

    set({ isInitialized: true });
  },

  setUser: (user: User) => {
    set({ currentUser: user, activeProfile: user });
  },

  logout: () => {
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
