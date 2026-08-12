'use strict';

const BPM = 128;
const SPB = 60 / BPM;
const S16 = SPB / 4;
const S8 = SPB / 2;
const VOICE_SOURCES = Object.freeze(['voice_a', 'voice_b', 'voice_c']);
const SOURCE_MIDI = Object.freeze({
  voice_a: 69.056,
  voice_b: 70.156,
  voice_c: 67.960,
});
const PITCH_TIERS = Object.freeze([74, 72, 69, 67]);
const VOICE_SAMPLES = Object.freeze([
  'voice_a', 'voice_a', 'voice_a', 'voice_a',
  'voice_b', 'voice_b', 'voice_b', 'voice_b',
  'voice_c', 'voice_c', 'voice_c', 'voice_c',
]);
const VOICE_TARGET_MIDI = Object.freeze([
  ...PITCH_TIERS, ...PITCH_TIERS, ...PITCH_TIERS,
]);
const VOICE_GAIN = Object.freeze({
  voice_a: 1.08,
  voice_b: 1,
  voice_c: 1.04,
});
const KEY_ROWS = Object.freeze([
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV'],
]);
const DEATH_EFFECTS = Object.freeze([
  { type: 'knife', color: '#f06b75' },
  { type: 'rabbits', color: '#f2a48b' },
  { type: 'choke', color: '#efd28b' },
  { type: 'hand', color: '#b69ae8' },
  { type: 'mace', color: '#d9c3ff' },
  { type: 'wind', color: '#8bd8ff' },
  { type: 'freeze', color: '#a9ecff' },
  { type: 'burst', color: '#f4f0ed' },
  { type: 'split', color: '#f06b75' },
  { type: 'void', color: '#956fca' },
  { type: 'impact', color: '#efd28b' },
  { type: 'lightning', color: '#8bd8ff' },
]);
const C = {
  cream: '#fff2dc',
  amber: '#ffb400',
  gray: '#87837e',
  coral: '#ff5a5f',
  teal: '#16c2a3',
  blue: '#3e7bfa',
};
const ACCENTS = [C.coral, C.teal, C.blue];
const EFFECTS = [
  'rings',
  'poly',
  'spiral',
  'rays',
  'confetti',
  'zigzag',
  'pop',
  'cross',
  'orbit',
  'wave',
  'stars',
  'grid',
];

function pickColor(rng) {
  const value = rng();
  if (value < 0.62) return C.amber;
  if (value < 0.9) return C.gray;
  return ACCENTS[(rng() * ACCENTS.length) | 0];
}

const AVATAR_ACTIONS = Object.freeze({
  knife: 'hit',
  rabbits: 'hit',
  choke: 'squash',
  hand: 'void',
  mace: 'fall',
  wind: 'shake',
  freeze: 'freeze',
  burst: 'burst',
  split: 'fall',
  void: 'void',
  impact: 'fall',
  lightning: 'burst',
});
const CHORDS = Object.freeze([
  { notes: [261.63, 329.63, 392], bass: 65.41 },
  { notes: [196, 246.94, 293.66], bass: 49 },
  { notes: [220, 261.63, 329.63], bass: 55 },
  { notes: [174.61, 220, 261.63], bass: 43.65 },
]);

if (
  VOICE_SAMPLES.length !== 12 ||
  VOICE_TARGET_MIDI.length !== 12 ||
  DEATH_EFFECTS.length !== 12
) {
  throw new Error('Subaru Tap map must stay 12 voices x 12 effects.');
}

const stage = document.getElementById('stage');
const fx = document.getElementById('fx');
const fx2d = fx.getContext('2d');
const zoneflash = document.getElementById('zoneflash');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start-button');
const startShell = document.querySelector('.start-shell');
const aboutButton = document.getElementById('about-button');
const aboutModal = document.getElementById('about-modal');
const aboutClose = document.getElementById('about-close');
const hero = document.querySelector('.hero');
const avatar = document.getElementById('avatar');
const avatarFrame = document.getElementById('avatar-frame');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const buffers = {};
const lastTapSlots = new Map();

let audio = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;
let musicTimer = 0;
let musicStartTime = 0;
let nextNoteTime = 0;
let stepCount = 0;
let audioInitPromise = null;
let started = false;
let musicOn = true;
let sfxOn = true;
let avatarActionTimer = 0;
let corpseLaunchIndex = Math.floor(Math.random() * 24);

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

