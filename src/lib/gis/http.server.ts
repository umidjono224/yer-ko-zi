/** Server tomonidagi umumiy yordamchilar: cache, rate limit, xavfsiz fetch. */

const USER_AGENT = "UzGisMonitoring/1.0 (open-data research; contact: admin@example.org)";

type CacheEntry = { at: number; value: unknown };
const cache = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string, ttlMs: number): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown) {
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), value });
}

const buckets = new Map<string, number[]>();

/** Oddiy sliding-window rate limit. Limitdan oshsa false qaytaradi. */
export function allowRequest(bucket: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(bucket) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(bucket, hits);
    return false;
  }
  hits.push(now);
  buckets.set(bucket, hits);
  return true;
}

export interface ProbeResult {
  url: string;
  ok: boolean;
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
}

export async function probe(url: string, init?: RequestInit, timeoutMs = 12_000): Promise<ProbeResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, ...(init?.headers as Record<string, string> | undefined) },
    });
    return {
      url,
      ok: response.ok,
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      httpStatus: null,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Noma'lum tarmoq xatosi",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon"
  );
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
