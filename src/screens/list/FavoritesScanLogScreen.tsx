import React, { useMemo } from 'react';
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
import { ListStackParamList, ScanHistory } from '../../types';
import { useScanStore } from '../../store/scan.store';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'FavoritesScanLog'>;
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function FavoritesScanLogScreen({ navigation }: Props) {
  const history = useScanStore(s => s.history);
  const favorites = useListStore(s => s.favorites);
  const favoriteProductIds = useMemo(
    () => new Set(favorites.map(f => f.productId)),
    [favorites],
  );
  const favoriteScanLogs = useMemo(
    () => history.filter(h => favoriteProductIds.has(h.productId)),
    [history, favoriteProductIds],
  );

  const renderItem = ({ item }: { item: ScanHistory }) => {
    const riskColor = RISK_COLOR[item.result];
    const riskBg = RISK_BG[item.result];

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.cardInfo}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.productBrand}>{item.product.brand}</Text>
            <Text style={styles.scannedAt}>{formatDate(item.scannedAt)}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>
              {RISK_LABEL[item.result]}
            </Text>
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
        <Text style={styles.headerTitle}>즐겨찾기 스캔 내역</Text>
        <View style={{ width: 52 }} />
      </View>

      {favoriteScanLogs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>즐겨찾기 제품의 스캔 내역 없음</Text>
          <Text style={styles.emptySubText}>
            즐겨찾기한 제품을 스캔하면 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteScanLogs}
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
    borderRadius: 12,
    padding: 16,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  scannedAt: { fontSize: 12, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  riskText: { fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
