const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 字段名映射（MySQL → 统一 camelCase，SQLite 已用 camelCase）
function mapRow(r) {
  const ijson = typeof r.input_json === 'string' ? JSON.parse(r.input_json) : r.input_json;
  const rjson = typeof r.result_json === 'string' ? JSON.parse(r.result_json) : r.result_json;
  const isOvercharged = r.is_overcharged == null ? null : r.is_overcharged === 1 || r.is_overcharged === true;
  return {
    id: r.id,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    principal: Number(r.principal),
    months: r.months,
    repayType: r.repay_type,
    calcMode: r.calc_mode,
    annualAPR: Number(r.annual_apr),
    totalPayment: Number(r.total_payment),
    totalInterest: Number(r.total_interest),
    totalFee: Number(r.total_fee),
    isOvercharged,
    overchargeAmount: Number(r.overcharge_amount || 0),
    input: ijson,
    result: rjson,
  };
}

// ─── /admin ─── 后台管理页面
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ─── GET /api/stats ─── 统计概览
app.get('/api/stats', async (_req, res) => {
  try {
    const [totalR] = await db.execute('SELECT COUNT(*) as total FROM calc_records');
    const [avgR] = await db.execute('SELECT AVG(annual_apr) as avgApr FROM calc_records');
    const [maxR] = await db.execute('SELECT MAX(annual_apr) as maxApr FROM calc_records');
    const [overR] = await db.execute('SELECT COUNT(*) as overCount FROM calc_records WHERE is_overcharged = 1');
    const [sumR] = await db.execute('SELECT SUM(total_interest) as sumTotal FROM calc_records');
    const total = Number(totalR.total || 0);
    const avgApr = Number(avgR.avgApr || 0);
    const maxApr = Number(maxR.maxApr || 0);
    const overCount = Number(overR.overCount || 0);
    const sumInterest = Number(sumR.sumTotal || 0);
    res.json({ success: true, data: { total, avgApr, maxApr, overCount, sumInterest } });
  } catch (err) {
    console.error('[GET /api/stats]', err.message);
    res.status(500).json({ success: false });
  }
});

// ─── GET /api/records ─── 获取所有记录
app.get('/api/records', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const rows = await db.query(
      'SELECT * FROM calc_records ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    const records = rows.map(mapRow);
    res.json({ success: true, data: records });
  } catch (err) {
    console.error('[GET /api/records]', err.message);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// ─── POST /api/records ─── 创建记录
app.post('/api/records', async (req, res) => {
  try {
    const { id, createdAt, input, result } = req.body;
    if (!input || !result) {
      return res.status(400).json({ success: false, error: '缺少 input/result' });
    }
    await db.execute(
      `INSERT INTO calc_records
        (id, created_at, principal, months, repay_type, calc_mode,
         annual_apr, total_payment, total_interest, total_fee,
         is_overcharged, overcharge_amount, input_json, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        createdAt || new Date().toISOString(),
        input.principal,
        input.months || 0,
        input.repayType || 'equal-installment',
        input.mode || 'reverse',
        result.annualAPR,
        result.totalPayment,
        result.totalInterest,
        result.totalFee,
        result.isOvercharged === null ? null : result.isOvercharged ? 1 : 0,
        result.overchargeAmount || 0,
        JSON.stringify(input),
        JSON.stringify(result),
      ]
    );
    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('[POST /api/records]', err.message);
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

// ─── DELETE /api/records/:id ─── 删除单条
app.delete('/api/records/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM calc_records WHERE id = ?', [req.params.id]);
    res.json({ success: true, deleted: result.changes || result.affectedRows || 0 });
  } catch (err) {
    console.error('[DELETE /api/records/:id]', err.message);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

// ─── DELETE /api/records ─── 清空
app.delete('/api/records', async (_req, res) => {
  try {
    await db.query('DELETE FROM calc_records');
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/records]', err.message);
    res.status(500).json({ success: false, error: '清空失败' });
  }
});

// 启动
app.listen(PORT, async () => {
  console.log(`✅ 贷款利率核算 API 运行在 http://0.0.0.0:${PORT}`);
  await db.initTable();
});
