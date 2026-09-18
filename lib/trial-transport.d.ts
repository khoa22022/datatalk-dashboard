export function requestWithRetry(
  url: string,
  options?: {
    fetchImpl?: typeof fetch;
    attempts?: number;
    delayMs?: number;
    timeoutMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<Response>;

export function buildTrialHeaders(options?: RequestInit): Record<string, string>;
