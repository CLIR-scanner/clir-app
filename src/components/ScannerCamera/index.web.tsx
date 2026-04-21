import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleProp, ViewStyle, View, Text, StyleSheet } from 'react-native';
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

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
  /** 권한 거부·카메라 없음 등 치명적 오류를 상위에서 렌더링하려면 제공 */
  onError?: (reason: 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN', raw?: unknown) => void;
}

export interface ScannerCameraHandle {
  takePictureAsync(opts?: { quality?: number }): Promise<{ uri: string }>;
}

// 제품 바코드는 거의 1D. QR을 남기되 2D 가중 탐색을 피하기 위해 명시 리스트로 제한.
const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
];

function buildHints() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

const ScannerCamera = forwardRef<ScannerCameraHandle, ScannerCameraProps>(
  ({ facing = 'back', active = true, onBarcodeScanned, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const callbackRef = useRef(onBarcodeScanned);
    const errorRef    = useRef(onError);
    callbackRef.current = onBarcodeScanned;
    errorRef.current    = onError;

    const [errorKind, setErrorKind] =
      useState<'DENIED' | 'UNAVAILABLE' | null>(null);

    useImperativeHandle(ref, () => ({
      async takePictureAsync(opts) {
        const video = videoRef.current;
        if (!video || !video.videoWidth) throw new Error('Video not ready');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D unsupported');
        ctx.drawImage(video, 0, 0);
        const quality = opts?.quality ?? 0.92;
        const uri = canvas.toDataURL('image/jpeg', quality);
        return { uri };
      },
    }));

    useEffect(() => {
      if (!active) return;
      const video = videoRef.current;
      if (!video) return;

      let cancelled = false;
      // 250ms 스캔 간격 — 연속 decode로 CPU 과소비 방지하면서 반응성 확보.
      const reader = new BrowserMultiFormatReader(buildHints(), {
        delayBetweenScanAttempts: 250,
      });

      // 해상도를 명시해 저해상도(640x480) 기본값을 회피. 바코드 edge가 선명해야
      // zxing detection이 안정적으로 성공한다.
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
          width:  { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      const applyAdvancedConstraints = (stream: MediaStream) => {
        // 모바일 후면 카메라에서 연속 AF가 디폴트가 아닌 경우가 있어 명시 요청.
        // 미지원 장치에선 throw — 무시하면 됨.
        const track = stream.getVideoTracks()[0];
        if (!track) return;
        const caps = typeof track.getCapabilities === 'function'
          ? track.getCapabilities() as { focusMode?: string[] }
          : undefined;
        if (caps?.focusMode?.includes('continuous')) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          }).catch(() => { /* 지원 안하면 무시 */ });
        }
      };

      reader
        .decodeFromConstraints(constraints, video, (result, _err, controls) => {
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
          const stream = video.srcObject as MediaStream | null;
          if (stream) applyAdvancedConstraints(stream);
          if (result && callbackRef.current) {
            callbackRef.current({
              data: result.getText(),
              type: result.getBarcodeFormat().toString(),
            });
          }
        })
        .then(controls => {
          if (cancelled) controls.stop();
          else controlsRef.current = controls;
        })
        .catch(err => {
          // 권한 거부·디바이스 없음을 **사용자에게 노출**. 기존 silent catch가
          // "아무 반응 없음" 증상의 주 원인이었다.
          const name = (err && typeof err === 'object' && 'name' in err)
            ? String((err as { name: unknown }).name)
            : '';
          const kind: 'DENIED' | 'UNAVAILABLE' =
            name === 'NotAllowedError' || name === 'SecurityError' ? 'DENIED' : 'UNAVAILABLE';
          setErrorKind(kind);
          errorRef.current?.(kind, err);
        });

      return () => {
        cancelled = true;
        controlsRef.current?.stop();
        controlsRef.current = null;
      };
    }, [active, facing]);

    return (
      <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />
        {errorKind && (
          <View style={styles.errorOverlay} pointerEvents="none">
            <Text style={styles.errorTitle}>
              {errorKind === 'DENIED' ? '카메라 권한이 필요합니다' : '카메라를 사용할 수 없습니다'}
            </Text>
            <Text style={styles.errorDesc}>
              {errorKind === 'DENIED'
                ? '브라우저 설정에서 이 사이트의 카메라 권한을 허용한 뒤 새로고침하세요.'
                : '사용 가능한 카메라 장치가 없거나 다른 앱이 점유 중입니다.'}
            </Text>
          </View>
        )}
      </>
    );
  },
);

ScannerCamera.displayName = 'ScannerCamera';

const styles = StyleSheet.create({
  errorOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default ScannerCamera;
