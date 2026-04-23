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

// ─── 네이티브 Shape Detection API 타입 ────────────────────────────────────────
// lib.dom.d.ts에 정식 정의되기 전 버전을 염두에 두고 inline 선언.
interface DetectedBarcode {
  format: string;
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
}

// BarcodeDetector가 쓰는 포맷 문자열 (W3C Shape Detection 규격)
const BD_FORMATS = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code',
];

// zxing fallback 포맷 (열거형 상수)
const ZXING_FORMATS = [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
];

function buildZxingHints() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

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

const ScannerCamera = forwardRef<ScannerCameraHandle, ScannerCameraProps>(
  ({ facing = 'back', active = true, onBarcodeScanned, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const callbackRef = useRef(onBarcodeScanned);
    const errorRef    = useRef(onError);
    // active를 ref로 관리 — 스트림 lifecycle은 active에 의존하지 않고, 콜백
    // 호출 여부만 activeRef로 게이트한다. 네이티브(index.tsx)와 의미 일치:
    // active=false여도 카메라 프리뷰는 계속 노출되어야 함 (OCR 모드 등).
    const activeRef = useRef(active);
    const recoveryHandlersRef = useRef<(() => void) | null>(null);
    callbackRef.current = onBarcodeScanned;
    errorRef.current    = onError;
    activeRef.current   = active;

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
      const videoEl = videoRef.current;
      if (!videoEl) return;
      // async 클로저에 nullable 누출 방지 — 지역 상수로 좁혀둔다.
      const video: HTMLVideoElement = videoEl;

      let cancelled = false;
      let stream: MediaStream | null = null;
      let rafId = 0;
      let zxingControls: IScannerControls | null = null;

      const kindFromError = (err: unknown): 'DENIED' | 'UNAVAILABLE' => {
        const name = (err && typeof err === 'object' && 'name' in err)
          ? String((err as { name: unknown }).name) : '';
        return (name === 'NotAllowedError' || name === 'SecurityError') ? 'DENIED' : 'UNAVAILABLE';
      };

      const reportError = (err: unknown) => {
        if (cancelled) return;
        const kind = kindFromError(err);
        setErrorKind(kind);
        errorRef.current?.(kind, err);
      };

      const maybeApplyAF = (s: MediaStream) => {
        const track = s.getVideoTracks()[0];
        if (!track || typeof track.getCapabilities !== 'function') return;
        const caps = track.getCapabilities() as { focusMode?: string[] };
        if (caps.focusMode?.includes('continuous')) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          }).catch(() => { /* 미지원 무시 */ });
        }
      };

      async function start() {
        // ── 1. getUserMedia ───────────────────────────────────────────────────
        // `min` 제약 제거 — 저사양 디바이스에서 OverconstrainedError로 시작도 못하는 것 방지.
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
            width:  { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          reportError(err);
          return;
        }
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        video.srcObject = stream;
        try { await video.play(); } catch { /* iOS autoplay edge-case */ }
        maybeApplyAF(stream);

        // iOS 26 Safari 방어: 레이아웃 급변(예: OCR 토글로 dim overlay 크기
        // 재구성)이나 탭 전환 시 iOS가 video를 임의로 pause하고, 심한 경우
        // srcObject를 떼어내기도 함. 수동 복구 경로를 등록해 프리뷰가 "영구
        // 정지"되는 상황을 차단한다.
        const resumePlayback = () => {
          if (cancelled) return;
          if (!video.srcObject && stream) video.srcObject = stream;
          if (video.paused) {
            video.play().catch(() => { /* 첫 gesture 이후엔 대개 성공 */ });
          }
        };
        video.addEventListener('pause', resumePlayback);
        video.addEventListener('suspend', resumePlayback);
        video.addEventListener('stalled', resumePlayback);
        const onVisible = () => {
          if (document.visibilityState === 'visible') resumePlayback();
        };
        document.addEventListener('visibilitychange', onVisible);
        recoveryHandlersRef.current = () => {
          video.removeEventListener('pause', resumePlayback);
          video.removeEventListener('suspend', resumePlayback);
          video.removeEventListener('stalled', resumePlayback);
          document.removeEventListener('visibilitychange', onVisible);
        };

        // 첫 프레임 데이터 준비 대기 — detect() 호출 전 video.readyState ≥ 2 보장.
        if (video.readyState < 2) {
          await new Promise<void>(resolve => {
            const onReady = () => {
              video.removeEventListener('loadeddata', onReady);
              resolve();
            };
            video.addEventListener('loadeddata', onReady);
          });
        }
        if (cancelled) return;

        // ── 2. Tier 1: BarcodeDetector ────────────────────────────────────────
        // Chrome Android, Samsung Internet, iOS Safari 17+ 등에서 OS-level barcode
        // 스캐너를 직접 호출. 순수 JS zxing 대비 수십 배 빠르고 검출률 높음.
        const win = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
        if (win.BarcodeDetector) {
          try {
            const supported = await win.BarcodeDetector.getSupportedFormats();
            const want = BD_FORMATS.filter(f => supported.includes(f));
            if (want.length > 0) {
              const detector = new win.BarcodeDetector({ formats: want });
              // eslint-disable-next-line no-console
              console.info('[ScannerCamera] using BarcodeDetector', want);

              let logged = false;
              const loop = async () => {
                if (cancelled) return;
                // detect()는 active 여부와 무관하게 계속 호출 — iOS Safari는
                // 프레임 소비자가 없으면 MediaStream을 throttle/pause하는
                // 것으로 의심됨 (OCR 모드에서 프리뷰가 검게 되는 원인).
                // active=false면 콜백만 억제한다.
                try {
                  const codes = await detector.detect(video);
                  if (codes.length && activeRef.current && callbackRef.current) {
                    if (!logged) {
                      // eslint-disable-next-line no-console
                      console.info('[ScannerCamera] detected', codes[0].format, codes[0].rawValue);
                      logged = true;
                    }
                    callbackRef.current({
                      data: codes[0].rawValue,
                      type: codes[0].format,
                    });
                  }
                } catch {
                  // 프레임 전환 타이밍의 transient error는 무시 (다음 rAF에서 재시도)
                }
                rafId = requestAnimationFrame(loop);
              };
              rafId = requestAnimationFrame(loop);
              return;
            }
          } catch {
            // format 조회/생성 실패 → zxing 폴백
          }
        }

        // ── 3. Tier 2: zxing-browser fallback ────────────────────────────────
        // iOS <17, Firefox, BarcodeDetector 미탑재 브라우저용.
        // eslint-disable-next-line no-console
        console.info('[ScannerCamera] using zxing fallback');
        const reader = new BrowserMultiFormatReader(buildZxingHints(), {
          delayBetweenScanAttempts: 200,
        });
        try {
          zxingControls = await reader.decodeFromStream(
            stream,
            video,
            (result) => {
              if (cancelled) return;
              if (!activeRef.current) return; // 프리뷰는 유지, 콜백만 억제
              if (result && callbackRef.current) {
                callbackRef.current({
                  data: result.getText(),
                  type: result.getBarcodeFormat().toString(),
                });
              }
            },
          );
        } catch (err) {
          reportError(err);
        }
      }

      start();

      return () => {
        cancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
        zxingControls?.stop();
        zxingControls = null;
        recoveryHandlersRef.current?.();
        recoveryHandlersRef.current = null;
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          stream = null;
        }
        if (video.srcObject) {
          video.srcObject = null;
        }
      };
    }, [facing]);

    // active=false → true 전환 시 video가 어떤 이유로든 paused 상태라면
    // 복구 — iOS Safari에서 OCR 모드 복귀 등 사용자 제스처 직후 호출되므로
    // play()가 autoplay 정책에 걸리지 않는다.
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (active && video.paused && video.srcObject) {
        video.play().catch(() => { /* 권한 재요청 등은 무시 */ });
      }
    }, [active]);

    return (
      <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
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
