import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleContinue() {
    if (firstName.trim().length < 1 || lastName.trim().length < 1) {
      Alert.alert(t('signup.errorName'));
      return;
    }
    if (!email.includes('@')) {
      Alert.alert(t('signup.errorEmail'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('signup.errorPasswordLen'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('signup.errorPasswordMatch'));
      return;
    }
    navigation.navigate('EmailCode', {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email,
      password,
    });
  }

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

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('signup.labelName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.placeholderFirstName')}
              placeholderTextColor={Colors.gray300}
              value={firstName}
              onChangeText={setFirstName}
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder={t('signup.placeholderLastName')}
              placeholderTextColor={Colors.gray300}
              value={lastName}
              onChangeText={setLastName}
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('signup.labelId')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.placeholderEmail')}
              placeholderTextColor={Colors.gray300}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('signup.labelPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.placeholderPassword')}
              placeholderTextColor={Colors.gray300}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('signup.placeholderConfirm')}
              placeholderTextColor={Colors.gray300}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
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
  fields: {
    flex: 1,
    gap: 28,
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
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 40,
  },
  continueButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
