import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanStackParamList, Product } from '../../types';
import { getDemoProducts } from '../../services/scan.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, allergenLabel } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'Scan'>;
};

export default function ScanScreen({ navigation }: Props) {
  const activeProfile = useUserStore(s => s.activeProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDemoProducts(activeProfile.allergyProfile)
      .then(data => { if (!cancelled) setProducts(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeProfile.allergyProfile]);

  const handleScan = async (product: Product) => {
    setScanning(product.id);
    await new Promise<void>(r => setTimeout(() => r(), 700));
    setScanning(null);
    navigation.navigate('ScanResult', { productId: product.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.scanTitle}</Text>
        <Text style={styles.profileBadge}>👤 {activeProfile.name}</Text>
      </View>

      <View style={styles.viewfinder}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <Text style={styles.viewfinderText}>📷</Text>
        <Text style={styles.viewfinderSub}>바코드를 화면 안에 맞춰주세요</Text>
        <View style={styles.scanLine} />
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>데모 제품 선택</Text>
        <Text style={styles.demoSub}>
          알러지 프로필:{' '}
          {activeProfile.allergyProfile.length > 0
            ? allergenLabel(activeProfile.allergyProfile)
            : '없음'}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => handleScan(item)}
                disabled={scanning !== null}
                activeOpacity={0.7}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productBrand}>{item.brand}</Text>
                </View>
                {scanning === item.id ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <View style={[styles.riskBadge, { backgroundColor: RISK_COLOR[item.riskLevel] + '20' }]}>
                    <Text style={[styles.riskBadgeText, { color: RISK_COLOR[item.riskLevel] }]}>
                      {RISK_LABEL[item.riskLevel]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  profileBadge: { fontSize: 13, color: Colors.textSecondary },

  viewfinder: {
    margin: 20,
    height: 180,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerTL: { position: 'absolute', top: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerTR: { position: 'absolute', top: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBL: { position: 'absolute', bottom: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBR: { position: 'absolute', bottom: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  viewfinderText: { fontSize: 36, marginBottom: 6 },
  viewfinderSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  scanLine: { position: 'absolute', left: 30, right: 30, height: 2, backgroundColor: Colors.primary, opacity: 0.8 },

  demoSection: { flex: 1, paddingHorizontal: 20 },
  demoTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  demoSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14 },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 13, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  riskBadgeText: { fontSize: 13, fontWeight: '600' },
});
