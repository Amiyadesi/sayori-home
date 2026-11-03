/**
 * Pure physics and collision math for the classic luminous breakout game.
 * Decoupled from DOM rendering for deterministic behavior and unit testability.
 */

export const FIXED_DT = 1 / 120; // 120 Hz fixed physics step
export const MAX_ACCUMULATOR = 0.05; // 50ms hidden-tab / lag gap clamp
export const DEFAULT_MIN_SPEED = 460;
export const DEFAULT_MAX_SPEED = 820;
export const DEFAULT_MIN_VY = 180;
export const DEFAULT_BALL_RADIUS = 10;
export const DEFAULT_PADDLE_WIDTH = 138;
export const DEFAULT_PADDLE_HEIGHT = 16;
export const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60 degrees from vertical

/**
 * Computes deflection when the ball strikes the bottom paddle.
 * Deflection angle is proportional to the contact offset from paddle center.
 * Strictly guarantees |vy| >= minVy to prevent endless horizontal bouncing.
 */
export function computePaddleDeflection(
  ballX,
  paddleX,
  paddleWidth = DEFAULT_PADDLE_WIDTH,
  currentVx = 0,
  currentVy = 0,
  options = {}
) {
  const minSpeed = options.minSpeed || DEFAULT_MIN_SPEED;
  const maxSpeed = options.maxSpeed || DEFAULT_MAX_SPEED;
  const minVy = options.minVy || DEFAULT_MIN_VY;
  const speedBoost = options.speedBoost || 1.025;

  const halfWidth = Math.max(16, paddleWidth * 0.5);
  const centerX = paddleX + halfWidth;
  const rawOffset = (ballX - centerX) / halfWidth;
  const offset = Math.max(-1, Math.min(1, rawOffset));

  // Current incoming speed or minimum speed
  const currentSpeed = Math.hypot(currentVx, currentVy);
  const targetSpeed = Math.max(minSpeed, Math.min(maxSpeed, (currentSpeed || minSpeed) * speedBoost));

  // Angle ranges from -MAX_BOUNCE_ANGLE to +MAX_BOUNCE_ANGLE
  const theta = offset * MAX_BOUNCE_ANGLE;
  let vx = targetSpeed * Math.sin(theta);
  let vy = -Math.abs(targetSpeed * Math.cos(theta));

  // Guarantee minimum vertical velocity so ball always clears upward
  if (Math.abs(vy) < minVy) {
    const signVy = -1;
    vy = signVy * minVy;
    const remainingSq = targetSpeed * targetSpeed - vy * vy;
    const signVx = vx >= 0 ? 1 : -1;
    vx = signVx * Math.sqrt(Math.max(0, remainingSq));
  }

  return {
    vx,
    vy,
    speed: Math.hypot(vx, vy),
    offset,
  };
}

/**
 * Continuous ray vs expanded AABB collision test (Minkowski sum for sphere).
 * Tests segment (x, y) -> (x + dx, y + dy) against box [bx, by, bw, bh] with radius r.
 * Returns earliest intersection t in [0, 1] and surface normal.
 */
