if (new URLSearchParams(location.search).get('paper') === '0617') {
  const [{ paperContent }, { initPaperMaterial }] = await Promise.all([
    import('./paper-content.js'), import('./paper-material.js?v=20261103-r13')
  ]);
  initPaperMaterial();
  window.addEventListener('pageshow', event => { if (event.persisted) initPaperMaterial(); });
  const links = document.querySelector('.social-links');
  const template = links?.firstElementChild;
  if (template) for (const entry of paperContent.social) {
    if ([...links.querySelectorAll('a')].some(link => link.href === entry.href)) continue;
    const item = template.cloneNode(true), link = item.querySelector('a');
    link.href = entry.href;
    item.querySelector('.social-platform').textContent = entry.label;
    item.querySelector('.social-handle').textContent = entry.handle;
    links.append(item);
  }
}
