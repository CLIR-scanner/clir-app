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
import { RecommendStackParamList, Product } from '../../types';
import { getWeekendPopular } from '../../services/recommend.service';
import { addFavorite } from '../../services/list.service';
import { useUserStore } from '../../store/user.store';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<RecommendStackParamList, 'WeekendPopular'>;
};

export default function WeekendPopularScreen({ navigation }: Props) {
  const currentUserId = useUserStore(s => s.currentUser.id);
  const storeFavorites = useListStore(s => s.favorites);
  const storeAddFavorite = useListStore(s => s.addFavorite);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWeekendPopular(currentUserId)
      .then(data => { if (!cancelled) setProducts(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUserId]);

  const isFavorited = (productId: string) =>
    storeFavorites.some(f => f.productId === productId);

  const handleAddFavorite = async (product: Product) => {
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

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const riskColor = RISK_COLOR[item.riskLevel];
    const riskBg = RISK_BG[item.riskLevel];
    const favorited = isFavorited(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.productEmoji}>🛒</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productBrand}>{item.brand}</Text>
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {RISK_LABEL[item.riskLevel]}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.favBtn, favorited && styles.favBtnActive]}
            onPress={() => handleAddFavorite(item)}
            disabled={favorited || addingId === item.id}>
            {addingId === item.id
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={[styles.favBtnText, favorited && styles.favBtnTextActive]}>
                  {favorited ? '★' : '☆'}
                </Text>
            }
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{Strings.recommendWeekendPopular}</Text>
        <View style={{ width: 52 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{Strings.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: Colors.textSecondary },

  list: { padding: 16, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: { fontSize: 20 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 12, color: Colors.textSecondary },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: { borderColor: Colors.separator, backgroundColor: Colors.background },
  favBtnText: { fontSize: 18, color: Colors.primary },
  favBtnTextActive: { color: Colors.textSecondary },
});
