import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { logout } from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SettingsDelete'>;
};

const CONFIRM_PHRASE = '회원 탈퇴';

export default function SettingsDeleteScreen({ navigation }: Props) {
  const setUser = useUserStore(s => s.setUser);
  const [input, setInput] = useState('');

  const canDelete = input === CONFIRM_PHRASE;

  const handleDelete = () => {
    Alert.alert(
      '최종 확인',
      '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await logout().catch(() => {});
            setUser({
              id: '',
              email: '',
              name: '',
              allergyProfile: [],
              dietaryRestrictions: [],
              sensitivityLevel: 'normal',
              language: 'ko',
              multiProfiles: [],
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>회원 탈퇴</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningTitle}>탈퇴 전 확인해주세요</Text>
          <Text style={styles.warningText}>
            계정 삭제 시 다음 데이터가 영구적으로 삭제됩니다:{'\n\n'}
            • 스캔 이력{'\n'}
            • 즐겨찾기 목록{'\n'}
            • 장보기 목록{'\n'}
            • 개인화 설정 및 멀티 프로필{'\n\n'}
            삭제된 데이터는 복구할 수 없습니다.
          </Text>
        </View>

        <Text style={styles.confirmLabel}>
          탈퇴하려면 아래에 <Text style={styles.confirmPhrase}>"{CONFIRM_PHRASE}"</Text>를 입력하세요
        </Text>
        <TextInput
          style={styles.confirmInput}
          value={input}
          onChangeText={setInput}
          placeholder={CONFIRM_PHRASE}
          placeholderTextColor={Colors.textSecondary}
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.deleteBtn, !canDelete && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!canDelete}
          activeOpacity={0.8}>
          <Text style={[styles.deleteBtnText, !canDelete && styles.deleteBtnTextDisabled]}>
            회원 탈퇴
          </Text>
        </TouchableOpacity>
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

  warningBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  warningEmoji: { fontSize: 36 },
  warningTitle: { fontSize: 18, fontWeight: '700', color: Colors.danger },
  warningText: { fontSize: 14, color: Colors.text, lineHeight: 22 },

  confirmLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  confirmPhrase: { fontWeight: '700', color: Colors.danger },
  confirmInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.separator,
    marginBottom: 20,
  },

  deleteBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteBtnDisabled: { backgroundColor: Colors.separator },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtnTextDisabled: { color: Colors.textSecondary },
});
