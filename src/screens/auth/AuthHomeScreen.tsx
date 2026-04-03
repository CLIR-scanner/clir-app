import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'AuthHome'>;
};

export default function AuthHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>CLIR</Text>
        </View>
        <Text style={styles.welcome}>{Strings.authWelcome}</Text>
        <Text style={styles.desc}>
          바코드를 스캔하면 내 알러지 프로필에 맞게{'\n'}
          성분을 자동으로 분석해드립니다.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>{Strings.authSignup}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}>
          <Text style={styles.btnSecondaryText}>{Strings.authLogin}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  welcome: { fontSize: 24, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  desc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: { padding: 24, gap: 12 },
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  btnSecondaryText: { color: Colors.text, fontSize: 17, fontWeight: '600' },
});
