// /liste - Ma liste de lecture, with status tabs (US-05-08).

function MyList({ webtoons, onIncrement }) {
  const [tab, setTab] = React.useState('all');
  const tabs = [
    { key: 'all',       label: 'Tous',       filter: () => true },
    { key: 'reading',   label: 'En cours',   filter: w => w.status === 'reading' },
    { key: 'completed', label: 'Terminés',   filter: w => w.status === 'completed' },
    { key: 'paused',    label: 'En pause',   filter: w => w.status === 'paused' },
    { key: 'plan',      label: 'À lire',     filter: w => w.status === 'plan' },
    { key: 'dropped',   label: 'Abandonnés', filter: w => w.status === 'dropped' },
  ];
  const active = tabs.find(t => t.key === tab);
  const list = webtoons.filter(active.filter);

  return (
    <>
      <div className="page-head">
        <p className="page-eyebrow">V O T R E   F I L</p>
        <h1 className="page-title">Ma liste de lecture</h1>
        <span className="page-rule" />
        <p className="page-subtitle">Votre progression, vos statuts, vos notes. Le bouton +1 chapitre met à jour votre avancée en un clic.</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${t.key === tab ? 'on' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="count">{webtoons.filter(t.filter).length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Rien dans cette catégorie" body="Aucun webtoon avec ce statut pour le moment." />
      ) : (
        <div className="wt-grid">
          {list.map(w => <WebtoonCard key={w.id} w={w} onIncrement={onIncrement} />)}
        </div>
      )}
    </>
  );
}

Object.assign(window, { MyList });
