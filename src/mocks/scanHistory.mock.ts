// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { ScanHistory } from '../types';
import { mockProducts } from './product.mock';

export const MOCK_SCAN_HISTORY: ScanHistory[] = [
  {
    id: 'history-001',
    productId: 'prod-001',
    userId: 'user-demo',
    scannedAt: new Date('2026-03-30T10:00:00'),
    result: 'danger',
    product: mockProducts[0],
  },
  {
    id: 'history-002',
    productId: 'prod-002',
    userId: 'user-demo',
    scannedAt: new Date('2026-03-29T14:30:00'),
    result: 'caution',
    product: mockProducts[1],
  },
  {
    id: 'history-003',
    productId: 'prod-003',
    userId: 'user-demo',
    scannedAt: new Date('2026-03-28T09:15:00'),
    result: 'safe',
    product: mockProducts[2],
  },
];
