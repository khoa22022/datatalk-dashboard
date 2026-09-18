export function buildTrialHeaders(options = {}) {
  const hasBody = options.body !== undefined && options.body !== null;
  return {
    Accept: 'application/json',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };
}

export async function requestWithRetry(url, options = {}) {
  const {
    fetchImpl = fetch,
    attempts = 3,
    delayMs = 1000,
    timeoutMs = 15000,
    shouldRetry = () => true,
  } = options;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { cache: 'no-store', signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error)) throw error;
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Request failed');
}
