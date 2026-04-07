import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalizationBandAid'>;
};

export default function PersonalizationBandAidScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>반응도 설정</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🩹</Text>
          <Text style={styles.infoTitle}>반응도 설정 (Band-Aid)</Text>
          <Text style={styles.infoText}>
            개인의 성분 반응 강도를 세밀하게 조정하는 기능입니다.{'\n\n'}
            특정 성분에 대한 민감도를 개인별로 미세 조정하여{'\n'}
            더 정확한 위험 판정을 받을 수 있습니다.{'\n\n'}
            이 기능은 다음 업데이트에서 제공될 예정입니다.
          </Text>
        </View>
      </ScrollView>
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

  content: { flexGrow: 1, padding: 16, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  infoBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  infoEmoji: { fontSize: 48 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  infoText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
