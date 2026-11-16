"""Build authored chapters and an honest, exhaustive depth/evidence ledger."""
import json, pathlib, re
root=pathlib.Path(__file__).resolve().parents[1]
def read(p): return json.loads((root/p).read_text())
def dump(p,v):
 p=root/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
k=read('public/data/knowledge.json');books=read('content/books.json');plan=read('content/coverage-plan.json')
sources={s['id']:s for s in k['sources']};chapters=[]
from worked import build
worked,tables=build()
dump('public/data/worked-examples.json',worked)
for path in sorted((root/'content/chapters').glob('*.md')):
 text=path.read_text()
 for key,value in tables.items():text=text.replace('@@'+key+'@@',value)
 assert '@@' not in text,path
 meta,body=text.split('\n',1);c=json.loads(meta);assert c['id']==path.stem;c['sections']=[]
 for block in re.split(r'^## ',body,flags=re.M)[1:]:
  heading,prose=block.split('\n',1);sid,title,attribution=heading.split(' | ')
  paragraphs=prose.strip().split('\n\n');answer=[]
  for i,p in enumerate(paragraphs):
   if p.startswith('解析：'):answer=paragraphs[i:];paragraphs=paragraphs[:i];break
  c['sections'].append(dict(id=sid,title=title,attribution=attribution,paragraphs=paragraphs,answer=answer))
 assert len(c['sections'])>=8 and len({s['id'] for s in c['sections']})==len(c['sections'])
 for src in c['sources']:
  if src['ref'] in sources:
   original=sources[src['ref']];assert src.get('date')==original['date'],(c['id'],src)
   src['url']=original.get('url');src['access']=original.get('access');src['reliability']=original['reliability']
 c['proseCharacters']=sum(len(p) for section in c['sections'] for p in section['paragraphs']+section['answer']);c['exerciseCount']=sum(bool(section['answer']) for section in c['sections'])
 c['edition']='review-corrected-stage-5';chapters.append(c);dump('public/data/chapters/'+c['id']+'.json',c)
ps=read('content/principle-studies.json');cs=read('content/check-studies.json')
for p in k['principles']:
 p['lessons']=sorted(set(p['lessons']+[c['id'] for c in chapters if c['id'].startswith('u') and p['id'] in c['principles']]))
 if str(p['id']) in ps:
  p['study']=ps[str(p['id'])]
  if p['study']['lesson'].startswith('u'):p['lessons']=sorted(set(p['lessons']+[p['study']['lesson']]))
 p['depth']='independent-explanation' if p.get('study') else 'linked-not-independent' if p['lessons'] or any(p['id'] in c['principles'] for c in chapters) else 'index-only'
for c in k['checklist']:
 if str(c['id']) in cs:c['study']=cs[str(c['id'])]
dump('public/data/knowledge.json',k)
# A dead reference is an audit trail, not clickable evidence. Retain original URL in metadata.
broken=read('content/source-link-checks.json');repairs=read('content/source-repairs-stage-1.json');unresolved=[]
lessons=[]
for uid in range(1,14):
 path='public/data/U'+str(uid)+'.json';unit=read(path)
 for l in unit['lessons']:
  lessons.append(l)
  for e in l['examples']:
   for s in e['src']:
    url=s.get('unverifiedUrl') or s.get('u')
    if url in repairs:
     s.update(repairs[url]);s['supersededUrl']=url;s.pop('unverifiedUrl',None)
    elif url in broken:
     s.update(u='',unverifiedUrl=url,audit='旧引用返回404；已撤下可点击链接，尚未核验可支持原断言的替代，不用它支持结论。')
     unresolved.append(dict(lesson=l['id'],url=url,name=s['n']))
  # Two replacements support only a narrower claim than the old anecdote did.
 for l in unit['lessons']:
  if l['id']=='u3l7':
   e=l['examples'][0];e.update(tag='公开文件 · 2000-11-07',title='Pets.com：没有新融资，经营怎样被迫结束',rows=[['2000-11-04','董事会决定：若11月7日前无可行收购或注资，启动有序退出'],['2000-11-07','公告披露没有收到可行要约'],['后续安排','裁员、出售库存设备和品牌等资产']],note='SEC所存公司8-K直接支持融资未落实与退出安排，不单独证明“没人懂生意”或所有成本数据。融资依赖不是诈骗的同义词。',auditNotice='本轮已实读公司2000-11-07 8-K；仅以其中明确披露的事项为例。')
  if l['id']=='u6l5':
   e=l['examples'][0];e.update(tag='教学假设 · 非历史报价复核',title='盈利收益率与国债利率：只能作比较起点',rows=[['假设国债年收益率','5%，币种与期限需另核'],['假设股票PE','20倍，盈利为正且口径一致'],['盈利收益率E/P','1/20=5%'],['不能推出','不能据此断言股权风险溢价为零']],note='E/P是会计盈利相对价格，不是股东当年收到的现金或完整预期总收益。再投资增长、分红、估值变化、资本开支、税费与风险均不同；两者相等只提示需要进一步研究，不能自动构成卖出信号。',auditNotice='旧案例未逐项复核2023报价，已明确改为教学假设；财政部方法页不为本例5%背书。')
  if l['id']=='u13l1':
   e=l['examples'][0];e['auditNotice']='两个人的比例为教学假设，不是SEC原案例；官方页面只支持期限、目标与承受本金损失的能力需结合考虑。';e['rows']=[['投资额占总资源5%','是否承受仍取决于付款与责任'],['投资额占总资源80%','更需核查现金流，不自动断定不能承受'],['相同跌幅','金额、到期义务与收入相关性可能不同'],['研究步骤','先画个人现金时间表，不照搬统一仓位']];e['note']='心态既受财务结构也受个人因素影响，不是只靠一个比例。'
 dump(path,unit)