export function intersectSweptSphereAABB(
  x,
  y,
  dx,
  dy,
  boxX,
  boxY,
  boxW,
  boxH,
  radius = DEFAULT_BALL_RADIUS
) {
  // If no motion, return no hit
  if (dx === 0 && dy === 0) {
    return { hit: false, t: 1, normalX: 0, normalY: 0 };
  }

  const minX = boxX - radius;
  const maxX = boxX + boxW + radius;
  const minY = boxY - radius;
  const maxY = boxY + boxH + radius;

  // Already strictly inside expanded box: eject along shallowest penetration axis
  if (x > minX && x < maxX && y > minY && y < maxY) {
    const dLeft = x - minX;
    const dRight = maxX - x;
    const dTop = y - minY;
    const dBottom = maxY - y;
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    let nx = 0, ny = 0;
    if (minD === dLeft) nx = -1;
    else if (minD === dRight) nx = 1;
    else if (minD === dTop) ny = -1;
    else ny = 1;
    return { hit: true, t: 0, normalX: nx, normalY: ny, penetration: minD };
  }

  let tNearX = -Infinity, tFarX = Infinity;
  let tNearY = -Infinity, tFarY = Infinity;
  let normalNearX = 0, normalNearY = 0;

  if (dx !== 0) {
    const invDx = 1 / dx;
    const t1 = (minX - x) * invDx;
    const t2 = (maxX - x) * invDx;
    if (t1 < t2) {
      tNearX = t1;
      tFarX = t2;
      normalNearX = -1;
    } else {
      tNearX = t2;
      tFarX = t1;
      normalNearX = 1;
    }
  } else {
    if (x < minX || x > maxX) return { hit: false, t: 1, normalX: 0, normalY: 0, penetration: 0 };
  }

  if (dy !== 0) {
    const invDy = 1 / dy;
    const t1 = (minY - y) * invDy;
    const t2 = (maxY - y) * invDy;
    if (t1 < t2) {
      tNearY = t1;
      tFarY = t2;
      normalNearY = -1;
    } else {
      tNearY = t2;
      tFarY = t1;
      normalNearY = 1;
    }
  } else {
    if (y < minY || y > maxY) return { hit: false, t: 1, normalX: 0, normalY: 0, penetration: 0 };
  }

  const tEnter = Math.max(tNearX, tNearY);
  const tExit = Math.min(tFarX, tFarY);

  if (tEnter > tExit || tExit < 0 || tEnter > 1 || tEnter < 0) {
    return { hit: false, t: 1, normalX: 0, normalY: 0, penetration: 0 };
  }

  const t = Math.max(0, tEnter);
  let normalX = 0, normalY = 0;
  if (Math.abs(tNearX - tNearY) <= 1e-7) {
    const len = Math.hypot(normalNearX, normalNearY) || 1;
    normalX = normalNearX / len;
    normalY = normalNearY / len;
  } else if (tNearX > tNearY) {
    normalX = normalNearX;
  } else {
    normalY = normalNearY;
  }

  // Must be moving into the surface normal
  if (dx * normalX + dy * normalY >= 0) {
    return { hit: false, t: 1, normalX: 0, normalY: 0, penetration: 0 };
  }

  return { hit: true, t, normalX, normalY, penetration: 0 };
}

/**
 * Reflects velocity off a surface normal (normalizing non-unit normals first)
 * while preserving bounded speed and enforcing minimum vertical velocity.
 */
export function reflectVelocity(vx, vy, normalX, normalY, options = {}) {
  const minVy = options.minVy || DEFAULT_MIN_VY;
  const maxSpeed = options.maxSpeed || DEFAULT_MAX_SPEED;
  const nLen = Math.hypot(normalX, normalY);
  if (!nLen) return { vx, vy };
  const nx = normalX / nLen;
  const ny = normalY / nLen;

  const incomingSpeed = Math.hypot(vx, vy);
  const dot = vx * nx + vy * ny;
  let rx = vx - 2 * dot * nx;
  let ry = vy - 2 * dot * ny;

  const targetSpeed = Math.min(maxSpeed, incomingSpeed || DEFAULT_MIN_SPEED);

  // Prevent pure horizontal trap loops while preserving bounded speed
  if (Math.abs(ry) < minVy) {
    const signY = ry === 0 ? (ny >= 0 ? 1 : -1) : Math.sign(ry);
    ry = signY * minVy;
    if (targetSpeed > minVy) {
      const signX = rx === 0 ? (nx >= 0 ? 1 : -1) : Math.sign(rx);
      rx = signX * Math.sqrt(Math.max(0, targetSpeed * targetSpeed - ry * ry));
    }
  } else if (incomingSpeed > maxSpeed) {
    const outSpeed = Math.hypot(rx, ry) || 1;
    rx = (rx / outSpeed) * maxSpeed;
    ry = (ry / outSpeed) * maxSpeed;
  }

  return { vx: rx, vy: ry };
}

/**
 * Steps single ball movement through colliders, bounds, and paddle for a fixed dt.
 * Wall t is computed as segment fraction [0, 1] using dx/dy.
 * Resolves overlap penetration and prevents duplicate contacts with the same collider in one step.
 */
