import {QUIZ_REVISIONS} from './quiz-revisions.js';
// Only semantic corrections invalidate old quiz selections; completion and XP never change here.
export const quizRevision = id => QUIZ_REVISIONS[id];
export const outdatedWrong = w => !!(quizRevision(w.lesson) && w.revision !== quizRevision(w.lesson));
const snapshot = d => ({revision:d.revision||'legacy',slide:d.slide||0,answers:{...d.answers}});
export function reconcileQuiz(state,id) {
 const revision=quizRevision(id),d=state.drafts[id];
 if(!d)return state.drafts[id]={slide:0,answers:{},...(revision?{revision}: {})};
 if(revision&&d.revision!==revision){
  d.history=[...(d.history||[]),snapshot(d)];d.answers={};d.slide=0;d.revision=revision;
 }
 return d;
}
export function mergeDraft(local,incoming,id) {
 if(!local)return incoming;if(!incoming)return local;
 const revision=quizRevision(id);
 const useIncoming=revision&&incoming.revision===revision&&local.revision!==revision;
 const chosen=useIncoming?incoming:local,other=useIncoming?local:incoming;
 const history=[...(chosen.history||[]),...(other.history||[])];
 if(revision&&chosen.revision!==other.revision)history.push(snapshot(other));
 return history.length?{...chosen,history:[...new Map(history.map(h=>[JSON.stringify(h),h])).values()]}:chosen;
}
