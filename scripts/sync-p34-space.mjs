import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const home = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const blog = path.resolve(process.argv[2] || path.join(home, '../../sayori-blog/public'));
if (!fs.existsSync(path.join(blog, 'paper-blog.js'))) throw new Error('Expected sayori-blog/public');
for (const file of ['p34-space.js', 'p34-space.css', 'p34-motion.js', 'p34-light.js', 'p34-space-content.js', 'p34-passage.js', 'p34-journey.js', 'p34-breakout-levels.js', 'p34-breakout-core.js', 'p34-breakout.js', 'p34-breakout.css', 'p34-adventure.js', 'p34-adventure.css', 'p34-residue.js', 'p34-residue.css']) {
  fs.copyFileSync(path.join(home, file), path.join(blog, file));
  console.log(file);
}
fs.mkdirSync(path.join(blog, 'assets/p34'), { recursive: true });
for (const file of ['voice-serif.ttf', 'OFL.txt']) fs.copyFileSync(path.join(home, 'assets/p34', file), path.join(blog, 'assets/p34', file));
