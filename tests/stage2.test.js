import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,preview,build as viteBuild} from 'vite';
import {courseUnit,scrollCourseUnit} from '../src/navigation.js';
import {CHAPTERS,COVERAGE} from '../src/chapter-manifest.js';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const chapters=Object.keys(CHAPTERS).map(id=>read('public/data/chapters/'+id+'.json'));
const body=id=>{const c=chapters.find(c=>c.id===id);return c.sections.flatMap(s=>[s.title,...s.paragraphs,...s.answer]).join('\n')};

test('curriculum jumps resolve all units after async content rendering and accept old bookmarks',()=>{
 for(let n=1;n<=13;n++){
  const unit='U'+n;assert.equal(courseUnit('#/path/'+unit),unit);assert.equal(courseUnit('#u-'+unit),unit);
  const calls=[];scrollCourseUnit(unit,{getElementById:id=>({scrollIntoView:opts=>calls.push([id,opts])})});
  assert.deepEqual(calls,[['u-'+unit,{block:'start'}]]);
 }
 for(const hash of ['#/path/U14','#/path/U0','#/reader/u1l1','#u-U1/extra','#/path/U1<script>'])assert.equal(courseUnit(hash),null);
 const main=text('src/main.js');assert.match(main,/href="#\/path\/\$\{u.id\}"/);assert.doesNotMatch(main,/href="#u-/);
 assert.match(main,/if\(unit\)return path\(unit\)/);assert.match(main,/scrollCourseUnit\(unitId,document\)/);
});

test('manifest and icons have exactly one base in actual Vite dev and built preview HTTP responses',async()=>{
 const outDir=mkdtempSync(join(tmpdir(),'brainvest-http-'));
 await viteBuild({build:{outDir,emptyOutDir:true},logLevel:'silent'});
 const dev=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'silent'});
 const prod=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0},logLevel:'silent'});
 try{
  await dev.listen();
  for(const server of [dev,prod]){
   const address=server.httpServer.address(),origin='http://127.0.0.1:'+address.port;
   const page=await fetch(origin+'/mrbrain-invest/').then(r=>r.text());
   const href=page.match(/rel="manifest" href="([^"]+)"/)?.[1];assert.equal(href,'/mrbrain-invest/manifest.webmanifest');
   assert.doesNotMatch(page,/mrbrain-invest\/mrbrain-invest\//);
   const response=await fetch(new URL(href,origin));assert.equal(response.status,200);const manifest=await response.json();assert.equal(manifest.scope,'/mrbrain-invest/');
   const icon=page.match(/rel="icon" href="([^"]+)"/)?.[1];assert.equal(icon,'/mrbrain-invest/icon.svg');
   assert.match(await fetch(new URL(icon,origin)).then(r=>r.text()),/<svg/);
  }
 }finally{await dev.close();await new Promise(resolve=>prod.httpServer.close(resolve));rmSync(outDir,{recursive:true,force:true});}
});

test('manifest generation equals authored content and exposes book scope without full-book claims',()=>{
 assert.equal(COVERAGE.longformLessons,68);assert.equal(COVERAGE.thematicBookModules,5);
 for(const c of chapters)assert.equal(CHAPTERS[c.id].sectionCount,c.sections.length);
 assert.equal(CHAPTERS.B12.sectionCount,14);assert.equal(CHAPTERS.B13.sectionCount,12);
 assert.match(CHAPTERS.B12.scope,/不是本轮通读/);assert.match(CHAPTERS.B13.scope,/405/);
 for(const id of ['B12','B13'])assert.match(body(id),/不(?:是|声称)本轮重新通读/);
});

test('all cited principle IDs and section IDs are real; planned relationships never count as studies',()=>{
 const k=read('public/data/knowledge.json');const pids=new Set(k.principles.map(p=>p.id));
 for(const c of chapters)for(const id of c.principles)assert.ok(pids.has(id),c.id+' P'+id);
 const coverage=read('public/data/coverage.json');
 assert.ok(coverage.rows.find(r=>r.id==='P135').targets.includes('B12'));
 assert.ok(coverage.rows.find(r=>r.id==='CK24').targets.includes('B12'));
 assert.ok(coverage.rows.find(r=>r.id==='B12').targets.includes('B12'));
 assert.equal(coverage.rows.filter(r=>r.depth==='independent-explanation').length,Object.keys(read('content/principle-studies.json')).length);
 for(const r of coverage.rows.filter(r=>r.type==='principle'&&!k.principles.find(p=>'P'+p.id===r.id)?.study))assert.notEqual(r.depth,'independent-explanation');
});

test('the accounting, investment and cycle modules retain substantive distinctions and date caveats',()=>{
 assert.match(body('B12'),/有形账面/);assert.match(body('B12'),/净流动资产/);assert.match(body('B12'),/5–10年/);assert.match(body('B12'),/1962/);assert.match(body('B12'),/股东公平|卖方公平/);
 assert.match(body('B13'),/2016-03-16/);assert.match(body('B13'),/2016-03-24/);assert.match(body('B13'),/时点分开/);assert.match(body('B13'),/没有作者具体BTC结论/);assert.match(body('B13'),/本轮未另取原始行情核价/);
 assert.match(body('u4l2'),/−18/);assert.match(body('u4l6'),/−5/);assert.match(body('u4l7'),/现代评论层/);assert.match(body('u2l3'),/未经.*证实|未完整说明来源/);
 // Explicit inline dates are checked too, not only generated source metadata.
 const dates=Object.fromEntries(read('content/source-index.json').sources.map(s=>[s.id,s.date]));
 for(const c of chapters.filter(c=>!/^u1|^B4$/.test(c.id)))for(const m of body(c.id).matchAll(/(V\d+)（(\d{4}-\d{2}-\d{2})）/g))assert.equal(m[2],dates[m[1]],c.id+' '+m[1]);
});

