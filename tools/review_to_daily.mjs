// 用法: node tools/review_to_daily.mjs <脑总复盘 page.tsx> [outDir=public/data]
// 从「脑总复盘」bot 的每日 Page 源码提取 → daily.json + news.json（只做教育；去掉档位/时机字段）
import fs from 'fs';
const [src, out = 'public/data'] = process.argv.slice(2);
const s = fs.readFileSync(src, 'utf8');
const arr = n => { const b = s.match(new RegExp(`^const ${n}[^=]*= \\[\\n([\\s\\S]*?)\\n\\];`, 'm')); if (b) return JSON.parse('[' + b[1].replace(/,\s*$/, '') + ']'); const m = s.match(new RegExp(`^const ${n}[^=]*= (\\[.*\\]);\\s*$`, 'm')); return m ? JSON.parse(m[1]) : [] };
const attr = re => (s.match(re) || [])[1] || '';
const strip = t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ITEMS = arr('ITEMS'), MKT = arr('MKT'), NEWS = arr('NEWS'), SENTI = arr('SENTI');
const summary = attr(/summary="([^"]+)"/);
const day = (summary.match(/美东 (\d{4}-\d{2}-\d{2})/) || [])[1] || '';
const sources = (() => { const m = s.match(/sources=\{(\[[^\]]*\])\}/); try { return JSON.parse(m[1]) } catch { return [] } })();
const headline = strip(attr(/lead="一句话结论[^"]*"[^>]*>([\s\S]*?)<\/Callout>/));
const flow = strip(attr(/资金流向与财报提醒">\s*<Text>([\s\S]*?)<\/Text>/)).split(/(?<=。)/)[0];
const mood = strip(attr(/heading="3 市场情绪" caption="([^"]+)"/));
const keep = ['sym','name','grp','close','chg','val','fund','pe','view','stage','ma','rel','vol','nh','earn'];
const items = ITEMS.filter(i => ['核心','重点'].includes(i.grp)).map(i => Object.fromEntries(keep.map(k => [k, i[k]])));
const daily = { day, updated: new Date().toISOString(), summary, headline: headline.split(/(?<=。|；)/).filter(x => !/档位|仓位|追/.test(x)).join(''), mood, market: MKT.map(r => ({ k: r[0], v: r[1], c: r[2], src: r[3] })), senti: SENTI.map(r => ({ k: r[0], v: r[1], note: r[2], src: r[3] })), items, flow, sources, by: '脑总复盘 bot（AI 整理，不是脑总本人）' };
const news = { day, items: NEWS.map(n => ({ date: day, title: n.t, rel: n.rel, links: n.links.map(([site, href]) => ({ site, href })) })) };
fs.writeFileSync(`${out}/daily.json`, JSON.stringify(daily)); fs.writeFileSync(`${out}/news.json`, JSON.stringify(news));
console.log('daily', day, items.length, 'items; news', news.items.length, '; flow:', flow.slice(0, 80));
