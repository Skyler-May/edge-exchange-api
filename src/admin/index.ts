import { Router } from 'itty-router';
import { Env } from '../types/index.js';
import { getActiveSources, addSource, deleteSource, updateSource } from '../services/sourceRegistry.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

const adminRouter = Router();

// 全局中间件：捕获所有错误并返回 500
adminRouter.all('*', async (request: Request, env: Env) => {
  console.log('[Admin Router] Entered with URL:', request.url); // 调试日志
  try {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // GET /api/admin/sources
    if (path === '/api/admin/sources' && method === 'GET') {
      console.log('[Admin Router] Handling GET sources');
      const sources = await getActiveSources(env);
      console.log('[Admin Router] Sources fetched:', sources.length);
      return jsonResponse(sources);
    }

    // POST /api/admin/sources
    if (path === '/api/admin/sources' && method === 'POST') {
      console.log('[Admin Router] Handling POST sources');
      const body = await request.json() as any;
      const { name, base_url, priority = 100, is_main = false } = body;
      if (!name || !base_url) return errorResponse('Missing name or base_url', 400);
      await addSource(name, base_url, priority, is_main, env);
      return jsonResponse({ success: true });
    }

    // PUT /api/admin/sources/:id
    if (path.startsWith('/api/admin/sources/') && method === 'PUT') {
      console.log('[Admin Router] Handling PUT sources');
      const id = parseInt(path.split('/').pop() || '0');
      const updates = await request.json() as any;
      await updateSource(id, updates, env);
      return jsonResponse({ success: true });
    }

    // DELETE /api/admin/sources/:id
    if (path.startsWith('/api/admin/sources/') && method === 'DELETE') {
      console.log('[Admin Router] Handling DELETE sources');
      const id = parseInt(path.split('/').pop() || '0');
      await deleteSource(id, env);
      return jsonResponse({ success: true });
    }

    console.log('[Admin Router] No matching route, returning 404');
    return errorResponse('Admin API Not Found', 404);
  } catch (err) {
    console.error('[Admin Router] Uncaught error:', err);
    return errorResponse('Admin Internal Error: ' + (err as Error).message, 500);
  }
});

export default adminRouter;