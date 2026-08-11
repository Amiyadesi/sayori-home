'use strict';

const VOICE_NAMES = Object.freeze([
  'voice_01', 'voice_02', 'voice_03', 'voice_04', 'voice_05', 'voice_06',
  'voice_07', 'voice_08', 'voice_09', 'voice_10', 'voice_11', 'voice_12',
]);
const VOICE_MIDI = Object.freeze([67, 67, 72, 72, 70, 70, 67, 65, 66, 69, 76, 72]);
const VOICE_GAIN = Object.freeze({
  voice_01: .899, voice_02: .869, voice_03: 1.387, voice_04: 1.409,
  voice_05: 1.264, voice_06: .531, voice_07: .537, voice_08: .438,
  voice_09: .994, voice_10: .871, voice_11: .439, voice_12: 1.018,
});
const KEY_ROWS = Object.freeze([
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV'],
]);
const DEATH_EFFECTS = Object.freeze([
  { name: '被捅', type: 'knife', color: '#ed596b' },
  { name: '多兔', type: 'rabbits', color: '#f08d70' },
  { name: '被勒', type: 'choke', color: '#e9c77f' },
  { name: '黑手', type: 'hand', color: '#a681e8' },
  { name: '流星锤', type: 'mace', color: '#c9b3ff' },
  { name: '风刀', type: 'wind', color: '#86cfff' },
  { name: '冻结', type: 'freeze', color: '#a9e9ff' },
  { name: '爆头', type: 'burst', color: '#f4f0ed' },
  { name: '两半', type: 'split', color: '#ed596b' },
  { name: '魔女侵蚀', type: 'void', color: '#7e63b8' },
  { name: '重击', type: 'impact', color: '#e9c77f' },
  { name: '落雷', type: 'lightning', color: '#86cfff' },
]);
const AVATAR_ACTIONS = Object.freeze({
  knife: 'hit', rabbits: 'hit', choke: 'squash', hand: 'void', mace: 'fall', wind: 'shake',
  freeze: 'freeze', burst: 'burst', split: 'fall', void: 'void', impact: 'fall', lightning: 'burst',
});
const PIECE_COUNTS = Object.freeze({
  knife: 4, rabbits: 6, choke: 4, hand: 4, mace: 3, wind: 5,
  freeze: 5, burst: 5, split: 3, void: 5, impact: 4, lightning: 4,
});

if (VOICE_NAMES.length !== 12 || VOICE_MIDI.length !== 12 || DEATH_EFFECTS.length !== 12) {
  throw new Error('Subaru Tap map must stay 12 voices x 12 effects.');
}

const stage = document.getElementById('stage');
const fx = document.getElementById('fx');
const fx2d = fx.getContext('2d');
const zoneflash = document.getElementById('zoneflash');
const overlay = document.getElementById('overlay');
const avatar = document.getElementById('avatar');
const avatarFrame = document.getElementById('avatar-frame');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const buffers = {};
const deathFx = [];
const activeVoices = new Map();

let audio = null;
let sfxBus = null;
let musicBus = null;
let musicBuffer = null;
let musicSource = null;
let audioInitPromise = null;
let started = false;
let musicOn = true;
let sfxOn = true;
let frameTime = 0;
let avatarActionTimer = 0;

