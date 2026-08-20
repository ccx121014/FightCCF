import { useState } from 'react';
import { SHOP_PRODUCTS } from '@/data/shop';
import { useAuthStore } from '@/stores/authStore';
import { RARITIES } from '@shared/constants';
import type { ShopProduct } from '@shared/types';

export default function Shop() {
  const user = useAuthStore((s) => s.user);
  const spend = useAuthStore((s) => s.spendCurrency);
  const addCurrency = useAuthStore((s) => s.addCurrency);
  const [toast, setToast] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<Record<string, number>>({});

  function buy(product: ShopProduct) {
    const gold = Math.round(product.costGold * (1 - (product.discount ?? 0)));
    const diamond = Math.round(product.costDiamond * (1 - (product.discount ?? 0)));
    const honor = product.costHonor ?? 0;

    if (product.limitPerUser && (purchased[product.id] ?? 0) >= product.limitPerUser) {
      showToast('已达购买上限');
      return;
    }

    const ok = spend({ gold, diamond, honorPoints: honor });
    if (!ok) {
      showToast('资源不足');
      return;
    }

    // 应用物品效果（简化：货币直接到账）
    const effect = product.itemId;
    if (effect === 'gold_pouch') addCurrency({ gold: 300 });
    if (effect === 'diamond_pack_s') addCurrency({ diamond: 300 });

    setPurchased((p) => ({ ...p, [product.id]: (p[product.id] ?? 0) + 1 }));
    showToast(`成功购买 ${product.name}!`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="page">
      <h1 className="page-title">商店</h1>
      <p className="page-sub">使用金币、钻石与荣誉点数兑换资源</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {SHOP_PRODUCTS.map((product) => {
          const rarity = RARITIES[product.rarity];
          const bought = purchased[product.id] ?? 0;
          const soldOut = product.limitPerUser ? bought >= product.limitPerUser : false;

          let priceLabel = '';
          if (product.costDiamond > 0) priceLabel = `💎 ${Math.round(product.costDiamond * (1 - (product.discount ?? 0)))}`;
          else if (product.costGold > 0) priceLabel = `🪙 ${Math.round(product.costGold * (1 - (product.discount ?? 0)))}`;
          else if (product.costHonor) priceLabel = `🎖️ ${product.costHonor}`;

          return (
            <div key={product.id} className="card" style={{ padding: 14, textAlign: 'center', position: 'relative' }}>
              {product.discount && (
                <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 900, background: '#f43f5e', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>
                  -{Math.round(product.discount * 100)}%
                </span>
              )}
              <div
                style={{
                  width: 54,
                  height: 54,
                  margin: '0 auto 10px',
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, ${product.iconColor}, ${product.iconColor}66)`,
                  fontSize: 24,
                  boxShadow: `0 0 14px ${product.iconColor}66`,
                }}
              >
                {iconFor(product.type)}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{product.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', margin: '3px 0 8px', minHeight: 30 }}>{product.description}</div>
              <div style={{ fontSize: 10, color: rarity.color, fontWeight: 700, marginBottom: 8 }}>{rarity.name}</div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: 36, fontSize: 13 }}
                disabled={soldOut}
                onClick={() => buy(product)}
              >
                {soldOut ? '已售罄' : priceLabel}
              </button>
              {product.limitPerUser && (
                <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 4 }}>
                  限购 {bought}/{product.limitPerUser}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            padding: '10px 20px',
            borderRadius: 999,
            background: 'var(--bg-elev)',
            border: '1px solid var(--accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: 'var(--shadow)',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-mute)' }}>
        持有：🪙 {user?.currency.gold} · 💎 {user?.currency.diamond} · 🎖️ {user?.currency.honorPoints}
      </div>
    </div>
  );
}

function iconFor(type: string): string {
  switch (type) {
    case 'consumable': return '🧪';
    case 'currency_pack': return '💰';
    case 'character_shard': return '🧩';
    case 'boost': return '⚡';
    case 'skin': return '🎨';
    default: return '📦';
  }
}
