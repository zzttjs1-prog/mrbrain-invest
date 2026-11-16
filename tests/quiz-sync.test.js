import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeDraft,quizRevision,reconcileQuiz} from '../src/quiz-content.js';
import {normalize,mergeProgress,persist,loadProgress,encode,decode,KEY,BACKUP} from '../src/progress.js';
const f=JSON.parse(readFileSync(new URL('fixtures/same-revision-empty-draft.json',import.meta.url),'utf8'));
const id='u6l9',revision=quizRevision(id),copy=structuredClone;
const state=d=>normalize({xp:410,days:['2026-11-16'],lessons:{u6l9:{done:true,best:4,stars:3}},drafts:{u6l9:copy(d)},notes:{personal:'合成：本机笔记',u6l9:'合成：不可清空'},reading:{B6:{section:'transfer',responses:{transfer:'合成：我的推理'}}},wrong:{old:{lesson:id,q:'旧题',chosen:'旧选择',correct:'旧标准'}}});

test('real controlled UI export: same-b empty local imports all four remote answers and meaningful result cursor',()=>{
 assert.equal(f.local.revision,revision);assert.equal(f.remote.revision,revision);assert.deepEqual(f.local.answers,{});assert.deepEqual(f.remote.answers,{'0':3,'1':0,'2':1,'3':2});
 const local=state(f.local),remote=state(f.remote),before=copy([local,remote]),merged=mergeProgress(local,decode(encode(remote)));
 assert.deepEqual(merged.drafts[id].answers,f.remote.answers);assert.equal(merged.drafts[id].slide,20);assert.deepEqual(merged.drafts[id].history,f.remote.history);assert.equal(merged.xp,410);assert.deepEqual(merged.lessons,local.lessons);assert.deepEqual(merged.notes,local.notes);assert.deepEqual(merged.reading,local.reading);assert.deepEqual([local,remote],before);
 assert.deepEqual(reconcileQuiz(merged,id).answers,f.remote.answers);
});

test('already-failed UI export with slide20/zero answers is repairable by reimport without deleting archive or notes',()=>{
 const before=state(f.failed),out=mergeProgress(before,state(f.remote));assert.equal(before.drafts[id].slide,20);assert.deepEqual(before.drafts[id].answers,{});assert.deepEqual(out.drafts[id].answers,f.remote.answers);assert.deepEqual(out.drafts[id].history,f.failed.history);assert.equal(out.xp,410);assert.deepEqual(out.notes,before.notes);assert.deepEqual(out.wrong,before.wrong);assert.deepEqual(out.reading,before.reading);
});

test('same revision fills missing/empty choices including valid zero; genuine answer conflicts are local-wins',()=>{
 const local={revision,slide:19,answers:{0:0,1:null,2:2,3:''}},remote={revision,slide:17,answers:{0:3,1:1,2:null,3:3}};const before=copy([local,remote]);
 assert.deepEqual(mergeDraft(local,remote,id).answers,{0:0,1:1,2:2,3:3});assert.deepEqual([local,remote],before);
 const inverse=mergeDraft(remote,local,id);assert.deepEqual(inverse.answers,{0:3,1:1,2:2,3:3});
});

test('cursor follows richer same-version answer draft; empty peer cannot replace local answer or force an empty ending',()=>{
 const local={revision,slide:20,answers:{}},remote={revision,slide:17,answers:{0:0}};assert.equal(mergeDraft(local,remote,id).slide,17);assert.equal(mergeDraft(remote,local,id).slide,17);
 const left={revision,slide:16,answers:{0:0}},right={revision,slide:19,answers:{1:1}};assert.equal(mergeDraft(left,right,id).slide,16);assert.deepEqual(mergeDraft(left,right,id).answers,{0:0,1:1});
});

test('different semantic revisions never fill active answers across versions; current version wins and stale snapshots remain',()=>{
 const current={revision,slide:17,answers:{0:0}},stale={revision:'semantic-review-20261116a',slide:20,answers:{1:3,2:2}};
 for(const [local,remote] of [[current,stale],[stale,current]]){const d=mergeDraft(local,remote,id);assert.equal(d.revision,revision);assert.deepEqual(d.answers,{0:0});assert.equal(d.slide,17);assert.equal(d.history.length,1);assert.deepEqual(d.history[0],stale);}
 const legacy={slide:16,answers:{0:3,1:2}},emptyCurrent={revision,slide:0,answers:{}};
 const d=mergeDraft(legacy,emptyCurrent,id);assert.deepEqual(d.answers,{});assert.equal(d.slide,0);assert.deepEqual(d.history,[{...legacy,revision:'legacy'}]);
});

