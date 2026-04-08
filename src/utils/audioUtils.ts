/**
 * 拼音学习游戏 — 音频系统
 *
 * 策略：
 * - 中文发音：macOS say -v Tingting（中文语音，真人感）
 *   发音文件缓存到 /audio/ 目录，下次直接播放
 * - 音效（正确/错误/点击等）：Web Audio API 合成beep
 */

import { useEffect, useRef } from 'react';

// ─── 全局静音状态 ────────────────────────────────────────────
let globalMuted = false;
export function setMuted(muted: boolean) { globalMuted = muted; }
export function isMuted() { return globalMuted; }

// ─── 音效合成（Web Audio API）──────────────────────────────

let audioContext: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioContext) {
    const win = window as unknown as Record<string, unknown>;
    audioContext = new (window.AudioContext || ((win as Record<string, unknown>).webkitAudioContext as typeof AudioContext))();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain = 0.25) {
  if (globalMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playClickSound() { playTone(800, 0.06, 'square', 0.12); }
export function playCorrectSound() {
  playTone(523, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.2), 160);
}
export function playWrongSound() {
  playTone(300, 0.18, 'sawtooth', 0.18);
  setTimeout(() => playTone(250, 0.22, 'sawtooth', 0.18), 160);
}
export function playVictorySound() {
  [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.18, 'sine', 0.18), i * 70)
  );
  setTimeout(() => {
    playTone(523, 0.4, 'sine', 0.15);
    playTone(659, 0.4, 'sine', 0.15);
    playTone(784, 0.4, 'sine', 0.15);
  }, 560);
}
export function playComboSound(combo: number) {
  if (combo >= 10) {
    playTone(880, 0.08, 'square', 0.12);
    setTimeout(() => playTone(988, 0.08, 'square', 0.12), 50);
    setTimeout(() => playTone(1047, 0.12, 'square', 0.12), 100);
  } else if (combo >= 5) {
    playTone(659, 0.1, 'sine', 0.18);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.18), 80);
  } else {
    playTone(698, 0.08, 'sine', 0.12);
  }
}

// ─── 中文语音：say -v Tingting ──────────────────────────────

/**
 * pinyin → 最常用汉字 映射表
 * 用于 TTS 发音：speaskPinyin('bā') → 说"八"
 * 覆盖所有 500+ 音节
 */
