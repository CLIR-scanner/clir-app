/**
 * 공통 fetch 헬퍼
 *
 * - BASE_URL: EXPO_PUBLIC_API_BASE_URL 환경변수 (CLIR/.env)
 * - 토큰: 모듈 레벨 메모리 저장 (앱 재시작 시 초기화 → 재로그인 필요)
 * - 401 수신 시 토큰 자동 삭제 + UnauthorizedError throw
 */

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

// ─── 토큰 저장소 ──────────────────────────────────────────────────────────────

let _token: string | null = null;

/** 로그인 성공 후 반드시 호출 */
export function setAuthToken(token: string): void {
  _token = token;
}

/** 로그아웃 또는 401 수신 시 호출 */
export function clearAuthToken(): void {
  _token = null;
}

/** 현재 저장된 토큰 반환 (null = 미인증) */
export function getAuthToken(): string | null {
  return _token;
}

// ─── 에러 타입 ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 401 전용 — 화면에서 catch 후 로그인 화면으로 이동 */
export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'UNAUTHORIZED', '인증이 필요합니다. 다시 로그인해주세요.');
    this.name = 'UnauthorizedError';
  }
}

// ─── fetch 헬퍼 ───────────────────────────────────────────────────────────────

type JsonFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * JSON 요청/응답용 fetch 헬퍼.
 * Content-Type: application/json 자동 설정.
 * 저장된 토큰이 있으면 Authorization: Bearer {token} 자동 주입.
 */
export async function apiFetch<T>(path: string, options: JsonFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  return handleResponse<T>(response);
}

/**
 * multipart/form-data 요청용 fetch 헬퍼 (OCR 이미지 업로드 등).
 * Content-Type 헤더를 명시하지 않음 — fetch가 boundary 포함해 자동 설정.
 */
export async function apiFormFetch<T>(path: string, body: FormData): Promise<T> {
  const headers: Record<string, string> = {};

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body,
  });

  return handleResponse<T>(response);
}

// ─── 응답 처리 ────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      throw new UnauthorizedError();
    }

    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${response.status}`;
    let rawBody: unknown;
    // BE 계약: { error: 'CODE', message: '...' } (플랫). Fastify 디폴트 에러
    // 핸들러는 { statusCode, error, message } 형태로 error가 이름 문자열이므로
    // 같은 키에서 파싱된다. 방어적으로 nested form도 허용.
    try {
      rawBody = await response.json();
      const body = rawBody as {
        error?: string | { code?: string; message?: string };
        message?: string;
      };
      if (typeof body.error === 'string') {
        code = body.error;
      } else if (body.error?.code) {
        code = body.error.code;
      }
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (typeof body.error === 'object' && body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 유지
    }

    throw new ApiError(response.status, code, message, rawBody);
  }

  return response.json() as Promise<T>;
}
