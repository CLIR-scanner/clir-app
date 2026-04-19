import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL 또는 EXPO_PUBLIC_SUPABASE_ANON_KEY 미설정. 소셜 로그인 동작 불가.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Expo Go 런타임엔 WebCrypto(crypto.subtle)가 없어 PKCE가 plain으로 폴백되고
    // 교환 단계에서 실패 가능. Dev Build 전까지는 implicit 플로우 사용.
    flowType: 'implicit',
    detectSessionInUrl: false,
    persistSession: false,
    autoRefreshToken: true,
  },
});
