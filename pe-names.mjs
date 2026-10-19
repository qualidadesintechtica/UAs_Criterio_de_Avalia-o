import {norm,text} from './core.mjs?v=v6-2-categoria-pe-20261019';

const missingNames=new Set(['uc nao localizada','uc nao informado','uc nao informada','nome da uc nao localizado','nao informado','nao informada','nao localizado','nao localizada','sem titulo','null','undefined','n/a','-']);
const clean=value=>text(value).replace(/\s+/g,' ');
function courseCode(value){return clean(value).split('|')[0].replace(/_(?:UA\d+|A[13]|PP)$/i,'');}
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

// Somente rótulos: as chaves dos materiais, das fontes e dos comentários não mudam.
export function resolveEntryPlanNames(sections,materials){
  if(!sections.PE)return sections;
  const catalog=courseNames(materials);
  const rename=record=>{
    const sourceName=text(record.sourceName||record.ua);
    const codes=[record.ucId,record.uaId,sourceName].filter(Boolean);
    let title=isName(record.uc,codes)?clean(record.uc):'';
    if(!title){
      for(const code of codes){
        const candidates=catalog.get(norm(courseCode(code)));
        if(candidates?.size===1){title=[...candidates.values()][0];break;}
        // Dois nomes distintos para o mesmo código exigem correção na fonte.
        if(candidates?.size>1)break;
      }
    }
    const sourceIsID=record.ucId&&norm(courseCode(sourceName))===norm(courseCode(record.ucId));
    if(!title&&!sourceIsID&&isName(sourceName,codes.filter(code=>code!==sourceName)))title=clean(sourceName);
    const label=title||'Nome da UC não localizado';
    return {...record,uc:label,ua:label,displayUA:label,sourceName,courseNameResolved:Boolean(title),
      history:(record.history||[]).map(rename)};
  };
  return {...sections,PE:{...sections.PE,records:sections.PE.records.map(rename)}};
}
