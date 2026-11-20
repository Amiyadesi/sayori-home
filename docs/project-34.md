## Project 34：她的空间 (`/?paper=0617`)

正式入口为 `https://sayori.org/?paper=0617`，正常主页也可点「翻看纸角」。普通页面不加载 Three.js；进入后才加载网页背面的回廊、书库与阁楼。

- WASD 移动，拖动画面环视，双击锁定鼠标，E 互动，Esc 暂停。暂停菜单可返回正常网页；触屏提供方向控制。
- 普通门洞在实际跨槛时切层。侧廊、窗室和夹层可自由探索；西侧巡行异物与东窗异物会对观察、靠近作出反应。
- 折页台的 2D 草图改变回廊桥面；书库通往 `blog.sayori.org` 的 3D 阅览室，在真实笔记内调草图，再返回书库投射。
- 对话是中央逐字出现、退场的立体字，没有蓝色蒙层、取景框或装饰光带。支持减少动态效果。
- 浏览器前后退、刷新和返回原网页可用。探索进度用 `.sayori.org` Cookie 在两站间传递；旧存档保留兼容。公开留言复用既有评论服务，只有主动提交才发送。

共享真源为 `public/p34-*`，3D 建筑在 `p34-world3d.js`，美术与居民在 `p34-building.js`、`p34-residents.js`，台词在 `p34-script.js`。少女身份与后续剧情未定。

```powershell
python -m http.server 8980 --bind 127.0.0.1 --directory public
node scripts/sync-p34-space.mjs # 同步到相邻 sayori-blog/public
npm test
```


字体为 Noto Serif SC 的局部字集，许可在 `public/assets/p34/OFL.txt`。建筑与居民暂用程序材质和低模；未接在线 Gemini，移动真机和 Safari 性能仍待实测。
