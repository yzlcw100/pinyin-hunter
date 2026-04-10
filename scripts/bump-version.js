#!/usr/bin/env node
// 运行 npm version patch 时自动递增版本号，并写入 src/version.ts

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// 读取当前 package.json 版本
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version;

// 写入 src/version.ts（供前端 import）
const versionFile = `// 此文件由 scripts/bump-version.js 自动生成，每次 build 时更新
export const APP_VERSION = '${version}';
`;

writeFileSync(resolve(rootDir, 'src/version.ts'), versionFile, 'utf-8');

console.log(`✅ Version bumped to: ${version}`);
