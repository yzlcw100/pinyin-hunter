# 拼音学习游戏 — Vercel 部署指南

## 前提条件

- Vercel 账号（免费）: https://vercel.com/signup
- GitHub 仓库（可选，推荐）

---

## 方式一：GitHub Integration（推荐）

### 1. 推送代码到 GitHub

```bash
cd ~/projects/pinyin-game
git init
git add .
git commit -m "feat: 拼音学习游戏 v1.0"
git remote add origin https://github.com/YOUR_USERNAME/pinyin-game.git
git push -u origin main
```

### 2. 在 Vercel 导入

1. 访问 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择刚才创建的 GitHub 仓库
4. Vercel 自动检测为 Vite + React 项目
5. Framework Preset: **Vite**（自动）
6. Root Directory: `.`（默认）
7. Build Command: `npm run build`（自动）
8. Output Directory: `dist`（自动）
9. Environment Variables: 无需添加
10. 点击 **Deploy**

Vercel 会自动分配一个 `.vercel.app` 域名。

---

## 方式二：Vercel CLI

```bash
# 安装
npm i -g vercel

# 登录（浏览器中完成认证）
vercel login

# 预览部署
cd ~/projects/pinyin-game
vercel

# 回答问题：
# - Set up and deploy? → Y
# - Which scope? → 选择你的账号
# - Link to existing project? → N
# - Project name? → pinyin-game
# - Directory? → ./
# - Override settings? → N

# 部署生产环境
vercel --prod

# 部署成功后返回 URL，例如：
# https://pinyin-game.vercel.app
```

---

## 方式三：Netlify（无需账号）

```bash
# 安装 netlify-cli
npm i -g netlify-cli

# 登录
netlify login

# 构建 + 部署
cd ~/projects/pinyin-game
npm run build
netlify deploy --dir=dist --prod

# 或一键部署（无需 build）
netlify deploy --dir=dist --prod --message "拼音游戏 v1.0"
```

---

## 方式四：Cloudflare Pages

1. 访问 https://pages.cloudflare.com/
2. 创建项目，连接 GitHub 仓库
3. Build command: `npm run build`
4. Build output directory: `dist`
5. 点击 Deploy

---

## 常见问题

### Q: 部署后 TTS 发音不工作？

iOS Safari 和部分浏览器要求用户**首次主动点击**才能初始化 AudioContext。游戏设计已覆盖此场景：用户点击"开始挑战"按钮即触发音频上下文初始化。

### Q: 域名需要配置 HTTPS？

Vercel/Netlify/Cloudflare 均自动提供 HTTPS，无需手动配置。

### Q: 如何绑定自定义域名？

- **Vercel**: 项目 Settings → Domains → 添加域名，按提示配置 DNS
- **Netlify**: Site Settings → Domain Management → Add custom domain
- **Cloudflare**: Pages → Custom Domains → 添加域名

### Q: 部署后游戏数据在哪里？

玩家数据存储在浏览器 localStorage 中，服务器不存储任何用户数据。清除浏览器数据会重置进度。

---

## 自动化 CI/CD（可选）

使用 GitHub Actions，每次 push 自动部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

在 Vercel Dashboard → Settings → Tokens 生成 token。
