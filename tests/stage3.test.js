import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KEY,BACKUP,empty,persist,loadProgress,encode,decode,mergeProgress} from '../src/progress.js';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const index=read('public/data/chapters/index.json');
const chapters=index.chapters.map(c=>read('public/data/chapters/'+c.id+'.json'));
const chapter=id=>chapters.find(c=>c.id===id);
const body=id=>chapter(id).sections.flatMap(s=>[s.title,...s.paragraphs,...s.answer]).join('\n');
const near=(a,b,epsilon=1e-4)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);

test('all 68 stable IDs retain authored chapters; 217 principle studies and 13 source-bounded thematic book modules exist',()=>{
 const lessons=Array.from({length:13},(_,i)=>read('public/data/U'+(i+1)+'.json').lessons).flat();
 assert.equal(lessons.length,68);assert.equal(new Set(lessons.map(l=>l.id)).size,68);
 for(const l of lessons){const c=chapter(l.id);assert.ok(c.title);if(Number(l.id.split('l')[0].slice(1))>=6)assert.equal(c.title,l.title);assert.equal(c.sections.length,8);assert.equal(c.exerciseCount,2);assert.ok(c.proseCharacters>1100,l.id);}
 const summary=read('public/data/coverage.json').summary;
 assert.equal(summary.longformLessons,68);assert.equal(summary.independentPrinciples,217);assert.equal(summary.evidenceChecks,65);assert.equal(summary.thematicBookModules,13);
 assert.equal(217-summary.independentPrinciples,0);assert.equal(13-summary.thematicBookModules,0);
 assert.match(text('src/main.js'),/仍非13书全部讲透/);
});

test('U6 worked valuation examples preserve denominators, cash identity and terminal rounding',()=>{
 near(150/10,15);near(10/120/(150/120),10/150);
 near((1.3*1.2*1.1)**(1/3)*100-100,19.72157673);
 near(24/19.72157673,1.2169416);near(1.1*15/40-1,-.5875);
 const firstThree=[1,2,3].reduce((sum,t)=>sum+10/1.1**t,0);
 near(firstThree+100/1.1**3,100);near(firstThree+10/.07/1.1**3,132.19920575);
 assert.match(body('u6l6'),/总值约132.20/);
 near((100*.09-2)/102,.068627451);near((200+30-80-10)/20,7);
 near((90*(50-30)-1200-200)*.75,300);near(9000/300,30);
 near(60+50*.5+40*.5-90-10,5);near((40/60)**.1-1,-.0397354992);
 assert.match(body('u6l5'),/不是完整.*风险溢价|完整预期总收益|完整的股权风险溢价|完整股权风险溢价/);
});

test('U7–U10 case arithmetic distinguishes market from firm growth, marginal liquidity and rate repricing',()=>{
 near((140-110)/110,.27272727);near(110/140,.7857142857);
 near((200*.2*.9)/(100*.5)-1,-.28);near((200-10+50)/1000,.24);
 near((1-(1-1/1024)**1024)*100,63.23002606);near((1-.95**20)*100,64.15140776);
 near((10*100+20*90+70*80)/100,84);near(2e6*.04*200*.15,2400000);
 near(1.5*.6-1,-.1);near((12+9+10)/3,10.3333333);
 near(100*1.14*1.09*1.06,131.7156);
 near((100/1.1**10)/(100/1.05**10)-1,-.3719906075);
 near(120*.05+80*.08,12.4);near((20-12.4)/(20-10)-1,-.24);
 near(95*(11-7.2)/400-1,-.0975);near(90*1200/(100*1000)-1,.08);
 assert.match(body('u8l4'),/价值、流动性、风险偏好/);
 assert.match(body('u7l4'),/不能|不应|不等/);
});