function resizeFx() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  fx.width = Math.round(innerWidth * ratio);
  fx.height = Math.round(innerHeight * ratio);
  fx2d.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function startAudio() {
  if (started) {
    if (audio.state === 'suspended') await audio.resume();
    return;
  }
  if (audioInitPromise) return audioInitPromise;

  const init = (async () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const bus = context.createGain();
    const compressor = context.createDynamicsCompressor();
    bus.gain.value = sfxOn ? 0.76 : 0;
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    bus.connect(compressor).connect(context.destination);

    try {
      if (context.state === 'suspended') void context.resume().catch(() => {});
      const musicPromise = fetch('audio/bgm_rhythm.wav').then((response) => {
        if (!response.ok) throw new Error(`BGM load failed: ${response.status}`);
        return response.arrayBuffer();
      }).then((data) => context.decodeAudioData(data));
      const voicePromises = VOICE_NAMES.map(async (name) => {
        buffers[name] = await context.decodeAudioData(decodeBase64(window.AUDIO_B64[name]));
      });
      [musicBuffer] = await Promise.all([musicPromise, Promise.all(voicePromises)]);
    } catch (error) {
      await context.close();
      throw error;
    }

    audio = context;
    sfxBus = bus;
    musicBus = context.createGain();
    musicBus.gain.value = musicOn ? .2 : 0;
    musicBus.connect(context.destination);
    started = true;
    avatar.src = 'Image/subaru_cat.png';
    avatar.alt = 'Subaru 猫形象';
    document.body.classList.add('is-live');
    overlay.classList.add('is-hidden');
    startMusic();
  })();

  audioInitPromise = init;
  try {
    await init;
  } finally {
    if (audioInitPromise === init) audioInitPromise = null;
  }
}

function startMusic() {
  if (!musicOn || musicSource || !musicBuffer) return;
  const source = audio.createBufferSource();
  source.buffer = musicBuffer;
  source.loop = true;
  source.connect(musicBus);
  source.start();
  musicSource = source;
}

function stopMusic() {
  if (!musicSource) return;
  musicSource.stop();
  musicSource = null;
}

function startFromGesture() {
  void startAudio().catch((error) => console.error('Audio initialization failed:', error));
}

function playSample(name) {
  const previous = activeVoices.get(name);
  if (previous) {
    try { previous.stop(audio.currentTime); } catch {}
  }
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  const now = audio.currentTime;
  source.buffer = buffers[name];
  gain.gain.setValueAtTime(0.78 * VOICE_GAIN[name], now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.38, source.buffer.duration));
  source.connect(gain).connect(sfxBus);
  source.onended = () => {
    if (activeVoices.get(name) === source) activeVoices.delete(name);
  };
  activeVoices.set(name, source);
  source.start(now);
}

function zoneIndexAt(x, y) {
  const rect = stage.getBoundingClientRect();
  const column = Math.min(3, Math.max(0, Math.floor(((x - rect.left) / rect.width) * 4)));
  const row = Math.min(2, Math.max(0, Math.floor(((y - rect.top) / rect.height) * 3)));
  return row * 4 + column;
}

