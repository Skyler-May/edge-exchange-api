# 加密货币汇率聚合 API —— 完整架构与源码

## 一、架构概览（重申与细化）

### **本系统基于 Cloudflare Workers 生态，采用 三层分离 架构：**

| 层级 | 技术组件 | 职责 |
| --- | --- | --- |
| 数据采集层 | Cron Triggers + cron.js | 定时拉取主流交易所汇率，容灾降级，数据清洗校验，写入存储 |
| 数据存储层 | Workers KV + D1 | KV 存储最新价格（高并发读取），D1 存储历史数据与配置 |
| 对外服务层 | HTTP Worker (index.js) | 提供 REST API，限流，健康检查，管理后台接口 |

### **特色设计：**

### 数据源动态注册（存储在 D1，通过 Admin API 增删改，无需重新部署）

- 多级容灾（优先级轮询 + 熔断冷却）
- 无限扩展备用源（通过数据库记录）
- 历史数据自动聚合（按小时/天）以优化查询性能

## 二、数据库设计（D1）

```sql
-- 1. 数据源配置表（动态注册）
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  base_url TEXT NOT NULL,
  priority INTEGER DEFAULT 100,           -- 数字越小优先级越高
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,
  timeout_ms INTEGER DEFAULT 3000,
  fail_count INTEGER DEFAULT 0,
  last_fail_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. 汇率历史表（原始分钟级）
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL,
  target TEXT NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  source TEXT NOT NULL,
  timestamp INTEGER NOT NULL,            -- Unix 秒
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_rates_pair_time ON exchange_rates(base, target, timestamp DESC);

-- 3. 小时聚合表（用于快速历史查询）
CREATE TABLE IF NOT EXISTS hourly_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL,
  target TEXT NOT NULL,
  hour_bucket INTEGER NOT NULL,          -- Unix 秒，对齐到整点
  open DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  close DECIMAL(20,8),
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base, target, hour_bucket)
);
CREATE INDEX idx_hourly_pair_time ON hourly_rates(base, target, hour_bucket DESC);

-- 4. 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT,                            -- 'info', 'error'
  message TEXT,
  source TEXT,                           -- 数据源名称
  details TEXT,                          -- JSON
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

## 三、项目结构

```text
fx-rate-backend/
├── wrangler.toml
├── package.json
├── migrations/
│   └── 001_init.sql                    (上述 SQL)
└── src/
    ├── index.js                        # 主入口，路由分发
    ├── cron.js                         # 定时任务入口
    ├── services/
    │   ├── fetcher.js                  # 动态数据源拉取与容灾
    │   ├── validator.js                # 数据清洗与校验
    │   ├── sourceRegistry.js           # 数据源 D1 操作
    │   └── aggregator.js               # 历史数据聚合（小时/天）
    ├── utils/
    │   ├── db.js                       # D1 数据库客户端封装
    │   ├── cache.js                    # KV 缓存封装
    │   ├── circuitBreaker.js           # 熔断器工具
    │   └── response.js                 # 统一响应格式
    └── admin/
        └── index.js                    # Admin API 路由
```

## 四、环境变量（wrangler.toml 与 Secrets）

```toml
# wrangler.toml
name = "fx-rate-backend"
main = "src/index.js"
compatibility_date = "2024-12-18"

[[kv_namespaces]]
binding = "FX_CACHE"
id = "your-kv-id"

[[d1_databases]]
binding = "FX_DB"
database_name = "fx-db"
database_id = "your-d1-id"

[triggers]
crons = ["*/1 * * * *"]   # 每分钟触发一次

[vars]
API_KEY = "your-admin-api-key"   # 管理后台 API Key
RATE_LIMIT = "100"               # 每 IP 每分钟最大请求数
```

### **设置 secret（用于敏感信息，如代理等）：**

```bash
npx wrangler secret put PROXY_URL
npx wrangler secret put PROXY_AUTH
```

## 五、源代码（阅项目目录结构）


## 六、部署说明

1. 创建 D1 数据库并执行迁移

```bash
npx wrangler d1 create fx-db
npx wrangler d1 execute fx-db --file=migrations/001_init.sql
```

2. 创建 KV Namespace

```bash
npx wrangler kv:namespace create "FX_CACHE"
```

3. 配置 wrangler.toml 填入 ID。

4. 设置 Secret（如管理 API Key）

```bash
npx wrangler secret put API_KEY
```

5. 部署 Worker

```bash
npx wrangler deploy
```

6. 初始化数据源（可选） 通过 Admin POST 添加，或手动插入 SQL：

```sql
INSERT INTO data_sources (name, base_url, priority, is_main) VALUES 
('Binance','https://api.binance.com/api/v3/ticker/price',1,true),
('OKX','https://www.okx.com/api/v5/market/ticker',2,true),
('Coinbase','https://api.coinbase.com/v2/prices/spot',3,true);
```

## 七、API 文档

| 端点 | 方法 | 描述 |
| --- | --- | --- |
| `/api/v1/rate?from=BTC&to=USDT` | GET | 获取最新汇率（带缓存） |
| `/api/v1/history?from=BTC&to=USDT&days=7&interval=hour` | GET | 获取历史聚合数据 |
| `/api/v1/status` | GET | 系统健康状态 |
| `/api/admin/sources` | GET | 列出所有源（需 Admin Key） |
| `/api/admin/sources` | POST | 新增源（需 Admin Key） |
| `/api/admin/sources/:id` | PUT | 更新源（需 Admin Key） |
| `/api/admin/sources/:id` | DELETE | 删除源（需 Admin Key） |

## 八、扩展建议

- WebSocket 支持：添加 Durable Objects 实现实时推送。
- 反向汇率：在 fetcher.js 中增加 getRatePair 自动处理反向。
- 监控告警：通过 system_logs 表配合 Worker 的 sendEmail 实现报警。
