import type { HitEffectType, PoseStyle } from '../types';

// ============================================================
// 算法攻击档案：为每个算法角色定制专属的普攻与三个技能。
// 每个技能通过 behavior 决定执行逻辑，pose 决定火柴人动作，
// effect 决定命中特效形态，从而让「攻击方式」呼应算法本身。
// ============================================================

export type SkillBehavior =
  | 'melee' // 近战单体，可多段（hits）
  | 'dash' // 突进后近战重击
  | 'pierce' // 直线穿透，命中路径上所有敌人
  | 'projectile' // 飞行道具，延迟命中（delay）
  | 'aoe' // 以自身为中心的范围攻击
  | 'chain' // 连锁：依次命中最近的多个目标
  | 'split' // 分裂：同时命中多个目标（分叉）
  | 'buff'; // 自身增益（护盾 / 治疗）+ 可选范围伤害

export interface BasicDef {
  behavior: 'melee' | 'pierce' | 'projectile' | 'aoe';
  pose: PoseStyle;
  effect: HitEffectType;
  /** 普攻段数（melee 连击） */
  hits?: number;
  range?: number;
  /** 飞行道具延迟 */
  delay?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  behavior: SkillBehavior;
  pose: PoseStyle;
  effect: HitEffectType;
  energyCost: number;
  cooldown: number;
  damageMultiplier: number;
  range: number;
  aoe: boolean;
  /** melee / chain / split 命中段数或目标数 */
  hits?: number;
  /** projectile / 多段 的每段延迟（秒） */
  delay?: number;
  /** buff：自身治疗占最大生命比例 */
  selfHeal?: number;
  /** buff：护盾（暂以治疗近似表现） */
  shield?: number;
  /** execute：对低于该生命比例的目标 */
  execThreshold?: number;
  /** execute：额外伤害倍率加成 */
  execBonus?: number;
  /** escalate：己方每损失 10% 生命提升的额外倍率 */
  escalatePerHpLost?: number;
}

export interface AttackProfile {
  /** 默认姿态：用于普攻与静止/受击渲染 */
  pose: PoseStyle;
  basic: BasicDef;
  skills: [SkillDef, SkillDef, SkillDef];
}