ledger=[];byid={c['id']:c for c in chapters}
def refs(ids): return [sources[x] for x in ids if x in sources]
for l in lessons:
 c=byid.get(l['id']);pids=l['deep']['principles'];v=list(dict.fromkeys(v for p in k['principles'] if p['id'] in pids for v in p['sources']))
 ledger.append(dict(type='lesson',id=l['id'],title=l['title'],supportedTopics='；'.join(s['title'] for s in c['sections'] if not s['answer']) if c else l['deep']['mechanism'],sources=c['sources'] if c else refs(v),depth='eight-section-longform' if c else 'legacy-core-supplement',authoredSections=len(c['sections']) if c else 0,targets=[l['id']],gaps='需要继续学科审阅与更多迁移练习；本章不是全体原则的独立讲解' if c else '仍缺独立长篇因果讲解、展开案例和完整迁移题解析'))
for p in k['principles']:
 actual=[c['id'] for c in chapters if p['id'] in c['principles']]
 planned=plan['unmappedPrinciples'].get(str(p['id']),[])
 if isinstance(planned,str):planned=[planned]
 ledger.append(dict(type='principle',id='P'+str(p['id']),title=p['title'],supportedTopics=p['title'],sources=refs(p['sources']),depth=p['depth'],targets=sorted(set(p['lessons']+actual+planned+([p['study']['lesson']] if p.get('study') else []))),plannedOnly=planned,authoredLinks=actual,gaps='已有独立解释、条件、反例、方法与题解；仍待更广材料对照' if p.get('study') else '尚缺本条独立的机制、条件、反例和题解；主题关联与规划不算完成'))
for c in k['checklist']:
 ledger.append(dict(type='check',id='CK'+str(c['id']),title=c['text'],supportedTopics=c['text'],sources=refs(re.findall(r'\[(V\d+)\]',c['text'])),depth='evidence-procedure' if c.get('study') else 'question-only',targets=sorted(set([plan['checkLessons'][c['id']-1]]+([c['study']['lesson']] if c.get('study') else []))),gaps='已说明问什么、怎么查、证据及不通过限制；未代用户查个人证据' if c.get('study') else '仅有历史问题，缺证据获取、判断边界与不通过限制的独立教学'))
for b in books:
 c=byid.get(b['id'])
 ledger.append(dict(type='book',id=b['id'],title=b['title'],supportedTopics='；'.join(s['title'] for s in c['sections'] if not s['answer']) if c else b['concept'],sources=c['sources'] if c else [dict(kind='既有书籍笔记',ref=b['id'],locator=b['loc'],access='本地已有笔记；本轮未重新通读原书')],depth='source-bounded-thematic-longform' if c else 'eight-field-core-summary',targets=([b['id']] if c else [])+[l['id'] for l in lessons if b['id'] in l['deep']['books']],gaps=c['scope'] if c else '独立逐主题长讲、跨书分歧及充分题解尚待扩写；原书版本和缺失原文须先核，不能杜撰章节'))
assert len(ledger)==363
summary=dict(lessons=len(lessons),longformLessons=sum(c['id'].startswith('u') for c in chapters),books=len(books),thematicBookModules=sum(c['id'].startswith('B') for c in chapters),independentPrinciples=len(ps),evidenceChecks=len(cs),principleIndexOnly=sum(p['depth']=='index-only' for p in k['principles']),principleLinkedOnly=sum(p['depth']=='linked-not-independent' for p in k['principles']),principlesWithCourseLinks=sum(bool(p['lessons']) for p in k['principles']),unresolvedReferences=len(unresolved))
coverage=dict(edition='review-corrected-stage-5',notice='覆盖矩阵是工作账，不是完备证书。关联、计划和已独立讲解分别记录；13书未全部讲透。',summary=summary,rows=ledger,unresolvedReferences=unresolved)
dump('public/data/coverage.json',coverage)
dump('public/data/chapters/index.json',dict(edition=coverage['edition'],notice=coverage['notice'],summary=summary,chapters=[{k:v for k,v in c.items() if k!='sections'}|dict(sectionCount=len(c['sections'])) for c in chapters]))
lines=['# 材料支持与实际教学深度矩阵','',coverage['notice'],'','统计：'+json.dumps(summary,ensure_ascii=False),'','|类型 / ID|主题|实际深度|材料|目标（含规划，不等于完成）|明确缺口|','|---|---|---|---|---|---|']
for r in ledger:
 material='；'.join(s.get('ref',s.get('id',''))+' '+s.get('date','')+' '+s.get('locator',s.get('title','')) for s in r['sources'])
 lines.append('|'+ '|'.join(str(x).replace('|','／').replace('\n',' ') for x in [r['type']+' '+r['id'],r['title'],r['depth'],material,', '.join(r['targets']),r['gaps']])+'|')
(root/'docs/coverage-matrix-current.md').write_text('\n'.join(lines)+'\n')
manifest={c['id']:dict(sectionCount=len(c['sections']),scope=c.get('scope','')) for c in chapters}
(root/'src/chapter-manifest.js').write_text('// Generated by content/build-chapters.py; depth comes from authored modules, not plans.\nexport const CHAPTERS='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\nexport const COVERAGE='+json.dumps(summary,ensure_ascii=False,separators=(',',':'))+';\n')
print('Authored stage:',summary)
