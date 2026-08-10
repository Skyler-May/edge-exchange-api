import { Env } from '../types';

export async function insertRate(
  base: string,
  target: string,
  rate: number,
  source: string,
  timestamp: number,
  env: Env
) {
  await env.FX_DB.prepare(
    `INSERT INTO exchange_rates (base, target, rate, source, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(base, target, rate, source, timestamp).run();
}

export async function insertHourlyAggregation(
  base: string,
  target: string,
  hourBucket: number,
  open: number,
  high: number,
  low: number,
  close: number,
  source: string,
  env: Env
) {
  await env.FX_DB.prepare(
    `INSERT OR REPLACE INTO hourly_rates (base, target, hour_bucket, open, high, low, close, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(base, target, hourBucket, open, high, low, close, source).run();
}

export async function logSystem(
  level: 'info' | 'error',
  message: string,
  source: string,
  details: any = null,
  env: Env
) {
  await env.FX_DB.prepare(
    `INSERT INTO system_logs (level, message, source, details, timestamp)
     VALUES (?, ?, ?, ?, strftime('%s','now'))`
  ).bind(level, message, source, details ? JSON.stringify(details) : null).run();
}