// 全局动画样式
import './styles/animations.css';

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

// 路由级代码分割
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const GamePage = lazy(() => import('./pages/GamePage').then(m => ({ default: m.GamePage })));
const ResultPage = lazy(() => import('./pages/ResultPage').then(m => ({ default: m.ResultPage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })));

// 加载骨架屏
function PageLoader() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center overscroll-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">加载中...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen min-h-[100dvh] overscroll-none ios-safe-area">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 首页：/ */}
            <Route path="/" element={<HomePageWrapper />} />
            {/* 游戏页：/game/:level */}
            <Route path="/game/:level" element={<GamePageWrapper />} />
            {/* 结果页：/result */}
            <Route path="/result" element={<ResultPageWrapper />} />
            {/* 练习页：/practice */}
            <Route path="/practice" element={<PracticePageWrapper />} />
            {/* 兜底重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

// ─── 页面包装器 ─────────────────────────────────────────────────

import { useGameStore } from './store/gameStore';
import { useParams } from 'react-router-dom';

function HomePageWrapper() {
  const { startGame } = useGameStore();
  const navigate = useNavigate();

  const handleStart = () => {
    startGame();
    navigate('/game/1');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-orange-500 via-amber-600 to-orange-700 overscroll-none">
      <HomePage onStartGame={handleStart} />
    </div>
  );
}

function GamePageWrapper() {
  const { level } = useParams<{ level: string }>();
  const { setLevel, goHome } = useGameStore();
  const navigate = useNavigate();

  // 根据 URL 参数同步 store 关卡（仅挂载时执行一次，避免无限循环）
  useEffect(() => {
    if (level) {
      const lvl = parseInt(level, 10) as 1 | 2 | 3 | 4;
      if (!isNaN(lvl)) {
        setLevel(lvl);
      }
    }
  }, [level, setLevel]);

  const handleFinish = () => {
    goHome();
    navigate('/');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-indigo-900 via-purple-900 to-purple-950 overscroll-none">
      <GamePage onFinish={handleFinish} />
    </div>
  );
}

function ResultPageWrapper() {
  const { replayLevel, goToNextLevel, resetGame, goHome } = useGameStore();
  const navigate = useNavigate();

  const handleReplay = () => {
    replayLevel();
    navigate('/');
  };

  const handleGoHome = () => {
    resetGame();
    goHome();
    navigate('/');
  };

  const handleNextLevel = () => {
    goToNextLevel();
    navigate('/');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-indigo-900 via-purple-900 to-purple-950 overscroll-none">
      <ResultPage
        onReplay={handleReplay}
        onGoHome={handleGoHome}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
}

function PracticePageWrapper() {
  const navigate = useNavigate();
  const handleBack = () => navigate('/');

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-indigo-900 via-purple-900 to-purple-950 overscroll-none">
      <PracticePage onBack={handleBack} />
    </div>
  );
}

export default App;
