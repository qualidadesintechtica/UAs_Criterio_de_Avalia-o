import {filterRecords,groupUAs} from './core.mjs?v=v6-6-12-carga-criterios-20261022';
import {selectWorkflow} from './workflow.mjs?v=v6-6-12-carga-criterios-20261022';

// Mesma sequência para tabela, contagens das quatro abas e exportação.
// A busca preserva os demais registros do material encontrado.
export function filteredScope(records=[],selection={}){
  let rows=filterRecords(records,selection.filters||{});
  if(selection.query){
    const keys=new Set(filterRecords(rows,{},selection.query).map(r=>r.uaKey));
    rows=rows.filter(r=>keys.has(r.uaKey));
  }
  if(selection.commentsOnly){
    const keys=new Set(groupUAs(rows).filter(g=>g.comments.length).map(g=>g.uaKey));
    rows=rows.filter(r=>keys.has(r.uaKey));
  }
  return selectWorkflow(rows,selection.status||'all');
}
