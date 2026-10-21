import {groupUAs,csvCell} from './core.mjs?v=v6-6-9-filtros-pessoas-20261021';
import {countWorkflow,materialWorkflow,WORKFLOW_LABELS} from './workflow.mjs?v=v6-6-9-filtros-pessoas-20261021';

// A conferência usa a mesma identidade e a mesma regra dos cartões.
// Na PE, uaKey contém o ID exato do item do quadro de validação.
export function materialCounts(records=[]){
  const groups=groupUAs(records),materials=groups.filter(g=>g.criteria.some(r=>r.workflowEligible!==false));
  const unlinked=groups.filter(g=>!g.criteria.some(r=>r.workflowEligible!==false)).length;
  const counts=countWorkflow(records),rows=new Map();
  for(const group of materials){
    const status=group.materialStatuses.join(' / ')||'Sem status',bucket=materialWorkflow(group);
    const key=JSON.stringify([status,bucket]);
    if(!rows.has(key))rows.set(key,{status,bucket,label:WORKFLOW_LABELS[bucket],count:0});
    rows.get(key).count++;
  }
  const cards=counts.released+counts.validating+counts.design+counts.validated;
  return{...counts,cards,unlinked,materials,rows:[...rows.values()].sort((a,b)=>a.status.localeCompare(b.status,'pt-BR',{numeric:true})),
    consistent:cards+counts.other===counts.all&&[...rows.values()].reduce((sum,r)=>sum+r.count,0)===counts.all};
}

export function materialAuditCSV(records=[]){
  const {materials}=materialCounts(records);
  const headings=['ID(s) do item Monday','Categoria','UC','Código da UC','UA / material','Código do material','Esteira','Lote','Status original Monday','Grupo no painel'];
  const rows=materials.map(g=>{
    const ids=g.validationItemId?[g.validationItemId]:[...new Set(g.criteria.map(r=>r.parent).filter(Boolean))];
    return[ids.join('; '),g.kind,g.uc,g.ucId,g.ua,g.uaId,g.track,g.batch,g.materialStatuses.join(' / ')||'Sem status',WORKFLOW_LABELS[materialWorkflow(g)]];
  });
  return '\ufeff'+[headings,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
