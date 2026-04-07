import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScanStackParamList, Product } from '../../types';
import { getDemoProducts, scanBarcode, ProductNotFoundError } from '../../services/scan.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, allergenLabel } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'Scan'>;
};

/** 동일 바코드가 연속으로 여러 번 발화되는 것을 막기 위한 쿨다운 (ms) */
const SCAN_COOLDOWN_MS = 1500;

export default function ScanScreen({ navigation }: Props) {
  const activeProfile = useUserStore(s => s.activeProfile);

  // ─── Camera permission ───────────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();

  // ─── Demo product list ───────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  // ─── Barcode scan cooldown ───────────────────────────────────────────────
  const lastScanAt = useRef<number>(0);
  /** Re-entrancy guard — NOT used for rendering */
  const isScanningBarcode = useRef(false);
  /** Drives the processing overlay — triggers re-render */
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingDemo(true);
    getDemoProducts(activeProfile.allergyProfile)
      .then(data => { if (!cancelled) setProducts(data); })
      .finally(() => { if (!cancelled) setLoadingDemo(false); });
    return () => { cancelled = true; };
  }, [activeProfile.allergyProfile]);

  // ─── Real barcode scan handler ───────────────────────────────────────────
  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const now = Date.now();
      // 쿨다운 또는 이미 처리 중이면 무시
      if (isScanningBarcode.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;

      isScanningBarcode.current = true;
      lastScanAt.current = now;
      setIsProcessing(true);

      try {
        const product = await scanBarcode(result.data, activeProfile.allergyProfile);
        // product를 직접 전달 — productId가 'off-...' 형태일 때 getProductById가 실패하는 버그 방지
        navigation.navigate('ScanResult', { productId: product.id, ocrProduct: product });
      } catch (err) {
        if (err instanceof ProductNotFoundError) {
          // 바코드 미등록 → OCR 성분표 촬영으로 폴백
          navigation.navigate('OCRCapture', { barcode: err.barcode });
        } else {
          Alert.alert('오류', '제품 정보를 가져오는 중 오류가 발생했습니다.', [{ text: '확인' }]);
        }
      } finally {
        isScanningBarcode.current = false;
        setIsProcessing(false);
      }
    },
    [activeProfile.allergyProfile, navigation],
  );

  // ─── Demo product tap handler ────────────────────────────────────────────
  const handleDemoScan = useCallback(async (product: Product) => {
    setScanning(product.id);
    await new Promise<void>(r => setTimeout(() => r(), 700));
    setScanning(null);
    navigation.navigate('ScanResult', { productId: product.id });
  }, [navigation]);

  // ─── Viewfinder: real camera or permission fallback ──────────────────────
  const renderViewfinder = () => {
    if (!permission) {
      // 권한 상태 로딩 중
      return (
        <View style={[styles.viewfinder, styles.viewfinderDark]}>
          <ActivityIndicator color="#fff" />
        </View>
      );
    }

    if (!permission.granted) {
      // 권한 없음 — 요청 또는 안내
      return (
        <View style={[styles.viewfinder, styles.viewfinderDark]}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionText}>
            {permission.canAskAgain
              ? '바코드 스캔을 위해\n카메라 권한이 필요합니다'
              : '카메라 권한이 거부되었습니다.\n기기 설정에서 허용해주세요'}
          </Text>
          {permission.canAskAgain && (
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>카메라 권한 허용</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // 권한 있음 — 실제 카메라
    return (
      <View style={styles.viewfinder}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        {/* 스캔 가이드 코너 마커 */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <View style={styles.scanLine} />
        <View style={styles.viewfinderOverlay}>
          <Text style={styles.viewfinderSub}>바코드를 화면 안에 맞춰주세요</Text>
        </View>
        {/* 처리 중 오버레이 */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.processingText}>분석 중...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.scanTitle}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ScanHistory')}>
          <Text style={styles.historyBtn}>이력 📋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileRow}>
        <Text style={styles.profileBadge}>
          👤 {activeProfile.name}
          {activeProfile.allergyProfile.length > 0
            ? `  ·  ${allergenLabel(activeProfile.allergyProfile)}`
            : '  ·  알러지 없음'}
        </Text>
      </View>

      {renderViewfinder()}

      {/* 데모 제품 목록 */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>데모 제품 선택</Text>
        <Text style={styles.demoSub}>실제 바코드가 없을 때 아래 제품을 탭하세요</Text>

        {loadingDemo ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => handleDemoScan(item)}
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
  historyBtn: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

  profileRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.card,
  },
  profileBadge: { fontSize: 13, color: Colors.textSecondary },

  // ─── Viewfinder ──────────────────────────────────────────────────────────
  viewfinder: {
    margin: 20,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  viewfinderDark: {
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  // Permission fallback
  permissionEmoji: { fontSize: 36 },
  permissionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Camera overlays
  cornerTL: { position: 'absolute', top: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerTR: { position: 'absolute', top: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBL: { position: 'absolute', bottom: 14, left: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBR: { position: 'absolute', bottom: 14, right: 14, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#fff', borderRadius: 3 },
  scanLine: { position: 'absolute', top: '50%', left: 30, right: 30, height: 2, backgroundColor: Colors.primary, opacity: 0.9 },
  viewfinderOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewfinderSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  processingText: { color: '#fff', fontSize: 14 },

  // ─── Demo section ─────────────────────────────────────────────────────────
  demoSection: { flex: 1, paddingHorizontal: 20 },
  demoTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
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
