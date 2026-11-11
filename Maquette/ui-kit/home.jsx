// Home / dashboard - hero + currently-reading + quick stats.

function Home({ webtoons, onIncrement, setRoute }) {
  const reading = webtoons.filter(w => w.status === 'reading');
  const totalChapters = webtoons.reduce((s, w) => s + w.read, 0);
  const finished = webtoons.filter(w => w.status === 'completed').length;

  return (
    <>
      <div className="hero">
        <div>
          <p className="page-eyebrow">W E B T O O N   T R A C K E R</p>
          <h2>Bonsoir,<br/>vous avez 4 webtoons en cours.</h2>
          <p>Vous avez lu <strong style={{ color: 'var(--lfdc-ink)' }}>{totalChapters.toLocaleString('fr-FR')} chapitres</strong> au fil de <strong style={{ color: 'var(--lfdc-ink)' }}>{webtoons.length} titres</strong>. Reprenez là où vous en êtes, ou parcourez le catalogue pour découvrir un nouveau récit.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <Button onClick={() => setRoute('list')}>Reprendre la lecture</Button>
            <Button kind="secondary" onClick={() => setRoute('catalogue')}>Parcourir le catalogue</Button>
          </div>
        </div>
        <div className="stack">
          <img src={(typeof window !== 'undefined' && window.__resources && window.__resources.logoSquare) || 'assets/logo-square.png'} alt="" />
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">En cours</h2>
          <span className="section-link" onClick={() => setRoute('list')}>Voir ma liste →</span>
        </div>
        <div className="wt-grid">
          {reading.map(w => <WebtoonCard key={w.id} w={w} onIncrement={onIncrement} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Aperçu</h2>
        </div>
        <div className="stat-row">
          <div className="stat"><span className="num">{webtoons.length}</span><span className="lbl">Webtoons suivis</span></div>
          <div className="stat"><span className="num">{reading.length}</span><span className="lbl">En cours</span></div>
          <div className="stat"><span className="num">{finished}</span><span className="lbl">Terminés</span></div>
          <div className="stat"><span className="num">{totalChapters.toLocaleString('fr-FR')}</span><span className="lbl">Chapitres lus</span></div>
        </div>
      </section>
    </>
  );
}

Object.assign(window, { Home });
