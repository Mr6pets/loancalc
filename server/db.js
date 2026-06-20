// db.js — MySQL / SQLite 双模式，自动切换
//   .env 配置了 DB_HOST → MySQL
//   未配置 → SQLite（零配置，数据存 server/data.db）
const path = require('path');
require('dotenv').config();

const useMySQL = !!(process.env.DB_HOST);

// ============================================================
// 统一接口
// ============================================================
let db = {
  async query(sql, params = []) {
    const stmt = db._prepare(sql);
    return sql.trim().toUpperCase().startsWith('SELECT')
      ? stmt.all(...params)
      : stmt.run(...params);
  },
  async execute(sql, params = []) {
    return [await db.query(sql, params)];
  },
};

// ============================================================
// MySQL 模式
// ============================================================
if (useMySQL) {
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_calc',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });

  db.query = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  };

  db.execute = async (sql, params = []) => {
    return await pool.execute(sql, params);
  };

  db.initTable = async () => {
    const conn = await pool.getConnection();
    try {
      await conn.execute(SCHEMA_MYSQL);
      console.log('[DB:MySQL] 表初始化完成');
    } catch (err) {
      console.error('[DB:MySQL] 建表失败:', err.message);
    } finally {
      conn.release();
    }
  };
}

// ============================================================
// SQLite 模式
// ============================================================
else {
  const Database = require('better-sqlite3');

  const dbFile = path.join(__dirname, 'data', 'data.db');
  const sqlite = new Database(dbFile);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // 准备语句缓存
  const stmts = new Map();
  sqlite._getStmt = (sql) => {
    let s = stmts.get(sql);
    if (!s) { s = sqlite.prepare(sql); stmts.set(sql, s); }
    return s;
  };

  db.query = async (sql, params = []) => {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
      return sqlite._getStmt(sql).all(...params);
    } else {
      return sqlite._getStmt(sql).run(...params);
    }
  };

  // mysql2 风格: execute() 返回 [rows, fields]
  db.execute = async (sql, params = []) => {
    return [await db.query(sql, params)];
  };

  db.initTable = () => {
    sqlite.exec(SCHEMA_SQLITE);
    console.log('[DB:SQLite] 数据库就绪 →', dbFile);
  };
}

// ============================================================
// 建表 SQL
// ============================================================
const SCHEMA_MYSQL = `
  CREATE TABLE IF NOT EXISTS calc_records (
    id VARCHAR(32) PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    principal DECIMAL(12, 2) NOT NULL,
    months INT NOT NULL,
    repay_type VARCHAR(20) NOT NULL,
    calc_mode VARCHAR(10) NOT NULL,
    annual_apr DECIMAL(8, 4) NOT NULL,
    total_payment DECIMAL(12, 2) NOT NULL,
    total_interest DECIMAL(12, 2) NOT NULL,
    total_fee DECIMAL(12, 2) NOT NULL,
    is_overcharged TINYINT NULL,
    overcharge_amount DECIMAL(12, 2) DEFAULT 0,
    input_json JSON NOT NULL,
    result_json JSON NOT NULL,
    device_name VARCHAR(60) DEFAULT '' COMMENT '设备名称',
    INDEX idx_created_at (created_at),
    INDEX idx_apr (annual_apr)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

const SCHEMA_SQLITE = `
  CREATE TABLE IF NOT EXISTS calc_records (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    principal REAL NOT NULL,
    months INTEGER NOT NULL,
    repay_type TEXT NOT NULL,
    calc_mode TEXT NOT NULL,
    annual_apr REAL NOT NULL,
    total_payment REAL NOT NULL,
    total_interest REAL NOT NULL,
    total_fee REAL NOT NULL,
    is_overcharged INTEGER,
    overcharge_amount REAL DEFAULT 0,
    input_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    device_name TEXT DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_created_at ON calc_records(created_at);
  CREATE INDEX IF NOT EXISTS idx_apr ON calc_records(annual_apr);
`;

module.exports = db;
