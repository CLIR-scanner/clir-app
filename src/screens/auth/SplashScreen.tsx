import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import ClirLogo from '../../components/common/ClirLogo';
type Nav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    let cancelled = false;
    // 1.5s 스플래시 후 항상 AuthHome(로그인 화면)으로 진입.
    // 약관 동의는 더 이상 앱 실행 직후가 아니라 로그인 버튼을 눌렀을 때 노출된다.
    const timer = setTimeout(() => {
      if (!cancelled) navigation.replace('AuthHome');
    }, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <ClirLogo width={80} height={47} />
      </View>
      <ActivityIndicator color="#1C3A19" style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFFFD',
    paddingBottom: 40,
  },
  logoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  indicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
});
