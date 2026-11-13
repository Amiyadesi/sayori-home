import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const version='20261113-quiet';
const shell=article=>`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><script src="/p34-entry.js?v=${version}"></script><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>她写的</title><style>html,body{margin:0;background:#294b7a}</style><link rel="stylesheet" data-p34-reading-style href="/p34-reading.css?v=${version}"></head><body>${article.replace('<article','<article hidden')}<script type="module">if(new URLSearchParams(location.search).get('paper')==='0617'){try{const {mountPaperBlog}=await import('/paper-blog.js?v=${version}');await mountPaperBlog();}catch(error){console.error('Space entry failed',error);window.dispatchEvent(new Event('p34:entry-error'));}}else location.replace('https://blog.sayori.org/');</script></body></html>`;

export function packageJourney(homePublic,blogBuild,output){
  const posts=JSON.parse(fs.readFileSync(path.join(blogBuild,'her-space.json'),'utf8'));
  if(!Array.isArray(posts)||!posts.length||posts.some(p=>!p||!/^[a-z0-9-]+$/.test(p.slug)))throw new Error('Build her Blog before packaging the journey');
  fs.mkdirSync(output,{recursive:true});
  fs.cpSync(homePublic,output,{recursive:true,dereference:true,filter:p=>!['deployment.json','arg-release.json'].includes(path.basename(p))});
  for(const name of ['her-space.json','paper-blog.js','p34-reading.js','p34-reading.css'])fs.copyFileSync(path.join(blogBuild,name),path.join(output,name));
  fs.mkdirSync(path.join(output,'writing'),{recursive:true});
  fs.writeFileSync(path.join(output,'writing/index.html'),shell(''));
  for(const post of posts){
    const html=fs.readFileSync(path.join(blogBuild,'notes',post.slug,'index.html'),'utf8');
    const article=html.match(/<article\b[^>]*data-p34-native-post=["'][^"']+["'][^>]*>[\s\S]*?<\/article>/)?.[0];
    if(!article)throw new Error(`Missing rendered note: ${post.slug}`);
    const dir=path.join(output,'notes',post.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),shell(article));
  }
  function rewrite(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()){rewrite(file);continue;}
      if(!/\.(html|js|json)$/.test(entry.name))continue;
      const before=fs.readFileSync(file,'utf8');
      let after=before.replaceAll('https://blog.sayori.org/?paper=0617','/writing/?paper=0617')
        .replace(/https:\/\/blog\.sayori\.org\/(notes\/[^"'\s<>]+\?paper=0617)/g,'/$1')
        .replaceAll('https://sayori.org/?paper=0617','/?paper=0617');
      if(entry.name==='p34-space.js')after=after.replaceAll('href="/?paper=0617"','href="/writing/?paper=0617"')
        .replace("post ? post.href : '/?paper=0617'","post ? post.href : '/writing/?paper=0617'")
        .replace("if (ownNote) { cleanup(); location.assign('/'); return; }","if (site === 'blog') { cleanup(); location.assign('https://blog.sayori.org/'); return; }");
      // Do not prefetch the original blog's comments; her guestbook loads only when opened.
      if(entry.name.startsWith('script.notebook.'))after=after.replace(/runWhenIdle\(loadGuestbookNotes,\s*(?:3000|3e3)\);?/g,'');
      if(entry.name.endsWith('.html'))after=after.replace(/<script\b[^>]*src=["'][^"']*(?:analytics|umami)\.notebook\.js[^"']*["'][^>]*>\s*<\/script>/g,'');
      if(after!==before)fs.writeFileSync(file,after);
    }
  }
  rewrite(output);
  fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
  fs.appendFileSync(path.join(output,'_headers'),'\n/*\n  X-Robots-Tag: noindex, nofollow\n');
  return {notes:posts.length};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const blog=path.resolve(process.argv[2]||path.join(root,'../sayori-blog/.p34-preview'));
  const output=path.join(root,'output/p34-preview');
  console.log(packageJourney(path.join(root,'public'),blog,output));
  const homeSha=process.env.P34_HOME_SHA,blogSha=process.env.P34_BLOG_SHA;
  if(homeSha&&blogSha)fs.writeFileSync(path.join(output,'journey-deployment.json'),JSON.stringify({kind:'journey-preview',homeSha,blogSha,contentSha:process.env.P34_CONTENT_SHA,builtAt:new Date().toISOString()},null,2));
  console.log(output);
}
