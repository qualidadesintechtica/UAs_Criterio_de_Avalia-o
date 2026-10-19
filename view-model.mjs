import {norm,groupUAs,escapeHTML} from './core.mjs?v=v6-2-categoria-pe-20261019';

export function uaOutcome(group) {
  if (group.summary.bad>0||group.requiresAdjustment) return 'bad';
  if (group.summary.assessed>0||group.materialStatuses?.some(s=>norm(s)==='validado')) return 'good';
  return 'pending';
}

export function countUAOutcomes(records) {
  const groups=groupUAs(records);
  const counts={all:groups.length,good:0,bad:0,pending:0};
  for(const group of groups) counts[uaOutcome(group)]++;
  return counts;
}

// A escolha de resultado seleciona a UA inteira, preservando seus outros critérios.
export function selectUAOutcome(records,status='all') {
  if(status==='all')return records;
  const keys=new Set(groupUAs(records).filter(g=>uaOutcome(g)===status).map(g=>g.uaKey));
  return records.filter(r=>keys.has(r.uaKey));
}

export function highlightHTML(value,query='') {
  const input=String(value??'');
  const q=norm(query);
  if(!q)return escapeHTML(input);
  let folded='',offset=0;
  const mapping=[];
  for(const character of input) {
    const normalized=character.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    for(let k=0;k<normalized.length;k++)mapping.push({start:offset,end:offset+character.length});
    if(!normalized&&mapping.length)mapping[mapping.length-1].end=offset+character.length;
    folded+=normalized;offset+=character.length;
  }
  let cursor=0,position=0,result='';
  while((position=folded.indexOf(q,position))!==-1) {
    const start=mapping[position].start,end=mapping[position+q.length-1].end;
    if(start>=cursor)result+=escapeHTML(input.slice(cursor,start))+'<mark>'+escapeHTML(input.slice(start,end))+'</mark>';
    cursor=Math.max(cursor,end);position+=q.length;
  }
  return result+escapeHTML(input.slice(cursor));
}
