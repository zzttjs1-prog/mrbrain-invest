import './style.css';
import {DIAGRAMS} from './diagrams.js';
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
const KEY='mb-progress-v2';
const S=Object.assign({theme:'dark',xp:0,days:[],lessons:{}},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>{localStorage.setItem(KEY,JSON.stringify(S));clearTimeout(save.t);save.t=setTimeout(()=>cloudPush().catch(()=>{}),1500)};
// ---------- sync ----------
function merge(o){if(!o)return;S.xp=Math.max(S.xp||0,o.xp||0);S.days=[...new Set([...(S.days||[]),...(o.days||[])])].sort();
 for(const [k,v] of Object.entries(o.lessons||{})){const c=S.lessons[k]||{};S.lessons[k]={done:c.done||v.done,stars:Math.max(c.stars||0,v.stars||0),best:Math.max(c.best||0,v.best||0)}}}
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify({xp:o.xp,days:o.days,lessons:o.lessons}))));
const dec=c=>JSON.parse(decodeURIComponent(escape(atob(c.trim()))));
let SB=null,USER=null;
async function cloud(){if(SB!==null)return SB;SB=false;try{const c=await fetch(import.meta.env.BASE_URL+'data/config.json').then(r=>r.json());
 if(c.supabaseUrl&&c.supabaseAnonKey){const m=await import(/* @vite-ignore */'https://esm.sh/@supabase/supabase-js@2');SB=m.createClient(c.supabaseUrl,c.supabaseAnonKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}});
  const {data}=await SB.auth.getSession();USER=data.session?.user||null;if(USER)await cloudPull()}}catch(e){SB=false}return SB}
async function cloudPull(){const {data}=await SB.from('progress').select('data').eq('user_id',USER.id).maybeSingle();if(data)merge(data.data);localStorage.setItem(KEY,JSON.stringify(S));await cloudPush()}
async function cloudPush(){if(!SB||!USER)return;await SB.from('progress').upsert({user_id:USER.id,data:{xp:S.xp,days:S.days,lessons:S.lessons},updated_at:new Date().toISOString()})}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function streak(){const set=new Set(S.days);let d=new Date(),n=0;if(!set.has(dkey(d)))d.setDate(d.getDate()-1);while(set.has(dkey(d))){n++;d.setDate(d.getDate()-1)}return n}
document.documentElement.dataset.theme=S.theme;
// ---------- data ----------
const cache={};
const get=async p=>cache[p]||(cache[p]=fetch(BASE+'data/'+p).then(r=>{if(!r.ok)throw 0;return r.json()}));
const shortT=t=>t.replace(/^第\d+单元\s*·\s*/,'');
const shuffleQ=(q,seed)=>{const idx=q.opts.map((_,i)=>i);let s=seed;for(let i=idx.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=s%(i+1);[idx[i],idx[j]]=[idx[j],idx[i]]}return{opts:idx.map(i=>q.opts[i]),ans:idx.indexOf(q.ans)}};
// ---------- shell ----------
const DISC='只做教育，不构成投资建议。课程中“脑总怎么看”为 AI 根据公开视频资料整理的转述，不代表本人逐字原话。';
function topbar(title,sub=''){return `<header class="top glass"><div><div class="tt">${title}</div>${sub?`<div class="ts">${sub}</div>`:''}</div><button class="ibtn" id="theme" aria-label="切换主题">${ic(S.theme==='dark'?'sun':'moon')}</button></header>`}
function tabbar(cur){const tabs=[['home','首页','#/'],['path','课程','#/path'],['news','今日','#/news'],['qa','问答本','#/qa']];
 return `<nav class="tabs glass">${tabs.map(([k,n,h])=>`<a href="${h}" class="tab ${cur===k?'on':''}">${ic(k)}<span>${n}</span></a>`).join('')}</nav>`}