async function startAudio() {
  if (started) {
    if (audio.state === 'suspended') await audio.resume();
    return;
  }
  if (audioInitPromise) return audioInitPromise;

  const init = (async () => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const sfx = context.createGain();
    const compressor = context.createDynamicsCompressor();
    sfx.gain.value = sfxOn ? 0.78 : 0;
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    sfx.connect(compressor).connect(context.destination);

    try {
      if (context.state === 'suspended') await context.resume();
      const voicePromises = VOICE_SOURCES.map(async (name) => {
        buffers[name] = await context.decodeAudioData(
          decodeBase64(window.AUDIO_B64[name]),
        );
      });
      await Promise.all(voicePromises);
    } catch (error) {
      await context.close();
      throw error;
    }

    audio = context;
    sfxBus = sfx;
    musicBus = context.createGain();
    musicBus.gain.value = musicOn ? 0.19 : 0;
    musicBus.connect(context.destination);
    noiseBuffer = createNoiseBuffer(context);
    started = true;
    avatar.removeAttribute('srcset');
    avatar.removeAttribute('sizes');
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
  if (musicTimer) return;
  musicStartTime = audio.currentTime + 0.08;
  nextNoteTime = musicStartTime;
  stepCount = 0;
  musicTimer = window.setInterval(scheduleMusic, 25);
  scheduleMusic();
}

function kick(time) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, time);
  oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(0.44, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
  oscillator.connect(gain).connect(musicBus);
  oscillator.start(time);
  oscillator.stop(time + 0.25);
}

function snare(time, volume = 0.22) {
  const noise = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  noise.buffer = noiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.value = 1900;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
  noise.connect(filter).connect(gain).connect(musicBus);
  noise.start(time);
  noise.stop(time + 0.18);
}

function hat(time, volume, decay) {
  const noise = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  noise.buffer = noiseBuffer;
  filter.type = 'highpass';
  filter.frequency.value = 7200;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  noise.connect(filter).connect(gain).connect(musicBus);
  noise.start(time);
  noise.stop(time + decay + 0.02);
}

function chord(time, notes) {
  for (const frequency of notes) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.055, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    oscillator.connect(gain).connect(musicBus);
    oscillator.start(time);
    oscillator.stop(time + 0.32);
  }
}

function bass(time, frequency, volume) {
  const oscillator = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency * 2;
  filter.type = 'lowpass';
  filter.frequency.value = 280;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + S8 * 0.9);
  oscillator.connect(filter).connect(gain).connect(musicBus);
  oscillator.start(time);
  oscillator.stop(time + S8);
}

function scheduleMusicStep(step, time) {
  const bar = Math.floor(step / 16);
  const position = step % 16;
  const chordShape = CHORDS[bar];
  if (position % 4 === 0) kick(time);
  if (position === 4 || position === 12) snare(time);
  if (position % 2 === 0) bass(time, chordShape.bass, position % 4 === 0 ? 0.13 : 0.09);
  if (position % 4 === 2) chord(time, chordShape.notes);
  hat(time, position % 4 === 0 ? 0.09 : 0.055, position === 14 ? 0.12 : 0.045);
}

function scheduleMusic() {
  if (!audio) return;
  const horizon = audio.currentTime + 0.14;
  while (nextNoteTime < horizon) {
    scheduleMusicStep(stepCount, nextNoteTime);
    nextNoteTime += S16;
    stepCount = (stepCount + 1) % 64;
  }
}

function quantizedTapTime() {
  const now = audio.currentTime;
  if (!musicStartTime) return now + 0.01;
  const slot = Math.max(0, Math.round((now - musicStartTime) / S8));
  let time = musicStartTime + slot * S8;
  if (time < now + 0.012) time += S8;
  return time;
}

function playSample(index) {
  const sampleName = VOICE_SAMPLES[index];
  const buffer = buffers[sampleName];
  if (!buffer) return null;
  const time = quantizedTapTime();
  const slot = Math.round((time - musicStartTime) / S8);
  if (lastTapSlots.get(index) === slot) return time;
  lastTapSlots.set(index, slot);

  const source = audio.createBufferSource();
  const gain = audio.createGain();
  const rate = 2 ** ((VOICE_TARGET_MIDI[index] - SOURCE_MIDI[sampleName]) / 12);
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(rate, time);
  gain.gain.setValueAtTime(0.84 * VOICE_GAIN[sampleName], time);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    time + Math.max(0.18, buffer.duration / rate),
  );
  source.connect(gain).connect(sfxBus);
  source.start(time);
  return time;
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
  return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
}

function flashZone(index, color) {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const flash = document.createElement('div');
  flash.className = 'zone-flash';
  flash.style.left = column * 25 + '%';
  flash.style.top = row * 33.333333 + '%';
  flash.style.width = '25%';
  flash.style.height = '33.333333%';
  flash.style.backgroundColor = hexToRgba(color, 0.18);
  flash.style.setProperty('--flash-color', hexToRgba(color, 0.38));
  flash.addEventListener('animationend', () => flash.remove(), { once: true });
  zoneflash.append(flash);
}

function avatarRotation() {
  const transform = getComputedStyle(avatarFrame).transform;
  if (transform === 'none') return -2;
  const matrix = new DOMMatrixReadOnly(transform);
  return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
}

