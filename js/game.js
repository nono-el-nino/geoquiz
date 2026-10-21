import { COUNTRIES, countriesFor, acceptedAnswers, normalize } from './data.js';

// ---------- Aléatoire (avec graine pour le défi du jour) ----------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dayKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const EPOCH = Date.UTC(2026, 0, 1);
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000) + 1;
}

// ---------- Questions à choix multiples ----------
// Les mauvaises réponses viennent du même continent quand c'est possible : plus piégeux.
export function makeQuestion(country, kind, rand = Math.random) {
  const same = COUNTRIES.filter(c => c.code !== country.code && c.continent === country.continent);
  const other = COUNTRIES.filter(c => c.code !== country.code && c.continent !== country.continent);
  const pool = [...shuffle(same, rand), ...shuffle(other, rand)];
  const label = c => (kind === 'flags' ? c.name : c.capital);
  const seen = new Set([label(country)]);
  const wrong = [];
  for (const c of pool) {
    if (wrong.length === 3) break;
    if (!seen.has(label(c))) { seen.add(label(c)); wrong.push(c); }
  }
  return { country, kind, choices: shuffle([country, ...wrong], rand) };
}

export function makeQuiz({ kind, region = 'world', count = 10, rand = Math.random }) {
  return shuffle(countriesFor(region), rand).slice(0, count).map(c => makeQuestion(c, kind, rand));
}

// Défi du jour : mêmes 10 questions pour tout le monde (5 drapeaux + 5 capitales).
export function dailyQuiz(key = dayKey()) {
  const rand = rng(dayNumber(key) * 7919);
  const picks = shuffle(COUNTRIES, rand).slice(0, 10);
  return picks.map((c, i) => makeQuestion(c, i % 2 === 0 ? 'flags' : 'capitals', rand));
}

// ---------- Score ----------
export const QUESTION_TIME = 10; // secondes

export function comboMultiplier(streak) {
  return Math.min(3, 1 + Math.floor(streak / 3) * 0.5);
}

export function questionPoints(correct, secondsLeft, streak, duration = QUESTION_TIME) {
  if (!correct) return 0;
  const speed = Math.round(100 * Math.max(0, secondsLeft) / duration);
  return Math.round((100 + speed) * comboMultiplier(streak));
}

export function stars(correct, total) {
  const r = total ? correct / total : 0;
  return r >= 1 ? 3 : r >= 0.8 ? 2 : r >= 0.5 ? 1 : 0;
}

// ---------- Saisie libre (mode Marathon, à la JetPunk) ----------
// Renvoie le pays trouvé, et s'il faut attendre (la saisie est le début d'une autre réponse,
// ex. "niger" avant "nigeria", "guinee" avant "guinee equatoriale").
export function matchTyped(input, remaining, kind) {
  const n = normalize(input);
  if (!n) return null;
  let hit = null;
  let ambiguous = false;
  const idx = answerIndex(kind);
  for (const c of remaining) {
    for (const a of [...idx.get(c.code).full, ...idx.get(c.code).parts]) {
      if (a === n) hit = hit || c;
      else if (a.startsWith(n)) ambiguous = true;
    }
  }
  return hit ? { country: hit, wait: ambiguous } : null;
}

// ---------- Progression ----------
export function levelFromXp(xp) {
  let level = 1, need = 100, floor = 0;
  while (xp >= floor + need) { floor += need; level++; need = Math.round(need * 1.25); }
  return { level, into: xp - floor, need };
}

export const TITLES = ['Touriste', 'Routard', 'Explorateur', 'Navigateur', 'Cartographe', 'Globe-trotteur', 'Ambassadeur', 'Atlas vivant'];
export function titleFor(level) {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))];
}

// Série de jours joués d'affilée
export function updateStreak(state, today = dayKey()) {
  if (state.lastPlayed === today) return state.streak;
  const y = new Date(today + 'T12:00:00');
  y.setDate(y.getDate() - 1);
  state.streak = state.lastPlayed === dayKey(y) ? state.streak + 1 : 1;
  state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
  state.lastPlayed = today;
  return state.streak;
}

export const BADGES = [
  { id: 'first', icon: 'plane', name: 'Premier voyage', desc: 'Termine ta première partie', test: s => s.games >= 1 },
  { id: 'perfect', icon: 'target', name: 'Sans faute', desc: '10/10 en Éclair ou Saisie', test: s => s.perfects >= 1 },
  { id: 'combo10', icon: 'flame', name: 'En feu', desc: 'Combo de 10 bonnes réponses', test: s => s.bestCombo >= 10 },
  { id: 'speed', icon: 'bolt', name: 'Éclair', desc: '10/10 en moins de 25 s', test: s => s.speedrun },
  { id: 'survive25', icon: 'heart', name: 'Survivant', desc: '25 bonnes réponses en Survie', test: s => s.bestSurvival >= 25 },
  { id: 'streak3', icon: 'calendar', name: 'Habitué', desc: '3 jours de suite', test: s => s.bestStreak >= 3 },
  { id: 'streak7', icon: 'sparkle', name: 'Fidèle', desc: '7 jours de suite', test: s => s.bestStreak >= 7 },
  { id: 'streak30', icon: 'trophy', name: 'Inarrêtable', desc: '30 jours de suite', test: s => s.bestStreak >= 30 },
  { id: 'daily7', icon: 'sunrise', name: 'Lève-tôt', desc: '7 défis du jour terminés', test: s => s.dailies >= 7 },
  { id: 'share', icon: 'share', name: 'Ambassadeur', desc: 'Partage un score', test: s => s.shares >= 1 },
  { id: 'c100', icon: 'compass', name: 'Boussole', desc: '100 bonnes réponses au total', test: s => s.correct >= 100 },
  { id: 'c1000', icon: 'globe', name: 'Satellite', desc: '1 000 bonnes réponses au total', test: s => s.correct >= 1000 },
  { id: 'region', icon: 'map', name: 'Continent conquis', desc: 'Termine un Marathon de continent à 100 %', test: s => (s.marathonDone || []).length >= 1 },
  { id: 'flags193', icon: 'flag', name: 'Vexillologue', desc: 'Les 193 drapeaux en Marathon', test: s => (s.marathonDone || []).includes('flags-world') },
  { id: 'caps193', icon: 'landmark', name: 'Maître des capitales', desc: 'Les 193 capitales en Marathon', test: s => (s.marathonDone || []).includes('capitals-world') },
];