function hexToRgba(hex, alpha) {
  const value = hex.slice(1);
  const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function flashZone(index, color) {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const flash = document.createElement('div');
  flash.className = 'zone-flash';
  flash.style.left = `calc(${column * 25}% + 3px)`;
  flash.style.top = `calc(${row * 33.333333}% + 3px)`;
  flash.style.width = 'calc(25% - 6px)';
  flash.style.height = 'calc(33.333333% - 6px)';
  flash.style.backgroundColor = hexToRgba(color, .22);
  flash.style.boxShadow = `inset 0 0 0 1px ${hexToRgba(color, .56)}`;
  flash.addEventListener('animationend', () => flash.remove(), { once: true });
  zoneflash.append(flash);
}

function triggerZone(index, x = innerWidth / 2, y = innerHeight / 2) {
  if (!Number.isInteger(index) || !DEATH_EFFECTS[index]) return;
  if (!started) {
    void startAudio().then(() => triggerZone(index, x, y)).catch((error) => console.error('Tap start failed:', error));
    return;
  }

  if (audio.state === 'suspended') void audio.resume().catch(() => {});
  const effect = DEATH_EFFECTS[index];
  const action = AVATAR_ACTIONS[effect.type] || 'hit';
  avatarFrame.className = 'avatar-frame';
  avatarFrame.dataset.action = action;
  void avatarFrame.offsetWidth;
  avatarFrame.classList.add(`is-${action}`);
  window.clearTimeout(avatarActionTimer);
  avatarActionTimer = window.setTimeout(() => {
    if (avatarFrame.dataset.action === action) {
      avatarFrame.className = 'avatar-frame';
      avatarFrame.dataset.action = '';
    }
  }, 760);

  if (sfxOn) playSample(VOICE_NAMES[index]);
  flashZone(index, effect.color);
  spawnDeathEffect({ ...effect, midi: VOICE_MIDI[index] });
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutBack(value) {
  const t = clamp01(value) - 1;
  return 1 + 2.2 * t * t * t + 1.2 * t * t;
}

function polygon(ctx, sides, radius, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function star(ctx, radius, spikes = 8) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * i) / spikes;
    const length = i % 2 ? radius * .42 : radius;
    const x = Math.cos(angle) * length;
    const y = Math.sin(angle) * length;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawRabbit(ctx, size, accent) {
  const outline = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .08);
  ctx.strokeStyle = outline;
  ctx.fillStyle = '#f5d8cf';
  ctx.beginPath();
  ctx.ellipse(-size * .3, -size * .48, size * .16, size * .38, -.12, 0, Math.PI * 2);
  ctx.ellipse(size * .3, -size * .48, size * .16, size * .38, .12, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(-size * .3, -size * .5, size * .07, size * .25, -.12, 0, Math.PI * 2);
  ctx.ellipse(size * .3, -size * .5, size * .07, size * .25, .12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5d8cf';
  ctx.beginPath(); ctx.arc(0, size * .03, size * .46, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.arc(-size * .16, 0, size * .055, 0, Math.PI * 2); ctx.arc(size * .16, 0, size * .055, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(0, size * .18, size * .075, 0, Math.PI * 2); ctx.fill();
}

function drawKnife(ctx, size, accent) {
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, size * .1);
  ctx.strokeStyle = '#090b16';
  ctx.fillStyle = '#f4f0ed';
  ctx.beginPath(); ctx.moveTo(-size * .6, size * .45); ctx.lineTo(size * .48, -size * .5); ctx.lineTo(size * .62, -.28 * size); ctx.lineTo(-size * .45, size * .57); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = size * .22;
  ctx.beginPath(); ctx.moveTo(-size * .62, size * .62); ctx.lineTo(-size * .28, size * .28); ctx.stroke();
}

function drawChoke(ctx, size, accent) {
  ctx.lineWidth = Math.max(2, size * .1);
  ctx.strokeStyle = accent;
  ctx.beginPath(); ctx.ellipse(0, size * .05, size * .54, size * .35, -.2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#f4f0ed';
  ctx.lineWidth = Math.max(1, size * .035);
  ctx.beginPath(); ctx.arc(0, size * .05, size * .42, 0, Math.PI * 1.55); ctx.stroke();
}

function drawHand(ctx, size, accent) {
  ctx.fillStyle = '#090b16';
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, size * .07);
  ctx.beginPath();
  ctx.roundRect(-size * .28, -size * .05, size * .56, size * .62, size * .18);
  ctx.fill(); ctx.stroke();
  for (let i = -2; i <= 2; i += 1) {
    const x = i * size * .13;
    ctx.beginPath(); ctx.roundRect(x - size * .06, -size * .52 - Math.abs(i) * size * .03, size * .12, size * .58, size * .06); ctx.fill(); ctx.stroke();
  }
}

function drawMace(ctx, size, accent) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#f4f0ed';
  ctx.lineWidth = Math.max(1.5, size * .07);
  ctx.beginPath(); ctx.moveTo(-size * .55, size * .55); ctx.lineTo(size * .28, -size * .22); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .08);
  ctx.beginPath(); ctx.arc(size * .4, -size * .38, size * .25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath(); ctx.moveTo(size * .4 + Math.cos(angle) * size * .23, -size * .38 + Math.sin(angle) * size * .23); ctx.lineTo(size * .4 + Math.cos(angle) * size * .38, -size * .38 + Math.sin(angle) * size * .38); ctx.stroke();
  }
}

function drawWind(ctx, size, accent) {
  ctx.strokeStyle = accent;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, size * .08);
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-size * .65, i * size * .22);
    ctx.bezierCurveTo(-size * .15, -size * .55 + i * size * .22, size * .2, size * .55 + i * size * .22, size * .7, i * size * .05);
    ctx.stroke();
  }
}

