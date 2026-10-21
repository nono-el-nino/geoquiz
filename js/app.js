import { REGIONS, countriesFor, flagEmoji } from './data.js';
import { mascot } from './mascot.js';
import {
  shuffle, makeQuiz, makeQuestion, dailyQuiz, dayKey, dayNumber, QUESTION_TIME,
  questionPoints, comboMultiplier, stars, matchTyped, levelFromXp, titleFor,
  updateStreak, BADGES, newBadges, shareText, resultGrid,
  TYPING_TIME, checkTyped, suggest, hintFor,
} from './game.js';

const app = document.getElementById('app');
const APP_URL = location.origin + location.pathname.replace(/index\.html$/, '');
const KIND = {
  flags: { label: 'Drapeaux', icon: '🏳️', verb: 'À quel pays appartient ce drapeau&nbsp;?' },
  capitals: { label: 'Capitales', icon: '🏛️' },
};
const MODES = {
  eclair: { label: 'Éclair', icon: '⚡', desc: '10 questions, 10 s chacune. Vise le combo !' },
  saisie: { label: 'Saisie', icon: '✍️', desc: '10 questions à écrire, 25 s chacune. Orthographe souple, aide à la saisie.' },
  survie: { label: 'Survie', icon: '❤️', desc: '3 vies. Jusqu’où iras-tu ?' },
  marathon: { label: 'Marathon', icon: '⌨️', desc: 'Tape-les tous avant la fin du chrono.' },
};

// ---------- Sauvegarde ----------
const STORE = 'geoblitz-v1';
const DEFAULT = {
  xp: 0, games: 0, correct: 0, perfects: 0, bestCombo: 0, speedrun: false, bestSurvival: 0,
  streak: 0, bestStreak: 0, lastPlayed: null, dailies: 0, shares: 0, marathonDone: [],
  badges: [], records: {}, daily: null, sound: true,
};
let S = load();
function load() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { ...DEFAULT }; }
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* stockage indisponible */ }
}

// ---------- Utilitaires ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Windows n'affiche pas les drapeaux emoji : on bascule alors sur des images.
const EMOJI_FLAGS = (() => {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = '16px sans-serif'; x.fillText('🇫🇷', 0, 14);
    const d = x.getImageData(0, 0, 16, 16).data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 150 && d[i] < 100) return true; // du bleu → vrai drapeau
    return false;
  } catch { return true; }
})();
function flag(code, cls = '') {
  return EMOJI_FLAGS
    ? `<span class="flag ${cls}" aria-hidden="true">${flagEmoji(code)}</span>`
    : `<img class="flag ${cls}" alt="" src="https://flagcdn.com/w320/${code}.png">`;
}

// Grille de résultat dessinée (les émojis 🟩🟨🟥 restent pour le texte partagé)
function gridHtml(grid) {
  return `<div class="grid" aria-label="${grid}">${[...grid.matchAll(/🟩|🟨|🟥/gu)].map(m => `<i class="${m[0] === '🟩' ? 'g' : m[0] === '🟨' ? 'y' : ''}"></i>`).join('')}</div>`;
}

function flagSticker(code, cls = '') {
  return `<span class="flag-sticker ${cls}">${flag(code)}</span>`;
}

// Répliques de la mascotte
const pickLine = list => list[Math.floor(Math.random() * list.length)];
const LINES = {
  lost: ['Euh… c’est par où, l’Australie ?', 'J’ai encore perdu le nord…', 'Ma carte est à l’envers, non ?', 'Tout droit après le Kazakhstan ?', 'Quelqu’un a vu Tuvalu ?'],
  happy: ['Je sais enfin où je suis !', 'Quel sens de l’orientation !', 'Atterrissage parfait !'],
  middle: ['Pas mal… je crois ?', 'On y est presque !', 'J’ai juste fait un petit détour.'],
  dizzy: ['Je suis complètement flagada…', 'Atterrissage d’urgence !', 'Qui a retourné la planète ?'],
};

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function buzz(p) { try { navigator.vibrate?.(p); } catch { /* ignore */ } }

let audio;
function beep(good) {
  if (!S.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = good ? 'triangle' : 'sawtooth';
    o.frequency.setValueAtTime(good ? 660 : 180, audio.currentTime);
    if (good) o.frequency.exponentialRampToValueAtTime(990, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.12, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.25);
  } catch { /* pas de son */ }
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.getElementById('confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const colors = ['#ff8a1f', '#2f9be8', '#ffc93c', '#36c27a', '#ff5c5c', '#1f2a48'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 4,
    s: 6 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)], r: Math.random() * 6, vr: (Math.random() - .5) * .4,
  }));
  const start = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (t - start < 3000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(start);
}

// Arrête le chrono de la partie en cours quand on change d'écran.
let cleanup = () => {};
function render(html, after) {
  cleanup(); cleanup = () => {};
  app.innerHTML = `<div class="fade-in" style="display:contents">${html}</div>`;
  window.scrollTo(0, 0);
  after?.();
}
function on(sel, ev, fn) { app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn)); }

