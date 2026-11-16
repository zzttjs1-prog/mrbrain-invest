import {CHAPTERS,COVERAGE} from './chapter-manifest.js';
import {courseUnit,scrollCourseUnit} from './navigation.js';
import './style.css';
import {renderReader} from './reader.js';
import {DIAGRAMS} from './diagrams.js';
import {KEY, loadProgress, persist, mergeProgress, encode, decode} from './progress.js';
const BASE=import.meta.env.BASE_URL, $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const I={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
path:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.3 7.2 15.7 10.8M15.7 13.2 8.3 16.8"/>',
news:'<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M7.5 9h9M7.5 13h9M7.5 17h5"/>',
qa:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/>',
back:'<path d="M15 5 8 12l7 7"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
check:'<path d="M5 12.5 10 17 19 7"/>',star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.5 2 2.5-.6-3 .2-5.6 1-8z"/>',
bolt:'<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
quote:'<path d="M9 7H6a2 2 0 0 0-2 2v3h4v4H5M19 7h-3a2 2 0 0 0-2 2v3h4v4h-3"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'};
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
// ---------- state ----------
const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)};
const loaded=loadProgress(storage);let S=loaded.state,storageWarning=loaded.warning,cloudMessage='云同步尚未在此设备验证';
const status=()=>{let el=$('#save-status');if(!el){el=document.createElement('div');el.id='save-status';el.setAttribute('role','status');document.body.append(el)}el.textContent=storageWarning;el.hidden=!storageWarning};
const save=()=>{storageWarning=persist(storage,S);status();clearTimeout(save.t);save.t=setTimeout(()=>cloudPush().catch(()=>{}),1500)};
function merge(o){const merged=mergeProgress(S,o);for(const [id,d] of Object.entries(S.drafts))merged.drafts[id]=d;Object.assign(S,merged)}
const enc=encode,dec=decode;
let SB=null,USER=null;
async function cloud(){if(SB!==null)return SB;SB=false;try{const c=await fetch(import.meta.env.BASE_URL+'data/config.json').then(r=>r.json());
 if(c.supabaseUrl&&c.supabaseAnonKey){const m=await import(/* @vite-ignore */'https://esm.sh/@supabase/supabase-js@2');SB=m.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}});
  const {data}=await SB.auth.getSession();USER=data.session?.user||null;if(USER)await cloudPull()}}catch(e){SB=false}return SB}
async function cloudPull(){const {data,error}=await SB.from('progress').select('data').eq('user_id',USER.id).maybeSingle();if(error){cloudMessage='云端读取失败，本机进度未覆盖';return}if(data)merge(data.data);storageWarning=persist(storage,S);await cloudPush()}
async function cloudPush(){if(!SB||!USER)return;try{const {error}=await SB.from('progress').upsert({user_id:USER.id,data:dec(enc(S)),updated_at:new Date().toISOString()});cloudMessage=error?'云端写入失败；请导出同步码备份':'本次云端写入成功；跨设备恢复仍需验证'}catch{cloudMessage='云端写入失败；本机进度仍可手动导出'}}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function streak(){const set=new Set(S.days);let d=new Date(),n=0;if(!set.has(dkey(d)))d.setDate(d.getDate()-1);while(set.has(dkey(d))){n++;d.setDate(d.getDate()-1)}return n}
document.documentElement.dataset.theme=S.theme;
// ---------- data ----------
const cache={};
const get=async p=>cache[p]||(cache[p]=fetch(BASE+'data/'+p).then(r=>{if(!r.ok)throw 0;return r.json()}));
const longformIds=new Set(Object.keys(CHAPTERS).filter(id=>id.startsWith('u')));
const learningHref=id=>CHAPTERS[id]?'#/reader/'+id:/^B\d+$/.test(id)?'#/library/'+id:'#/l/'+id;
const shortT=t=>t.replace(/^第\d+单元\s*·\s*/,'');
const shuffleQ=(q,seed)=>{const idx=q.opts.map((_,i)=>i);let s=seed;for(let i=idx.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=s%(i+1);[idx[i],idx[j]]=[idx[j],idx[i]]}return{opts:idx.map(i=>q.opts[i]),ans:idx.indexOf(q.ans)}};
// ---------- shell ----------
const DISC='仅供个人投资学习，不构成投资建议。书作者观点、脑总带日期历史观点、AI教学整理分别标注；没有本次通读原书或核验所有历史数据。进攻位≤10%仅为本课保守护栏，现货学习；不借钱、不杠杆、不做空、不碰期权合约。';
function topbar(title,sub=''){return `<header class="top glass"><div><div class="tt">${title}</div>${sub?`<div class="ts">${sub}</div>`:''}</div><button class="ibtn" id="theme" aria-label="切换主题">${ic(S.theme==='dark'?'sun':'moon')}</button></header>`}
function tabbar(cur){const tabs=[['home','首页','#/'],['path','课程','#/path'],['news','今日','#/news'],['qa','问答本','#/qa']];
 return `<nav class="tabs glass">${tabs.map(([k,n,h])=>`<a href="${h}" class="tab ${cur===k?'on':''}">${ic(k)}<span>${n}</span></a>`).join('')}</nav>`}
