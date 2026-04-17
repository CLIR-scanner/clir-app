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
    // MVP: 토큰은 앱 메모리에만 저장 → 재시작 시 항상 미인증 상태로 시작.
    // 추후 SecureStore에 refresh_token을 저장하면 supabase.auth.setSession()
    // 또는 /auth/me 호출로 세션을 복원하는 분기를 여기에 추가.
    set({ isInitialized: true });
  },

  setUser: (user: User) => {
    set({ currentUser: user, activeProfile: user });
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
