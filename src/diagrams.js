const A='var(--acc)',M='var(--mut)',T='var(--txt)',L='var(--line)',R='var(--red)';
const t=(x,y,s,o='')=>`<text x="${x}" y="${y}" ${o}>${s}</text>`;
const wrap=(h,vb='0 0 340 200')=>`<svg viewBox="${vb}" class="dg" role="img">${h}</svg>`;
export const DIAGRAMS={
ladder(){const lv=['货币基金','国债','可转债','指数基金','股票','加密/另类','期权'];let h='';
  lv.forEach((n,i)=>{const y=168-i*22,x=20+i*24,w=300-i*24*1;h+=`<rect x="${x}" y="${y}" width="${150}" height="18" rx="6" fill="${i<2?A:i>5?R:M}" opacity="${i<2?.9:.35+i*.06}"/>`+t(x+8,y+13,(i+1)+'级 '+n,`class="s" fill="${i<2?'#0b0b0d':T}"`)});
  return wrap(h+t(20,40,'风险 / 难度 ↑','class="s"')+t(210,175,'新手从这里学“价值”','class="s"'),'0 0 340 195');},
owner(){const v=[[0,150],[60,130],[120,110],[180,90],[240,70],[300,50]],p=[[0,150],[30,120],[60,140],[90,95],[120,130],[150,85],[180,110],[210,60],[240,95],[270,40],[300,62]];
  const pl=a=>a.map((q,i)=>(i?'L':'M')+(25+q[0])+','+q[1]).join(' ');
  return wrap(`<path d="${pl(v)}" fill="none" stroke="${M}" stroke-width="3" stroke-dasharray="5 4"/><path d="${pl(p)}" fill="none" stroke="${A}" stroke-width="2.2"/>`+t(30,186,'灰：每股利润（人）  绿：股价（狗）','class="s"'),'0 0 340 195');},
nikkei(){const pts=[[1985,13000],[1989.99,38916],[1992,16900],[1996,22000],[2003,7600],[2007,18000],[2009,7055],[2013,16000],[2018,24000],[2021,29000],[2024.15,39099]];
  const X=y=>20+(y-1985)/40*300,Y=v=>160-v/40000*140;
  return wrap(`<line x1="20" y1="${Y(38916)}" x2="320" y2="${Y(38916)}" stroke="${M}" stroke-dasharray="3 4"/><path d="${pts.map((q,i)=>(i?'L':'M')+X(q[0])+','+Y(q[1])).join(' ')}" fill="none" stroke="${A}" stroke-width="2.2"/>`+t(X(1990)-10,Y(38916)-6,'1989-12 38,916','class="s"')+t(X(2024)-70,Y(39099)-6,'2024-02 收复','class="s"')+t(X(2009)-8,Y(7055)+14,'≈−80%','class="v r"')+t(20,186,'日经 225（关键点为真实收盘，路径为示意）','class="s"'),'0 0 340 195');},
dca(){const pr=[10,8,5,6,10],sh=pr.map(x=>1000/x),avg=5000/sh.reduce((a,b)=>a+b);let h='';
  pr.forEach((x,i)=>{const X=40+i*58,bh=x*12;h+=`<rect x="${X}" y="${150-bh}" width="34" height="${bh}" rx="5" fill="${A}" opacity=".8"/>`+t(X+17,145-bh,x+'元','class="s" text-anchor="middle"')+t(X+17,168,Math.round(sh[i])+'份','class="s" text-anchor="middle"')});
  const ya=150-avg*12;return wrap(h+`<line x1="30" y1="${ya}" x2="320" y2="${ya}" stroke="${T}" stroke-dasharray="4 3"/>`+t(30,188,'虚线 = 平均成本 '+avg.toFixed(2)+' 元（价格均值 7.80）','class="s"'),'0 0 340 195');},
fx(){const b=[['资产(日元)',20,A],['日元兑美元',-29,R],['换回美元',-15,R]];let h='';
  b.forEach((r,i)=>{const X=50+i*95,v=r[1],bh=Math.abs(v)*2,y=v>0?80-bh:80;h+=`<rect x="${X}" y="${y}" width="50" height="${bh}" rx="5" fill="${r[2]}"/>`+t(X+25,v>0?y-5:y+bh+14,(v>0?'+':'')+v+'%','class="v" text-anchor="middle"')+t(X+25,180,r[0],'class="s" text-anchor="middle"')});
  return wrap(`<line x1="30" y1="80" x2="320" y2="80" stroke="${L}"/>`+h,'0 0 340 190');},
hedge(){const r=[['黄金 1980→1999',-70,'28 年收复'],['比特币 2021→2022',-77,'含交易所倒闭'],['纳指 2000→2002',-78,'15 年收复']];let h='';
  r.forEach((q,i)=>{const y=30+i*50,w=Math.abs(q[1])*3;h+=t(10,y-6,q[0],'class="s"')+`<rect x="10" y="${y}" width="${w}" height="20" rx="6" fill="${R}" opacity=".8"/>`+t(w+16,y+15,q[1]+'% · '+q[2],'class="s"')});
  return wrap(h,'0 0 340 175');},

ruin(){ // survival prob 0.9^n vs 10% bet
  const ns=[1,5,10,20,30,50];let h='';
  ns.forEach((n,i)=>{const p=Math.pow(.9,n),x=30+i*50,bh=p*120;
    h+=`<rect x="${x}" y="${150-bh}" width="30" height="${bh}" rx="4" fill="${p<.2?R:A}" opacity="${.35+.65*p}"/>`+t(x+15,145-bh,(p*100).toFixed(p<.01?1:0)+'%','class="v" text-anchor="middle"')+t(x+15,168,n+'次','class="s" text-anchor="middle"');});
  return wrap(`<line x1="20" y1="150" x2="330" y2="150" stroke="${L}"/>`+h+t(20,192,'每次全押、10% 概率归零：连续 n 次后仍存活的概率','class="s"'));},
drawdown(){ // nasdaq-like path & recovery table
  const pts=[[0,60],[20,20],[45,110],[70,150],[95,120],[115,95],[140,135],[175,100],[205,80],[235,62],[255,58]];
  const path=pts.map((p,i)=>(i?'L':'M')+(30+p[0])+','+p[1]).join(' ');
  return wrap(`<line x1="30" y1="${20}" x2="285" y2="20" stroke="${M}" stroke-dasharray="3 4"/>`+
  `<path d="${path}" fill="none" stroke="${A}" stroke-width="2.5" stroke-linejoin="round"/>`+
  `<path d="M50,20 L50,150 L100,150" fill="none" stroke="${R}" stroke-width="1" stroke-dasharray="2 3"/>`+
  t(108,128,'−78%','class="v r"')+t(30,16,'2000-03 高点 5,048','class="s"')+t(210,52,'2015-04 收复','class="s"')+
  t(30,175,'纳斯达克 2000–2015（示意形状，关键点为真实数据）','class="s"'),'0 0 340 185');},
leverage(){
  const ls=[1,2,3,5,10];let h='';
  ls.forEach((l,i)=>{const d=Math.min(100,100/l),y=22+i*30,w=d*2.2;
    h+=t(10,y+13,l+'×','class="v"')+`<rect x="50" y="${y}" width="220" height="18" rx="9" fill="${L}"/>`+`<rect x="50" y="${y}" width="${w}" height="18" rx="9" fill="${l>=3?R:A}" opacity=".85"/>`+t(330,y+13,l===1?'跌 100%':'跌 '+(100/l).toFixed(l===3?1:0)+'%','class="v" text-anchor="end"');});
  return wrap(h+t(10,182,'标的下跌多少，本金归零（未计利息与强平线）','class="s"'),'0 0 340 190');},
cashflow(){
  return wrap(`<rect x="10" y="10" width="155" height="150" rx="10" fill="none" stroke="${L}"/><rect x="175" y="10" width="155" height="150" rx="10" fill="none" stroke="${L}"/>`+
  t(22,32,'资产','class="h"')+t(187,32,'负债','class="h"')+
  `<rect x="22" y="44" width="131" height="30" rx="6" fill="${A}" opacity=".9"/>`+t(30,63,'应急金 3–12 个月支出','class="k"')+
  `<rect x="22" y="80" width="131" height="26" rx="6" fill="${A}" opacity=".45"/>`+t(30,97,'长期投资','class="w"')+
  `<rect x="22" y="112" width="131" height="26" rx="6" fill="${A}" opacity=".25"/>`+t(30,129,'自住房等','class="w"')+
  `<rect x="187" y="44" width="131" height="30" rx="6" fill="${R}" opacity=".85"/>`+t(195,63,'毒品负债：先清','class="w"')+
  `<rect x="187" y="80" width="131" height="26" rx="6" fill="${M}" opacity=".35"/>`+t(195,97,'引擎负债：可控','class="w"')+
  t(10,185,'月现金流 = 收入 − 固定支出 − 还款；为负就先别投资','class="s"'),'0 0 340 195');},
positions(){
  const rowsY=[40,95,150];const lab=[['前锋','小仓位 · 高波动'],['中场','好公司 / 宽基'],['后卫','跌幅有限 · 真稳']];const w=[60,160,240];let h='';
  rowsY.forEach((y,i)=>{h+=`<rect x="${170-w[i]/2}" y="${y-18}" width="${w[i]}" height="36" rx="18" fill="${A}" opacity="${[.3,.6,.95][i]}"/>`+t(170,y-1,lab[i][0],`class="${i==2?'k':'w'} h" text-anchor="middle"`)+t(170,y+12,lab[i][1],`class="${i==2?'k':'w'} s2" text-anchor="middle"`);});
  return wrap(h+t(10,190,'底盘越宽越稳：前锋最小，后卫最大（示意，非配比建议）','class="s"'),'0 0 340 190');},
barbell(){
  return wrap(`<line x1="70" y1="90" x2="270" y2="90" stroke="${M}" stroke-width="4" stroke-linecap="round"/>`+
  `<rect x="20" y="30" width="80" height="120" rx="12" fill="${A}"/><rect x="262" y="66" width="44" height="48" rx="10" fill="${R}" opacity=".9"/>`+
  t(60,85,'~90%','class="k h" text-anchor="middle"')+t(60,103,'极度安全','class="k s2" text-anchor="middle"')+t(284,94,'~10%','class="w h" text-anchor="middle"')+
  t(170,70,'中间地带','class="s" text-anchor="middle"')+t(170,84,'小赚有顶 · 大亏无底','class="s" text-anchor="middle"')+
  `<line x1="140" y1="104" x2="200" y2="104" stroke="${R}" stroke-width="2"/>`+t(284,132,'高赔率','class="s" text-anchor="middle"')+
  t(10,182,'最坏情况：冒险端归零 ≈ 总资产 −10%','class="s"'),'0 0 340 190');},
ponzi(){
  const yrs=[0,1,2,3,4,5];const inflow=[20,45,90,140,120,30],pay=[5,15,40,80,130,160];let h='';
  const X=i=>40+i*52,Y=v=>150-v*.8;
  const p1=inflow.map((v,i)=>(i?'L':'M')+X(i)+','+Y(v)).join(' '),p2=pay.map((v,i)=>(i?'L':'M')+X(i)+','+Y(v)).join(' ');
  yrs.forEach(i=>h+=t(X(i),168,'第'+i+'年','class="s" text-anchor="middle"'));
  return wrap(`<line x1="30" y1="150" x2="320" y2="150" stroke="${L}"/>`+`<path d="${p1}" fill="none" stroke="${A}" stroke-width="2.5"/>`+`<path d="${p2}" fill="none" stroke="${R}" stroke-width="2.5" stroke-dasharray="5 4"/>`+h+
  `<circle cx="${X(4)-8}" cy="${Y(125)}" r="5" fill="none" stroke="${T}"/>`+t(X(4)-6,Y(125)-12,'崩盘点','class="s" text-anchor="middle"')+
  t(36,22,'— 新进资金','class="v a"')+t(130,22,'- - 需支付的“收益”与提现','class="v r"')+t(10,188,'示意：新钱流入放缓、兑付需求超过流入时崩盘','class="s"'),'0 0 340 195');}
};