test('worked U2–U5 arithmetic and B12 denominators are reproducible under stated assumptions',()=>{
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-4,`${a} != ${b}`);
 near(102/1.04,98.07692308);near(((1.01)**(365/90)-1)*100,4.1179410924);
 near((30-10)/30*100,66.6666667);near(120/150,.8);
 near((100-105)/105*100,-4.76190476);near(.4*-.5,-.2);
 near((100/10+100/5+100/10)*10,400);near((100/10+100/20+100/30)*30,550);
 near((1.1*.9-1)*100,-1);near((1.1/1.08-1)*100,1.85185185);
 near(800*(100-60-15-5)-20000,-4000);near(20000/(100-60-30-5),4000);
 near((25-20)/(200-100),.05);near(13*(9-6)-20,19);near(40/3,13.3333333);
 near(9*(11-6)-20,25);near(9*(11-7)-20,16);
 near(100-50-20-10-5-3,12);near(12+10-40,-18);near(20+10-25-15+5,-5);
 near(30+20*.8+30*.5+10-80,-9);near(20+15-10-30,-5);
 near((150-90-10)*2/3,33.3333333);near((150+80-90-10)*2/3,86.6666667);
 near(20/105*100,19.04761905);near(.05*1.5*2,.15);near(.10*.75*2,.15);
 near((20-150*.05)/50,.25);near(.4*.2,.08);near((2)**.2-1,.148698355);near((100*1.1**5/10/5)**.2-1,.26356819);
 near(900/80,11.25);near(900/95,9.47368421);
});

test('authored modules have distinct prose and nonidentical exercises rather than cloned templates',()=>{
 const signatures=new Set(),prompts=new Set();
 for(const c of chapters){
  const paragraphs=c.sections.flatMap(s=>s.paragraphs).filter(p=>!p.startsWith('问题：'));
  const signature=paragraphs.join('\n');assert.ok(!signatures.has(signature),c.id);signatures.add(signature);
  for(const s of c.sections.filter(s=>s.answer.length)){const prompt=s.paragraphs.join('\n');assert.ok(!prompts.has(prompt),c.id+' '+s.id);prompts.add(prompt);assert.ok(s.answer.join('').length>60,c.id+' explanation');}
 }
 // No shared lengthy paragraphs disguised by changing a title; very short reminders excluded.
 const seen=new Map();for(const c of chapters)for(const s of c.sections)for(const p of [...s.paragraphs,...s.answer].filter(p=>p.length>100)){
  assert.ok(!seen.has(p),`${c.id} duplicates ${seen.get(p)}`);seen.set(p,c.id);
 }
});

test('service worker installs every actual module, aborts safely if catalog fails and only removes network caches',async()=>{
 const {runInNewContext}=await import('node:vm');
 for(const healthy of [true,false]){
  const handlers={},stored=[],deleted=[];let wait,skipped=0;
  runInNewContext(text('public/sw.js'),{
   self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>skipped++,clients:{claim:async()=>{}}},
   fetch:async()=>({ok:healthy,json:async()=>read('public/data/chapters/index.json')}),
   caches:{open:async()=>({addAll:async assets=>stored.push(...assets)}),keys:async()=>['mb-v11-stage1-20261116','mb-v12-stage2-20261116','mb-v13-stage3-20261116','another-app'],delete:async key=>deleted.push(key)},
  });
  handlers.install({waitUntil:p=>wait=p});
  if(healthy){await wait;assert.equal(skipped,1);for(const id of Object.keys(CHAPTERS))assert.ok(stored.includes('/mrbrain-invest/data/chapters/'+id+'.json'),id);
   handlers.activate({waitUntil:p=>wait=p});await wait;assert.deepEqual(deleted,['mb-v11-stage1-20261116','mb-v12-stage2-20261116']);
  }else{await assert.rejects(wait,/keep previous offline version/);assert.equal(skipped,0);assert.deepEqual(deleted,[]);}
 }
 assert.doesNotMatch(text('public/sw.js'),/localStorage|indexedDB|mb-progress-v2/);
});

test('B12/B13 section positions and responses use unchanged progress keys and sync merge contract',async()=>{
 const {KEY,empty,encode,decode,mergeProgress}=await import('../src/progress.js');
 assert.equal(KEY,'mb-progress-v2');const state=empty();state.xp=360;state.current='u1l7';
 state.reading.B12={section:'assets',responses:{exercise:'应扣全部负债与优先权益'}};
 state.reading.B13={section:'revisions',responses:{transfer:'先写期限和反证'}};
 const result=mergeProgress(decode(encode(state)),{xp:360,days:[],lessons:{u1l1:{done:true,stars:3,best:4}}});
 assert.deepEqual(result.reading,state.reading);assert.equal(result.current,'u1l7');assert.equal(result.xp,360);
});
