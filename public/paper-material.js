import { mountNativeHome } from './p34-home.js?v=20261103-r13';
export function initPaperMaterial() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  return mountNativeHome();
}