function spawnCorpse(type) {
  const corpse = document.createElement('div');
  corpse.className = 'corpse corpse-' + type;
  corpseLaunchIndex = (corpseLaunchIndex + 5) % 24;
  const angle = corpseLaunchIndex * Math.PI / 12;
  const distance = Math.min(innerWidth, innerHeight) * 0.42;
  const launchX = Math.cos(angle) * distance;
  const launchY = Math.sin(angle) * distance;
  const startRotation = avatarRotation();
  const spin = corpseLaunchIndex % 2 ? -150 : 150;
  corpse.style.setProperty('--corpse-mid-x', (-launchX * 0.05).toFixed(1) + 'px');
  corpse.style.setProperty('--corpse-mid-y', (-launchY * 0.05).toFixed(1) + 'px');
  corpse.style.setProperty('--corpse-x', launchX.toFixed(1) + 'px');
  corpse.style.setProperty('--corpse-y', launchY.toFixed(1) + 'px');
  corpse.style.setProperty('--corpse-start-rotate', startRotation.toFixed(1) + 'deg');
  corpse.style.setProperty('--corpse-mid-rotate', (startRotation + spin * 0.08).toFixed(1) + 'deg');
  corpse.style.setProperty('--corpse-end-rotate', (startRotation + spin).toFixed(1) + 'deg');
  const image = avatar.cloneNode(false);
  image.removeAttribute('id');
  image.alt = '';
  corpse.append(image);
  hero.append(corpse);
  corpse.addEventListener('animationend', () => corpse.remove(), { once: true });
}

function animateAvatar(type) {
  const action = AVATAR_ACTIONS[type] || 'hit';
  avatarFrame.className = 'avatar-frame';
  avatarFrame.dataset.action = action;
  void avatarFrame.offsetWidth;
  avatarFrame.classList.add('is-' + action, 'is-respawn');
  window.clearTimeout(avatarActionTimer);
  avatarActionTimer = window.setTimeout(() => {
    avatarFrame.className = 'avatar-frame';
    avatarFrame.dataset.action = '';
  }, 820);
}

function triggerZone(index) {
  if (!Number.isInteger(index) || !DEATH_EFFECTS[index]) return;
  if (!started) {
    void startAudio().then(() => triggerZone(index)).catch((error) => console.error('Tap start failed:', error));
    return;
  }
  if (audio.state === 'suspended') void audio.resume().catch(() => {});
  const effect = DEATH_EFFECTS[index];
  spawnCorpse(effect.type);
  animateAvatar(effect.type);
  const when = sfxOn ? playSample(index) : audio.currentTime;
  flashZone(index, effect.color);
  spawnEffect(index, when);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = t => t * t * (3 - 2 * t);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.70158, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const easeOutElastic = t =>
  t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;

function tracePoly(g, x, y, r, sides, rot) {
  g.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}

function traceStar(g, x, y, r, points, rot) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 ? r * 0.46 : r;
    const a = rot + (i * Math.PI) / points;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}

/* 画一个小几何体（特效的基本粒子） */
function drawPiece(g, kind, color, x, y, r, rot) {
  if (r <= 0) return;
  g.save();
  g.translate(x, y);
  g.rotate(rot || 0);
  switch (kind) {
    case 'circle':
      g.fillStyle = color;
      g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
      break;
    case 'ring':
      g.strokeStyle = color;
      g.lineWidth = Math.max(2, r * 0.3);
      g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
      break;
    case 'square':
      g.fillStyle = color;
      g.fillRect(-r, -r, r * 2, r * 2);
      break;
    case 'triangle':
      g.fillStyle = color;
      tracePoly(g, 0, 0, r * 1.2, 3, -Math.PI / 2); g.fill();
      break;
    case 'diamond':
      g.fillStyle = color;
      tracePoly(g, 0, 0, r * 1.15, 4, 0); g.fill();
      break;
    case 'hexagon':
      g.fillStyle = color;
      tracePoly(g, 0, 0, r * 1.1, 6, 0); g.fill();
      break;
    case 'star':
      g.fillStyle = color;
      traceStar(g, 0, 0, r * 1.25, 5, -Math.PI / 2); g.fill();
      break;
    case 'cross': {
      g.fillStyle = color;
      const w = r * 0.62;
      g.fillRect(-r, -w / 2, r * 2, w);
      g.fillRect(-w / 2, -r, w, r * 2);
      break;
    }
  }
  g.restore();
}

/* ============================================================
 * 全屏特效引擎（仿 Mikutap）
 *  - 每次触发生成一个全屏特效实例，叠在旧特效之上
 *  - 旧特效播放退场动画后移除
 *  - 页面背景平滑过渡到新特效的落幕背景色
 * ==========================================================*/
const FX_IN = 0.55;    // 入场时长（秒）
const FX_LIFE = 0.72;  // 完成一圈后停止
const FX_OUT = 0.24;   // 停止后的淡出时长（秒）

let fxW = 0, fxH = 0;  // 画布尺寸（CSS 像素）
let fxList = [];       // 活跃特效（数组顺序 = 叠放顺序）
let beatP = 0;         // 节拍脉冲 0..1（tick 每帧更新）

function nowSec() { return audio ? audio.currentTime : performance.now() / 1000; }
const prog = (t, delay, dur = FX_IN) => clamp01((t - delay) / dur);
const cx0 = () => fxW / 2, cy0 = () => fxH / 2;   // 屏幕正中心