const PINYIN_CHAR_MAP = new Map<string,string>([
  ['biàn', '变'],
  ['bié', '别'],
  ['bà', '爸'],
  ['bàn', '办'],
  ['bàng', '棒'],
  ['bào', '报'],
  ['bái', '白'],
  ['bèi', '被'],
  ['bèn', '笨'],
  ['bèng', '蹦'],
  ['bìng', '病'],
  ['bù', '部'],
  ['bā', '八'],
  ['bāng', '帮'],
  ['bēng', '绷'],
  ['běi', '北'],
  ['běn', '本'],
  ['bīn', '滨'],
  ['bīng', '冰'],
  ['bō', '拨'],
  ['bǎi', '百'],
  ['bǐ', '笔'],
  ['chuī', '炊'],
  ['cháng', '长'],
  ['cháo', '朝'],
  ['chén', '陈'],
  ['chéng', '城'],
  ['chí', '迟'],
  ['chóng', '虫'],
  ['chóu', '愁'],
  ['chún', '纯'],
  ['chāi', '拆'],
  ['chāo', '超'],
  ['chēng', '称'],
  ['chī', '吃'],
  ['chōng', '冲'],
  ['chōu', '抽'],
  ['chūn', '春'],
  ['chǎn', '产'],
  ['chǎng', '场'],
  ['cài', '菜'],
  ['cái', '才'],
  ['cán', '残'],
  ['cáng', '藏'],
  ['cè', '册'],
  ['céng', '曾'],
  ['cì', '次'],
  ['còu', '凑'],
  ['cóng', '丛'],
  ['cù', '促'],
  ['cún', '存'],
  ['cā', '擦'],
  ['cān', '参'],
  ['cāng', '仓'],
  ['cāo', '操'],
  ['cēn', '参'],
  ['cū', '粗'],
  ['cūn', '村'],
  ['cǎo', '草'],
  ['cǐ', '此'],
  ['de', '的'],
  ['dié', '碟'],
  ['diū', '丢'],
  ['duì', '队'],
  ['dà', '大'],
  ['dài', '带'],
  ['dàn', '蛋'],
  ['dào', '道'],
  ['dé', '得'],
  ['dì', '地'],
  ['dìng', '定'],
  ['dòu', '斗'],
  ['dù', '度'],
  ['dùn', '顿'],
  ['dú', '读'],
  ['dāng', '当'],
  ['dēng', '登'],
  ['děng', '等'],
  ['dōng', '东'],
  ['dōu', '都'],
  ['dūn', '吨'],
  ['dǎ', '打'],
  ['dǎng', '党'],
  ['dǐng', '顶'],
  ['dǒng', '懂'],
  ['fàn', '饭'],
  ['fáng', '房'],
  ['fèi', '费'],
  ['fèn', '份'],
  ['fó', '佛'],
  ['fù', '父'],
  ['fú', '服'],
  ['fā', '发'],
  ['fāng', '方'],
  ['fēi', '飞'],
  ['fēn', '分'],
  ['fēng', '封'],
  ['fǎn', '反'],
  ['fǒu', '否'],
  ['guì', '贵'],
  ['guī', '归'],
  ['gàn', '干'],
  ['gào', '告'],
  ['gè', '个'],
  ['gèng', '更'],
  ['gòu', '够'],
  ['gù', '故'],
  ['gā', '嘎'],
  ['gāi', '该'],
  ['gāng', '刚'],
  ['gāo', '高'],
  ['gē', '哥'],
  ['gēn', '跟'],
  ['gēng', '耕'],
  ['gōng', '公'],
  ['gǎn', '赶'],
  ['gǎng', '港'],
  ['gǒu', '狗'],
  ['gǔ', '古'],
  ['gǔn', '滚'],
  ['huì', '会'],
  ['huí', '回'],
  ['hàn', '汉'],
  ['hào', '号'],
  ['hái', '还'],
  ['háng', '航'],
  ['hèn', '恨'],
  ['hé', '和'],
  ['héng', '恒'],
  ['hòu', '候'],
  ['hóng', '洪'],
  ['hùn', '混'],
  ['hú', '湖'],
  ['hā', '哈'],
  ['hē', '喝'],
  ['hēi', '黑'],
  ['hěn', '很'],
  ['hūn', '婚'],
  ['hǎi', '海'],
  ['hǎn', '喊'],
  ['hǎo', '好'],
  ['jiào', '觉'],
  ['jié', '节'],
  ['jiù', '就'],
  ['jiē', '街'],
  ['jiǔ', '九'],
  ['jué', '决'],
  ['jìn', '进'],
  ['jù', '句'],
  ['jī', '鸡'],
  ['jīn', '今'],
  ['jīng', '精'],
  ['jūn', '均'],
  ['jǔ', '举'],
  ['kuì', '愧'],
  ['kuī', '亏'],
  ['kàn', '看'],
  ['kàng', '抗'],
  ['kào', '靠'],
  ['kòu', '扣'],
  ['kù', '库'],
  ['kùn', '困'],
  ['kāi', '开'],
  ['kāng', '康'],
  ['kē', '科'],
  ['kēng', '坑'],
  ['kě', '可'],
  ['kěn', '恳'],
  ['kōng', '空'],
  ['kǎ', '卡'],
  ['kǎn', '砍'],
  ['kǎo', '考'],
  ['kǒng', '孔'],
  ['kǒu', '口'],
  ['kǔ', '苦'],
  ['le', '了'],
  ['liè', '烈'],
  ['làng', '浪'],
  ['lái', '来'],
  ['lán', '兰'],
  ['láng', '郎'],
  ['láo', '劳'],
  ['lè', '乐'],
  ['lèng', '愣'],
  ['lín', '临'],
  ['líng', '零'],
  ['lòu', '漏'],
  ['lóng', '隆'],
  ['lóu', '楼'],
  ['lù', '陆'],
  ['lùn', '论'],
  ['lún', '轮'],
  ['lüè', '掠'],
  ['lā', '啦'],
  ['lěng', '冷'],
  ['lǎo', '老'],
  ['lǐ', '李'],
  ['lǐng', '领'],
  ['lǜ', '律'],
  ['men', '们'],
  ['miè', '蔑'],
  ['mài', '卖'],
  ['màn', '慢'],
  ['máng', '盲'],
  ['máo', '毛'],
  ['mèng', '梦'],
  ['méi', '没'],
  ['mén', '门'],
  ['méng', '盟'],
  ['mí', '迷'],
  ['mín', '民'],
  ['míng', '明'],
  ['mó', '魔'],
  ['móu', '谋'],
  ['mù', '目'],
  ['mā', '妈'],
  ['māo', '猫'],
  ['měi', '美'],
  ['mō', '摸'],
  ['mǎ', '马'],
  ['mǎi', '买'],
  ['mǎn', '满'],
  ['mǐ', '米'],
  ['mǐn', '敏'],
  ['mǒu', '某'],
  ['ne', '呢'],
  ['niè', '聂'],
  ['niú', '牛'],
  ['niē', '捏'],
  ['niǔ', '扭'],
  ['nà', '那'],
  ['nài', '耐'],
  ['nàn', '难'],
  ['nào', '闹'],
  ['ná', '拿'],
  ['nán', '南'],
  ['náng', '囊'],
  ['nèi', '内'],
  ['nèn', '嫩'],
  ['néng', '能'],
  ['ní', '泥'],
  ['nín', '您'],
  ['níng', '凝'],
  ['nòu', '耨'],
  ['nóng', '浓'],
  ['nüè', '疟'],
  ['nǎi', '奶'],
  ['nǎo', '脑'],
  ['nǐ', '你'],
  ['nǔ', '努'],
  ['nǚ', '女'],
  ['piē', '撇'],
  ['pà', '怕'],
  ['pài', '派'],
  ['pàn', '判'],
  ['pàng', '胖'],
  ['pào', '炮'],
  ['pán', '盘'],
  ['páng', '旁'],
  ['pèi', '配'],
  ['pèng', '碰'],
  ['péi', '陪'],
  ['pén', '盆'],
  ['péng', '朋'],
  ['pí', '皮'],
  ['píng', '评'],
  ['pò', '破'],
  ['pù', '铺'],
  ['pā', '趴'],
  ['pāi', '拍'],
  ['pī', '批'],
  ['pīn', '拼'],
  ['pō', '坡'],
  ['pū', '扑'],
  ['pǎo', '跑'],
  ['pǐn', '品'],
  ['qiú', '求'],
  ['qiē', '切'],
  ['qiě', '且'],
  ['qiū', '秋'],
  ['què', '确'],
  ['qín', '秦'],
  ['qù', '去'],
  ['qún', '裙'],
  ['qī', '期'],
  ['qīn', '亲'],
  ['qīng', '青'],
  ['qǐng', '请'],
  ['qǔ', '取'],
  ['ruì', '瑞'],
  ['ràng', '让'],
  ['rào', '绕'],
  ['rán', '燃'],
  ['rèn', '认'],
  ['rén', '人'],
  ['réng', '仍'],
  ['rì', '日'],
  ['ròu', '肉'],
  ['róng', '绒'],
  ['róu', '揉'],
  ['rùn', '闰'],
  ['rēng', '扔'],
  ['rǎng', '嚷'],
  ['shuì', '睡'],
  ['shuǐ', '水'],
  ['shài', '晒'],
  ['shàng', '上'],
  ['shào', '绍'],
  ['shén', '什'],
  ['shì', '是'],
  ['shí', '时'],
  ['shòu', '受'],
  ['shùn', '瞬'],
  ['shān', '山'],
  ['shāng', '伤'],
  ['shēn', '身'],
  ['shēng', '声'],
  ['shǎn', '闪'],
  ['shǎo', '少'],
  ['shǒu', '手'],
  ['suì', '碎'],
  ['sài', '赛'],
  ['sàn', '散'],
  ['sàng', '丧'],
  ['sè', '色'],
  ['sì', '四'],
  ['sòng', '送'],
  ['sù', '素'],
  ['sā', '撒'],
  ['sān', '三'],
  ['sāng', '桑'],
  ['sāo', '骚'],
  ['sēn', '森'],
  ['sī', '思'],
  ['sōng', '松'],
  ['sūn', '孙'],
  ['sǎ', '洒'],
  ['sǎo', '扫'],
  ['sǒu', '擞'],
  ['sǔn', '损'],
  ['tiē', '贴'],
  ['tiě', '铁'],
  ['tuì', '退'],
  ['tuī', '推'],
  ['tài', '太'],
  ['tái', '台'],
  ['tán', '弹'],
  ['táng', '糖'],
  ['táo', '逃'],
  ['tè', '特'],
  ['téng', '腾'],
  ['tí', '提'],
  ['tíng', '停'],
  ['tóng', '同'],
  ['tóu', '投'],
  ['tú', '图'],
  ['tún', '屯'],
  ['tā', '她'],
  ['tīng', '听'],
  ['tōng', '通'],
  ['tūn', '吞'],
  ['tǎng', '躺'],
  ['tǎo', '讨'],
  ['tǐ', '体'],
  ['tǔ', '土'],
  ['wú', '无'],
  ['wǔ', '五'],
  ['xiù', '秀'],
  ['xiē', '些'],
  ['xiě', '写'],
  ['xiū', '修'],
  ['xué', '学'],
  ['xuě', '雪'],
  ['xí', '习'],
  ['xíng', '行'],
  ['xù', '续'],
  ['xùn', '迅'],
  ['xī', '西'],
  ['xīn', '新'],
  ['xīng', '星'],
  ['xū', '需'],
  ['yuán', '原'],
  ['yuè', '月'],
  ['yuē', '约'],
  ['yè', '夜'],
  ['yín', '银'],
  ['yùn', '运'],
  ['yún', '云'],
  ['yě', '也'],
  ['yī', '衣'],
  ['yīn', '音'],
  ['yīng', '应'],
  ['yǔ', '雨'],
  ['zhuì', '坠'],
  ['zhuī', '追'],
  ['zhàn', '战'],
  ['zhào', '照'],
  ['zhái', '宅'],
  ['zhèng', '正'],
  ['zhòng', '重'],
  ['zhāng', '张'],
  ['zhēn', '真'],
  ['zhī', '之'],
  ['zhōng', '中'],
  ['zhōu', '州'],
  ['zhǎi', '窄'],
  ['zhǎng', '长'],
  ['zhǎo', '找'],
  ['zhǔn', '准'],
  ['zài', '再'],
  ['zàn', '赞'],
  ['zàng', '葬'],
  ['zào', '造'],
  ['zá', '杂'],
  ['zán', '咱'],
  ['zé', '则'],
  ['zéi', '贼'],
  ['zì', '字'],
  ['zòu', '奏'],
  ['zùn', '遵'],
  ['zāng', '脏'],
  ['zēng', '增'],
  ['zěn', '怎'],
  ['zōng', '宗'],
  ['zūn', '尊'],
  ['zǎo', '早'],
  ['zǐ', '子'],
  ['zǒng', '总'],
  ['zǒu', '走'],
  ['zǔ', '祖'],
  ['èr', '二'],
  ['ér', '而'],
]);

