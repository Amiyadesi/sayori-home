import { mountLivingWorld } from './p34-living.js?v=20261101-r5';
const mounted = new WeakMap();
let resumeRegistered = false;
export function initPaperMaterial() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  const body = document.body;
  if (mounted.has(body)) return mounted.get(body);
  if (!resumeRegistered) {
    resumeRegistered = true;
    window.addEventListener('pageshow', event => { if (event.persisted) initPaperMaterial(); });
  }
  const lifecycle = new AbortController();
  const stop = mountLivingWorld({ signal: lifecycle.signal });
  const cleanup = () => { stop(); lifecycle.abort(); mounted.delete(body); };
  window.addEventListener('pagehide', cleanup, { signal:lifecycle.signal, once:true });
  mounted.set(body,cleanup);
  return cleanup;
}
