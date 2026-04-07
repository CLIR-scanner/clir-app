import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListStackParamList, FavoriteItem } from '../../types';
import { removeFavorite } from '../../services/list.service';
import { useUserStore } from '../../store/user.store';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'Favorites'>;
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function FavoritesScreen({ navigation }: Props) {
  const currentUserId = useUserStore(s => s.currentUser.id);
  const favorites = useListStore(s => s.favorites);
  const storeRemoveFavorite = useListStore(s => s.removeFavorite);

  const handleRemove = (item: FavoriteItem) => {
    Alert.alert(
      '즐겨찾기 삭제',
      `"${item.product.name}"을(를) 즐겨찾기에서 삭제하시겠습니까?`,
      [
        { text: Strings.cancel, style: 'cancel' },
        {
          text: Strings.delete,
          style: 'destructive',
          onPress: async () => {
            storeRemoveFavorite(item.id);
            await removeFavorite(currentUserId, item.id).catch(() => {});
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const riskColor = RISK_COLOR[item.product.riskLevel];
    const riskBg = RISK_BG[item.product.riskLevel];

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productEmoji}>⭐</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
            <Text style={styles.productBrand}>{item.product.brand}</Text>
            <Text style={styles.addedAt}>{formatDate(item.addedAt)} 추가</Text>
            {item.memo.length > 0 && (
              <Text style={styles.memo} numberOfLines={1}>📝 {item.memo}</Text>
            )}
          </View>
          <View style={styles.rightCol}>
            <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
              <Text style={[styles.riskText, { color: riskColor }]}>
                {RISK_LABEL[item.product.riskLevel]}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.removeBtnText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.listFavorites}</Text>
        <View style={{ width: 52 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyText}>{Strings.listEmpty}</Text>
          <Text style={styles.emptySubText}>
            스캔 또는 검색 후 즐겨찾기에 추가해보세요
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
  },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  productImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: { fontSize: 22 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  addedAt: { fontSize: 12, color: Colors.textSecondary },
  memo: { fontSize: 12, color: Colors.primary, marginTop: 4 },

  rightCol: { alignItems: 'flex-end', gap: 8 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnText: { fontSize: 13, color: Colors.danger },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
