interface RateLimitState {
  timestamps: number[];
}

const globalRateLimit = globalThis as typeof globalThis & {
  __pengRateLimits?: Map<string, RateLimitState>;
};

const states = globalRateLimit.__pengRateLimits ?? new Map<string, RateLimitState>();
globalRateLimit.__pengRateLimits = states;

export function checkRateLimit(
  key: string,
  limit = 6,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (states.get(key)?.timestamps ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
    };
  }
  recent.push(now);
  states.set(key, { timestamps: recent });
  if (states.size > 2_000) {
    for (const [candidateKey, state] of states) {
      if (state.timestamps.every((timestamp) => timestamp <= cutoff)) states.delete(candidateKey);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
