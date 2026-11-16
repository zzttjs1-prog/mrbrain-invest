"""AI-authored hypothetical inputs and reproducible arithmetic, not historical observations."""
from math import floor
import json,pathlib

def fmt(x): return f'{x:.4f}'.rstrip('0').rstrip('.')

def build():
 cases={};tables={}
 # Paper Bridge: amounts million currency units; shares million; no leases, minorities or deferred tax.
 d={'cash':20,'receivables':20,'inventory':10,'ppe':70,'debt':40,'payables':10,'equity':70,'shares':10,'revenue':100,'growth':.1,'margin':.2,'tax':.25,'interestRate':.05,'depreciation':5,'maintenanceCapex':5,'expansionPerExtraSales':.4,'arRatio':.2,'inventoryRatio':.1,'apRatio':.1,'dividend':6,'annualDebtDue':20,'refinance':20,'wacc':.1,'terminalGrowth':.03,'terminalMarginalROIC':.15}
 rows=[];cash=d['cash'];ppe=d['ppe'];equity=d['equity'];nwc=20;revenue=100
 for year in range(1,4):
  prevrev=revenue;revenue*=1+d['growth'];ebit=revenue*d['margin'];interest=d['debt']*d['interestRate'];tax=(ebit-interest)*d['tax'];ni=ebit-interest-tax
  ar=revenue*d['arRatio'];inv=revenue*d['inventoryRatio'];ap=revenue*d['apRatio'];dnwc=ar+inv-ap-nwc;nwc+=dnwc
  capex=d['maintenanceCapex']+(revenue-prevrev)*d['expansionPerExtraSales'];cfo=ni+d['depreciation']-dnwc;cash+=cfo-capex+d['refinance']-d['annualDebtDue']-d['dividend'];ppe+=capex-d['depreciation'];equity+=ni-d['dividend'];nopat=ebit*(1-d['tax']);fcff=nopat+d['depreciation']-capex-dnwc;fcfe=cfo-capex+d['refinance']-d['annualDebtDue']
  rows.append(dict(year=year,revenue=revenue,ebit=ebit,interest=interest,tax=tax,netIncome=ni,nopat=nopat,ar=ar,inventory=inv,payables=ap,nwc=nwc,deltaNWC=dnwc,depreciation=d['depreciation'],maintenanceCapex=5,expansionCapex=capex-5,capex=capex,cfo=cfo,dividend=6,cash=cash,ppe=ppe,debt=40,equity=equity,assets=cash+ar+inv+ppe,liabilitiesAndEquity=40+ap+equity,fcff=fcff,fcfe=fcfe))
 def val(r,g,roic=.15):
  if r<=g or roic<=0: raise ValueError('Invalid terminal assumptions')
  explicit=sum(x['fcff']/(1+r)**x['year'] for x in rows);f4=rows[-1]['nopat']*(1+g)*(1-g/roic);tv=f4/(r-g);pvt=tv/(1+r)**3;ev=explicit+pvt
  return dict(wacc=r,g=g,roic=roic,terminalFCF=f4,terminalValue=tv,explicitPV=explicit,terminalPV=pvt,ev=ev,equityValue=ev+d['cash']-d['debt'],perShare=(ev+d['cash']-d['debt'])/d['shares'],terminalWeight=pvt/ev)
 base=val(.1,.03);sens=[val(r,g) for r in [.08,.1,.12] for g in [.01,.03,.05]]
 cases['dcf']=dict(attribution='AI原创假设，非任何真实公司财报或原作者案例',inputs=d,forecast=rows,base=base,sensitivity=sens,lowROIC=val(.1,.03,.05),issue=dict(newShares=2,issuePrice=10,repayDebt=20,perShare=base['ev']/12))
 tables['DCF_FORECAST']='\n\n'.join(f"第{x['year']}年利润桥：收入{fmt(x['revenue'])}，EBIT{fmt(x['ebit'])}，利息{fmt(x['interest'])}，所得税{fmt(x['tax'])}，净利{fmt(x['netIncome'])}；无杠杆NOPAT{fmt(x['nopat'])}。" for x in rows)
 tables['DCF_CASH']='\n\n'.join(f"第{x['year']}年现金桥：折旧{fmt(x['depreciation'])}，营运资本增量{fmt(x['deltaNWC'])}，CFO{fmt(x['cfo'])}；维护开支5、扩张开支{fmt(x['expansionCapex'])}，总capex{fmt(x['capex'])}；FCFF{fmt(x['fcff'])}，FCFE{fmt(x['fcfe'])}，分红6，期末现金{fmt(x['cash'])}。" for x in rows)
 tables['DCF_BALANCE']='\n\n'.join(f"第{x['year']}年末资产表：现金{fmt(x['cash'])}+应收{fmt(x['ar'])}+库存{fmt(x['inventory'])}+固定资产净额{fmt(x['ppe'])}=资产{fmt(x['assets'])}；债务40+应付{fmt(x['payables'])}+权益{fmt(x['equity'])}=负债与权益{fmt(x['liabilitiesAndEquity'])}。" for x in rows)
 tables['DCF_VALUE']=f"基准推导：第4年NOPAT{fmt(rows[-1]['nopat']*1.03)}，再投资率3%/15%=20%，第4年FCFF{fmt(base['terminalFCF'])}；第3年末终值{fmt(base['terminalValue'])}。前三年现金现值{fmt(base['explicitPV'])}+终值现值{fmt(base['terminalPV'])}=经营价值{fmt(base['ev'])}。加期初非经营现金20、扣债40，权益价值{fmt(base['equityValue'])}，除1000万股=每股{fmt(base['perShare'])}元；终值占经营价值约{base['terminalWeight']*100:.2f}%。"
 tables['DCF_SENSITIVITY']='\n\n'.join(f"敏感性：r={x['wacc']*100:.0f}%、g={x['g']*100:.0f}%，同样按g/15%留再投资，每股{fmt(x['perShare'])}元。" for x in sens)
 tables['DCF_ALTERNATIVES']=f"若永久新增资本回报仅5%，g仍3%，需留60%NOPAT，基准其他不变则每股仅{fmt(cases['dcf']['lowROIC']['perShare'])}元。若今天发行200万股、每股10元筹2000万元并全数还债，在经营价值和WACC暂不变的独立假设下，现金仍20、债由40到20、总股数12，权益/股={fmt(base['ev']/12)}元；不能只说还债使原股价值必升。"
 # Time-ordered reproducible cash backtest, one share maximum, costs fixed currency .5 per side.
 close=[100,102,101,104,103,105,100,101,104];opens=[100,101,102,103,104,104,101,102,103,104]
 cash=1000;position=0;history=[];trades=[];entry=None
 for day in range(10):
  desired=0 if day==9 else int(day>=2 and close[day-1]>(close[day-2]+close[day-1])/2)
  action='空仓' if not position else '持有'
  if desired>position:cash-=opens[day]+.5;entry=(day,opens[day]);action='买1股'
  if desired<position:
   cash+=opens[day]-.5;trades.append(dict(entryDay=entry[0],exitDay=day,buy=entry[1],sell=opens[day],gross=opens[day]-entry[1],cost=1,net=opens[day]-entry[1]-1));action='卖1股'
  position=desired;mark=close[day] if day<9 else opens[day];history.append(dict(day=day,open=opens[day],close=close[day] if day<9 else None,action=action,cash=cash,position=position,equity=cash+position*mark))
 cases['backtest']=dict(inputs=dict(close=close,opens=opens,initialCash=1000,shares=1,feePerSide=.5,trainingEndsCloseDay=5,signal='SMA2严格大于，次日开盘执行；第9日强制清算'),history=history,trades=trades,finalCash=cash)
 tables['BACKTEST_ROWS']='\n\n'.join(f"日{x['day']}：开{x['open']}，收{x['close'] if x['close'] is not None else '预定开盘终止'}；{x['action']}，现金{fmt(x['cash'])}，持股{x['position']}，标记净值{fmt(x['equity'])}。" for x in history)
 tables['BACKTEST_TRADES']='\n\n'.join(f"往返{x['entryDay']}→{x['exitDay']}：{x['buy']}买/{x['sell']}卖，毛{x['gross']}，双边费1，净{x['net']}。" for x in trades)
 # Fixed-brick Renko. Reversal starts one brick away from the previous endpoint.
 rclose=[107,112,108,105,100,96,95,105];b=5;endpoint=100;start=100;direction=0;rr=[]
 for p in rclose:
  bricks=[]
  if direction==0:
   direction=1 if p>=endpoint+b else -1 if p<=endpoint-b else 0
  elif direction==1 and p<=start-b:endpoint=start;direction=-1
  elif direction==-1 and p>=start+b:endpoint=start;direction=1
  while direction and (p-endpoint)*direction>=b:
   a=endpoint;endpoint+=direction*b;start=a;bricks.append([a,endpoint])
  rr.append(dict(close=p,bricks=bricks,endpoint=endpoint))
 cases['renko']=dict(base=100,brick=5,close=rclose,rows=rr,initialization='AI明确启动约定；反向需越过前砖另一端一砖，不把1砖回撤画成反砖')
 tables['RENKO_ROWS']='\n\n'.join(f"收{x['close']}："+('；'.join(f"{'白' if v>u else '黑'}砖{u}→{v}" for u,v in x['bricks']) if x['bricks'] else '不加砖')+f"；最后砖端{x['endpoint']}。" for x in rr)
 # Fixed-reversal Kagi; equality reverses direction, but only strict crossing changes weight.
 kc=[103,106,104,102,99,101,103,106,107,105,103,99,98];end=100;di=0;column=0;style='细';shoulder=None;waist=None;kr=[]
 for p in kc:
  event='不画';old=end
  if di==0:di=1 if p>100 else -1 if p<100 else 0;end=p;event='启动'
  elif (p-end)*di>0:
   if di==1 and shoulder is not None and p>shoulder and style=='细':style='粗';event=f'越肩{shoulder}，穿越处细转粗'
   elif di==-1 and waist is not None and p<waist and style=='粗':style='细';event=f'破腰{waist}，穿越处粗转细'
   else:event='顺向延伸'
   end=p
  elif (end-p)*di>=4:
   if di==1:shoulder=end
   else:waist=end
   di=-di;column+=1;end=p;event='右移反向'
   if di==1 and shoulder is not None and p>shoulder and style=='细':style='粗';event+=f'；越肩{shoulder}细转粗'
   elif di==-1 and waist is not None and p<waist and style=='粗':style='细';event+=f'；破腰{waist}粗转细'
  kr.append(dict(close=p,column=column,end=end,direction=di,style=style,shoulder=shoulder,waist=waist,event=event))
 cases['kagi']=dict(base=100,reversal=4,close=kc,initialStyle='细（AI启动约定，非原书唯一初始化）',rows=kr)
 tables['KAGI_ROWS']='\n\n'.join(f"收{x['close']}：{x['event']}；列{x['column']}、线端{x['end']}、{'向上' if x['direction']==1 else '向下'}、{x['style']}线；已确认肩{x['shoulder'] if x['shoulder'] is not None else '无'}、腰{x['waist'] if x['waist'] is not None else '无'}。" for x in kr)
 # Full accounting for both sexes in 11 age groups, two five-year steps. Not an empirical demographic forecast.
 ages=['0–4','5–9','10–14','15–19','20–24','25–29','30–34','35–39','40–44','45–49','50+'];female=[500,550,600,1000,900,800,700,600,500,400,1000];male=female[:];fert=[0,0,0,.02,.08,.12,.10,.04,.02,0,0];surv=[.99,.995,.995,.99,.99,.99,.985,.98,.97,.96,.9];mig=[0,0,0,0,0,20,0,0,0,0,-5]
 periods=[];f=female[:];m=male[:]
 for step in range(2):
  births=5*sum(x*a for x,a in zip(f,fert));nf=[births*.5*.99]+[f[i-1]*surv[i-1]+mig[i] for i in range(1,10)]+[f[9]*surv[9]+f[10]*surv[10]+mig[10]];nm=[births*.5*.99]+[m[i-1]*surv[i-1]+mig[i] for i in range(1,10)]+[m[9]*surv[9]+m[10]*surv[10]+mig[10]]
  deaths=sum(f)+sum(m)+births+2*sum(mig)-sum(nf)-sum(nm);periods.append(dict(yearStart=5*step,yearEnd=5*(step+1),births=births,female=nf,male=nm,deaths=deaths,netMigration=2*sum(mig),total=sum(nf)+sum(nm)));f,m=nf,nm
 cases['population']=dict(ages=ages,initialFemale=female,initialMale=male,asfr=fert,survival=surv,netMigrationPerSex=mig,birthSurvival=.99,femaleShare=.5,stepYears=5,tfr=5*sum(fert),initialAnnualBirths=sum(x*a for x,a in zip(female,fert)),periods=periods)
 tables['ASFR_ROWS']='\n\n'.join(f"{ages[i]}岁：女性{female[i]}人，年出生{fmt(female[i]*fert[i])}人，ASFR={fmt(fert[i])}个孩子/女性年={fmt(fert[i]*1000)}‰。" for i in range(3,10))
 tables['COHORT_ROWS']='\n\n'.join(f"年龄{a}：期初女/男各{fmt(female[i])}；5年末各{fmt(periods[0]['female'][i])}；10年末各{fmt(periods[1]['female'][i])}。" for i,a in enumerate(ages))
 tables['COHORT_TOTALS']='\n\n'.join(f"{p['yearStart']}–{p['yearEnd']}年期间账：出生{fmt(p['births'])}，死亡{fmt(p['deaths'])}，净迁移{p['netMigration']}；期末总人口{fmt(p['total'])}。" for p in periods)
 # Physical inventory identity: one product, no purchases, wastage or revaluation.
 inv=[];stock=100;previous=None
 for period,delta in enumerate([-10,-20,-10,0,10],1):
  opening=stock;stock+=delta;acceleration=None if previous is None else delta-previous;inv.append(dict(period=period,opening=opening,sales=100,change=delta,stock=stock,production=100+delta,changeOfChange=acceleration));previous=delta
 cases['inventory']=dict(initialStock=100,units='同一种产品的件数；全为原创假设',rows=inv)
 tables['INVENTORY_ROWS']='\n\n'.join(f"期{x['period']}：期初库存{x['opening']}，销售{x['sales']}，库存增加额{x['change']}，期末库存{x['stock']}，生产{x['production']}；库存增加额较上期变化{x['changeOfChange'] if x['changeOfChange'] is not None else '无可比期'}。" for x in inv)
 dossier=json.loads((pathlib.Path(__file__).parent/'p171-dossier.json').read_text())
 tables['P171_MODULES']='\n\n'.join('## p171-'+x['id']+' | '+x['title']+' | V101转述框架，AI原创独立情景\n'+ '\n\n'.join([x['mechanism'],'证据（全为教学假设）：'+x['evidence'],'冲突：'+x['conflict'],'反证：'+x['counterevidence'],'判断及边界：'+x['judgment'],'问题：'+x['exercise'],'解析：'+x['answer']]) for x in dossier)
 return cases,tables