test('U11–U13 decisions expose rights, portfolio dependence, real wealth loss and human-capital scale',()=>{
 near(20/100,.2);near(30/300,.1);near(Math.min(150,120,90),90);near(Math.min(150,120,140),120);
 near(300/(100/10+100/20+100/25),15.78947368);
 near(200+300*.6,380);near(380/500-1,-.24);near(380/200-1,.9);
 near((80-70)*50/((80-76)*50),2.5);near(.5*-.6,-.3);
 near(120/160-1,-.25);near(160/120-1,1/3);near(140/180,.77777778);near(.999**10-1,-.0099551198);
 near(8000*.08,640);near(12*200,2400);
 assert.match(body('u12l3'),/手段差异|分歧/);assert.match(body('u12l2'),/免费财富|免费/);
 assert.match(body('u13l3'),/刘煜辉/);assert.match(body('u12l4'),/原始证据|原始事实|原附注页|原始/);
});

test('B1/B2 state actual material limits rather than reconstruct absent diagrams or erase statistical conditions',()=>{
 assert.equal(chapter('B1').sections.length,12);assert.equal(chapter('B2').sections.length,12);
 assert.match(body('B1'),/图3-1、6-1、11-1/);assert.match(body('B1'),/不是本轮新通读/);
 assert.match(body('B2'),/期望存在/);assert.match(body('B2'),/相关系数/);assert.match(body('B2'),/本轮未重新/);
 near(.95*2-.05*50,-.6);near(100*1.1**5,161.051);near(100*1.2**5,248.832);
 const dates=Object.fromEntries(read('content/source-index.json').sources.map(s=>[s.id,s.date]));
 for(const c of chapters)for(const m of body(c.id).matchAll(/(V\d+)（(\d{4}-\d{2}-\d{2})）/g))assert.equal(m[2],dates[m[1]],c.id+' '+m[1]);
});

test('all65 check workflows and 217 independent studies have genuine distinct evidence/teaching fields and real anchors',()=>{
 const checks=read('content/check-studies.json'),principles=read('content/principle-studies.json');
 assert.deepEqual(Object.keys(checks).map(Number).sort((a,b)=>a-b),Array.from({length:65},(_,i)=>i+1));
 const fingerprints=new Set();
 for(const study of [...Object.values(checks),...Object.values(principles)]){
  const keys='ask'in study?['ask','how','evidence','failure']:['meaning','boundary','counterexample','method','exercise','answer'];
  for(const key of keys)assert.ok(study[key].length>(key==='exercise'?4:15),study.lesson+' '+key);
  const signature=keys.map(k=>study[k]).join('\n');assert.ok(!fingerprints.has(signature));fingerprints.add(signature);
  assert.ok(chapter(study.lesson).sections.some(s=>s.id===study.section),study.lesson+' '+study.section);
 }
 assert.equal(fingerprints.size,282);
});

test('every new chapter position and answer survives backup, reopen, current-code and old-code merge without XP mutation',()=>{
 const old={xp:360,days:['2026-11-02'],lessons:Object.fromEntries(Array.from({length:6},(_,i)=>['u1l'+(i+1),{done:true,stars:3,best:4}]))};
 const state=mergeProgress(empty(),old);state.current='u1l7';
 for(const c of chapters){const s=c.sections.at(-1);state.reading[c.id]={section:s.id,responses:{[s.id]:'独立研究回答 '+c.id}};}
 const map=new Map([[KEY,JSON.stringify(old)]]),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(KEY,'mb-progress-v2');assert.equal(persist(storage,state),'');assert.deepEqual(JSON.parse(map.get(BACKUP)),old);
 const reopened=loadProgress(storage).state,imported=decode(encode(reopened));
 const merged=mergeProgress(imported,decode(btoa(unescape(encodeURIComponent(JSON.stringify(old))))));
 assert.deepEqual(merged.reading,state.reading);assert.equal(merged.xp,360);assert.equal(merged.current,'u1l7');assert.equal(Object.values(merged.lessons).reduce((sum,l)=>sum+l.stars,0),18);
 assert.equal(Object.keys(merged.reading).length,81);
});
