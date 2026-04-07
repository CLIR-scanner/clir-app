import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListStackParamList } from '../../types';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'List'>;
};

export default function ListScreen({ navigation }: Props) {
  const favorites = useListStore(s => s.favorites);
  const shoppingItems = useListStore(s => s.shoppingItems);
  const unpurchasedCount = shoppingItems.filter(s => !s.isPurchased).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.tabList}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Favorites section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>즐겨찾기</Text>

          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}>
            <View style={styles.mainCardLeft}>
              <Text style={styles.mainCardEmoji}>⭐</Text>
              <View>
                <Text style={styles.mainCardTitle}>{Strings.listFavorites}</Text>
                <Text style={styles.mainCardSub}>
                  {favorites.length > 0
                    ? `${favorites.length}개 저장됨`
                    : '저장된 즐겨찾기 없음'}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.subCardRow}>
            <TouchableOpacity
              style={styles.subCard}
              onPress={() => navigation.navigate('FavoritesMemo')}
              activeOpacity={0.7}>
              <Text style={styles.subCardEmoji}>📝</Text>
              <Text style={styles.subCardTitle}>메모</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subCard}
              onPress={() => navigation.navigate('FavoritesScanLog')}
              activeOpacity={0.7}>
              <Text style={styles.subCardEmoji}>📋</Text>
              <Text style={styles.subCardTitle}>스캔 내역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subCard}
              onPress={() => navigation.navigate('FavoritesAll')}
              activeOpacity={0.7}>
              <Text style={styles.subCardEmoji}>📂</Text>
              <Text style={styles.subCardTitle}>전체 보기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shopping section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>장보기</Text>

          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => navigation.navigate('Shopping')}
            activeOpacity={0.7}>
            <View style={styles.mainCardLeft}>
              <Text style={styles.mainCardEmoji}>🛒</Text>
              <View>
                <Text style={styles.mainCardTitle}>{Strings.listShopping}</Text>
                <Text style={styles.mainCardSub}>
                  {unpurchasedCount > 0
                    ? `${unpurchasedCount}개 남음`
                    : shoppingItems.length > 0
                    ? '모두 구매 완료'
                    : '장보기 목록 없음'}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.subCardRow}>
            <TouchableOpacity
              style={[styles.subCard, styles.subCardWide]}
              onPress={() => navigation.navigate('ShoppingItems')}
              activeOpacity={0.7}>
              <Text style={styles.subCardEmoji}>📋</Text>
              <Text style={styles.subCardTitle}>구매 목록</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subCard, styles.subCardWide]}
              onPress={() => navigation.navigate('ShoppingPurchase')}
              activeOpacity={0.7}>
              <Text style={styles.subCardEmoji}>✅</Text>
              <Text style={styles.subCardTitle}>구매 완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },

  content: { padding: 16 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  mainCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mainCardEmoji: { fontSize: 28 },
  mainCardTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  mainCardSub: { fontSize: 13, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textSecondary },

  subCardRow: { flexDirection: 'row', gap: 8 },
  subCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  subCardWide: { flex: 1 },
  subCardEmoji: { fontSize: 24 },
  subCardTitle: { fontSize: 13, fontWeight: '500', color: Colors.text },
});
