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
import { ScanStackParamList, ScanHistory } from '../../types';
import { useScanStore } from '../../store/scan.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'ScanHistory'>;
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ScanHistoryScreen({ navigation }: Props) {
  const history = useScanStore(s => s.history);
  const clearHistory = useScanStore(s => s.clearHistory);

  const renderItem = ({ item }: { item: ScanHistory }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ScanResult', { productId: item.productId, fromHistory: true })}
      activeOpacity={0.7}>
      <View style={styles.cardMain}>
        <View style={styles.cardInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.productBrand}>{item.product.brand}</Text>
          <Text style={styles.scannedAt}>{formatDate(item.scannedAt)}</Text>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: RISK_BG[item.result] }]}>
          <Text style={[styles.riskText, { color: RISK_COLOR[item.result] }]}>
            {RISK_LABEL[item.result]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.scanHistoryTitle}</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearText}>전체 삭제</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>{Strings.scanHistoryEmpty}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
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
  clearText: { fontSize: 14, color: Colors.danger },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  scannedAt: { fontSize: 12, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  riskText: { fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});
