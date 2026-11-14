if (new URLSearchParams(location.search).get('paper') === '0617') {
  try {
    const { initPaperMaterial } = await import('./paper-material.js?v=20261113-library');
    await initPaperMaterial();
    window.addEventListener('pageshow', event => { if (event.persisted && !document.querySelector('#p34-space')) void initPaperMaterial(); });
  } catch (error) {
    console.error('Space entry failed', error);
    window.dispatchEvent(new Event('p34:entry-error'));
  }
}
