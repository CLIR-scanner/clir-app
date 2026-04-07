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
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SettingsPrivacy'>;
};

export default function SettingsPrivacyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>최종 업데이트: 2026년 3월 31일</Text>

        {[
          { title: '1. 수집하는 개인정보', body: '앱 사용 시 이메일, 이름, 알러지 프로필 및 스캔 이력이 수집됩니다.' },
          { title: '2. 정보의 이용 목적', body: '수집된 정보는 개인화된 알러지 분석 및 추천 서비스 제공에만 사용됩니다.' },
          { title: '3. 정보의 보관 및 보호', body: '개인정보는 암호화하여 안전하게 보관하며, 법령에서 정한 기간 동안 보관합니다.' },
          { title: '4. 제3자 제공', body: '법령에 의한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.' },
          { title: '5. 문의', body: '개인정보 관련 문의는 고객 상담을 통해 접수해주세요.' },
        ].map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
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

  content: { padding: 16 },
  date: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
});
