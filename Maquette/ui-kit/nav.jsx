// Top app bar. Sticky, cream, gold underline on active.

function Nav({ route, setRoute }) {
  const links = [
    { key: 'home',      label: 'Accueil' },
    { key: 'catalogue', label: 'Catalogue' },
    { key: 'list',      label: 'Ma liste' },
    { key: 'stats',     label: 'Statistiques' },
  ];
  return (
    <header className="nav">
      <div className="nav-brand" onClick={() => setRoute('home')}>
        <img src={(typeof window !== 'undefined' && window.__resources && window.__resources.logoSquare) || 'assets/logo-square.png'} alt="" />
        Le Fil des Chapitres
      </div>
      <nav className="nav-links">
        {links.map(l => (
          <button
            key={l.key}
            className={`nav-link ${route === l.key ? 'active' : ''}`}
            onClick={() => setRoute(l.key)}
          >
            {l.label}
          </button>
        ))}
      </nav>
      <div className="nav-right">
        <div className="nav-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input placeholder="Rechercher un titre…" />
        </div>
        <span className="nav-avatar">M</span>
      </div>
    </header>
  );
}

Object.assign(window, { Nav });
