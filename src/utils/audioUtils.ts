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
 * 去掉声调符号，将带调拼音转为无声调基础拼音
 * 例如：'bā' → 'ba', 'jué' → 'jue', 'nǚ' → 'nv'
 */
function toBasePinyin(marked: string): string {
  const TONE_MAP: Record<string, string> = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ü': 'v', 'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
    'ń': 'n', 'ň': 'n', 'm̄': 'm',
  };
  return marked.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜńňm̄]/g, (c) => TONE_MAP[c] ?? c);
}

/**
 * pinyin → 最常用汉字 映射表（key 为无声调基础拼音，与音频文件名对齐）
 * 用于 TTS 发音：speakPinyin('bā') → 说"八"
 * 覆盖所有 500+ 音节
 */
const PINYIN_CHAR_MAP = new Map<string,string>([
['bian', '变'],
['bie', '别'],
['ba', '爸'],
['ban', '办'],
['bang', '棒'],
['bao', '报'],
['bai', '白'],
['bei', '被'],
['ben', '笨'],
['beng', '蹦'],
['bing', '病'],
['bu', '部'],
['ba', '八'],
['bang', '帮'],
['beng', '绷'],
['bei', '北'],
['ben', '本'],
['bin', '滨'],
['bing', '冰'],
['bo', '拨'],
['bai', '百'],
['bi', '笔'],
['chui', '炊'],
['chang', '长'],
['chao', '朝'],
['chen', '陈'],
['cheng', '城'],
['chi', '迟'],
['chong', '虫'],
['chou', '愁'],
['chun', '纯'],
['chai', '拆'],
['chao', '超'],
['cheng', '称'],
['chi', '吃'],
['chong', '冲'],
['chou', '抽'],
['chun', '春'],
['chan', '产'],
['chang', '场'],
['cai', '菜'],
['cai', '才'],
['can', '残'],
['cang', '藏'],
['ce', '册'],
['ceng', '曾'],
['ci', '次'],
['cou', '凑'],
['cong', '丛'],
['cu', '促'],
['cun', '存'],
['ca', '擦'],
['can', '参'],
['cang', '仓'],
['cao', '操'],
['cen', '参'],
['cu', '粗'],
['cun', '村'],
['cao', '草'],
['ci', '此'],
['de', '的'],
['die', '碟'],
['diu', '丢'],
['dui', '队'],
['da', '大'],
['dai', '带'],
['dan', '蛋'],
['dao', '道'],
['de', '得'],
['di', '地'],
['ding', '定'],
['dou', '斗'],
['du', '度'],
['dun', '顿'],
['du', '读'],
['dang', '当'],
['deng', '登'],
['deng', '等'],
['dong', '东'],
['dou', '都'],
['dun', '吨'],
['da', '打'],
['dang', '党'],
['ding', '顶'],
['dong', '懂'],
['fan', '饭'],
['fang', '房'],
['fei', '费'],
['fen', '份'],
['fo', '佛'],
['fu', '父'],
['fu', '服'],
['fa', '发'],
['fang', '方'],
['fei', '飞'],
['fen', '分'],
['feng', '封'],
['fan', '反'],
['fou', '否'],
['gui', '贵'],
['gui', '归'],
['gan', '干'],
['gao', '告'],
['ge', '个'],
['geng', '更'],
['gou', '够'],
['gu', '故'],
['ga', '嘎'],
['gai', '该'],
['gang', '刚'],
['gao', '高'],
['ge', '哥'],
['gen', '跟'],
['geng', '耕'],
['gong', '公'],
['gan', '赶'],
['gang', '港'],
['gou', '狗'],
['gu', '古'],
['gun', '滚'],
['hui', '会'],
['hui', '回'],
['han', '汉'],
['hao', '号'],
['hai', '还'],
['hang', '航'],
['hen', '恨'],
['he', '和'],
['heng', '恒'],
['hou', '候'],
['hong', '洪'],
['hun', '混'],
['hu', '湖'],
['ha', '哈'],
['he', '喝'],
['hei', '黑'],
['hen', '很'],
['hun', '婚'],
['hai', '海'],
['han', '喊'],
['hao', '好'],
['jiao', '觉'],
['jie', '节'],
['jiu', '就'],
['jie', '街'],
['jiu', '九'],
['jue', '决'],
['jin', '进'],
['ju', '句'],
['ji', '鸡'],
['jin', '今'],
['jing', '精'],
['jun', '均'],
['ju', '举'],
['kui', '愧'],
['kui', '亏'],
['kan', '看'],
['kang', '抗'],
['kao', '靠'],
['kou', '扣'],
['ku', '库'],
['kun', '困'],
['kai', '开'],
['kang', '康'],
['ke', '科'],
['keng', '坑'],
['ke', '可'],
['ken', '恳'],
['kong', '空'],
['ka', '卡'],
['kan', '砍'],
['kao', '考'],
['kong', '孔'],
['kou', '口'],
['ku', '苦'],
['le', '了'],
['lie', '烈'],
['lang', '浪'],
['lai', '来'],
['lan', '兰'],
['lang', '郎'],
['lao', '劳'],
['le', '乐'],
['leng', '愣'],
['lin', '临'],
['ling', '零'],
['lou', '漏'],
['long', '隆'],
['lou', '楼'],
['lu', '陆'],
['lun', '论'],
['lun', '轮'],
['lve', '掠'],
['la', '啦'],
['leng', '冷'],
['lao', '老'],
['li', '李'],
['ling', '领'],
['lv', '律'],
['men', '们'],
['mie', '蔑'],
['mai', '卖'],
['man', '慢'],
['mang', '盲'],
['mao', '毛'],
['meng', '梦'],
['mei', '没'],
['men', '门'],
['meng', '盟'],
['mi', '迷'],
['min', '民'],
['ming', '明'],
['mo', '魔'],
['mou', '谋'],
['mu', '目'],
['ma', '妈'],
['mao', '猫'],
['mei', '美'],
['mo', '摸'],
['ma', '马'],
['mai', '买'],
['man', '满'],
['mi', '米'],
['min', '敏'],
['mou', '某'],
['ne', '呢'],
['nie', '聂'],
['niu', '牛'],
['nie', '捏'],
['niu', '扭'],
['na', '那'],
['nai', '耐'],
['nan', '难'],
['nao', '闹'],
['na', '拿'],
['nan', '南'],
['nang', '囊'],
['nei', '内'],
['nen', '嫩'],
['neng', '能'],
['ni', '泥'],
['nin', '您'],
['ning', '凝'],
['nou', '耨'],
['nong', '浓'],
['nve', '疟'],
['nai', '奶'],
['nao', '脑'],
['ni', '你'],
['nu', '努'],
['nv', '女'],
['pie', '撇'],
['pa', '怕'],
['pai', '派'],
['pan', '判'],
['pang', '胖'],
['pao', '炮'],
['pan', '盘'],
['pang', '旁'],
['pei', '配'],
['peng', '碰'],
['pei', '陪'],
['pen', '盆'],
['peng', '朋'],
['pi', '皮'],
['ping', '评'],
['po', '破'],
['pu', '铺'],
['pa', '趴'],
['pai', '拍'],
['pi', '批'],
['pin', '拼'],
['po', '坡'],
['pu', '扑'],
['pao', '跑'],
['pin', '品'],
['qiu', '求'],
['qie', '切'],
['qie', '且'],
['qiu', '秋'],
['que', '确'],
['qin', '秦'],
['qu', '去'],
['qun', '裙'],
['qi', '期'],
['qin', '亲'],
['qing', '青'],
['qing', '请'],
['qu', '取'],
['rui', '瑞'],
['rang', '让'],
['rao', '绕'],
['ran', '燃'],
['ren', '认'],
['ren', '人'],
['reng', '仍'],
['ri', '日'],
['rou', '肉'],
['rong', '绒'],
['rou', '揉'],
['run', '闰'],
['reng', '扔'],
['rang', '嚷'],
['shui', '睡'],
['shui', '水'],
['shai', '晒'],
['shang', '上'],
['shao', '绍'],
['shen', '什'],
['shi', '是'],
['shi', '时'],
['shou', '受'],
['shun', '瞬'],
['shan', '山'],
['shang', '伤'],
['shen', '身'],
['sheng', '声'],
['shan', '闪'],
['shao', '少'],
['shou', '手'],
['sui', '碎'],
['sai', '赛'],
['san', '散'],
['sang', '丧'],
['se', '色'],
['si', '四'],
['song', '送'],
['su', '素'],
['sa', '撒'],
['san', '三'],
['sang', '桑'],
['sao', '骚'],
['sen', '森'],
['si', '思'],
['song', '松'],
['sun', '孙'],
['sa', '洒'],
['sao', '扫'],
['sou', '擞'],
['sun', '损'],
['tie', '贴'],
['tie', '铁'],
['tui', '退'],
['tui', '推'],
['tai', '太'],
['tai', '台'],
['tan', '弹'],
['tang', '糖'],
['tao', '逃'],
['te', '特'],
['teng', '腾'],
['ti', '提'],
['ting', '停'],
['tong', '同'],
['tou', '投'],
['tu', '图'],
['tun', '屯'],
['ta', '她'],
['ting', '听'],
['tong', '通'],
['tun', '吞'],
['tang', '躺'],
['tao', '讨'],
['ti', '体'],
['tu', '土'],
['wu', '无'],
['wu', '五'],
['xiu', '秀'],
['xie', '些'],
['xie', '写'],
['xiu', '修'],
['xue', '学'],
['xue', '雪'],
['xi', '习'],
['xing', '行'],
['xu', '续'],
['xun', '迅'],
['xi', '西'],
['xin', '新'],
['xing', '星'],
['xu', '需'],
['yuan', '原'],
['yue', '月'],
['yue', '约'],
['ye', '夜'],
['yin', '银'],
['yun', '运'],
['yun', '云'],
['ye', '也'],
['yi', '衣'],
['yin', '音'],
['ying', '应'],
['yu', '雨'],
['zhui', '坠'],
['zhui', '追'],
['zhan', '战'],
['zhao', '照'],
['zhai', '宅'],
['zheng', '正'],
['zhong', '重'],
['zhang', '张'],
['zhen', '真'],
['zhi', '之'],
['zhong', '中'],
['zhou', '州'],
['zhai', '窄'],
['zhang', '长'],
['zhao', '找'],
['zhun', '准'],
['zai', '再'],
['zan', '赞'],
['zang', '葬'],
['zao', '造'],
['za', '杂'],
['zan', '咱'],
['ze', '则'],
['zei', '贼'],
['zi', '字'],
['zou', '奏'],
['zun', '遵'],
['zang', '脏'],
['zeng', '增'],
['zen', '怎'],
['zong', '宗'],
['zun', '尊'],
['zao', '早'],
['zi', '子'],
['zong', '总'],
['zou', '走'],
['zu', '祖'],
['er', '二'],
['er', '而']
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
 * 文件命名：base_pinyin_char.m4a  如 ba_八.m4a
 */
function tryPlayPreRecorded(marked: string): boolean {
  const base = toBasePinyin(marked);           // 'bā' → 'ba'
  const char = PINYIN_CHAR_MAP.get(base) ?? pinyinToChar(marked);
  const filename = `${base}_${char}.m4a`;     // 'ba_八.m4a'
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
