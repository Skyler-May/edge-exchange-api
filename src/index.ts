import { Env } from './types/index.js';
import { getLatestRate, getHistory, fetchAndStoreAllRates } from './services/fetcher.js';
import { addSource, deleteSource, getActiveSources, getStatus, updateSource } from './services/sourceRegistry.js';
import adminRouter from './admin/index.js';
import { jsonResponse, errorResponse } from './utils/response.js';
import { rateLimiter } from './utils/rateLimiter.js';

// ---------- 限流函数 ----------
async function checkRateLimit(request: Request, env: Env): Promise<boolean> {
  try {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `rate_limit:${clientIP}`;
    const limit = parseInt(env.RATE_LIMIT || '100');
    return await rateLimiter(key, env, limit);
  } catch (error) {
    console.error('Rate limiter error, allowing request:', error);
    return true;
  }
}

// ---------- 手动路由分发 ----------
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 1. 健康检查
  if (path === '/api/v1/status' && method === 'GET') {
    const status = await getStatus(env);
    return jsonResponse(status);
  }

  // 2. 获取最新汇率
  if (path === '/api/v1/rate' && method === 'GET') {
    const from = url.searchParams.get('from')?.toUpperCase();
    const to = url.searchParams.get('to')?.toUpperCase();
    if (!from || !to) return errorResponse('Missing from/to', 400);
    const result = await getLatestRate(from, to, env);
    return jsonResponse(result);
  }

  // 3. 获取历史数据
  if (path === '/api/v1/history' && method === 'GET') {
    const from = url.searchParams.get('from')?.toUpperCase();
    const to = url.searchParams.get('to')?.toUpperCase();
    const days = parseInt(url.searchParams.get('days') || '7');
    const interval = (url.searchParams.get('interval') || 'hour') as 'hour' | 'day';
    if (!from || !to) return errorResponse('Missing from/to', 400);
    const data = await getHistory(from, to, days, interval, env);
    return jsonResponse(data);
  }

  // ========== 4. Admin 路由（直接在 index.ts 中处理） ==========
  if (path.startsWith('/api/admin/')) {
    console.log('[Admin] Request received:', path); // 调试日志

    // 验证 API Key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== env.API_KEY) {
      console.log('[Admin] Unauthorized: invalid API Key');
      return errorResponse('Unauthorized', 401);
    }

    try {
      // --- GET /api/admin/sources ---
      if (path === '/api/admin/sources' && method === 'GET') {
        console.log('[Admin] Handling GET sources');
        const sources = await getActiveSources(env);
        console.log('[Admin] Sources fetched:', sources.length);
        return jsonResponse(sources);
      }

      // --- POST /api/admin/sources ---
      if (path === '/api/admin/sources' && method === 'POST') {
        console.log('[Admin] Handling POST sources');
        const body = await request.json() as any;
        const { name, base_url, priority = 100, is_main = false } = body;
        if (!name || !base_url) {
          return errorResponse('Missing name or base_url', 400);
        }
        await addSource(name, base_url, priority, is_main, env);
        return jsonResponse({ success: true });
      }

      // --- PUT /api/admin/sources/:id ---
      if (path.startsWith('/api/admin/sources/') && method === 'PUT') {
        console.log('[Admin] Handling PUT sources');
        const id = parseInt(path.split('/').pop() || '0');
        if (!id) return errorResponse('Invalid ID', 400);
        const updates = await request.json() as any;
        await updateSource(id, updates, env);
        return jsonResponse({ success: true });
      }

      // --- DELETE /api/admin/sources/:id ---
      if (path.startsWith('/api/admin/sources/') && method === 'DELETE') {
        console.log('[Admin] Handling DELETE sources');
        const id = parseInt(path.split('/').pop() || '0');
        if (!id) return errorResponse('Invalid ID', 400);
        await deleteSource(id, env);
        return jsonResponse({ success: true });
      }

      // --- 未匹配的 Admin 路由 ---
      console.log('[Admin] No matching route');
      return errorResponse('Admin API Not Found', 404);
    } catch (error) {
      console.error('[Admin] Uncaught error:', error);
      return errorResponse('Admin Internal Error: ' + (error as Error).message, 500);
    }
  }

  // 5. 根路径
  if (path === '/') {
    return errorResponse('Welcome to FX Rate API', 200);
  }

  // 6. 其他所有路径返回 404
  return errorResponse('Not Found', 404);
}

// ---------- Worker 导出 ----------
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    (env as any).ctx = ctx;

    try {
      // 全局限流
      const isAllowed = await checkRateLimit(request, env);
      if (!isAllowed) {
        return errorResponse('Too Many Requests', 429);
      }
      // 路由分发
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Unhandled error in fetch:', error);
      return errorResponse('Internal Server Error', 500);
    }
  },

  // 定时任务
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('⏰ Cron triggered at', new Date().toISOString());
    (env as any).ctx = ctx;
    try {
      const result = await fetchAndStoreAllRates(env);
      console.log(`✅ Cron success, ${result.length} pairs updated`);
    } catch (err) {
      console.error('❌ Cron error:', err);
    }
  }
};