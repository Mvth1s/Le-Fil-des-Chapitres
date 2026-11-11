// The signature card. Cover, title, author, status chip, gold progress bar, +1 chapitre.

function WebtoonCard({ w, onIncrement, onClick }) {
  const pct = w.total ? Math.min(100, Math.round((w.read / w.total) * 100)) : 0;
  return (
    <div className="wt" onClick={onClick}>
      <div style={{ position: 'relative' }}>
        <Cover gradient={w.cover} />
        <div className="chip-wrap" style={{ position: 'absolute', top: 10, left: 10 }}>
          <StatusChip status={w.status} />
        </div>
      </div>
      <div className="wt-body">
        <h3 className="wt-title">{w.title}</h3>
        <p className="wt-author">{w.author}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {w.genres.slice(0, 2).map(g => <Tag key={g} genre={g}>{g}</Tag>)}
        </div>
        <div className="wt-progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="wt-foot">
          <span className="wt-ch">Ch. {w.read} / {w.total}</span>
          {w.status === 'reading' && (
            <button
              className="wt-plus"
              onClick={(e) => { e.stopPropagation(); onIncrement && onIncrement(w.id); }}
            >
              +1 chapitre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WebtoonCard });
