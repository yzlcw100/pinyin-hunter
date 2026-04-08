#!/usr/bin/env node
/**
 * generateAudioSimple.js
 * 生成 Tingting 音频文件（简易版）
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
fs.mkdirSync(AUDIO_DIR, { recursive: true });

// 整体认读音节
const INTEGRATED_MARKED = [
  ['zhī','知'],['zhī','之'],['chī','吃'],['chí','迟'],
  ['shì','是'],['shí','时'],['rì','日'],
  ['zì','字'],['zǐ','子'],['cì','次'],['cǐ','此'],
  ['sì','四'],['sī','思'],
  ['yī','一'],['yī','衣'],['wǔ','五'],['wú','无'],
  ['yǔ','与'],['yǔ','雨'],['yě','也'],['yè','夜'],
  ['yuè','月'],['yuē','约'],
  ['yuán','元'],['yuán','原'],['yīn','音'],['yín','银'],
  ['yún','云'],['yùn','运'],['yīng','英'],['yīng','应'],
];

// Compound entries: [pinyin, marked, char1, char2?]
const COMPOUND_ENTRIES = [
  ['ba','bā','八'],['ba','bà','爸'],['pa','pà','怕'],['pa','pā','趴'],
  ['ma','mā','妈'],['ma','mǎ','马'],['fa','fā','发'],['da','dà','大'],['da','dǎ','打'],
  ['ta','tā','他'],['na','nà','那'],['na','ná','拿'],
  ['la','lā','拉'],['la','lā','啦'],['ga','gā','嘎'],['ka','kǎ','卡'],['ha','hā','哈'],
  ['za','zá','杂'],['za','zán','咱'],['ca','cā','擦'],['sa','sā','撒'],['sa','sǎ','洒'],
  ['bo','bō','波'],['bo','bō','拨'],['po','pò','破'],['po','pō','坡'],
  ['mo','mō','摸'],['mo','mó','魔'],['fo','fó','佛'],
  ['de','de','的'],['de','dé','得'],['te','tè','特'],['ne','ne','呢'],
  ['le','le','了'],['le','lè','乐'],
  ['ge','gè','个'],['ge','gē','哥'],['ke','kě','可'],['ke','kē','科'],
  ['he','hé','和'],['he','hē','喝'],
  ['ze','zé','则'],['ce','cè','册'],['se','sè','色'],
  ['bi','bǐ','比'],['bi','bǐ','笔'],['pi','pí','皮'],['pi','pī','批'],
  ['mi','mǐ','米'],['mi','mí','迷'],['di','dì','弟'],['di','dì','地'],
  ['ti','tǐ','体'],['ti','tí','提'],['ni','nǐ','你'],['ni','ní','泥'],
  ['li','lǐ','里'],['li','lǐ','李'],['ji','jī','机'],['ji','jī','鸡'],
  ['qi','qī','七'],['qi','qī','期'],['xi','xī','西'],['xi','xí','习'],
  ['zi','zì','字'],['zi','zǐ','子'],['ci','cì','次'],['ci','cǐ','此'],
  ['si','sì','四'],['si','sī','思'],
  ['bu','bù','不'],['bu','bù','部'],['pu','pū','扑'],['pu','pù','铺'],
  ['mu','mù','木'],['mu','mù','目'],['fu','fù','父'],['fu','fú','服'],
  ['du','dú','读'],['du','dù','度'],['tu','tú','图'],['tu','tǔ','土'],
  ['nu','nǔ','努'],['lu','lù','路'],['lu','lù','陆'],
  ['gu','gǔ','古'],['gu','gù','故'],['ku','kǔ','苦'],['ku','kù','库'],
  ['hu','hǎo','好'],['hu','hú','湖'],
  ['zu','zǔ','组'],['zu','zǔ','祖'],['cu','cū','粗'],['cu','cù','促'],
  ['su','sù','速'],['su','sù','素'],
  ['nü','nǚ','女'],['lü','lǜ','绿'],['lü','lǜ','律'],
  ['ju','jǔ','举'],['ju','jù','句'],['qu','qù','去'],['qu','qǔ','取'],
  ['xu','xū','需'],['xu','xù','续'],
  ['bai','bái','白'],['bai','bǎi','百'],['pai','pài','派'],['pai','pāi','拍'],
  ['mai','mǎi','买'],['mai','mài','卖'],['dai','dài','带'],['dai','dà','大'],
  ['tai','tài','太'],['tai','tái','台'],['nai','nǎi','奶'],['nai','nài','耐'],
  ['lai','lái','来'],['gai','gāi','该'],['kai','kāi','开'],
  ['hai','hái','还'],['hai','hǎi','海'],['zai','zài','在'],['zai','zài','再'],
  ['cai','cái','才'],['cai','cài','菜'],['sai','sài','赛'],
  ['zhai','zhái','宅'],['zhai','zhǎi','窄'],['chai','chāi','拆'],['shai','shài','晒'],
  ['bei','běi','北'],['bei','bèi','被'],['pei','pèi','配'],['pei','péi','陪'],
  ['mei','méi','没'],['mei','měi','美'],['fei','fēi','飞'],['fei','fèi','费'],
  ['nei','nèi','内'],['hei','hēi','黑'],['zei','zéi','贼'],
  ['dui','duì','对'],['dui','duì','队'],['tui','tuī','推'],['tui','tuì','退'],
  ['gui','guì','贵'],['gui','guī','归'],['kui','kuī','亏'],['kui','kuì','愧'],
  ['hui','huì','会'],['hui','huí','回'],
  ['zhui','zhuī','追'],['zhui','zhuì','坠'],['chui','chuī','吹'],['chui','chuī','炊'],
  ['shui','shuǐ','水'],['shui','shuì','睡'],['rui','ruì','瑞'],['sui','suì','岁'],['sui','suì','碎'],
  ['bao','bào','抱'],['bao','bào','报'],['pao','pǎo','跑'],['pao','pào','炮'],
  ['mao','máo','毛'],['mao','māo','猫'],['dao','dào','到'],['dao','dào','道'],
  ['tao','tǎo','讨'],['tao','táo','逃'],['nao','nǎo','脑'],['nao','nào','闹'],
  ['lao','lǎo','老'],['lao','láo','劳'],['gao','gāo','高'],['gao','gào','告'],
  ['kao','kǎo','考'],['kao','kào','靠'],['hao','hǎo','好'],['hao','hào','号'],
  ['zao','zǎo','早'],['zao','zào','造'],['cao','cǎo','草'],['cao','cāo','操'],
  ['sao','sǎo','扫'],['sao','sāo','骚'],['zhao','zhǎo','找'],['zhao','zhào','照'],
  ['chao','chāo','超'],['chao','cháo','朝'],['shao','shǎo','少'],['shao','shào','绍'],
  ['rao','rào','绕'],
  ['mou','mǒu','某'],['mou','móu','谋'],['fou','fǒu','否'],['dou','dōu','都'],['dou','dòu','斗'],
  ['tou','tóu','头'],['tou','tóu','投'],['nou','nòu','耨'],['lou','lóu','楼'],['lou','lòu','漏'],
  ['gou','gǒu','狗'],['gou','gòu','够'],['kou','kǒu','口'],['kou','kòu','扣'],
  ['hou','hòu','后'],['hou','hòu','候'],['zou','zǒu','走'],['zou','zòu','奏'],
  ['cou','còu','凑'],['sou','sǒu','艘'],['sou','sǒu','擞'],
  ['zhou','zhōu','周'],['zhou','zhōu','州'],['chou','chōu','抽'],['chou','chóu','愁'],
  ['shou','shǒu','手'],['shou','shòu','受'],['rou','ròu','肉'],['rou','róu','揉'],
  ['diu','diū','丢'],['niu','niú','牛'],['niu','niǔ','扭'],
  ['jiu','jiǔ','九'],['jiu','jiù','就'],['qiu','qiú','求'],['qiu','qiū','秋'],
  ['xiu','xiū','修'],['xiu','xiù','秀'],
  ['bie','bié','别'],['bie','biàn','变'],['pie','piē','撇'],['mie','miè','灭'],
  ['die','dié','叠'],['die','dié','碟'],['tie','tiě','铁'],['tie','tiē','贴'],
  ['nie','niē','捏'],['nie','niè','聂'],['lie','liè','列'],['lie','liè','烈'],
  ['jie','jiē','街'],['jie','jié','节'],['qie','qiě','且'],['qie','qiē','切'],
  ['xie','xiě','写'],['xie','xiē','些'],
  ['nüe','nüè','虐'],['nüe','nüè','疟'],['lüe','lüè','略'],['lüe','lüè','掠'],
  ['jue','jué','决'],['jue','jiào','觉'],['que','què','却'],['que','què','确'],
  ['xue','xué','学'],['xue','xuě','雪'],
  ['er','èr','二'],['er','ér','而'],
  ['ban','bàn','半'],['ban','bàn','办'],['pan','pán','盘'],['pan','pàn','判'],
  ['man','màn','慢'],['man','mǎn','满'],['fan','fǎn','反'],['fan','fàn','饭'],
  ['dan','dàn','但'],['dan','dàn','蛋'],['tan','tán','谈'],['tan','tán','弹'],
  ['nan','nán','南'],['nan','nàn','难'],['lan','lán','蓝'],['lan','lán','兰'],
  ['gan','gàn','干'],['gan','gǎn','赶'],['kan','kàn','看'],['kan','kǎn','砍'],
  ['han','hàn','汉'],['han','hǎn','喊'],['zan','zán','咱'],['zan','zàn','赞'],
  ['can','cān','参'],['can','cán','残'],['san','sān','三'],['san','sàn','散'],
  ['zhan','zhàn','站'],['zhan','zhàn','战'],['chan','chǎn','产'],['chan','cháng','常'],
  ['shan','shān','山'],['shan','shǎn','闪'],['ran','rán','然'],['ran','rán','燃'],
  ['ben','běn','本'],['ben','bèn','笨'],['pen','pén','盆'],['men','men','们'],['men','mén','门'],
  ['fen','fēn','分'],['fen','fèn','份'],['nen','nèn','嫩'],
  ['gen','gēn','根'],['gen','gēn','跟'],['ken','kěn','肯'],['ken','kěn','恳'],
  ['hen','hěn','很'],['hen','hèn','恨'],['zen','zěn','怎'],
  ['cen','cēn','参'],['sen','sēn','森'],
  ['zhen','zhēn','真'],['zhen','zhèng','正'],['chen','chén','陈'],['chen','chēng','称'],
  ['shen','shén','什'],['shen','shēn','身'],['ren','rén','人'],['ren','rèn','认'],
  ['bin','bīn','宾'],['bin','bīn','滨'],['pin','pǐn','品'],['pin','pīn','拼'],
  ['min','mín','民'],['min','mǐn','敏'],['nin','nín','您'],['lin','lín','林'],['lin','lín','临'],
  ['jin','jìn','进'],['jin','jīn','今'],['qin','qīn','亲'],['qin','qín','秦'],
  ['xin','xīn','心'],['xin','xīn','新'],
  ['dun','dùn','顿'],['dun','dūn','吨'],['tun','tūn','吞'],['tun','tún','屯'],
  ['lun','lún','轮'],['lun','lùn','论'],
  ['gun','gǔn','滚'],['kun','kùn','困'],['hun','hùn','混'],['hun','hūn','婚'],
  ['zun','zūn','尊'],['zun','zùn','遵'],['cun','cūn','村'],['cun','cún','存'],
  ['sun','sūn','孙'],['sun','sǔn','损'],['zhun','zhǔn','准'],
  ['chun','chūn','春'],['chun','chún','纯'],['shun','shùn','顺'],['shun','shùn','瞬'],
  ['run','rùn','润'],['run','rùn','闰'],
  ['lün','lùn','论'],['jun','jūn','军'],['jun','jūn','均'],['qun','qún','群'],['qun','qún','裙'],
  ['xun','xùn','训'],['xun','xùn','迅'],
  ['bang','bāng','帮'],['bang','bàng','棒'],['pang','páng','旁'],['pang','pàng','胖'],
  ['mang','máng','忙'],['mang','máng','盲'],['fang','fāng','方'],['fang','fáng','房'],
  ['dang','dāng','当'],['dang','dǎng','党'],['tang','táng','糖'],['tang','tǎng','躺'],
  ['nang','náng','囊'],['lang','làng','浪'],['lang','láng','郎'],
  ['gang','gāng','刚'],['gang','gǎng','港'],['kang','kāng','康'],['kang','kàng','抗'],
  ['hang','xíng','行'],['hang','háng','航'],['zang','zāng','脏'],['zang','zàng','葬'],
  ['cang','cáng','藏'],['cang','cāng','仓'],['sang','sāng','桑'],['sang','sàng','丧'],
  ['zhang','zhāng','张'],['zhang','zhǎng','长'],['chang','cháng','长'],['chang','chǎng','场'],
  ['shang','shàng','上'],['shang','shāng','伤'],['rang','ràng','让'],['rang','rǎng','嚷'],
  ['beng','bèng','蹦'],['beng','bēng','绷'],['peng','péng','朋'],['peng','pèng','碰'],
  ['meng','mèng','梦'],['meng','méng','盟'],['feng','fēng','风'],['feng','fēng','封'],
  ['deng','děng','等'],['deng','dēng','登'],['teng','téng','疼'],['teng','téng','腾'],
  ['neng','néng','能'],['leng','lěng','冷'],['leng','lèng','愣'],
  ['geng','gèng','更'],['geng','gēng','耕'],['keng','kēng','坑'],['heng','héng','横'],['heng','héng','恒'],
  ['zeng','zēng','增'],['ceng','céng','层'],
  ['zheng','zhèng','正'],['cheng','chéng','成'],['cheng','chéng','城'],
  ['sheng','shēng','生'],['sheng','shēng','声'],['reng','rēng','扔'],['reng','réng','仍'],
  ['bing','bìng','病'],['bing','bīng','冰'],['ping','píng','平'],['ping','píng','评'],
  ['ming','míng','名'],['ming','míng','明'],['ding','dìng','定'],['ding','dǐng','顶'],
  ['ting','tīng','听'],['ting','tíng','停'],['ning','níng','宁'],['ning','níng','凝'],
  ['ling','líng','零'],['ling','lǐng','领'],['jing','jīng','经'],['jing','jīng','精'],
  ['qing','qǐng','请'],['qing','qīng','青'],['xing','xíng','行'],['xing','xīng','星'],
  ['dong','dōng','东'],['dong','dǒng','懂'],['tong','tóng','同'],['tong','tōng','通'],
  ['nong','nóng','农'],['nong','nóng','浓'],['long','lóng','龙'],['long','lóng','隆'],
  ['gong','gōng','工'],['gong','gōng','公'],['kong','kōng','空'],['kong','kǒng','孔'],
  ['hong','hóng','红'],['hong','hóng','洪'],['zong','zǒng','总'],['zong','zōng','宗'],
  ['cong','cóng','从'],['cong','cóng','丛'],['song','sòng','送'],['song','sōng','松'],
  ['zhong','zhōng','中'],['zhong','zhòng','重'],['chong','chōng','冲'],['chong','chóng','虫'],
  ['rong','róng','容'],['rong','róng','绒'],
];

function makeId(marked, base) {
  const map = { 'ā':'a','á':'a','ǎ':'a','à':'a','ē':'e','é':'e','ě':'e','è':'e','ī':'i','í':'i','ǐ':'i','ì':'i','ō':'o','ó':'o','ǒ':'o','ò':'o','ū':'u','ú':'u','ǔ':'u','ù':'u','ü':'v' };
  const toneStripped = marked.replace(/[áàǎāēèěēìíǐīòóǒōùúǔūüǜǚǜǘ]/g, m => map[m] || m);
  return `${base}_${toneStripped}`;
}

// 收集所有音节
const seen = new Set();
const all = [];

for (const e of COMPOUND_ENTRIES) {
  const [pinyin, marked] = e;
  if (!seen.has(marked)) {
    seen.add(marked);
    all.push({ marked, id: makeId(marked, pinyin) });
  }
}

for (const e of INTEGRATED_MARKED) {
  const [marked] = e;
  const base = marked.replace(/[áàǎāēèěēìíǐīòóǒōùúǔūüǜǚǜǘ]/g, '').replace('ü','v');
  if (!seen.has(marked)) {
    seen.add(marked);
    all.push({ marked, id: makeId(marked, base) });
  }
}

const existing = new Set(fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.m4a')));
const toGen = all.filter(s => !existing.has(`${s.id}.m4a`));

console.log(`已有: ${existing.size} | 需生成: ${toGen.length} | 总: ${all.length}`);

if (toGen.length === 0) {
  console.log('全部已生成!');
  process.exit(0);
}

let done = 0, errs = 0;
const start = Date.now();
const CONC = 4;
let active = 0, idx = 0;

function genOne(item) {
  return new Promise(resolve => {
    const { marked, id } = item;
    const file = path.join(AUDIO_DIR, `${id}.m4a`);
    const child = spawn('/usr/bin/say', ['-v', 'Tingting', '-o', file, marked]);
    let errStr = '';
    child.stderr.on('data', d => { errStr += d; });
    const timer = setTimeout(() => { child.kill(); errs++; done++; update(); resolve(); }, 12000);
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) errs++;
      done++;
      update();
      resolve();
    });
  });
}

function update() {
  if (done % 20 === 0 || done === toGen.length) {
    process.stdout.write(`\r[${((done/toGen.length)*100).toFixed(0)}%] ${done}/${toGen.length} (${errs}错) ${((Date.now()-start)/1000).toFixed(0)}s   `);
  }
}

function runNext() {
  while (active < CONC && idx < toGen.length) {
    active++;
    genOne(toGen[idx++]).then(() => { active--; runNext(); });
  }
}

runNext();
