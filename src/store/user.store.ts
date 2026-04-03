import { create } from 'zustand';
import { User, Profile, SensitivityLevel } from '../types';
import { getCurrentUser } from '../services/auth.service';

const GUEST_PROFILE: Profile = {
  id: '',
  name: '',
  allergyProfile: [],
  dietaryRestrictions: [],
  sensitivityLevel: 'normal' as SensitivityLevel,
};

interface UserStore {
  currentUser: User;
  activeProfile: Profile;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  switchProfile: (profileId: string) => void;
}

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
      if (!multi) {
        return {};
      }
      return { activeProfile: multi };
    }),
}));
