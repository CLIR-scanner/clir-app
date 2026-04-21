import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';

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
}

export interface ScannerCameraHandle {
  takePictureAsync(opts?: { quality?: number }): Promise<{ uri: string }>;
}

const ScannerCamera = forwardRef<ScannerCameraHandle, ScannerCameraProps>(
  ({ facing = 'back', active = true, onBarcodeScanned }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const callbackRef = useRef(onBarcodeScanned);
    callbackRef.current = onBarcodeScanned;

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
        const quality = opts?.quality ?? 0.8;
        const uri = canvas.toDataURL('image/jpeg', quality);
        return { uri };
      },
    }));

    useEffect(() => {
      if (!active) return;
      const video = videoRef.current;
      if (!video) return;

      let cancelled = false;
      const reader = new BrowserMultiFormatReader();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
        },
        audio: false,
      };

      reader
        .decodeFromConstraints(constraints, video, (result, _err, controls) => {
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
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
        .catch(() => {
          // Permission denied or device unavailable — silent. UI fallback lives upstream.
        });

      return () => {
        cancelled = true;
        controlsRef.current?.stop();
        controlsRef.current = null;
      };
    }, [active, facing]);

    return (
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
    );
  },
);

ScannerCamera.displayName = 'ScannerCamera';

export default ScannerCamera;
