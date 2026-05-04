import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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

    const handle = active && onBarcodeScanned
      ? (r: BarcodeScanningResult) => onBarcodeScanned({ data: r.data, type: r.type })
      : undefined;

    return (
      <View style={style} collapsable={false}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          active
          mode="picture"
          autofocus="on"
          barcodeScannerSettings={
            barcodeTypes ? { barcodeTypes: [...barcodeTypes] } : undefined
          }
          onBarcodeScanned={handle}
          onCameraReady={onReady}
          onMountError={event => onError?.('UNKNOWN', event)}
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
