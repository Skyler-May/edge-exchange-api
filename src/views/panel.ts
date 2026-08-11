// src/admin/panel.ts
export function getAdminPanel(apiKey: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ FX Gateway | Control Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(17, 24, 39, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(56, 189, 248, 0.5);
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --accent: #6366f1;
      --text: #f9fafb;
      --text-dim: #9ca3af;
      --success: #34d399;
      --warning: #fbbf24;
      --danger: #f87171;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 70%),
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 100% 100%, 30px 30px, 30px 30px;
    }

    /* 登录屏 Login Screen */
    .login-wrapper {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999;
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.15) 0%, transparent 60%),
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 100% 100%, 40px 40px, 40px 40px;
    }

    .login-card {
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      padding: 2.5rem;
      border-radius: 24px;
      width: 90%;
      max-width: 420px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.1);
      text-align: center;
      animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .login-card h2 {
      font-size: 1.75rem;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .login-card p {
      color: var(--text-dim);
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .login-form input {
      width: 100%;
      padding: 0.85rem 1.25rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
      text-align: center;
    }

    /* 主控制台 Main Admin Console */
    .app-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      display: none; /* 未登录前隐藏 */
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand h1 {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand p {
      color: var(--text-dim);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    /* 指标仪表盘 Dashboard Metrics */
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 1.25rem;
      border-radius: 14px;
      backdrop-filter: blur(12px);
    }

    .metric-card .title {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .metric-card .value {
      font-size: 1.8rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.25rem;
      color: #fff;
    }

    /* 操作区 Quick Form */
    .control-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .form-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .actions {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr auto auto;
      gap: 0.75rem;
      align-items: center;
    }

    input, select {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: rgba(3, 7, 18, 0.6);
      color: var(--text);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }

    .btn {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #38bdf8, #0284c7);
      color: #fff;
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(56, 189, 248, 0.4); }

    .btn-secondary {
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }

    .btn-danger {
      background: rgba(248, 113, 113, 0.15);
      color: var(--danger);
      border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .btn-danger:hover { background: rgba(248, 113, 113, 0.25); }

    /* 数据源卡片 Source List */
    .list-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .source-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(12px);
      transition: all 0.2s ease;
      animation: fadeIn 0.3s ease-in-out;
    }

    .source-card:hover {
      border-color: rgba(56, 189, 248, 0.3);
      transform: translateX(4px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .info-main {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.4rem;
    }

    .info-main strong {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }

    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge.healthy { background: rgba(52, 211, 153, 0.15); color: var(--success); border: 1px solid rgba(52, 211, 153, 0.3); }
    .badge.cooldown { background: rgba(251, 191, 36, 0.15); color: var(--warning); border: 1px solid rgba(251, 191, 36, 0.3); }
    .badge.active { background: rgba(56, 189, 248, 0.15); color: var(--primary); border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge.inactive { background: rgba(248, 113, 113, 0.15); color: var(--danger); border: 1px solid rgba(248, 113, 113, 0.3); }

    .info-sub {
      font-size: 0.85rem;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.5;
    }

    .btn-icon {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      color: var(--text-dim);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-icon.danger:hover { background: rgba(248, 113, 113, 0.2); color: var(--danger); border-color: rgba(248, 113, 113, 0.4); }

    /* Modal 弹窗 */
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(8px);
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal.active { display: flex; }

    .modal-content {
      background: #0b1329;
      padding: 2rem;
      border-radius: 20px;
      max-width: 480px;
      width: 90%;
      border: 1px solid var(--border);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    .modal-content h2 { margin-bottom: 1.25rem; font-size: 1.25rem; color: #fff; }

    /* Toast 通知 */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #0f172a;
      padding: 0.85rem 1.5rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      color: var(--text);
      font-weight: 500;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2000;
    }

    .toast.show { transform: translateY(0); opacity: 1; }
    .toast.success { border-color: var(--success); }
    .toast.error { border-color: var(--danger); }

    @media (max-width: 768px) {
      .actions { grid-template-columns: 1fr; }
      .source-card { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .card-actions { width: 100%; display: flex; justify-content: flex-end; }
    }
  </style>
</head>
<body>

<!-- 1. 登录界面 -->
<div class="login-wrapper" id="loginWrapper">
  <div class="login-card">
    <h2>⚡ Admin Login</h2>
    <p>请输入后台 API 密钥开启管理权限</p>
    <form class="login-form" id="loginForm" onsubmit="handleLogin(event)">
      <input type="password" id="inputApiKey" placeholder="输入 Admin API Key..." required />
      <button type="submit" class="btn btn-primary" style="width: 100%;">验证身份并登录</button>
    </form>
  </div>
</div>

<!-- 2. 管理面板容器 -->
<div class="app-container" id="appContainer">
  <div class="header">
    <div class="brand">
      <h1>⚡ Control Panel</h1>
      <p>FX Gateway 节点控制器 & 数据源聚合路由管理</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn btn-secondary" onclick="copyApiKey()">🔑 复制 Key</button>
      <button class="btn btn-danger" onclick="handleLogout()">🚪 退出登录</button>
    </div>
  </div>

  <!-- Dashboard 指标板 -->
  <div class="metrics">
    <div class="metric-card">
      <div class="title">数据源总数</div>
      <div class="value" id="statTotal">0</div>
    </div>
    <div class="metric-card">
      <div class="title">在线/启用</div>
      <div class="value" style="color: var(--success)" id="statActive">0</div>
    </div>
    <div class="metric-card">
      <div class="title">熔断/冷却中</div>
      <div class="value" style="color: var(--warning)" id="statCooldown">0</div>
    </div>
  </div>

  <!-- 操作入口 -->
  <div class="control-panel">
    <div class="form-title">➕ 动态挂载新数据源</div>
    <div class="actions">
      <input type="text" id="newName" placeholder="源名称 (如 Binance)" />
      <input type="text" id="newUrl" placeholder="API Endpoint 完整地址" />
      <input type="number" id="newPriority" placeholder="权重 (默认 10)" value="10" />
      <button class="btn btn-primary" id="addBtn">添加数据源</button>
      <button class="btn btn-secondary" id="refreshBtn">🔄 刷新</button>
    </div>
  </div>

  <!-- 列表 -->
  <div class="list-title">
    <span>运行节点一览</span>
  </div>
  
  <div id="sourceList" class="card-grid"></div>
</div>

<!-- Modal 编辑框 -->
<div class="modal" id="editModal">
  <div class="modal-content">
    <h2>✏️ 编辑数据源配置</h2>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <input type="text" id="editName" placeholder="数据源名称" />
      <input type="text" id="editUrl" placeholder="API Endpoint" />
      <input type="number" id="editPriority" placeholder="优先级" />
      <label style="color: var(--text-dim); display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer;">
        <input type="checkbox" id="editActive" style="width: auto;" /> 启用此数据源
      </label>
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem;">
        <button class="btn btn-secondary" id="editCancel">取消</button>
        <button class="btn btn-primary" id="editSave">💾 保存配置</button>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  const API_BASE = '/api/admin/sources';
  let CURRENT_API_KEY = localStorage.getItem('fx_admin_key') || '';

  let sources = [];
  let editingId = null;

  const toast = (msg, type = 'success') => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show ' + type;
    setTimeout(() => el.classList.remove('show'), 3000);
  };

  const copyApiKey = () => {
    if(!CURRENT_API_KEY) return;
    navigator.clipboard.writeText(CURRENT_API_KEY);
    toast('🔑 API Key 已复制到剪贴板');
  };

  /* 认证与登录逻辑 */
  const handleLogin = async (e) => {
    e.preventDefault();
    const inputKey = document.getElementById('inputApiKey').value.trim();
    if (!inputKey) return;

    // 发起测试请求验证 Key 正确性
    try {
      const res = await fetch(API_BASE, { headers: { 'x-api-key': inputKey } });
      if (res.status === 401 || res.status === 403) {
        toast('❌ API Key 不正确，拒绝访问', 'error');
        return;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);

      // 验证通过，保存状态
      CURRENT_API_KEY = inputKey;
      localStorage.setItem('fx_admin_key', inputKey);
      
      document.getElementById('loginWrapper').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      toast('⚡ 身份验证成功，欢迎回来');
      
      sources = await res.json();
      renderSources();
      updateMetrics();
    } catch (err) {
      toast('验证失败: ' + err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fx_admin_key');
    CURRENT_API_KEY = '';
    document.getElementById('loginWrapper').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('inputApiKey').value = '';
    toast('已安全退出后台');
  };

  const updateMetrics = () => {
    document.getElementById('statTotal').textContent = sources.length;
    document.getElementById('statActive').textContent = sources.filter(s => s.is_active === 1).length;
    document.getElementById('statCooldown').textContent = sources.filter(s => s.fail_count >= 3).length;
  };

  const fetchSources = async () => {
    if (!CURRENT_API_KEY) return;
    try {
      const res = await fetch(API_BASE, { headers: { 'x-api-key': CURRENT_API_KEY } });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        toast('密钥已失效，请重新登录', 'error');
        return;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      sources = await res.json();
      renderSources();
      updateMetrics();
    } catch (e) {
      toast('加载数据失败: ' + e.message, 'error');
    }
  };

  const renderSources = () => {
    const list = document.getElementById('sourceList');
    if (!sources.length) {
      list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">暂无活跃数据源，请在上方添加</div>';
      return;
    }
    const sorted = [...sources].sort((a,b) => a.priority - b.priority);
    list.innerHTML = sorted.map(s => {
      const status = s.is_active === 1 ? 'active' : 'inactive';
      const health = s.fail_count >= 3 ? 'cooldown' : 'healthy';
      return \`
        <div class="source-card">
          <div class="info">
            <div class="info-main">
              <strong>\${s.name}</strong>
              <span class="badge \${health}">\${health === 'healthy' ? '⚡ HEALTHY' : '❄️ COOLDOWN'}</span>
              <span class="badge \${status}">\${status === 'active' ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div class="info-sub">
              ID: \${s.id} &nbsp;|&nbsp; 权重: \${s.priority} &nbsp;|&nbsp; 异常计数: \${s.fail_count}
              <br/><span style="color: rgba(255,255,255,0.4);">\${s.base_url}</span>
            </div>
          </div>
          <div class="card-actions" style="display: flex; gap: 0.5rem;">
            <button class="btn-icon" onclick="editSource(\${s.id})" title="编辑">✏️</button>
            <button class="btn-icon danger" onclick="deleteSource(\${s.id})" title="删除">🗑️</button>
          </div>
        </div>
      \`;
    }).join('');
  };

  const addSource = async () => {
    const name = document.getElementById('newName').value.trim();
    const base_url = document.getElementById('newUrl').value.trim();
    const priority = parseInt(document.getElementById('newPriority').value) || 10;
    if (!name || !base_url) { toast('请填写真实有效的名称与地址', 'error'); return; }
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CURRENT_API_KEY },
        body: JSON.stringify({ name, base_url, priority })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('✅ 数据源 ' + name + ' 已成功部署挂载');
      document.getElementById('newName').value = '';
      document.getElementById('newUrl').value = '';
      fetchSources();
    } catch (e) {
      toast('挂载失败: ' + e.message, 'error');
    }
  };

  const deleteSource = async (id) => {
    if (!confirm('确定要彻底卸载 ID=' + id + ' 的数据源节点吗？')) return;
    try {
      const res = await fetch(API_BASE + '/' + id, {
        method: 'DELETE',
        headers: { 'x-api-key': CURRENT_API_KEY }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('🗑️ 节点卸载成功');
      fetchSources();
    } catch (e) {
      toast('删除失败: ' + e.message, 'error');
    }
  };

  const editSource = (id) => {
    const s = sources.find(x => x.id === id);
    if (!s) return;
    editingId = id;
    document.getElementById('editName').value = s.name;
    document.getElementById('editUrl').value = s.base_url;
    document.getElementById('editPriority').value = s.priority;
    document.getElementById('editActive').checked = s.is_active === 1;
    document.getElementById('editModal').classList.add('active');
  };

  const saveEdit = async () => {
    const id = editingId;
    const name = document.getElementById('editName').value.trim();
    const base_url = document.getElementById('editUrl').value.trim();
    const priority = parseInt(document.getElementById('editPriority').value) || 10;
    const is_active = document.getElementById('editActive').checked ? 1 : 0;
    if (!name || !base_url) { toast('请填写完整信息', 'error'); return; }
    try {
      const res = await fetch(API_BASE + '/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CURRENT_API_KEY },
        body: JSON.stringify({ name, base_url, priority, is_active })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('💾 节点配置更新成功');
      document.getElementById('editModal').classList.remove('active');
      fetchSources();
    } catch (e) {
      toast('更新失败: ' + e.message, 'error');
    }
  };

  document.getElementById('addBtn').addEventListener('click', addSource);
  document.getElementById('refreshBtn').addEventListener('click', fetchSources);
  document.getElementById('editCancel').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
  });
  document.getElementById('editSave').addEventListener('click', saveEdit);
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('editModal').classList.remove('active');
  });

  // 页面加载自动尝试恢复登录状态
  if (CURRENT_API_KEY) {
    document.getElementById('loginWrapper').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    fetchSources();
  }
</script>
</body>
</html>`;
}