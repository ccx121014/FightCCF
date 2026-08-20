import { useNavigate, useParams } from 'react-router-dom';
import { CHAPTERS, getLevelsByChapter } from '@/data/levels';
import { useLevelStore } from '@/stores/levelStore';
import { LevelCard } from '@/components/LevelCard';
import { ELEMENTS } from '@shared/constants';

export default function Levels() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const levelStore = useLevelStore();

  // 未指定章节 → 章节选择
  if (!chapterId) {
    return <ChapterSelect />;
  }

  const chapter = CHAPTERS.find((c) => c.id === Number(chapterId));
  if (!chapter) {
    navigate('/levels');
    return null;
  }

  const levels = getLevelsByChapter(chapter.id);
  const elem = ELEMENTS[chapter.element];

  return (
    <div className="page">
      <button onClick={() => navigate('/levels')} style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 12, fontWeight: 700 }}>
        ‹ 返回章节
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 className="page-title" style={{ color: elem.color }}>{chapter.name}</h1>
        <span className="chip" style={{ color: elem.color }}>{chapter.subtitle}</span>
      </div>
      <p className="page-sub">{chapter.description}</p>

      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        {levels.map((level) => {
          const prog = levelStore.getProgress(level.id);
          return (
            <LevelCard
              key={level.id}
              level={level}
              stars={prog?.stars ?? 0}
              bestRating={prog?.bestRating}
              unlocked={levelStore.isUnlocked(level.id)}
              onClick={() => navigate(`/battle/${level.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ChapterSelect() {
  const navigate = useNavigate();
  const levelStore = useLevelStore();

  return (
    <div className="page">
      <h1 className="page-title">闯关冒险</h1>
      <p className="page-sub">沿着算法竞赛的进阶之路，逐章击败强敌</p>

      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        {CHAPTERS.map((chapter, idx) => {
          const elem = ELEMENTS[chapter.element];
          const stars = levelStore.getChapterStars(chapter.id);
          const maxStars = chapter.levelCount * 3;
          // 章节解锁：第一章或上一章 BOSS 通关
          const firstLevel = getLevelsByChapter(chapter.id)[0];
          const unlocked = levelStore.isUnlocked(firstLevel.id);

          return (
            <button
              key={chapter.id}
              onClick={() => unlocked && navigate(`/levels/${chapter.id}`)}
              disabled={!unlocked}
              className="card anim-in"
              style={{
                padding: 18,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: unlocked ? 1 : 0.55,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                borderLeft: `4px solid ${elem.color}`,
                animationDelay: `${idx * 0.05}s`,
                background: `linear-gradient(120deg, ${elem.color}18, transparent 60%), linear-gradient(180deg, var(--bg-2), var(--bg-1))`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, ${elem.color}, ${elem.color}66)`,
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#0b0f1a',
                  flexShrink: 0,
                  boxShadow: `0 0 16px ${elem.glow}`,
                }}
              >
                {unlocked ? chapter.id : '🔒'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 18, color: elem.color }}>{chapter.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{chapter.subtitle}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3, lineHeight: 1.4 }}>
                  {chapter.description}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6, fontWeight: 700 }}>
                  ⭐ {stars} / {maxStars}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
