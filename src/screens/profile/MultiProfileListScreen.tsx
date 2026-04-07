import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, Profile } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileList'>;
};

export default function MultiProfileListScreen({ navigation }: Props) {
  const currentUser = useUserStore(s => s.currentUser);
  const all: Profile[] = [currentUser, ...currentUser.multiProfiles];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 목록</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MultiProfileAdd')}>
          <Text style={styles.addBtn}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={all}
        keyExtractor={item => item.id || 'main'}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isMain = index === 0;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                if (!isMain) {
                  navigation.navigate('MultiProfileDetail', { profileId: item.id });
                }
              }}
              disabled={isMain}
              activeOpacity={isMain ? 1 : 0.7}>
              <View style={[styles.avatar, isMain && styles.avatarMain]}>
                <Text style={styles.avatarText}>
                  {item.name ? item.name[0].toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.allergyProfile.length > 0
                    ? `알러지 ${item.allergyProfile.length}개`
                    : '알러지 없음'}
                </Text>
              </View>
              {isMain ? (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>메인</Text>
                </View>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        style={styles.listContainer}
      />
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
  addBtn: { fontSize: 16, color: Colors.primary, fontWeight: '600' },

  listContainer: { backgroundColor: Colors.card, margin: 16, borderRadius: 14 },
  list: {},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 78 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMain: { backgroundColor: Colors.primary },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 13, color: Colors.textSecondary },

  mainBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textSecondary },
});
