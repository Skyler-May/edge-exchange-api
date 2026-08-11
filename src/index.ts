import { getLatestRate, getHistory, fetchAndStoreAllRates } from "./services/fetcher";
import { getStatus, getActiveSources, addSource, updateSource, deleteSource } from "./services/sourceRegistry";
import { Env } from "./types";
import { rateLimiter } from "./utils/rateLimiter";
import { jsonResponse, errorResponse } from "./utils/response";
import { getApiDocs } from "./views/docs";
import { getAdminPanel } from "./views/panel";

// Cron 防重叠锁的 KV key 与 TTL
// TTL 略大于单次 cron 预期最长执行时间，防止 Worker 异常退出导致锁卡死
const CRON_LOCK_KEY = 'cron:lock';
const CRON_LOCK_TTL_SECONDS = 90;

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

  // ========== 4. Admin API 路由 ==========
  if (path.startsWith('/api/admin/')) {
    console.log('[Admin] Request received:', path);

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

  // ========== 5. 根路径（API 文档） ==========
  if (path === '/') {
    return new Response(getApiDocs(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // ========== 6. Admin 管理面板（图形界面） ==========
  if (path === '/admin') {
    const adminHtml = getAdminPanel(''); // 传入空字符串，让前端纯依赖用户在登录框输入的 Key
    return new Response(adminHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // 7. 其他所有路径返回 404
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
    console.log('⏰ Cron triggered at', new Date().toISOString(), 'pattern:', event.cron);
    (env as any).ctx = ctx;

    // ---------- 防重叠锁 ----------
    // 如果上一次 scheduled() 因为数据源变多、超时重试等原因还没跑完，
    // 直接跳过本次触发，避免同一批交易对被并发写入两次、fail_count 被并发更新出现竞态。
    const existingLock = await env.FX_CACHE.get(CRON_LOCK_KEY);
    if (existingLock) {
      console.log('⏭️ 上一次 Cron 仍在执行（锁未释放），跳过本次触发');
      return;
    }
    await env.FX_CACHE.put(CRON_LOCK_KEY, String(Date.now()), {
      expirationTtl: CRON_LOCK_TTL_SECONDS
    });

    try {
      const result = await fetchAndStoreAllRates(env);
      console.log(`✅ Cron success, ${result.length} pairs updated`);
    } catch (err) {
      console.error('❌ Cron error:', err);
    } finally {
      // 主动释放锁，不用等 TTL 过期，缩短下一次触发的等待窗口
      await env.FX_CACHE.delete(CRON_LOCK_KEY);
    }
  }
};