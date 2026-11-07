import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitFlight, segmentCircle } from '../public/p34-orbit-core.js';

test('a timed release travels to the next moon; a miss returns to the same checkpoint', () => {
  const g = new OrbitFlight({ version: 'guided' });
  g.release();
  for (let i = 0; i < 240 && g.current === 0; i++) g.step(1 / 120);
  assert.equal(g.current, 1);
  assert.equal(g.phase, 'orbit');
  assert.deepEqual(g.route, [0, 1]);
  const wild = new OrbitFlight();
  wild.release();
  for (let i = 0; i < 600 && wild.phase !== 'orbit'; i++) wild.step(1 / 120);
  assert.equal(wild.current, 0);
  assert.equal(wild.misses, 1);
  assert.ok(Number.isFinite(wild.bird.x));
});

function flyTo(game, node) {
  for (let i = 0; i < 1800; i++) {
    const angle = game.direction(), moon = game.moons[node];
    const end = { x: game.bird.x + Math.cos(angle) * 900, y: game.bird.y + Math.sin(angle) * 900 };
    if (segmentCircle(game.bird, end, moon, moon.r * .5) !== null) { game.release(); break; }
    game.step(1 / 120);
  }
  for (let i = 0; i < 500 && game.phase === 'flight'; i++) game.step(1 / 120);
  assert.equal(game.current, node);
}

test('all three versions can finish through actual timing; the old detour leads beyond the published route', () => {
  for (const version of ['draft', 'tuned', 'guided']) {
    const g = new OrbitFlight({ version });
    for (const node of [1, 2, 3, 4]) flyTo(g, node);
    assert.equal(g.phase, 'won'); assert.equal(g.misses, 0);
    assert.equal(g.report().won, true);
  }
  const search = new OrbitFlight({ version: 'tuned', seeking: true, start: 1 });
  for (const node of [5, 6]) flyTo(search, node);
  assert.equal(search.phase, 'found');
  assert.equal(new OrbitFlight({ version: 'guided', start: 1 }).destinations.includes(5), false);
});

test('holding gives aiming time, cancellation does not launch; tuning increases capture without removing the detour', () => {
  const a = new OrbitFlight(), b = new OrbitFlight({ version: 'tuned' });
  a.held = true; a.step(.2); b.step(.2);
  assert.ok(a.angle < b.angle);
  a.held = false; assert.equal(a.shots, 0);
  assert.ok(a.rules.capture < b.rules.capture);
  assert.equal(b.rules.branch, true);
  const trial = new OrbitFlight({ version: 'guided', workshop: [320, -210] });
  flyTo(trial, 1); assert.equal(trial.phase, 'won');
});
