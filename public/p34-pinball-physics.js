export const STEP = 1 / 120;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function createRoute(width, height, route, edition = 1) {
  const y = route === 2 ? .64 : .5;
  return {
    width, height, route, edition, speed: clamp(width * .68, 250, 850),
    source: { x: width * .18, y: height * .84 },
    rails: [
      { x: width * .18, y: height * y, length: clamp(width * .2, 110, 260), angle: -45, id: 'a' },
      { x: width * .62, y: height * .32, length: clamp(width * .2, 110, 260), angle: -45, id: 'b' },
    ].slice(0, route === 2 ? 2 : 1),
    portals: route ? [{ x: width * .72, y: height * (route === 2 ? .64 : .4) }, { x: width * .26, y: height * .24 }] : [],
    goal: { x: width * (route === 2 ? .82 : .8), y: height * (route === 0 ? .5 : route === 1 ? .24 : .08), r: 38 },
    required: route === 2 ? 2 : 1,
  };
}
export function launch(source, direction, speed) {
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length < .001 || !Number.isFinite(speed) || speed <= 0) throw new RangeError('Invalid launch');
  return { x: source.x, y: source.y, px: source.x, py: source.y, vx: direction.x / length * speed, vy: direction.y / length * speed, r: 7, time: 0, cooldown: 0, hits: 0, portals: 0, active: true, held: false, goalTouch: false };
}
export function reflectRail(ball, rail) {
  const a = rail.angle * Math.PI / 180, tx = Math.cos(a), ty = Math.sin(a);
  const along = clamp((ball.x - rail.x) * tx + (ball.y - rail.y) * ty, -rail.length / 2, rail.length / 2);
  const dx = ball.x - rail.x - along * tx, dy = ball.y - rail.y - along * ty;
  const distance = Math.hypot(dx, dy), radius = ball.r + 9;
  if (distance >= radius) return false;
  const nx = distance > .0001 ? dx / distance : -ty, ny = distance > .0001 ? dy / distance : tx;
  ball.x += nx * (radius - distance + .02); ball.y += ny * (radius - distance + .02);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return false;
  ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
  ball.hits++;
  return true;
}
export function stepBall(ball, arena, dt = STEP) {
  const events = [];
  if (!ball.active || ball.held) return events;
  ball.px = ball.x; ball.py = ball.y; ball.time += dt; ball.cooldown = Math.max(0, ball.cooldown - dt);
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
  if (ball.x > arena.width - ball.r) { ball.x = arena.width - ball.r; ball.vx = -Math.abs(ball.vx); }
  if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
  for (const rail of arena.rails) if (reflectRail(ball, rail)) events.push({ type: 'rail', id: rail.id });
  if (arena.portals.length && !ball.cooldown && Math.hypot(ball.x - arena.portals[0].x, ball.y - arena.portals[0].y) < 30) {
    ball.x = arena.portals[1].x + 38; ball.y = arena.portals[1].y;
    ball.px = ball.x; ball.py = ball.y; ball.cooldown = .4; ball.portals++;
    ball.vx = arena.speed; ball.vy = 0;
    if (arena.edition === 2) ball.held = true;
    events.push({ type: ball.held ? 'hold' : 'portal' });
  }
  const atGoal = Math.hypot(ball.x - arena.goal.x, ball.y - arena.goal.y) < arena.goal.r + ball.r;
  if (atGoal) {
    if (ball.hits >= arena.required && (!arena.route || ball.portals)) {
      ball.active = false; events.push({ type: 'win' });
    } else if (!ball.goalTouch) events.push({ type: 'goal-blocked', reflections: Math.max(0, arena.required - ball.hits), link: Boolean(arena.route && !ball.portals) });
  }
  ball.goalTouch = atGoal;
  if (ball.y > arena.height + 40 || ball.time > 14) { ball.active = false; events.push({ type: 'miss' }); }
  return events;
}
export function advanceClock(clock, seconds, step) {
  clock.accumulator += Math.min(Math.max(seconds, 0), .1);
  while (clock.accumulator + 1e-10 >= STEP) { step(STEP); clock.accumulator -= STEP; }
  return clamp(clock.accumulator / STEP, 0, 1);
}