function bindTheme(){const b=$('#theme');b&&(b.onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';save();document.documentElement.dataset.theme=S.theme;route()})}
const skel=n=>Array.from({length:n},()=>'<div class="sk"></div>').join('');
// ---------- home ----------
function ring(p){const r=34,c=2*Math.PI*r;return `<svg viewBox="0 0 80 80" class="ring"><circle cx="40" cy="40" r="${r}" class="rb"/><circle cx="40" cy="40" r="${r}" class="rf" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 40 40)"/></svg>`}
function cal(){const set=new Set(S.days),d=new Date();d.setDate(d.getDate()-34);let h='';for(let i=0;i<35;i++){const k=dkey(d);h+=`<i class="${set.has(k)?'on':''} ${k===today()?'td':''}"></i>`;d.setDate(d.getDate()+1)}return `<div class="cal">${h}</div>`}
async function home(){
 app.innerHTML=topbar('Brainvest','系统学投资 · 先学会不亏大钱')+`<main class="pg">${skel(3)}</main>`+tabbar('home');bindTheme();
 const idx=await get('index.json');const ready=idx.filter(u=>u.ready);const all=ready.flatMap(u=>u.lessons.map((t,i)=>({u,t,id:u.id.toLowerCase()+'l'+(i+1)})));
 const done=all.filter(l=>S.lessons[l.id]?.done).length;const next=all.find(l=>l.id===S.current&&!S.lessons[l.id]?.done)||all.find(l=>!S.lessons[l.id]?.done)||all[0];
 const stars=Object.values(S.lessons).reduce((a,b)=>a+(b.stars||0),0);const total=idx.reduce((a,u)=>a+u.lessons.length,0);
 $('.pg').innerHTML=`
 <section class="hero card in"><div class="hl"><div class="lbl">精品课进度</div><div class="big">${done}<small> / ${all.length}</small></div><div class="ts">${total}课新增核心研习 · 13本书概念融入</div></div><div class="rw">${ring(all.length?done/all.length:0)}<b>${Math.round(all.length?done/all.length*100:0)}%</b></div></section>
 <p class="note">68课均已有8节分章长讲与独立题解；${COVERAGE.thematicBookModules}本书有材料范围内独立主题研习。原则独立解释${COVERAGE.independentPrinciples}/217、检查流程${COVERAGE.evidenceChecks}/65，仍非13书全部讲透。<a class="src" href="#/coverage">查看逐项覆盖与缺口</a></p>
 <section class="stats in d1"><div class="st">${ic('flame','a')}<b>${streak()}</b><span>连续天数</span></div><div class="st">${ic('bolt','a')}<b>${S.xp}</b><span>经验值</span></div><div class="st">${ic('star','a')}<b>${stars}</b><span>星星</span></div></section>
 <a class="cont card in d2 syn" href="#/sync"><div><div class="lbl">账号与进度同步</div><div class="ts">${USER?esc(cloudMessage):'本机浏览器保存 · 建议定期导出同步码备份'}</div></div><span class="go">${ic('arrow')}</span></a>
 <a class="cont card in d2" href="${learningHref(next.id)}"><div><div class="lbl">${done?'继续学习':'从这里开始'} · ${shortT(next.u.title)}</div><div class="ct">${esc(next.t)}</div><div class="ts">可分段学 · 机制/边界/反例/练习解析</div></div><span class="go">${ic('arrow')}</span></a>
 <section class="card in d3"><div class="row"><div class="lbl">学习日历</div><div class="ts">近 5 周</div></div>${cal()}</section>
 <a class="btn ghost" href="#/library">知识总库 · 13本书 / 217原则 / 65检查项</a><p class="disc">${DISC}</p>`;}
// ---------- path ----------
async function path(unitId){
 app.innerHTML=topbar('课程路线','68课核心补充版 · 保留原课程与完成记录')+`<main class="pg">${skel(4)}</main>`+tabbar('path');bindTheme();
 const idx=await get('index.json');const cm=await get('curriculum.json').catch(()=>({units:[]}));const C=Object.fromEntries(cm.units.map(u=>[u.id,u]));
 const map=`<section class="card cmap in"><div class="lbl">课程地图</div><p class="ts">${esc(cm.note||'')}</p><div class="cm">${cm.units.map(u=>`<a class="cmu ${u.ready?'r':''}" href="#/path/${u.id}"><b>${u.id}</b><span>${esc(u.stageName)}</span></a>`).join('')}</div></section>`;
 $('.pg').innerHTML='<a class="btn ghost" href="#/library">书籍 / 原则 / 检查清单 · 可检索</a><p class="note">新增研习不重置已完成课程；原星级与经验保留。想复习新版可直接进入旧课。</p>'+map+idx.map((u,ui)=>`<section id="u-${u.id}" class="unit in" style="animation-delay:${Math.min(ui,6)*40}ms"><div class="uh"><span class="un">${u.id}</span><div><div class="ut">${esc(shortT(u.title))}</div><div class="ts">${u.ready?u.lessons.length+' 课 · 核心补充版':'升级中 · 精品版即将上线'}</div></div>${u.ready?'':`<span class="pill">${ic('lock')}升级中</span>`}</div>${C[u.id]?`<p class="ts ug">阶段 ${C[u.id].stage} · ${esc(C[u.id].stageName)} · 先修 ${esc(C[u.id].pre)}<br>学完能：${esc(C[u.id].goal)}${C[u.id].check.length?` · 对应检查清单第 ${C[u.id].check.join('、')} 条`:''}</p>`:''}
 ${u.ready?`<div class="nodes">${u.lessons.map((t,i)=>{const id=u.id.toLowerCase()+'l'+(i+1),st=S.lessons[id];return `<a class="node ${st?.done?'done':''}" href="${learningHref(id)}"><span class="dot">${st?.done?ic('check'):i+1}</span><span class="nt">${esc(t)}</span><span class="sr">${[0,1,2].map(k=>ic('star',k<(st?.stars||0)?'a':'dim')).join('')}</span></a>`}).join('')}</div>`
 :`<div class="lockd">${u.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`}</section>`).join('')+`<p class="disc">${DISC}</p>`;scrollCourseUnit(unitId,document);}
// ---------- news / qa ----------
async function news(){
 app.innerHTML=topbar('每日复盘','用课程里的框架读当天市场')+`<main class="pg">${skel(3)}</main>`+tabbar('news');bindTheme();
 let d,n;try{[d,n]=await Promise.all([get('daily.json'),get('news.json')])}catch{ $('.pg').innerHTML='<div class="empty">离线状态，暂时无法加载</div>';return}
 const pc=x=>(x>=0?'+':'')+Number(x).toFixed(2)+'%',tone=c=>String(c).startsWith('-')?'dn':'up';
 const grp=g=>d.items.filter(i=>i.grp===g).map(i=>`<details class="stk"><summary><b>${esc(i.sym)}</b><span class="ts">${esc(i.name.replace(i.sym,'').trim())}</span><span class="px">${esc(i.close)}</span><span class="${i.chg>=0?'up':'dn'}">${pc(i.chg)}</span></summary><dl><dt>阶段</dt><dd>${esc(i.stage)}</dd><dt>估值</dt><dd>${esc(i.val)} · ${esc(i.pe)}</dd><dt>基本面</dt><dd>${esc(i.fund)}</dd><dt>相对大盘</dt><dd>${esc(i.rel)} · ${esc(i.vol)} · ${esc(i.nh)}</dd><dt>均线</dt><dd>${esc(i.ma)}</dd><dt>脑总说过（带日期）</dt><dd>${esc(i.view)}（之后市场已变化）</dd>${i.earn?`<dt>下次财报</dt><dd>${esc(i.earn)}</dd>`:''}</dl></details>`).join('');
 $('.pg').innerHTML=`<section class="card in"><div class="row"><span class="pill a">美东 ${esc(d.day)} 收盘</span><span class="ts">${esc(d.mood)}</span></div><p class="hdl">${esc(d.headline)}</p><div class="mk">${d.market.slice(0,6).map(m=>`<div><span class="ts">${esc(m.k)}</span><b>${esc(m.v)}</b><span class="${tone(m.c)}">${esc(m.c)}</span></div>`).join('')}</div></section>
 <h3 class="sh">核心三只</h3><section class="card in">${grp('核心')}</section><h3 class="sh">重点跟踪</h3><section class="card in">${grp('重点')}</section>
 <section class="card in"><div class="lbl">资金流向</div><p>${esc(d.flow)}</p></section>
 <h3 class="sh">市场新闻</h3>${n.items.map((x,i)=>`<article class="card nw in" style="animation-delay:${i*50}ms"><div class="ts">${esc(x.date)}</div><p>${esc(x.title)}</p><p class="ts">${esc(x.rel||'')}</p><div class="srcs">${(x.links||[]).map(l=>`<a class="src" href="${esc(l.href)}" target="_blank" rel="noopener">${ic('link')}${esc(l.site)}</a>`).join('')}</div></article>`).join('')}
 <details class="card"><summary class="ts">数据来源</summary><ul class="ts">${d.sources.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>
 <p class="disc">由 ${esc(d.by)}整理。只做教育，不给买卖点、目标价或仓位；不加杠杆、不碰期权合约。${DISC}</p>`;}
async function qa(){
 app.innerHTML=topbar('我的问答与错题','只保存在此浏览器 · 可随同步码搬迁')+`<main class="pg"></main>`+tabbar('qa');bindTheme();
 const d=await get('qa.json').catch(()=>[]);
 $('.pg').innerHTML=`<section class="card"><h2>学习笔记</h2><label for="personal-note">自己的问题与想法</label><textarea id="personal-note" rows="5">${esc(S.notes.personal||'')}</textarea><p class="ts">输入即保存到本机；不会自动发给助手或他人。</p></section><h2>错题本（${Object.keys(S.wrong).length}）</h2>`+
 Object.values(S.wrong).map(w=>`<article class="card"><a class="src" href="#/l/${esc(w.lesson)}">回到课程 ${esc(w.lesson)}</a><h3>${esc(w.q)}</h3><p>我的选择：${esc(w.chosen)}</p><details><summary>正确答案与解析</summary><p>${esc(w.correct)}</p><p>${esc(w.why)}</p></details></article>`).join('')+
 `<h2>课内练习与笔记</h2>`+Object.entries(S.notes).filter(([k])=>k!=='personal').map(([id,n])=>`<article class="card"><a class="src" href="#/l/${esc(id)}">${esc(id)} · 回到课程</a><p>${esc(n)}</p></article>`).join('')+
 `<details class="card"><summary>已有历史问答（${d.length}）</summary>${d.map(q=>`<h3>${esc(q.q)}</h3><p>${esc(q.a)}</p><p class="ts">${esc(q.date)} · 静态历史整理，非实时问答</p>`).join('')}</details>`;
 $('#personal-note').oninput=e=>{S.notes.personal=e.target.value;save()};}
const labels={concept:'作者思想提要 · AI转述',mechanism:'机制解释 · AI整理',boundary:'条件与边界 · AI评估',case:'既有笔记案例 / AI反例',steps:'AI学习步骤',exercise:'AI教学练习（非原书题）',answer:'AI答案解析',disagreement:'AI对照：与脑总的关系 / 分歧'};
async function library(){
 app.innerHTML=topbar('知识总库','三种归属分开 · 查得到出处与缺口')+`<main class="pg"></main>`+tabbar('path');bindTheme();
 const [books,k]=await Promise.all([get('books.json'),get('knowledge.json')]);
 $('.pg').innerHTML=`<section class="card"><p>书籍部分根据已有2026-10-26/27逐章笔记二次整理，本次没有重新通读原书。历史数据未本轮逐条查价，不当作今天事实。脑总材料截至V111（2026-11-02）。</p><p>${esc(k.notice)}</p><label for="find-knowledge">搜索书名、概念、原则编号</label><input id="find-knowledge" type="search" placeholder="遍历性 / 下跌 / P212 / CK65"><p class="ts" id="find-count"></p></section><h2>13本书 · 核心知识与练习</h2>`+
 books.map(b=>`<details class="card searchable" id="book-${b.id}" ${location.hash.endsWith('/'+b.id)?'open':''}><summary><strong>${esc(b.title)}</strong><span class="ts"> · ${esc(b.author)}</span></summary><p class="tag">作者思想依据既有笔记转述，非脑总原话；步骤、练习和解析为AI编写</p><p class="ts">${esc(b.loc)}</p>${CHAPTERS[b.id]?`<a class="btn" href="#/reader/${b.id}">进入${CHAPTERS[b.id].sectionCount}节独立主题研习 · 非全书完成</a><p class="note">${esc(CHAPTERS[b.id].scope)}</p>`:''}${Object.entries(labels).map(([key,label])=>`<section class="book-section"><h3>${label}</h3><p>${esc(b[key])}</p></section>`).join('')}</details>`).join('')+
 `<h2>脑总历史原则 · 217条 · 分层研习账</h2><p class="note">新增${k.principles.filter(p=>p.study).length}条独立解释；其余关联或索引不是独立长讲。带日期历史材料的AI归纳，不是本人逐字引语；数字阈值不是今天的操作规则。${k.principles.filter(p=>p.lessons.length).length}条直接关联课程，${k.principles.filter(p=>!p.lessons.length).length}条仅索引，尚未单独展开；不宣称217条已逐条讲透。</p>`+
 k.principles.map(p=>`<details class="card searchable"><summary>P${p.id} · ${esc(p.title)}${p.study?' · 新增独立解释':p.lessons.length?' · 已关联，独立解释待补':' · 仅索引，尚未展开'}</summary><p>${p.sources.map(ref=>{const src=k.sources.find(s=>s.id===ref);return esc(ref+' · '+(src?.date||'日期未标')+' · '+(src?.reliability||'既有整理'))+(src?.url?` <a class="src" href="${esc(src.url)}" target="_blank" rel="noopener">原来源链接（可访问性未逐场核实）</a>`:` · ${esc(src?.access||'未附公开链接')}`)}).join('<br>')}</p>${p.lessons.length?`<p>本版研习关联：${p.lessons.map(id=>`<a class="src" href="#/l/${id}">${id}</a>`).join(' ')}</p>`:'<p class="note">本条为可检索索引，尚未单独展开成完整研习；不要把索引数量当课程深度。</p>'}${p.study?studyFields(p.study):''}</details>`).join('')+
 `<h2>65项历史检查框架</h2>`+k.checklist.map(c=>`<details class="card searchable"><summary>CK${c.id}</summary><p>${esc(c.text)}</p><p class="note">原框架含个人做法与特定比例，必须结合日期与风险护栏；不可自动转成买卖指令。</p>${c.study?studyFields(c.study):'<p class="note">证据流程与不通过限制尚待独立展开。</p>'}</details>`).join('')+`<p class="disc">${DISC}</p>`;
 const search=()=>{let shown=0;const q=$('#find-knowledge').value.toLowerCase().trim();document.querySelectorAll('.searchable').forEach(el=>{el.hidden=!!q&&!el.textContent.toLowerCase().includes(q);if(!el.hidden)shown++});$('#find-count').textContent=`可见 ${shown} 项`};$('#find-knowledge').oninput=search;search();
 if(location.hash.split('/')[2]?.startsWith('B'))document.getElementById('book-'+location.hash.split('/')[2])?.scrollIntoView();}
async function sync(){
 app.innerHTML=topbar('个人进度备份','保留原存储键 · 不登录也能学习')+`<main class="pg">${skel(2)}</main>`+tabbar('home');bindTheme();
 const sb=await cloud();
 $('.pg').innerHTML=`<section class="card in"><div class="lbl">可选账号同步（配置和联网成功后才可用）</div>${sb?(USER?`<p>已登录：${esc(USER.user_metadata?.user_name||USER.email||'')}</p><p class="note">${esc(cloudMessage)}</p><button class="btn ghost" id="out">退出登录</button>`:`<p class="ts">GitHub登录不等于云端数据已保存；登录后仍需读写成功。云同步未在本次验收中验证，可先使用手动同步码。</p><button class="btn" id="gh">用 GitHub 登录</button>`):`<p class="ts">当前未检测到可用的云端配置或连接，不能保证账号同步。请用下面的同步码手动备份或换设备。</p>`}</section>
 <section class="card in"><div class="lbl">同步码（无需账号）</div><p class="ts">在旧设备复制同步码，到新设备粘贴导入。导入会合并进度，不会覆盖。</p><textarea id="code" rows="4" placeholder="在这里粘贴同步码"></textarea><div class="row2"><button class="btn" id="cp">复制我的同步码</button><button class="btn ghost" id="im">导入</button></div><p class="ts" id="msg"></p></section><p class="disc">同步码含经验值、学习日期、星级、答题进度、错题、长讲章节位置与练习回答及你写的笔记；未加密，请自己妥善保管，不要公开分享。保存范围是同一设备、同一浏览器、同一网站地址；清理网站数据、隐私模式或卸载可能丢失。下载版App与网页、不同浏览器之间不会自动互通。</p>`;
 const msg=t=>$('#msg').textContent=t;
 $('#cp').onclick=async()=>{const c=enc(S);$('#code').value=c;try{await navigator.clipboard.writeText(c);msg('已复制')}catch{msg('已显示在上方，长按复制')}};
 $('#im').onclick=()=>{try{merge(dec($('#code').value));save();msg(storageWarning||'导入成功，进度已合并；完成记录不会被降级')}catch{msg('同步码无效')}};
 $('#gh')&&($('#gh').onclick=()=>SB.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+import.meta.env.BASE_URL}}));
 $('#out')&&($('#out').onclick=async()=>{await SB.auth.signOut();USER=null;sync()});}