export function stepBallSubstep({
  ball,
  colliders = [],
  paddle = null,
  bounds = { width: 1440, height: 2500 },
  dt = FIXED_DT,
}) {
  let { x, y, vx, vy, radius = DEFAULT_BALL_RADIUS } = ball;
  let remainingDt = dt;
  let hitCollider = null;
  let hitCount = 0;
  let hitPaddle = false;
  let hitWall = false;
  let lost = false;
  const contactedColliders = new Set();

  // Maximum sub-iterations per dt to handle corner/wall combinations cleanly
  for (let iter = 0; iter < 4 && remainingDt > 1e-6; iter++) {
    const dx = vx * remainingDt;
    const dy = vy * remainingDt;
    if (dx === 0 && dy === 0) break;

    let nearestT = 1;
    let normalX = 0;
    let normalY = 0;
    let penetration = 0;
    let collisionType = null;
    let hitObject = null;

    // Left wall (segment fraction in [0, 1] using dx)
    if (dx < 0 && x + dx < radius) {
      const t = Math.max(0, Math.min(1, (radius - x) / dx));
      if (t <= nearestT) {
        nearestT = t;
        normalX = 1;
        normalY = 0;
        penetration = x < radius ? radius - x : 0;
        collisionType = 'wall-left';
        hitObject = null;
      }
    }
    // Right wall (segment fraction in [0, 1] using dx)
    if (dx > 0 && x + dx > bounds.width - radius) {
      const t = Math.max(0, Math.min(1, (bounds.width - radius - x) / dx));
      if (t <= nearestT) {
        nearestT = t;
        normalX = -1;
        normalY = 0;
        penetration = x > bounds.width - radius ? x - (bounds.width - radius) : 0;
        collisionType = 'wall-right';
        hitObject = null;
      }
    }
    // Top wall (segment fraction in [0, 1] using dy)
    if (dy < 0 && y + dy < radius) {
      const t = Math.max(0, Math.min(1, (radius - y) / dy));
      if (t <= nearestT) {
        nearestT = t;
        normalX = 0;
        normalY = 1;
        penetration = y < radius ? radius - y : 0;
        collisionType = 'wall-top';
        hitObject = null;
      }
    }

    // Check paddle collision if ball is descending
    if (paddle && vy > 0 && !hitPaddle) {
      const paddleHit = intersectSweptSphereAABB(
        x,
        y,
        dx,
        dy,
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height,
        radius
      );
      if (paddleHit.hit && paddleHit.t <= nearestT && paddleHit.normalY < 0) {
        nearestT = paddleHit.t;
        normalX = paddleHit.normalX;
        normalY = paddleHit.normalY;
        penetration = paddleHit.penetration || 0;
        collisionType = 'paddle';
        hitObject = null;
      }
    }

    // Check colliders (skip already-broken or already-contacted colliders in this step)
    for (const col of colliders) {
      if (col.broken || col.hp <= 0 || contactedColliders.has(col)) continue;
      const res = intersectSweptSphereAABB(
        x,
        y,
        dx,
        dy,
        col.x,
        col.y,
        col.width,
        col.height,
        radius
      );
      if (res.hit && res.t < nearestT) {
        nearestT = res.t;
        normalX = res.normalX;
        normalY = res.normalY;
        penetration = res.penetration || 0;
        collisionType = 'collider';
        hitObject = col;
      }
    }

    if (!collisionType) {
      // Free move for the rest of the step
      x += dx;
      y += dy;
      remainingDt = 0;
      break;
    }

    // Advance ball to contact point
    x += dx * nearestT;
    y += dy * nearestT;
    const consumedFraction = nearestT > 0 ? nearestT : 0.25;
    remainingDt = Math.max(0, remainingDt * (1 - consumedFraction));

    if (collisionType === 'paddle') {
      const deflection = computePaddleDeflection(x, paddle.x, paddle.width, vx, vy);
      vx = deflection.vx;
      vy = deflection.vy;
      hitPaddle = true;
      y = paddle.y - radius - 0.5;
    } else if (collisionType === 'collider') {
      contactedColliders.add(hitObject);
      // Only reflect if moving into the normal
      if (vx * normalX + vy * normalY < 0) {
        const reflected = reflectVelocity(vx, vy, normalX, normalY);
        vx = reflected.vx;
        vy = reflected.vy;
      }
      const pushDist = (penetration > 0 ? penetration : 0) + 0.5;
      x += normalX * pushDist;
      y += normalY * pushDist;
      hitCount++;
      if (!hitCollider) {
        hitCollider = { collider: hitObject, normalX, normalY, x, y };
      }
    } else if (collisionType.startsWith('wall')) {
      if (vx * normalX + vy * normalY < 0) {
        const reflected = reflectVelocity(vx, vy, normalX, normalY);
        vx = reflected.vx;
        vy = reflected.vy;
      }
      const pushDist = (penetration > 0 ? penetration : 0) + 0.5;
      x += normalX * pushDist;
      y += normalY * pushDist;
      hitWall = true;
    }
  }

  // Check if ball fell below document floor (loss condition)
  const floorThreshold = paddle ? paddle.y + paddle.height + 40 : bounds.height;
  if (y > floorThreshold) {
    lost = true;
  }

  return {
    ball: { x, y, vx, vy, radius },
    hitCollider,
    hitCount,
    hitPaddle,
    hitWall,
    lost,
  };
}