function resizeFx() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  fxW = innerWidth; fxH = innerHeight;
  fx.width = Math.round(fxW * dpr);
  fx.height = Math.round(fxH * dpr);
  fx.style.width = fxW + 'px';
  fx.style.height = fxH + 'px';
  fx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  // 活跃特效重新对齐屏幕正中心
  for (const e of fxList) { e.cx = cx0(); e.cy = cy0(); }
}

/* ---------- 各特效的随机参数预生成（出生即定型，之后纯函数绘制） ----------
 * 中心化特效最大直径 ≈ 0.85~0.92 倍屏幕短边；
 * 零散小元件（纸屑 / 星星 / 几何雨）则随机散布全屏任意位置 */
const BUILD = {
  rings(inst, rng) {
    const minD = Math.min(fxW, fxH);
    for (let i = 0; i < 7; i++) inst.shapes.push({
      delay: i * 0.05,
      rEnd: minD * (0.13 + rng() * 0.29),   // 最大直径 ≈ 0.84 短边
      w: 3 + rng() * 7,
      color: pickColor(rng),
    });
    inst.dotR = minD * 0.07;
  },
  poly(inst, rng) {
    const sides = 3 + (rng() * 5 | 0);
    const minD = Math.min(fxW, fxH);
    [[0.46, C.amber, 0], [0.3, C.gray, 0.09], [0.17, C.amber, 0.18]].forEach(([s, color, d], i) =>
      inst.shapes.push({
        sides, delay: d, color,
        rEnd: minD * s,                       // 最大直径 ≈ 0.92 短边
        w: minD * (0.024 - i * 0.006),
      }));
  },
  spiral(inst, rng) {
    const minD = Math.min(fxW, fxH);
    for (let i = 0; i < 36; i++) inst.shapes.push({
      ang: i * 0.55,
      rad: 6 + i * minD * 0.0125,             // 最大直径 ≈ 0.88 短边
      size: minD * (0.009 + i * 0.0008),
      delay: i * 0.018,
      color: pickColor(rng),
    });
  },
  rays(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const n = 13 + (rng() * 4 | 0);
    inst.r0 = minD * 0.06;
    for (let i = 0; i < n; i++) inst.shapes.push({
      ang: (i / n) * 2 * Math.PI + rng() * 0.15,
      w: 0.09 + rng() * 0.13,
      len: minD * (0.36 + rng() * 0.1),       // 最大直径 ≈ 0.92 短边
      delay: rng() * 0.12,
      color: rng() < 0.12 ? ACCENTS[(rng() * 3) | 0] : (i % 2 ? C.gray : C.amber),
    });
  },
  confetti(inst, rng) {
    const maxD = Math.hypot(fxW, fxH);
    const minD = Math.min(fxW, fxH);
    const kinds = ['square', 'circle', 'triangle', 'diamond'];
    for (let i = 0; i < 30; i++) inst.shapes.push({
      ang: rng() * 2 * Math.PI,
      dist: maxD * (0.12 + rng() * 0.46),
      size: minD * (0.026 + rng() * 0.05),
      spin: inst.dir * (1 + rng() * 2) * 2.2,
      delay: rng() * 0.18,
      kind: kinds[(rng() * 4) | 0],
      color: pickColor(rng),
    });
  },
  zigzag(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const horiz = rng() < 0.5;
    const n = 5 + (rng() * 3 | 0);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      if (horiz) pts.push({
        x: -fxW * 0.08 + f * fxW * 1.16,
        y: fxH * (i % 2 ? 0.72 + rng() * 0.14 : 0.14 + rng() * 0.14),
      });
      else pts.push({
        x: fxW * (i % 2 ? 0.7 + rng() * 0.16 : 0.14 + rng() * 0.16),
        y: -fxH * 0.08 + f * fxH * 1.16,
      });
    }
    const lens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      lens.push(l); total += l;
    }
    inst.shapes.push({ pts, lens, total, w: minD * (0.02 + rng() * 0.022), color: C.amber });
  },
  pop(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const kinds = ['circle', 'square', 'ring', 'triangle', 'hexagon'];
    for (let i = 0; i < 16; i++) inst.shapes.push({
      x: fxW * (0.06 + rng() * 0.88),
      y: fxH * (0.06 + rng() * 0.88),
      size: minD * (0.036 + rng() * 0.06),
      delay: rng() * 0.28,
      rot: rng() * Math.PI,
      kind: kinds[(rng() * kinds.length) | 0],
      color: pickColor(rng),
    });
  },
  cross(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const size = minD * (0.6 + rng() * 0.25);   // 臂长 0.6~0.85 短边
    inst.shapes.push({
      size,
      w: size * (0.14 + rng() * 0.08),
      color: rng() < 0.2 ? ACCENTS[(rng() * 3) | 0] : C.amber,
    });
  },
  orbit(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const kinds = ['circle', 'square', 'triangle', 'ring'];
    const n = 10;
    for (let i = 0; i < n; i++) inst.shapes.push({
      ang0: (i / n) * 2 * Math.PI,
      rad: minD * (0.18 + rng() * 0.24),        // 轨道直径 ≤ 0.84 短边
      speed: inst.dir * (0.45 + rng() * 0.5),
      size: minD * (0.026 + rng() * 0.032),
      delay: rng() * 0.15,
      kind: kinds[i % 4],
      color: pickColor(rng),
    });
    inst.coreR = minD * 0.055;
  },
  wave(inst, rng) {
    const minD = Math.min(fxW, fxH);
    for (let i = 0; i < 4; i++) inst.shapes.push({
      y0: fxH * (0.14 + i * 0.24) + (rng() - 0.5) * fxH * 0.08,
      amp: minD * (0.03 + rng() * 0.05),
      wl: fxW * (0.45 + rng() * 0.4),
      speed: inst.dir * (1 + rng() * 1.2),
      th: minD * (0.07 + rng() * 0.06),
      side: i % 2 ? 1 : -1,
      delay: i * 0.08,
      color: rng() < 0.12 ? ACCENTS[(rng() * 3) | 0] : (i % 2 ? C.gray : C.amber),
    });
  },
  stars(inst, rng) {
    const minD = Math.min(fxW, fxH);
    for (let i = 0; i < 12; i++) inst.shapes.push({
      x: fxW * (0.07 + rng() * 0.86),
      y: fxH * (0.07 + rng() * 0.86),
      r: minD * (0.034 + rng() * 0.055),
      delay: rng() * 0.25,
      rot: rng() * Math.PI,
      color: pickColor(rng),
    });
  },
  grid(inst, rng) {
    const minD = Math.min(fxW, fxH);
    const n = 11;
    const radius = minD * (0.4 + rng() * 0.04);   // 直径 0.8~0.88 短边
    const lines = [];
    for (let i = 0; i < n; i++) lines.push({
      y: (i - (n - 1) / 2) * (radius * 2 / n),
      w: 2.5 + ((i * 7) % 3) * 3,
      delay: i * 0.045,
      color: i % 2 ? C.gray : C.amber,
    });
    inst.shapes.push({ radius, lines });
  },
};

