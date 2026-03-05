type Bucket = {
  count: number;
  resetAt: number;
};

const memory = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = memory.get(key);

  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  memory.set(key, current);

  return { allowed: true, remaining: Math.max(0, limit - current.count) };
}
