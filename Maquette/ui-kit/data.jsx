// Sample data - French webtoons. Used by every screen.
// Status enum matches the spec: reading / completed / on_hold / dropped / plan_to_read

const STATUS = {
  reading:     { fr: 'En cours',   key: 'reading',   cls: 'status-reading' },
  completed:   { fr: 'Terminé',    key: 'completed', cls: 'status-completed' },
  paused:      { fr: 'En pause',   key: 'paused',    cls: 'status-paused' },
  dropped:     { fr: 'Abandonné',  key: 'dropped',   cls: 'status-dropped' },
  plan:        { fr: 'À lire',     key: 'plan',      cls: 'status-plan' },
};

// Each cover is a CSS gradient using the four book hues - no fake imagery.
const G = {
  sage:  'linear-gradient(155deg, #B6C399 0%, #8B9B6A 60%, #6F7F4F 100%)',
  blue:  'linear-gradient(160deg, #C5D6E2 0%, #8FAEC5 55%, #6E8FAA 100%)',
  rose:  'linear-gradient(165deg, #E5C7CE 0%, #C89BA5 55%, #A77B86 100%)',
  beige: 'linear-gradient(150deg, #ECDFC0 0%, #D4C4A0 55%, #B6A37D 100%)',
  sageRose: 'linear-gradient(160deg, #B6C399 0%, #C89BA5 100%)',
  blueRose: 'linear-gradient(160deg, #8FAEC5 0%, #C89BA5 100%)',
  beigeBlue: 'linear-gradient(160deg, #D4C4A0 0%, #8FAEC5 100%)',
  beigeSage: 'linear-gradient(160deg, #D4C4A0 0%, #8B9B6A 100%)',
  goldNight: 'linear-gradient(165deg, #3D3B2F 0%, #5F543E 60%, #C9A96E 100%)',
};

const WEBTOONS = [
  { id: 1,  title: 'Solo Leveling',          author: 'Chugong',          genres: ['Action', 'Fantasy'],            cover: G.goldNight,  total: 179, read: 117, status: 'reading',   rating: 9.4 },
  { id: 2,  title: 'Tower of God',           author: 'SIU',              genres: ['Aventure', 'Mystère'],          cover: G.blue,       total: 620, read: 412, status: 'reading',   rating: 9.0 },
  { id: 3,  title: 'Lore Olympus',           author: 'Rachel Smythe',    genres: ['Romance', 'Fantasy'],           cover: G.rose,       total: 270, read: 270, status: 'completed', rating: 8.7 },
  { id: 4,  title: 'Bastard',                author: 'Carnby Kim',       genres: ['Thriller', 'Horreur'],          cover: G.sageRose,   total: 94,  read: 94,  status: 'completed', rating: 9.1 },
  { id: 5,  title: 'Sweet Home',             author: 'Carnby Kim',       genres: ['Horreur', 'Drame'],             cover: G.beigeBlue,  total: 141, read: 86,  status: 'paused',    rating: 8.5 },
  { id: 6,  title: 'Omniscient Reader',      author: 'Sing Shong',       genres: ['Action', 'Fantasy'],            cover: G.blueRose,   total: 200, read: 73,  status: 'reading',   rating: 9.2 },
  { id: 7,  title: 'Noblesse',               author: 'Son Jeho',         genres: ['Action', 'Surnaturel'],         cover: G.goldNight,  total: 544, read: 544, status: 'completed', rating: 8.4 },
  { id: 8,  title: 'True Beauty',            author: 'Yaongyi',          genres: ['Romance', 'Tranche de vie'],    cover: G.rose,       total: 224, read: 0,   status: 'plan',      rating: null },
  { id: 9,  title: 'The Beginning After…',   author: 'TurtleMe',         genres: ['Fantasy', 'Aventure'],          cover: G.sage,       total: 200, read: 138, status: 'reading',   rating: 8.9 },
  { id: 10, title: 'Eleceed',                author: 'Son Jeho',         genres: ['Action', 'Comédie'],            cover: G.beigeSage,  total: 320, read: 320, status: 'completed', rating: 9.3 },
  { id: 11, title: 'Unordinary',             author: 'uru-chan',         genres: ['Drame', 'Surnaturel'],          cover: G.blue,       total: 360, read: 22,  status: 'dropped',   rating: 6.0 },
  { id: 12, title: 'I Love Yoo',             author: 'Quimchee',         genres: ['Romance', 'Drame'],             cover: G.rose,       total: 200, read: 0,   status: 'plan',      rating: null },
];

const GENRE_COLORS = {
  'Action':         { bg: '#E4E9D8', fg: '#4F5E2F' },
  'Romance':        { bg: '#F1DFE3', fg: '#7A4855' },
  'Fantasy':        { bg: '#F0E9D6', fg: '#7E6A3B' },
  'Mystère':        { bg: '#E0E9F0', fg: '#3D5970' },
  'Thriller':       { bg: '#E0E9F0', fg: '#3D5970' },
  'Horreur':        { bg: '#F1DFE3', fg: '#7A4855' },
  'Drame':          { bg: '#F0E9D6', fg: '#7E6A3B' },
  'Comédie':        { bg: '#E4E9D8', fg: '#4F5E2F' },
  'Aventure':       { bg: '#E4E9D8', fg: '#4F5E2F' },
  'Surnaturel':     { bg: '#E0E9F0', fg: '#3D5970' },
  'Tranche de vie': { bg: '#F0E9D6', fg: '#7E6A3B' },
};

Object.assign(window, { STATUS, WEBTOONS, GENRE_COLORS });
