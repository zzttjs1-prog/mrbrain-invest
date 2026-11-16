// Use the generated evidence depth, never absence of a navigation link, as coverage.
export function principleCoverage(principles){
 return {independent:principles.filter(p=>p.depth==='independent-explanation').length,linkedOnly:principles.filter(p=>p.depth==='linked-not-independent').length,indexOnly:principles.filter(p=>p.depth==='index-only').length,courseLinks:principles.filter(p=>p.lessons.length).length};
}
