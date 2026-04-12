import React, { createRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList, Product, Ingredient, IngredientSummary } from '../../types';
import { Colors } from '../../constants/colors';
import { recognizeIngredients } from '../../services/scan.service';
import { ScanHeader } from './ScanScreen';

type Props = NativeStackScreenProps<ScanStackParamList, 'OCRCapture'>;

type ScreenState = 'idle' | 'preview' | 'analyzing' | 'error';

// ── Layout constants (matches ScanScreen guide box dimensions) ────────────────
const GUIDE_W    = 350;
const GUIDE_H    = 459;
const CORNER_LEN = 32;
const CORNER_W   = 4;
const DIM        = 'rgba(0,0,0,0.50)';

function buildOcrProduct(barcode: string | undefined, ingredients: IngredientSummary[]): Product {
  const fullIngredients: Ingredient[] = ingredients.map(ing => ({
    id: ing.id,
    name: ing.name,
    nameKo: ing.nameKo,
    description: '',
    riskLevel: 'safe',
    sources: [],
  }));
  return {
    id: barcode ?? `ocr-${Date.now()}`,
    name: 'Scanned Product',
    brand: '',
    ingredients: fullIngredients,
    isSafe: true,
    riskLevel: 'safe',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  };
}

export default function OCRCaptureScreen({ navigation, route }: Props) {
  const { barcode } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = createRef<CameraView>();

  const [state, setState]           = useState<ScreenState>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedUri(photo.uri);
      setState('preview');
    } catch {
      setErrorMsg('Failed to capture photo. Please try again.');
      setState('error');
    }
  }

  function handleRetake() {
    setCapturedUri(null);
    setErrorMsg('');
    setState('idle');
  }

  async function handleAnalyze() {
    if (!capturedUri) return;
    setState('analyzing');
    try {
      const ocrResult  = await recognizeIngredients(capturedUri);
      const ocrProduct = buildOcrProduct(barcode, ocrResult.ingredients);
      navigation.navigate('ScanResult', { productId: barcode ?? '', ocrProduct });
    } catch {
      setErrorMsg('Could not read ingredients.\nPlease retake with better lighting.');
      setState('error');
    }
  }

  // ── Permission loading ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>
          CLIR needs camera access to photograph ingredient labels.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <View style={styles.root}>
        <ScanHeader
          insetTop={insets.top}
          subtitle="Scan OCR of the product"
          onBack={() => navigation.goBack()}
          onHistory={() => navigation.navigate('ScanHistory')}
        />
        <View style={styles.center}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Preview / Analyzing ────────────────────────────────────────────────────
  if (state === 'preview' || state === 'analyzing') {
    return (
      <View style={styles.root}>
        <View style={styles.previewHeaderBg}>
          <ScanHeader
            insetTop={insets.top}
            subtitle="Scan OCR of the product"
            onBack={handleRetake}
            onHistory={() => navigation.navigate('ScanHistory')}
          />
        </View>

        <View style={styles.previewContainer}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
          )}
          {state === 'analyzing' && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator color={Colors.white} size="large" />
              <Text style={styles.analyzingText}>Reading ingredients…</Text>
            </View>
          )}
        </View>

        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.retakePill}
            onPress={handleRetake}
            disabled={state === 'analyzing'}
          >
            <Text style={styles.retakePillText}>↺  Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.analyzeBtn, state === 'analyzing' && styles.analyzeBtnOff]}
            onPress={handleAnalyze}
            disabled={state === 'analyzing'}
          >
            {state === 'analyzing'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.analyzeBtnText}>Analyze</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Idle: full-screen camera with guide frame ──────────────────────────────
  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dim overlay — darkens outside the guide box */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dimTop} />
        <View style={styles.dimMiddle}>
          <View style={styles.dimSide} />
          {/* Guide box window */}
          <View style={styles.guideBox}>
            <OCRCorner pos="topLeft"     />
            <OCRCorner pos="topRight"    />
            <OCRCorner pos="bottomLeft"  />
            <OCRCorner pos="bottomRight" />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom} />
      </View>

      {/* Header floats on top of camera */}
      <ScanHeader
        insetTop={insets.top}
        subtitle="Scan OCR of the product"
        onBack={() => navigation.goBack()}
        onHistory={() => navigation.navigate('ScanHistory')}
      />

      {/* Bottom — shutter button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture} activeOpacity={0.8}>
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Corner mark ───────────────────────────────────────────────────────────────
type CornerPos = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function OCRCorner({ pos }: { pos: CornerPos }) {
  const isTop  = pos === 'topLeft' || pos === 'topRight';
  const isLeft = pos === 'topLeft' || pos === 'bottomLeft';
  return (
    <View
      style={[
        styles.corner,
        isTop  ? { top: 0 }    : { bottom: 0 },
        isLeft ? { left: 0 }   : { right: 0 },
        {
          borderTopWidth:          isTop  ? CORNER_W : 0,
          borderBottomWidth:       isTop  ? 0 : CORNER_W,
          borderLeftWidth:         isLeft ? CORNER_W : 0,
          borderRightWidth:        isLeft ? 0 : CORNER_W,
          borderTopLeftRadius:     pos === 'topLeft'     ? 3 : 0,
          borderTopRightRadius:    pos === 'topRight'    ? 3 : 0,
          borderBottomLeftRadius:  pos === 'bottomLeft'  ? 3 : 0,
          borderBottomRightRadius: pos === 'bottomRight' ? 3 : 0,
          borderColor: Colors.white,
        },
      ]}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Guide box is centered horizontally; vertical center sits roughly at 55% of screen
// We use flex layout: dimTop grows, then guideBox row, then dimBottom grows
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Centered (permission / error)
  center: {
    flex: 1, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36,
  },

  // Permission
  permIcon:    { fontSize: 52, marginBottom: 16 },
  permTitle:   { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 12, textAlign: 'center' },
  permDesc:    { fontSize: 14, color: Colors.gray300, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  permBtn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Error
  errIcon:      { fontSize: 48, marginBottom: 16 },
  errMsg:       { fontSize: 15, color: Colors.gray300, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retakeBtn:    { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 36 },
  retakeBtnText:{ color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Dim overlay for idle (camera) state
  dimTop:    { flex: 1, backgroundColor: DIM },
  dimMiddle: { flexDirection: 'row', height: GUIDE_H },
  dimSide:   { flex: 1, backgroundColor: DIM },
  dimBottom: { flex: 1, backgroundColor: DIM },
  guideBox:  { width: GUIDE_W, height: GUIDE_H },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_LEN },

  // Bottom shutter
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingTop: 16,
  },
  shutterBtn: {},
  shutterOuter: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
  },
  shutterInner: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2.5, borderColor: Colors.gray300,
  },

  // Preview
  previewHeaderBg:  { backgroundColor: '#000' },
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewImage:     { flex: 1, width: '100%' },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  analyzingText: { fontSize: 15, color: Colors.white, fontWeight: '600' },

  previewActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingTop: 20, paddingHorizontal: 24,
    backgroundColor: '#111',
  },
  retakePill:     { borderWidth: 1.5, borderColor: Colors.white, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28 },
  retakePillText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  analyzeBtn:     { backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 36, minWidth: 120, alignItems: 'center' },
  analyzeBtnOff:  { opacity: 0.6 },
  analyzeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
