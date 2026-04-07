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
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SettingsConsult'>;
};

export default function SettingsConsultScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>고객 상담</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>💬</Text>
          <Text style={styles.infoTitle}>고객 상담</Text>
          <Text style={styles.infoText}>
            운영 시간: 평일 09:00 - 18:00{'\n\n'}
            이메일: support@clir.app{'\n\n'}
            평균 응답 시간: 24시간 이내
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
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  infoEmoji: { fontSize: 48 },
  infoTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  infoText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
