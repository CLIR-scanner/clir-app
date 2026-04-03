import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('AuthHome');
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // navigation은 마운트 시 한 번만 실행 — navigation 객체 identity 변화에 타이머를 재시작할 이유 없음
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>CLIR</Text>
        </View>
        <Text style={styles.tagline}>성분을 분석하고{'\n'}안전한 식품을 선택하세요</Text>
      </View>
      <ActivityIndicator color={Colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', gap: 20 },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  spinner: { position: 'absolute', bottom: 60 },
});
