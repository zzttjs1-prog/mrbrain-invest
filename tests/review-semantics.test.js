import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {empty,normalize,persist,loadProgress,encode,decode,mergeProgress,KEY,BACKUP} from '../src/progress.js';
import {reconcileQuiz,quizRevision,outdatedWrong} from '../src/quiz-content.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const chapter=id=>read('public/data/chapters/'+id+'.json');
const section=(id,sid)=>chapter(id).sections.find(s=>s.id===sid);
const text=(id,sid)=>{const s=section(id,sid);return [...s.paragraphs,...s.answer].join('\n')};
const lesson=id=>read('public/data/'+id.split('l')[0].toUpperCase()+'.json').lessons.find(l=>l.id===id);
const correct=q=>q.opts[q.ans];const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const cases=read('public/data/worked-examples.json');
const fmt=x=>Number(x.toFixed(4)).toString();

test('reviewed raw U2/U6/U9 generators and generated cards/figures/summaries/quizzes agree, rather than correct longform hiding old errors',()=>{
 // Execute authored in-memory definitions only; omit the output calls, never rewrite data in parallel tests.
 const raw=JSON.parse(execFileSync('python3',['-c',`import ast,sys,json,pathlib
r=pathlib.Path.cwd();sys.path.insert(0,str(r/'content'));out={}
for name in ['u2.py','u6.py','u9.py']:
 p=r/'content'/name;m=ast.parse(p.read_text());m.body=m.body[:-2] if name!='u9.py' else m.body[:-1];ns={'__file__':str(p)};exec(compile(m,str(p),'exec'),ns);out.update({l['id']:l for l in ns['L']})
print(json.dumps(out,ensure_ascii=False))`],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
 for(const id of ['u2l1','u6l3','u6l5','u6l6','u6l8','u9l1'])for(const key of ['cards','diagram','summary','quiz'])assert.deepEqual(lesson(id)[key],raw[id][key],id+' '+key);
 for(const id of ['u2l1','u6l3','u6l5','u6l6','u6l8','u9l1'])assert.equal(lesson(id).quizRevision,quizRevision(id));
});

test('actual selected answers teach same-denominator earnings yield, not cash return; SMA is not traded cost',()=>{
 assert.equal(correct(lesson('u2l1').quiz[0]),'先核币种、期限、税费、收益性质和保障，再查信用与流动性风险');assert.ok(lesson('u2l1').cards[0].b.includes('货币基金不是政府保证'));assert.ok(!lesson('u2l1').cards[0].b.includes('不冒信用风险'));const q=lesson('u6l3').quiz[0],a=correct(q);const nums=[...a.matchAll(/(\d+)%/g)].map(x=>+x[1]);assert.deepEqual(nums,[15/300*100,6/300*100]);
 const ratios=lesson('u6l5').diagram.rows;assert.equal(ratios[2][1],ratios[1][1]-ratios[0][1]);assert.equal(a,'E/P5%，股息率2%，实际总回报未知');assert.ok(!correct(lesson('u6l5').quiz[0]).startsWith('能，'));
 const ma=correct(lesson('u9l1').quiz[0]);const m=ma.match(/SMA(\d+)，成交均价(\d+)/);assert.ok(m);assert.equal(+m[1],(10+20)/2);assert.equal(+m[2],(10*1+20*9)/10);
 assert.equal(correct(lesson('u9l1').quiz[1]),'只说明相对窗口价格均值有偏离，原因和价值须另查');
 assert.equal(correct(lesson('u6l6').quiz[3]),'模型仍可用，但需约束现金、正常化和融资情景；估不准可放弃数值结论');
});

test('NCAV correct choice computes an actual loss below 2/3; P183 subtracts debt before PB',()=>{
 const q=lesson('u6l8').quiz[1],a=correct(q);const liquidation=80+30*.8+40*.5-90-10;assert.equal(liquidation,24);assert.ok(35<(80+30+40-90)*2/3);
 assert.equal(a,`不保本，仅余${liquidation}，较付35亏${35-liquidation}`);near((liquidation/35-1)*100,-31.42857142857143);
 const ps=read('content/principle-studies.json');const assets=100,liabilities=50,market=50,impairment=40;const equity=assets-impairment-liabilities;assert.equal(equity,10);assert.equal(market/equity,5);
 assert.ok(ps['183'].exercise.includes('资产100、负债50、普通股权益50、市值50'));assert.ok(ps['183'].answer.includes(`权益${equity}，新PB=50/10=${market/equity}`));near((assets-liabilities-equity)/(assets-liabilities),.8);
 assert.ok(ps['119'].exercise.includes('净现金40（现金60、债20）'));assert.ok(!text('u6l8','exercise').includes('二分之三'));
});

test('DCF three statements reconcile year by year and all rendered values derive from cash rather than EPS',()=>{
 const {inputs:d,forecast:rows}=cases.dcf;let revenue=100,nwc=20,cash=20,ppe=70,equity=70;
 const expectedFCFF=[10.5,11.55,12.705],expectedCash=[23,27.05,32.255],expectedAssets=[130,141.75,155.425];
 for(const [i,row] of rows.entries()){
  const previous=revenue;revenue*=1.1;const ebit=.2*revenue,ni=(ebit-2)*.75,nextNWC=.2*revenue,dn=nextNWC-nwc,capex=5+.4*(revenue-previous),cfo=ni+5-dn,fcff=ebit*.75+5-capex-dn;
  cash+=cfo-capex-6;ppe+=capex-5;equity+=ni-6;nwc=nextNWC;
  near(row.netIncome,ni);near(row.cfo,cfo);near(row.fcff,fcff);near(row.fcff,expectedFCFF[i]);near(row.fcfe,row.fcff-1.5);near(row.cash,cash);near(cash,expectedCash[i]);near(row.assets,expectedAssets[i]);near(row.assets,40+row.payables+equity);near(row.ppe,ppe);
  for(const phrase of [`CFO${fmt(cfo)}`,`FCFF${fmt(fcff)}`,`期末现金${fmt(cash)}`])assert.ok(text('u6l6','case-cash').includes(phrase),phrase);
  assert.ok(text('u6l6','case-balance').includes(`资产${fmt(expectedAssets[i])}`));
 }
 assert.equal(d.shares,10);assert.equal(d.annualDebtDue,d.refinance);near(20+(-10+5+4)-5-20,-6);
});

test('DCF terminal growth requires reinvestment, sensitivity and dilution alter actual rendered per-share answers',()=>{
 const {forecast,base,sensitivity,lowROIC,issue}=cases.dcf;
 const calculate=(r,g,roic)=>{
  const f4=forecast[2].nopat*(1+g)*(1-g/roic),tv=f4/(r-g),pv=forecast.reduce((n,x,i)=>n+x.fcff/(1+r)**(i+1),0),ev=pv+tv/(1+r)**3;
  return {f4,tv,pv,ev,share:(ev+20-40)/10};
 };
 for(const s of sensitivity){const z=calculate(s.wacc,s.g,.15);near(s.terminalFCF,z.f4);near(s.ev,z.ev);near(s.perShare,z.share);assert.ok(text('u6l6','case-sensitivity').includes(`r=${s.wacc*100}%、g=${s.g*100}%`));assert.ok(text('u6l6','case-sensitivity').includes(`每股${fmt(z.share)}元`));}
 const b=calculate(.1,.03,.15);near(base.ev,b.ev);near(base.perShare,18.52077922077922);near(base.terminalWeight,base.terminalPV/base.ev);
 const low=calculate(.1,.03,.05);near(lowROIC.perShare,low.share);assert.ok(low.share<base.perShare);near(issue.perShare,(base.ev+20-20)/12);assert.ok(issue.perShare<base.perShare);
 assert.ok(text('u6l6','case-practice').includes(`权益${fmt(base.equityValue)}/10=${fmt(base.perShare)}元`));assert.ok(text('u6l6','case-practice').includes(`${fmt(issue.perShare)}元`));
});

test('B6 complete next-open ledger has four pre-specified trades, actual fees, mark-to-market drawdown and no future close execution',()=>{
 const {inputs:i,history:h,trades:t}=cases.backtest;assert.deepEqual(t.map(x=>[x.entryDay,x.exitDay,x.buy,x.sell,x.net]),[[2,3,102,103,0],[4,5,104,104,-1],[6,7,101,102,0],[8,9,103,104,0]]);
 let cash=1000,pos=0,peak=1000,dd=0;
 for(const row of h){const day=row.day,signal=day>=2&&day<9&&i.close[day-1]>(i.close[day-2]+i.close[day-1])/2?1:0;if(signal!==pos)cash+=pos?i.opens[day]-.5:-i.opens[day]-.5;pos=signal;const eq=cash+pos*(day===9?i.opens[day]:i.close[day]);near(eq,row.equity);near(cash,row.cash);peak=Math.max(peak,eq);dd=Math.max(dd,(peak-eq)/peak);assert.ok(text('B6','backtest-worked').includes(`标记净值${fmt(eq)}`));}
 assert.equal(cash,999);near(dd,.0025);assert.equal(t.reduce((n,x)=>n+x.gross,0),3);assert.equal(t.reduce((n,x)=>n+x.cost,0),4);assert.equal(1000+3-8,995);assert.equal(i.trainingEndsCloseDay,5);
});

test('B6 independent resampling, without-replacement shuffling, year-block and single-bad-year models give different exact probabilities',()=>{
 const combinations=(xs,n)=>n===0?[[]]:xs.flatMap((x,i)=>combinations(xs.slice(i+1),n-1).map(rest=>[x,...rest]));
 const indices=combinations([0,1,2,3,4,5,6,7],4);assert.equal(indices.length,70);const firstFourAllLoss=indices.filter(xs=>xs.every(x=>x<4)).length/indices.length;near(firstFourAllLoss,1/70);
 near((4/8)**4,1/16);near(1/2,.5);assert.equal(new Set([-10,-10,-10,-10]).size,1);
 const drawdown=returns=>{let v=100,p=100,max=0;for(const r of returns){v+=r;p=Math.max(p,v);max=Math.max(max,(p-v)/p)}return max};
 near(drawdown([-10,-10,-10,-10,10,10,10,10]),.4);near(drawdown([-10,10,-10,10,-10,10,-10,10]),.1);near(drawdown(Array(8).fill(-10)),.8);
 for(const x of ['1/16','1/70','1/2','回撤80%'])assert.ok(text('B6','resampling-worked').includes(x));near((Math.sqrt(121/100)-1)/.2,.5);near(.1/(.12*60/365),5.0694444444);
 assert.ok(text('B6','metrics-worked').includes('R立方≈5.0694'));assert.ok(text('B6','metrics-worked').includes('不从前一段四个净值伪算'));
});

test('B9 fixed-brick reversal and Kagi shoulder/waist transitions match hand-worked states, not merely keywords',()=>{
 assert.deepEqual(cases.renko.rows.map(x=>x.bricks),[[[100,105]],[[105,110]],[],[],[[105,100]],[],[[100,95]],[[100,105]]]);
 assert.deepEqual(cases.kagi.rows.map(x=>[x.close,x.column,x.end,x.style]),[[103,0,103,'细'],[106,0,106,'细'],[104,0,106,'细'],[102,1,102,'细'],[99,1,99,'细'],[101,1,99,'细'],[103,2,103,'细'],[106,2,106,'细'],[107,2,107,'粗'],[105,2,107,'粗'],[103,3,103,'粗'],[99,3,99,'粗'],[98,3,98,'细']]);
 for(const row of cases.renko.rows)assert.ok(text('B9','renko-worked').includes(`收${row.close}：`));
 for(const row of cases.kagi.rows)assert.ok(text('B9','kagi-worked').includes(`列${row.column}、线端${row.end}、${row.direction===1?'向上':'向下'}、${row.style}线`));
 assert.ok(text('B9','encoding-practice').includes('105→100'));assert.ok(text('B9','encoding-practice').includes('98才在99以下转细'));
});

test('B11 ASFR aggregation and two-sex open-age population accounting reproduce births, deaths, migration and sensitivity',()=>{
 const p=cases.population;let f=p.initialFemale,m=p.initialMale;near(5*p.asfr.reduce((s,x)=>s+x,0),1.9);near(f.reduce((s,x,i)=>s+x*p.asfr[i],0),292);near(292-200*.12,268);near(1.9*.75,1.425);
 assert.equal(f.reduce((s,x)=>s+x,0)+m.reduce((s,x)=>s+x,0),15100);
 for(const period of p.periods){
  const births=5*f.reduce((s,n,i)=>s+n*p.asfr[i],0),deaths=[f,m].reduce((s,x)=>s+x.reduce((n,pop,i)=>n+pop*(1-p.survival[i]),0),0)+births*(1-p.birthSurvival);
  const advance=x=>[births*.5*.99,...Array.from({length:9},(_,j)=>x[j]*p.survival[j]+p.netMigrationPerSex[j+1]),x[9]*p.survival[9]+x[10]*p.survival[10]+p.netMigrationPerSex[10]];
  const nf=advance(f),nm=advance(m);near(period.births,births);near(period.deaths,deaths);nf.forEach((x,i)=>near(x,period.female[i]));nm.forEach((x,i)=>near(x,period.male[i]));near(period.total,[...f,...m].reduce((s,x)=>s+x,0)+births-deaths+30);[f,m]=[nf,nm];
 }
 near(p.periods[0].total,16192.9);near(p.periods[1].total,17345.8935);near(p.periods[1].births,1595);near(1460*.75*.5*.99,542.025);near(16192.9-1460*.25*.99,15831.55);near(16192.9-2*1000*.1,15992.9);
 for(const value of ['1460','397.1','16192.9','1595','472.0065','17345.8935'])assert.ok(text('B11','population-worked').includes(value));
});

test('all 15 P171 topics have their own conflict/evidence/counterevidence/judgment and answered scenario; numerical conclusions are recomputed',()=>{
 const dossier=read('content/p171-dossier.json');assert.equal(dossier.length,15);assert.equal(new Set(dossier.map(x=>x.id)).size,15);
 for(const item of dossier){const s=section('u3l5','p171-'+item.id);assert.ok(s);for(const field of ['mechanism','evidence','conflict','counterevidence','judgment','exercise','answer'])assert.ok(item[field].length>20,item.id+' '+field);assert.equal(s.answer[0],'解析：'+item.answer);assert.ok(s.paragraphs.some(x=>x==='问题：'+item.exercise));}
 near(10*(10-6)-20,20);near(12*(10-8)-20,4);near((1.2**3*20)/40-1,-.136);near(20+5-12-4+8-15,2);near(120*.15*9/(100*.2*10)-1,-.19);near((100-20)/9,8.88888888889);near((100-5)/9,10.55555555556);
 assert.ok(dossier.find(x=>x.id==='profit').answer.includes('20'));assert.ok(dossier.find(x=>x.id==='price').answer.includes('−13.6%'));assert.ok(dossier.find(x=>x.id==='buyback').answer.includes('80/9约8.8889'));
 assert.equal(read('content/principle-studies.json')['171'].section,'p171-source');
});

test('old changed quiz selections become archived and ungraded without clearing completion, XP, notes, wrong evidence or reading',()=>{
 const state=normalize({xp:410,days:['2026-11-16'],lessons:{u6l3:{done:true,best:4,stars:3},u1l1:{done:true,stars:3}},drafts:{u6l3:{slide:18,answers:{0:2,1:1}},u1l1:{slide:7,answers:{0:2}}},wrong:{old:{lesson:'u6l3',q:'旧题',correct:'旧错误答案',chosen:'旧选择'}},notes:{personal:'不丢笔记'},reading:{B6:{section:'transfer',responses:{transfer:'我自己的推理'}}}});
 const old=structuredClone(state),d=reconcileQuiz(state,'u6l3');assert.deepEqual(d.answers,{});assert.equal(d.slide,0);assert.equal(d.revision,quizRevision('u6l3'));assert.deepEqual(d.history[0].answers,old.drafts.u6l3.answers);assert.ok(outdatedWrong(state.wrong.old));assert.ok(!outdatedWrong({lesson:'u6l3',revision:quizRevision('u6l3')}));
 assert.deepEqual(state.lessons,old.lessons);assert.equal(state.xp,410);assert.deepEqual(state.notes,old.notes);assert.deepEqual(state.reading,old.reading);assert.deepEqual(reconcileQuiz(state,'u1l1'),old.drafts.u1l1);reconcileQuiz(state,'u6l3');assert.equal(d.history.length,1);
 const store={data:new Map([[KEY,JSON.stringify(old)]]),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}};persist(store,state);assert.deepEqual(JSON.parse(store.getItem(BACKUP)),old);assert.deepEqual(loadProgress(store).state,decode(encode(state)));
 state.drafts.u6l3.answers={0:0};const merged=mergeProgress(state,old);assert.deepEqual(merged.drafts.u6l3.answers,{0:0});assert.equal(merged.xp,410);assert.equal(merged.lessons.u6l3.done,true);
 const inverse=mergeProgress(old,state);assert.deepEqual(inverse.drafts.u6l3.answers,{0:0});assert.equal(inverse.drafts.u6l3.revision,quizRevision('u6l3'));assert.ok(inverse.drafts.u6l3.history.length);assert.deepEqual(inverse.reading,old.reading);
 const remote=structuredClone(state);remote.drafts.u6l3.history.push({revision:'older',slide:2,answers:{0:3}});const both=mergeProgress(state,remote);assert.equal(both.drafts.u6l3.history.length,2);assert.ok(both.drafts.u6l3.history.some(h=>h.revision==='older'&&h.answers[0]===3));
});


test('B13 inventory levels, first changes and second changes reconcile actual production and the open answer',()=>{
 const rows=cases.inventory.rows;assert.deepEqual(rows.map(r=>r.stock),[90,70,60,60,70]);assert.deepEqual(rows.map(r=>r.production),[90,80,90,100,110]);
 for(const [i,r] of rows.entries()){assert.equal(r.stock-r.opening,r.change);assert.equal(r.production,r.sales+r.change);if(i){assert.equal(r.changeOfChange,r.change-rows[i-1].change);assert.equal(r.production-rows[i-1].production,r.changeOfChange)}assert.ok(text('B13','inventory-worked').includes(`期末库存${r.stock}，生产${r.production}`))}
 const answer=section('B13','inventory-worked').answer.join('');assert.ok(answer.includes('生产=95−10=85，相对80只升5'));assert.equal(95+rows[2].change-rows[1].production,5);assert.ok(answer.includes('库存水平70→60仍在降'));
});
