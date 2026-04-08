/**
 * generate-pinyin-audio.js
 * 使用 macOS Tingting 语音批量生成所有拼音音节音频
 *
 * 运行: node scripts/generate-audio.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'audio');

// ─── 解析 pinyinData.ts ─────────────────────────────────────
const fileContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src', 'data', 'pinyinData.ts'),
  'utf-8'
);

// COMPOUND_ENTRIES: ['pinyin', 'marked', 'char1', 'char2?]
// \w 不含 ü，故用 [\wü]+ 匹配 nü/lü/nüe 等
const compoundRegex = /\['([\wü]+)',\s*'([^']+)',\s*'([^']+)'(?:,\s*'([^']+)')?/g;
const compoundEntries = [];
let m;
while ((m = compoundRegex.exec(fileContent)) !== null) {
  const [, pinyin, marked, char1, char2] = m;
  compoundEntries.push({ pinyin, marked, character: char1 });
  if (char2) compoundEntries.push({ pinyin, marked, character: char2 });
}

// INTEGRATED_MARKED: key: ['marked', 'character']
const integratedRegex = /(\w+2?):\s*\['([^']+)',\s*'([^']+)'\]/g;
const integratedEntries = [];
while ((m = integratedRegex.exec(fileContent)) !== null) {
  const [, key, marked, character] = m;
  const pinyin = key.replace(/2$/, '');
  integratedEntries.push({ pinyin, marked, character });
}

// 合并去重（按 marked_character 作为唯一键）
const all = [...integratedEntries, ...compoundEntries];
const seen = new Map();
for (const s of all) {
  const key = `${s.marked}_${s.character}`;
  if (!seen.has(key)) seen.set(key, s);
}
const unique = Array.from(seen.values());

console.log(`共 ${unique.length} 个音节（含同音字）\n`);

// ─── 验证 Tingting 语音 ──────────────────────────────────────
try {
  const voices = execSync(`say -v '?'`).toString();
  if (!voices.includes('Tingting')) {
    console.error('❌ 未找到 Tingting 语音，请到 系统设置 → 语音 → 下载中文语音');
    process.exit(1);
  }
  console.log('✅ Tingting 语音就绪\n');
} catch (e) {
  console.error('❌ say 命令不可用');
  process.exit(1);
}

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// ─── 批量生成音频 ────────────────────────────────────────────
let generated = 0, skipped = 0, failed = 0;
const errors = [];

for (const { marked, character } of unique) {
  const filename = `${marked}_${character}.m4a`;
  const filepath = path.join(AUDIO_DIR, filename);

  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100) {
    skipped++;
    continue;
  }

  try {
    // -v Tingting  指定语音
    // -o filepath  输出到文件
    // --           之后是朗读内容（汉字）
    execSync(`say -v Tingting -o "${filepath}" -- "${character}"`, {
      timeout: 6000,
      stdio: 'pipe',
    });

    const stat = fs.statSync(filepath);
    if (stat.size < 100) throw new Error('文件太短，可能生成失败');

    generated++;
    if (generated % 20 === 0) {
      process.stderr.write(`\n已生成 ${generated} ...\n`);
    } else {
      process.stdout.write('.');
    }
  } catch (e) {
    failed++;
    errors.push(`${filename} (${character}): ${e.message}`);
  }
}

console.log(`\n\n─── 完成 ───`);
console.log(`✅ 新生成: ${generated}`);
console.log(`⏭️  已存在跳过: ${skipped}`);
console.log(`❌ 失败: ${failed}`);
if (errors.length) {
  console.log('\n失败详情:');
  errors.slice(0, 20).forEach(e => console.log(' ', e));
}
console.log(`\n📁 音频目录: ${AUDIO_DIR}`);
console.log(`   共 ${fs.existsSync(AUDIO_DIR) ? fs.readdirSync(AUDIO_DIR).length : 0} 个音频文件`);
