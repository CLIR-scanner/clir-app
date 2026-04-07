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
import { ListStackParamList, ShoppingItem } from '../../types';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'ShoppingPurchase'>;
};

export default function ShoppingPurchaseScreen({ navigation }: Props) {
  const shoppingItems = useListStore(s => s.shoppingItems);
  const storeToggle = useListStore(s => s.togglePurchased);
  const purchased = shoppingItems.filter(s => s.isPurchased);

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const riskColor = RISK_COLOR[item.product.riskLevel];
    const riskBg = RISK_BG[item.product.riskLevel];

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.checkboxDone}
          onPress={() => storeToggle(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.checkmark}>✓</Text>
        </TouchableOpacity>

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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>구매 완료 ({purchased.length})</Text>
        <View style={{ width: 52 }} />
      </View>

      {purchased.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>구매 완료 항목이 없습니다</Text>
          <Text style={styles.emptySubText}>
            구매 목록에서 항목을 체크하면 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.hint}>항목을 탭하면 구매 취소로 되돌립니다</Text>
          <FlatList
            data={purchased}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.listContainer}
          />
        </>
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

  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },

  listContainer: { backgroundColor: Colors.card, margin: 16, borderRadius: 14 },
  list: {},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  checkboxDone: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.safe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  productBrand: { fontSize: 13, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 52 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