function bindTheme(){const b=$('#theme');b&&(b.onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';save();document.documentElement.dataset.theme=S.theme;route()})}
const skel=n=>Array.from({length:n},()=>'<div class="sk"></div>').join('');
// ---------- home ----------
function ring(p){const r=34,c=2*Math.PI*r;return `<svg viewBox="0 0 80 80" class="ring"><circle cx="40" cy="40" r="${r}" class="rb"/><circle cx="40" cy="40" r="${r}" class="rf" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 40 40)"/></svg>`}
function cal(){const set=new Set(S.days),d=new Date();d.setDate(d.getDate()-34);let h='';for(let i=0;i<35;i++){const k=dkey(d);h+=`<i class="${set.has(k)?'on':''} ${k===today()?'td':''}"></i>`;d.setDate(d.getDate()+1)}return `<div class="cal">${h}</div>`}
async function home(){
 app.innerHTML=topbar('脑总投资课','系统学投资 · 先学会不亏大钱')+`<main class="pg">${skel(3)}</main>`+tabbar('home');bindTheme();
 const idx=await get('index.json');const ready=idx.filter(u=>u.ready);const all=ready.flatMap(u=>u.lessons.map((t,i)=>({u,t,id:u.id.toLowerCase()+'l'+(i+1)})));
 const done=all.filter(l=>S.lessons[l.id]?.done).length;const next=all.find(l=>!S.lessons[l.id]?.done)||all[0];
 const stars=Object.values(S.lessons).reduce((a,b)=>a+(b.stars||0),0);const total=idx.reduce((a,u)=>a+u.lessons.length,0);
 $('.pg').innerHTML=`
 <section class="hero card in"><div class="hl"><div class="lbl">精品课进度</div><div class="big">${done}<small> / ${all.length}</small></div><div class="ts">全部 ${total} 课正在逐单元升级为精品版</div></div><div class="rw">${ring(all.length?done/all.length:0)}<b>${Math.round(all.length?done/all.length*100:0)}%</b></div></section>
 <section class="stats in d1"><div class="st">${ic('flame','a')}<b>${streak()}</b><span>连续天数</span></div><div class="st">${ic('bolt','a')}<b>${S.xp}</b><span>经验值</span></div><div class="st">${ic('star','a')}<b>${stars}</b><span>星星</span></div></section>
 <a class="cont card in d2 syn" href="#/sync"><div><div class="lbl">账号与进度同步</div><div class="ts">${USER?'已登录 · 进度自动同步':'进度保存在本机 · 可登录或用同步码换设备'}</div></div><span class="go">${ic('arrow')}</span></a>
 <a class="cont card in d2" href="#/l/${next.id}"><div><div class="lbl">${done?'继续学习':'从这里开始'} · ${shortT(next.u.title)}</div><div class="ct">${esc(next.t)}</div><div class="ts">约 8 分钟 · 讲解 + 真实案例 + 情景题</div></div><span class="go">${ic('arrow')}</span></a>
 <section class="card in d3"><div class="row"><div class="lbl">学习日历</div><div class="ts">近 5 周</div></div>${cal()}</section>
 <p class="disc">${DISC}</p>`;}
// ---------- path ----------
async function path(){
 app.innerHTML=topbar('课程路线','13 个单元 · 按学习阶段编排')+`<main class="pg">${skel(4)}</main>`+tabbar('path');bindTheme();
 const idx=await get('index.json');const cm=await get('curriculum.json').catch(()=>({units:[]}));const C=Object.fromEntries(cm.units.map(u=>[u.id,u]));
 const map=`<section class="card cmap in"><div class="lbl">课程地图</div><p class="ts">${esc(cm.note||'')}</p><div class="cm">${cm.units.map(u=>`<a class="cmu ${u.ready?'r':''}" href="#u-${u.id}"><b>${u.id}</b><span>${esc(u.stageName)}</span></a>`).join('')}</div></section>`;
 $('.pg').innerHTML=map+idx.map((u,ui)=>`<section id="u-${u.id}" class="unit in" style="animation-delay:${Math.min(ui,6)*40}ms"><div class="uh"><span class="un">${u.id}</span><div><div class="ut">${esc(shortT(u.title))}</div><div class="ts">${u.ready?u.lessons.length+' 课 · 精品版':'升级中 · 精品版即将上线'}</div></div>${u.ready?'':`<span class="pill">${ic('lock')}升级中</span>`}</div>${C[u.id]?`<p class="ts ug">阶段 ${C[u.id].stage} · ${esc(C[u.id].stageName)} · 先修 ${esc(C[u.id].pre)}<br>学完能：${esc(C[u.id].goal)}${C[u.id].check.length?` · 对应检查清单第 ${C[u.id].check.join('、')} 条`:''}</p>`:''}
 ${u.ready?`<div class="nodes">${u.lessons.map((t,i)=>{const id=u.id.toLowerCase()+'l'+(i+1),st=S.lessons[id];return `<a class="node ${st?.done?'done':''}" href="#/l/${id}"><span class="dot">${st?.done?ic('check'):i+1}</span><span class="nt">${esc(t)}</span><span class="sr">${[0,1,2].map(k=>ic('star',k<(st?.stars||0)?'a':'dim')).join('')}</span></a>`}).join('')}</div>`
 :`<div class="lockd">${u.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`}</section>`).join('')+`<p class="disc">${DISC}</p>`;}
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
 app.innerHTML=topbar('问答本','你问过的问题会整理在这里')+`<main class="pg">${skel(2)}</main>`+tabbar('qa');bindTheme();
 const d=await get('qa.json').catch(()=>[]);
 $('.pg').innerHTML=d.length?d.map(q=>`<article class="card in"><div class="ts">${esc(q.date)}</div><h3>${esc(q.q)}</h3><p>${esc(q.a)}</p></article>`).join(''):`<div class="empty card in">${ic('qa','big')}<h3>还没有问答</h3><p class="ts">学习中遇到的问题，在对话里直接问我。整理好的答案会出现在这里。</p></div>`;}
async function sync(){
 app.innerHTML=topbar('账号与同步','不登录也能用，进度存在本机')+`<main class="pg">${skel(2)}</main>`+tabbar('home');bindTheme();
 const sb=await cloud();
 $('.pg').innerHTML=`<section class="card in"><div class="lbl">GitHub 登录（跨设备自动同步）</div>${sb?(USER?`<p>已登录：${esc(USER.user_metadata?.user_name||USER.email||'')}</p><button class="btn ghost" id="out">退出登录</button>`:`<p class="ts">用 GitHub 账号登录，进度会保存到云端，换手机也能接着学。</p><button class="btn" id="gh">用 GitHub 登录</button>`):`<p class="ts">云端登录还在开通中（需要管理员完成一次免费配置）。现在可以先用下面的同步码在设备之间搬进度。</p>`}</section>
 <section class="card in"><div class="lbl">同步码（无需账号）</div><p class="ts">在旧设备复制同步码，到新设备粘贴导入。导入会合并进度，不会覆盖。</p><textarea id="code" rows="4" placeholder="在这里粘贴同步码"></textarea><div class="row2"><button class="btn" id="cp">复制我的同步码</button><button class="btn ghost" id="im">导入</button></div><p class="ts" id="msg"></p></section><p class="disc">同步码只包含学习进度（经验值、学习日期、每课星级），不含任何个人信息。</p>`;
 const msg=t=>$('#msg').textContent=t;
 $('#cp').onclick=async()=>{const c=enc(S);$('#code').value=c;try{await navigator.clipboard.writeText(c);msg('已复制')}catch{msg('已显示在上方，长按复制')}};
 $('#im').onclick=()=>{try{merge(dec($('#code').value));save();msg('导入成功，进度已合并')}catch{msg('同步码无效')}};
 $('#gh')&&($('#gh').onclick=()=>SB.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+import.meta.env.BASE_URL}}));
 $('#out')&&($('#out').onclick=async()=>{await SB.auth.signOut();USER=null;sync()});}
