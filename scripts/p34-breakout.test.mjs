import test from 'node:test';
import assert from 'node:assert/strict';
import { BreakoutGame, sweepBall } from '../public/p34-breakout-core.js';
import { STAGES, SAMPLE, WORKSHOP, createBricks } from '../public/p34-breakout-levels.js';

test('campaign contains real multi-brick layouts and mixed durability on both aspect ratios', () => {
  assert.ok(STAGES.length >= 20);
  for (const width of [600, 1200]) for (const level of STAGES) {
    const bricks = createBricks(level, width, 900);
    assert.ok(bricks.length >= 15, level.name);
    assert.equal(new Set(bricks.map(b => `${b.x},${b.y}`)).size, bricks.length);
    assert.ok(bricks.every(b => b.x-b.w/2>0 && b.x+b.w/2<width && b.hp>=1 && b.hp<=3));
    assert.ok(bricks.some(b => b.hp > 1), level.name);
  }
  assert.ok(STAGES.some(s=>s.rows.join('').includes('3')));
});

test('two- and three-hit bricks lose one layer per actual impact and do not score twice', () => {
  const game = new BreakoutGame({level:STAGES[0]});
  const brick = game.bricks.find(b=>b.hp===2);
  game.damage(brick, 1); assert.equal(brick.hp,1); assert.ok(game.bricks.includes(brick));
  game.damage(brick, 1); assert.equal(brick.hp,0);
  const score=game.score; game.damage(brick, 1); assert.equal(game.score, score);
  const triple = new BreakoutGame({level:STAGES.find(s=>s.rows.join('').includes('3'))});
  const b=triple.bricks.find(b=>b.hp===3);
  triple.damage(b,1);assert.equal(b.hp,2);triple.damage(b,1);assert.equal(b.hp,1);
});

test('swept collision catches a thin brick even when crossing it in one step', () => {
  const hit=sweepBall(100,200,0,-180,{x:100,y:100,w:80,h:16},8);
  assert.ok(hit && hit.t>0 && hit.t<1); assert.equal(hit.ny,1);
  assert.equal(sweepBall(300,200,0,-180,{x:100,y:100,w:80,h:16},8),null);
});

test('real ball motion damages a brick; loss preserves remaining bricks until retry', () => {
  const g=new BreakoutGame({level:STAGES[0]});g.launch();
  const b=g.bricks.find(b=>b.hp===2);
  g.ball.x=b.x;g.ball.y=b.y+b.h/2+g.ball.r+2;g.ball.vx=0;g.ball.vy=-g.baseSpeed;
  g.step(1/120);assert.equal(b.hp,1);
  g.freeze=0;g.ball.y=g.height+60;g.step(1/120);
  assert.equal(g.lives,2);assert.equal(g.status,'ready');assert.equal(b.hp,1);
  g.retry();assert.equal(g.lives,3);assert.equal(g.bricks.find(x=>x.id===b.id).hp,2);
});

test('the three revisions actually change returns for identical input', () => {
  const vx=[];
  for(const edition of ['draft','tuned','guided']){
    const g=new BreakoutGame({level:SAMPLE,edition});g.launch();g.paddle.vx=380;
    g.ball.x=g.paddle.x+g.paddle.w*.28;g.ball.vx=-180;g.ball.vy=500;
    g.returnBall(.56);vx.push(g.ball.vx);
  }
  assert.ok(new Set(vx.map(Math.round)).size===3);
});

test('bomb chains hit each brick once', () => {
  const g=new BreakoutGame({level:WORKSHOP});g.launch();
  const bombs=g.bricks.filter(b=>b.kind==='bomb');const normal=g.bricks.find(b=>b.kind==='normal');
  bombs[0].x=normal.x; bombs[0].y=normal.y; const before=g.stats.hits;
  g.damage(bombs[0],1); assert.equal(bombs[0].hp,0); assert.equal(normal.hp,0);assert.ok(g.stats.hits>before);
});