/* ---------- 各特效的绘制（t = 出生至今秒数，fade = 退场透明度） ----------
 * beatP 为节拍脉冲：所有特效都随节拍明显缩放 / 增粗 / 增亮 */
const DRAW = {
  /* 同心环爆发：圆环扩张后呼吸胀缩，随节拍增粗（律动只做运动，不变色） */
  rings(g, inst, t, fade) {
    const minD = Math.min(fxW, fxH);
    inst.shapes.forEach((s, i) => {
      const k = easeOutCubic(prog(t, s.delay));
      if (k <= 0) return;
      const r = k * s.rEnd * (1 + 0.04 * Math.sin(t * 1.4 + i)) + beatP * minD * 0.03;
      g.globalAlpha = (1 - k * 0.5) * fade;
      g.strokeStyle = s.color;
      g.lineWidth = s.w * (1 + beatP * 1.3);
      g.beginPath(); g.arc(inst.cx, inst.cy, r, 0, 7); g.stroke();
    });
    const dk = easeOutBack(prog(t, 0));
    if (dk > 0) {
      g.globalAlpha = fade;
      g.fillStyle = C.amber;
      g.beginPath(); g.arc(inst.cx, inst.cy, inst.dotR * dk * (1 + beatP * 0.45), 0, 7); g.fill();
    }
  },

  /* 多边形绽放：三层多边形描边放大并旋转，随节拍胀缩 */
  poly(g, inst, t, fade) {
    const minD = Math.min(fxW, fxH);
    inst.shapes.forEach((s, i) => {
      const k = easeOutCubic(prog(t, s.delay));
      if (k <= 0) return;
      const r = k * s.rEnd * (1 + beatP * 0.08 + 0.03 * Math.sin(t * 1.1 + i * 1.9));
      const rot = inst.rot0 + inst.dir * (1 - k) * 1.3 + t * 0.18 * inst.dir;
      g.globalAlpha = (1 - k * 0.3) * fade;
      g.strokeStyle = s.color;
      g.lineWidth = s.w * (1 + beatP * 0.9) + beatP * minD * 0.004;
      tracePoly(g, inst.cx, inst.cy, r, s.sides, rot);
      g.stroke();
    });
  },

  /* 螺旋弹珠：圆点沿螺旋线依次弹出，整体旋转，随节拍跳动 */
  spiral(g, inst, t, fade) {
    const rot = inst.rot0 + t * 0.45 * inst.dir + beatP * 0.12 * inst.dir;
    inst.shapes.forEach((s, i) => {
      const k = easeOutBack(prog(t, s.delay));
      if (k <= 0) return;
      const a = s.ang + rot;
      const r = s.rad * k * (1 + beatP * 0.1) + Math.sin(t * 1.5 + i * 0.5) * 4;
      const x = inst.cx + Math.cos(a) * r;
      const y = inst.cy + Math.sin(a) * r;
      const sz = s.size * k * (1 + beatP * 0.6);
      g.globalAlpha = fade;
      drawPiece(g, i % 6 === 5 ? 'square' : 'circle', s.color, x, y, sz, a);
    });
  },

  /* 放射光芒：楔形光刃旋出，缓慢自转，随节拍伸长 */
  rays(g, inst, t, fade) {
    for (const s of inst.shapes) {
      const k = easeOutCubic(prog(t, s.delay, 0.5));
      if (k <= 0) continue;
      const rot = inst.rot0 + inst.dir * (1 - k) * 0.8 + t * 0.14 * inst.dir;
      const len = s.len * k * (1 + beatP * 0.22);
      const a = s.ang + rot;
      g.globalAlpha = 0.88 * fade;
      g.fillStyle = s.color;
      g.beginPath();
      g.moveTo(inst.cx, inst.cy);
      g.arc(inst.cx, inst.cy, inst.r0 + len, a - s.w, a + s.w);
      g.closePath(); g.fill();
    }
  },

  /* 几何纸屑：小几何体从中心炸开，漂浮 + 随节拍颠簸 */
  confetti(g, inst, t, fade) {
    inst.shapes.forEach((s, i) => {
      const k = easeOutBack(prog(t, s.delay));
      if (k <= 0) return;
      const x = inst.cx + Math.cos(s.ang) * s.dist * k * (1 + beatP * 0.06);
      const y = inst.cy + Math.sin(s.ang) * s.dist * k * (1 + beatP * 0.06)
        + Math.sin(t * 2.2 + i * 1.3) * 6;
      const sz = s.size * k * (1 + beatP * 0.4);
      const rot = s.spin * k + t * 0.6 * inst.dir;
      g.globalAlpha = fade;
      drawPiece(g, s.kind, s.color, x, y, sz, rot);
    });
  },

  /* 折线穿越：粗折线横扫全屏（带灰色重影），端点圆点随节拍猛跳 */
  zigzag(g, inst, t, fade) {
    const s = inst.shapes[0];
    const k = easeOutCubic(prog(t, 0, 0.6));
    if (k <= 0) return;
    g.save();
    g.translate(0, Math.sin(t * 1.6) * 7);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    // 灰色重影
    g.save();
    g.translate(0, s.w * 2.1);
    g.globalAlpha = 0.4 * fade;
    g.strokeStyle = C.gray;
    g.lineWidth = s.w * (1 + beatP * 0.5);
    strokePartial(g, s.pts, s.lens, k * s.total);
    g.stroke();
    g.restore();
    // 主折线
    g.globalAlpha = fade;
    g.strokeStyle = s.color;
    g.lineWidth = s.w * (1 + beatP * 0.7);
    const tip = strokePartial(g, s.pts, s.lens, k * s.total);
    g.stroke();
    g.fillStyle = C.gray;
    g.beginPath(); g.arc(tip.x, tip.y, s.w * (1.1 + beatP * 1.1), 0, 7); g.fill();
    g.restore();
  },

  /* 弹性几何雨：几何体在随机位置 Q 弹冒出，浮动 + 随节拍缩放 */
  pop(g, inst, t, fade) {
    inst.shapes.forEach((s, i) => {
      const k = easeOutBack(prog(t, s.delay));
      if (k <= 0) return;
      const y = s.y + Math.sin(t * 2 + i * 1.7) * 7;
      const sz = s.size * k * (1 + beatP * 0.45);
      g.globalAlpha = 0.96 * fade;
      drawPiece(g, s.kind, s.color, s.x, y, sz, s.rot + t * 0.4 * inst.dir + beatP * 0.2 * inst.dir);
    });
  },

  /* 巨大十字：横竖两臂依次弹出并旋转定格，随节拍强烈胀缩 */
  cross(g, inst, t, fade) {
    const s = inst.shapes[0];
    const k1 = easeOutBack(prog(t, 0));
    const k2 = easeOutBack(prog(t, 0.13));
    if (k1 <= 0) return;
    g.save();
    g.translate(inst.cx, inst.cy);
    g.rotate(inst.rot0 + inst.dir * (1 - k1) * 1.6 + Math.sin(t * 1.3) * 0.07 + beatP * 0.05 * inst.dir);
    const pulse = 1 + beatP * 0.28;
    g.scale(pulse, pulse);
    const L = s.size / 2, w = s.w / 2;
    g.globalAlpha = fade;
    g.fillStyle = s.color;
    g.fillRect(-L * k1, -w, L * 2 * k1, w * 2);
    if (k2 > 0) g.fillRect(-w, -L * k2, w * 2, L * 2 * k2);
    g.globalAlpha = 0.6 * fade;
    g.strokeStyle = C.gray;
    g.lineWidth = Math.max(2, s.w * 0.28);
    g.beginPath(); g.arc(0, 0, s.size * 0.68 * k1 * (1 + beatP * 0.2), 0, 7); g.stroke();
    g.restore();
  },

  /* 环绕轨道：几何体沿轨道持续环绕中心公转，轨道随节拍收缩膨胀 */
  orbit(g, inst, t, fade) {
    inst.shapes.forEach(s => {
      const k = easeOutCubic(prog(t, s.delay));
      if (k <= 0) return;
      const a = s.ang0 + t * s.speed + inst.dir * (1 - k) * 1.8;
      const R = s.rad * k * (1 + beatP * 0.22);
      const x = inst.cx + Math.cos(a) * R;
      const y = inst.cy + Math.sin(a) * R;
      g.globalAlpha = fade;
      drawPiece(g, s.kind, s.color, x, y, s.size * (0.6 + 0.4 * k) * (1 + beatP * 0.35), t * 1.2 * inst.dir);
    });
    const ck = easeOutBack(prog(t, 0));
    if (ck > 0) {
      g.globalAlpha = fade;
      drawPiece(g, 'circle', C.amber, inst.cx, inst.cy,
        inst.coreR * ck * (1 + beatP * 0.5), 0);
    }
  },

  /* 波浪丝带：四条波浪带交替滑入，持续起伏，振幅随节拍加大 */
  wave(g, inst, t, fade) {
    const step = Math.max(14, fxW / 28);
    for (const s of inst.shapes) {
      const k = easeOutCubic(prog(t, s.delay, 0.6));
      if (k <= 0) continue;
      const off = (1 - k) * (fxW + 120) * s.side;
      const amp = s.amp * (0.6 + 0.4 * k) * (1 + beatP * 0.8);
      g.globalAlpha = 0.9 * fade;
      g.fillStyle = s.color;
      g.beginPath();
      for (let x = -60; x <= fxW + 60; x += step) {
        const y = s.y0 + Math.sin((x / s.wl) * Math.PI * 2 + t * s.speed) * amp;
        x === -60 ? g.moveTo(x + off, y) : g.lineTo(x + off, y);
      }
      for (let x = fxW + 60; x >= -60; x -= step) {
        const y = s.y0 + s.th * (1 + beatP * 0.3)
          + Math.sin((x / s.wl) * Math.PI * 2 + t * s.speed + 0.9) * amp;
        g.lineTo(x + off, y);
      }
      g.closePath(); g.fill();
    }
  },

  /* 星星弹跳：星星弹性冒出并闪烁自转，随节拍闪烁加剧 */
  stars(g, inst, t, fade) {
    inst.shapes.forEach((s, i) => {
      const k = easeOutElastic(prog(t, s.delay));
      if (k <= 0) return;
      const tw = 1 + 0.15 * Math.sin(t * 3.2 + i * 2.1) + beatP * 0.4;
      g.globalAlpha = 0.97 * fade;
      drawPiece(g, 'star', s.color, s.x, s.y, s.r * k * tw, s.rot + t * 0.7 * inst.dir);
    });
  },

  /* 旋转线栅：圆形视窗内平行线逐条展开，整体旋转，随节拍胀缩增粗 */
  grid(g, inst, t, fade) {
    const s = inst.shapes[0];
    const R = s.radius * (1 + beatP * 0.16 + 0.03 * Math.sin(t * 1.3));
    g.save();
    g.translate(inst.cx, inst.cy);
    g.rotate(inst.rot0 + t * 0.22 * inst.dir + beatP * 0.06 * inst.dir);
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.clip();
    for (const ln of s.lines) {
      const k = easeOutCubic(prog(t, ln.delay));
      if (k <= 0) continue;
      g.globalAlpha = 0.92 * fade;
      g.strokeStyle = ln.color;
      g.lineWidth = ln.w * (1 + beatP * 0.8);
      g.beginPath();
      g.moveTo(-R * k, ln.y);
      g.lineTo(R * k, ln.y);
      g.stroke();
    }
    g.restore();
    const ok = easeOutBack(prog(t, 0));
    if (ok > 0) {
      g.globalAlpha = fade;
      g.strokeStyle = C.amber;
      g.lineWidth = 4 * (1 + beatP * 0.8);
      g.beginPath(); g.arc(inst.cx, inst.cy, R * ok, 0, 7); g.stroke();
    }
  },
};

