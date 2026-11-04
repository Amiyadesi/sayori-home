import { mountLuminousHome } from './p34-luminous.js?v=20261104-prism';
let watchingHistory = false;
export function initPaperMaterial() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  if (!watchingHistory) {
    watchingHistory = true;
    window.addEventListener('popstate', () => {
      if (new URLSearchParams(location.search).get('paper') === '0617' && !document.querySelector('#p34-space')) mountLuminousHome();
    });
  }
  return mountLuminousHome();
}
