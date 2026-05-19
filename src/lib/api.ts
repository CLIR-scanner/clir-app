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

// ─── 활성 프로필 헤더 ─────────────────────────────────────────────────────────

let _activeProfileId: string | null = null;

/** 활성 멤버 프로필 ID 설정. null = 메인 프로필 (헤더 미주입). */
export function setActiveProfileId(id: string | null): void {
  _activeProfileId = id;
}

/** 현재 활성 멤버 프로필 ID (null = 메인) */
export function getActiveProfileId(): string | null {
  return _activeProfileId;
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

// 요청 타임아웃(ms). OCR 이미지 업로드는 무거워 별도 상한.
const JSON_TIMEOUT_MS = 15000;
const FORM_TIMEOUT_MS = 30000;

/**
 * fetch 를 타임아웃·네트워크 실패까지 ApiError 로 정규화한다.
 * → 호출부는 항상 ApiError 만 catch 하면 되고, raw TypeError/AbortError 가
 *   화면에 노출되거나 unhandled 로 새지 않는다. (전 경로 예외처리 일원화)
 */
async function fetchOrThrow(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', '요청 시간이 초과되었습니다.');
    }
    // 네트워크 단절 등 fetch reject — raw TypeError 를 그대로 던지지 않는다.
    throw new ApiError(0, 'NETWORK', '네트워크에 연결할 수 없습니다.');
  } finally {
    clearTimeout(timer);
  }
}

// ─── 멱등 GET 재시도 전략 ─────────────────────────────────────────────────────
// 멱등(GET)에 한해 일시 장애만 최대 2회·지수 백오프 재시도.
// 비멱등(POST/PUT/PATCH/DELETE)·apiFormFetch(OCR) 은 재시도 안 함
// (중복 분석/저장·서버 과부하 방지). 4xx/PRODUCT_NOT_FOUND/401 도 재시도 안 함.
const RETRY_DELAYS_MS = [400, 1200];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** TIMEOUT/NETWORK/5xx 만 재시도 대상. 401·4xx 는 제외. */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof ApiError) || err instanceof UnauthorizedError) return false;
  return err.code === 'TIMEOUT' || err.code === 'NETWORK' || err.status >= 500;
}

function isIdempotent(method?: string): boolean {
  return !method || method.toUpperCase() === 'GET';
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
  const headers: Record<string, string> = { ...options.headers };

  // body가 있을 때만 Content-Type 설정.
  // body 없이 Content-Type: application/json을 보내면 Fastify가 FST_ERR_CTP_EMPTY_JSON_BODY(400)를 반환.
  if (options.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  // 활성 멤버 프로필 ID 가 설정돼 있으면 BE 가 그 프로필 알러지·식이 기준으로 판정.
  // null 이면 메인 프로필 (헤더 생략) — BE resolveActiveProfile 의 기본 동작.
  if (_activeProfileId) {
    headers['X-Active-Profile-Id'] = _activeProfileId;
  }

  const url = `${BASE_URL}${path}`;
  const init = { ...options, headers };
  const idempotent = isIdempotent(options.method);
  const maxAttempts = idempotent ? 1 + RETRY_DELAYS_MS.length : 1;

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchOrThrow(url, init, JSON_TIMEOUT_MS);
      return await handleResponse<T>(response);
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts - 1 && idempotent && isRetryable(e)) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw e;
    }
  }
  throw lastErr; // unreachable — 루프는 반드시 return 또는 throw
}

/**
 * multipart/form-data 요청용 fetch 헬퍼 (OCR 이미지 업로드 등).
 * Content-Type 헤더를 명시하지 않음 — fetch가 boundary 포함해 자동 설정.
 * Accept: application/json 명시 — BE /ocr는 헤더 없으면 SSE(text/event-stream)를 기본 반환.
 */
export async function apiFormFetch<T>(path: string, body: FormData): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  if (_activeProfileId) {
    headers['X-Active-Profile-Id'] = _activeProfileId;
  }

  const response = await fetchOrThrow(
    `${BASE_URL}${path}`,
    { method: 'POST', headers, body },
    FORM_TIMEOUT_MS,
  );

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
