import { mountSpace } from './p34-space.js?v=20261107-journey';
export async function mountLuminousHome() {
  if (document.querySelector('script[src*="script.notebook.js"]') && document.body.dataset.surfaceReady !== 'true') {
    await new Promise(resolve => window.addEventListener('sayori:surface-ready', resolve, { once: true }));
  }
  return mountSpace({ site: 'home' });
}
export { mountLuminousHome as mountLivingWorld };
