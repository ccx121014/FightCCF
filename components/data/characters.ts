import type { Character, Skill, TargetType, EffectType } from '@shared/types';
import type { ElementType } from '@shared/constants';
import { getProfile, type SkillDef } from '@/game/skills/attackProfiles';

// 依据算法攻击档案（attackProfiles）生成图鉴技能，确保「展示」与「实战」一致。
function targetTypeOf(def: SkillDef): TargetType {
  if (def.behavior === 'pierce') return 'line';
  if (def.behavior === 'chain' || def.behavior === 'split') return 'random';
  if (def.aoe) return 'aoe';
  return 'single';
}

function effectTypeOf(def: SkillDef): EffectType {
  if (def.behavior === 'buff') {
    if (def.shield) return 'shield';
    if (def.selfHeal) return 'heal';
    return 'buff';
  }
  return 'damage';
}

// 为角色生成三个主动技能（普攻由战斗系统内置的 I 键处理，这里是 J/K/L）
function makeSkills(element: ElementType, characterId: string): Skill[] {
  const profile = getProfile(characterId);
  return profile.skills.map((def, idx) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    type: idx === 2 ? 'ultimate' : 'active',
    element,
    energyCost: def.energyCost,
    cooldown: def.cooldown,
    damageMultiplier: def.damageMultiplier,
    targetType: targetTypeOf(def),
    effectType: effectTypeOf(def),
    rangeValue: def.range,
    animationType: def.behavior,
  }));
}

