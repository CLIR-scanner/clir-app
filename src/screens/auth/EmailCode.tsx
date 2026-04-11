import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'EmailCode'>;
type Route = RouteProp<AuthStackParamList, 'EmailCode'>;

const CODE_LENGTH   = 6;
const TIMER_SECONDS = 60;

export default function EmailCodeScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { t } = useTranslation();
  const { name, email, password } = route.params;

  const [code, setCode]               = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds]         = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!timerActive) return;
    if (seconds === 0) { setTimerActive(false); return; }
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds, timerActive]);

  function handleChange(text: string, index: number) {
    const char = text.slice(-1);
    const next = [...code];
    next[index] = char;
    setCode(next);
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (char && index === CODE_LENGTH - 1) {
      Keyboard.dismiss();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleResend() {
    if (timerActive) return;
    setCode(Array(CODE_LENGTH).fill(''));
    setSeconds(TIMER_SECONDS);
    setTimerActive(true);
    inputRefs.current[0]?.focus();
  }

  function handleContinue() {
    const entered = code.join('');
    if (entered.length < CODE_LENGTH) {
      Alert.alert(t('emailCode.errorCode'));
      return;
    }
    navigation.navigate('Survey', { name, email, password });
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timerLabel = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{'←'}</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.title}>{t('emailCode.title')}</Text>
        <Text style={styles.subtitle}>
          {t('emailCode.subtitle')}{'\n'}
          <Text style={styles.emailBold}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => { inputRefs.current[i] = ref; }}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{t('emailCode.didntGet')}</Text>
          <TouchableOpacity onPress={handleResend} disabled={timerActive}>
            <Text style={[styles.resendLink, timerActive && styles.resendDisabled]}>
              {t('emailCode.resend')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.resendText}>{t('emailCode.inTimer')}{timerLabel}</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.tryAnother}>
            {t('emailCode.goBack')}
            <Text style={styles.tryAnotherLink}>{t('emailCode.tryAnother')}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 22, color: Colors.black },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28, fontWeight: '700', color: Colors.black,
    textAlign: 'center', lineHeight: 36, marginBottom: 16,
  },
  subtitle: {
    fontSize: 14, color: Colors.gray500,
    textAlign: 'center', lineHeight: 20, marginBottom: 36,
  },
  emailBold: { fontWeight: '700', color: Colors.black },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeBox: {
    width: 46, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, textAlign: 'center',
    fontSize: 20, fontWeight: '600', color: Colors.black,
  },
  codeBoxFilled: { borderColor: Colors.black },
  footer: { alignItems: 'center', gap: 10 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 13, color: Colors.gray500 },
  resendLink: {
    fontSize: 13, fontWeight: '700', color: Colors.black, textDecorationLine: 'underline',
  },
  resendDisabled: { color: Colors.gray300, textDecorationLine: 'none' },
  tryAnother: { fontSize: 13, color: Colors.gray500 },
  tryAnotherLink: { fontWeight: '700', color: Colors.black, textDecorationLine: 'underline' },
  continueButton: {
    backgroundColor: Colors.white, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center', marginTop: 16, width: '100%',
  },
  continueText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
