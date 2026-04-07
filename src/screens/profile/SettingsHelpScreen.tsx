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
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SettingsHelp'>;
};

const FAQ = [
  {
    q: '바코드가 인식되지 않아요',
    a: '밝은 환경에서 바코드를 평평하게 펼쳐 스캔해보세요. 바코드가 구겨지거나 반사가 심한 경우 인식이 어려울 수 있습니다.',
  },
  {
    q: '알러지 정보가 정확한가요?',
    a: '성분 데이터는 공개 데이터베이스 및 제조사 정보를 기반으로 합니다. 의료적 판단은 전문가와 상담하시기 바랍니다.',
  },
  {
    q: '멀티 프로필은 어떻게 사용하나요?',
    a: '프로필 탭 → 멀티 프로필에서 가족 구성원의 프로필을 추가할 수 있습니다. 스캔 시 활성 프로필 기준으로 분석됩니다.',
  },
];

export default function SettingsHelpScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>도움말</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>자주 묻는 질문</Text>
        {FAQ.map((item, idx) => (
          <View key={idx} style={styles.faqCard}>
            <Text style={styles.faqQ}>Q. {item.q}</Text>
            <Text style={styles.faqA}>{item.a}</Text>
          </View>
        ))}

        <Text style={styles.contactHint}>
          추가 문의는 고객 상담을 이용해주세요.
        </Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  faqQ: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  faqA: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  contactHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