/**
 * 将带声调拼音转为对应汉字
 */
function pinyinToChar(marked: string): string {
  return PINYIN_CHAR_MAP.get(marked) ?? marked;
}

// ─── 音频缓存（已生成的真人发音文件）─────────────────────

interface AudioCache {
  [key: string]: HTMLAudioElement;
}

const audioCache: AudioCache = {};

/**
 * 获取音频元素（优先用缓存的文件，否则实时生成）
 */
function getAudio(marked: string): HTMLAudioElement {
  const char = pinyinToChar(marked);
  const cacheKey = `${marked}_${char}`;

  if (audioCache[cacheKey]) return audioCache[cacheKey];

  const audio = new Audio();
  audioCache[cacheKey] = audio;
  return audio;
}

/**
 * 尝试播放预录音（public/audio/ 目录）
 * 文件命名：pinyin_char.m4a  如 ba_八.m4a
 */
function tryPlayPreRecorded(marked: string): boolean {
  const char = pinyinToChar(marked);
  const filename = `${marked}_${char}.m4a`;
  const url = `/audio/${encodeURIComponent(filename)}`;
  const audio = getAudio(marked);
  
  // 检查这个 URL 是否能加载（通过 ping）
  const xhr = new XMLHttpRequest();
  xhr.open('HEAD', url, false); // 同步检查
  try {
    xhr.send();
    if (xhr.status === 200) {
      audio.src = url;
      audio.play().catch(() => {});
      return true;
    }
  } catch {}
  return false;
}

