'use strict';

const BPM = 128;
const TARGET_MIDI = Object.freeze([67, 64, 60, 57]);
const NOTE_NAMES = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
const SAMPLE_NAMES = Object.freeze(['da', 'gou', 'jiao']);
const SOURCE_MIDI = Object.freeze({ da: 41.75, gou: 41.80, jiao: 44.61 });
const COLORS = Object.freeze(['#df4b52', '#2168e8', '#f2c94c', '#2db28d']);
const KEY_ROWS = Object.freeze([
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
  ['KeyZ', 'KeyX', 'KeyC', 'KeyV'],
]);

if (TARGET_MIDI.length !== 4 || SAMPLE_NAMES.length !== 3) throw new Error('Subaru Tap map must stay 3 x 4.');

const stage = document.getElementById('stage');
const fx = document.getElementById('fx');
const fx2d = fx.getContext('2d');
const zonesEl = document.getElementById('zones');
const overlay = document.getElementById('overlay');
const avatarFrame = document.getElementById('avatar-frame');
const noteReadout = document.getElementById('note-readout');
const comboEl = document.getElementById('combo');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const buffers = {};
const particles = [];
const hotTimers = new Map();

let audio = null;
let musicBus = null;
let sfxBus = null;
let musicTimer = 0;
let started = false;
let musicOn = true;
let sfxOn = true;
let combo = 0;
let lastZone = -1;
let pointerDown = false;
let frameTime = 0;

function midiLabel(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

function resizeFx() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  fx.width = Math.round(innerWidth * ratio);
  fx.height = Math.round(innerHeight * ratio);
  fx2d.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function buildZones() {
  zonesEl.replaceChildren();
  const portrait = innerHeight > innerWidth;
  zonesEl.style.gridTemplateColumns = `repeat(${portrait ? 3 : 4}, 1fr)`;
  zonesEl.style.gridTemplateRows = `repeat(${portrait ? 4 : 3}, 1fr)`;
  const count = portrait ? 12 : 12;
  for (let i = 0; i < count; i += 1) {
    const row = portrait ? i % 4 : Math.floor(i / 4);
    const col = portrait ? Math.floor(i / 4) : i % 4;
    const pitchIndex = portrait ? row : col;
    const sampleRow = portrait ? col : row;
    const zone = document.createElement('button');
    zone.className = 'zone';
    zone.type = 'button';
    zone.dataset.zone = String(i);
    zone.style.gridRow = String(row + 1);
    zone.style.gridColumn = String(col + 1);
    zone.style.setProperty('--zone-color', COLORS[pitchIndex]);
    zone.setAttribute('aria-label', `${midiLabel(TARGET_MIDI[pitchIndex])} 音阶`);
    zone.innerHTML = `<span class="zone-label">${midiLabel(TARGET_MIDI[pitchIndex])}</span>`;
    zone.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      triggerZone(sampleRow, pitchIndex, event.clientX, event.clientY, i);
    });
    zonesEl.append(zone);
  }
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function startAudio() {
  if (started) return;
  started = true;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  musicBus = audio.createGain();
  sfxBus = audio.createGain();
  musicBus.gain.value = musicOn ? 0.22 : 0;
  sfxBus.gain.value = sfxOn ? 0.92 : 0;
  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 20;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.18;
  musicBus.connect(compressor);
  sfxBus.connect(compressor);
  compressor.connect(audio.destination);
  if (audio.state === 'suspended') await audio.resume();
  await Promise.all(SAMPLE_NAMES.map(async (name) => {
    buffers[name] = await audio.decodeAudioData(decodeBase64(AUDIO_B64[name]));
  }));
  overlay.classList.add('is-hidden');
  musicTimer = window.setInterval(playMusicPulse, (60 / BPM) * 4000);
  playMusicPulse();
}

function playMusicPulse() {
  if (!audio || !musicOn) return;
  const now = audio.currentTime;
  const root = [220, 261.63, 293.66, 329.63][Math.floor(now * BPM / 60) % 4];
  [root, root * 1.25, root * 1.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = index === 0 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.035 : 0.018, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
    oscillator.connect(gain).connect(musicBus);
    oscillator.start(now);
    oscillator.stop(now + 1.7);
  });
}

function triggerZone(row, col, x, y, index) {
  if (!started) {
    void startAudio().then(() => triggerZone(row, col, x, y, index));
    return;
  }
  if (index === lastZone && pointerDown) return;
  lastZone = index;
  combo += 1;
  comboEl.textContent = String(combo).padStart(2, '0');
  const targetMidi = TARGET_MIDI[col];
  const note = midiLabel(targetMidi);
  noteReadout.textContent = note;
  noteReadout.style.borderColor = COLORS[col];
  const zone = zonesEl.querySelector(`[data-zone="${index}"]`);
  zone.classList.remove('is-hot');
  void zone.offsetWidth;
  zone.classList.add('is-hot');
  clearTimeout(hotTimers.get(index));
  hotTimers.set(index, window.setTimeout(() => zone.classList.remove('is-hot'), 180));
  avatarFrame.classList.remove('is-barking');
  void avatarFrame.offsetWidth;
  avatarFrame.classList.add('is-barking');
  if (sfxOn) playSample(SAMPLE_NAMES[row], targetMidi);
  burst(x || innerWidth / 2, y || innerHeight / 2, COLORS[col], targetMidi);
}

