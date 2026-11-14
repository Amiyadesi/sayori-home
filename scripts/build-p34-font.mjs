import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LINES, CHOICES } from '../public/p34-script.js';
import { TTFLoader } from '../public/third-party/three/TTFLoader.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/build-p34-font.mjs <NotoSerifSC[wght].ttf> (requires Python fonttools)');
const target = path.join(root, 'public/assets/p34/voice-serif.ttf');
execFileSync('python', ['-c', `
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
old = TTFont(sys.argv[2])
font = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': 400})
chars = set(old.getBestCmap()) | set(map(ord, sys.argv[3])) | set(range(32, 127))
sub = subset.Subsetter(); sub.populate(unicodes=chars); sub.subset(font)
font.save(sys.argv[2])
`, path.resolve(source), target, JSON.stringify({ LINES, CHOICES })], { stdio: 'inherit' });
const bytes = fs.readFileSync(target);
const font = new TTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
fs.writeFileSync(path.join(root, 'public/assets/p34/dialogue.typeface.json'), JSON.stringify(font));
console.log('Updated voice-serif.ttf and dialogue.typeface.json');
