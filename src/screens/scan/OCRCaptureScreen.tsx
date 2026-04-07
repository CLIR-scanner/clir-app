import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScanStackParamList } from '../../types';
import { recognizeIngredients, buildProductFromOCR } from '../../services/scan.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { ALLERGEN_NAME_KO } from '../../constants/risk';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'OCRCapture'>;
  route: RouteProp<ScanStackParamList, 'OCRCapture'>;
};

export default function OCRCaptureScreen({ navigation, route }: Props) {
  const { barcode } = route.params;
  const activeProfile = useUserStore(s => s.activeProfile);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (isProcessing || !cameraRef.current) return;
    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const imageUri = photo?.uri ?? '';
      const ocrResult = await recognizeIngredients(imageUri);

      // OCR 결과로 Product 생성 (allergen 판정 포함) — 서비스 레이어에 위임
      const ocrProduct = buildProductFromOCR(ocrResult, barcode, activeProfile.allergyProfile);

      // 알러젠 발견 시 경고
      if (ocrProduct.riskIngredients.length > 0) {
        const riskIds = ocrProduct.riskIngredients.map(i => i.id);
        const allergenNames = riskIds.map(id => ALLERGEN_NAME_KO[id] ?? id).join(', ');
        Alert.alert(
          '알러지 성분 감지',
          `성분표에서 알러지 유발 성분이 발견되었습니다:\n${allergenNames}`,
          [
            {
              text: '분석 결과 보기',
              onPress: () => navigation.navigate('ScanResult', { productId: ocrProduct.id, ocrProduct }),
            },
          ],
        );
      } else {
        navigation.navigate('ScanResult', { productId: ocrProduct.id, ocrProduct });
      }
    } catch {
      Alert.alert('오류', 'OCR 분석 중 오류가 발생했습니다. 다시 시도해주세요.', [{ text: '확인' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionText}>
          {permission.canAskAgain
            ? '성분표 촬영을 위해\n카메라 권한이 필요합니다'
            : '카메라 권한이 거부되었습니다.\n기기 설정에서 허용해주세요'}
        </Text>
        {permission.canAskAgain && (
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>카메라 권한 허용</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />

      {/* 상단 안내 */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.topTitle}>성분표 촬영</Text>
          <Text style={styles.topSub}>
            {barcode ? `바코드 [${barcode}] 미등록 제품` : '성분표를 화면에 맞춰주세요'}
          </Text>
        </View>
      </SafeAreaView>

      {/* 스캔 가이드 프레임 */}
      <View style={styles.frameOuter}>
        <View style={styles.frame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <Text style={styles.frameHint}>성분표 전체가 보이도록 맞춰주세요</Text>
        </View>
      </View>

      {/* 하단 촬영 버튼 */}
      <SafeAreaView style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.captureBtn, isProcessing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
          activeOpacity={0.8}>
          {isProcessing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.captureBtnText}>분석 중...</Text>
            </>
          ) : (
            <Text style={styles.captureBtnText}>촬영 · 성분 분석</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.skipHint}>성분표가 없다면</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipBtn}>건너뛰기</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* 처리 중 전체 오버레이 */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.processingText}>성분 분석 중...</Text>
          <Text style={styles.processingSubText}>잠시만 기다려주세요</Text>
        </View>
      )}
    </View>
  );
}

const CORNER = 28;
const THICKNESS = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
    gap: 16,
  },

  permissionEmoji: { fontSize: 48 },
  permissionText: { fontSize: 15, color: Colors.text, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  backBtn: { paddingVertical: 8 },
  backBtnText: { color: Colors.primary, fontSize: 15 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topInfo: { flex: 1, paddingTop: 6 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  topSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  frameOuter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    marginBottom: 160,
  },
  frame: {
    width: '85%',
    aspectRatio: 1.6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: CORNER, height: CORNER, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: CORNER, height: CORNER, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBL: { position: 'absolute', bottom: 24, left: 0, width: CORNER, height: CORNER, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderColor: '#fff', borderRadius: 3 },
  cornerBR: { position: 'absolute', bottom: 24, right: 0, width: CORNER, height: CORNER, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderColor: '#fff', borderRadius: 3 },
  frameHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20,
    gap: 8,
    paddingHorizontal: 40,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  skipBtn: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  processingSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});