function drawFreeze(ctx, size, accent) {
  ctx.fillStyle = '#f4f0ed';
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, size * .07);
  polygon(ctx, 6, size * .55, Math.PI / 6); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, size * .045);
  for (let i = 0; i < 3; i += 1) {
    const angle = i * Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * size * .5, Math.sin(angle) * size * .5); ctx.stroke();
  }
}

function drawBurst(ctx, size, accent) {
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .07);
  star(ctx, size * .6, 8); ctx.fill(); ctx.stroke();
}

function drawSplit(ctx, size, accent) {
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .07);
  ctx.beginPath(); ctx.moveTo(-size * .58, -size * .55); ctx.lineTo(-size * .04, -size * .14); ctx.lineTo(-size * .22, size * .6); ctx.lineTo(-size * .65, size * .36); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(size * .58, -size * .55); ctx.lineTo(size * .04, -size * .14); ctx.lineTo(size * .22, size * .6); ctx.lineTo(size * .65, size * .36); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawVoid(ctx, size, accent) {
  ctx.fillStyle = '#090b16';
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, size * .08);
  ctx.beginPath();
  ctx.moveTo(-size * .48, size * .5);
  ctx.bezierCurveTo(-size * .72, size * .05, -size * .25, -size * .12, -size * .48, -size * .58);
  ctx.bezierCurveTo(-size * .08, -size * .42, size * .05, -size * .25, size * .45, -size * .66);
  ctx.bezierCurveTo(size * .22, -.08 * size, size * .74, size * .16, size * .48, size * .58);
  ctx.bezierCurveTo(size * .1, size * .35, size * .02, size * .8, -size * .48, size * .5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawImpact(ctx, size, accent) {
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .08);
  star(ctx, size * .62, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4f0ed';
  ctx.beginPath(); ctx.arc(0, 0, size * .16, 0, Math.PI * 2); ctx.fill();
}

function drawLightning(ctx, size, accent) {
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#090b16';
  ctx.lineWidth = Math.max(1.5, size * .07);
  ctx.beginPath();
  ctx.moveTo(size * .18, -size * .68); ctx.lineTo(-size * .1, -size * .12); ctx.lineTo(size * .18, -size * .12);
  ctx.lineTo(-size * .22, size * .68); ctx.lineTo(-size * .04, size * .08); ctx.lineTo(-size * .3, size * .08); ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawDeathPiece(ctx, type, size, color, rotation, alpha, pulse) {
  ctx.save();
  ctx.translate(0, pulse * size * .08);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  switch (type) {
    case 'knife': drawKnife(ctx, size, color); break;
    case 'rabbits': drawRabbit(ctx, size, color); break;
    case 'choke': drawChoke(ctx, size, color); break;
    case 'hand': drawHand(ctx, size, color); break;
    case 'mace': drawMace(ctx, size, color); break;
    case 'wind': drawWind(ctx, size, color); break;
    case 'freeze': drawFreeze(ctx, size, color); break;
    case 'burst': drawBurst(ctx, size, color); break;
    case 'split': drawSplit(ctx, size, color); break;
    case 'void': drawVoid(ctx, size, color); break;
    case 'impact': drawImpact(ctx, size, color); break;
    case 'lightning': drawLightning(ctx, size, color); break;
    default: drawBurst(ctx, size, color); break;
  }
  ctx.restore();
}

function spawnDeathEffect(effect) {
  const minD = Math.min(innerWidth, innerHeight);
  const count = PIECE_COUNTS[effect.type] || 4;
  const pieces = [];
  const marginX = Math.min(innerWidth * .14, 120);
  const marginY = Math.min(innerHeight * .16, 110);
  for (let i = 0; i < count; i += 1) {
    const nearCenter = i === 0 || (effect.type === 'rabbits' && i < 3);
    pieces.push({
      x: nearCenter ? innerWidth / 2 + (Math.random() - .5) * minD * .48 : marginX + Math.random() * Math.max(1, innerWidth - marginX * 2),
      y: nearCenter ? innerHeight / 2 + (Math.random() - .5) * minD * .52 : marginY + Math.random() * Math.max(1, innerHeight - marginY * 2),
      vx: (Math.random() - .5) * minD * .045,
      vy: (Math.random() - .5) * minD * .035 - minD * .012,
      size: Math.max(14, Math.min(42, minD * (.032 + Math.random() * .025))),
      rotation: (Math.random() - .5) * .9,
      spin: (Math.random() - .5) * 2.6,
      delay: Math.random() * .12,
      phase: Math.random() * Math.PI * 2,
    });
  }
  deathFx.push({ ...effect, age: 0, duration: effect.type === 'rabbits' ? 900 : 820, pieces });
  if (deathFx.length > 6) deathFx.shift();
}

function drawDeathEffect(effect) {
  const progress = clamp01(effect.age / effect.duration);
  const fade = progress < .62 ? 1 : 1 - (progress - .62) / .38;
  for (const piece of effect.pieces) {
    const local = clamp01((progress - piece.delay) / .82);
    if (!local) continue;
    const pop = easeOutBack(Math.min(1, local * 2.8));
    const drift = Math.min(1, local) * (local < .6 ? 1 : .75);
    const x = piece.x + piece.vx * drift;
    const y = piece.y + piece.vy * drift + Math.sin(effect.age * .008 + piece.phase) * 3;
    const pulse = Math.sin(effect.age * .012 + piece.phase);
    const scale = Math.max(.01, pop * (1 - Math.max(0, local - .72) * .2));
    fx2d.save();
    fx2d.translate(x, y);
    fx2d.scale(scale, scale);
    drawDeathPiece(fx2d, effect.type, piece.size, effect.color, piece.rotation + piece.spin * local, fade * (1 - Math.max(0, local - .82) * 4), pulse);
    fx2d.restore();
  }
}

function drawFx(time) {
  const dt = Math.min(32, time - frameTime || 16);
  frameTime = time;
  fx2d.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = deathFx.length - 1; i >= 0; i -= 1) {
    const effect = deathFx[i];
    effect.age += dt;
    if (effect.age >= effect.duration) { deathFx.splice(i, 1); continue; }
    drawDeathEffect(effect);
  }
  requestAnimationFrame(drawFx);
}

function keyToZone(code) {
  for (let row = 0; row < KEY_ROWS.length; row += 1) {
    const col = KEY_ROWS[row].indexOf(code);
    if (col >= 0) return row * 4 + col;
  }
  return null;
}

function syncMusic() {
  musicToggle.classList.toggle('is-muted', !musicOn);
  musicToggle.setAttribute('aria-label', musicOn ? '关闭背景音乐' : '开启背景音乐');
  musicBus.gain.setTargetAtTime(musicOn ? .2 : 0, audio.currentTime, .03);
  if (musicOn) startMusic(); else stopMusic();
}

function pulseControl(control) {
  control.classList.remove('is-pulsed');
  void control.offsetWidth;
  control.classList.add('is-pulsed');
}

stage.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button') || event.target.closest('#overlay')) return;
  event.preventDefault();
  triggerZone(zoneIndexAt(event.clientX, event.clientY), event.clientX, event.clientY);
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const key = keyToZone(event.code);
  if (key === null) { if (!started) startFromGesture(); return; }
  event.preventDefault();
  triggerZone(key);
});

overlay.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  event.preventDefault();
  startFromGesture();
});

musicToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  pulseControl(musicToggle);
  musicOn = !musicOn;
  syncMusic();
});

sfxToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  pulseControl(sfxToggle);
  sfxOn = !sfxOn;
  sfxBus.gain.setTargetAtTime(sfxOn ? .76 : 0, audio.currentTime, .03);
  sfxToggle.classList.toggle('is-muted', !sfxOn);
  sfxToggle.setAttribute('aria-label', sfxOn ? '关闭音效' : '开启音效');
});

window.addEventListener('resize', resizeFx);
resizeFx();
requestAnimationFrame(drawFx);