// ---------- lesson ----------
async function lesson(id){
 const uid=id.match(/^u\d+/)[0].toUpperCase();
 app.innerHTML=`<div class="ls"><header class="lt glass"><a class="ibtn" href="#/path">${ic('x')}</a><div class="bar"></div><span class="ts cnt"></span></header><div class="pager"><div class="slide"><div class="pad">${skel(3)}</div></div></div></div>`;
 let unit;try{unit=await get(uid+'.json')}catch{app.querySelector('.pad').innerHTML='<div class="empty">该单元正在升级为精品版。</div>';return}
 const L=unit.lessons.find(l=>l.id===id);if(!L){location.hash='#/path';return}
 const slides=[];
 slides.push(`<div class="kick">${esc(shortT(unit.title))}</div><h1>${esc(L.title)}</h1><p class="lead">${esc(L.cards[0].b)}</p><div class="meta"><span>${L.cards.length} 张讲解卡</span><span>${L.examples.length} 个真实案例</span><span>${L.quiz.length} 道情景题</span></div><div class="swipe">左滑开始 ${ic('arrow')}</div>`);
 L.cards.slice(1).forEach((c,i)=>slides.push(`<div class="kick">${String(i+2).padStart(2,'0')} · ${esc(c.t)}</div><p class="body">${esc(c.b)}</p>`));
 slides.push(`<div class="kick">图解</div><div class="card dgw">${DIAGRAMS[L.diagram.type]?.(L.diagram)||''}</div>${L.diagram.type==='drawdown'?`<div class="rt">${[[10,11],[20,25],[30,43],[50,100],[80,400]].map(r=>`<div><b>−${r[0]}%</b><span>需 +${r[1]}%</span></div>`).join('')}</div>`:''}<p class="dcap">${esc(L.diagram.cap||'')}</p>`);
 L.examples.forEach(e=>slides.push(`<div class="kick">${esc(e.tag)}</div><h2>${esc(e.title)}</h2><div class="tbl">${e.rows.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}</div><p class="note">${esc(e.note)}</p><div class="srcs">${e.src.map(s=>s.u?`<a href="${esc(s.u)}" target="_blank" rel="noopener">${ic('link')}${esc(s.n)} <i>${esc(s.d)}</i></a>`:`<span>${esc(s.n)} <i>${esc(s.d)}</i></span>`).join('')}</div>`));
 slides.push(`<div class="kick">脑总怎么看</div>${L.quotes.map(q=>`<blockquote class="card">${ic('quote','a')}<p>${esc(q.q)}</p><cite>${esc(q.src)} · ${esc(q.date)}</cite></blockquote>`).join('')}<p class="note">AI 根据公开视频资料整理的转述，非逐字原话。</p>`);
 slides.push(`<div class="kick">本课小结</div><div class="card sum"><p>${esc(L.summary)}</p></div><div class="swipe">接下来 ${L.quiz.length} 道情景题 ${ic('arrow')}</div>`);
 const qStart=slides.length,seed=[...id].reduce((a,c)=>a+c.charCodeAt(0),7);
 const Qs=L.quiz.map((q,i)=>({...q,...shuffleQ(q,seed+i*31)}));
 Qs.forEach((q,i)=>slides.push(`<div class="kick">情景题 ${i+1} / ${Qs.length}</div><h2 class="qq">${esc(q.q)}</h2><div class="opts" data-q="${i}">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="why" hidden></div>`));
 slides.push(`<div class="end"></div>`);
 const pager=$('.pager');pager.innerHTML=slides.map(s=>`<section class="slide"><div class="pad">${s}</div></section>`).join('');
 $('.bar').innerHTML=slides.map(()=>'<i></i>').join('');
 const res=Array(Qs.length).fill(null);
 const upd=()=>{const k=Math.round(pager.scrollLeft/pager.clientWidth);document.querySelectorAll('.bar i').forEach((b,i)=>b.classList.toggle('on',i<=k));$('.cnt').textContent=(k+1)+'/'+slides.length;if(k===slides.length-1)finish()};
 pager.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});upd();
 pager.querySelectorAll('.opts').forEach(box=>box.onclick=e=>{const b=e.target.closest('.opt');if(!b||box.classList.contains('done'))return;const qi=+box.dataset.q,q=Qs[qi],j=+b.dataset.j;res[qi]=j===q.ans;box.classList.add('done');
  box.querySelectorAll('.opt').forEach((o,k)=>o.classList.add(k===q.ans?'ok':k===j?'bad':'off'));
  const w=box.nextElementSibling;w.hidden=false;w.innerHTML=`<div class="wh ${res[qi]?'g':'r'}">${res[qi]?ic('check')+'答对了':'正确答案是 '+'ABCD'[q.ans]}</div><p>${esc(q.why)}</p><button class="btn nx">下一题 ${ic('arrow')}</button>`;w.querySelector('.nx').onclick=()=>pager.scrollBy({left:pager.clientWidth,behavior:'smooth'});});
 let fin=false;function finish(){const end=$('.end');const answered=res.filter(r=>r!==null).length,right=res.filter(Boolean).length;
  if(answered<Qs.length){end.innerHTML=`<h2>还有 ${Qs.length-answered} 道题没答</h2><p class="ts">答完全部情景题才能结算星星。</p><button class="btn" id="bk">回到第一道未答题</button>`;$('#bk').onclick=()=>pager.scrollTo({left:pager.clientWidth*(qStart+res.findIndex(r=>r===null)),behavior:'smooth'});return}
  if(fin)return;fin=true;const stars=right===Qs.length?3:right>=Qs.length*.75?2:1;const prev=S.lessons[id]||{};const gain=right*10+(prev.done?0:20);
  S.lessons[id]={done:true,stars:Math.max(stars,prev.stars||0),best:Math.max(right,prev.best||0)};S.xp+=gain;if(!S.days.includes(today()))S.days.push(today());save();
  const ids=unit.lessons.map(l=>l.id),nx=ids[ids.indexOf(id)+1];
  end.innerHTML=`<div class="stars">${[0,1,2].map(k=>ic('star',k<stars?'a pop':'dim')).join('')}</div><h2>${right} / ${Qs.length} 答对</h2><p class="ts">+${gain} 经验值 · 连续学习 ${streak()} 天</p><div class="card sum"><p>${esc(L.summary)}</p></div>${nx?`<a class="btn" href="#/l/${nx}">下一课 ${ic('arrow')}</a>`:`<a class="btn" href="#/path">回到课程路线</a>`}<a class="btn ghost" href="#/">回首页</a><p class="disc">${DISC}</p>`;}
}
// ---------- router ----------
function route(){const h=location.hash.slice(1)||'/';window.scrollTo(0,0);
 if(h.startsWith('/l/'))return lesson(h.slice(3));({'/':home,'/path':path,'/news':news,'/qa':qa,'/sync':sync}[h]||home)();}
addEventListener('hashchange',route);cloud().finally(route);
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register(BASE+'sw.js');
// prefetch ready units for offline
get('index.json').then(ix=>ix.filter(u=>u.ready).forEach(u=>get(u.id+'.json'))).catch(()=>{});