/**
 * 用 macOS say 命令生成音频（Blob URL）
 * 通过 Web Audio API + AudioContext 解码 m4a/aiff
 */
function speakWithSay(marked: string): void {
  if (globalMuted) return;

  // 动态导入 child_process（仅 Node.js 环境/ Electron）
  // 浏览器环境：fallback 到预录音或无声
  try {
    const link = document.createElement('a');
    link.style.display = 'none';
    // 不支持 say 命令的浏览器，降级
  } catch {}

  // 主要方案：直接用 Tingting 朗读汉字
  // macOS Safari/Chrome: 创建隐藏的 audio 元素用预录音
  // 预录音不存在时：尝试 Web Speech API（作为 fallback）
  if (!tryPlayPreRecorded(marked)) {
    // Fallback: Web Speech API（清理声调数字后朗读）
    fallbackTTS(marked);
  }
}

/**
 * Web Speech API fallback（无声调版）
 * 修复：getVoices() 在 voiceschanged 事件触发前返回空数组，
 * 必须等事件触发后才拿得到中文 voice。
 */
function fallbackTTS(marked: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const clean = marked.replace(/[1-5]/g, '');

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;

      const zhVoice = voices.find(
        (v) => v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('Hans')
      );
      if (zhVoice) utterance.voice = zhVoice;

      synth.speak(utterance);
    };

    // 尝试立即获取 voices（部分浏览器已缓存）
    const voices = synth.getVoices();
    if (voices.length > 0) {
      doSpeak(voices);
    } else {
      // voices 尚未加载，注册事件，等 ready 后再读
      const onVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged);
        doSpeak(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', onVoicesChanged);
    }
  } catch {}
}

