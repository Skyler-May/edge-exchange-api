import { Env } from '../types/index.js';

export async function aggregateHourly(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const lastHour = Math.floor(now / 3600) * 3600 - 3600;
  // 检查是否已聚合
  const exists = await env.FX_DB.prepare(
    'SELECT id FROM hourly_rates WHERE hour_bucket = ? LIMIT 1'
  ).bind(lastHour).first<{ id: number }>();
  if (exists) return;

  const rows = await env.FX_DB.prepare(`
    SELECT 
      base, target,
      MIN(rate) as low,
      MAX(rate) as high,
      (SELECT rate FROM exchange_rates e2 WHERE e2.base = e1.base AND e2.target = e1.target 
       AND e2.timestamp >= ? AND e2.timestamp < ? + 3600 ORDER BY timestamp ASC LIMIT 1) as open,
      (SELECT rate FROM exchange_rates e2 WHERE e2.base = e1.base AND e2.target = e1.target 
       AND e2.timestamp >= ? AND e2.timestamp < ? + 3600 ORDER BY timestamp DESC LIMIT 1) as close,
      source
    FROM exchange_rates e1
    WHERE timestamp >= ? AND timestamp < ? + 3600
    GROUP BY base, target
  `).bind(lastHour, lastHour, lastHour, lastHour, lastHour, lastHour).all<{
    base: string;
    target: string;
    low: number;
    high: number;
    open: number;
    close: number;
    source: string;
  }>();

  for (const row of rows.results || []) {
    await env.FX_DB.prepare(`
      INSERT INTO hourly_rates (base, target, hour_bucket, open, high, low, close, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(row.base, row.target, lastHour, row.open, row.high, row.low, row.close, row.source).run();
  }
}