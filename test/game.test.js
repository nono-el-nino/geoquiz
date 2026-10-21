import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, normalize, acceptedAnswers, countriesFor } from '../js/data.js';
import { makeQuiz, dailyQuiz, matchTyped, questionPoints, levelFromXp, updateStreak, newBadges, shareText } from '../js/game.js';

test('193 pays ONU, codes uniques, 6 zones', () => {
  assert.equal(COUNTRIES.length, 193);
  assert.equal(new Set(COUNTRIES.map(c => c.code)).size, 193);
  const sum = ['af', 'eu', 'as', 'am', 'oc'].reduce((n, r) => n + countriesFor(r).length, 0);
  assert.equal(sum, 193);
});

test('aucune réponse acceptée ne désigne deux pays différents', () => {
  for (const kind of ['flags', 'capitals']) {
    const owner = new Map();
    for (const c of COUNTRIES) for (const a of acceptedAnswers(c, kind)) {
      assert.ok(!owner.has(a) || owner.get(a) === c.code, `${kind}: "${a}" ambigu (${owner.get(a)} / ${c.code})`);
      owner.set(a, c.code);
    }
  }
});

test('normalisation : accents, tirets, apostrophes', () => {
  assert.equal(normalize("Côte d'Ivoire"), 'cotedivoire');
  assert.equal(normalize('  Pays-Bas '), 'paysbas');
  assert.equal(normalize('Chișinău'), 'chisinau');
});

test('QCM : 4 choix distincts dont la bonne réponse', () => {
  for (const kind of ['flags', 'capitals']) for (const q of makeQuiz({ kind, count: 193 })) {
    assert.equal(q.choices.length, 4);
    assert.ok(q.choices.some(c => c.code === q.country.code));
    const labels = q.choices.map(c => (kind === 'flags' ? c.name : c.capital));
    assert.equal(new Set(labels).size, 4);
  }
});

test('défi du jour identique pour tout le monde, différent chaque jour', () => {
  const a = dailyQuiz('2026-10-21').map(q => q.country.code + q.choices.map(c => c.code).join());
  const b = dailyQuiz('2026-10-21').map(q => q.country.code + q.choices.map(c => c.code).join());
  const c = dailyQuiz('2026-10-22').map(q => q.country.code);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map(x => x.slice(0, 2)), c);
});

test('Marathon : attend quand la saisie est le début d\'une autre réponse', () => {
  assert.deepEqual(matchTyped('niger', COUNTRIES, 'flags').wait, true);
  assert.equal(matchTyped('nigéria', COUNTRIES, 'flags').country.code, 'ng');
  assert.equal(matchTyped('NIGER', COUNTRIES.filter(c => c.code !== 'ng'), 'flags').wait, false);
  assert.equal(matchTyped('rdc', COUNTRIES, 'flags').country.code, 'cd');
  assert.equal(matchTyped('ouaga', COUNTRIES, 'capitals'), null);
  assert.equal(matchTyped('ouagadougou', COUNTRIES, 'capitals').country.code, 'bf');
});

test('score, niveaux, série', () => {
  assert.equal(questionPoints(false, 9, 5), 0);
  assert.equal(questionPoints(true, 10, 1), 200);
  assert.equal(questionPoints(true, 0, 3), 150);
  assert.deepEqual(levelFromXp(0), { level: 1, into: 0, need: 100 });
  assert.equal(levelFromXp(100).level, 2);
  const s = { streak: 4, lastPlayed: '2026-10-20' };
  assert.equal(updateStreak(s, '2026-10-21'), 5);
  assert.equal(updateStreak(s, '2026-10-21'), 5);
  assert.equal(updateStreak(s, '2026-10-25'), 1);
});

test('badges et texte de partage', () => {
  const ids = newBadges({ games: 1, correct: 120, bestStreak: 3 }, []).map(b => b.id);
  assert.deepEqual(ids.sort(), ['c100', 'first', 'streak3']);
  const t = shareText({ title: 'Défi du jour #294', correct: 8, total: 10, score: 1520, grid: '🟩🟥', url: 'https://x.y/' });
  assert.match(t, /8\/10 · 1\s?520 pts/);
  assert.match(shareText({ title: 'Survie', correct: 12, total: null, url: 'u' }), /12 bonnes réponses/);
});

import { checkTyped, suggest, hintFor, answerIndex } from '../js/game.js';
const C = code => COUNTRIES.find(c => c.code === code);

test('Saisie : fautes de frappe et noms partiels acceptés', () => {
  for (const [input, code, kind] of [
    ['burkina', 'bf', 'flags'], ['Burkina Fasso', 'bf', 'flags'], ['zambei', 'zm', 'flags'],
    ['equatoriale', 'gq', 'flags'], ['etats unis', 'us', 'flags'], ['rdc', 'cd', 'flags'],
    ['ouagadougu', 'bf', 'capitals'], ['moresby', 'pg', 'capitals'], ['canbera', 'au', 'capitals'], ['delhi', 'in', 'capitals'],
  ]) assert.ok(checkTyped(input, C(code), kind).ok, `${input} devrait être accepté`);
});

test('Saisie : refuse les réponses ambiguës ou qui désignent un autre pays', () => {
  for (const [input, code, kind] of [
    ['gambie', 'zm', 'flags'], ['corée', 'kr', 'flags'], ['guinée', 'gq', 'flags'], ['niger', 'ng', 'flags'],
    ['irak', 'ir', 'flags'], ['soudan', 'ss', 'flags'], ['congo', 'cd', 'flags'], ['sydney', 'au', 'capitals'], ['port', 'pg', 'capitals'],
  ]) assert.ok(!checkTyped(input, C(code), kind).ok, `${input} devrait être refusé`);
});

test('Saisie : la bonne réponse complète est toujours acceptée, pour les 193 pays', () => {
  for (const kind of ['flags', 'capitals']) for (const c of COUNTRIES) {
    assert.ok(checkTyped(kind === 'flags' ? c.name : c.capital, c, kind).ok, `${kind} ${c.name}`);
  }
});

test('Un mot partiel ne désigne jamais deux pays', () => {
  for (const kind of ['flags', 'capitals']) {
    const seen = new Map();
    for (const [code, { parts }] of answerIndex(kind)) for (const p of parts) {
      assert.ok(!seen.has(p), `${p} : ${seen.get(p)} / ${code}`); seen.set(p, code);
    }
  }
});

test('aide à la saisie et indice', () => {
  assert.deepEqual(suggest('bu', 'flags'), ['Bulgarie', 'Burkina Faso', 'Burundi']);
  assert.deepEqual(suggest('b', 'flags'), []);
  assert.equal(hintFor('Port-Louis'), 'P _ _ _ - _ _ _ _ _');
});
