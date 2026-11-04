if (new URLSearchParams(location.search).get('paper') === '0617') {
  const [{ paperCommand }, { initPaperMaterial }] = await Promise.all([
    import('./paper-world.js'), import('./paper-material.js?v=20261104-pixelfx')
  ]);
  initPaperMaterial();
  window.addEventListener('pageshow', event => { if (event.persisted) initPaperMaterial(); });
  const emit = text => window.dispatchEvent(new CustomEvent('paper:response', { detail: text }));
  window.addEventListener('sayori:terminal-ready', () => {
    if (new URLSearchParams(location.search).get('paper') !== '0617') return;
    const title = document.querySelector('#terminal-title p');
    if (title) title.textContent = 'sayori.exe — /0617';
    document.querySelector('#terminal-output')?.replaceChildren();
    emit('Amiya_desi / 0617\n输入 hello，或直接点页面上的字。');
  });
  window.addEventListener('sayori:command', event => {
    if (new URLSearchParams(location.search).get('paper') !== '0617') return;
    event.preventDefault();
    emit('> ' + event.detail);
    const result = paperCommand(event.detail);
    if (result.text) emit(result.text);
    if (result.action === 'clear') document.querySelector('#terminal-output')?.replaceChildren();
    if (result.action === 'still' || result.action === 'motion') {
      window.dispatchEvent(new CustomEvent('paper:motion', { detail: result.action === 'motion' }));
    }
    if (result.action === 'close') window.dispatchEvent(new Event('paper:return'));
    if (result.action === 'normal') window.dispatchEvent(new Event('p34:send-back'));
  });
}
