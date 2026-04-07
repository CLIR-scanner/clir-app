import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalPush'>;
};

export default function PersonalPushScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>푸시 알림</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🔔</Text>
          <Text style={styles.infoTitle}>푸시 알림 설정</Text>
          <Text style={styles.infoText}>
            푸시 알림 기능은 준비 중입니다.{'\n'}
            곧 업데이트될 예정입니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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

  content: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  infoBox: { alignItems: 'center', gap: 12, padding: 24 },
  infoEmoji: { fontSize: 48 },
  infoTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  infoText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
