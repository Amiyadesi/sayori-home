export function paperCommand(raw) {
  const command = raw.trim().toLowerCase().replace(/^\//, '');
  switch (command) {
    case 'help':
      return { text: 'ls · cat 0617 · whoami · clear · motion off / on · exit · home' };
    case 'ls':
      return { text: '0617.txt' };
    case 'cat 0617':
    case 'cat 0617.txt':
    case 'cat .0617':
      return { text: 'Amiya_desi / 0617\n页面上的字可以回应你。' };
    case 'whoami':
      return { text: 'owner: Amiya_desi\nreader: —' };
    case 'note':
    case 'hello':
      return { text: '活字版心：我就在这页排好的字行之间，回正面点按字句就能直接和我交谈。' };
    case 'clear': case 'cls':
      return { action: 'clear' };
    case 'motion off':
      return { action: 'still', text: '动态已关闭。' };
    case 'motion on':
      return { action: 'motion', text: '动态遵循系统设置。' };
    case 'exit': case 'restore': case 'quit':
      return { action: 'close' };
    case 'home':
      return { action: 'normal' };
    default:
      return { text: '文件或命令不存在。' };
  }
}
