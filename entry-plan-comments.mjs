// Reúne textos sem transformar envios anteriores em novas respostas de critérios.
// IDs diferentes continuam distintos, mesmo com texto e autor iguais.
const clean=value=>String(value??'').trim();
function sourceKey(record){
  if(record.portalAddition)return 'portal:'+record.portal.id;
  if(record.raw?.subitem_id!=null)return 'criterio:'+record.raw.subitem_id;
  if(record.id&&!String(record.id).includes(':'))return 'criterio:'+record.id;
  return clean(record.id)||[record.sourceEvent,record.criterionKey,record.criterion].join(':');
}
export function collectEntryPlanComments(records=[]){
  const found=new Map();
  function visit(record,historical=false,rootIndex=0){
    if(record.kind!=='PE')return;
    const key=sourceKey(record);
    const sourceAuthor=(record.sourceEvent?record.reviewers:record.specialists)||[];
    const author=sourceAuthor.join('; ')||(record.reviewers||[]).join('; ')||'Responsável não informado';
    const add=(identity,body,fields={})=>{
      const text=clean(body);if(!text||found.has(identity))return;
      found.set(identity,{id:identity,recordId:record.id,rootIndex,criterion:record.criterion,
        text,author,date:record.date||'',source:record.sourceLabel||'Critérios da esteira — Monday',historical,...fields});
    };
    if(record.portal){
      add('portal:'+record.portal.id,record.comment,{author:record.portal.updated_name||'Responsável não informado',date:record.portal.updated_at,
        source:'Comentário do painel',portalId:record.portal.id});
      if(!record.portalAddition)add('monday:'+key,record.mondayComment,{source:'Texto original — Monday',original:true});
    }else add('monday:'+key,record.comment);
    for(const previous of record.history||[])visit(previous,true,rootIndex);
  }
  records.forEach((record,index)=>visit(record,false,index));
  return [...found.values()].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)||a.id.localeCompare(b.id));
}
