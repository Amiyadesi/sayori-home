import { mountP34 } from './p34-organic.js?v=20261024-bio1';
const mounted = new WeakMap();
let resumeRegistered = false;

export function initPaperMaterial() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  const body = document.body;
  if (mounted.has(body)) return mounted.get(body);
  if (!resumeRegistered) {
    resumeRegistered = true;
    window.addEventListener('pageshow', event => { if (event.persisted && new URLSearchParams(location.search).get('paper') === '0617') initPaperMaterial(); });
  }
  body.classList.add('trace-found', 'trace-altered');
  const runtime = mountP34({ stageSelector: '.notebook-page,.letter-paper,.services-note,.social-paper,.side-note,.sticky-note' });
  const lifecycle = new AbortController(), { signal } = lifecycle;
  const originals = new Map();
  function swapDollAndMusic() {
    const doll = document.querySelector('.sayori-art-front');
    if (doll) {
      if (!originals.has(doll)) originals.set(doll, ['src', 'srcset', 'sizes'].map(key => [key, doll.getAttribute(key)]));
      doll.removeAttribute('srcset'); doll.removeAttribute('sizes');
      doll.src = '/assets/paper/sayori-torn-display.png'; doll.classList.add('paper-character');
    }
    const label = document.querySelector('.music-label'), music = document.querySelector('.music-btn');
    if (label) { if (!originals.has(label)) originals.set(label, label.textContent); label.textContent = '播放记录'; }
    if (music) { if (!originals.has(music)) originals.set(music, music.getAttribute('aria-label')); music.setAttribute('aria-label', '播放记录'); }
  }
  swapDollAndMusic();
  window.addEventListener('sayori:surface-ready', swapDollAndMusic, { signal });
  document.addEventListener('toggle', event => {
    if (event.target instanceof HTMLDetailsElement && event.target.matches('.trace-room-record') && event.target.open) {
      runtime.setLevel(Math.max(runtime.level, 2)); runtime.triggerVhsGlitch('record');
    }
  }, { signal, capture: true });
  let destroyed = false;
  const cleanup = () => {
    if (destroyed) return; destroyed = true; lifecycle.abort(); runtime.destroy();
    for (const [node, original] of originals) {
      if (Array.isArray(original)) { for (const [key, value] of original) { if (value === null) node.removeAttribute(key); else node.setAttribute(key, value); } node.classList.remove('paper-character'); }
      else if (node.matches('.music-label')) node.textContent = original;
      else if (original === null) node.removeAttribute('aria-label'); else node.setAttribute('aria-label', original);
    }
    mounted.delete(body);
  };
  window.addEventListener('pagehide', cleanup, { signal, once: true });
  mounted.set(body, cleanup); return cleanup;
}
