import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalName'>;
};

export default function PersonalNameScreen({ navigation }: Props) {
  const currentUser = useUserStore(s => s.currentUser);
  const activeProfileId = useUserStore(s => s.activeProfile.id);
  const setUser = useUserStore(s => s.setUser);
  const switchProfile = useUserStore(s => s.switchProfile);
  const [name, setName] = useState(currentUser.name);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('이름 필요', '이름을 입력해주세요.');
      return;
    }
    // PersonalNameScreen은 메인 유저의 이름을 변경하는 화면이므로
    // 활성 프로필(multi-profile)과 무관하게 메인 유저를 직접 갱신한다.
    setUser({ ...currentUser, name: trimmed });
    // setUser resets activeProfile to currentUser; restore the previously active profile
    // if a multi-profile was selected before the name change.
    if (activeProfileId !== currentUser.id) {
      switchProfile(activeProfileId);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이름 변경</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>저장</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력하세요"
          placeholderTextColor={Colors.textSecondary}
          maxLength={30}
          autoFocus
        />
        <Text style={styles.hint}>변경된 이름은 프로필에 바로 반영됩니다.</Text>
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
  saveBtn: { fontSize: 16, fontWeight: '600', color: Colors.primary },

  content: { padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.separator,
    marginBottom: 12,
  },
  hint: { fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 4 },
});