/* 折线按可见长度部分描边，返回当前端点 */
function strokePartial(g, pts, lens, vis) {
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = lens[i - 1];
    if (acc + seg <= vis) {
      g.lineTo(pts[i].x, pts[i].y);
      acc += seg;
    } else {
      const f = seg > 0 ? (vis - acc) / seg : 0;
      const tx = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f;
      const ty = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f;
      g.lineTo(tx, ty);
      return { x: tx, y: ty };
    }
  }
  return pts[pts.length - 1];
}

/* 生成一个全屏特效实例（原点固定在屏幕正中心） */
function buildEffect(type) {
  const rng = mulberry32((Math.random() * 1e9) | 0);
  const inst = {
    type,
    cx: cx0(), cy: cy0(),
    t0: 0, state: 'in', outT0: 0,
    rot0: rng() * Math.PI * 2,
    dir: rng() < 0.5 ? -1 : 1,
    shapes: [],
  };
  BUILD[type](inst, rng);
  return inst;
}

/* 触发全屏特效：新特效叠上，旧特效退场 */
function spawnEffect(zi, when) {
  const type = EFFECTS[zi % EFFECTS.length];
  const now = nowSec();

  for (const e of fxList) {
    if (e.state !== 'out') { e.state = 'out'; e.outT0 = now; }
  }
  while (fxList.length > 4) fxList.shift();   // 快速连打时兜底清理

  const inst = buildEffect(type);
  inst.t0 = Math.min(when == null ? now : when, now + 0.05);       // 尽量贴节拍，最多延迟 50ms
  fxList.push(inst);
}

