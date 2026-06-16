// 生成 PWA 图标 PNG（纯 JS，无外部依赖）
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..', 'dist');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景色
  ctx.fillStyle = '#312e81';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // 内圈渐变
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // % 文字
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.28}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('%', size / 2, size / 2);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), buf);
  console.log(`  ✓ icon-${size}.png`);
}

if (!fs.existsSync(outputDir)) {
  console.log('请先执行 npm run build:h5');
  process.exit(1);
}

console.log('生成 PWA 图标...');
sizes.forEach(generateIcon);
console.log('完成');
