import React, {useEffect, useState} from 'react';
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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ScanStackParamList, Product} from '../../types';
import {getDemoProducts} from '../../services/scan.service';
import {useUserStore} from '../../store/user.store';
import {Colors} from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'Scan'>;
};

const RISK_LABEL: Record<Product['riskLevel'], string> = {
  danger: '위험',
  caution: '주의',
  safe: '안전',
};

const RISK_COLOR: Record<Product['riskLevel'], string> = {
  danger: Colors.danger,
  caution: Colors.caution,
  safe: Colors.safe,
};

export default function ScanScreen({navigation}: Props) {
  const activeProfile = useUserStore(s => s.activeProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  useEffect(() => {
    getDemoProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async (product: Product) => {
    setScanning(product.id);
    await new Promise<void>(r => setTimeout(() => r(), 700)); // 스캔 연출
    setScanning(null);
    navigation.navigate('ScanResult', {productId: product.id});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CLIR 스캔</Text>
        <Text style={styles.profileBadge}>
          👤 {activeProfile.name}
        </Text>
      </View>

      {/* 카메라 뷰파인더 (시연용) */}
      <View style={styles.viewfinder}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <Text style={styles.viewfinderText}>📷</Text>
        <Text style={styles.viewfinderSub}>바코드를 화면 안에 맞춰주세요</Text>
        <View style={styles.scanLine} />
      </View>

      {/* 데모 제품 선택 */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>데모 제품 선택</Text>
        <Text style={styles.demoSub}>
          알러지 프로필: {activeProfile.allergyProfile.length > 0
            ? activeProfile.allergyProfile.map(id =>
                id === 'ing-peanut' ? '🥜 땅콩' :
                id === 'ing-milk' ? '🥛 유제품' :
                id === 'ing-wheat' ? '🌾 밀' : id
              ).join('  ')
            : '없음'}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{marginTop: 20}} />
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
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
                  <View style={[styles.riskBadge, {backgroundColor: RISK_COLOR[item.riskLevel] + '20'}]}>
                    <Text style={[styles.riskBadgeText, {color: RISK_COLOR[item.riskLevel]}]}>
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
  container: {flex: 1, backgroundColor: Colors.background},
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
  headerTitle: {fontSize: 20, fontWeight: '700', color: Colors.text},
  profileBadge: {fontSize: 13, color: Colors.textSecondary},

  // 뷰파인더
  viewfinder: {
    margin: 20,
    height: 180,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerTL: {position: 'absolute', top: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3},
  cornerTR: {position: 'absolute', top: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3},
  cornerBL: {position: 'absolute', bottom: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3},
  cornerBR: {position: 'absolute', bottom: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3},
  viewfinderText: {fontSize: 36, marginBottom: 6},
  viewfinderSub: {fontSize: 13, color: 'rgba(255,255,255,0.6)'},
  scanLine: {position: 'absolute', left: 30, right: 30, height: 2, backgroundColor: Colors.primary, opacity: 0.8},

  // 데모 섹션
  demoSection: {flex: 1, paddingHorizontal: 20},
  demoTitle: {fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4},
  demoSub: {fontSize: 12, color: Colors.textSecondary, marginBottom: 14},

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {flex: 1},
  productName: {fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2},
  productBrand: {fontSize: 13, color: Colors.textSecondary},
  riskBadge: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  riskBadgeText: {fontSize: 13, fontWeight: '600'},
});
