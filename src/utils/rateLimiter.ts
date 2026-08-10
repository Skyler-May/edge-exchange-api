import { Env } from '../types/index.js';

interface RateRecord {
  count: number;
  reset: number; // 毫秒时间戳
}

export async function rateLimiter(
  key: string,
  env: Env,
  limitPerMinute = 100
): Promise<boolean> {
  const now = Date.now();
  const window = 60 * 1000; // 1 分钟窗口
  const record = (await env.FX_CACHE.get(key, 'json')) as RateRecord | null;

  let current: RateRecord = record || { count: 0, reset: now + window };

  // 如果窗口已过期，重置
  if (now > current.reset) {
    current.count = 1;
    current.reset = now + window;
  } else {
    // 检查是否超限
    if (current.count >= limitPerMinute) {
      return false;
    }
    current.count++;
  }

  // 计算剩余有效秒数，KV 要求最小 TTL 为 60 秒
  let ttl = Math.ceil((current.reset - now) / 1000);
  if (ttl < 60) ttl = 60; // 强制至少 60 秒

  // 写入 KV（确保 TTL 符合要求）
  await env.FX_CACHE.put(key, JSON.stringify(current), { expirationTtl: ttl });

  return true;
}