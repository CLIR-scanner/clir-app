import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import * as AuthService from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const setUser = useUserStore(s => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      const { user } = await AuthService.login(email.trim(), password);
      setUser(user);
    } catch {
      Alert.alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = !email.trim() || !password || loading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>

        <View style={styles.titleArea}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Enter your email and password to continue.</Text>
        </View>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Your email address"
              placeholderTextColor={Colors.gray300}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={Colors.gray300}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isDisabled}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 32,
  },
  backText: {
    fontSize: 22,
    color: Colors.black,
  },
  titleArea: {
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray500,
    lineHeight: 20,
  },
  fields: {
    flex: 1,
    gap: 24,
  },
  fieldGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.black,
  },
  loginButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 40,
  },
  loginButtonDisabled: {
    opacity: 0.4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
});