// ---------- lesson ----------
async function lesson(id){
 if(!/^u\d+l\d+$/.test(id)){location.hash='#/path';return}const uid=id.match(/^u\d+/)[0].toUpperCase();
 app.innerHTML=`<div class="ls"><header class="lt glass"><a class="ibtn" href="#/path">${ic('x')}</a><div class="bar"></div><span class="ts cnt"></span></header><div class="pager"><div class="slide"><div class="pad">${skel(3)}</div></div></div></div>`;
 let unit;try{unit=await get(uid+'.json')}catch{app.querySelector('.pad').innerHTML='<div class="empty">该单元暂时无法读取，请联网重试；请勿清理网站数据。</div>';return}
 if(location.hash!=='#/l/'+id)return;const L=unit.lessons.find(l=>l.id===id);if(!L){location.hash='#/path';return}
 S.current=id;S.drafts[id]||={slide:0,answers:{}};const draft=S.drafts[id];save();const slides=[];
 slides.push(`<div class="kick">${esc(shortT(unit.title))}</div><h1>${esc(L.title)}</h1><p class="lead">${esc(L.cards[0].b)}</p><div class="meta"><span>${L.cards.length} 张讲解卡</span><span>${L.examples.length} 个案例/教学示例</span><span>${L.quiz.length} 道情景题</span></div>${longformIds.has(id)?`<a class="btn" href="#/reader/${id}">进入8节长讲 · 目录 / 搜索 / 保存推理</a>`:''}<div class="swipe">左滑开始 ${ic('arrow')}</div>`);
 L.cards.slice(1).forEach((c,i)=>slides.push(`<div class="kick">${String(i+2).padStart(2,'0')} · ${esc(c.t)}</div><p class="body">${esc(c.b)}</p>`));
 slides.push(`<div class="kick">图解</div><div class="card dgw">${DIAGRAMS[L.diagram.type]?.(L.diagram)||''}</div>${L.diagram.type==='drawdown'?`<div class="rt">${[[10,11],[20,25],[30,43],[50,100],[80,400]].map(r=>`<div><b>−${r[0]}%</b><span>需 +${r[1]}%</span></div>`).join('')}</div>`:''}<p class="dcap">${esc(L.diagram.cap||'')}</p>`);
 L.examples.forEach(e=>slides.push(`<div class="kick">${esc(e.tag)}</div><p class="note">${esc(e.auditNotice||'旧版案例与链接保留供追踪；本轮未逐项核实全部数字。标签“真实”不等于本次已完成核验。')}</p><h2>${esc(e.title)}</h2><div class="tbl">${e.rows.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div><p class="note">${esc(e.note)}</p><div class="srcs">${e.src.map(s=>s.u?`<a href="${esc(s.u)}" target="_blank" rel="noopener">${ic('link')}${esc(s.n)} <i>${esc(s.d)}</i>${s.audit?`<strong class="r"> · ${esc(s.audit)}</strong>`:''}</a>`:`<span>${esc(s.n)} <i>${esc(s.d)}</i>${s.audit?`<strong class="r"> · ${esc(s.audit)}</strong>`:''}</span>`).join('')}</div>`));
 slides.push(`<div class="kick">脑总历史观点（当时语境，可能已过时）</div>${L.quotes.map(q=>`<blockquote class="card">${ic('quote','a')}<p>${esc(q.q)}</p><cite>${esc(q.src)} · ${esc(q.date)}</cite></blockquote>`).join('')}<p class="note">AI根据公开视频、会员整理及部分系统课AI摘要转述，不是本人逐字原话；无日期项不据此补写精确日期。</p>`);
 if(L.deep){const d=L.deep;for(const [key,title] of [['mechanism','概念与机制'],['boundary','适用条件与边界'],['counterexample','反例：哪里会失效'],['steps','可执行研究步骤']])slides.push(`<div class="kick">深度研习 · AI教学整理</div><h2>${title}</h2><p class="body">${esc(d[key])}</p>`);
 slides.push(`<div class="kick">书作者观点的比较 · AI教学连接</div><p class="body">${esc(d.bookConnection)}</p><div class="srcs">${d.books.map(b=>`<a href="#/library/${b}">打开 ${b} 核心提要与练习（非完整逐章课）</a>`).join('')}</div><p class="note">关联脑总原则：${d.principles.map(n=>'P'+n).join('、')}，可在知识总库查看场次与日期。此段是AI对照，不代表各作者彼此认同。</p>`);
 slides.push(`<div class="kick">应用练习 · AI教学假设</div><h2>${esc(d.exercise)}</h2><label for="lesson-note">先写自己的计算或理由（自动保存在本机）</label><textarea id="lesson-note" rows="5">${esc(S.notes[id]||'')}</textarea><details><summary>展开答案与解析</summary><p class="body">${esc(d.answer)}</p></details><p class="note">开放题用于自查，不自动评分，不影响旧星级与已完成记录。</p>`);}
 slides.push(`<div class="kick">本课小结</div><div class="card sum"><p>${esc(L.summary)}</p></div><div class="swipe">接下来 ${L.quiz.length} 道情景题 ${ic('arrow')}</div>`);
 const qStart=slides.length,seed=[...id].reduce((a,c)=>a+c.charCodeAt(0),7);
 const Qs=L.quiz.map((q,i)=>({...q,...shuffleQ(q,seed+i*31)}));
 Qs.forEach((q,i)=>slides.push(`<div class="kick">情景题 ${i+1} / ${Qs.length}</div><h2 class="qq">${esc(q.q)}</h2><div class="opts" data-q="${i}">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="why" hidden></div>`));
 slides.push(`<div class="end"></div>`);
 const pager=$('.pager');pager.innerHTML=slides.map(s=>`<section class="slide"><div class="pad">${s}</div></section>`).join('');
 $('.bar').innerHTML=slides.map(()=>'<i></i>').join('');
 const res=Qs.map((q,i)=>Number.isInteger(draft.answers[i])&&draft.answers[i]>=0&&draft.answers[i]<q.opts.length?draft.answers[i]===q.ans:null);
 const note=$('#lesson-note');if(note)note.oninput=e=>{S.notes[id]=e.target.value;save()};
 const upd=()=>{if(!pager.isConnected)return;const k=Math.round(pager.scrollLeft/pager.clientWidth);document.querySelectorAll('.bar i').forEach((b,i)=>b.classList.toggle('on',i<=k));$('.cnt').textContent=(k+1)+'/'+slides.length;if(draft.slide!==k){draft.slide=k;save()}if(k===slides.length-1)finish()};
 pager.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});requestAnimationFrame(upd);
 function displayAnswer(box,qi,j){const q=Qs[qi];box.classList.add('done');box.querySelectorAll('.opt').forEach((o,k)=>o.classList.add(k===q.ans?'ok':k===j?'bad':'off'));const w=box.nextElementSibling;w.hidden=false;w.innerHTML=`<div class="wh ${res[qi]?'g':'r'}">${res[qi]?'答对了':'正确答案是 '+'ABCD'[q.ans]}</div><p>${esc(q.why)}</p><button class="btn nx">下一题 ${ic('arrow')}</button>`;w.querySelector('.nx').onclick=()=>pager.scrollBy({left:pager.clientWidth,behavior:'smooth'});}
 pager.querySelectorAll('.opts').forEach(box=>{const qi=+box.dataset.q;if(res[qi]!==null)displayAnswer(box,qi,draft.answers[qi]);box.onclick=e=>{const b=e.target.closest('.opt');if(!b||box.classList.contains('done'))return;const q=Qs[qi],j=+b.dataset.j;res[qi]=j===q.ans;draft.answers[qi]=j;if(!res[qi])S.wrong[id+'-'+qi]={lesson:id,q:q.q,chosen:q.opts[j],correct:q.opts[q.ans],why:q.why};save();displayAnswer(box,qi,j)}});
 const nav=document.createElement('footer');nav.className='lesson-nav';nav.innerHTML='<button class="btn ghost" id="prev-slide">上一页</button><a href="#/sync" class="ts">备份进度</a><button class="btn" id="next-slide">下一页</button>';$('.ls').append(nav);$('#prev-slide').onclick=()=>pager.scrollBy({left:-pager.clientWidth,behavior:'smooth'});$('#next-slide').onclick=()=>pager.scrollBy({left:pager.clientWidth,behavior:'smooth'});
 const restoreSlide=Math.min(draft.slide,slides.length-1);requestAnimationFrame(()=>{pager.scrollLeft=pager.clientWidth*restoreSlide});
 let fin=false;function finish(){const end=$('.end');const answered=res.filter(r=>r!==null).length,right=res.filter(Boolean).length;
  if(answered<Qs.length){end.innerHTML=`<h2>还有 ${Qs.length-answered} 道题没答</h2><p class="ts">答完全部情景题才能结算星星。</p><button class="btn" id="bk">回到第一道未答题</button>`;$('#bk').onclick=()=>pager.scrollTo({left:pager.clientWidth*(qStart+res.findIndex(r=>r===null)),behavior:'smooth'});return}
  if(fin)return;fin=true;const stars=right===Qs.length?3:right>=Qs.length*.75?2:1;const prev=S.lessons[id]||{};const gain=prev.done?0:right*10+20;
  S.lessons[id]={done:true,stars:Math.max(stars,prev.stars||0),best:Math.max(right,prev.best||0)};S.xp+=gain;draft.slide=slides.length-1;if(!S.days.includes(today()))S.days.push(today());save();
  const ids=unit.lessons.map(l=>l.id),nx=ids[ids.indexOf(id)+1];
  end.innerHTML=`<div class="stars">${[0,1,2].map(k=>ic('star',k<stars?'a pop':'dim')).join('')}</div><h2>${right} / ${Qs.length} 答对</h2><p class="ts">+${gain} 经验值 · 连续学习 ${streak()} 天</p><div class="card sum"><p>${esc(L.summary)}</p></div>${nx?`<a class="btn" href="#/l/${nx}">下一课 ${ic('arrow')}</a>`:`<a class="btn" href="#/path">回到课程路线</a>`}<button class="btn ghost" id="retry-lesson">重新练习（保留已完成和最高星级）</button><a class="btn ghost" href="#/">回首页</a><p class="disc">${DISC}</p>`;$('#retry-lesson').onclick=()=>{draft.answers={};draft.slide=qStart;save();lesson(id)};}
}

