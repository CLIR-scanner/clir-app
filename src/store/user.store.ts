import { create } from 'zustand';
import { User, Profile, SensitivityLevel, UserStore } from '../types';
import { getCurrentUser } from '../services/auth.service';

const GUEST_PROFILE: Profile = {
  id: '',
  name: '',
  allergyProfile: [],
  dietaryRestrictions: [],
  sensitivityLevel: 'normal' as SensitivityLevel,
};

const GUEST_USER: User = { ...GUEST_PROFILE, email: '', language: 'ko', multiProfiles: [] };

export const useUserStore = create<UserStore>(set => ({
  currentUser: GUEST_USER,
  activeProfile: GUEST_PROFILE,
  isInitialized: false,

  initialize: async () => {
    const user = await getCurrentUser();
    set({ currentUser: user, activeProfile: user, isInitialized: true });
  },

  setUser: user =>
    set({ currentUser: user, activeProfile: user }),

  switchProfile: profileId =>
    set(state => {
      if (profileId === state.currentUser.id) {
        return { activeProfile: state.currentUser };
      }
      const multi = state.currentUser.multiProfiles.find((p: Profile) => p.id === profileId);
      if (!multi) return {};
      return { activeProfile: multi };
    }),

  updateActiveProfile: updates =>
    set(state => {
      // 초기화 전(guest 상태) 에는 store를 변경하지 않음
      if (!state.isInitialized) return {};
      const updatedProfile = { ...state.activeProfile, ...updates };
      const isMainProfile = state.activeProfile.id === state.currentUser.id;
      return {
        activeProfile: updatedProfile,
        currentUser: isMainProfile
          ? { ...state.currentUser, ...updates }
          : {
              ...state.currentUser,
              multiProfiles: state.currentUser.multiProfiles.map((p: Profile) =>
                p.id === state.activeProfile.id ? { ...p, ...updates } : p
              ),
            },
      };
    }),
}));
