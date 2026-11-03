import { mountLuminousHome } from './p34-luminous.js?v=20261104-luminous';
export function initPaperMaterial() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  return mountLuminousHome();
}
