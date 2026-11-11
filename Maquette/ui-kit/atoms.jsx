// Atoms: Button, Tag, StatusChip, EmptyState, Cover

function Button({ kind = 'primary', size, children, onClick, icon }) {
  const cls = ['btn', kind === 'primary' ? 'btn-primary' : kind === 'secondary' ? 'btn-secondary' : 'btn-ghost', size === 'sm' ? 'btn-sm' : ''].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

function Tag({ children, genre }) {
  if (genre && GENRE_COLORS[genre]) {
    const c = GENRE_COLORS[genre];
    return <span className="tag-tinted" style={{ background: c.bg, color: c.fg }}>{children}</span>;
  }
  return <span className="tag">{children}</span>;
}

function StatusChip({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={`status-chip ${s.cls}`}>
      <span className="dot" />
      {s.fr}
    </span>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div className="empty">
      <img src={(typeof window !== 'undefined' && window.__resources && window.__resources.logoSquare) || 'assets/logo-square.png'} alt="" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

// Decorative cover - pastel gradient + tiny book stack so the absent imagery still feels brand-consistent.
function Cover({ gradient }) {
  return (
    <div className="wt-cover" style={{ background: gradient }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', placeItems: 'center',
        opacity: 0.55,
      }}>
        <div className="cover-fallback">
          <div className="mini">
            <span style={{ background: 'rgba(255,255,255,0.85)', width: 50 }} />
            <span style={{ background: 'rgba(255,255,255,0.75)', width: 64 }} />
            <span style={{ background: 'rgba(255,255,255,0.65)', width: 56 }} />
            <span style={{ background: 'rgba(255,255,255,0.55)', width: 70 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Button, Tag, StatusChip, EmptyState, Cover });
