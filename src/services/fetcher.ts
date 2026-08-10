import { Env, DataSource, RateResult } from '../types/index.js';
import { getActiveSources, updateFailCount, resetFailCount } from './sourceRegistry.js';
import { validateRate } from './validator.js';
import { setCache, getCache } from '../utils/cache.js';
import { insertRate, logSystem } from '../utils/db.js';
import { isInCooldown } from '../utils/circuitBreaker.js';
import { aggregateHourly } from './aggregator.js';

const PAIRS = [
  { base: 'BTC', target: 'USDT' },
  { base: 'ETH', target: 'USDT' },
  { base: 'SOL', target: 'USDT' },
];

function buildUrl(baseUrl: string, base: string, target: string): string {
  if (baseUrl.includes('binance')) {
    return `${baseUrl}?symbol=${base}${target}`;
  }
  if (baseUrl.includes('okx')) {
    return `${baseUrl}?instId=${base}-${target}`;
  }
  if (baseUrl.includes('coinbase')) {
    return `${baseUrl}?base=${base}&currency=${target}`;
  }
  if (baseUrl.includes('cryptocompare')) {
    // CryptoCompare 的 URL 格式：https://min-api.cryptocompare.com/data/price?fsym={base}&tsyms={target}
    // 注意 {base} 和 {target} 已经在 SQL 中写好了，无需替换
    return baseUrl.replace(/\{base\}/g, base).replace(/\{target\}/g, target);
  }
  // 通用替换
  return baseUrl.replace(/\{base\}/g, base).replace(/\{target\}/g, target);
}

function parsePrice(sourceName: string, data: any): number | null {
  try {
    if (sourceName === 'Binance') return parseFloat(data.price);
    if (sourceName === 'OKX') return parseFloat(data.data?.[0]?.last);
    if (sourceName === 'Coinbase') return parseFloat(data.data?.amount);
    if (sourceName === 'CryptoCompare') {
      // CryptoCompare 返回 { "USD": 60000 } 或类似，但 tsyms 是目标币种
      // 由于我们请求的是 USDT，所以取 data.USDT
      const target = Object.keys(data)[0] || 'USDT';
      return parseFloat(data[target]);
    }
    // 通用兜底
    return parseFloat(data.price || data.last || data.close || data.rate);
  } catch {
    return null;
  }
}

async function doFetch(source: DataSource, base: string, target: string): Promise<number | null> {
  const url = buildUrl(source.base_url, base, target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.timeout_ms || 3000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return parsePrice(source.name, data);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function fetchRateForPair(base: string, target: string, env: Env): Promise<RateResult> {
  const sources = await getActiveSources(env);
  const sorted = sources
    .filter(s => s.is_active && !isInCooldown(s))
    .sort((a, b) => a.priority - b.priority);

  let lastError: Error | null = null;
  for (const source of sorted) {
    try {
      const rate = await doFetch(source, base, target);
      if (rate !== null && validateRate(rate, base, target)) {
        await resetFailCount(source.id, env);
        return { rate, source: source.name, timestamp: Math.floor(Date.now() / 1000) };
      }
    } catch (err) {
      lastError = err as Error;
      await updateFailCount(source.id, env);
      console.warn(`[${source.name}] 失败:`, err);
    }
  }
  throw new Error(`所有数据源不可用: ${lastError?.message || '未知错误'}`);
}

export async function getLatestRate(base: string, target: string, env: Env): Promise<RateResult> {
  const cacheKey = `rate:${base}:${target}`;
  const cached = await getCache<RateResult>(cacheKey, env);
  if (cached) return { ...cached, cached: true };

  const result = await fetchRateForPair(base, target, env);
  await setCache(cacheKey, { ...result, cached: false }, 300, env);
  // 异步写入历史
  if (env.ctx) {
    env.ctx.waitUntil(insertRate(base, target, result.rate, result.source, result.timestamp, env));
  }
  return result;
}

export async function fetchAndStoreAllRates(env: Env) {
  const results: RateResult[] = [];
  for (const pair of PAIRS) {
    try {
      const result = await fetchRateForPair(pair.base, pair.target, env);
      const cacheKey = `rate:${pair.base}:${pair.target}`;
      await setCache(cacheKey, { ...result, cached: false }, 300, env);
      await insertRate(pair.base, pair.target, result.rate, result.source, result.timestamp, env);
      results.push(result);
    } catch (err) {
      await logSystem('error', `拉取 ${pair.base}/${pair.target} 失败`, 'cron', { error: (err as Error).message }, env);
    }
  }
  // 执行小时聚合（异步）
  if (env.ctx) {
    env.ctx.waitUntil(aggregateHourly(env));
  }
  return results;
}

export async function getHistory(base: string, target: string, days: number, interval: 'hour' | 'day', env: Env) {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const rows = await env.FX_DB.prepare(
    `SELECT hour_bucket, open, high, low, close
     FROM hourly_rates
     WHERE base = ? AND target = ? AND hour_bucket >= ?
     ORDER BY hour_bucket ASC`
  ).bind(base, target, since).all();
  return rows.results || [];
}