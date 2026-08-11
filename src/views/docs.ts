// src/views/docs.ts
export function getApiDocs(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💱 FX Rate API Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #050811;
      --card-bg: rgba(15, 23, 42, 0.65);
      --card-border: rgba(56, 189, 248, 0.15);
      --card-border-hover: rgba(56, 189, 248, 0.4);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --accent: #818cf8;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(129, 140, 248, 0.1) 0px, transparent 50%),
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
      color: var(--text-main);
      padding: 3rem 1.5rem;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }

    .container { max-width: 1100px; width: 100%; }

    .header {
      margin-bottom: 2.5rem;
      position: relative;
    }

    h1 {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .badge {
      background: rgba(56, 189, 248, 0.1);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }

    .endpoint-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 16px;
      padding: 1.75rem;
      border: 1px solid var(--card-border);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: linear-gradient(180deg, var(--primary), var(--accent));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card:hover {
      border-color: var(--card-border-hover);
      transform: translateY(-2px);
      box-shadow: 0 20px 40px -15px rgba(56, 189, 248, 0.15);
    }

    .card:hover::before { opacity: 1; }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .method {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .method.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .method.post { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .method.put { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
    .method.delete { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }

    .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.15rem;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.01em;
    }

    .desc {
      margin: 0.85rem 0 1rem 0;
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .params {
      background: rgba(2, 6, 23, 0.6);
      padding: 1rem 1.25rem;
      border-radius: 12px;
      margin-top: 1rem;
      font-size: 0.875rem;
      border: 1px solid rgba(255,255,255,0.05);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .params-title {
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .params .param {
      color: var(--text-muted);
      line-height: 1.5;
    }

    .params code {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.825rem;
    }

    .example {
      margin-top: 0.85rem;
      background: #020617;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #a5f3fc;
      border: 1px solid rgba(255,255,255,0.08);
      word-break: break-all;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .example span { color: #38bdf8; }

    .footer {
      margin-top: 3.5rem;
      color: var(--text-muted);
      text-align: center;
      font-size: 0.9rem;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 2rem;
    }

    .footer a {
      color: var(--primary);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer a:hover { color: #818cf8; text-decoration: underline; }

    @media (max-width: 640px) {
      body { padding: 1.5rem 1rem; }
      h1 { font-size: 2rem; }
      .card { padding: 1.25rem; }
      .path { font-size: 0.95rem; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>💱 FX Rate API</h1>
    <div class="subtitle">
      <span class="badge">v1.0</span>
      <span>实时加密货币汇率聚合服务 · 多源容灾 · 动态管理</span>
    </div>
  </div>

  <div class="endpoint-grid">

    <!-- 健康检查 -->
    <div class="card">
      <div class="card-header">
        <span class="method get">GET</span>
        <span class="path">/api/v1/status</span>
      </div>
      <div class="desc">系统健康检查，返回当前数据源运行状态及最新心跳数据更新时间。</div>
      <div class="example">curl <span>https://topay.ccwu.cc/api/v1/status</span></div>
    </div>

    <!-- 实时汇率 -->
    <div class="card">
      <div class="card-header">
        <span class="method get">GET</span>
        <span class="path">/api/v1/rate</span>
      </div>
      <div class="desc">获取指定交易对的最新实时汇率（优先从高权重缓存机制读取）。</div>
      <div class="params">
        <div class="params-title">Query Parameters</div>
        <div class="param"><code>from</code> <span style="color:#94a3b8;">(Required) 基础货币，例如 BTC</span></div>
        <div class="param"><code>to</code> <span style="color:#94a3b8;">(Required) 计价货币，例如 USDT</span></div>
      </div>
      <div class="example">curl <span>"https://topay.ccwu.cc/api/v1/rate?from=BTC&to=USDT"</span></div>
    </div>

    <!-- 历史数据 -->
    <div class="card">
      <div class="card-header">
        <span class="method get">GET</span>
        <span class="path">/api/v1/history</span>
      </div>
      <div class="desc">获取指定交易对的历史走势趋势数据（支持按小时或按日进行高精度聚合）。</div>
      <div class="params">
        <div class="params-title">Query Parameters</div>
        <div class="param"><code>from</code> <span style="color:#94a3b8;">(Required) 基础货币</span></div>
        <div class="param"><code>to</code> <span style="color:#94a3b8;">(Required) 计价货币</span></div>
        <div class="param"><code>days</code> <span style="color:#94a3b8;">(Optional) 回溯天数，默认 7 天</span></div>
        <div class="param"><code>interval</code> <span style="color:#94a3b8;">(Optional) 聚合颗粒度 hour / day，默认 hour</span></div>
      </div>
      <div class="example">curl <span>"https://topay.ccwu.cc/api/v1/history?from=BTC&to=USDT&days=7&interval=hour"</span></div>
    </div>

    <!-- 管理后台：数据源列表 -->
    <div class="card">
      <div class="card-header">
        <span class="method get">GET</span>
        <span class="path">/api/admin/sources</span>
      </div>
      <div class="desc">获取当前系统已配置的所有交易所数据源列表（需鉴权）。</div>
      <div class="params">
        <div class="params-title">Headers</div>
        <div class="param"><code>x-api-key</code> <span style="color:#94a3b8;">(Required) Admin 管理密钥</span></div>
      </div>
      <div class="example">curl <span>-H "x-api-key: your-key" https://topay.ccwu.cc/api/admin/sources</span></div>
    </div>

    <!-- 管理后台：添加源 -->
    <div class="card">
      <div class="card-header">
        <span class="method post">POST</span>
        <span class="path">/api/admin/sources</span>
      </div>
      <div class="desc">动态注册并启用新的数据源信息。</div>
      <div class="params">
        <div class="params-title">Body (JSON)</div>
        <div class="param"><code>name</code> <span style="color:#94a3b8;">(Required) 数据源名称</span></div>
        <div class="param"><code>base_url</code> <span style="color:#94a3b8;">(Required) API 终端地址</span></div>
        <div class="param"><code>priority</code> <span style="color:#94a3b8;">(Optional) 优先级数值，默认 100</span></div>
        <div class="param"><code>is_main</code> <span style="color:#94a3b8;">(Optional) 是否主流交易所标志</span></div>
      </div>
      <div class="example">curl <span>-X POST -H "x-api-key: your-key" -H "Content-Type: application/json" -d '{"name":"Gate","base_url":"https://api.gate.io/..."}' https://topay.ccwu.cc/api/admin/sources</span></div>
    </div>

    <!-- 管理后台：更新 & 删除 -->
    <div class="card">
      <div class="card-header">
        <span class="method put">PUT</span>
        <span class="method delete">DELETE</span>
        <span class="path">/api/admin/sources/:id</span>
      </div>
      <div class="desc">根据 ID 动态修改配置参数或移除对应的数据源。</div>
      <div class="params">
        <div class="params-title">Path & Headers</div>
        <div class="param"><code>id</code> <span style="color:#94a3b8;">目标数据源的唯一标示 ID</span></div>
        <div class="param"><code>x-api-key</code> <span style="color:#94a3b8;">Admin 密钥</span></div>
      </div>
      <div class="example">curl <span>-X PUT -H "x-api-key: your-key" -d '{"priority":10}' https://topay.ccwu.cc/api/admin/sources/4</span></div>
    </div>

  </div>

  <div class="footer">
    <p>🚀 极速容灾响应 · 熔断自愈 · 智能限流保护 · 历史聚合引擎</p>
    <p style="margin-top: 0.5rem;">项目源码 · <a href="https://github.com/your-repo" target="_blank">GitHub Repository</a> &nbsp;|&nbsp; Deployed on Cloudflare Workers</p>
  </div>
</div>
</body>
</html>`;
}