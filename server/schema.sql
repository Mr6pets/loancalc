-- 手动建表 SQL（也可由服务自动创建）
-- 在阿里云 MySQL 中先执行：
-- CREATE DATABASE IF NOT EXISTS loan_calc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calc_records (
  id VARCHAR(32) PRIMARY KEY COMMENT '记录ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  principal DECIMAL(12, 2) NOT NULL COMMENT '贷款本金',
  months INT NOT NULL COMMENT '总期数',
  repay_type VARCHAR(20) NOT NULL COMMENT '还款方式',
  calc_mode VARCHAR(10) NOT NULL COMMENT '计算模式 reverse/forward/flow',
  annual_apr DECIMAL(8, 4) NOT NULL COMMENT '实际年化利率',
  total_payment DECIMAL(12, 2) NOT NULL COMMENT '总还款额',
  total_interest DECIMAL(12, 2) NOT NULL COMMENT '总利息',
  total_fee DECIMAL(12, 2) NOT NULL COMMENT '总费用',
  is_overcharged TINYINT NULL COMMENT '是否多收费 0/1/null',
  overcharge_amount DECIMAL(12, 2) DEFAULT 0 COMMENT '多收金额',
  input_json JSON NOT NULL COMMENT '完整输入参数',
  result_json JSON NOT NULL COMMENT '完整计算结果',
  INDEX idx_created_at (created_at),
  INDEX idx_apr (annual_apr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='贷款计算历史记录';
