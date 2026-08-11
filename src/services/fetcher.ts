import { Env, DataSource, RateResult } from '../types/index.js';
import { getActiveSources, updateFailCount, resetFailCount } from './sourceRegistry.js';
import { validateRate } from './validator.js';
import { setCache, getCache } from '../utils/cache.js';
import { insertRate, logSystem } from '../utils/db.js';
import { isInCooldown } from '../utils/circuitBreaker.js';
import { aggregateHourly } from './aggregator.js';

const PAIRS = [
  // 重点
  { base: 'BTC', target: 'USDT' },
  { base: 'ETH', target: 'USDT' },
  { base: 'TRX', target: 'USDT' },
  // 核心交易对（法币）
  { base: 'USD', target: 'CNY' },
  // 备用主流币种
  { base: 'SOL', target: 'USDT' },
  { base: 'BNB', target: 'USDT' },
  { base: 'XRP', target: 'USDT' },
  { base: 'ADA', target: 'USDT' },
  { base: 'DOT', target: 'USDT' },
  { base: 'DOGE', target: 'USDT' },
];

// ---------- 辅助函数：按点号路径取值 ----------
function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ---------- 从 config 构建 URL ----------
function buildUrlFromConfig(source: DataSource, base: string, target: string): string {
  let urlTemplate = source.base_url;
  // 如果 config 中有 url_template，优先使用
  if (source.config) {
    try {
      const config = JSON.parse(source.config);
      if (config.url_template) {
        urlTemplate = config.url_template;
      }
    } catch (e) {
      // config 解析失败，忽略
    }
  }
  return urlTemplate.replace(/\{base\}/g, base).replace(/\{target\}/g, target);
}

// ---------- 从 config 解析价格 ----------
function parsePriceFromConfig(data: any, source: DataSource, base: string, target: string): number | null {
  if (!source.config) {
    // 无 config，尝试通用解析
    return parseFloat(data.price || data.last || data.close || data.rate) || null;
  }

  let config: any;
  try {
    config = JSON.parse(source.config);
  } catch {
    return null;
  }

  // 1. 如果有 list_path，则在数组中查找
  if (config.list_path) {
    const list = getValueByPath(data, config.list_path);
    if (Array.isArray(list) && config.item_key && config.item_value) {
      const matchValue = config.item_value.replace(/\{base\}/g, base).replace(/\{target\}/g, target);
      const item = list.find((el: any) => String(getValueByPath(el, config.item_key)) === matchValue);
      if (item) {
        const pricePath = config.price_path_in_item || config.price_path;
        if (pricePath) {
          const val = getValueByPath(item, pricePath);
          if (val !== undefined) return parseFloat(val);
        }
      }
    }
    return null;
  }

  // 2. 直接按 price_path 取值
  if (config.price_path) {
    const val = getValueByPath(data, config.price_path);
    if (val !== undefined) return parseFloat(val);
  }

  // 3. 兜底：尝试通用字段
  return parseFloat(data.price || data.last || data.close || data.rate) || null;
}

// ---------- doFetch ----------
async function doFetch(source: DataSource, base: string, target: string): Promise<number | null> {
  const url = buildUrlFromConfig(source, base, target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.timeout_ms || 3000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return parsePriceFromConfig(data, source, base, target);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ---------- 其余函数保持不变 ----------
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