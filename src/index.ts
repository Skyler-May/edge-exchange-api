// 在文件顶部定义 HTML 模板（完整版）
const API_DOCS_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💱 FX Rate API 文档</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0b0e14;
      color: #e8edf3;
      padding: 2rem 1.5rem;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 1200px;
      width: 100%;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      background: linear-gradient(135deg, #f6b26b, #f9d976);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: #8892a0;
      font-size: 1.1rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #1e2630;
      padding-bottom: 1rem;
    }
    .badge {
      display: inline-block;
      background: #2a3340;
      color: #f0c674;
      padding: 0.2rem 0.8rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
      letter-spacing: 0.02em;
    }
    .endpoint-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    .card {
      background: #141b24;
      border-radius: 16px;
      padding: 1.5rem 1.8rem;
      border: 1px solid #232c38;
      transition: border-color 0.2s;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    .card:hover {
      border-color: #3e4c5e;
    }
    .method {
      display: inline-block;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.2rem 0.7rem;
      border-radius: 6px;
      background: #2a3a5c;
      color: #80b5ff;
      margin-right: 0.75rem;
      letter-spacing: 0.04em;
    }
    .method.get { background: #1e3a5f; color: #6cb2ff; }
    .method.post { background: #3d3a1e; color: #f5d76e; }
    .method.put { background: #3d2a1e; color: #f5a97f; }
    .method.delete { background: #3d1e1e; color: #f28b82; }
    .path {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 1.1rem;
      font-weight: 500;
      color: #e8edf3;
    }
    .desc {
      margin: 0.8rem 0 0.5rem 0;
      color: #b0bec5;
      font-size: 0.95rem;
    }
    .params {
      background: #0d1219;
      padding: 0.8rem 1rem;
      border-radius: 10px;
      margin: 0.8rem 0 0 0;
      font-size: 0.9rem;
      border: 1px solid #1e2630;
    }
    .params code {
      background: #1a222c;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      color: #f0c674;
      font-size: 0.85rem;
    }
    .params .param {
      display: inline-block;
      margin-right: 1.5rem;
      color: #b0bec5;
    }
    .params .param strong {
      color: #d4dce8;
    }
    .example {
      margin-top: 0.6rem;
      background: #0d1219;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.85rem;
      color: #b0c7d9;
      border: 1px solid #1e2630;
      word-break: break-all;
    }
    .example span { color: #6cb2ff; }
    .footer {
      margin-top: 2.5rem;
      color: #5a6a7a;
      text-align: center;
      font-size: 0.9rem;
      border-top: 1px solid #1a222c;
      padding-top: 1.5rem;
    }
    .footer a {
      color: #7a9bcb;
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      body { padding: 1rem; }
      h1 { font-size: 1.8rem; }
      .card { padding: 1.2rem; }
      .path { font-size: 1rem; }
      .params .param { display: block; margin-bottom: 0.3rem; }
    }
  </style>
</head>
<body>
<div class="container">
  <h1>💱 FX Rate API</h1>
  <div class="subtitle">
    <span class="badge">v1.0</span>
    实时加密货币汇率聚合服务 · 多源容灾 · 动态管理
  </div>

  <div class="endpoint-grid">

    <!-- 健康检查 -->
    <div class="card">
      <div><span class="method get">GET</span><span class="path">/api/v1/status</span></div>
      <div class="desc">系统健康检查，返回当前数据源状态及最后更新时间。</div>
      <div class="example">curl <span>https://topay.ccwu.cc/api/v1/status</span></div>
    </div>

    <!-- 实时汇率 -->
    <div class="card">
      <div><span class="method get">GET</span><span class="path">/api/v1/rate</span></div>
      <div class="desc">获取指定交易对的最新汇率（优先从缓存读取）。</div>
      <div class="params">
        <div class="param"><strong>参数：</strong></div>
        <div class="param"><code>from</code> <span style="color:#b0bec5;">(必填) 基础货币，如 BTC</span></div>
        <div class="param"><code>to</code> <span style="color:#b0bec5;">(必填) 计价货币，如 USDT</span></div>
      </div>
      <div class="example">curl <span>"https://topay.ccwu.cc/api/v1/rate?from=BTC&to=USDT"</span></div>
    </div>

    <!-- 历史数据 -->
    <div class="card">
      <div><span class="method get">GET</span><span class="path">/api/v1/history</span></div>
      <div class="desc">获取指定交易对的历史走势数据（小时/日聚合）。</div>
      <div class="params">
        <div class="param"><strong>参数：</strong></div>
        <div class="param"><code>from</code> <span style="color:#b0bec5;">(必填) 基础货币</span></div>
        <div class="param"><code>to</code> <span style="color:#b0bec5;">(必填) 计价货币</span></div>
        <div class="param"><code>days</code> <span style="color:#b0bec5;">(可选) 天数，默认 7</span></div>
        <div class="param"><code>interval</code> <span style="color:#b0bec5;">(可选) hour / day，默认 hour</span></div>
      </div>
      <div class="example">curl <span>"https://topay.ccwu.cc/api/v1/history?from=BTC&to=USDT&days=7&interval=hour"</span></div>
    </div>

    <!-- 管理后台：数据源列表 -->
    <div class="card">
      <div><span class="method get">GET</span><span class="path">/api/admin/sources</span></div>
      <div class="desc">获取当前所有数据源配置（需 Admin API Key）。</div>
      <div class="params">
        <div class="param"><strong>Header：</strong></div>
        <div class="param"><code>x-api-key</code> <span style="color:#b0bec5;">(必填) 管理密钥</span></div>
      </div>
      <div class="example">curl <span>-H "x-api-key: your-key" https://topay.ccwu.cc/api/admin/sources</span></div>
    </div>

    <!-- 管理后台：添加源 -->
    <div class="card">
      <div><span class="method post">POST</span><span class="path">/api/admin/sources</span></div>
      <div class="desc">动态添加新的数据源（需 Admin API Key）。</div>
      <div class="params">
        <div class="param"><strong>Body (JSON)：</strong></div>
        <div class="param"><code>name</code> <span style="color:#b0bec5;">(必填) 源名称</span></div>
        <div class="param"><code>base_url</code> <span style="color:#b0bec5;">(必填) API 端点</span></div>
        <div class="param"><code>priority</code> <span style="color:#b0bec5;">(可选) 优先级，默认 100</span></div>
        <div class="param"><code>is_main</code> <span style="color:#b0bec5;">(可选) 是否主流交易所</span></div>
      </div>
      <div class="example">curl <span>-X POST -H "x-api-key: your-key" -H "Content-Type: application/json" -d '{"name":"Gate","base_url":"https://api.gate.io/..."}' https://topay.ccwu.cc/api/admin/sources</span></div>
    </div>

    <!-- 管理后台：更新 & 删除 -->
    <div class="card">
      <div>
        <span class="method put">PUT</span><span class="path">/api/admin/sources/:id</span>
        <span style="margin-left:1rem;"><span class="method delete">DELETE</span><span class="path">/api/admin/sources/:id</span></span>
      </div>
      <div class="desc">更新或删除指定 ID 的数据源（需 Admin API Key）。</div>
      <div class="params">
        <div class="param"><strong>路径参数：</strong><code>id</code> <span style="color:#b0bec5;">数据源 ID</span></div>
        <div class="param"><strong>Header：</strong><code>x-api-key</code></div>
        <div class="param" style="margin-top:0.4rem;"><strong>PUT Body：</strong> 任意字段（如 <code>{"priority":10}</code>）</div>
      </div>
      <div class="example">curl <span>-X PUT -H "x-api-key: your-key" -d '{"priority":10}' https://topay.ccwu.cc/api/admin/sources/4</span></div>
    </div>

  </div>

  <div class="footer">
    <p>🚀 数据源自动容灾 · 熔断保护 · 限流控制 · 历史聚合</p>
    <p>项目源码 · <a href="https://github.com/your-repo" target="_blank">GitHub</a> &nbsp;|&nbsp; 部署于 Cloudflare Workers</p>
  </div>
</div>
</body>
</html>`;
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
    console.log('[Debug] API_KEY from env:', env.API_KEY);
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
    return new Response(API_DOCS_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
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