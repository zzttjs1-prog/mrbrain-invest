import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {principleCoverage} from '../src/knowledge-coverage.js';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const knowledge=read('public/data/knowledge.json'),ledger=read('public/data/coverage.json');
const book=id=>read('public/data/chapters/'+id+'.json');
const body=id=>book(id).sections.flatMap(s=>[s.title,...s.paragraphs,...s.answer]).join('\n');
const near=(a,b,e=1e-4)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);

test('coverage UI and matrix share generated evidence-depth classification, not missing navigation links',()=>{
 const counts=principleCoverage(knowledge.principles),s=ledger.summary;
 assert.deepEqual(counts,{independent:s.independentPrinciples,linkedOnly:s.principleLinkedOnly,indexOnly:s.principleIndexOnly,courseLinks:s.principlesWithCourseLinks});
 for(const p of knowledge.principles)assert.equal(p.depth,ledger.rows.find(r=>r.id==='P'+p.id).depth);
 // Book-only teaching is not index-only; a planning link is not independent explanation.
 assert.deepEqual(principleCoverage([{depth:'independent-explanation',lessons:[]},{depth:'linked-not-independent',lessons:['u1l1']},{depth:'index-only',lessons:[]}]),{independent:1,linkedOnly:1,indexOnly:1,courseLinks:1});
 assert.match(text('src/main.js'),/const pc=principleCoverage\(k.principles\)/);
 assert.match(text('src/main.js'),/p.depth==='independent-explanation'/);
 assert.doesNotMatch(text('src/main.js'),/本条为可检索索引/);
 assert.match(text('src/main.js'),/\$\{pc.indexOnly\}条仅索引/);
 assert.doesNotMatch(text('src/main.js'),/filter\(p=>!p.lessons.length\).length\}条仅索引/);
});

test('all 217 principles have distinct substantive fields and honest caveats, not only a crosslink',()=>{
 const studies=read('content/principle-studies.json');assert.deepEqual(Object.keys(studies).map(Number).sort((a,b)=>a-b),Array.from({length:217},(_,i)=>i+1));
 const fields=['meaning','boundary','counterexample','method','exercise','answer'];
 for(const field of fields){const seen=new Map();for(const [id,s] of Object.entries(studies)){assert.ok(s[field].length>=12,id+' '+field);assert.ok(!seen.has(s[field]),id+' duplicates '+seen.get(s[field]));seen.set(s[field],id);}}
 for(const [id,s] of Object.entries(studies)){assert.ok(fields.reduce((n,k)=>n+s[k].length,0)>=180,'P'+id);assert.ok(book(s.lesson).sections.some(section=>section.id===s.section),'P'+id+' anchor');}
 assert.match(studies['85'].meaning,/流动资产减全部负债/);assert.match(studies['13'].boundary,/并不天然/);
 assert.match(studies['121'].meaning,/嘉宾/);assert.match(studies['171'].boundary,/转述.*未证/);
 assert.match(studies['132'].boundary,/不是四方参与者全无信用风险/);assert.match(studies['210'].boundary,/非密码学共识/);
 assert.match(studies['215'].boundary,/2026-11-02/);assert.match(studies['161'].boundary,/不能.*科学共识/);
});

test('all 13 books have bounded original thematic modules, with all eight additions retaining 15 original sections plus reviewed worked cases',()=>{
 const ids=Array.from({length:13},(_,i)=>'B'+(i+1));
 for(const id of ids){const b=book(id);assert.ok(b.scope);assert.ok(b.sources.some(s=>s.ref===id));assert.ok(b.proseCharacters>1000);assert.ok(b.exerciseCount>=1);assert.match(JSON.stringify(b),/本轮.*(?:未|不|非)|不是本轮/);}
 for(const id of ['B3','B5','B6','B7','B8','B9','B10','B11']){assert.equal(book(id).sections.length,['B6','B9','B11'].includes(id)?18:15);assert.equal(book(id).exerciseCount,['B9','B11'].includes(id)?3:2);assert.ok(book(id).proseCharacters>2500,id);}
 assert.match(body('B3'),/三元大表.*缺失/);assert.match(body('B5'),/文学化人物/);assert.match(body('B6'),/60\/55日/);
 assert.match(body('B7'),/表13-2\/14-6/);assert.match(body('B8'),/正文.*编者|编者.*正文/);assert.match(body('B9'),/OCR空白|OCR.*打散/);
 assert.match(body('B10'),/1997正文、2020序与译者导读/);assert.match(body('B11'),/没有新查2026人口数据/);
 assert.match(ledger.notice,/13书未全部讲透/);assert.equal(ledger.unresolvedReferences.length,4);
});

