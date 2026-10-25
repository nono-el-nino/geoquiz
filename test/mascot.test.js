import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mascot, MIGO_STATES } from '../js/mascot.js';

test('Migo : cinq états accessibles et quatre parties indépendantes', () => {
  for (const state of MIGO_STATES) {
    const svg = mascot(state);
    assert.ok(svg.includes(`migo ${state}`));
    assert.match(svg, /role="img" aria-label="Migo /);
    for (const part of ['body', 'beak', 'wing', 'eye']) assert.ok(svg.includes(`class="migo-${part}"`));
    assert.doesNotMatch(svg, /<image|<text|<filter|gradient/);
  }
});
test('Migo : compatibilité des anciens états de présentation', () => {
  assert.equal(mascot('lost'), mascot('neutral'));
  assert.equal(mascot('dizzy'), mascot('missed'));
  assert.equal(mascot('unknown'), mascot('neutral'));
  assert.match(mascot('focused'), /fill="#FF9466"/);
  assert.match(mascot('missed'), /fill="#8592A6"/);
});
