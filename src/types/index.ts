export interface Env {
  FX_CACHE: KVNamespace;
  FX_DB: D1Database;
  API_KEY?: string;
  RATE_LIMIT?: string;
  ctx?: ExecutionContext; // 由 worker 注入
}

export interface DataSource {
  id: number;
  name: string;
  base_url: string;
  priority: number;
  is_active: boolean;
  is_main: boolean;
  timeout_ms: number;
  fail_count: number;
  last_fail_time: string | null;
}

export interface RateResult {
  rate: number;
  source: string;
  timestamp: number;
  cached?: boolean;
}

export interface StatusResponse {
  last_update: number | null;
  sources: {
    name: string;
    priority: number;
    fail_count: number;
    status: 'healthy' | 'cooldown' | 'inactive';
    last_fail: string | null;
  }[];
}