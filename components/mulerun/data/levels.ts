import type { Level, Chapter, Difficulty } from '@shared/types';
import type { ElementType } from '@shared/constants';

export const CHAPTERS: Chapter[] = [
  { id: 1, name: 'CSP-J', subtitle: '入门组', description: '算法之路的起点：排序、模拟与基础枚举。', element: 'water', levelCount: 6 },
  { id: 2, name: 'CSP-S', subtitle: '提高组', description: '进阶数据结构：栈、队列、二分与贪心。', element: 'wind', levelCount: 6 },
  { id: 3, name: 'NOIP', subtitle: '联赛难度', description: '动态规划、图论遍历与分治思想。', element: 'nature', levelCount: 6 },
  { id: 4, name: '省选', subtitle: '省队选拔', description: '高级数据结构：线段树、并查集、字符串。', element: 'earth', levelCount: 6 },
  { id: 5, name: 'NOI', subtitle: '国赛巅峰', description: '网络流、FFT、高级图论与数学。', element: 'thunder', levelCount: 6 },
  { id: 6, name: '传说级', subtitle: '算法之神', description: '后缀自动机、可持久化与各类黑科技的终极试炼。', element: 'dark', levelCount: 5 },
];

// 每章节的敌人池（角色 id）
const CHAPTER_ENEMIES: Record<number, string[]> = {
  1: ['bubble_sort', 'binary_search', 'quick_sort'],
  2: ['quick_sort', 'greedy', 'union_find'],
  3: ['dfs', 'bfs', 'dynamic_programming'],
  4: ['segment_tree', 'union_find', 'trie'],
  5: ['fft', 'kmp', 'dijkstra'],
  6: ['suffix_automaton', 'fft', 'dynamic_programming'],
};

const CHAPTER_ELEMENT: Record<number, ElementType> = {
  1: 'water', 2: 'wind', 3: 'nature', 4: 'earth', 5: 'thunder', 6: 'dark',
};

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'expert', 'legendary'];

const LEVEL_NAMES: Record<number, string[]> = {
  1: ['数组的初啼', '相邻的交换', '折半的抉择', '基准的分割', '枚举的迷宫', 'BOSS · 排序之王'],
  2: ['单调的栈', '循环的队列', '贪心的诱惑', '二分答案', '前缀和之海', 'BOSS · 提高之门'],
  3: ['背包问题', '最长上升', '深入迷雾', '层层水波', '分治之刃', 'BOSS · 联赛霸主'],
  4: ['区间统领', '合并王国', '前缀森林', '树上漫步', '莫队离线', 'BOSS · 省选之巅'],
  5: ['网络之流', '频域共振', '模式匹配', '最短征途', '数论秘境', 'BOSS · 国赛之神'],
  6: ['自动机觉醒', '可持久之树', '后缀的低语', '时间的回廊', 'BOSS · 算法终焉'],
};

// 各关时间限制（秒）：随关卡推进而收紧或放宽，BOSS 给足时间。
const TIME_LIMIT_CHOICES = [60, 90, 120, 150] as const;
function timeLimitFor(chapterId: number, levelNumber: number, isBoss: boolean, enemyCount: number): number {
  if (isBoss) return 150; // 首领战：容量最大
  // 敌人越多 / 章节越靠后，给的时间越充裕
  const base = enemyCount >= 3 ? 2 : enemyCount === 2 ? 1 : 0;
  const chapterBump = chapterId >= 4 ? 1 : 0;
  const idx = Math.min(TIME_LIMIT_CHOICES.length - 1, base + chapterBump + (levelNumber % 2));
  return TIME_LIMIT_CHOICES[idx];
}

function buildLevels(): Level[] {
  const levels: Level[] = [];
  for (const chapter of CHAPTERS) {
    const enemies = CHAPTER_ENEMIES[chapter.id];
    const element = CHAPTER_ELEMENT[chapter.id];
    const names = LEVEL_NAMES[chapter.id];
    for (let i = 1; i <= chapter.levelCount; i++) {
      const isBoss = i === chapter.levelCount;
      const baseLevel = (chapter.id - 1) * 6 + i;
      const enemyLevel = 3 + baseLevel * 2;
      const power = 400 + baseLevel * 220;
      const diff: Difficulty = isBoss
        ? DIFFICULTIES[Math.min(chapter.id - 1, 4)]
        : DIFFICULTIES[Math.min(Math.floor((chapter.id - 1) * 0.9), 4)];
      // 普通关卡随进度增加敌人数量（1~3）
      const enemyCount = isBoss ? 1 : Math.min(3, 1 + Math.floor((i - 1) / 2));
      const timeLimit = timeLimitFor(chapter.id, i, isBoss, enemyCount);
      // 星级时间阈值由时间限制推导：S=快速通关，A=从容，B=险胜
      const starTimes: [number, number, number] = [
        Math.round(timeLimit * 0.4),
        Math.round(timeLimit * 0.65),
        Math.round(timeLimit * 0.9),
      ];
      levels.push({
        id: `ch${chapter.id}_lv${i}`,
        chapter: chapter.id,
        levelNumber: i,
        name: names[i - 1],
        description: isBoss ? '章节首领，击败它以解锁下一章。' : `${chapter.name} 关卡 ${i}`,
        difficulty: diff,
        element,
        recommendedPower: power,
        enemies: [
          {
            characterId: enemies[(i - 1) % enemies.length],
            level: enemyLevel,
            count: enemyCount,
            hpMultiplier: isBoss ? 2.5 : 1 + i * 0.08,
            attackMultiplier: isBoss ? 1.6 : 1 + i * 0.05,
          },
        ],
        rewards: {
          gold: 100 + baseLevel * 40 + (isBoss ? 500 : 0),
          exp: 60 + baseLevel * 30 + (isBoss ? 300 : 0),
          firstClearBonus: isBoss
            ? { diamond: 60, characters: [enemies[0]] }
            : { diamond: 10 },
          items: isBoss
            ? [{ itemId: 'exp_potion', quantity: 2, chance: 1 }]
            : [{ itemId: 'gold_pouch', quantity: 1, chance: 0.5 }],
        },
        timeLimit,
        starTimes,
      });
    }
  }
  return levels;
}

export const LEVELS: Level[] = buildLevels();

export const LEVEL_MAP: Record<string, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l])
);

export function getLevelsByChapter(chapterId: number): Level[] {
  return LEVELS.filter((l) => l.chapter === chapterId);
}

export function getLevel(id: string): Level | undefined {
  return LEVEL_MAP[id];
}
