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

export function questionPoints(correct, secondsLeft, streak) {
  if (!correct) return 0;
  const speed = Math.round(100 * Math.max(0, secondsLeft) / QUESTION_TIME);
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
  for (const c of remaining) {
    for (const a of acceptedAnswers(c, kind)) {
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
  { id: 'first', icon: '🎒', name: 'Premier voyage', desc: 'Termine ta première partie', test: s => s.games >= 1 },
  { id: 'perfect', icon: '💯', name: 'Sans faute', desc: '10/10 en mode Éclair', test: s => s.perfects >= 1 },
  { id: 'combo10', icon: '🔥', name: 'En feu', desc: 'Combo de 10 bonnes réponses', test: s => s.bestCombo >= 10 },
  { id: 'speed', icon: '⚡', name: 'Éclair', desc: '10/10 en moins de 25 s', test: s => s.speedrun },
  { id: 'survive25', icon: '❤️', name: 'Survivant', desc: '25 bonnes réponses en Survie', test: s => s.bestSurvival >= 25 },
  { id: 'streak3', icon: '📅', name: 'Habitué', desc: '3 jours de suite', test: s => s.bestStreak >= 3 },
  { id: 'streak7', icon: '🗓️', name: 'Fidèle', desc: '7 jours de suite', test: s => s.bestStreak >= 7 },
  { id: 'streak30', icon: '🏆', name: 'Inarrêtable', desc: '30 jours de suite', test: s => s.bestStreak >= 30 },
  { id: 'daily7', icon: '🌅', name: 'Lève-tôt', desc: '7 défis du jour terminés', test: s => s.dailies >= 7 },
  { id: 'share', icon: '📣', name: 'Ambassadeur', desc: 'Partage un score', test: s => s.shares >= 1 },
  { id: 'c100', icon: '🧭', name: 'Boussole', desc: '100 bonnes réponses au total', test: s => s.correct >= 100 },
  { id: 'c1000', icon: '🛰️', name: 'Satellite', desc: '1 000 bonnes réponses au total', test: s => s.correct >= 1000 },
  { id: 'region', icon: '🗺️', name: 'Continent conquis', desc: 'Termine un Marathon de continent à 100 %', test: s => (s.marathonDone || []).length >= 1 },
  { id: 'flags193', icon: '🏳️', name: 'Vexillologue', desc: 'Les 193 drapeaux en Marathon', test: s => (s.marathonDone || []).includes('flags-world') },
  { id: 'caps193', icon: '🏛️', name: 'Maître des capitales', desc: 'Les 193 capitales en Marathon', test: s => (s.marathonDone || []).includes('capitals-world') },
];

export function newBadges(stats, owned) {
  return BADGES.filter(b => !owned.includes(b.id) && b.test(stats));
}

// ---------- Partage ----------
export function shareText({ title, correct, total, score, grid, url }) {
  const lines = [`🌍 ${title}`, `${total != null ? `${correct}/${total}` : `${correct} bonnes réponses`}${score != null ? ` · ${score.toLocaleString('fr-FR')} pts` : ''}`];
  if (grid) lines.push(grid);
  lines.push('Tu fais mieux ? 👉 ' + url);
  return lines.join('\n');
}

export function resultGrid(answers) {
  return answers.map(a => (a.correct ? (a.fast ? '🟩' : '🟨') : '🟥')).join('');
}
