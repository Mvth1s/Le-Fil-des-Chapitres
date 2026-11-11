// /catalogue - grid + search + genre filter (US-04, US-09, US-10).

function Catalogue({ webtoons, onIncrement }) {
  const [q, setQ] = React.useState('');
  const [genre, setGenre] = React.useState('Tous');

  const allGenres = ['Tous', ...Array.from(new Set(webtoons.flatMap(w => w.genres)))];

  const filtered = webtoons.filter(w => {
    const matchesQ = !q || w.title.toLowerCase().includes(q.toLowerCase()) || w.author.toLowerCase().includes(q.toLowerCase());
    const matchesG = genre === 'Tous' || w.genres.includes(genre);
    return matchesQ && matchesG;
  });

  return (
    <>
      <div className="page-head">
        <p className="page-eyebrow">L A   B I B L I O T H È Q U E</p>
        <h1 className="page-title">Catalogue global</h1>
        <span className="page-rule" />
        <p className="page-subtitle">Tous les webtoons référencés, qu'ils soient dans votre liste ou non. Recherchez par titre ou auteur, filtrez par genre.</p>
      </div>

      <div className="filter-rail">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px', minWidth: 280 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lfdc-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Titre ou auteur…"
            style={{ border: 0, outline: 0, background: 'none', flex: 1, fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--lfdc-ink)' }}
          />
        </div>
        <div className="filter-divider" />
        {allGenres.map(g => (
          <button key={g} className={`filter-chip ${g === genre ? 'on' : ''}`} onClick={() => setGenre(g)}>
            {g}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Button icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>}>
          Ajouter un webtoon
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" body="Essayez un autre terme de recherche ou un autre filtre." />
      ) : (
        <div className="wt-grid">
          {filtered.map(w => <WebtoonCard key={w.id} w={w} onIncrement={onIncrement} />)}
        </div>
      )}
    </>
  );
}

Object.assign(window, { Catalogue });