test('reimport is idempotent, old code cannot downgrade answers/XP/stars, all history variants survive exactly once',()=>{
 const initial=state(f.local),remote=state(f.remote);remote.drafts[id].history.push({revision:'earlier',slide:3,answers:{0:2}});
 const merged=mergeProgress(initial,remote),again=mergeProgress(merged,remote);assert.deepEqual(again,merged);assert.equal(merged.drafts[id].history.length,2);
 const legacy=state({slide:16,answers:{0:0,1:0,2:1,3:2}});legacy.xp=10;legacy.lessons.u6l9={done:false,stars:1,best:1};
 const oldAgain=mergeProgress(merged,legacy);assert.deepEqual(oldAgain.drafts[id].answers,merged.drafts[id].answers);assert.equal(oldAgain.xp,410);assert.deepEqual(oldAgain.lessons,merged.lessons);assert.deepEqual(oldAgain.drafts[id].history,merged.drafts[id].history);assert.deepEqual(mergeProgress(oldAgain,legacy),oldAgain);
});

test('repaired answers survive normal persist/reopen/new-code roundtrip while backing up the untouched failed state',()=>{
 const failed=state(f.failed),out=mergeProgress(failed,state(f.remote));const store={data:new Map([[KEY,JSON.stringify(failed)]]),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}};
 assert.equal(persist(store,out),'');assert.deepEqual(JSON.parse(store.getItem(BACKUP)),failed);const reopened=loadProgress(store).state;assert.deepEqual(reopened,out);assert.deepEqual(decode(encode(out)),out);assert.deepEqual(reopened.drafts[id].answers,f.remote.answers);assert.equal(reopened.xp,410);
});

test('sparse same-version answer merges preserve every local valid index and converge under repeated identical imports',()=>{
 for(let i=0;i<256;i++){const local={revision,slide:i%21,answers:{}},remote={revision,slide:(i*3)%21,answers:{}};
  for(let q=0;q<4;q++){if(i&(1<<q))local.answers[q]=(i+q)%4;if(i&(16<<q))remote.answers[q]=(i+q+1)%4;}
  const out=mergeDraft(local,remote,id);assert.deepEqual(mergeDraft(out,remote,id),out);for(const [q,a] of Object.entries(local.answers))assert.equal(out.answers[q],a);for(const [q,a] of Object.entries(remote.answers))if(!(q in local.answers))assert.equal(out.answers[q],a);
 }
});


test('actual runtime shuffle/resolution sees four restored current answers, zero unanswered and zero repeat XP',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 // Execute only the existing pure expressions, not a DOM/browser or a duplicate grading implementation.
 const shuffleLine=main.split('\n').find(line=>line.startsWith('const shuffleQ='));const shuffle=new Function(shuffleLine+';return shuffleQ;')();
 const seedLine=main.split('\n').find(line=>line.includes('const qStart=slides.length,seed='));const seed=new Function('id','slides',seedLine+';return seed;')(id,[]);
 const l=JSON.parse(readFileSync(new URL('../public/data/U6.json',import.meta.url),'utf8')).lessons.find(l=>l.id===id);const Qs=l.quiz.map((q,i)=>({...q,...shuffle(q,seed+i*31)}));
 const stateAfter=mergeProgress(state(f.failed),state(f.remote)),resLine=main.split('\n').find(line=>line.trim().startsWith('const res=Qs.map('));const res=new Function('Qs','draft',resLine+';return res;')(Qs,stateAfter.drafts[id]);
 assert.deepEqual(res,[true,true,true,true]);assert.equal(res.filter(r=>r===null).length,0);
 const gainExpression=main.match(/const gain=([^;]+);/)[1],gain=new Function('prev','right','return ('+gainExpression+');');assert.equal(gain(stateAfter.lessons[id],res.filter(Boolean).length),0);assert.equal(gain({done:false},4),60);assert.equal(gain(mergeProgress(stateAfter,state(f.remote)).lessons[id],4),0);assert.equal(stateAfter.xp,410);
});
