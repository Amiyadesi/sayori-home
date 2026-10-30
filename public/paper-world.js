// Fictional project notes, shared by the native home surfaces and terminal.
export const paperRecord = Object.freeze({
  date: '2026-06-17', zone: 'UTC+8', build: 'P34-0617', version: '0.3.4',
  index: '02:13 · 人工填写版本索引；不是导出或运行证明。',
  author: '03:40 · 作者记录：手边没有可执行文件。',
  image: '同一构建的房间截图：原稿只有一扇门。',
  changed: '同一构建的房间截图：多出第二扇门，署名也变了。'
});

export function paperCommand(raw) {
  const command = raw.trim().toLowerCase().replace(/^\//, '');
  switch (command) {
    case 'help':
      return { text: 'ls · cat 0617 · whoami · clear · motion off / on · exit · home' };
    case 'ls':
      return { text: '0617.txt\nroom.png' };
    case 'cat 0617':
    case 'cat 0617.txt':
    case 'cat .0617':
      return { text: `${paperRecord.date} ${paperRecord.zone}\n${paperRecord.build} / ${paperRecord.version}\n${paperRecord.index}\n${paperRecord.author}` };
    case 'cat room.png':
      return { text: `${paperRecord.build} / room.png\n原稿：一扇门。署名：Amiya_desi。` };
    case 'whoami':
      return { text: 'owner: Amiya_desi\nreader: —' };
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