export function newBadges(stats, owned) {
  return BADGES.filter(b => !owned.includes(b.id) && b.test(stats));
}

// ---------- Partage ----------
export function shareText({ title, correct, total, score, grid, url }) {
  const lines = [title, `${total != null ? `${correct}/${total}` : `${correct} bonnes réponses`}${score != null ? ` · ${score.toLocaleString('fr-FR')} pts` : ''}`];
  if (grid) lines.push(grid);
  lines.push('Tu fais mieux ? ' + url);
  return lines.join('\n');
}

export function resultGrid(answers) {
  return answers.map(a => (a.correct ? '🟧' : '⬜')).join('');
}

// ---------- Saisie souple (mode Saisie, et noms partiels en Marathon) ----------
export const TYPING_TIME = 25; // secondes

// Mots trop génériques pour suffire seuls ("République", "Saint", "Port"…)
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'iles', 'ile', 'republique', 'democratique',
  'saint', 'sainte', 'san', 'port', 'nord', 'sud', 'city', 'new', 'nouvelle']);

function words(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w));
}

// Pour chaque pays : réponses complètes + mots qui le désignent sans ambiguïté
// (ex. "Burkina" pour Burkina Faso, "Moresby" pour Port Moresby, mais pas "Corée" ni "Guinée").
const INDEX = {};
export function answerIndex(kind) {
  if (INDEX[kind]) return INDEX[kind];
  const raw = c => (kind === 'flags' ? [c.name, ...c.nameAliases] : [c.capital, ...c.capitalAliases]);
  const full = new Map(COUNTRIES.map(c => [c.code, acceptedAnswers(c, kind)]));
  const allFull = new Set([...full.values()].flat());
  const owners = new Map();
  for (const c of COUNTRIES) for (const w of new Set(raw(c).flatMap(words))) owners.set(w, (owners.get(w) || 0) + 1);
  const idx = new Map();
  for (const c of COUNTRIES) {
    const parts = [...new Set(raw(c).flatMap(words))]
      .filter(w => owners.get(w) === 1 && !full.get(c.code).includes(w) && !allFull.has(w));
    idx.set(c.code, { full: full.get(c.code), parts });
  }
  return (INDEX[kind] = idx);
}

// Distance d'édition (une inversion de deux lettres compte pour une faute)
export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Fautes tolérées selon la longueur du mot
export function tolerance(len) {
  return len <= 3 ? 0 : len <= 6 ? 1 : len <= 10 ? 2 : 3;
}

// Vérifie une réponse tapée. Refusée si elle désigne mieux un autre pays (ex. "Gambie" pour la Zambie).
export function checkTyped(input, target, kind) {
  const n = normalize(input);
  if (n.length < 2) return { ok: false };
  const idx = answerIndex(kind);
  const best = (code, withinTolerance) => {
    const { full, parts } = idx.get(code);
    let min = Infinity;
    for (const a of [...full, ...parts]) {
      const d = editDistance(n, a);
      if ((!withinTolerance || d <= tolerance(a.length)) && d < min) min = d;
    }
    return min;
  };
  const mine = best(target.code, true);
  if (mine === Infinity) return { ok: false };
  for (const c of COUNTRIES) {
    if (c.code !== target.code && best(c.code, false) < mine) return { ok: false, other: c };
  }
  return { ok: true, exact: mine === 0 && idx.get(target.code).full.includes(n) };
}

// Aide à la saisie : propositions qui commencent comme ce qui est tapé
export function suggest(input, kind, limit = 4) {
  const n = normalize(input);
  if (n.length < 2) return [];
  const label = c => (kind === 'flags' ? c.name : c.capital);
  const scored = [];
  for (const c of COUNTRIES) {
    const name = normalize(label(c));
    const rank = name.startsWith(n) ? 0
      : words(label(c)).some(w => w.startsWith(n)) || acceptedAnswers(c, kind).some(a => a.startsWith(n)) ? 1 : -1;
    if (rank >= 0) scored.push({ c, rank });
  }
  const seen = new Set();
  return scored.sort((a, b) => a.rank - b.rank || label(a.c).localeCompare(label(b.c), 'fr'))
    .map(s => label(s.c)).filter(l => !seen.has(l) && seen.add(l)).slice(0, limit);
}

// Indice : première lettre et longueur, ex. "O _ _ _ _ _ _ _ _ _ _"
export function hintFor(answer) {
  return [...answer].map((ch, i) => (i === 0 ? ch.toUpperCase() : /[\s'’-]/.test(ch) ? ch : '_')).join(' ');
}
