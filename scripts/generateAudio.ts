/**
 * audioGenerator.ts
 * 
 * 使用 macOS say 命令生成 Tingting 音色音频文件
 * 输出到 public/audio/*.m4a
 * 
 * 运行: npx tsx scripts/generateAudio.ts
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PINYIN_DATA } from '../src/data/pinyinData';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio');

// 确保目录存在
mkdirSync(AUDIO_DIR, { recursive: true });

// 收集所有需要生成的音节
const syllables = new Map<string, string>(); // marked -> filename
for (const s of PINYIN_DATA) {
  const filename = `${s.id}.m4a`;
  syllables.set(s.marked, filename);
}

const existing = new Set(readdirSync(AUDIO_DIR).filter(f => f.endsWith('.m4a')));
const toGenerate = [...syllables.entries()].filter(([_, f]) => !existing.has(f));

console.log(`已有: ${existing.size} 个音频文件`);
console.log(`需生成: ${toGenerate.length} 个`);
console.log('');

if (toGenerate.length === 0) {
  console.log('全部音频已生成！');
  process.exit(0);
}

// 分批生成（macOS say 可以并行）
const BATCH = 4;
let done = 0;
let errors = 0;

async function generateOne(marked: string, filename: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const filepath = join(AUDIO_DIR, filename);
      // Tingting 声音：zh_CN，高质量
      execSync(
        `say -v Tingting -o "${filepath}" -- Channels=1 -- SampleRate=22050 "${marked}" 2>/dev/null`,
        { timeout: 10000 }
      );
    } catch (e) {
      errors++;
      console.error(`\n生成失败: ${marked} -> ${filename}`);
    }
    done++;
    if (done % 10 === 0 || done === toGenerate.length) {
      process.stdout.write(`\r进度: ${done}/${toGenerate.length} (${errors} 错误)`);
    }
    resolve();
  });
}

async function runBatch(items: [string, string][]): Promise<void> {
  await Promise.all(items.map(([m, f]) => generateOne(m, f)));
}

(async () => {
  console.log('开始生成音频文件（Tingting 音色）...');
  console.log('');
  
  const start = Date.now();
  
  for (let i = 0; i < toGenerate.length; i += BATCH) {
    const batch = toGenerate.slice(i, i + BATCH);
    await runBatch(batch);
  }
  
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n完成！生成 ${done - errors}/${toGenerate.length} 个文件，耗时 ${elapsed}s");
  console.log(`音频目录: ${AUDIO_DIR}`);
})();
