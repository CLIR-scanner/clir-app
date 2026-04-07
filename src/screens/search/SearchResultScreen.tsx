import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SearchStackParamList, Product } from '../../types';
import { searchProducts } from '../../services/search.service';
import { addFavorite } from '../../services/list.service';
import { useUserStore } from '../../store/user.store';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<SearchStackParamList, 'SearchResult'>;
  route: RouteProp<SearchStackParamList, 'SearchResult'>;
};

export default function SearchResultScreen({ navigation, route }: Props) {
  const { query } = route.params;
  const currentUserId = useUserStore(s => s.currentUser.id);
  const storeFavorites = useListStore(s => s.favorites);
  const storeAddFavorite = useListStore(s => s.addFavorite);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchProducts(query, currentUserId)
      .then(results => { if (!cancelled) setProducts(results); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, currentUserId]);

  const isFavorited = (productId: string) =>
    storeFavorites.some(f => f.productId === productId);

  const handleToggleFavorite = async (product: Product) => {
    if (isFavorited(product.id)) return;
    setAddingId(product.id);
    try {
      const item = await addFavorite(currentUserId, product.id, '');
      storeAddFavorite(item);
    } catch {
      Alert.alert('오류', '즐겨찾기 추가에 실패했습니다.');
    } finally {
      setAddingId(null);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const riskColor = RISK_COLOR[item.riskLevel];
    const riskBg = RISK_BG[item.riskLevel];
    const favorited = isFavorited(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productEmoji}>🛒</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productBrand}>{item.brand}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {RISK_LABEL[item.riskLevel]}
            </Text>
          </View>
        </View>

        {item.riskIngredients.length > 0 && (
          <View style={styles.riskIngredients}>
            {item.riskIngredients.slice(0, 3).map(ing => (
              <View key={ing.id} style={[styles.chip, { backgroundColor: riskColor + '20' }]}>
                <Text style={[styles.chipText, { color: riskColor }]}>{ing.nameKo}</Text>
              </View>
            ))}
            {item.riskIngredients.length > 3 && (
              <Text style={styles.moreText}>+{item.riskIngredients.length - 3}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.favBtn, favorited && styles.favBtnActive]}
          onPress={() => handleToggleFavorite(item)}
          disabled={favorited || addingId === item.id}
          activeOpacity={0.7}>
          {addingId === item.id ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.favBtnText, favorited && styles.favBtnTextActive]}>
              {favorited ? '★ 즐겨찾기 완료' : '☆ 즐겨찾기 추가'}
            </Text>
          )}
        </TouchableOpacity>
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
        <Text style={styles.headerTitle} numberOfLines={1}>"{query}" 검색 결과</Text>
        <View style={{ width: 52 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😵</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>{Strings.searchNoResults}</Text>
          <Text style={styles.emptySubText}>다른 검색어를 시도해보세요</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{products.length}개 제품 발견</Text>
          }
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: Colors.textSecondary },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 15, color: Colors.text, textAlign: 'center' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  emptySubText: { fontSize: 14, color: Colors.textSecondary },

  list: { padding: 16 },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
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
  productBrand: { fontSize: 13, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  riskText: { fontSize: 13, fontWeight: '700' },

  riskIngredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  chipText: { fontSize: 12, fontWeight: '600' },
  moreText: { fontSize: 12, color: Colors.textSecondary, alignSelf: 'center' },

  favBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  favBtnActive: {
    borderColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  favBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  favBtnTextActive: { color: Colors.textSecondary },
});