/**
 * Advances simulation state using a fixed-timestep accumulator with hidden-tab gap clamping.
 * Guarantees identical state across 60Hz, 120Hz, 144Hz, and irregular frame timings for equal elapsed time.
 */
export function stepPhysicsWithAccumulator(state, frameElapsed, onSubstep = null) {
  const clampedElapsed = Math.max(0, Math.min(MAX_ACCUMULATOR, Number(frameElapsed) || 0));
  state.accumulator = Math.min(MAX_ACCUMULATOR, (state.accumulator || 0) + clampedElapsed);

  let stepsRun = 0;
  let lost = false;

  // Use 1e-9 epsilon to avoid IEEE-754 drift on 1/60 or 1/144 sums
  while (state.accumulator + 1e-9 >= FIXED_DT) {
    state.accumulator = Math.max(0, state.accumulator - FIXED_DT);
    stepsRun++;
    const stepRes = stepBallSubstep({
      ball: state.ball,
      colliders: state.colliders || [],
      paddle: state.paddle || null,
      bounds: state.bounds || { width: 1440, height: 2500 },
      dt: FIXED_DT,
    });
    state.ball = stepRes.ball;
    if (typeof onSubstep === 'function') {
      onSubstep(stepRes);
    }
    if (stepRes.lost) {
      lost = true;
      break;
    }
  }

  return { stepsRun, lost, ball: state.ball, accumulator: state.accumulator };
}

/**
 * Camera calculation in document coordinates:
 * - When ball is ascending (vy < 0), camera smoothly moves upward with ball.
 * - When ball is descending (vy > 0), camera does NOT track ball all the way down,
 *   allowing ball to reach the paddle and naturally miss if paddle misses.
 * - Time-based movement with bounded catch-up rate (no teleports).
 */
export function updateCameraY({
  currentCameraY,
  ballY,
  ballVy,
  viewHeight = 1000,
  docHeight = 2500,
  dt = FIXED_DT,
  maxCameraSpeed = 520, // px per second
  lookAheadRatio = 0.45,
}) {
  const maxScrollY = Math.max(0, docHeight - viewHeight);
  let targetCameraY = currentCameraY;

  if (ballVy < 0) {
    // Ball moving upward: target camera so ball sits in upper-middle viewport
    const desiredY = ballY - viewHeight * lookAheadRatio;
    targetCameraY = Math.max(0, Math.min(maxScrollY, desiredY));
  } else {
    // Ball moving downward: hold camera steady so paddle does not shift or evade the ball
    targetCameraY = currentCameraY;
  }

  const diff = targetCameraY - currentCameraY;
  const maxStep = maxCameraSpeed * dt;
  if (Math.abs(diff) <= maxStep) {
    return targetCameraY;
  }
  return currentCameraY + Math.sign(diff) * maxStep;
}
