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
import { ListStackParamList, FavoriteItem } from '../../types';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'FavoritesMemo'>;
};

export default function FavoritesMemoScreen({ navigation }: Props) {
  const favorites = useListStore(s => s.favorites);
  const withMemo = favorites.filter(f => f.memo.trim().length > 0);

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const riskColor = RISK_COLOR[item.product.riskLevel];
    const riskBg = RISK_BG[item.product.riskLevel];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
            <Text style={styles.productBrand}>{item.product.brand}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {RISK_LABEL[item.product.riskLevel]}
            </Text>
          </View>
        </View>
        <View style={styles.memoBox}>
          <Text style={styles.memoLabel}>메모</Text>
          <Text style={styles.memoText}>{item.memo}</Text>
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
        <Text style={styles.headerTitle}>메모</Text>
        <View style={{ width: 52 }} />
      </View>

      {withMemo.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>메모가 있는 즐겨찾기 없음</Text>
          <Text style={styles.emptySubText}>
            즐겨찾기 추가 시 메모를 함께 저장할 수 있습니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={withMemo}
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 13, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },

  memoBox: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
  },
  memoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  memoText: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