export const ATTACK_PROFILES: Record<string, AttackProfile> = {
  // 冒泡排序：相邻交换、逐位上浮 —— 越打越快的多段直拳，气泡上浮
  bubble_sort: {
    pose: 'punch',
    basic: { behavior: 'melee', pose: 'punch', effect: 'bubble', hits: 2, range: 96 },
    skills: [
      {
        id: 'bubble_swap', name: '相邻交换', description: '快速左右开弓，对目标连续拍击三下',
        behavior: 'melee', pose: 'punch', effect: 'bubble',
        energyCost: 18, cooldown: 3, damageMultiplier: 0.75, range: 110, aoe: false, hits: 3, delay: 0.1,
      },
      {
        id: 'bubble_pass', name: '一趟冒泡', description: '横扫身前一整排敌人，将其逐个上浮击退',
        behavior: 'aoe', pose: 'slash', effect: 'bubble',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.3, range: 170, aoe: true,
      },
      {
        id: 'bubble_sorted', name: '完全有序', description: '连续多趟冒泡收敛，爆发五段递增气泡打击',
        behavior: 'melee', pose: 'punch', effect: 'burst',
        energyCost: 50, cooldown: 12, damageMultiplier: 0.85, range: 150, aoe: false, hits: 5, delay: 0.09,
      },
    ],
  },

  // 快速排序：选基准、左右开弓 —— 高爆发分割斩击
  quick_sort: {
    pose: 'slash',
    basic: { behavior: 'melee', pose: 'slash', effect: 'slash', hits: 1, range: 104 },
    skills: [
      {
        id: 'quick_pivot', name: '基准分割', description: '瞬步到目标身侧，一刀将其「分区」重创',
        behavior: 'dash', pose: 'slash', effect: 'slash',
        energyCost: 20, cooldown: 3, damageMultiplier: 2.0, range: 150, aoe: false,
      },
      {
        id: 'quick_partition', name: '左右开弓', description: '向左右两侧各斩一刀，分割周围敌人',
        behavior: 'split', pose: 'slash', effect: 'slash',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.4, range: 175, aoe: true, hits: 3,
      },
      {
        id: 'quick_recurse', name: '递归斩', description: '对残血目标追加处决斩，血量越低伤害越高',
        behavior: 'dash', pose: 'slash', effect: 'pierce',
        energyCost: 50, cooldown: 11, damageMultiplier: 2.6, range: 200, aoe: false,
        execThreshold: 0.5, execBonus: 0.6,
      },
    ],
  },

  // 二分查找：折半锁定中点 —— 远程精准射击，暴击流
  binary_search: {
    pose: 'shoot',
    basic: { behavior: 'projectile', pose: 'shoot', effect: 'arrow', range: 380, delay: 0.14 },
    skills: [
      {
        id: 'binary_mid', name: '锁定中点', description: '瞄准区间中点射出必中一箭，极高暴击',
        behavior: 'projectile', pose: 'shoot', effect: 'arrow',
        energyCost: 18, cooldown: 3, damageMultiplier: 2.1, range: 420, aoe: false, delay: 0.12,
      },
      {
        id: 'binary_halve', name: '折半射击', description: '连射三箭，每箭锁定更近的一半区间',
        behavior: 'projectile', pose: 'shoot', effect: 'arrow',
        energyCost: 33, cooldown: 6, damageMultiplier: 1.0, range: 420, aoe: false, hits: 3, delay: 0.13,
      },
      {
        id: 'binary_converge', name: '收敛一击', description: '蓄力锁定后释放贯穿箭，命中即暴击',
        behavior: 'pierce', pose: 'shoot', effect: 'pierce',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.0, range: 500, aoe: true,
      },
    ],
  },

  // 迪杰斯特拉：贪心扩展最近节点、松弛操作 —— 连锁 + 命中回血
  dijkstra: {
    pose: 'cast',
    basic: { behavior: 'projectile', pose: 'cast', effect: 'chain', range: 320, delay: 0.12 },
    skills: [
      {
        id: 'dij_relax', name: '松弛操作', description: '射出光矢命中最近节点，并为自身恢复生命',
        behavior: 'projectile', pose: 'cast', effect: 'chain',
        energyCost: 18, cooldown: 3, damageMultiplier: 1.6, range: 340, aoe: false, delay: 0.1, selfHeal: 0.06,
      },
      {
        id: 'dij_shortest', name: '最短路径', description: '光路在敌人之间连锁跳跃，依次点亮三个节点',
        behavior: 'chain', pose: 'cast', effect: 'chain',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.2, range: 260, aoe: true, hits: 3, delay: 0.12,
      },
      {
        id: 'dij_tree', name: '最短路径树', description: '向全场所有节点扩展光路，并大幅治疗自身',
        behavior: 'aoe', pose: 'cast', effect: 'ring',
        energyCost: 50, cooldown: 12, damageMultiplier: 2.4, range: 300, aoe: true, selfHeal: 0.12,
      },
    ],
  },

  // DFS 深度优先：一往无前、走到黑 —— 长距离直线穿刺
  dfs: {
    pose: 'thrust',
    basic: { behavior: 'pierce', pose: 'thrust', effect: 'pierce', range: 180 },
    skills: [
      {
        id: 'dfs_dive', name: '深潜突刺', description: '沿一条路径长距离突刺，贯穿路上所有敌人',
        behavior: 'pierce', pose: 'thrust', effect: 'pierce',
        energyCost: 20, cooldown: 3, damageMultiplier: 1.9, range: 300, aoe: true,
      },
      {
        id: 'dfs_backtrack', name: '回溯连刺', description: '前突再回撤，往返两次贯穿刺击',
        behavior: 'pierce', pose: 'thrust', effect: 'pierce',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.5, range: 320, aoe: true, hits: 2, delay: 0.22,
      },
      {
        id: 'dfs_deepest', name: '一往无前', description: '向最深处发动毁灭性贯穿，路径越长伤害越高',
        behavior: 'pierce', pose: 'thrust', effect: 'pierce',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.4, range: 460, aoe: true,
      },
    ],
  },

  // BFS 广度优先：逐层向外扩散 —— 层层扩散的范围压制
  bfs: {
    pose: 'cast',
    basic: { behavior: 'aoe', pose: 'cast', effect: 'grid', range: 120 },
    skills: [
      {
        id: 'bfs_layer', name: '第一层扩散', description: '向四周推进一圈方格波，压制近身敌人',
        behavior: 'aoe', pose: 'cast', effect: 'grid',
        energyCost: 18, cooldown: 3, damageMultiplier: 1.5, range: 150, aoe: true,
      },
      {
        id: 'bfs_queue', name: '队列推进', description: '连续释放三层逐渐扩大的方格冲击波',
        behavior: 'aoe', pose: 'cast', effect: 'grid',
        energyCost: 34, cooldown: 6, damageMultiplier: 0.9, range: 200, aoe: true, hits: 3, delay: 0.18,
      },
      {
        id: 'bfs_flood', name: '洪泛填充', description: '以自身为源点向全场层层泛洪，无人幸免',
        behavior: 'aoe', pose: 'cast', effect: 'grid',
        energyCost: 50, cooldown: 12, damageMultiplier: 2.8, range: 320, aoe: true,
      },
    ],
  },

  // 动态规划：记忆化、最优子结构 —— 越战越强的蓄力下砸
  dynamic_programming: {
    pose: 'stomp',
    basic: { behavior: 'melee', pose: 'stomp', effect: 'hit', hits: 1, range: 100 },
    skills: [
      {
        id: 'dp_transfer', name: '状态转移', description: '重锤下砸，己方生命越低伤害越高',
        behavior: 'dash', pose: 'stomp', effect: 'burst',
        energyCost: 20, cooldown: 3, damageMultiplier: 1.7, range: 130, aoe: false, escalatePerHpLost: 0.08,
      },
      {
        id: 'dp_interval', name: '区间合并', description: '砸出震荡波，波及周围并按血量加成',
        behavior: 'aoe', pose: 'stomp', effect: 'ring',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.5, range: 175, aoe: true, escalatePerHpLost: 0.06,
      },
      {
        id: 'dp_optimal', name: '最优解', description: '汇聚全部记忆化状态，释放无解的终极重砸',
        behavior: 'aoe', pose: 'stomp', effect: 'burst',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.0, range: 240, aoe: true, escalatePerHpLost: 0.1,
      },
    ],
  },

  // 线段树：区间修改与查询 —— 划定区间方块进行区域打击
  segment_tree: {
    pose: 'cast',
    basic: { behavior: 'projectile', pose: 'cast', effect: 'segment', range: 300, delay: 0.12 },
    skills: [
      {
        id: 'seg_query', name: '区间查询', description: '标定一段区间，对其中敌人同时结算伤害',
        behavior: 'aoe', pose: 'cast', effect: 'segment',
        energyCost: 20, cooldown: 3, damageMultiplier: 1.6, range: 180, aoe: true,
      },
      {
        id: 'seg_update', name: '区间修改', description: '在前方铺开一列方块阵，连续压制',
        behavior: 'aoe', pose: 'cast', effect: 'segment',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.2, range: 220, aoe: true, hits: 2, delay: 0.2,
      },
      {
        id: 'seg_lazy', name: '懒标记爆发', description: '积攒的懒标记一次性下推，全区间翻倍轰击',
        behavior: 'aoe', pose: 'cast', effect: 'segment',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.2, range: 300, aoe: true,
      },
    ],
  },

  // KMP：利用前缀信息、从不回退 —— 流畅不中断的多段连击
  kmp: {
    pose: 'punch',
    basic: { behavior: 'melee', pose: 'punch', effect: 'hit', hits: 2, range: 98 },
    skills: [
      {
        id: 'kmp_match', name: '模式匹配', description: '一段流畅的三连击，招式之间从不回退',
        behavior: 'melee', pose: 'punch', effect: 'slash',
        energyCost: 18, cooldown: 3, damageMultiplier: 0.85, range: 120, aoe: false, hits: 3, delay: 0.1,
      },
      {
        id: 'kmp_next', name: 'next 跳转', description: '瞬步换位继续连击，命中不中断则势如破竹',
        behavior: 'dash', pose: 'slash', effect: 'slash',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.5, range: 160, aoe: false, hits: 2, delay: 0.14,
      },
      {
        id: 'kmp_fullmatch', name: '完全匹配', description: '锁定目标释放六段极速连打，一气呵成',
        behavior: 'melee', pose: 'punch', effect: 'burst',
        energyCost: 50, cooldown: 12, damageMultiplier: 0.7, range: 150, aoe: false, hits: 6, delay: 0.08,
      },
    ],
  },

  // 并查集：路径压缩、合并 —— 聚合与护盾型坦克
  union_find: {
    pose: 'guard',
    basic: { behavior: 'melee', pose: 'guard', effect: 'chain', hits: 1, range: 96 },
    skills: [
      {
        id: 'uf_union', name: '合并', description: '拉拽近处敌人并撞击，同时为自身获得护盾',
        behavior: 'buff', pose: 'guard', effect: 'chain',
        energyCost: 18, cooldown: 3, damageMultiplier: 1.4, range: 150, aoe: true, shield: 0.08,
      },
      {
        id: 'uf_compress', name: '路径压缩', description: '将连锁的敌人猛地压缩到一处并造成范围伤害',
        behavior: 'chain', pose: 'guard', effect: 'chain',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.5, range: 240, aoe: true, hits: 3, delay: 0.1,
      },
      {
        id: 'uf_forest', name: '并查森林', description: '聚合全场为一棵树后重击，并获得厚重护盾',
        behavior: 'buff', pose: 'guard', effect: 'ring',
        energyCost: 50, cooldown: 12, damageMultiplier: 2.4, range: 300, aoe: true, shield: 0.2,
      },
    ],
  },

  // 贪心：只看眼前最优、爆发极高 —— 高爆发处决下砸
  greedy: {
    pose: 'stomp',
    basic: { behavior: 'melee', pose: 'stomp', effect: 'hit', hits: 1, range: 102 },
    skills: [
      {
        id: 'greedy_local', name: '局部最优', description: '扑向最近的肥肉，一记贪婪重击',
        behavior: 'dash', pose: 'stomp', effect: 'slash',
        energyCost: 18, cooldown: 3, damageMultiplier: 2.2, range: 150, aoe: false,
      },
      {
        id: 'greedy_grab', name: '雨露均沾', description: '横扫身前抢夺，对一排敌人高额打击',
        behavior: 'aoe', pose: 'slash', effect: 'burst',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.6, range: 170, aoe: true,
      },
      {
        id: 'greedy_all', name: '一步登天', description: '孤注一掷的处决重砸，对残血目标额外斩杀',
        behavior: 'dash', pose: 'stomp', effect: 'burst',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.4, range: 200, aoe: false,
        execThreshold: 0.4, execBonus: 0.8,
      },
    ],
  },

  // 字典树：层层分叉的前缀森林 —— 分裂命中多目标
  trie: {
    pose: 'cast',
    basic: { behavior: 'projectile', pose: 'cast', effect: 'split', range: 320, delay: 0.12 },
    skills: [
      {
        id: 'trie_prefix', name: '公共前缀', description: '射出会分叉的字符射线，同时命中两名敌人',
        behavior: 'split', pose: 'cast', effect: 'split',
        energyCost: 18, cooldown: 3, damageMultiplier: 1.4, range: 300, aoe: true, hits: 2,
      },
      {
        id: 'trie_branch', name: '分叉生长', description: '前缀树疯狂分叉，同时命中三名敌人',
        behavior: 'split', pose: 'cast', effect: 'split',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.3, range: 320, aoe: true, hits: 3,
      },
      {
        id: 'trie_forest', name: '前缀森林', description: '召唤字符之林向所有敌人分裂射击',
        behavior: 'split', pose: 'cast', effect: 'split',
        energyCost: 50, cooldown: 12, damageMultiplier: 1.8, range: 360, aoe: true, hits: 5,
      },
    ],
  },

  // FFT 快速傅里叶：时域化频域、波动共振 —— 正弦波攻击
  fft: {
    pose: 'cast',
    basic: { behavior: 'projectile', pose: 'cast', effect: 'wave', range: 340, delay: 0.13 },
    skills: [
      {
        id: 'fft_transform', name: '蝴蝶变换', description: '发射一道正弦波束，穿透并共振路径上的敌人',
        behavior: 'pierce', pose: 'cast', effect: 'wave',
        energyCost: 20, cooldown: 3, damageMultiplier: 1.7, range: 380, aoe: true,
      },
      {
        id: 'fft_resonance', name: '频域共振', description: '在周围激起层层波纹，引发共振范围伤害',
        behavior: 'aoe', pose: 'cast', effect: 'wave',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.5, range: 200, aoe: true, hits: 2, delay: 0.16,
      },
      {
        id: 'fft_convolution', name: '卷积爆发', description: '两段信号卷积叠加，释放毁灭性的共振冲击',
        behavior: 'aoe', pose: 'cast', effect: 'wave',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.1, range: 300, aoe: true,
      },
    ],
  },

  // 后缀自动机：掌握一切子串的字符串巨兽 —— 越杀越强的连斩
  suffix_automaton: {
    pose: 'slash',
    basic: { behavior: 'melee', pose: 'slash', effect: 'slash', hits: 1, range: 110 },
    skills: [
      {
        id: 'sam_transition', name: '转移边斩', description: '沿转移边瞬步斩击，快速切入目标',
        behavior: 'dash', pose: 'slash', effect: 'slash',
        energyCost: 20, cooldown: 3, damageMultiplier: 2.0, range: 160, aoe: false,
      },
      {
        id: 'sam_suffixlink', name: '后缀链接', description: '沿后缀链在敌群间连斩，依次撕裂多个目标',
        behavior: 'chain', pose: 'slash', effect: 'pierce',
        energyCost: 34, cooldown: 6, damageMultiplier: 1.4, range: 260, aoe: true, hits: 4, delay: 0.09,
      },
      {
        id: 'sam_substring', name: '万子串终结', description: '构造出所有子串的终焉一击，全场毁灭斩',
        behavior: 'aoe', pose: 'slash', effect: 'burst',
        energyCost: 50, cooldown: 12, damageMultiplier: 3.3, range: 300, aoe: true,
      },
    ],
  },
};

