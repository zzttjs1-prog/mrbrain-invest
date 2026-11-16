// Keep the original key: installed copies already have progress here.
export const KEY = 'mb-progress-v2';
export const BACKUP = KEY + '-backup';
export const SCHEMA = 3;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const number = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
export function normalize(raw) {
  if (!object(raw) || !object(raw.lessons) || !Array.isArray(raw.days) || !number(raw.xp)) throw Error('进度格式不正确');
  const lessons = {};
  for (const [id, value] of Object.entries(raw.lessons)) {
    if (!/^u\d+l\d+$/.test(id) || !object(value)) throw Error('课程记录不正确');
    lessons[id] = {...value, done:!!value.done, stars:number(value.stars)?Math.min(3,value.stars):0, best:number(value.best)?value.best:0};
  }
  const drafts = {};
  for (const [id,d] of Object.entries(object(raw.drafts)?raw.drafts:{})) {
    if (/^u\d+l\d+$/.test(id) && object(d)) drafts[id]={slide:number(d.slide)?d.slide:0, answers:object(d.answers)?d.answers:{}};
  }
  return {...raw, schema:SCHEMA, theme:raw.theme==='light'?'light':'dark', xp:raw.xp,
    days:[...new Set(raw.days.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort(), lessons,drafts,
    wrong:object(raw.wrong)?raw.wrong:{}, notes:object(raw.notes)?raw.notes:{}, current:typeof raw.current==='string'&&/^u\d+l\d+$/.test(raw.current)?raw.current:null};
}
export const empty = () => normalize({xp:0,days:[],lessons:{}});
export function loadProgress(storage) {
  const errors=[];
  for (const key of [KEY,BACKUP]) {
    try { const text=storage.getItem(key); if(text) return {state:normalize(JSON.parse(text)), warning:errors.length?'主记录损坏，已恢复上一份备份。请立即导出同步码。':''}; }
    catch {errors.push(key);}
  }
  return {state:empty(),warning:errors.length?'无法读取已有进度。原记录未覆盖；请先尝试导入备份或检查浏览器存储权限。':''};
}
export function persist(storage,state) {
  try {
    const next=JSON.stringify(normalize(state)), old=storage.getItem(KEY);
    if(old) { try {normalize(JSON.parse(old));storage.setItem(BACKUP,old);} catch {storage.setItem(KEY+'-unreadable',old);} }
    storage.setItem(KEY,next);return '';
  } catch {return '本次进度未能保存：浏览器存储不可用或已满。请保持页面打开并导出同步码备份。';}
}
export function mergeProgress(state, incoming) {
  const other=normalize(incoming);
  const out=normalize(state);
  out.xp=Math.max(out.xp,other.xp);out.days=[...new Set([...out.days,...other.days])].sort();
  for(const [id,v] of Object.entries(other.lessons)){const c=out.lessons[id]||{};out.lessons[id]={...c,done:!!(c.done||v.done),stars:Math.max(c.stars||0,v.stars),best:Math.max(c.best||0,v.best)};}
  // Existing local drafts win; legacy codes cannot erase newer personal data.
  for(const key of ['drafts','wrong','notes'])out[key]={...other[key],...out[key]};
  out.current=out.current||other.current;return out;
}
export function encode(state) {const data=normalize(state);return btoa(unescape(encodeURIComponent(JSON.stringify({schema:SCHEMA,xp:data.xp,days:data.days,lessons:data.lessons,drafts:data.drafts,wrong:data.wrong,notes:data.notes,current:data.current}))));}
export function decode(code) {if(typeof code!=='string'||code.length>4000000)throw Error('同步码过长');return normalize(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));}