test('a sustained laser follows the paddle, burns durability, and cannot recharge itself', () => {
  const g=new BreakoutGame({height:1200,level:STAGES[0]});g.launch();
  const target=g.bricks.find(b=>b.hp===2), other=g.bricks.find(b=>b.x>g.width*.7);
  g.paddle.x=target.x;g.energy=100;
  assert.equal(g.laser(),true);assert.equal(g.laser(),false);
  for(let i=0;i<16;i++)g.step(1/120,{target:target.x});
  assert.ok(target.hp<2,'the beam must damage the brick while active');
  for(let i=0;i<110;i++)g.step(1/120,{target:other.x});
  assert.equal(target.hp,0);assert.equal(other.hp,0,'moving after activation must hit a new column');
  assert.ok(g.laserTime>1,'the beam must last long enough to sweep');
  assert.equal(g.energy,0,'laser destruction must not fund another laser');
  assert.equal(g.laser(),false);
  for(let i=0;i<800&&g.laserTime>0;i++)g.step(1/120,{target:g.ball.x});
  assert.equal(g.laserTime,0);
});

test('loss, clear and retry stop an active laser; resized paddles keep their contact width',()=>{
  for(const end of ['miss','clear','retry']){
    const g=new BreakoutGame();g.launch();g.energy=100;g.laser();
    if(end==='retry')g.retry();
    else if(end==='clear')for(const b of g.bricks)g.damage(b,3);
    else {g.freeze=0;g.ball.y=g.height+60;g.step(1/120);}
    assert.equal(g.laserTime,0,end);
  }
  for(const width of [600,1200]){
    const g=new BreakoutGame({width});const w=g.paddle.w;
    assert.ok(w>(width<800?108:128));
    g.resize(width,width*.9);assert.equal(g.paddle.w,w);
    const tuned=new BreakoutGame({width,edition:'tuned'});assert.ok(tuned.paddle.w>w);
    g.launch();g.ball.x=g.paddle.x+w/2-1;g.ball.y=g.paddle.y-g.paddle.h/2-g.ball.r-1;g.ball.vx=0;g.ball.vy=500;
    g.step(1/120);assert.equal(g.stats.returns,1,'the visible outer paddle must catch the ball');
  }
});

test('clearing requires all bricks; perfect bump is timed and cannot be stacked by repeat', () => {
  const g=new BreakoutGame({level:STAGES[0]});g.launch();
  for(const b of g.bricks.slice(1))g.damage(b,3);
  assert.notEqual(g.status,'cleared');g.damage(g.bricks[0],3);assert.equal(g.status,'cleared');
  const t=new BreakoutGame({level:SAMPLE});t.launch();t.swing();t.returnBall(.2);
  assert.equal(t.stats.perfect,1);const speed=Math.hypot(t.ball.vx,t.ball.vy);t.swing();assert.equal(Math.hypot(t.ball.vx,t.ball.vy),speed);
});

test('the workshop moves an actual explosive, not a decorative button', () => {
  const a=new BreakoutGame({level:WORKSHOP,workshopX:500});
  const b=new BreakoutGame({level:WORKSHOP,workshopX:1400});
  assert.notEqual(a.bricks.find(x=>x.movable).x,b.bricks.find(x=>x.movable).x);
});

test('paddle leans with motion, swings back after releasing, and settles',()=>{
  const g=new BreakoutGame();
  for(let i=0;i<30;i++)g.step(1/120,{axis:1});
  assert.ok(g.paddle.angle>.07,'right movement must visibly lean');
  for(let i=0;i<60;i++)g.step(1/120,{axis:-1});
  assert.ok(g.paddle.angle<-.07,'left movement must reverse the spring');
  for(let i=0;i<360;i++)g.step(1/120);
  assert.ok(Math.abs(g.paddle.angle)<.001,'released spring must settle');
});

test('ordinary impacts freeze briefly and energy charges, then a real laser spends it',()=>{
  const g=new BreakoutGame({level:STAGES[0]});g.launch();
  const brick=g.bricks.find(b=>b.hp===2);g.damage(brick,1);assert.ok(g.freeze>=.025);
  assert.ok(g.events.some(e=>e.kind==='hit'&&e.hp===1));
  for(const b of g.bricks.filter(b=>b.kind==='energy'))g.damage(b,1);
  for(const b of g.bricks.filter(b=>b.kind==='normal').slice(0,8))g.damage(b,3);
  assert.equal(g.energy,100);assert.equal(g.laser(),true);assert.ok(g.energy<100);
});
