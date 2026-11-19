(() => {
  function echo() {
  if (new URLSearchParams(location.search).get('paper') === '0617') return;
  const row = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('p34_journey_v2='));
  if (!row) return;
  import('./p34-journey.js?v=20261113-library').then(({ cookieJourney }) => {
    const loaded = cookieJourney(row);
    if (loaded.error) return;
    const paper = document.querySelector('.desk-odd-object');
    if (!paper) return;
    const sky = loaded.state.garden.sky;
    if (sky) paper.dataset.gardenSky = sky;
    paper.title = { morning: '清晨还在水院', afternoon: '四点的光还留着', dusk: '影子换了个方向', midnight: '里面那盏灯还亮着' }[sky] || '纸背的门还开着';
  }).catch(error => console.warn('Paper echo unavailable', error));
  }
  window.addEventListener('p34:normal-return', echo);
  window.addEventListener('pageshow', echo);
  echo();
})();