test('B3/B5/B6/B7 calculations retain nonlinear, execution, cost, R and tail denominators',()=>{
 near((.5)**4,1/16);near(.5/(1/16),8);near(4000/70,57.14285714);near((3*10-100)/1000,-.07);near(4**2,16);near(2*2**2,8);near(.5*0**2+.5*2**2,2);near(6**2,36);near(3*2**2,12);
 near((10*100+90*105)/100,104.5);near((10+11+15)/3,12);near(300/(100/10+100/11+100/15),11.6470588235);
 near((100*100+400*90+500*70)/100000-1,-.19);near(300/(100/10+100/20+100/30),16.36363636);
 near((4*2-6*1)/10,.2);near(2-10*.25,-.5);near(5*.1*-.3,-.15);near(100/60-1,2/3);
 near((8*3-12*1-20*.7)/20,-.1);near((56-50)*100/((50-48)*100),3);near((44-50)*100/200,-3);
 near(40*.5-40*.1-4*3,4);near(100*.9**3,72.9);near(.4*3-.58*1-.02*20-.15,.07);
 assert.match(body('B5'),/104\.5/);assert.match(body('B5'),/11\.65/);assert.match(body('B6'),/净−2R/);assert.match(body('B7'),/0\.07R/);
});

test('B8–B11 worked examples distinguish chart scale, encoding, real transaction costs and population units',()=>{
 near((99/115-1)*100,-13.91304348);near(100*.6**2,36);near(200-60-50-40-30,20);near(100*(100/80),125);near((105/108-1)*100,-2.7777777778);
 near(4/(4+2)*100,66.66666667);near((110-100)/100,.1);near(70+15+20+25,130);near(70+7.5+10+25,112.5);
 near(1e6*.995+2e4,1015000);near(1e7*.6*1e5/1e8,6000);near(9.5e6*.65*1.1e5/1e8,6792.5);
 near(1e6*1000/1e8,10);near(8e5*1500/1e8,12);near(10*.2,2);near(12*.1,1.2);
 near(300/3,100);near(300/2.5,120);near(30/70*100,42.85714286);near(30/42*100,71.42857143);
 assert.match(body('B11'),/合计6000亿元/);assert.match(body('B11'),/合计6792\.5亿元/);assert.doesNotMatch(body('B11'),/合计60万亿元|67\.925万亿元/);
 assert.match(body('B9'),/跌约2\.78%/);assert.match(body('B10'),/112\.5/);
});

test('new principle examples independently recompute cash/rights, operating bridges, dilution and compounding',()=>{
 near(1.05*.92-1,-.034);near(100*.03*.8,2.4);near((2.4/5-1)*100,-52);
 near(90*.25/20-1,.125);near(100-20-50,30);near((100-20-50)*2/3,20);
 near((70/130-1)*100,-46.15384615);near((120-95)/(100-95)-1,4);
 near(10/1.1+10/1.1**2+10/1.1**3,24.86851991);near(5/1.05**10,3.06956627);
 near(110-80*1.2,14);near(20*30+80*8,1240);near(.4*(3)-.6, .6);
 near(.6*1.5,.9);near(1.5*.6,.9);near(20+10-35,-5);near(1.3**3,2.197);
 near(1.3**3*15/30-1,.0985);near(2*20/50,.8);near(.3/.7, .4285714286);
 near((100-60)/(100-50),.8);near(1.2*.5,.6);near(10/100,.1);near(8/120,.0666666667);
 near(100/125,.8);near((15-4)/1.25/10,.88);near(1e7*.0001*20,20000);
 for(const [id,term] of [['50','52%'],['85','30而非80'],['173','9.85%'],['209','降12%'],['147','16.67%']])assert.ok(read('content/principle-studies.json')[id].answer.includes(term),id);
});