const studyLabels={meaning:'独立解释 · AI释义',boundary:'条件与失效边界',counterexample:'对照反例 · AI教学假设',method:'研究步骤',exercise:'开放练习',answer:'答案与理由',ask:'问什么',how:'怎么查',evidence:'什么算证据',failure:'不通过时的研究限制'};
function studyFields(study){return '<p class="tag">新增AI教学解释，不是脑总逐字原话或当前买卖建议</p>'+Object.entries(studyLabels).filter(([key])=>study[key]).map(([key,label])=>`<h3>${label}</h3>${key==='answer'?`<details><summary>先思考再看解析</summary><p>${esc(study[key])}</p></details>`:`<p>${esc(study[key])}</p>`}`).join('')+`<a class="src" href="#/reader/${esc(study.lesson)}/${esc(study.section)}">在长讲语境里学习</a>`;}
const depthLabels={'eight-section-longform':'本轮新增8节长讲（仍需教学审阅）','legacy-core-supplement':'仍为旧版核心补充，长讲待写','independent-explanation':'新增独立解释、边界、反例与题解','linked-not-independent':'已有主题关联，独立讲解未完成','index-only':'仅索引，独立讲解未完成','evidence-procedure':'新增查证流程与证据限制','question-only':'仅历史检查问题，证据流程待写','source-bounded-thematic-longform':'材料范围内的独立主题研习，不是整本书完成','eight-field-core-summary':'仍为八字段提要，逐主题长讲待写'};
async function coverage(){
 app.innerHTML=topbar('覆盖与缺口','工作账不是完备证书')+'<main class="pg">正在加载…</main>'+tabbar('path');bindTheme();
 const d=await get('coverage.json');if(location.hash!=='#/coverage')return;
 $('.pg').innerHTML=`<section class="card"><p>${esc(d.notice)}</p><p>长讲 ${d.summary.longformLessons}/68课；书籍独立主题模块 ${d.summary.thematicBookModules}/13本（不是整书完成）；独立原则解释 ${d.summary.independentPrinciples}/217；证据流程 ${d.summary.evidenceChecks}/65。旧失效引用 ${d.summary.unresolvedReferences} 条撤下链接，仍缺替代核验。</p><label for="coverage-search">搜索ID、主题、深度或缺口</label><input id="coverage-search" type="search" placeholder="P212 / B12 / u6l1"><p id="coverage-count" aria-live="polite"></p></section><div id="coverage-rows"></div>`;
 const render=()=>{const q=$('#coverage-search').value.toLowerCase().trim();const rows=d.rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));$('#coverage-count').textContent=`${rows.length} / ${d.rows.length}项`;$('#coverage-rows').innerHTML=rows.map(r=>`<details class="card"><summary>${esc(r.id)} · ${esc(r.title)}</summary><p>${esc(depthLabels[r.depth]||r.depth)}</p><p>材料支持主题：${esc(r.supportedTopics)}</p><p>缺口：${esc(r.gaps)}</p><p>关联或规划目标（不等于完成）：${r.targets.map(id=>`<a class="src" href="${learningHref(id)}">${esc(id)}</a>`).join(' ')}</p>${r.sources.map(s=>`<p class="ts">${esc(s.ref||s.id)} ${esc(s.date||'')} ${esc(s.locator||s.title||s.scope||'')} ${esc(s.access||'')}</p>`).join('')}</details>`).join('')};$('#coverage-search').oninput=render;render();
}

// ---------- router ----------
function route(){const h=location.hash.slice(1)||'/';window.scrollTo(0,0);status();
 const unit=courseUnit(location.hash);if(unit)return path(unit);
 if(h.startsWith('/reader/')){const [, ,id,section]=h.split('/');return renderReader({id,section,get,state:S,save,app,topbar,tabbar,bindTheme,esc})}if(h==='/coverage')return coverage();
 if(h.startsWith('/l/'))return lesson(h.slice(3));if(h.startsWith('/library'))return library();({'/':home,'/path':path,'/news':news,'/qa':qa,'/sync':sync}[h]||home)();}
addEventListener('hashchange',route);addEventListener('pagehide',()=>persist(storage,S));route();cloud().then(()=>{if(!location.hash||location.hash==='#/')home()});
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register(BASE+'sw.js');
// prefetch ready units for offline
get('index.json').then(ix=>ix.filter(u=>u.ready).forEach(u=>get(u.id+'.json'))).catch(()=>{});
