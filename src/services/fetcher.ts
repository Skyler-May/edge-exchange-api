import { DataSource, Env, RateResult } from "../types";
import { getCache, setCache } from "../utils/cache";
import { isInCooldown } from "../utils/circuitBreaker";
import { insertRate, logSystem } from "../utils/db";
import { aggregateHourly } from "./aggregator";
import { getActiveSources, resetFailCount, updateFailCount } from "./sourceRegistry";
import { validateRate } from "./validator";

// 注意：USD/CNY 已移除。当前配置的数据源（Binance/OKX/Coinbase 等）都是加密货币交易所，
// 没有一个能返回法币对行情，保留它只会让每次 cron 都在这一对上把所有源挨个超时一遍，
// 拖长单次执行时间，间接加大触发 cron 重叠的概率。
// 如果确实需要法币汇率，建议接入专门的外汇数据源，并在 validator.ts 里补上对应的范围校验。
const PAIRS = [
  { base: 'BTC', target: 'USDT' },
  { base: 'ETH', target: 'USDT' },
  { base: 'TRX', target: 'USDT' },
  { base: 'SOL', target: 'USDT' },
  { base: 'BNB', target: 'USDT' },
  { base: 'XRP', target: 'USDT' },
  { base: 'ADA', target: 'USDT' },
  { base: 'DOT', target: 'USDT' },
  { base: 'DOGE', target: 'USDT' },
];

function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function buildUrlFromConfig(source: DataSource, base: string, target: string): string {
  let urlTemplate = source.base_url;
  if (source.config) {
    try {
      const config = JSON.parse(source.config);
      if (config.url_template) {
        urlTemplate = config.url_template;
      }
    } catch (e) {}
  }
  return urlTemplate.replace(/\{base\}/g, base).replace(/\{target\}/g, target);
}

function parsePriceFromConfig(data: any, source: DataSource, base: string, target: string): number | null {
  if (!data) return null;
  if (!source.config) {
    return parseFloat(data.price || data.last || data.close || data.rate) || null;
  }

  let config: any;
  try {
    config = JSON.parse(source.config);
  } catch {
    return null;
  }

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

  if (config.price_path) {
    const val = getValueByPath(data, config.price_path);
    if (val !== undefined) return parseFloat(val);
  }

  return parseFloat(data.price || data.last || data.close || data.rate) || null;
}

// 增加标准 Request Header，避免被 Binance/OKX 拦截 HTTP 400/403
async function doFetch(source: DataSource, base: string, target: string): Promise<number | null> {
  const url = buildUrlFromConfig(source, base, target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), source.timeout_ms || 3000);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return parsePriceFromConfig(data, source, base, target);
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

  if (!sorted.length) {
    throw new Error('没有处于健康状态的数据源');
  }

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
      console.warn(`[${source.name}] 请求 ${base}/${target} 失败:`, err);
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

  // 按交易对逐个拉取，单个失败不影响后续，异常统一记录到 system_logs
  for (const pair of PAIRS) {
    try {
      const result = await fetchRateForPair(pair.base, pair.target, env);
      const cacheKey = `rate:${pair.base}:${pair.target}`;

      await setCache(cacheKey, { ...result, cached: false }, 300, env);
      await insertRate(pair.base, pair.target, result.rate, result.source, result.timestamp, env);
      results.push(result);
    } catch (err) {
      console.error(`Cron 拉取 ${pair.base}/${pair.target} 失败:`, err);
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