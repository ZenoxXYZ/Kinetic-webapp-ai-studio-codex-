type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

export function rateLimit(key: string, maxRequests: number, windowSeconds: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    buckets.set(key, { count: 1, resetAt });

    return { success: true, remaining: maxRequests - 1, resetAt: new Date(resetAt) };
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: new Date(existing.resetAt) };
  }

  existing.count += 1;

  return {
    success: true,
    remaining: Math.max(maxRequests - existing.count, 0),
    resetAt: new Date(existing.resetAt),
  };
}
