import {User} from '../types';

export const mockUser: User = {
  id: 'user-demo',
  email: 'demo@clir.app',
  name: '데모 유저',
  allergyProfile: ['ing-peanut', 'ing-milk'],
  dietaryRestrictions: [],
  sensitivityLevel: 'strict',
  language: 'ko',
  multiProfiles: [
    {
      id: 'profile-child',
      name: '아이',
      allergyProfile: ['ing-peanut', 'ing-milk', 'ing-wheat'],
      dietaryRestrictions: [],
      sensitivityLevel: 'strict',
    },
  ],
};
