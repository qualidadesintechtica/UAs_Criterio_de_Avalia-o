import {norm,text,groupUAs,filterRecords,materialKind,materialGroupKey,unitLabel,names} from './core.mjs';

export const WORKFLOW_LABELS={all:'Todos os materiais',released:'Liberada',validating:'Em validação',design:'Requer análise do design',validated:'Validadas',other:'Outros status / sem status'};

export function workflowStatus(value){
  const s=norm(value).replace(/\s+/g,' ');
  if(/^validad[oa]s?(?:\s*-.*)?$/.test(s))return 'validated';
  if(/(?:requer|aguardando|em)\s+(?:a\s+)?analise.*(?:design|\bda\b)|(?:ajustes?|revisao).*?(?:design|\bda\b)/.test(s))return 'design';
  if(/^(?:em|iniciad[ao]|iniciando).*validacao|^validacao\s+(?:em andamento|iniciada)/.test(s))return 'validating';
  if(/^liberad[oa]s?(?:\s|$)/.test(s))return 'released';
  return 'other';
}
export function materialWorkflow(group){
  const statuses=(group.materialStatuses||[]).map(workflowStatus);
  // Em caso de registros simultâneos da mesma identidade, conserva a etapa que pede ação.
  return ['design','validating','released','validated'].find(s=>statuses.includes(s))||'other';
}
export function countWorkflow(records){
  const counts={all:0,released:0,validating:0,design:0,validated:0,other:0};
  for(const g of groupUAs(records)){counts.all++;counts[materialWorkflow(g)]++;}
  return counts;
}
export function selectWorkflow(records,status='all'){
  if(status==='all')return records;
  const keys=new Set(groupUAs(records).filter(g=>materialWorkflow(g)===status).map(g=>g.uaKey));
  return records.filter(r=>keys.has(r.uaKey));
}
export function materialTableRows(groups){
  return groups.flatMap((group,detailIndex)=>(group.presentationItems||[{name:group.ua,unit:group.unitLabel,id:group.uaId}]).map(item=>({group,detailIndex,name:item.name,unit:item.unit,unitId:item.id})));
}
export function filterOptions(sections,field,filters={}){
  const all=Object.values(sections).flatMap(s=>s.records);
  // Esteiras são sempre o catálogo conjunto das quatro abas.
  const rows=field==='track'?all:filterRecords(all,filters,'','all',field);
  const byNormalized=new Map();let missing=false;
  for(const row of rows){
    const values=(field==='ua'?[row.displayUA||row.ua]:Array.isArray(row[field])?row[field]:[row[field]]).filter(v=>text(v)&&!['nao informada','nao informado'].includes(norm(v)));
    if(!values.length)missing=true;
    for(const v of values)if(!byNormalized.has(norm(v)))byNormalized.set(norm(v),text(v));
  }
  const current=filters[field];
  if(current&&current!=='__missing__')byNormalized.set(norm(current),current);
  return {values:[...byNormalized.values()].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true})),missing:missing||current==='__missing__'};
}

// Inclui materiais reais da esteira que ainda não receberam critérios ou formulários.
// A ausência de avaliação não é convertida em status nem em reprovação.
export function includeMaterialInventory(sections,materials){
  const seen=new Map(Object.entries(sections).map(([kind,s])=>[kind,{
    keys:new Set(s.records.map(r=>r.uaKey)),sources:new Set(s.records.map(r=>r.materialKey).filter(Boolean))
  }]));
  for(const m of materials){
    const kind=materialKind(m);if(!kind||!sections[kind])continue;
    const ucId=text(m.id_titulo),uaId=text(m.id_ua),parent=text(m.monday_item_validacao),materialKey=text(m.chave_material);
    const matrix=text(m.matriz_oferta),track=text(m.esteira_producao)||'Não informada',semester=text(m.semestre_oferta),batch=text(m.bloco||m.lote);
    const uaKey=materialGroupKey(kind,ucId||parent||uaId,uaId||parent||materialKey,matrix,track,semester,batch);
    if(seen.get(kind).keys.has(uaKey)||(materialKey&&seen.get(kind).sources.has(materialKey)))continue;
    const record={kind,id:'material:'+materialKey,materialKey,uaKey,uc:text(m.titulo)||ucId||'UC não localizada',ucId,
      ua:text(m.titulo_ua)||uaId||text(m.item_name)||'Material sem título',uaId,parent,track,matrix,semester,batch,unitLabel:unitLabel(m),
      specialists:[],reviewers:names(m.revisor_validador),criterion:'Registro do material',question:'',classification:'Avaliação individual não disponível',
      comment:'',commentOnly:true,metadataOnly:true,inventoryOnly:true,status:'comment',date:'',materialStatus:text(m.status_validacao),
      sourceLabel:'Esteira de materiais — Monday',history:[]};
    sections[kind].records.push(record);seen.get(kind).keys.add(uaKey);if(materialKey)seen.get(kind).sources.add(materialKey);
  }
  return sections;
}