function playSample(name, targetMidi) {
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = buffers[name];
  source.playbackRate.value = 2 ** ((targetMidi - SOURCE_MIDI[name]) / 12);
  gain.gain.setValueAtTime(0.82, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + Math.max(.32, source.buffer.duration / source.playbackRate.value));
  source.connect(gain).connect(sfxBus);
  source.start();
}

function burst(x, y, color, midi) {
  const amount = 16 + (midi % 5) * 3;
  for (let i = 0; i < amount; i += 1) {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * .2;
    const speed = 1.5 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, size: 2 + Math.random() * 7, color, kind: i % 3 });
  }
  particles.push({ x, y, vx: 0, vy: 0, life: 1, size: 16 + midi % 9, color, kind: 9 });
}

function drawFx(time) {
  const dt = Math.min(32, time - frameTime || 16) / 16;
  frameTime = time;
  fx2d.clearRect(0, 0, innerWidth, innerHeight);
  fx2d.globalCompositeOperation = 'lighter';
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= .985;
    p.vy *= .985;
    p.life -= .018 * dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    fx2d.globalAlpha = Math.max(0, p.life) * .78;
    fx2d.strokeStyle = p.color;
    fx2d.fillStyle = p.color;
    if (p.kind === 9) {
      fx2d.lineWidth = 3;
      fx2d.beginPath();
      fx2d.arc(p.x, p.y, p.size * (1.8 - p.life), 0, Math.PI * 2);
      fx2d.stroke();
    } else if (p.kind === 0) {
      fx2d.fillRect(p.x, p.y, p.size, p.size);
    } else {
      fx2d.save();
      fx2d.translate(p.x, p.y);
      fx2d.rotate(p.life * 4);
      fx2d.beginPath();
      fx2d.moveTo(0, -p.size); fx2d.lineTo(p.size, 0); fx2d.lineTo(0, p.size); fx2d.lineTo(-p.size, 0); fx2d.closePath();
      fx2d.fill();
      fx2d.restore();
    }
  }
  fx2d.globalAlpha = 1;
  fx2d.globalCompositeOperation = 'source-over';
  requestAnimationFrame(drawFx);
}

function keyToZone(code) {
  for (let row = 0; row < KEY_ROWS.length; row += 1) {
    const col = KEY_ROWS[row].indexOf(code);
    if (col >= 0) return { row, col, index: row * 4 + col };
  }
  return null;
}

stage.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  pointerDown = true;
  try { stage.setPointerCapture(event.pointerId); } catch (_) { /* old browsers */ }
  const rect = stage.getBoundingClientRect();
  const portrait = innerHeight > innerWidth;
  const col = Math.min(3, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * (portrait ? 3 : 4))));
  const row = Math.min(3, Math.max(0, Math.floor((event.clientY - rect.top) / rect.height * (portrait ? 4 : 3))));
  triggerZone(portrait ? col : row, portrait ? row : col, event.clientX, event.clientY, portrait ? col * 4 + row : row * 4 + col);
});

stage.addEventListener('pointermove', (event) => {
  if (!pointerDown || !started) return;
  const rect = stage.getBoundingClientRect();
  const portrait = innerHeight > innerWidth;
  const col = Math.min(3, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * (portrait ? 3 : 4))));
  const row = Math.min(3, Math.max(0, Math.floor((event.clientY - rect.top) / rect.height * (portrait ? 4 : 3))));
  triggerZone(portrait ? col : row, portrait ? row : col, event.clientX, event.clientY, portrait ? col * 4 + row : row * 4 + col);
});

window.addEventListener('pointerup', () => { pointerDown = false; lastZone = -1; });
window.addEventListener('pointercancel', () => { pointerDown = false; lastZone = -1; });
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const key = keyToZone(event.code);
  if (!key) return;
  event.preventDefault();
  triggerZone(key.row, key.col, innerWidth / 2, innerHeight / 2, key.index);
});

musicToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  musicOn = !musicOn;
  musicBus.gain.setTargetAtTime(musicOn ? .22 : 0, audio.currentTime, .03);
  musicToggle.classList.toggle('is-muted', !musicOn);
  musicToggle.setAttribute('aria-label', musicOn ? '关闭背景音乐' : '开启背景音乐');
});

sfxToggle.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!started) await startAudio();
  sfxOn = !sfxOn;
  sfxBus.gain.setTargetAtTime(sfxOn ? .92 : 0, audio.currentTime, .03);
  sfxToggle.classList.toggle('is-muted', !sfxOn);
  sfxToggle.setAttribute('aria-label', sfxOn ? '关闭音效' : '开启音效');
});

window.addEventListener('resize', () => { resizeFx(); buildZones(); });
resizeFx();
buildZones();
requestAnimationFrame(drawFx);
