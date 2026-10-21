import {norm,text,materialKind} from './core.mjs?v=v6-6-5-conferencia-contagens-20261021';

const missingNames=new Set(['uc nao localizada','uc nao informado','uc nao informada','nome da uc nao localizado','nao informado','nao informada','nao localizado','nao localizada','sem titulo','null','undefined','n/a','-']);
const clean=value=>text(value).replace(/\s+/g,' ');
function courseCode(value){return clean(value).split('|')[0].replace(/_(?:UA\d+|A[123]|PP)$/i,'');}
function isName(value,codes=[]){
  const name=clean(value),key=norm(name);
  return Boolean(name)&&!missingNames.has(key)&&!/^\d+$/.test(name)
    &&!codes.some(code=>code&&norm(courseCode(name))===norm(courseCode(code)))
    &&!/^[a-z0-9]+(?:_[a-z0-9]+){2,}$/i.test(name);
}
function materialCodes(row){
  // Os três identificadores vêm da mesma linha da base, sem procurar códigos parecidos.
  return [...new Set([row.id_titulo,row.id_ua,row.chave_material].map(courseCode).filter(Boolean))];
}
function courseNames(materials){
  const names=new Map();
  for(const row of materials){
    const codes=materialCodes(row);if(!codes.length)continue;
    const value=[row.titulo_uc,row.nome_uc,row.titulo].find(value=>isName(value,codes));
    if(!value)continue;
    const name=clean(value),folded=norm(name);
    for(const code of codes){
      const key=norm(code);if(!names.has(key))names.set(key,new Map());
      if(!names.get(key).has(folded))names.get(key).set(folded,name);
    }
  }
  return names;
}

function exactPlanNames(materials,field){
  const catalog=new Map();
  for(const row of materials){
    if(materialKind(row)!=='PE')continue;
    const key=norm(row[field]);if(!key)continue;
    const value=[row.titulo_uc,row.nome_uc,row.titulo].find(v=>isName(v,materialCodes(row)));
    if(!value)continue;
    if(!catalog.has(key))catalog.set(key,new Map());
    catalog.get(key).set(norm(clean(value)),clean(value));
  }
  return catalog;
}

// Somente rótulos: as chaves dos materiais, das fontes e dos comentários não mudam.
export function resolveEntryPlanNames(sections,materials){
  if(!sections.PE)return sections;
  const catalog=courseNames(materials);
  const byID=exactPlanNames(materials,'monday_item_validacao'),byKey=exactPlanNames(materials,'chave_material');
  const rename=record=>{
    const sourceName=text(record.sourceName||record.ua);
    const codes=[record.ucId,record.uaId,sourceName].filter(Boolean);
    let title=isName(record.uc,codes)?clean(record.uc):'',issue='missing';
    if(!title){
      const direct=[byID.get(norm(record.validationItemId||record.parent)),byKey.get(norm(record.materialKey))];
      for(const candidates of direct){
        if(candidates?.size===1){title=[...candidates.values()][0];break;}
        if(candidates?.size>1){issue='ambiguous';break;}
      }
    }
    if(!title&&issue!=='ambiguous'){
      for(const code of codes){
        const candidates=catalog.get(norm(courseCode(code)));
        if(candidates?.size===1){title=[...candidates.values()][0];break;}
        // Dois nomes distintos para o mesmo código exigem correção na fonte.
        if(candidates?.size>1){issue='ambiguous';break;}
      }
    }
    const sourceIsID=record.ucId&&norm(courseCode(sourceName))===norm(courseCode(record.ucId));
    if(!title&&issue!=='ambiguous'&&!sourceIsID&&isName(sourceName,codes.filter(code=>code!==sourceName)))title=clean(sourceName);
    const label=title||'Nome da UC não localizado';
    return {...record,uc:label,ua:label,displayUA:label,sourceName,courseNameResolved:Boolean(title),courseNameIssue:title?null:issue,
      history:(record.history||[]).map(rename)};
  };
  return {...sections,PE:{...sections.PE,records:sections.PE.records.map(rename)}};
}

export function entryPlanNameIssues(records=[]){
  const issues=new Map();
  for(const r of records){
    if(r.courseNameResolved!==false||issues.has(r.uaKey))continue;
    const unlinked=r.workflowEligible===false;
    issues.set(r.uaKey,{key:r.uaKey,unlinked,reference:text(r.sourceName||r.ucId||r.uaId)||'Referência não informada',
      courseId:text(r.ucId),materialId:text(r.uaId),validationId:text(r.validationItemId||r.parent),formId:text(r.sourceEvent),
      reason:r.courseNameIssue==='ambiguous'?'Há nomes diferentes para o mesmo vínculo na base.':unlinked?'Formulário sem vínculo inequívoco com uma planilha da validação.':'Nome da UC ausente nas fontes sincronizadas para este vínculo.'});
  }
  return [...issues.values()];
}
