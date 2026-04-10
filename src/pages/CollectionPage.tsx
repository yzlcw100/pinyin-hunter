import { useNavigate } from 'react-router-dom';
import { useStickerCollection } from '../hooks/useStickerCollection';
import { StickerBook } from '../components/StickerBook';

export function CollectionPage() {
  const navigate = useNavigate();
  const { isUnlocked } = useStickerCollection();

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col overscroll-none">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-lg text-white transition-all active:scale-90"
        >
          ←
        </button>
        <h1 className="text-lg font-black text-white">📖 贴纸册</h1>
        <div className="w-10" />
      </div>

      {/* 收集册主体 */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        <StickerBook isUnlocked={isUnlocked} />
      </div>
    </div>
  );
}
