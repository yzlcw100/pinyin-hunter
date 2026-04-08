/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 响应式断点：iPad 横屏优先，手机为基础
      screens: {
        'phone': '375px',
        'phablet': '428px',
        'tablet': '768px',
        'md': '768px',   // alias for tablet
        'ipad': '1024px', // iPad 横屏优先断点
        'lg': '1024px',   // alias
        'desktop': '1280px',
        'xl': '1536px',
      },
      // 触摸优化：消除 300ms 延迟
      touchAction: {
        'manipulation': 'manipulation',
      },
      // 字号优化：游戏页拼音字母 64px-96px
      fontSize: {
        'pinyin-xs': ['2rem', { lineHeight: '1.2' }],   // 32px 手机小屏
        'pinyin-sm': ['3rem', { lineHeight: '1.2' }],    // 48px 手机
        'pinyin-md': ['4rem', { lineHeight: '1.2' }],   // 64px iPad/平板
        'pinyin-lg': ['5rem', { lineHeight: '1.2' }],   // 80px iPad 大屏
        'pinyin-xl': ['6rem', { lineHeight: '1.2' }],   // 96px 桌面/大屏
      },
      // 按钮最小点击区域 ≥ 44px (iOS 无障碍标准)
      minHeight: {
        'btn': '44px',
        'btn-lg': '60px',
      },
      minWidth: {
        'btn': '44px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
