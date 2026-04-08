/**
 * generate-pinyin-audio.ts
 * 
 * 使用 macOS Tingting 语音批量生成所有拼音音节的真人大师发音音频。
 * 生成的音频保存在 public/audio/ 目录。
 * 
 * 运行方式：
 *   npx tsx scripts/generate-pinyin-audio.ts
 * 
 * 或者直接用 node（先编译）：
 *   npx tsc scripts/generate-pinyin-audio.ts --esModuleInterop --module commonjs
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const AUDIO_DIR = join(PROJECT_ROOT, 'public', 'audio');

// ─── 提取 pinyinData.ts 中的所有音节 ────────────────────────
const pinyinDataPath = join(PROJECT_ROOT, 'src', 'data', 'pinyinData.ts');
const content = readFileSync(pinyinDataPath, 'utf-8');

// 提取整体认读音节
const integratedSection = content.match(/INTEGRATED_MARKED\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s)?.[1] ?? '';
const integratedMatches = [...integratedSection.matchAll(/['"](\w+)['"]\s*,\s*\['([^']+)',\s*['"](.)['"]\s*\]/g)];

// 提取组合音节
const compoundSection = content.match(/COMPOUND_ENTRIES\s*=\s*\[[\s\S]*?\]/)?.[0] ?? '';
const compoundMatches = [...compoundSection.matchAll(/\['(\w+)',\s*['"]([^"']+)["']',\s*['"](.)['"](?:,\s*['"](.)['"])?/g)];

interface SyllableEntry {
  marked: string;      // 带调拼音，如 "bā"
  character: string;   // 对应汉字，如 "八"
  pinyin: string;      // 无调拼音，如 "ba"
}

const syllables: SyllableEntry[] = [];

// 处理整体认读
for (const m of integratedMatches) {
  const key = m[1];
  const marked = m[2];
  const char = m[3];
  // 去掉末尾的数字表示声调
  const pinyin = key.replace(/[1-5]$/, '');
  syllables.push({ marked, character: char, pinyin });
}

// 处理组合音节
for (const m of compoundMatches) {
  const pinyin = m[1];
  const marked = m[2];
  const char1 = m[3];
  const char2 = m[4];
  // 避免重复（同音字取第一个）
  if (!syllables.find(s => s.marked === marked && s.character === char1)) {
    syllables.push({ marked, character: char1, pinyin });
  }
  if (char2 && !syllables.find(s => s.marked === marked && s.character === char2)) {
    syllables.push({ marked, character: char2, pinyin });
  }
}

// 去重
const unique = Array.from(new Map(syllables.map(s => [`${s.marked}_${s.character}`, s])).values());

console.log(`共找到 ${unique.length} 个音节（含同音字）`);
console.log(`音频将保存到: ${AUDIO_DIR}`);

// ─── 验证 say 命令可用 ──────────────────────────────────────
try {
  const voices = execSync(`say -v '?'`, { encoding: 'utf-8' });
  const hasTingting = voices.includes('Tingting');
  if (!hasTingting) {
    console.error('❌ 未找到 Tingting 语音。请确保 macOS 已安装中文语音。');
    process.exit(1);
  }
  console.log('✅ 找到 Tingting 语音');
} catch (e) {
  console.error('❌ say 命令不可用');
  process.exit(1);
}

// ─── 生成音频文件 ────────────────────────────────────────────
if (!existsSync(AUDIO_DIR)) {
  mkdirSync(AUDIO_DIR, { recursive: true });
}

let generated = 0;
let skipped = 0;
let failed = 0;

for (const { marked, character, pinyin } of unique) {
  const filename = `${marked}_${character}.m4a`;
  const filepath = join(AUDIO_DIR, filename);

  if (existsSync(filepath)) {
    skipped++;
    continue;
  }

  try {
    // 使用 Tingting 朗读该汉字
    // -v Tingting 指定语音
    // -o 指定输出文件
    // -- 之后是朗读内容（汉字）
    execSync(`say -v Tingting -o "${filepath}" -- "${character}"`, {
      timeout: 5000,
      stdio: 'pipe',
    });
    generated++;
    if (generated % 50 === 0) {
      console.log(`已生成 ${generated} 个音频...`);
    }
  } catch (e: unknown) {
    failed++;
    const err = e instanceof Error ? e.message : String(e);
    console.error(`  ❌ ${filename}: ${err}`);
  }
}

console.log('\n─── 完成 ───');
console.log(`✅ 新生成: ${generated}`);
console.log(`⏭️  已存在跳过: ${skipped}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📁 目录: ${AUDIO_DIR}`);
