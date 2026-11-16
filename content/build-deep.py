"""Reproducible curriculum upgrade; authored lesson text is in deep-lessons.tsv."""
import csv,json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1]
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
rows=list(csv.DictReader((root/'content/deep-lessons.tsv').open(),delimiter='\t'))
books=json.loads((root/'content/books.json').read_text())
assert len(rows)==68 and len({r['id'] for r in rows})==68
for r in rows:
 p=root/'public/data'/f"{r['id'].split('l')[0].upper()}.json"
 u=json.loads(p.read_text()); l=next(l for l in u['lessons'] if l['id']==r['id'])
 l['deep']={k:v for k,v in r.items() if k not in ['id','principles','books']}
 l['deep']['principles']=[int(x) for x in r['principles'].split(',')]
 l['deep']['books']=r['books'].split(',')
 l['edition']='2026-11-16';l['minutes']='约15–25分钟，可分段学'
 # Every old quote was already AI paraphrase; label it honestly rather than imply verbatim.
 for q in l['quotes']:q['kind']='脑总历史观点 · AI转述，非逐字引语'
 dump(p,u)
dump(root/'public/data/books.json',books)
# Source metadata is versioned so rebuilding requires no private skill installation.
k=json.loads((root/'content/source-index.json').read_text())
assert len(k['principles'])==217 and len(k['checklist'])==65
dump(root/'public/data/knowledge.json',k)
print('Built',len(rows),'deep lessons,',len(books),'books, 217 principle index entries, 65 checks')
# Correct audited legacy statements in place; keep every lesson ID and old completion key.
fixes={
 'u1l1':{'diagram':'在独立且每轮10%全损的教学假设下，全押者存活概率随次数下降。缩小风险暴露、隔离生活款、避免借贷与增加可用现金等都能改善生存路径；不是只有一种办法。'},
 'u1l3':{'cards':{0:'杠杆用借贷或保证金放大资产暴露；期权有到期、波动率与非线性定价，不能一概称为普通涨跌放大。买入普通期权通常最多损失权利金，某些卖方策略可能损失极大。新手不借钱、不碰期权合约。'},'summary':'静态线性杠杆的权益耗尽幅度约为1/倍数，实际强平可能更早；日杠杆ETF有路径依赖，期权另有到期与非线性风险。本课仅教识别，不示范使用。'},
 'u1l4':{'cards':{0:'应急金用于收入中断与意外支出，优先考虑可取用性、本金波动与法律保障；存款、货币基金和国债不是同一种产品，没有统一的“绝对不亏”承诺。现金流是收入减支出和到期付款。',1:'被迫卖出常来自失业、急用钱或到期偿债。这里不声称它在所有亏损中占最大比例；先查自己的暴露和现金缺口。'}},
 'u1l5':{'cards':{2:'单项影响可近似按权重×情景跌幅计算，但估计最坏跌幅不是保证上限。多只资产会共同消耗组合回撤预算，不能每只都使用全部预算；普通现货也可能全损。',3:'后卫、中场、前锋是脑总的功能性比喻，不是固定证券名单。国债也有久期与汇率风险，高股息也可能削减，宽基仍可能集中于高估值成长。进攻位≤10%、只用现货是本课保守学习护栏，不代表他历史上每次同一比例。'}},
 'u1l6':{'cards':{1:'只有安全端确实稳健、冒险端损失不追索到安全端且不追加担保时，冒险端全损才近似封顶其组合影响。现实仍有通胀、汇率、信用和托管风险，不能说最坏情况无条件锁死。'},'summary':'杠铃依赖安全端、有限成本与风险隔离这些前提；不是任何90/10组合都能保本，也不是中等风险标签本身一律有问题。'},
 'u1l7':{'cards':{2:'把承诺收益与同币种、同期限、同税费口径的低风险基准比较，基准利率需查看当日来源，不在课程写死当前数值。月息30%滚存一年约1.3^12=23.30倍，属于极强审查信号；不能仅凭收益一项给具体机构定罪。'}},
 'u7l5':{'cards':{0:'杀估值：经营盈利预期未明显变化，而市场愿付的倍数下降。这是脑总原则65转述的分类，不表示必然修复或自动成为买点。',1:'杀业绩：盈利预期下降，需研究经营与周期拐点。既有提炼未支持统一“连续两个季度”门槛，不能伪称他的固定规则。',2:'杀逻辑：原有商业或竞争假设失效，应核对反证；不能只因为跌幅大就认定逻辑已杀完。',4:'分类用于区分假设与证据，不能保证价格回升，也不意味着只要不是杀逻辑就无需控制风险。'},'quotes':[{'q':'他引冯柳将下跌分为杀估值、杀业绩、杀逻辑，重点是辨认盈利与商业假设有没有变化。','src':'V43 / V45 · 原则65（AI转述）','date':'2026-05-24 / 2026-06-03','kind':'脑总历史观点 · AI转述，非逐字引语'}]},
 'u13l1':{'cards':{0:'“心态是用钱堆出来的”在V10（2025-11-16）指已具备安全垫、稳定场外收入与输得起，不是靠多亏钱交学费练胆。',1:'V86摘要（2026-03-05）记约10%回撤冷静机制；V109（2026-10-18）口述集中持仓急跌15%–20%时先冷静。阈值与语境不同，不能合成适用于所有人的清仓指令。'},'summary':'稳定心态先依靠安全垫与现金流，不靠加大风险练胆；历史冷静阈值有差异，保留日期，不照搬为今日交易指令。'}
}
for uid in range(1,14):
 p=root/'public/data'/f'U{uid}.json';u=json.loads(p.read_text())
 for l in u['lessons']:
  f=fixes.get(l['id'],{})
  for i,text in f.get('cards',{}).items():l['cards'][i]['b']=text
  if 'diagram'in f:l['diagram']['cap']=f['diagram']
  for key in ['summary','quotes']:
   if key in f:l[key]=f[key]
  if l['id']=='u7l5':l['quiz'][2]={'q':'判断经营拐点时，以下做法哪项更可靠？','opts':['按具体行业检查连续经营证据，不把固定季度数冒充普遍规律','必须连续两个季度才算脑总统一门槛','PE最低就一定见底','新闻少了就代表风险消失'],'ans':0,'why':'本次已有提炼没有证明他设过通用“两季度”规则。数据口径与行业时滞不同，需写清证据与未知。'}
  if l['id']=='u13l1':l['quiz'][0]={'q':'V10中“心态用钱堆出来”的关键含义是？','opts':['安全垫、稳定现金流与输得起，而不是多亏钱练胆','只要亏得多自然就不怕了','本金再小也该全仓练习','模拟盘不紧张就能加杠杆'],'ans':0,'why':'2025-11-16的语境是赢得起、输得起和场外现金流，不能误解为通过损失训练胆量。'}
 dump(p,u)
