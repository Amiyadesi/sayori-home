import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoute, launch, stepBall, advanceClock } from '../public/p34-pinball-physics.js';
import { newPlayState, parsePlayState, serializePlayState, completeRoute, installUpdate } from '../public/p34-play-state.js';
import { mountNativeHome } from '../public/p34-home.js';

test('normal home does not initialize a world, DOM or audio', () => {
  globalThis.location = { search: '' };
  try { mountNativeHome()(); } finally { delete globalThis.location; }
});

test('three page routes are solvable, including narrow screens and the link brake', () => {
  for (const width of [340, 1200]) for (const route of [0, 1, 2]) for (const edition of [1, 2]) {
    const arena = createRoute(width, route === 2 ? 1400 : 800, route, edition);
    if (route) arena.rails[0].y = arena.portals[0].y;
    if (route === 2) Object.assign(arena.rails[1], { x: arena.goal.x, y: arena.portals[1].y });
    const ball = launch(arena.source, { x: 0, y: -1 }, arena.speed);
    let won = false, held = false;
    for (let i = 0; i < 1680 && ball.active; i++) {
      const events = stepBall(ball, arena);
      if (ball.held) { held = true; ball.held = false; }
      won ||= events.some(e => e.type === 'win');
    }
    assert.equal(won, true, `${width}/${route}/${edition}`);
    assert.equal(held, route > 0 && edition === 2);
  }
});
test('60 and 144 Hz renders advance the same fixed physics; long hidden gaps are bounded', () => {
  const results = [60, 144].map(hz => {
    const arena = createRoute(1100, 900, 0), ball = launch(arena.source, { x: .2, y: -1 }, arena.speed);
    const clock = { accumulator: 0 };
    for (let i = 0; i < hz * 2; i++) advanceClock(clock, 1 / hz, dt => stepBall(ball, arena, dt));
    return [ball.x, ball.y, ball.hits];
  });
  assert.deepEqual(results[0], results[1]);
  let steps = 0; advanceClock({ accumulator: 0 }, 90, () => steps++); assert.equal(steps, 12);
  assert.throws(() => launch({ x: 0, y: 0 }, { x: 0, y: 0 }, 1), RangeError);
});
test('the goal explains missing route steps once, and accepts a completed route', () => {
  const arena = createRoute(1000, 800, 1), ball = launch(arena.goal, { x: 1, y: 0 }, 1);
  assert.ok(stepBall(ball, arena).some(e => e.type === 'goal-blocked' && e.reflections === 1 && e.link));
  assert.ok(!stepBall(ball, arena).some(e => e.type === 'goal-blocked'));
  ball.hits = arena.required; ball.portals = 1;
  assert.ok(stepBall(ball, arena).some(e => e.type === 'win'));
});
test('update follows actual play, preserves the first edition, and rejects corrupt saves', () => {
  let state = newPlayState(); assert.throws(() => installUpdate(state));
  for (let route = 0; route < 3; route++) state = completeRoute(state, { route, edition: 1, shots: 2, hits: route + 1 });
  state = installUpdate(state); assert.equal(state.edition, 2); assert.equal(state.first, 7);
  state = completeRoute(state, { route: 0, edition: 2, shots: 1, hits: 2 }); assert.equal(state.first, 7); assert.equal(state.second, 1); assert.equal(state.best, 3);
  assert.deepEqual(parsePlayState(serializePlayState(state)), state);
  for (const bad of ['1.1.3.7.0.0.5', 'NaN', '1.1.2.99.0.0.0', '1.1.1.0.0.0.99999']) assert.deepEqual(parsePlayState(bad), newPlayState());
});
