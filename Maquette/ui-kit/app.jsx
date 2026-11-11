// Root: holds the route + sample data state, dispatches +1 chapitre.

function App() {
  const [route, setRoute] = React.useState('home');
  const [webtoons, setWebtoons] = React.useState(WEBTOONS);

  const onIncrement = (id) => {
    setWebtoons(list => list.map(w => {
      if (w.id !== id) return w;
      const next = Math.min(w.total, w.read + 1);
      const status = next >= w.total ? 'completed' : w.status;
      return { ...w, read: next, status };
    }));
  };

  return (
    <div className="app">
      <Nav route={route} setRoute={setRoute} />
      <main data-screen-label={`screen-${route}`}>
        {route === 'home'      && <Home      webtoons={webtoons} onIncrement={onIncrement} setRoute={setRoute} />}
        {route === 'catalogue' && <Catalogue webtoons={webtoons} onIncrement={onIncrement} />}
        {route === 'list'      && <MyList    webtoons={webtoons} onIncrement={onIncrement} />}
        {route === 'stats'     && <Stats     webtoons={webtoons} />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