// ---------- Accueil ----------
function home() {
  const lv = levelFromXp(S.xp);
  const today = dayKey();
  const done = S.daily?.key === today ? S.daily : null;
  render(`
    <header class="row between">
      <div class="logo">Flag <b>ada</b><small>Drapeaux & capitales</small></div>
      <div class="row">
        <span class="chip" title="Jours joués d'affilée">🔥 ${S.lastPlayed === today || isYesterday(S.lastPlayed) ? S.streak : 0}</span>
        <button class="icon-btn" id="profile" aria-label="Profil et badges">🏅</button>
      </div>
    </header>

    <div class="hero">
      <div class="bird">${mascot('lost')}</div>
      <div class="bubble">${pickLine(LINES.lost)}</div>
    </div>

    <button class="card level-card" id="profile2">
      <div class="lvl">${lv.level}</div>
      <div class="grow">
        <div class="row between"><b>${titleFor(lv.level)}</b><span class="muted small">${lv.into} / ${lv.need} XP</span></div>
        <div class="bar" style="margin-top:8px"><i style="width:${(lv.into / lv.need) * 100}%"></i></div>
      </div>
    </button>

    <section class="card daily">
      <div class="label">DÉFI DU JOUR #${dayNumber(today)}</div>
      <h2>${done ? `Fait : ${done.correct}/10 · ${done.score.toLocaleString('fr-FR')} pts` : '10 questions, les mêmes pour tout le monde'}</h2>
      ${done
        ? `${gridHtml(done.grid)}
           <button class="btn" id="share-daily">📣 Défier mes amis</button>
           <div class="small center" style="margin-top:10px;font-weight:700">Prochain défi dans <span id="countdown">${countdown()}</span></div>`
        : `<button class="btn" id="daily">Jouer le défi ▶</button>`}
    </section>

    <h2>Entraînement</h2>
    <div class="tiles">
      ${Object.entries(KIND).map(([k, v]) => `
        <button class="tile" data-kind="${k}">
          <span class="ico">${v.icon}</span><b>${v.label}</b>
          <span class="muted small">193 pays · 3 modes</span>
        </button>`).join('')}
    </div>
  `, () => {
    on('#profile, #profile2', 'click', profile);
    on('[data-kind]', 'click', e => setup(e.currentTarget.dataset.kind));
    on('#daily', 'click', () => playChoice({ mode: 'daily', questions: dailyQuiz(today) }));
    const dailyShare = done && prepareShare({ ...done, daily: true });
    on('#share-daily', 'click', () => share(dailyShare));
    if (done) {
      const id = setInterval(() => {
        const el = document.getElementById('countdown');
        if (!el) return clearInterval(id);
        if (dayKey() !== today) { clearInterval(id); home(); } else el.textContent = countdown();
      }, 1000);
      cleanup = () => clearInterval(id);
    }
  });
}

