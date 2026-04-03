import {create} from 'zustand';
import {User, Profile} from '../types';
import {mockUser} from '../mocks/user.mock';

interface UserStore {
  currentUser: User;
  activeProfile: Profile;
  setUser: (user: User) => void;
  switchProfile: (profileId: string) => void;
}

export const useUserStore = create<UserStore>(set => ({
  currentUser: mockUser,
  activeProfile: mockUser, // 기본: 본인 프로필

  setUser: user =>
    set({currentUser: user, activeProfile: user}),

  switchProfile: profileId =>
    set(state => {
      if (profileId === state.currentUser.id) {
        return {activeProfile: state.currentUser};
      }
      const multi = state.currentUser.multiProfiles.find(p => p.id === profileId);
      if (!multi) {
        return {};
      }
      return {activeProfile: multi};
    }),
}));
