import { Env, DataSource } from '../types/index';
import { getCache, setCache, deleteCache } from '../utils/cache';

const SOURCES_CACHE_KEY = 'active_sources';

export async function getActiveSources(env: Env): Promise<DataSource[]> {
  const cached = await getCache<DataSource[]>(SOURCES_CACHE_KEY, env);
  if (cached) return cached;
  
  const { results } = await env.FX_DB.prepare(
    'SELECT * FROM data_sources WHERE is_active = 1 ORDER BY priority ASC'
  ).all<DataSource>();
  
  await setCache(SOURCES_CACHE_KEY, results, 60, env);
  return results;
}

export async function updateFailCount(id: number, env: Env) {
  await env.FX_DB.prepare(
    `UPDATE data_sources SET fail_count = fail_count + 1, last_fail_time = datetime('now') WHERE id = ?`
  ).bind(id).run();
}

export async function resetFailCount(id: number, env: Env) {
  await env.FX_DB.prepare(
    `UPDATE data_sources SET fail_count = 0, last_fail_time = NULL WHERE id = ?`
  ).bind(id).run();
}

export async function addSource(name: string, baseUrl: string, priority: number, isMain: boolean, env: Env) {
  await env.FX_DB.prepare(
    `INSERT INTO data_sources (name, base_url, priority, is_main) VALUES (?, ?, ?, ?)`
  ).bind(name, baseUrl, priority, isMain).run();
  await deleteCache(SOURCES_CACHE_KEY, env);
}

export async function deleteSource(id: number, env: Env) {
  await env.FX_DB.prepare(`DELETE FROM data_sources WHERE id = ?`).bind(id).run();
  await deleteCache(SOURCES_CACHE_KEY, env);
}

export async function updateSource(id: number, updates: Partial<DataSource>, env: Env) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  await env.FX_DB.prepare(`UPDATE data_sources SET ${fields} WHERE id = ?`).bind(...values).run();
  await deleteCache(SOURCES_CACHE_KEY, env);
}

export async function getStatus(env: Env) {
  const sources = await getActiveSources(env);
  const status = {
    last_update: null as number | null,
    sources: sources.map(s => ({
      name: s.name,
      priority: s.priority,
      fail_count: s.fail_count,
      status: (s.fail_count >= 3 && s.last_fail_time) ? 'cooldown' as const : 'healthy' as const,
      last_fail: s.last_fail_time
    }))
  };
  const sample = await getCache<{ timestamp: number }>('rate:BTC:USDT', env);
  if (sample) status.last_update = sample.timestamp;
  return status;
}