// —— 默认档案（找不到角色时兜底：三段直拳流）——
export const DEFAULT_PROFILE: AttackProfile = {
  pose: 'punch',
  basic: { behavior: 'melee', pose: 'punch', effect: 'hit', hits: 1, range: 92 },
  skills: [
    {
      id: 'ds1', name: '强力打击', description: '突进并造成一次高伤害重击',
      behavior: 'dash', pose: 'punch', effect: 'slash',
      energyCost: 20, cooldown: 3, damageMultiplier: 1.8, range: 130, aoe: false,
    },
    {
      id: 'ds2', name: '旋风打击', description: '攻击周围所有敌人',
      behavior: 'aoe', pose: 'slash', effect: 'ring',
      energyCost: 35, cooldown: 6, damageMultiplier: 1.4, range: 165, aoe: true,
    },
    {
      id: 'ds3', name: '终极打击', description: '释放毁灭性的元素爆发',
      behavior: 'aoe', pose: 'cast', effect: 'burst',
      energyCost: 50, cooldown: 12, damageMultiplier: 3.2, range: 220, aoe: true,
    },
  ],
};

export function getProfile(characterId: string | undefined): AttackProfile {
  if (characterId && ATTACK_PROFILES[characterId]) return ATTACK_PROFILES[characterId];
  return DEFAULT_PROFILE;
}
