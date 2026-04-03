import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    setError(null);
    navigation.navigate('Survey', {
      name: name.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.authSignup}</Text>
          <View style={{ width: 52 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.progress}>
            <View style={[styles.step, styles.stepActive]} />
            <View style={styles.step} />
          </View>
          <Text style={styles.formTitle}>기본 정보를 입력해주세요</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{Strings.authName}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="홍길동"
              placeholderTextColor={Colors.textSecondary}
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{Strings.authEmail}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{Strings.authPassword}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.btnText}>다음 — 알러지 설정</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              이미 계정이 있으신가요?{' '}
              <Text style={styles.switchTextBold}>{Strings.authLogin}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: { width: 52 },
  backText: { fontSize: 17, color: Colors.primary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },

  form: { flex: 1, padding: 24, gap: 16 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.separator },
  stepActive: { backgroundColor: Colors.primary },
  formTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },

  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.separator,
  },

  errorText: { fontSize: 14, color: Colors.danger },

  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  switchLink: { alignItems: 'center', marginTop: 4 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchTextBold: { color: Colors.primary, fontWeight: '600' },
});
