// /statistiques - US-11.

function Stats({ webtoons }) {
  const totalChapters = webtoons.reduce((s, w) => s + w.read, 0);
  const byStatus = ['reading', 'completed', 'paused', 'dropped', 'plan'].map(k => ({
    key: k, label: STATUS[k].fr, count: webtoons.filter(w => w.status === k).length
  }));
  const genreCount = {};
  webtoons.forEach(w => w.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxGenre = Math.max(...topGenres.map(([, c]) => c));
  const topRated = [...webtoons].filter(w => w.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 5);

  const colorFor = (k) => ({
    reading: 'var(--lfdc-sage)', completed: 'var(--lfdc-blue)',
    paused: 'var(--lfdc-beige)', dropped: 'var(--lfdc-rose)', plan: 'var(--lfdc-muted)',
  }[k]);

  return (
    <>
      <div className="page-head">
        <p className="page-eyebrow">V O S   H A B I T U D E S</p>
        <h1 className="page-title">Statistiques</h1>
        <span className="page-rule" />
        <p className="page-subtitle">Un résumé doux et lisible de votre activité de lecture.</p>
      </div>

      <section className="section">
        <div className="stat-row">
          <div className="stat"><span className="num">{webtoons.length}</span><span className="lbl">Titres suivis</span></div>
          <div className="stat"><span className="num">{totalChapters.toLocaleString('fr-FR')}</span><span className="lbl">Chapitres lus</span></div>
          <div className="stat"><span className="num">{byStatus.find(s => s.key === 'completed').count}</span><span className="lbl">Terminés</span></div>
          <div className="stat"><span className="num">{topGenres.length}</span><span className="lbl">Genres explorés</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Répartition par statut</h2></div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-card)', padding: '18px 24px' }}>
          {byStatus.map(s => (
            <div key={s.key} className="bar-row">
              <span className="lbl">{s.label}</span>
              <div className="track"><div style={{ width: `${(s.count / webtoons.length) * 100}%`, background: colorFor(s.key) }} /></div>
              <span className="num">{s.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Genres les plus lus</h2></div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-card)', padding: '18px 24px' }}>
          {topGenres.map(([g, c], i) => (
            <div key={g} className="bar-row">
              <span className="lbl">{g}</span>
              <div className="track"><div style={{ width: `${(c / maxGenre) * 100}%`, background: 'var(--lfdc-gold)' }} /></div>
              <span className="num">{c}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Vos mieux notés</h2></div>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-card)', padding: '8px 24px' }}>
          {topRated.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < topRated.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-script)', fontWeight: 700, fontSize: 22, color: 'var(--lfdc-gold-shade)', width: 28 }}>{i + 1}</span>
              <div style={{ width: 36, height: 48, borderRadius: 6, background: w.cover, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--lfdc-ink)', margin: 0 }}>{w.title}</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--lfdc-muted)', margin: 0 }}>{w.author}</p>
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'var(--lfdc-ink)' }}>{w.rating.toFixed(1)}</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--lfdc-muted)' }}>/ 10</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

Object.assign(window, { Stats });