/* 每帧绘制：固定米白背景 → 各特效（按叠放顺序） */
function fxFrame(now) {
  fx2d.clearRect(0, 0, fxW, fxH);

  for (let i = fxList.length - 1; i >= 0; i--) {
    const inst = fxList[i];
    const t = now - inst.t0;
    if (t < 0) continue;                                  // 等待节拍点
    if (inst.state !== 'out' && t >= FX_LIFE) {
      inst.state = 'out';
      inst.outT0 = inst.t0 + FX_LIFE;
    }
    let outK = 0;
    if (inst.state === 'out') {
      outK = clamp01((now - inst.outT0) / FX_OUT);
      if (outK >= 1) { fxList.splice(i, 1); continue; }   // 退场完毕，移除
    }

    // 常驻特效整体随节拍呼吸；退场特效整体淡出 + 缩小
    const fade = 1 - smooth(outK);
    const sc = inst.state === 'out' ? 1 - 0.22 * outK : 1 + beatP * 0.05;
    fx2d.save();
    fx2d.translate(inst.cx, inst.cy);
    fx2d.scale(sc, sc);
    fx2d.translate(-inst.cx, -inst.cy);
    DRAW[inst.type](fx2d, inst, t, fade);
    fx2d.restore();
  }
}

function drawFx() {
  const now = nowSec();
  if (started && audio && musicStartTime) {
    const phase = (((audio.currentTime - musicStartTime) / SPB) % 1 + 1) % 1;
    beatP = Math.pow(1 - phase, 2.4);
  } else {
    beatP = 0;
  }
  avatarFrame.style.setProperty('--avatar-pulse', (1 + (musicOn ? beatP : 0) * 0.12).toFixed(3));
  fxFrame(now);
  requestAnimationFrame(drawFx);
}

