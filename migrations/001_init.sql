-- 数据源配置表
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  base_url TEXT NOT NULL,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,
  timeout_ms INTEGER DEFAULT 3000,
  fail_count INTEGER DEFAULT 0,
  last_fail_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  config TEXT
);

-- 汇率历史（分钟级）
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL,
  target TEXT NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  source TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rates_pair_time ON exchange_rates(base, target, timestamp DESC);

-- 小时聚合表
CREATE TABLE IF NOT EXISTS hourly_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL,
  target TEXT NOT NULL,
  hour_bucket INTEGER NOT NULL,
  open DECIMAL(20,8),
  high DECIMAL(20,8),
  low DECIMAL(20,8),
  close DECIMAL(20,8),
  source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base, target, hour_bucket)
);
CREATE INDEX IF NOT EXISTS idx_hourly_pair_time ON hourly_rates(base, target, hour_bucket DESC);

-- 系统日志
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT,
  message TEXT,
  source TEXT,
  details TEXT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 初始化主流交易所（只执行一次）
INSERT OR IGNORE INTO data_sources (name, base_url, priority, is_main) VALUES 
('Binance','https://api.binance.com/api/v3/ticker/price',1,true),
('OKX','https://www.okx.com/api/v5/market/ticker',2,true),
('Coinbase','https://api.coinbase.com/v2/prices/spot',3,true),
('GateIo','https://api.gateio.ws/api/v4/spot/tickers',4,true),
('Frankfurter','https://api.frankfurter.app/latest?from={base}&to={target}',5,true);

-- 为已有数据源补充 config（幂等，重复执行无害）
UPDATE data_sources SET config = '{"price_path":"price"}' WHERE name = 'Binance' AND config IS NULL;
UPDATE data_sources SET config = '{"price_path":"data[0].last"}' WHERE name = 'OKX' AND config IS NULL;
UPDATE data_sources SET config = '{"price_path":"data.amount"}' WHERE name = 'Coinbase' AND config IS NULL;
UPDATE data_sources SET config = '{"list_path":"tickers","item_key":"currency_pair","item_value":"{base}_{target}","price_path_in_item":"last"}' WHERE name = 'GateIo' AND config IS NULL;
UPDATE data_sources SET config = '{"price_path":"rates.{target}"}' WHERE name = 'Frankfurter' AND config IS NULL;