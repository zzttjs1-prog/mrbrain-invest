import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderReader} from '../src/reader.js';
import {KEY,BACKUP,empty,persist,loadProgress,encode,decode,mergeProgress} from '../src/progress.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('public/data/chapters/index.json');
const chapters=catalog.chapters.map(c=>read('public/data/chapters/'+c.id+'.json'));
const ledger=read('public/data/coverage.json');
const all=chapters.map(c=>c.sections.flatMap(s=>[...s.paragraphs,...s.answer]).join('\n'));
test('stage has seven distinct 8-section lesson longforms and one explicitly limited book module',()=>{
 assert.deepEqual(chapters.filter(c=>c.id.startsWith('u')).map(c=>c.id),Array.from({length:7},(_,i)=>'u1l'+(i+1)));
 assert.equal(chapters.length,8);for(const c of chapters){assert.equal(c.sections.length,8);assert.equal(new Set(c.sections.map(s=>s.id)).size,8);for(const s of c.sections)assert.ok(s.attribution&&s.paragraphs.length);}
 assert.equal(new Set(all).size,8);assert.match(chapters.find(c=>c.id==='B4').scope,/不是全书/);
 assert.equal(chapters.flatMap(c=>c.sections).filter(s=>s.answer.length).length,15);
});
test('all 363 matrix rows have support, actual depth, explicit gaps and planned targets',()=>{
 assert.equal(ledger.rows.length,363);assert.equal(new Set(ledger.rows.map(r=>r.id)).size,363);
 for(const r of ledger.rows){assert.ok(r.supportedTopics&&r.depth&&r.gaps&&r.targets.length,r.id);assert.ok(r.sources.length,r.id+' source');}
 assert.equal(ledger.rows.filter(r=>r.type==='lesson'&&r.depth==='eight-section-longform').length,7);
 assert.equal(ledger.rows.filter(r=>r.type==='principle'&&r.depth==='independent-explanation').length,10);
 assert.equal(ledger.rows.filter(r=>r.type==='check'&&r.depth==='evidence-procedure').length,7);
 assert.equal(ledger.rows.filter(r=>r.type==='principle'&&r.depth==='index-only').length,63);
 assert.equal(ledger.rows.filter(r=>r.type==='book'&&r.depth==='eight-field-core-summary').length,12);
});
test('principle and checklist explanations link to actual stable sections, not invented anchors',()=>{
 const k=read('public/data/knowledge.json');
 for(const r of [...k.principles,...k.checklist].filter(r=>r.study)){
  const s=r.study,c=chapters.find(c=>c.id===s.lesson);assert.ok(c?.sections.some(p=>p.id===s.section),r.id);
  for(const key of ('meaning'in s?['meaning','boundary','counterexample','method','exercise','answer']:['ask','how','evidence','failure']))assert.ok(s[key],r.id+' '+key);
 }
});
test('historical dates match source ledger and no missing technical appendix is presented as read',()=>{
 const k=read('content/source-index.json');for(const c of chapters)for(const s of c.sources){if(s.ref.startsWith('V'))assert.equal(s.date,k.sources.find(x=>x.id===s.ref).date);if(s.url)assert.ok(s.url.startsWith('https://'));}
 assert.match(all.join('\n'),/公式缺失/);assert.match(all.join('\n'),/不做机械止损|机械止损/);assert.match(all.join('\n'),/教学假设/);
});
test('worked arithmetic: recovery, losing streak, independent ruin, leverage and performance fee',()=>{
 const close=(a,b)=>assert.ok(Math.abs(a-b)<.0001,`${a} vs ${b}`);
 close(.4/.6,2/3);close(10000*.99**10,9043.820750088);close((1-.99**100)*100,63.39676587);
 close((1.02**8*.9**2-1)*100,-5.0955901388);close((1.3**12)*100,2329.808512248);
 close(400/(1-.25),533.3333333);close((600-400/(1-.25))/600*100,11.1111111);
 close(100*.6*1.5,90);close(100*.9**3,72.9);close(.2*-.3+.15*-.4+.1*-.5,-.17);
 close(.9*5-.1*60,-1.5);close(.9*4-.1*60,-2.4);close(.9*(5*.2),.9);
});
test('new longform sections and answers roundtrip without changing legacy six/360/18',()=>{
 const old={xp:360,days:['2026-11-02'],lessons:Object.fromEntries(Array.from({length:6},(_,i)=>['u1l'+(i+1),{done:true,stars:3,best:4}]))};
 const state=mergeProgress(empty(),old);state.current='u1l7';state.reading.u1l7={section:'exercise',responses:{exercise:'先查底层资金流',transfer:'尚未查处不等于安全'}};
 const map=new Map([[KEY,JSON.stringify(old)]]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(persist(storage,state),'');assert.deepEqual(JSON.parse(map.get(BACKUP)),old);
 const reopened=loadProgress(storage).state, imported=decode(encode(reopened));assert.deepEqual(imported.reading,state.reading);
 const again=mergeProgress(imported,decode(btoa(unescape(encodeURIComponent(JSON.stringify(old))))));
 assert.deepEqual(again.reading,state.reading);assert.equal(again.xp,360);assert.equal(Object.values(again.lessons).reduce((a,l)=>a+l.stars,0),18);assert.equal(again.current,'u1l7');
 const foreign=empty();foreign.reading.u1l7={section:'transfer',responses:{exercise:'另一台答案',redflags:'另一台新笔记'}};
 const merged=mergeProgress(again,foreign);assert.equal(merged.reading.u1l7.responses.exercise,'先查底层资金流');assert.equal(merged.reading.u1l7.responses.redflags,'另一台新笔记');assert.equal(merged.reading.u1l7.section,'exercise');
});
test('reader render and answer handler unit test: saved section, source attribution and no XP award',async()=>{
 const c=chapters.find(c=>c.id==='u1l7'),state=empty();state.xp=360;state.reading.u1l7={section:'exercise',responses:{exercise:'旧回答'}};
 let saved=0;const nodes={'main':{},'#reader-response':{},'#chapter-search':{},'#chapter-results':{}};
 const app={innerHTML:'',querySelector:k=>nodes[k]};globalThis.location={hash:'#/reader/u1l7'};
 await renderReader({id:'u1l7',get:async()=>c,state,save:()=>saved++,app,topbar:()=>'',tabbar:()=>'',bindTheme:()=>{},esc:s=>String(s??'').replaceAll('<','&lt;')});
 assert.match(nodes.main.innerHTML,/第 7 \/ 8 节/);assert.match(nodes.main.innerHTML,/旧回答/);assert.match(nodes.main.innerHTML,/先思考|展开答案/);assert.match(nodes.main.innerHTML,/脑总历史观点/);
 nodes['#reader-response'].oninput({target:{value:'新的独立推理'}});assert.equal(state.reading.u1l7.responses.exercise,'新的独立推理');assert.equal(state.current,'u1l7');assert.equal(state.xp,360);assert.ok(saved>=2);
 nodes['#chapter-search'].oninput({target:{value:'返佣'}});assert.match(nodes['#chapter-results'].innerHTML,/#\/reader\/u1l7\/incentive/);
 delete globalThis.location;
});
test('superseded dead references never remain active supporting links',()=>{
 const repaired=read('content/source-repairs-stage-1.json');assert.equal(Object.keys(repaired).length,3);assert.equal(ledger.unresolvedReferences.length,4);
 for(let i=1;i<=13;i++)for(const l of read('public/data/U'+i+'.json').lessons)for(const e of l.examples)for(const s of e.src){
  if(s.unverifiedUrl){assert.equal(s.u,'');assert.match(s.audit,/不用它支持结论/);}
  if(s.supersededUrl){assert.ok(repaired[s.supersededUrl]);assert.equal(s.u,repaired[s.supersededUrl].u);}
 }
});