function keyToZone(code) {
  for (let row = 0; row < KEY_ROWS.length; row += 1) {
    const column = KEY_ROWS[row].indexOf(code);
    if (column >= 0) return row * 4 + column;
  }
  return null;
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
  if (event.code === 'Escape' && aboutModal.classList.contains('is-open')) {
    event.preventDefault();
    closeAbout();
    return;
  }
  const zone = keyToZone(event.code);
  if (zone === null) {
    if (!started) void startAudio().catch((error) => console.error('Audio initialization failed:', error));
    return;
  }
  event.preventDefault();
  triggerZone(zone);
});

async function beginGame() {
  startButton.disabled = true;
  startButton.classList.add('is-loading');
  try {
    await startAudio();
  } catch (error) {
    startButton.disabled = false;
    startButton.classList.remove('is-loading');
    console.error('Audio initialization failed:', error);
  }
}

function openAbout() {
  aboutModal.classList.add('is-open');
  aboutModal.setAttribute('aria-hidden', 'false');
  startShell.inert = true;
  aboutClose.focus();
}

function closeAbout() {
  aboutModal.classList.remove('is-open');
  aboutModal.setAttribute('aria-hidden', 'true');
  startShell.inert = false;
  aboutButton.focus();
}

overlay.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, a') || aboutModal.classList.contains('is-open')) return;
  event.preventDefault();
  void beginGame();
});
startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  void beginGame();
});
aboutButton.addEventListener('click', (event) => {
  event.stopPropagation();
  openAbout();
});
aboutClose.addEventListener('click', (event) => {
  event.stopPropagation();
  closeAbout();
});
aboutModal.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  if (event.target === aboutModal) closeAbout();
});

musicToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  pulseControl(musicToggle);
  musicOn = !musicOn;
  musicToggle.classList.toggle('is-muted', !musicOn);
  musicToggle.setAttribute('aria-label', musicOn ? '关闭背景音乐' : '开启背景音乐');
  musicBus.gain.setTargetAtTime(musicOn ? 0.19 : 0, audio.currentTime, 0.03);
});

sfxToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  pulseControl(sfxToggle);
  sfxOn = !sfxOn;
  sfxBus.gain.setTargetAtTime(sfxOn ? 0.78 : 0, audio.currentTime, 0.03);
  sfxToggle.classList.toggle('is-muted', !sfxOn);
  sfxToggle.setAttribute('aria-label', sfxOn ? '关闭音效' : '开启音效');
});

window.addEventListener('resize', resizeFx);
resizeFx();
requestAnimationFrame(drawFx);
