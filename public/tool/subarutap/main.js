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
const PIECE_COUNTS = Object.freeze({
  knife: 18,
  rabbits: 22,
  choke: 18,
  hand: 18,
  mace: 16,
  wind: 20,
  freeze: 18,
  burst: 20,
  split: 18,
  void: 20,
  impact: 18,
  lightning: 18,
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
const hero = document.querySelector('.hero');
const avatar = document.getElementById('avatar');
const avatarFrame = document.getElementById('avatar-frame');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const buffers = {};
const deathFx = [];
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
  if (!buffer) return;
  const time = quantizedTapTime();
  const slot = Math.round((time - musicStartTime) / S8);
  if (lastTapSlots.get(index) === slot) return;
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

function spawnCorpse(type) {
  const corpse = document.createElement('div');
  corpse.className = 'corpse corpse-' + type;
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

function triggerZone(index, x = innerWidth / 2, y = innerHeight / 2) {
  if (!Number.isInteger(index) || !DEATH_EFFECTS[index]) return;
  if (!started) {
    void startAudio().then(() => triggerZone(index, x, y)).catch((error) => console.error('Tap start failed:', error));
    return;
  }
  if (audio.state === 'suspended') void audio.resume().catch(() => {});
  const effect = DEATH_EFFECTS[index];
  spawnCorpse(effect.type);
  animateAvatar(effect.type);
  if (sfxOn) playSample(index);
  flashZone(index, effect.color);
  spawnDeathEffect(effect, x, y);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutBack(value) {
  const t = clamp01(value) - 1;
  return 1 + 2.2 * t * t * t + 1.2 * t * t;
}

function polygon(context, sides, radius, rotation = 0) {
  context.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + Math.PI * 2 * i / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath();
}

function star(context, radius, spikes = 8) {
  context.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = -Math.PI / 2 + Math.PI * i / spikes;
    const length = i % 2 ? radius * 0.42 : radius;
    const x = Math.cos(angle) * length;
    const y = Math.sin(angle) * length;
    if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath();
}

function drawRabbit(context, size, color) {
  context.lineWidth = Math.max(1.5, size * 0.07);
  context.strokeStyle = '#090b16';
  context.fillStyle = '#f5d8cf';
  context.beginPath();
  context.ellipse(-size * 0.3, -size * 0.48, size * 0.16, size * 0.38, -0.12, 0, Math.PI * 2);
  context.ellipse(size * 0.3, -size * 0.48, size * 0.16, size * 0.38, 0.12, 0, Math.PI * 2);
  context.fill(); context.stroke();
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(-size * 0.3, -size * 0.5, size * 0.07, size * 0.25, -0.12, 0, Math.PI * 2);
  context.ellipse(size * 0.3, -size * 0.5, size * 0.07, size * 0.25, 0.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f5d8cf';
  context.beginPath(); context.arc(0, size * 0.03, size * 0.46, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = '#090b16';
  context.beginPath(); context.arc(-size * 0.16, 0, size * 0.055, 0, Math.PI * 2); context.arc(size * 0.16, 0, size * 0.055, 0, Math.PI * 2); context.fill();
}

function drawKnife(context, size, color) {
  context.lineCap = 'round';
  context.lineWidth = Math.max(1.5, size * 0.08);
  context.strokeStyle = '#090b16';
  context.fillStyle = '#f4f0ed';
  context.beginPath();
  context.moveTo(-size * 0.6, size * 0.45);
  context.lineTo(size * 0.48, -size * 0.5);
  context.lineTo(size * 0.62, -size * 0.28);
  context.lineTo(-size * 0.45, size * 0.57);
  context.closePath(); context.fill(); context.stroke();
  context.strokeStyle = color;
  context.lineWidth = size * 0.2;
  context.beginPath(); context.moveTo(-size * 0.62, size * 0.62); context.lineTo(-size * 0.28, size * 0.28); context.stroke();
}

function drawLoop(context, size, color) {
  context.lineWidth = Math.max(2, size * 0.09);
  context.strokeStyle = color;
  context.beginPath(); context.ellipse(0, size * 0.05, size * 0.54, size * 0.35, -0.2, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = '#f4f0ed';
  context.lineWidth = Math.max(1, size * 0.035);
  context.beginPath(); context.arc(0, size * 0.05, size * 0.42, 0, Math.PI * 1.55); context.stroke();
}

function drawHand(context, size, color) {
  context.fillStyle = '#090b16';
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.5, size * 0.06);
  context.beginPath(); context.roundRect(-size * 0.28, -size * 0.05, size * 0.56, size * 0.62, size * 0.18); context.fill(); context.stroke();
  for (let i = -2; i <= 2; i += 1) {
    const x = i * size * 0.13;
    context.beginPath(); context.roundRect(x - size * 0.06, -size * 0.52 - Math.abs(i) * size * 0.03, size * 0.12, size * 0.58, size * 0.06); context.fill(); context.stroke();
  }
}

function drawMace(context, size, color) {
  context.lineCap = 'round';
  context.strokeStyle = '#f4f0ed';
  context.lineWidth = Math.max(1.5, size * 0.07);
  context.beginPath(); context.moveTo(-size * 0.55, size * 0.55); context.lineTo(size * 0.28, -size * 0.22); context.stroke();
  context.fillStyle = color;
  context.strokeStyle = '#090b16';
  context.lineWidth = Math.max(1.5, size * 0.08);
  context.beginPath(); context.arc(size * 0.4, -size * 0.38, size * 0.25, 0, Math.PI * 2); context.fill(); context.stroke();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI * 2 * i / 6;
    context.beginPath();
    context.moveTo(size * 0.4 + Math.cos(angle) * size * 0.23, -size * 0.38 + Math.sin(angle) * size * 0.23);
    context.lineTo(size * 0.4 + Math.cos(angle) * size * 0.38, -size * 0.38 + Math.sin(angle) * size * 0.38);
    context.stroke();
  }
}

function drawWind(context, size, color) {
  context.strokeStyle = color;
  context.lineCap = 'round';
  context.lineWidth = Math.max(1.5, size * 0.07);
  for (let i = -1; i <= 1; i += 1) {
    context.beginPath();
    context.moveTo(-size * 0.65, i * size * 0.22);
    context.bezierCurveTo(-size * 0.15, -size * 0.55 + i * size * 0.22, size * 0.2, size * 0.55 + i * size * 0.22, size * 0.7, i * size * 0.05);
    context.stroke();
  }
}

function drawFreeze(context, size, color) {
  context.fillStyle = '#f4f0ed';
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.5, size * 0.07);
  polygon(context, 6, size * 0.55, Math.PI / 6); context.fill(); context.stroke();
  context.lineWidth = Math.max(1, size * 0.04);
  for (let i = 0; i < 3; i += 1) {
    const angle = i * Math.PI / 3;
    context.beginPath(); context.moveTo(0, 0); context.lineTo(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5); context.stroke();
  }
}

function drawBurst(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = '#090b16';
  context.lineWidth = Math.max(1.5, size * 0.07);
  star(context, size * 0.6, 8); context.fill(); context.stroke();
}

function drawSplit(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = '#090b16';
  context.lineWidth = Math.max(1.5, size * 0.07);
  context.beginPath(); context.moveTo(-size * 0.58, -size * 0.55); context.lineTo(-size * 0.04, -size * 0.14); context.lineTo(-size * 0.22, size * 0.6); context.lineTo(-size * 0.65, size * 0.36); context.closePath(); context.fill(); context.stroke();
  context.beginPath(); context.moveTo(size * 0.58, -size * 0.55); context.lineTo(size * 0.04, -size * 0.14); context.lineTo(size * 0.22, size * 0.6); context.lineTo(size * 0.65, size * 0.36); context.closePath(); context.fill(); context.stroke();
}

function drawVoid(context, size, color) {
  context.fillStyle = '#090b16';
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.5, size * 0.08);
  context.beginPath();
  context.moveTo(-size * 0.48, size * 0.5);
  context.bezierCurveTo(-size * 0.72, size * 0.05, -size * 0.25, -size * 0.12, -size * 0.48, -size * 0.58);
  context.bezierCurveTo(-size * 0.08, -size * 0.42, size * 0.05, -size * 0.25, size * 0.45, -size * 0.66);
  context.bezierCurveTo(size * 0.22, -size * 0.08, size * 0.74, size * 0.16, size * 0.48, size * 0.58);
  context.bezierCurveTo(size * 0.1, size * 0.35, size * 0.02, size * 0.8, -size * 0.48, size * 0.5);
  context.closePath(); context.fill(); context.stroke();
}

function drawImpact(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = '#090b16';
  context.lineWidth = Math.max(1.5, size * 0.08);
  star(context, size * 0.62, 7); context.fill(); context.stroke();
  context.fillStyle = '#f4f0ed';
  context.beginPath(); context.arc(0, 0, size * 0.16, 0, Math.PI * 2); context.fill();
}

function drawLightning(context, size, color) {
  context.fillStyle = color;
  context.strokeStyle = '#090b16';
  context.lineWidth = Math.max(1.5, size * 0.07);
  context.beginPath();
  context.moveTo(size * 0.18, -size * 0.68);
  context.lineTo(-size * 0.1, -size * 0.12);
  context.lineTo(size * 0.18, -size * 0.12);
  context.lineTo(-size * 0.22, size * 0.68);
  context.lineTo(-size * 0.04, size * 0.08);
  context.lineTo(-size * 0.3, size * 0.08);
  context.closePath(); context.fill(); context.stroke();
}

function drawDeathPiece(context, type, size, color, rotation, alpha, pulse) {
  context.save();
  context.translate(0, pulse * size * 0.08);
  context.rotate(rotation);
  context.globalAlpha = alpha;
  if (type === 'knife') drawKnife(context, size, color);
  else if (type === 'rabbits') drawRabbit(context, size, color);
  else if (type === 'choke') drawLoop(context, size, color);
  else if (type === 'hand') drawHand(context, size, color);
  else if (type === 'mace') drawMace(context, size, color);
  else if (type === 'wind') drawWind(context, size, color);
  else if (type === 'freeze') drawFreeze(context, size, color);
  else if (type === 'burst') drawBurst(context, size, color);
  else if (type === 'split') drawSplit(context, size, color);
  else if (type === 'void') drawVoid(context, size, color);
  else if (type === 'impact') drawImpact(context, size, color);
  else drawLightning(context, size, color);
  context.restore();
}

function spawnDeathEffect(effect, clickX, clickY) {
  const minDimension = Math.min(innerWidth, innerHeight);
  const edge = Math.min(76, Math.max(24, minDimension * 0.07));
  const pieces = [];
  const count = PIECE_COUNTS[effect.type] || 18;
  for (let i = 0; i < count; i += 1) {
    const centerBias = i < 3;
    pieces.push({
      x: centerBias ? clickX + (Math.random() - 0.5) * minDimension * 0.34 : edge + Math.random() * Math.max(1, innerWidth - edge * 2),
      y: centerBias ? clickY + (Math.random() - 0.5) * minDimension * 0.34 : edge + Math.random() * Math.max(1, innerHeight - edge * 2),
      vx: (Math.random() - 0.5) * minDimension * 0.05,
      vy: (Math.random() - 0.5) * minDimension * 0.045 - minDimension * 0.01,
      size: Math.max(18, Math.min(64, minDimension * (0.027 + Math.random() * 0.038))),
      rotation: (Math.random() - 0.5) * Math.PI,
      spin: (Math.random() - 0.5) * 3.6,
      delay: Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2,
    });
  }
  deathFx.push({ ...effect, age: 0, duration: effect.type === 'rabbits' ? 980 : 860, pieces });
  if (deathFx.length > 8) deathFx.shift();
}

function drawDeathEffect(effect) {
  const progress = clamp01(effect.age / effect.duration);
  const fade = progress < 0.64 ? 1 : 1 - (progress - 0.64) / 0.36;
  for (const piece of effect.pieces) {
    const local = clamp01((progress - piece.delay) / 0.82);
    if (!local) continue;
    const pop = easeOutBack(Math.min(1, local * 2.8));
    const drift = Math.min(1, local) * (local < 0.62 ? 1 : 0.76);
    const x = piece.x + piece.vx * drift;
    const y = piece.y + piece.vy * drift + Math.sin(effect.age * 0.008 + piece.phase) * 4;
    const pulse = Math.sin(effect.age * 0.012 + piece.phase);
    const scale = Math.max(0.01, pop * (1 - Math.max(0, local - 0.72) * 0.2));
    fx2d.save();
    fx2d.translate(x, y);
    fx2d.scale(scale, scale);
    drawDeathPiece(
      fx2d,
      effect.type,
      piece.size,
      effect.color,
      piece.rotation + piece.spin * local,
      fade * (1 - Math.max(0, local - 0.82) * 4),
      pulse,
    );
    fx2d.restore();
  }
}

function drawFx(time) {
  const delta = Math.min(32, time - frameTime || 16);
  frameTime = time;
  fx2d.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = deathFx.length - 1; i >= 0; i -= 1) {
    const effect = deathFx[i];
    effect.age += delta;
    if (effect.age >= effect.duration) {
      deathFx.splice(i, 1);
      continue;
    }
    drawDeathEffect(effect);
  }
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

overlay.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  event.preventDefault();
  void beginGame();
});
startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  void beginGame();
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
