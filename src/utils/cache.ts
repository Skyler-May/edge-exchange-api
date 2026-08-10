import { Env } from '../types';

export async function getCache<T>(key: string, env: Env): Promise<T | null> {
  const value = await env.FX_CACHE.get(key, 'json');
  return value as T | null;
}

export async function setCache<T>(key: string, value: T, ttl = 60, env: Env): Promise<void> {
  await env.FX_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
}

export async function deleteCache(key: string, env: Env): Promise<void> {
  await env.FX_CACHE.delete(key);
}