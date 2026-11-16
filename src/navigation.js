// Explicit routes keep curriculum jumps inside the hash router, including saved legacy links.
export function courseUnit(hash) {
 const match=String(hash).match(/^#(?:\/path\/|u-)(U(?:[1-9]|1[0-3]))$/);
 return match?.[1]||null;
}
export function scrollCourseUnit(unit,doc) {
 if(!courseUnit('#/path/'+unit))return;
 doc.getElementById('u-'+unit)?.scrollIntoView({block:'start'});
}