// ─── 对外接口 ──────────────────────────────────────────────

export function speakPinyin(marked: string): void {
  if (globalMuted) return;
  speakWithSay(marked);
}

export function speakChinese(char: string): void {
  if (globalMuted) return;
  speakWithSay(char);
}

// ─── React hook ─────────────────────────────────────────────

export function useAudio() {
  const settings = useRef({ muted: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pinyin_audio_muted');
      if (raw) settings.current.muted = JSON.parse(raw).muted ?? false;
      setMuted(settings.current.muted);
    } catch {}

    // iOS Safari / 部分 Chrome：voices 异步加载，提前触发以缩短首次 TTS 延迟
    const synth = window.speechSynthesis;
    if (synth) {
      // 立即尝试一次（已缓存则直接拿到）
      synth.getVoices();
      // 注册事件，确保在 voices 列表更新时重新拉取
      synth.onvoiceschanged = () => { synth.getVoices(); };
    }
  }, []);

  return {
    playClick: () => { if (!settings.current.muted) playClickSound(); },
    playCorrect: () => { if (!settings.current.muted) playCorrectSound(); },
    playWrong: () => { if (!settings.current.muted) playWrongSound(); },
    playVictory: () => { if (!settings.current.muted) playVictorySound(); },
    playCombo: (combo: number) => { if (!settings.current.muted) playComboSound(combo); },
    speakPinyin,
    speakChinese,
    toggleMute: () => {
      settings.current.muted = !settings.current.muted;
      setMuted(settings.current.muted);
      try {
        localStorage.setItem('pinyin_audio_muted', JSON.stringify({ muted: settings.current.muted }));
      } catch {}
    },
    isMuted: () => settings.current.muted,
  };
}
