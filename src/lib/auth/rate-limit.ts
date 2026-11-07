const attempts = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

export function rateLimit(key: string, config: RateLimitConfig = { windowMs: 60000, maxAttempts: 5 }) {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1 };
  }

  if (record.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  attempts.set(key, record);
  return { allowed: true, remaining: config.maxAttempts - record.count };
}

export function getRateLimitKey(identifier: string, endpoint: string) {
  return `${endpoint}:${identifier}`;
}
