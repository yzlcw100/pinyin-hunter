# 拼音学习乐园

一款专为幼儿设计的拼音学习游戏，支持 4 个难度关卡、连击系统、TTS 发音和进度保存。

---

## 给女儿的信息

> 这是爸爸专门为你设计的拼音游戏，希望你喜欢 ❤️
>
> 每一关都是一个小小的挑战，答对 6 题就能通过！
> 做错了也没关系，生命值用完之前都有机会重来。
> 连击越多，分数越高——就像你搭积木一样，叠得越高越厉害！
>
> 玩得开心！

---

## 游戏介绍

拼音学习乐园是一款面向 5-8 岁儿童的拼音学习游戏。

**核心玩法**：看拼音选汉字，每关 10 题，答对 ≥6 题通关。

**4 个难度关卡**：
| 关卡 | 名称 | 内容 | 音节数 |
|------|------|------|--------|
| L1 | 声母关 | 单韵母拼读（a/o/e/i/u/ü） | 61 |
| L2 | 韵母关 | 复合韵母（ai/ei/ao/ou 等） | 84 |
| L3 | 整体认读 | 16 个整体认读音节 | 16 |
| L4 | 拼读关 | 鼻韵母（an/en/ang/eng 等） | 116 |

**题库总规模**：277 个拼音音节 / 513 个汉字

**特性**：
- 🔥 连击加分系统（2连+2 / 3连+5 / 5连+10）
- ❤️ 3 条生命，答错扣命
- ⭐ 星级评价（3星=满分 / 2星=≥8题 / 1星=≥6题通关）
- 🔓 关卡解锁（通关前一关解锁下一关）
- 🔊 Web Speech API TTS 发音
- 📱 移动端横屏适配 + 安全区支持
- 💾 本地进度自动保存（localStorage）

---

## 技术栈

- **框架**：React 19 + TypeScript 6
- **构建**：Vite 8
- **样式**：Tailwind CSS 3 + 自定义 CSS 动画关键帧
- **状态**：Zustand 5
- **路由**：React Router DOM 7
- **音频**：Web Audio API（合成音效）+ Web Speech API（TTS）
- **字体**：系统字体栈（无外部字体依赖）

**打包体积**：~297KB（gzip），含 React ~60KB

---

## 路由结构

```
/           → HomePage（关卡选择）
/game       → GamePage（游戏进行中）
/result     → ResultPage（结算页）
/practice   → PracticePage（练习模式，无计时无生命）
```

路由通过 React Router DOM 管理，支持浏览器前进/后退。

---

## 本地运行

```bash
cd ~/projects/pinyin-game

# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 类型检查
npm run build    # 先执行 tsc --noEmit

# 生产构建
npm run build

# 本地预览构建结果
npm run preview
```

**端口**：默认 `http://localhost:5173`

---

## 上线部署

### 方式一：Vercel CLI（推荐）

```bash
cd ~/projects/pinyin-game

# 安装 Vercel CLI（如未安装）
npm i -g vercel

# 登录（如未登录）
vercel login

# 部署预览
vercel

# 部署生产
vercel --prod
```

### 方式二：GitHub Integration

1. 将项目推送至 GitHub 仓库
2. 访问 [vercel.com/new](https://vercel.com/new)
3. Import GitHub 仓库
4. Vercel 自动检测 Vite + React 项目，点击 Deploy

### 方式三：手动部署到静态托管

构建产物在 `dist/` 目录，可直接部署到任意静态服务器：

```bash
npm run build
# 将 dist/ 目录内容上传到 Netlify / Cloudflare Pages / 任意 CDN
```

**部署检查清单**：
- [ ] `npm run build` 无错误
- [ ] `npm run lint` 无警告
- [ ] iOS Safari 和 Android Chrome 均测试通过
- [ ] 横屏模式显示正常
- [ ] TTS 发音正常（需用户首次授权麦克风权限）
- [ ] localStorage 数据保存正常

---

## 目录结构

```
pinyin-game/
├── src/
│   ├── components/      # 可复用 UI 组件
│   │   ├── GameButton.tsx       # 游戏按钮
│   │   ├── ComboEffect.tsx      # 连击特效
│   │   ├── CorrectFeedback.tsx  # 正确反馈
│   │   ├── WrongFeedback.tsx    # 错误反馈
│   │   ├── HeartLost.tsx        # 生命值
│   │   ├── ProgressBar.tsx     # 进度条
│   │   ├── ScorePopup.tsx       # 得分飘字
│   │   └── StarBurst.tsx        # 星星爆发
│   ├── data/
│   │   └── pinyinData.ts        # 题库数据 + 关卡配置
│   ├── pages/
│   │   ├── HomePage.tsx         # 首页（关卡选择）
│   │   ├── GamePage.tsx         # 游戏页
│   │   ├── ResultPage.tsx       # 结果页
│   │   └── PracticePage.tsx     # 练习页
│   ├── store/
│   │   └── gameStore.ts         # Zustand 游戏状态
│   ├── styles/
│   │   └── animations.css       # CSS 动画关键帧
│   ├── utils/
│   │   ├── audioUtils.ts        # Web Audio API + TTS
│   │   ├── pinyinUtils.ts       # 拼音工具
│   │   └── storageUtils.ts      # localStorage 封装
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 开发规范

- **TypeScript**：禁止使用 `any`，所有类型必须显式声明
- **动画**：优先使用 CSS `@keyframes`，避免 JS setTimeout 动画循环
- **移动端**：所有按钮使用 `touch-manipulation`，支持 `active:scale-95` 按压反馈
- **响应式**：以手机为基准，使用 Tailwind `sm:`/`md:`/`lg:` 断点
- **localStorage**：所有操作包裹 try/catch，防止幼儿设备存储满的情况
