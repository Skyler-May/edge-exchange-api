// src/admin/panel.ts
export function getAdminPanel(apiKey: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔧 Admin 管理面板</title>
  <style>
    /* === 样式完全保留您已有的，此处省略以节省篇幅，实际替换时请原样保留 === */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0b0e14; color: #e8edf3; padding: 2rem 1.5rem; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; color: #f6b26b; }
    .subtitle { color: #8892a0; margin-bottom: 2rem; border-bottom: 1px solid #1e2630; padding-bottom: 1rem; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .actions input, .actions select, .actions button { padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid #232c38; background: #141b24; color: #e8edf3; font-size: 0.95rem; }
    .actions button { background: #f6b26b; color: #0b0e14; font-weight: 600; cursor: pointer; border: none; }
    .actions button:hover { background: #f9d976; }
    .card { background: #141b24; border-radius: 16px; padding: 1.5rem; border: 1px solid #232c38; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .card .info { flex: 1; }
    .card .info strong { color: #f6b26b; }
    .card .info .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem; }
    .badge.healthy { background: #1e3a2a; color: #7ddf9a; }
    .badge.cooldown { background: #3a2a1e; color: #f5a97f; }
    .badge.inactive { background: #3a1e1e; color: #f28b82; }
    .card .actions-btn button { background: none; border: 1px solid #3e4c5e; color: #b0bec5; padding: 0.3rem 0.8rem; border-radius: 6px; cursor: pointer; margin-left: 0.5rem; }
    .card .actions-btn button:hover { background: #1e2630; }
    .card .actions-btn .delete { border-color: #8b3a3a; color: #f28b82; }
    .card .actions-btn .delete:hover { background: #3a1e1e; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); justify-content: center; align-items: center; }
    .modal.active { display: flex; }
    .modal-content { background: #141b24; padding: 2rem; border-radius: 16px; max-width: 500px; width: 90%; border: 1px solid #232c38; }
    .modal-content h2 { margin-bottom: 1rem; color: #f6b26b; }
    .modal-content input { width: 100%; padding: 0.6rem 1rem; margin-bottom: 0.8rem; border-radius: 8px; border: 1px solid #232c38; background: #0d1219; color: #e8edf3; }
    .modal-content .btn-row { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 0.5rem; }
    .modal-content .btn-row button { padding: 0.6rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; }
    .modal-content .btn-row .save { background: #f6b26b; color: #0b0e14; }
    .modal-content .btn-row .cancel { background: #232c38; color: #b0bec5; }
    .toast { position: fixed; bottom: 2rem; right: 2rem; background: #141b24; padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid #3e4c5e; color: #e8edf3; display: none; }
    .toast.show { display: block; }
    .toast.success { border-color: #7ddf9a; }
    .toast.error { border-color: #f28b82; }
    @media (max-width: 600px) { body { padding: 1rem; } .card { flex-direction: column; align-items: flex-start; } }
  </style>
</head>
<body>
<div class="container">
  <h1>🔧 数据源管理</h1>
  <div class="subtitle">管理所有交易所数据源，实时生效</div>
  <div class="actions">
    <input type="text" id="newName" placeholder="名称 (如 Kraken)" />
    <input type="text" id="newUrl" placeholder="API 地址" />
    <input type="number" id="newPriority" placeholder="优先级" value="10" />
    <button id="addBtn">➕ 添加数据源</button>
    <button id="refreshBtn">🔄 刷新</button>
  </div>
  <div id="sourceList"></div>
</div>
<!-- 编辑弹窗 -->
<div class="modal" id="editModal">
  <div class="modal-content">
    <h2>✏️ 编辑数据源</h2>
    <input type="text" id="editName" placeholder="名称" />
    <input type="text" id="editUrl" placeholder="API 地址" />
    <input type="number" id="editPriority" placeholder="优先级" />
    <div style="margin-bottom:0.8rem;">
      <label style="color:#8892a0; display:flex; align-items:center; gap:0.5rem;">
        <input type="checkbox" id="editActive" checked /> 启用
      </label>
    </div>
    <div class="btn-row">
      <button class="cancel" id="editCancel">取消</button>
      <button class="save" id="editSave">💾 保存</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
  const API_BASE = '/api/admin/sources';
  const API_KEY = '${apiKey}';  // 由服务端注入，不再硬编码

  let sources = [];
  let editingId = null;

  const toast = (msg, type = 'success') => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show ' + type;
    setTimeout(() => el.classList.remove('show'), 3000);
  };

  const fetchSources = async () => {
    try {
      const res = await fetch(API_BASE, { headers: { 'x-api-key': API_KEY } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      sources = await res.json();
      renderSources();
    } catch (e) {
      toast('加载失败: ' + e.message, 'error');
    }
  };

  const renderSources = () => {
    const list = document.getElementById('sourceList');
    if (!sources.length) {
      list.innerHTML = '<p style="color:#8892a0;">暂无数据源，请添加</p>';
      return;
    }
    const sorted = [...sources].sort((a,b) => a.priority - b.priority);
    list.innerHTML = sorted.map(s => {
      const status = s.is_active === 1 ? 'active' : 'inactive';
      const health = s.fail_count >= 3 ? 'cooldown' : 'healthy';
      return \`
        <div class="card">
          <div class="info">
            <strong>\${s.name}</strong>
            <span class="badge \${health}">\${health === 'healthy' ? '✅ 健康' : '❄️ 冷却'}</span>
            <span class="badge \${status}">\${status === 'active' ? '🟢 启用' : '⛔ 禁用'}</span>
            <div style="font-size:0.85rem;color:#8892a0;margin-top:0.3rem;">
              ID: \${s.id} · 优先级: \${s.priority} · 失败: \${s.fail_count}次
              <br/><span style="word-break:break-all;">\${s.base_url}</span>
            </div>
          </div>
          <div class="actions-btn">
            <button onclick="editSource(\${s.id})">✏️</button>
            <button class="delete" onclick="deleteSource(\${s.id})">🗑️</button>
          </div>
        </div>
      \`;
    }).join('');
  };

  const addSource = async () => {
    const name = document.getElementById('newName').value.trim();
    const base_url = document.getElementById('newUrl').value.trim();
    const priority = parseInt(document.getElementById('newPriority').value) || 10;
    if (!name || !base_url) { toast('请填写名称和地址', 'error'); return; }
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ name, base_url, priority })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('✅ ' + name + ' 添加成功');
      document.getElementById('newName').value = '';
      document.getElementById('newUrl').value = '';
      fetchSources();
    } catch (e) {
      toast('添加失败: ' + e.message, 'error');
    }
  };

  const deleteSource = async (id) => {
    if (!confirm('确定要删除 ID=' + id + ' 的数据源吗？')) return;
    try {
      const res = await fetch(API_BASE + '/' + id, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('🗑️ 删除成功');
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ name, base_url, priority, is_active })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('💾 更新成功');
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

  fetchSources();
</script>
</body>
</html>`;
}