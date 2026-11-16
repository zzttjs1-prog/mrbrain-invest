// Separate longform reader: legacy slide numbers, quiz settlement and XP are unchanged.
export async function renderReader({id,section,get,state,save,app,topbar,tabbar,bindTheme,esc}) {
 const expectedHash=location.hash;
 if(!/^(u\d+l\d+|B\d+)$/.test(id))return;
 app.innerHTML=topbar('分章深读','章节位置与自己的回答保存在本机')+'<main class="pg">正在加载…</main>'+tabbar('path');bindTheme();
 let c;try{c=await get('chapters/'+id+'.json')}catch{app.querySelector('main').textContent='这份长讲尚未完成；原课和已有进度仍保留。';return}
 if(location.hash!==expectedHash)return;
 if(id.startsWith('u')&&!state.lessons[id]?.done)state.current=id;
 const record=state.reading[id]||(state.reading[id]={section:'',responses:{}});
 const target=section||record.section;let index=Math.max(0,c.sections.findIndex(s=>s.id===target));
 const link=s=>'#/reader/'+id+'/'+s;
 const show=()=>{
 const s=c.sections[index];record.section=s.id;save();
 const para=xs=>xs.map(p=>`<p>${esc(p)}</p>`).join('');
 app.querySelector('main').innerHTML=`<a class="src" href="#/path">← 课程</a><h1>${esc(c.title)}</h1><p class="note">仅供投资教育，不构成投资建议。作者释义 / 脑总带日期历史观点 / AI原创演算分别标明。阅读不重复发放经验，不改变原课结算。</p>${c.scope?`<p class="note">${esc(c.scope)}</p>`:''}<details class="card"><summary>目录 · ${index+1} / ${c.sections.length}</summary>${c.sections.map((p,i)=>`<a class="reader-toc" href="${link(p.id)}" ${i===index?'aria-current="page"':''}>${i+1}. ${esc(p.title)}</a>`).join('')}</details><section class="card"><label for="chapter-search">在本模块全文搜索</label><input id="chapter-search" type="search" placeholder="输入概念或关键词"><div id="chapter-results" aria-live="polite"></div></section><article class="card longform"><div class="tag">${esc(s.attribution)}</div><p class="ts">第 ${index+1} / ${c.sections.length} 节</p><h2>${esc(s.title)}</h2>${para(s.paragraphs)}${s.answer.length?`<label for="reader-response">先写自己的推理（输入即本机保存）</label><textarea id="reader-response" rows="6">${esc(record.responses[s.id]||'')}</textarea><details><summary>展开答案与完整推理</summary>${para(s.answer)}</details>`:''}</article><nav class="row2" aria-label="章节翻页">${index?`<a class="btn ghost" href="${link(c.sections[index-1].id)}">上一节</a>`:'<span></span>'}${index<c.sections.length-1?`<a class="btn" href="${link(c.sections[index+1].id)}">下一节</a>`:`<a class="btn" href="${id.startsWith('u')?'#/l/'+id:'#/library/'+id}">${id.startsWith('u')?'返回原课与测验':'返回书籍'}</a>`}</nav><details class="card"><summary>材料、日期与缺口（${c.sources.length}）</summary>${c.sources.map(src=>`<h3>${esc(src.kind)} · ${esc(src.ref)} ${esc(src.date||'')}</h3><p>${esc(src.locator||src.scope||'')}</p>${src.locator&&src.scope?`<p>${esc(src.scope)}</p>`:''}<p class="ts">${esc(src.reliability||src.access||'依据已标材料释义；非原文逐字引述')}</p>${src.url?`<a class="src" href="${esc(src.url)}" target="_blank" rel="noopener">材料原链接（不保证公开访问）</a>`:''}`).join('')}</details><a class="btn ghost" href="${id.startsWith('u')?'#/l/'+id:'#/library/'+id}">原${id.startsWith('u')?'课程与结算测验':'书籍提要'}</a><a class="btn ghost" href="#/coverage">查看全部363项实际覆盖与未完成项</a>`;
 const response=app.querySelector('#reader-response');if(response)response.oninput=e=>{record.responses[s.id]=e.target.value;save()};
 app.querySelector('#chapter-search').oninput=e=>{const q=e.target.value.toLowerCase().trim();app.querySelector('#chapter-results').innerHTML=q?c.sections.filter(p=>[p.title,...p.paragraphs,...p.answer].join('\n').toLowerCase().includes(q)).map(p=>`<a class="reader-toc" href="${link(p.id)}">${esc(p.title)}</a>`).join('')||'<p>没有匹配章节</p>':''};
 };show();
}
