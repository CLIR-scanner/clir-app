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
import { ListStackParamList, ShoppingItem } from '../../types';
import { removeShoppingItem } from '../../services/list.service';
import { useUserStore } from '../../store/user.store';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'ShoppingItems'>;
};

export default function ShoppingItemsScreen({ navigation }: Props) {
  const currentUserId = useUserStore(s => s.currentUser.id);
  const shoppingItems = useListStore(s => s.shoppingItems);
  const storeToggle = useListStore(s => s.togglePurchased);
  const storeRemove = useListStore(s => s.removeShoppingItem);

  const unpurchased = shoppingItems.filter(s => !s.isPurchased);

  const handleToggle = (item: ShoppingItem) => {
    storeToggle(item.id);
  };

  const handleRemove = (item: ShoppingItem) => {
    Alert.alert(
      '항목 삭제',
      `"${item.product.name}"을(를) 장보기 목록에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            storeRemove(item.id);
            await removeShoppingItem(currentUserId, item.id).catch(() => {});
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const riskColor = RISK_COLOR[item.product.riskLevel];
    const riskBg = RISK_BG[item.product.riskLevel];

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.checkbox, item.isPurchased && styles.checkboxDone]}
          onPress={() => handleToggle(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {item.isPurchased && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <Text style={[styles.productName, item.isPurchased && styles.productNameDone]}
            numberOfLines={1}>
            {item.product.name}
          </Text>
          <Text style={styles.productBrand}>{item.product.brand}</Text>
        </View>

        <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>
            {RISK_LABEL[item.product.riskLevel]}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.removeBtnText}>✕</Text>
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
        <Text style={styles.headerTitle}>구매 목록 ({unpurchased.length})</Text>
        <View style={{ width: 52 }} />
      </View>

      {unpurchased.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyText}>모두 구매 완료!</Text>
          <Text style={styles.emptySubText}>구매 완료 탭에서 확인하세요</Text>
        </View>
      ) : (
        <FlatList
          data={unpurchased}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.listContainer}
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

  listContainer: { backgroundColor: Colors.card, margin: 16, borderRadius: 14 },
  list: {},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.safe,
    borderColor: Colors.safe,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productNameDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  productBrand: { fontSize: 13, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 16, color: Colors.textSecondary },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 52 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: { fontSize: 14, color: Colors.textSecondary },
});
