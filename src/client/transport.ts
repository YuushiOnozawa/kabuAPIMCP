const DEFAULT_TIMEOUT_MS = 10_000;

export type TransportResult<T> =
  | { kind: 'success'; status: number; body: T | undefined }
  | { kind: 'httpError'; status: number; body: unknown }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'parseFailure'; status: number; rawBody: string };

type RequestJsonInit = RequestInit & {
  timeoutMs?: number;
};

function resolveTimeoutMs(timeoutMs: number | undefined): number {
  if (timeoutMs !== undefined && Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }

  return DEFAULT_TIMEOUT_MS;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'TimeoutError'
  );
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export async function requestJson<T>(
  url: string,
  init?: RequestJsonInit,
): Promise<TransportResult<T>> {
  const timeoutMs = resolveTimeoutMs(init?.timeoutMs);
  let timeoutSignal: AbortSignal;

  try {
    timeoutSignal = AbortSignal.timeout(timeoutMs);
  } catch {
    timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  }

  const requestInit: RequestJsonInit = {
    ...init,
    signal: timeoutSignal,
  };
  delete requestInit.timeoutMs;

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    if (isTimeoutError(error)) {
      return { kind: 'timeout', timeoutMs };
    }

    return { kind: 'network', message: errorMessage(error) };
  }

  let rawBody: string;
  try {
    rawBody = await response.text();
  } catch (error) {
    const message = errorMessage(error);

    if (isSuccessStatus(response.status)) {
      return { kind: 'parseFailure', status: response.status, rawBody: message };
    }

    return { kind: 'httpError', status: response.status, body: message };
  }

  if (isSuccessStatus(response.status)) {
    if (rawBody === '') {
      return { kind: 'success', status: response.status, body: undefined };
    }

    try {
      return {
        kind: 'success',
        status: response.status,
        body: JSON.parse(rawBody) as T,
      };
    } catch {
      return { kind: 'parseFailure', status: response.status, rawBody };
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  return { kind: 'httpError', status: response.status, body };
}