// 14 个算法竞赛主题角色
const RAW_CHARACTERS: Character[] = [
  {
    id: 'bubble_sort',
    name: '冒泡排序者',
    title: '交换的韵律',
    description: '相邻比较、逐位上浮。攻击带有连续的多段打击，越打越快。',
    element: 'water',
    rarity: 'normal',
    type: 'warrior',
    baseStats: { hp: 1100, attack: 120, defense: 70, speed: 95, critRate: 0.05, critDamage: 1.5 },
    passive: { id: 'p_bubble', name: '逐位上浮', description: '每次命中提升 3% 攻击，最多叠加 5 层', effect: { atkPerHit: 0.03, maxStack: 5 } },
    skills: [],
    avatarColor: '#38bdf8',
  },
  {
    id: 'quick_sort',
    name: '快速排序者',
    title: '分治的锋刃',
    description: '选定基准，左右开弓。高爆发的分割斩击。',
    element: 'wind',
    rarity: 'rare',
    type: 'assassin',
    baseStats: { hp: 950, attack: 175, defense: 55, speed: 135, critRate: 0.15, critDamage: 1.8 },
    passive: { id: 'p_quick', name: '基准点', description: '对生命值低于 50% 的敌人伤害提升 25%', effect: { execThreshold: 0.5, bonus: 0.25 } },
    skills: [],
    avatarColor: '#2dd4bf',
  },
  {
    id: 'binary_search',
    name: '二分查找者',
    title: '折半的凝视',
    description: '每次锁定区间中点，精准打击，暴击率极高。',
    element: 'ice',
    rarity: 'rare',
    type: 'archer',
    baseStats: { hp: 880, attack: 165, defense: 50, speed: 120, critRate: 0.35, critDamage: 2.0 },
    passive: { id: 'p_binary', name: '收敛', description: '连续命中同一目标暴击率递增 8%', effect: { critPerHit: 0.08 } },
    skills: [],
    avatarColor: '#7dd3fc',
  },
  {
    id: 'dijkstra',
    name: '迪杰斯特拉',
    title: '最短路径行者',
    description: '贪心地扩展最近节点，每步都走向最优解。',
    element: 'light',
    rarity: 'epic',
    type: 'support',
    baseStats: { hp: 1050, attack: 150, defense: 80, speed: 110, critRate: 0.1, critDamage: 1.6 },
    passive: { id: 'p_dijkstra', name: '松弛操作', description: '技能命中后为自身恢复 5% 生命', effect: { lifesteal: 0.05 } },
    skills: [],
    avatarColor: '#fde047',
  },
  {
    id: 'dfs',
    name: '深度优先者',
    title: '一往无前',
    description: '沿着一条路走到黑，攻击距离长、单点爆发强。',
    element: 'dark',
    rarity: 'epic',
    type: 'assassin',
    baseStats: { hp: 900, attack: 195, defense: 60, speed: 128, critRate: 0.2, critDamage: 1.9 },
    passive: { id: 'p_dfs', name: '回溯', description: '击杀敌人后立即刷新技能冷却', effect: { resetOnKill: true } },
    skills: [],
    avatarColor: '#a855f7',
  },
  {
    id: 'bfs',
    name: '广度优先者',
    title: '层层推进',
    description: '一圈圈向外扩散，擅长范围压制。',
    element: 'water',
    rarity: 'epic',
    type: 'mage',
    baseStats: { hp: 1000, attack: 170, defense: 70, speed: 105, critRate: 0.12, critDamage: 1.7 },
    passive: { id: 'p_bfs', name: '队列扩散', description: '技能对范围内每个敌人额外 10% 伤害', effect: { aoeBonus: 0.1 } },
    skills: [],
    avatarColor: '#38bdf8',
  },
  {
    id: 'dynamic_programming',
    name: '动态规划师',
    title: '最优子结构',
    description: '记忆化每一次战斗，越战越强，后期无解。',
    element: 'nature',
    rarity: 'legendary',
    type: 'tank',
    baseStats: { hp: 1400, attack: 160, defense: 120, speed: 90, critRate: 0.1, critDamage: 1.6 },
    passive: { id: 'p_dp', name: '状态转移', description: '每损失 10% 生命，攻击提升 6%', effect: { atkPerHpLost: 0.06 } },
    skills: [],
    avatarColor: '#4ade80',
  },
  {
    id: 'segment_tree',
    name: '线段树',
    title: '区间之主',
    description: '掌控整片战场，区间修改与查询皆在指掌。',
    element: 'earth',
    rarity: 'legendary',
    type: 'mage',
    baseStats: { hp: 1250, attack: 185, defense: 100, speed: 95, critRate: 0.15, critDamage: 1.8 },
    passive: { id: 'p_segtree', name: '懒标记', description: '蓄力后下一次技能伤害翻倍', effect: { lazyMultiplier: 2 } },
    skills: [],
    avatarColor: '#d97706',
  },
  {
    id: 'kmp',
    name: 'KMP 匹配者',
    title: '模式的猎手',
    description: '利用前缀信息，从不做无用功，连招流畅。',
    element: 'thunder',
    rarity: 'epic',
    type: 'warrior',
    baseStats: { hp: 1020, attack: 178, defense: 72, speed: 118, critRate: 0.18, critDamage: 1.75 },
    passive: { id: 'p_kmp', name: 'next 数组', description: '连击不中断时能量回复速度翻倍', effect: { energyBoost: 2 } },
    skills: [],
    avatarColor: '#a78bfa',
  },
  {
    id: 'union_find',
    name: '并查集',
    title: '合纵连横',
    description: '路径压缩，快速合并，善于聚合与护盾。',
    element: 'earth',
    rarity: 'rare',
    type: 'tank',
    baseStats: { hp: 1350, attack: 130, defense: 115, speed: 85, critRate: 0.06, critDamage: 1.5 },
    passive: { id: 'p_dsu', name: '路径压缩', description: '受到伤害时 20% 概率减免一半', effect: { blockChance: 0.2, reduce: 0.5 } },
    skills: [],
    avatarColor: '#d97706',
  },
  {
    id: 'greedy',
    name: '贪心者',
    title: '当下最优',
    description: '只看眼前利益，爆发极高但缺乏续航。',
    element: 'fire',
    rarity: 'rare',
    type: 'assassin',
    baseStats: { hp: 820, attack: 205, defense: 45, speed: 140, critRate: 0.25, critDamage: 2.1 },
    passive: { id: 'p_greedy', name: '局部最优', description: '开局前 10 秒内攻击提升 30%', effect: { earlyBonus: 0.3, window: 10 } },
    skills: [],
    avatarColor: '#f97316',
  },
  {
    id: 'trie',
    name: '字典树',
    title: '前缀的森林',
    description: '层层分叉的字符之树，攻击带有分裂效果。',
    element: 'nature',
    rarity: 'epic',
    type: 'support',
    baseStats: { hp: 1080, attack: 155, defense: 78, speed: 108, critRate: 0.12, critDamage: 1.65 },
    passive: { id: 'p_trie', name: '公共前缀', description: '技能有 30% 概率分裂命中额外目标', effect: { splitChance: 0.3 } },
    skills: [],
    avatarColor: '#4ade80',
  },
  {
    id: 'fft',
    name: '快速傅里叶',
    title: '频域的舞者',
    description: '将时间化为频率，攻击带有波动与共振。',
    element: 'thunder',
    rarity: 'legendary',
    type: 'mage',
    baseStats: { hp: 1150, attack: 200, defense: 85, speed: 112, critRate: 0.2, critDamage: 1.95 },
    passive: { id: 'p_fft', name: '蝴蝶变换', description: '技能命中触发元素反应时伤害额外 +40%', effect: { reactionBonus: 0.4 } },
    skills: [],
    avatarColor: '#a78bfa',
  },
  {
    id: 'hash_table',
    name: '哈希表构造师',
    title: '均摊的索引',
    description: '把数据映射到桶中，用常数级查询制造连续标记。',
    element: 'thunder',
    rarity: 'epic',
    type: 'support',
    baseStats: { hp: 1040, attack: 172, defense: 72, speed: 116, critRate: 0.16, critDamage: 1.75 },
    passive: { id: 'p_hash', name: '冲突处理', description: '连续命中会在目标身上叠加标记，标记达到 3 层时爆发。', effect: { splitChance: 0.25 } },
    skills: [],
    avatarColor: '#22d3ee',
  },
  {
    id: 'topological_sort',
    name: '拓扑排序师',
    title: '依赖的裁决',
    description: '沿有向无环图逐点推进，先解决前置依赖，再释放全局压制。',
    element: 'wind',
    rarity: 'legendary',
    type: 'mage',
    baseStats: { hp: 1120, attack: 188, defense: 82, speed: 108, critRate: 0.18, critDamage: 1.85 },
    passive: { id: 'p_topo', name: '入度归零', description: '击败目标后，下一次技能冷却缩短。', effect: { resetOnKill: true } },
    skills: [],
    avatarColor: '#60a5fa',
  },
  {
    id: 'minimum_spanning_tree',
    name: '最小生成树',
    title: '连通的边界',
    description: '选择代价最小的边连接战场节点，拥有稳定的减伤和范围控制。',
    element: 'earth',
    rarity: 'legendary',
    type: 'tank',
    baseStats: { hp: 1480, attack: 168, defense: 132, speed: 82, critRate: 0.08, critDamage: 1.55 },
    passive: { id: 'p_mst', name: '最小代价', description: '每次受到攻击后获得短暂减伤，连续受击效果递增。', effect: { blockChance: 0.24, reduce: 0.45 } },
    skills: [],
    avatarColor: '#f59e0b',
  },
  {
    id: 'max_flow',
    name: '网络流调度员',
    title: '残量网络',
    description: '管理容量、增广路和瓶颈，把敌人的攻击流量反向导回去。',
    element: 'water',
    rarity: 'legendary',
    type: 'warrior',
    baseStats: { hp: 1360, attack: 196, defense: 108, speed: 98, critRate: 0.14, critDamage: 1.8 },
    passive: { id: 'p_flow', name: '瓶颈容量', description: '生命值越低，护盾和技能伤害越高。', effect: { atkPerHpLost: 0.045 } },
    skills: [],
    avatarColor: '#38bdf8',
  },
  {
    id: 'suffix_automaton',
    name: '后缀自动机',
    title: '终焉的构造',
    description: '传说级的字符串巨兽，掌握一切子串的秘密。',
    element: 'dark',
    rarity: 'legendary',
    type: 'warrior',
    baseStats: { hp: 1300, attack: 215, defense: 105, speed: 122, critRate: 0.22, critDamage: 2.0 },
    passive: { id: 'p_sam', name: '后缀链接', description: '每次击杀永久提升 2% 全属性（限本场）', effect: { permaStack: 0.02 } },
    skills: [],
    avatarColor: '#a855f7',
  },
];

// 注入技能
export const CHARACTERS: Character[] = RAW_CHARACTERS.map((c) => ({
  ...c,
  skills: c.skills.length ? c.skills : makeSkills(c.element, c.id),
}));

export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
);

export function getCharacter(id: string): Character | undefined {
  return CHARACTER_MAP[id];
}
