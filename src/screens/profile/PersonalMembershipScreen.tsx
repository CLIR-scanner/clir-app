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
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalMembership'>;
};

export default function PersonalMembershipScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>멤버십</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.planCard}>
          <Text style={styles.planEmoji}>✨</Text>
          <Text style={styles.planTitle}>무료 플랜</Text>
          <Text style={styles.planSub}>현재 이용 중</Text>
        </View>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>무료 플랜 포함 기능</Text>
          {['바코드 스캔 무제한', '성분 분석 및 알러지 판정', '스캔 이력 저장', '즐겨찾기 20개'].map(f => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.comingSoon}>프리미엄 플랜은 준비 중입니다</Text>
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

  content: { padding: 16 },

  planCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  planEmoji: { fontSize: 36 },
  planTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  planSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  featureBox: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  featureTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { fontSize: 16, color: Colors.safe, fontWeight: '700' },
  featureText: { fontSize: 14, color: Colors.text },

  comingSoon: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