function isYesterday(key) {
  if (!key) return false;
  const d = new Date(); d.setDate(d.getDate() - 1);
  return key === dayKey(d);
}
function countdown() {
  const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
  const s = Math.floor((m - n) / 1000);
  return [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
}

// ---------- Choix du mode ----------
let pick = { mode: 'eclair', region: 'world' };
function setup(kind) {
  const recKey = `${pick.mode}-${kind}-${pick.region}`;
  const rec = S.records[recKey];
  render(`
    <header class="row">
      <button class="icon-btn" id="back" aria-label="Retour">←</button>
      <h2 class="grow">${KIND[kind].icon} ${KIND[kind].label}</h2>
    </header>
    <div class="modes">
      ${Object.entries(MODES).map(([k, m]) => `
        <button class="mode ${pick.mode === k ? 'on' : ''}" data-mode="${k}">
          <span class="ico">${m.icon}</span>
          <span><b>${m.label}</b><br><span class="muted small">${m.desc}</span></span>
        </button>`).join('')}
    </div>
    <h2>Zone</h2>
    <div class="regions">
      ${Object.entries(REGIONS).map(([k, r]) => `
        <button class="region ${pick.region === k ? 'on' : ''}" data-region="${k}">${r.emoji} ${r.label} <span class="muted small">${countriesFor(k).length}</span></button>`).join('')}
    </div>
    <div class="grow"></div>
    <div class="center muted">${rec ? `🏆 Ton record : <b style="color:var(--text)">${formatRecord(pick.mode, rec)}</b>` : 'Pas encore de record ici'}</div>
    <button class="btn primary" id="go">C'est parti !</button>
  `, () => {
    on('#back', 'click', home);
    on('[data-mode]', 'click', e => { pick.mode = e.currentTarget.dataset.mode; setup(kind); });
    on('[data-region]', 'click', e => { pick.region = e.currentTarget.dataset.region; setup(kind); });
    on('#go', 'click', () => start(kind));
  });
}

function formatRecord(mode, rec) {
  if (mode === 'eclair' || mode === 'saisie') return `${rec.toLocaleString('fr-FR')} pts`;
  if (mode === 'survie') return `${rec} bonnes réponses`;
  return `${rec.found}/${rec.total}`;
}

function start(kind) {
  const { mode, region } = pick;
  if (mode === 'marathon') return marathon(kind, region);
  if (mode === 'saisie') return playTyping({ mode, kind, region, questions: makeQuiz({ kind, region, count: 10 }) });
  if (mode === 'eclair') return playChoice({ mode, kind, region, questions: makeQuiz({ kind, region, count: 10 }) });
  // Survie : on parcourt la zone dans un ordre aléatoire
  const order = shuffle(countriesFor(region));
  let i = 0;
  return playChoice({ mode, kind, region, next: () => (i < order.length ? makeQuestion(order[i++], kind) : null), total: order.length });
}

// ---------- Partie à choix multiples (Éclair, Survie, Défi du jour) ----------
function playChoice(cfg) {
  const g = { score: 0, combo: 0, bestCombo: 0, lives: 3, answers: [], startedAt: performance.now() };
  let idx = 0, q = null, locked = false, raf = 0;

  const nextQuestion = () => (cfg.questions ? cfg.questions[idx] : cfg.next());
  const count = cfg.questions ? cfg.questions.length : null;

  function show() {
    q = nextQuestion();
    if (!q) return finish();
    locked = false;
    const c = q.country;
    const label = x => (q.kind === 'flags' ? x.name : x.capital);
    render(`
      <div class="hud">
        <button class="icon-btn" id="quit" aria-label="Quitter">✕</button>
        <div class="grow center">
          ${cfg.mode === 'survie'
            ? `<span class="hearts">${'❤️'.repeat(g.lives)}${'🖤'.repeat(3 - g.lives)}</span>`
            : `<b>${idx + 1}</b><span class="muted"> / ${count}</span>`}
        </div>
        <div class="score" id="score">${cfg.mode === 'survie' ? `✅ ${g.answers.filter(a => a.correct).length}` : g.score.toLocaleString('fr-FR')}</div>
      </div>
      <div class="bar timer" id="timer"><i style="width:100%"></i></div>
      <div class="prompt">
        ${q.kind === 'flags'
          ? `${flagSticker(c.code)}<div class="q">${KIND.flags.verb}</div>`
          : `${flagSticker(c.code, 'small')}<div class="q"><em>${esc(c.name)}</em><br>Quelle est sa capitale&nbsp;?</div>`}
        ${g.combo >= 3 ? `<div class="chip">🔥 Combo ${g.combo} · x${comboMultiplier(g.combo)}</div>` : ''}
      </div>
      <div class="answers">
        ${q.choices.map(x => `<button class="answer" data-code="${x.code}">${esc(label(x))}</button>`).join('')}
      </div>
    `, () => {
      on('#quit', 'click', () => { if (confirm('Quitter la partie ?')) home(); });
      on('.answer', 'click', e => answer(e.currentTarget.dataset.code));
      tick();
      cleanup = () => cancelAnimationFrame(raf);
    });
  }

  let qStart = 0;
  function tick() {
    qStart = performance.now();
    const bar = document.getElementById('timer'), fill = bar.firstElementChild;
    const loop = now => {
      const left = QUESTION_TIME - (now - qStart) / 1000;
      fill.style.width = `${Math.max(0, left / QUESTION_TIME) * 100}%`;
      bar.className = `bar timer ${left < 3 ? 'danger' : left < 6 ? 'warn' : ''}`;
      if (left <= 0) return answer(null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function answer(code) {
    if (locked) return;
    locked = true;
    cancelAnimationFrame(raf);
    const left = QUESTION_TIME - (performance.now() - qStart) / 1000;
    const correct = code === q.country.code;
    g.combo = correct ? g.combo + 1 : 0;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    const pts = questionPoints(correct, left, g.combo);
    g.score += pts;
    g.answers.push({ country: q.country, kind: q.kind, correct, fast: left > QUESTION_TIME / 2 });
    if (!correct && cfg.mode === 'survie') g.lives--;

    app.querySelectorAll('.answer').forEach(b => {
      if (b.dataset.code === q.country.code) b.classList.add('good');
      else if (b.dataset.code === code) b.classList.add('bad');
      else b.classList.add('dim');
    });
    beep(correct); buzz(correct ? 15 : [40, 40, 40]);
    if (correct && g.combo >= 3 && g.combo % 3 === 0) popCombo(`x${comboMultiplier(g.combo)} COMBO 🔥`);
    else if (correct && pts) popCombo(`+${pts}`);
    if (code === null) popCombo('⏰ Temps écoulé');

    idx++;
    const over = (cfg.mode === 'survie' && g.lives <= 0) || (count && idx >= count);
    setTimeout(over ? finish : show, correct ? 650 : 1300);
  }

  function finish() {
    cancelAnimationFrame(raf);
    finishQuiz(cfg, g, count);
  }

  show();
}

function finishQuiz(cfg, g, count) {
  const correct = g.answers.filter(a => a.correct).length;
  const total = cfg.mode === 'survie' ? correct : count;
  const seconds = (performance.now() - g.startedAt) / 1000;
  S.games++; S.correct += correct; S.bestCombo = Math.max(S.bestCombo, g.bestCombo);
  let record = false, xp;
  if (cfg.mode === 'survie') {
    xp = correct * 8;
    const key = `survie-${cfg.kind}-${cfg.region}`;
    if (correct > (S.records[key] || 0)) { record = S.records[key] != null; S.records[key] = correct; }
    S.bestSurvival = Math.max(S.bestSurvival, correct);
  } else {
    // La saisie est plus dure que le QCM : un peu plus d'XP
    xp = Math.round(g.score / (cfg.mode === 'saisie' ? 15 : 20)) + (correct === total ? 50 : 0);
    if (correct === total) S.perfects++;
    if (cfg.mode === 'eclair' && correct === total && seconds < 25) S.speedrun = true;
    if (cfg.mode === 'daily') {
      S.dailies++;
      xp += 30;
      S.daily = { key: dayKey(), correct, score: g.score, grid: resultGrid(g.answers) };
    } else {
      const key = `${cfg.mode}-${cfg.kind}-${cfg.region}`;
      if (g.score > (S.records[key] || 0)) { record = S.records[key] != null; S.records[key] = g.score; }
    }
  }
  results({ ...cfg, ...g, correct, total, xp, record });
}

// ---------- Saisie : une question à la fois, réponse écrite ----------
// L'écran est construit une seule fois : le champ garde le focus et le clavier reste ouvert.
function playTyping(cfg) {
  const g = { score: 0, combo: 0, bestCombo: 0, answers: [], startedAt: performance.now() };
  const count = cfg.questions.length;
  let idx = 0, q = null, locked = true, raf = 0, qStart = 0, hinted = false;

  render(`
    <div class="hud">
      <button class="icon-btn" id="quit" aria-label="Quitter">✕</button>
      <div class="grow center"><b id="qnum">1</b><span class="muted"> / ${count}</span></div>
      <div class="score" id="score">0</div>
    </div>
    <div class="bar timer" id="timer"><i style="width:100%"></i></div>
    <div class="prompt typing" id="prompt"></div>
    <form class="type-answer" id="form" autocomplete="off">
      <input id="typed" enterkeyhint="go" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Ta réponse">
      <button class="btn green" id="ok" type="submit" aria-label="Valider">✓</button>
    </form>
    <div class="suggests" id="suggests"></div>
    <div id="feedback" class="feedback" aria-live="assertive"></div>
    <div class="row">
      <button class="btn ghost keep" id="hint" type="button">💡 Indice</button>
      <button class="btn ghost keep" id="skip" type="button">Passer ⏭</button>
    </div>
  `, () => {
    const input = document.getElementById('typed');
    // Les boutons ne prennent pas le focus : le clavier ne se ferme pas.
    app.querySelectorAll('.keep, #ok').forEach(b => b.addEventListener('pointerdown', e => e.preventDefault()));
    on('#quit', 'click', () => { if (confirm('Quitter la partie ?')) home(); });
    document.getElementById('form').addEventListener('submit', e => { e.preventDefault(); submit(input.value); });
    input.addEventListener('input', () => { input.classList.remove('shake'); showSuggestions(); });
    on('#hint', 'click', () => {
      if (locked || hinted) return;
      hinted = true;
      feedback(`💡 ${hintFor(answerOf(q))}`, 'hint');
      document.getElementById('hint').disabled = true;
      input.focus();
    });
    on('#skip', 'click', () => !locked && fail());
    document.getElementById('suggests').addEventListener('pointerdown', e => {
      const b = e.target.closest('button');
      if (!b) return;
      e.preventDefault();
      submit(b.dataset.v);
    });
    cleanup = () => cancelAnimationFrame(raf);
    show();
    input.focus();
  });

  const answerOf = x => (x.kind === 'flags' ? x.country.name : x.country.capital);

  function show() {
    q = cfg.questions[idx];
    if (!q) return finish();
    locked = false; hinted = false;
    const c = q.country;
    document.getElementById('qnum').textContent = idx + 1;
    document.getElementById('prompt').innerHTML = q.kind === 'flags'
      ? `${flagSticker(c.code)}<div class="q">Quel est ce pays&nbsp;?</div>`
      : `${flagSticker(c.code, 'small')}<div class="q"><em>${esc(c.name)}</em><br>Quelle est sa capitale&nbsp;?</div>`;
    const input = document.getElementById('typed');
    input.value = ''; input.classList.remove('shake', 'ok'); input.placeholder = q.kind === 'flags' ? 'Nom du pays…' : 'Nom de la capitale…';
    document.getElementById('hint').disabled = false;
    document.getElementById('suggests').innerHTML = '';
    feedback(g.combo >= 3 ? `🔥 Combo ${g.combo} · x${comboMultiplier(g.combo)}` : '', 'combo');
    tick();
  }

  function showSuggestions() {
    const box = document.getElementById('suggests');
    const v = document.getElementById('typed').value;
    box.innerHTML = locked ? '' : suggest(v, q.kind).map(s => `<button type="button" data-v="${esc(s)}">${esc(s)}</button>`).join('');
  }

  function feedback(text, cls = '') {
    const el = document.getElementById('feedback');
    el.className = `feedback ${cls}`; el.textContent = text;
  }

  function tick() {
    qStart = performance.now();
    const bar = document.getElementById('timer'), fill = bar.firstElementChild;
    const loop = now => {
      const left = TYPING_TIME - (now - qStart) / 1000;
      fill.style.width = `${Math.max(0, left / TYPING_TIME) * 100}%`;
      bar.className = `bar timer ${left < 5 ? 'danger' : left < 10 ? 'warn' : ''}`;
      if (left <= 0) return fail(true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function submit(value) {
    if (locked || !value.trim()) return;
    const r = checkTyped(value, q.country, q.kind);
    const input = document.getElementById('typed');
    if (!r.ok) {
      // Mauvaise réponse : on peut réessayer tant qu'il reste du temps.
      beep(false); buzz([30, 30, 30]);
      input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
      feedback(r.other ? `❌ Ça, c'est ${q.kind === 'flags' ? r.other.name : `la capitale : ${r.other.name}`}` : '❌ Non, réessaie !', 'bad');
      input.select();
      return;
    }
    const left = TYPING_TIME - (performance.now() - qStart) / 1000;
    g.combo++;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    let pts = questionPoints(true, left, g.combo, TYPING_TIME);
    if (hinted) pts = Math.round(pts / 2);
    g.score += pts;
    g.answers.push({ country: q.country, kind: q.kind, correct: true, fast: left > TYPING_TIME / 2 && !hinted });
    document.getElementById('score').textContent = g.score.toLocaleString('fr-FR');
    input.value = answerOf(q);
    input.classList.add('ok');
    feedback(r.exact ? '✅ Exact !' : `✅ Accepté : ${answerOf(q)}`, 'good');
    beep(true); buzz(15);
    popCombo(g.combo >= 3 && g.combo % 3 === 0 ? `x${comboMultiplier(g.combo)} COMBO 🔥` : `+${pts}`);
    next(r.exact ? 700 : 1300);
  }

  function fail(timeout = false) {
    if (locked) return;
    g.combo = 0;
    g.answers.push({ country: q.country, kind: q.kind, correct: false });
    beep(false); buzz([40, 40, 40]);
    feedback(`${timeout ? '⏰ Temps écoulé' : '⏭ Passé'} — c'était ${answerOf(q)}`, 'bad');
    next(1800);
  }

  function next(delay) {
    locked = true;
    cancelAnimationFrame(raf);
    document.getElementById('suggests').innerHTML = '';
    idx++;
    setTimeout(() => {
      if (!document.getElementById('typed')) return; // écran quitté
      document.getElementById('typed').classList.remove('ok');
      idx >= count ? finish() : show();
    }, delay);
  }

  function finish() {
    cancelAnimationFrame(raf);
    finishQuiz(cfg, g, count);
  }
}

function popCombo(text) {
  const el = document.createElement('div');
  el.className = 'combo'; el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ---------- Marathon (saisie libre, à la JetPunk) ----------
function marathon(kind, region) {
  const all = shuffle(countriesFor(region));
  if (kind === 'capitals') all.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const limit = Math.max(180, Math.round(all.length * 4));
  const found = new Set();
  let ended = false, timer = 0, pending = 0;
  const startAt = Date.now();

  render(`
    <div class="type-box">
      <div class="hud">
        <button class="icon-btn" id="quit" aria-label="Abandonner">🏳️</button>
        <div class="grow center"><b id="count">0</b><span class="muted"> / ${all.length}</span></div>
        <div class="score" id="clock">${fmtTime(limit)}</div>
      </div>
      <input id="typed" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        placeholder="${kind === 'flags' ? 'Tape un pays…' : 'Tape une capitale…'}" aria-label="Réponse">
    </div>
    <p class="muted small center" style="margin:0">Pas besoin de valider ni d'accents : une bonne réponse s'ajoute toute seule.</p>
    <div class="mgrid">
      ${all.map(c => `
        <div class="mcell" id="m-${c.code}">
          ${kind === 'flags' ? flag(c.code) : `<span>${esc(c.name)}</span>`}
          <span class="ans"></span>
        </div>`).join('')}
    </div>
  `, () => {
    const input = document.getElementById('typed');
    input.focus();
    input.addEventListener('input', () => {
      clearTimeout(pending);
      const remaining = all.filter(c => !found.has(c.code));
      const m = matchTyped(input.value, remaining, kind);
      if (!m) return;
      // Si la saisie est aussi le début d'une autre réponse (Niger / Nigeria), on attend un peu.
      if (m.wait) pending = setTimeout(() => accept(m.country), 900);
      else accept(m.country);
    });
    on('#quit', 'click', () => { if (found.size === 0 || confirm('Abandonner et voir les réponses ?')) end(); });

    timer = setInterval(() => {
      const left = limit - Math.floor((Date.now() - startAt) / 1000);
      const el = document.getElementById('clock');
      if (el) el.textContent = fmtTime(Math.max(0, left));
      if (left <= 0) end();
    }, 250);
    cleanup = () => { clearInterval(timer); clearTimeout(pending); };
  });

  function accept(c) {
    if (ended || found.has(c.code)) return;
    found.add(c.code);
    const cell = document.getElementById(`m-${c.code}`);
    cell.classList.add('found');
    cell.querySelector('.ans').textContent = kind === 'flags' ? c.name : c.capital;
    if (kind === 'flags') cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const input = document.getElementById('typed');
    input.value = ''; input.classList.add('ok'); setTimeout(() => input.classList.remove('ok'), 300);
    document.getElementById('count').textContent = found.size;
    beep(true); buzz(10);
    if (found.size === all.length) end();
  }

  function end() {
    if (ended) return;
    ended = true;
    clearInterval(timer); clearTimeout(pending);
    const missed = all.filter(c => !found.has(c.code));
    const seconds = Math.round((Date.now() - startAt) / 1000);
    S.games++; S.correct += found.size;
    const key = `marathon-${kind}-${region}`;
    const prev = S.records[key];
    const record = !prev || found.size > prev.found || (found.size === prev.found && seconds < prev.seconds);
    if (record) S.records[key] = { found: found.size, total: all.length, seconds };
    if (!missed.length && !S.marathonDone.includes(`${kind}-${region}`)) S.marathonDone.push(`${kind}-${region}`);
    results({
      mode: 'marathon', kind, region, correct: found.size, total: all.length,
      xp: found.size * 5 + (missed.length ? 0 : 100), record: record && !!prev && found.size > 0, seconds,
      missed,
    });
  }
}
function fmtTime(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

// ---------- Résultats ----------
function results(r) {
  const before = levelFromXp(S.xp);
  S.xp += r.xp;
  const after = levelFromXp(S.xp);
  updateStreak(S);
  const earned = newBadges(S, S.badges);
  S.badges.push(...earned.map(b => b.id));
  save();

  const st = r.mode === 'survie' ? null : stars(r.correct, r.total);
  const ratio = r.total ? r.correct / r.total : 0;
  const level = r.mode === 'survie' ? (r.correct >= 15 ? 2 : r.correct >= 6 ? 1 : 0) : ratio >= .8 ? 2 : ratio >= .5 ? 1 : 0;
  const mood = ['dizzy', 'lost', 'happy'][level];
  const line = pickLine([LINES.dizzy, LINES.middle, LINES.happy][level]);
  const headline = r.mode === 'survie' ? `${r.correct}` : `${r.correct}/${r.total}`;
  const mistakes = r.mode === 'marathon' ? r.missed.map(c => ({ country: c, kind: r.kind }))
    : r.answers.filter(a => !a.correct);
  const levelUp = after.level > before.level;
  const title = r.mode === 'daily' ? `Défi du jour #${dayNumber(dayKey())}`
    : `${MODES[r.mode].label} · ${KIND[r.kind].label} · ${REGIONS[r.region].label}`;

  render(`
    <div class="result-hero">
      <div class="bubble">${line}</div>
      <div class="bird">${mascot(mood)}</div>
      <div class="muted" style="font-weight:700">${esc(title)}</div>
      <div class="score-big">${headline}</div>
      ${r.mode === 'survie' ? '<div class="muted">bonnes réponses</div>' : ''}
      ${st != null ? `<div class="stars">${[1, 2, 3].map(i => `<span class="${i <= st ? '' : 'off'}">⭐</span>`).join('')}</div>` : ''}
      ${r.record ? '<div class="record">🎉 Nouveau record !</div>' : ''}
    </div>

    <div class="stat-grid">
      ${r.mode === 'marathon'
        ? `<div class="stat"><b>${Math.round(ratio * 100)} %</b><span>trouvés</span></div>
           <div class="stat"><b>${fmtTime(r.seconds)}</b><span>temps</span></div>`
        : `<div class="stat"><b>${(r.score || 0).toLocaleString('fr-FR')}</b><span>points</span></div>
           <div class="stat"><b>🔥 ${r.bestCombo}</b><span>meilleur combo</span></div>`}
      <div class="stat"><b>+${r.xp}</b><span>XP</span></div>
    </div>

    <div class="card">
      <div class="row between"><b>${levelUp ? `🎉 Niveau ${after.level} !` : `Niveau ${after.level}`} · ${titleFor(after.level)}</b><span class="muted small">${after.into} / ${after.need}</span></div>
      <div class="bar" style="margin-top:8px"><i id="xpbar" style="width:${levelUp ? 0 : (before.into / before.need) * 100}%"></i></div>
    </div>

    ${earned.map(b => `<div class="badge-new"><span class="ico">${b.icon}</span><div><b>Badge débloqué : ${b.name}</b><br><span class="small">${b.desc}</span></div></div>`).join('')}

    ${r.answers && r.mode !== 'survie' ? `${gridHtml(resultGrid(r.answers))}` : ''}

    <button class="btn primary" id="share">📣 Partager mon score</button>
    <div class="row">
      ${r.mode === 'daily' ? '' : '<button class="btn blue" id="again">↻ Rejouer</button>'}
      <button class="btn" id="home">Accueil</button>
    </div>

    ${mistakes.length ? `
      <h2>${r.mode === 'marathon' ? 'Réponses manquées' : 'À retenir'}</h2>
      <div class="mistakes">
        ${mistakes.slice(0, 60).map(m => `
          <div class="mistake">${flag(m.country.code)}
            <div><b>${esc(m.country.name)}</b>${m.kind === 'capitals' ? `<br><span class="muted">Capitale : ${esc(m.country.capital)}</span>` : ''}</div>
          </div>`).join('')}
        ${mistakes.length > 60 ? `<div class="muted center">… et ${mistakes.length - 60} autres</div>` : ''}
      </div>` : ''}
  `, () => {
    requestAnimationFrame(() => {
      const bar = document.getElementById('xpbar');
      if (bar) bar.style.width = `${(after.into / after.need) * 100}%`;
    });
    if (st === 3 || r.record || levelUp || (mood === 'happy' && earned.length)) confetti();
    const payload = prepareShare({
      title, correct: r.correct, total: r.mode === 'survie' ? null : r.total,
      score: r.mode === 'marathon' || r.mode === 'survie' ? null : r.score,
      grid: r.answers && r.mode !== 'survie' ? resultGrid(r.answers) : null,
      daily: r.mode === 'daily', survie: r.mode === 'survie',
    });
    on('#share', 'click', () => share(payload));
    on('#again', 'click', () => start(r.kind));
    on('#home', 'click', home);
  });
}

// ---------- Partage ----------
const shareTitle = p => (p.daily ? `Flag ada · Défi du jour #${dayNumber(dayKey())}` : `Flag ada · ${p.title}`);
// Prépare l'image à l'avance : sur iPhone, le partage doit suivre le toucher sans attente.
function prepareShare(p) {
  p.file = shareImage(p, shareTitle(p));
  return p;
}

async function share(p) {
  const title = shareTitle(p);
  const text = shareText({
    title, correct: p.correct, total: p.survie ? null : p.total ?? 10,
    score: p.score, grid: p.grid, url: APP_URL,
  });
  const credit = () => {
    S.shares++;
    const earned = newBadges(S, S.badges);
    S.badges.push(...earned.map(b => b.id));
    save();
    earned.forEach(b => toast(`${b.icon} Badge débloqué : ${b.name}`));
  };
  try {
    if (navigator.share) {
      const file = await (p.file || shareImage(p, title));
      const data = file && navigator.canShare?.({ files: [file] }) ? { text, files: [file] } : { text, title };
      await navigator.share(data);
      return credit();
    }
    await navigator.clipboard.writeText(text);
    toast('Score copié ! Colle-le où tu veux 📋');
    credit();
  } catch (e) {
    if (e?.name !== 'AbortError') toast('Partage impossible sur cet appareil');
  }
}

// Carte image 1080×1080 à joindre au partage (stories, WhatsApp…).
async function shareImage(p, title) {
  try {
    const W = 1080, cv = document.createElement('canvas'); cv.width = cv.height = W;
    const x = cv.getContext('2d');
    const INK = '#1f2a48', ORANGE = '#ff8a1f', FONT = '"M PLUS Rounded 1c", ui-rounded, system-ui, sans-serif';
    await document.fonts?.ready;
    // Ciel + nuages
    const sky = x.createLinearGradient(0, 0, 0, W);
    sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#c9ecff');
    x.fillStyle = sky; x.fillRect(0, 0, W, W);
    x.fillStyle = 'rgba(255,255,255,.55)';
    [[150, 120, 110, 40], [900, 90, 150, 50], [960, 1000, 120, 40]].forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); });
    // Carte autocollant : bord blanc, contour encre
    x.save(); x.translate(W / 2, 590); x.rotate(-0.025);
    x.fillStyle = 'rgba(31,42,72,.16)'; roundRect(x, -430, -280 + 22, 860, 560, 64);
    x.fillStyle = '#fff'; roundRect(x, -446, -296, 892, 592, 72);
    x.fillStyle = INK; roundRect(x, -430, -280, 860, 560, 60);
    x.fillStyle = '#fffdf7'; roundRect(x, -422, -272, 844, 544, 54);
    x.restore();
    // Mascotte
    const ratio = p.total ? p.correct / p.total : 1;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mascot(ratio >= .8 ? 'happy' : ratio >= .5 ? 'lost' : 'dizzy'));
    await img.decode();
    x.drawImage(img, W / 2 - 150, 20, 300, 300);
    // Textes
    x.textAlign = 'center'; x.lineJoin = 'round';
    x.fillStyle = INK; x.font = `900 46px ${FONT}`;
    x.fillText(title.replace('Flag ada · ', ''), W / 2, 400);
    x.font = `900 220px ${FONT}`; x.lineWidth = 16; x.strokeStyle = INK;
    const big = p.survie ? `${p.correct}` : `${p.correct}/${p.total ?? 10}`;
    x.strokeText(big, W / 2, 610); x.fillStyle = ORANGE; x.fillText(big, W / 2, 610);
    if (p.score != null) {
      x.fillStyle = INK; x.font = `800 56px ${FONT}`;
      x.fillText(`${p.score.toLocaleString('fr-FR')} pts`, W / 2, 690);
    }
    if (p.grid) {
      const cells = [...p.grid.matchAll(/🟩|🟨|🟥/gu)].map(m => m[0]);
      const size = 58, gap = 14, w = cells.length * (size + gap) - gap;
      cells.forEach((c, i) => {
        const X = (W - w) / 2 + i * (size + gap);
        x.fillStyle = INK; roundRect(x, X, 740, size, size, 14);
        x.fillStyle = c === '🟩' ? '#36c27a' : c === '🟨' ? '#ffc93c' : '#ff5c5c';
        roundRect(x, X + 5, 745, size - 10, size - 10, 10);
      });
    }
    x.fillStyle = INK; x.font = `900 64px ${FONT}`;
    x.fillText('Flag ada', W / 2, 985);
    x.fillStyle = '#5d6a8c'; x.font = `700 32px ${FONT}`;
    x.fillText(`Tu fais mieux ? ${APP_URL.replace(/^https?:\/\//, '')}`, W / 2, 1036);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return blob ? new File([blob], 'flag-ada.png', { type: 'image/png' }) : null;
  } catch { return null; }
}
function roundRect(x, X, Y, w, h, r) {
  x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.fill();
}

// ---------- Profil ----------
function profile() {
  const lv = levelFromXp(S.xp);
  const recs = Object.entries(S.records);
  render(`
    <header class="row">
      <button class="icon-btn" id="back" aria-label="Retour">←</button>
      <h2 class="grow">Profil</h2>
      <button class="icon-btn" id="sound" aria-label="Son">${S.sound ? '🔊' : '🔇'}</button>
    </header>
    <div class="card level-card row">
      <div class="lvl">${lv.level}</div>
      <div class="grow"><b>${titleFor(lv.level)}</b><div class="muted small">${S.xp.toLocaleString('fr-FR')} XP au total</div></div>
    </div>
    <div class="stat-grid">
      <div class="stat"><b>${S.games}</b><span>parties</span></div>
      <div class="stat"><b>${S.correct}</b><span>bonnes réponses</span></div>
      <div class="stat"><b>🔥 ${S.bestStreak}</b><span>meilleure série</span></div>
    </div>
    <h2>Badges <span class="muted small">${S.badges.length}/${BADGES.length}</span></h2>
    <div class="badges">
      ${BADGES.map(b => `<div class="badge ${S.badges.includes(b.id) ? '' : 'locked'}"><span class="ico">${b.icon}</span><b>${b.name}</b><span class="muted">${b.desc}</span></div>`).join('')}
    </div>
    <h2>Records</h2>
    <div class="card">
      ${recs.length ? recs.map(([k, v]) => {
        const [mode, kind, region] = k.split('-');
        return `<div class="list-row"><span>${MODES[mode].icon} ${KIND[kind].label} · ${REGIONS[region].label}</span><b>${formatRecord(mode, v)}</b></div>`;
      }).join('') : '<div class="muted center">Joue une partie pour établir tes records !</div>'}
    </div>
    <button class="btn ghost" id="reset">Réinitialiser ma progression</button>
  `, () => {
    on('#back', 'click', home);
    on('#sound', 'click', () => { S.sound = !S.sound; save(); profile(); });
    on('#reset', 'click', () => {
      if (confirm('Effacer tous tes scores, badges et niveaux ?')) { S = { ...DEFAULT, badges: [], records: {}, marathonDone: [] }; save(); home(); }
    });
  });
}

// ---------- Démarrage ----------
home();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
