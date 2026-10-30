if (new URLSearchParams(location.search).get('paper') === '0617') {
  const [{ paperContent }, { initPaperMaterial }] = await Promise.all([
    import('./paper-content.js'), import('./paper-material.js?v=20261024-bio1')
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
  const back = document.querySelector('.social-back');
  if (back) {
    const url = new URL(back.href);
    url.searchParams.set('paper', '0617');
    back.href = url.href;
  }
}
