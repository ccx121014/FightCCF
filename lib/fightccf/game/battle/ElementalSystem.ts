import {
  getElementMultiplier,
  findReaction,
  type ElementType,
  type ReactionConfig,
} from '@shared/constants';

export interface ElementalResult {
  multiplier: number;
  reaction: ReactionConfig | null;
}

// 客户端简化版元素系统：克制加成 + 元素反应
export class ElementalSystem {
  /**
   * 计算攻击方元素对防守方元素的综合倍率。
   * 若防守方身上附着了不同的元素，可能触发反应。
   */
  resolve(
    attackerElement: ElementType,
    defenderElement: ElementType,
    appliedElement?: ElementType
  ): ElementalResult {
    const advantage = getElementMultiplier(attackerElement, defenderElement);

    let reaction: ReactionConfig | null = null;
    let reactionMult = 1;
    if (appliedElement && appliedElement !== attackerElement) {
      reaction = findReaction(attackerElement, appliedElement);
      if (reaction) reactionMult = reaction.multiplier;
    }

    return {
      multiplier: advantage * reactionMult,
      reaction,
    };
  }
}
