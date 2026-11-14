if (new URLSearchParams(location.search).get('paper') === '0617') {
  const { initPaperMaterial } = await import('./paper-material.js?v=20261108-revision');
  await initPaperMaterial();
  window.addEventListener('pageshow', event => { if (event.persisted) void initPaperMaterial(); });
}
