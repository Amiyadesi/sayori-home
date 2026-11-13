import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHARED_P34_FILES = [
  'p34-entry.js',
  'p34-script.js',
  'p34-guestbook.js',
  'p34-space.js',
  'p34-space.css',
  'p34-motion.js',
  'p34-light.js',
  'p34-space-content.js',
  'p34-passage.js',
  'p34-journey.js',
  'p34-world3d.js',
  'p34-typography.js',
  'p34-adventure.js',
  'p34-adventure.css',
];

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const home = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
  const blog = path.resolve(process.argv[2] || path.join(home, '../../sayori-blog/public'));
  if (!fs.existsSync(path.join(blog, 'paper-blog.js'))) throw new Error('Expected sayori-blog/public');

  for (const file of SHARED_P34_FILES) {
    fs.copyFileSync(path.join(home, file), path.join(blog, file));
    console.log(file);
  }

  fs.mkdirSync(path.join(blog, 'assets/p34/models'), { recursive: true });
  for (const file of ['voice-serif.ttf', 'dialogue.typeface.json', 'OFL.txt']) {
    fs.copyFileSync(path.join(home, 'assets/p34', file), path.join(blog, 'assets/p34', file));
  }
  for (const file of ['paper-prism-lamp.glb', 'spatial-tuning-fork.glb']) {
    fs.copyFileSync(path.join(home, 'assets/p34/models', file), path.join(blog, 'assets/p34/models', file));
  }

  fs.mkdirSync(path.join(blog, 'third-party/three'), { recursive: true });
  for (const file of ['three.module.min.js', 'GLTFLoader.js', 'BufferGeometryUtils.js', 'CSS3DRenderer.js', 'FontLoader.js', 'TextGeometry.js', 'TTFLoader.js', 'opentype.module.js', 'LICENSE-opentype.txt', 'LICENSE.txt']) {
    fs.copyFileSync(path.join(home, 'third-party/three', file), path.join(blog, 'third-party/three', file));
  }
}
