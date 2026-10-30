import { paperRecord } from './paper-world.js';

export const paperContent = {
  notes: [
    { nick: '补丁', comment: '纸下面的轮廓退了一点，影子还留在原来的地方。' },
    { nick: '留白', comment: '02:13 那一行是手工填的索引。我没有见过当时的运行文件。' },
    { nick: '补丁', comment: '同一张房间截图，昨天墙上还是一扇门。文件名没变。' },
    { nick: '留白', comment: '截图底下原本是作者的名字。现在不是了。' }
  ],
  sticky: ['纸背的轮廓比影子慢。', '那张截图还夹在软件记录里。', '署名处的墨还没干。'],
  social: [
    { label: 'Sayori Chat', handle: 'chat.sayori.org', href: 'https://chat.sayori.org/' }
  ],
  about: {
    intro: '我是 Amiya_desi。这里整理项目、作品和过程记录。有一页房间截图夹在最近的版本笔记里。',
    sections: [
      { heading: '项目记录', paragraphs: [
        `${paperRecord.date} ${paperRecord.zone} · ${paperRecord.build} / ${paperRecord.version}`,
        paperRecord.index, paperRecord.author,
        '原稿的房间里只有一扇门，截图下方是我的名字。'
      ] }
    ],
    signature: 'Amiya_desi',
    ps: '这份记录没有可执行附件。'
  },
  faq: { title: '文件备注', items: [
    { question: '版本索引意味着什么？', answer: '它是人工记录。索引里的时间不能证明文件已经导出或运行。' }
  ] },
  contact: { title: '联系', links: [
    { label: '社交账号', href: '/social/?paper=0617' }
  ] },
  services: [
    '软件与开发记录。', '公开服务与维护记录。', '文章与项目笔记。',
    '画布与工具记录。', 'GeoScore 的项目资料仍在原地址。', '实验与开发计划。'
  ],
  music: {
    ohayouSayori: { audio: '/assets/audio/paper/darkest-child.mp3', title: 'Darkest Child', isrc: 'USUAN1100783' },
    yourReality: { audio: '/assets/audio/paper/classic-horror-2.mp3', title: 'Classic Horror 2', isrc: 'USUAN1100470' },
    sayoNara: { audio: '/assets/audio/paper/ghost-story.mp3', title: 'Ghost Story', isrc: 'USUAN1300034' }
  }
};
