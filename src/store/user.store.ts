import { create } from 'zustand';
import { UserStore, User, Profile } from '../types';
import { login as authLogin } from '../services/auth.service';

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

    // ─── DEV ONLY (비활성화 중) ───────────────────────────────────────────────
    // 담당자 A가 실제 로그인 흐름(auth.service → setUser)을 완성하면 이 블록 삭제.
    // 목적: 담당자 B가 auth 구현을 기다리지 않고 실제 API로 스캔/즐겨찾기 화면을 바로 테스트.
    // 테스트 계정으로 실제 로그인해 JWT 토큰을 받아옴 (B의 API 호출이 401 나지 않도록).
    // try {
    //   const { user } = await authLogin('clir.test.user@gmail.com', 'testpass123');
    //   set({ currentUser: user, activeProfile: user, isInitialized: true });
    // } catch {
    //   // 네트워크 오프라인 등으로 로그인 실패 시 빈 유저로 초기화
    //   set({ isInitialized: true });
    // }
    // return;
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
