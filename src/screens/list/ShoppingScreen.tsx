import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListStackParamList } from '../../types';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ListStackParamList, 'Shopping'>;
};

export default function ShoppingScreen({ navigation }: Props) {
  const shoppingItems = useListStore(s => s.shoppingItems);
  const unpurchased = shoppingItems.filter(s => !s.isPurchased);
  const purchased = shoppingItems.filter(s => s.isPurchased);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장보기</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{unpurchased.length}</Text>
            <Text style={styles.summaryLabel}>남은 항목</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, styles.summaryNumDone]}>{purchased.length}</Text>
            <Text style={styles.summaryLabel}>구매 완료</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{shoppingItems.length}</Text>
            <Text style={styles.summaryLabel}>전체</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('ShoppingItems')}
          activeOpacity={0.7}>
          <View style={styles.navCardLeft}>
            <Text style={styles.navCardEmoji}>📋</Text>
            <View>
              <Text style={styles.navCardTitle}>구매 목록</Text>
              <Text style={styles.navCardSub}>
                {unpurchased.length > 0
                  ? `${unpurchased.length}개 항목`
                  : '모두 구매했습니다'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('ShoppingPurchase')}
          activeOpacity={0.7}>
          <View style={styles.navCardLeft}>
            <Text style={styles.navCardEmoji}>✅</Text>
            <View>
              <Text style={styles.navCardTitle}>구매 완료</Text>
              <Text style={styles.navCardSub}>
                {purchased.length > 0
                  ? `${purchased.length}개 완료`
                  : '구매 완료 항목 없음'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {shoppingItems.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>장보기 목록이 비어 있습니다</Text>
            <Text style={styles.emptySubText}>
              스캔 또는 검색 후 장보기 목록에 추가할 수 있습니다
            </Text>
          </View>
        )}
      </ScrollView>
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

  content: { padding: 16 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  summaryNumDone: { color: Colors.safe },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  navCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  navCardEmoji: { fontSize: 28 },
  navCardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  navCardSub: { fontSize: 13, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textSecondary },

  emptyBox: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
