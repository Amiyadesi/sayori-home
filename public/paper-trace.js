if (new URLSearchParams(location.search).get('paper') === '0617') {
  const [{ paperCommand, paperRecord }, { initPaperMaterial }] = await Promise.all([
    import('./paper-world.js'), import('./paper-material.js?v=20261024-bio1')
  ]);
  initPaperMaterial();
  window.addEventListener('pageshow', event => { if (event.persisted) initPaperMaterial(); });

  function mount() {
    for (const link of document.querySelectorAll('.entries a')) {
      const num = link.querySelector('.entry-num')?.textContent;
      if (['01', '02', '03'].includes(num)) {
        const url = new URL(link.href);
        url.searchParams.set('paper', '0617');
        link.href = url.href;
      }
    }
    if (document.querySelector('.trace-project-record')) return;
    const services = document.querySelector('.services-note');
    if (!services) return;
    const record = document.createElement('section');
    record.className = 'trace-project-record';
    record.setAttribute('aria-labelledby', 'trace-record-title');
    record.innerHTML = `<h3 id="trace-record-title">房间 / 0.3.4</h3>
      <p class="trace-record-meta">${paperRecord.date} ${paperRecord.zone} · ${paperRecord.build}<br>工程夹页</p>
      <p>${paperRecord.index}<br>${paperRecord.author}</p>
      <details class="trace-room-record"><summary>room.png · 夹在记录里的截图</summary>
        <figure><svg class="trace-room-image" viewBox="0 0 480 240" role="img" aria-labelledby="trace-room-title">
          <title id="trace-room-title">P34-0617 房间截图，墙上有一扇门。</title>
          <path fill="#b9c1b4" d="M0 0h480v240H0z"/><path fill="#929d8b" d="M0 240l98-66h290l92 66z"/>
          <path fill="#d5dacf" stroke="#596755" d="M98 174V28h290v146z"/>
          <path fill="#475144" stroke="#73806c" stroke-width="4" d="M144 174V70h54v104"/>
          <path class="trace-second-door" fill="#312c34" stroke="#81707e" stroke-width="4" d="M296 174V70h54v104"/>
          <path fill="none" stroke="#6d7865" d="M0 0l98 28m290 0 92-28M98 174L0 240m388-66 92 66"/>
          <text x="16" y="222" fill="#243021" font-family="monospace" font-size="12">P34-0617 / 0.3.4</text>
        </svg><figcaption><span class="trace-room-caption" aria-live="polite">${paperRecord.image}</span><br>原稿：一扇门 · Amiya_desi<br>本页署名：<span class="trace-reader-signature">Amiya_desi</span></figcaption></figure>
      </details>`;
    services.querySelector('.services-footnote')?.before(record);
    if (!record.isConnected) services.append(record);
    let revealTimer = 0;
    let changed = false;
    record.querySelector('details').addEventListener('toggle', event => {
      const open = event.currentTarget.open;
      clearTimeout(revealTimer);
      services.classList.toggle('trace-exposed', open);
      document.body.classList.toggle('trace-reading', open);
      if (open && !changed) revealTimer = setTimeout(() => {
        changed = true;
        record.classList.add('trace-image-changed');
        record.querySelector('.trace-room-caption').textContent = paperRecord.changed;
        record.querySelector('.trace-reader-signature').textContent = '正在阅读的人';
        record.querySelector('title').textContent = 'P34-0617 房间截图，墙上有两扇门。';
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900);
    });
    window.addEventListener('pagehide', () => clearTimeout(revealTimer), { once: true });
  }
  window.addEventListener('sayori:surface-ready', mount);
  mount();
  const emit = text => window.dispatchEvent(new CustomEvent('paper:response', { detail: text }));
  window.addEventListener('sayori:terminal-ready', () => {
    const title = document.querySelector('#terminal-title p');
    if (title) title.textContent = 'sayori.exe — /0617';
    document.querySelector('#terminal-output')?.replaceChildren();
    emit(`${paperRecord.date} ${paperRecord.zone}\n${paperRecord.build} / ${paperRecord.version}`);
  });
  window.addEventListener('sayori:command', event => {
    event.preventDefault();
    emit('> ' + event.detail);
    const result = paperCommand(event.detail);
    if (result.text) emit(result.text);
    if (result.action === 'clear') document.querySelector('#terminal-output')?.replaceChildren();
    if (result.action === 'still' || result.action === 'motion') {
      window.dispatchEvent(new CustomEvent('paper:motion', { detail: result.action === 'motion' }));
    }
    if (result.action === 'close') window.dispatchEvent(new Event('paper:return'));
    if (result.action === 'normal') location.assign('/');
  });
}
