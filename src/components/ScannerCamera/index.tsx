import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';

export type ScannerBarcodeType =
  | 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | 'code128' | 'code39' | 'qr';

export interface ScannerResult {
  data: string;
  type: string;
}

export interface ScannerCameraProps {
  style?: StyleProp<ViewStyle>;
  facing?: 'back' | 'front';
  active?: boolean;
  onBarcodeScanned?: (result: ScannerResult) => void;
  barcodeTypes?: readonly ScannerBarcodeType[];
  onReady?: () => void;
  /** 웹 shim 전용 — 네이티브는 useCameraPermissions로 처리되므로 무시. */
  onError?: (reason: 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN', raw?: unknown) => void;
}

export interface ScannerCameraHandle {
  takePictureAsync(opts?: { quality?: number }): Promise<{ uri: string }>;
}

const ScannerCamera = forwardRef<ScannerCameraHandle, ScannerCameraProps>(
  ({ style, facing = 'back', active = true, onBarcodeScanned, barcodeTypes, onReady, onError }, ref) => {
    const cameraRef = useRef<CameraView>(null);

    useImperativeHandle(ref, () => ({
      async takePictureAsync(opts) {
        if (!cameraRef.current) throw new Error('Camera not ready');
        const photo = await cameraRef.current.takePictureAsync(opts);
        if (!photo) throw new Error('Capture failed');
        return { uri: photo.uri };
      },
    }));

    // CameraView 에 넘기는 prop identity 를 "절대 바꾸지 않는다".
    // active(=모드 토글/코치마크) 가 바뀔 때마다 onBarcodeScanned 가 함수↔undefined
    // 로 바뀌거나 barcodeScannerSettings 가 새 객체가 되면 expo-camera 가 네이티브
    // 카메라 세션을 재구성 → 검은 프레임(깜빡임, 특히 Expo Go). 최신값은 ref 로
    // 읽고 콜백 identity 는 고정해 세션을 끊지 않는다.
    const activeRef = useRef(active);
    activeRef.current = active;
    const onScanRef = useRef(onBarcodeScanned);
    onScanRef.current = onBarcodeScanned;
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    // 항상 동일 identity. active=false 면 콜백 내부에서 무시(스캔만 비활성, 세션은 유지).
    const handleScan = useRef((r: BarcodeScanningResult) => {
      if (!activeRef.current) return;
      onScanRef.current?.({ data: r.data, type: r.type });
    }).current;
    const handleReady = useRef(() => { onReadyRef.current?.(); }).current;
    const handleMountError = useRef((event: unknown) => {
      onErrorRef.current?.('UNKNOWN', event);
    }).current;

    // barcodeTypes 안정화 — 매 렌더 새 배열/객체 생성 방지(세션 재구성 차단).
    // 호출부 BARCODE_TYPES 가 모듈 상수라 사실상 1회만 계산된다.
    const scannerSettings = useMemo(
      () => (barcodeTypes ? { barcodeTypes: [...barcodeTypes] } : undefined),
      [barcodeTypes],
    );

    return (
      <View style={style} collapsable={false}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          active
          mode="picture"
          autofocus="on"
          barcodeScannerSettings={scannerSettings}
          onBarcodeScanned={handleScan}
          onCameraReady={handleReady}
          onMountError={handleMountError}
        />
      </View>
    );
  },
);

ScannerCamera.displayName = 'ScannerCamera';

const styles = StyleSheet.create({
  camera: StyleSheet.absoluteFillObject,
});

export default ScannerCamera;
