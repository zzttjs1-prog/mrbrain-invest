import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const baseline=read('tests/original-manifest.json');
const idx=read('public/data/index.json'),books=read('public/data/books.json'),knowledge=read('public/data/knowledge.json');
const lessons=idx.flatMap(u=>read('public/data/'+u.id+'.json').lessons);
test('all original 68 lesson IDs, order, titles and index remain compatible',()=>{assert.equal(lessons.length,68);assert.equal(new Set(lessons.map(l=>l.id)).size,68);for(const u of idx){const after=read('public/data/'+u.id+'.json');assert.deepEqual(after.lessons.map(l=>[l.id,l.title]),baseline.lessons[u.id]);}assert.deepEqual(idx,baseline.index)});
test('68 legacy core supplements retain distinct mechanism, boundary, counterexample and exercise fields',()=>{for(const key of ['mechanism','boundary','counterexample','steps','exercise','answer','bookConnection']){assert.equal(new Set(lessons.map(l=>l.deep[key])).size,68,key);for(const l of lessons)assert.ok(l.deep[key].length>=25,l.id+' '+key)}for(const l of lessons){assert.ok(l.deep.books.length);assert.ok(l.deep.principles.length);for(const b of l.deep.books)assert.ok(books.some(x=>x.id===b),b);for(const p of l.deep.principles)assert.ok(knowledge.principles.some(x=>x.id===p),p)}});
test('13 book author modules contain attribution, boundaries, disagreements, steps and answer explanation',()=>{assert.equal(books.length,13);for(const b of books)for(const k of ['author','loc','concept','mechanism','boundary','case','steps','exercise','answer','disagreement'])assert.ok(b[k],b.id+' '+k);for(const b of books)assert.ok(lessons.some(l=>l.deep.books.includes(b.id)),b.id+' integrated into core lessons')});
test('217 principles and 65 check items are counted from actual records, not labels',()=>{assert.deepEqual(knowledge.principles.map(p=>p.id),Array.from({length:217},(_,i)=>i+1));assert.deepEqual(knowledge.checklist.map(p=>p.id),Array.from({length:65},(_,i)=>i+1));assert.ok(knowledge.sources.some(s=>s.id==='V111'&&s.date==='2026-11-02'));for(const p of knowledge.principles)for(const id of p.lessons)assert.ok(lessons.some(l=>l.id===id))});
test('all legacy quizzes remain structurally answerable and explanations exist',()=>{for(const l of lessons){assert.ok(l.quiz.length>=4);for(const q of l.quiz){assert.ok(q.q&&q.why);assert.ok(q.opts.length>=3);assert.ok(Number.isInteger(q.ans)&&q.ans>=0&&q.ans<q.opts.length)}assert.ok(l.examples.every(e=>Array.isArray(e.rows)&&Array.isArray(e.src)));assert.ok(l.quotes.every(q=>q.date&&q.src&&q.kind))}});
test('audited corrections remove universal two-quarter threshold and explain cash-flow meaning of mindset',()=>{const down=lessons.find(l=>l.id==='u7l5'),mind=lessons.find(l=>l.id==='u13l1');assert.match(down.deep.mechanism,/杀估值、杀业绩、杀逻辑/);assert.match(down.cards[1].b,/未支持统一/);assert.match(mind.cards[0].b,/不是靠多亏钱/);assert.match(lessons.find(l=>l.id==='u9l1').deep.mechanism,/不是真实|不是所有/)});
test('paused review source data is unchanged',()=>{for(const f of ['daily.json','news.json'])assert.equal(createHash('sha256').update(readFileSync('public/data/'+f)).digest('hex'),baseline.unchangedData[f])});
test('final audit keeps author periods distinct and qualifies financial arithmetic',()=>{
 const graham=lessons.find(l=>l.id==='u6l7'),exit=lessons.find(l=>l.id==='u12l3'),debt=lessons.find(l=>l.id==='u4l5');
 assert.match(graham.cards[0].b,/5–10.*7–10/);assert.match(graham.cards[2].b,/125/);assert.match(graham.cards[2].b,/期限/);
 assert.ok(Math.abs(5/.04-125)<1e-10);assert.ok(Math.abs(31*(1-.03)-30-.07)<1e-10);
 assert.match(debt.examples[1].note,/不等于偿债必然安全/);assert.match(exit.cards[1].b,/并不保证/);assert.match(exit.cards[0].b,/未给出可核实题名/);
 assert.equal(exit.examples[1].tag,'教学假设 · 止损与再入场');assert.equal(90/100*105,94.5);
 assert.equal(read('content/source-index.json').principles.filter(p=>!p.lessons.length).length,75);
 assert.equal(knowledge.principles.filter(p=>!p.lessons.length).length,read('public/data/coverage.json').summary.principleIndexOnly);
 assert.match(books.find(b=>b.id==='B13').case,/时点晚约两年/);
});
test('legacy unavailable URLs are labeled and citations never imply a full verification',()=>{
 const checks=read('content/source-link-checks.json');let flagged=0;
 for(const l of lessons)for(const e of l.examples)for(const s of e.src)if(checks[s.unverifiedUrl]){assert.equal(s.u,'');assert.match(s.audit,/404/);flagged++;}
 assert.ok(flagged>0);for(const s of knowledge.sources){assert.ok(s.access);if(s.url)assert.match(s.url,/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/);}
});
