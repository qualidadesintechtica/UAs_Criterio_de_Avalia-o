import {materialKind} from './core.mjs?v=v6-6-11-filtros-paginados-20261022';
import {personNames,personKey} from './people-filters.mjs?v=v6-6-11-filtros-paginados-20261022';
const text=value=>value==null?'':String(value).trim();
const norm=value=>personKey(value);
function decoded(value){if(typeof value!=='string')return value;try{return JSON.parse(value);}catch{return null;}}
function relationIDs(value){
  const data=decoded(value);
  return (Array.isArray(data?.linkedPulseIds)?data.linkedPulseIds:[]).map(x=>text(x.linkedPulseId)).filter(x=>/^\d+$/.test(x));
}
const compatible=(record,row)=>{
  const kind=materialKind(row);
  return kind===record.kind||(record.kind==='UC'&&kind==='UA'&&Boolean(record.unitSourceId));
};
function sameOffer(record,row){
  return [['track','esteira_producao'],['matrix','matriz_oferta'],['semester','semestre_oferta'],['batch','bloco']]
    .every(([a,b])=>!text(record[a])||norm(record[a])==='nao informada'||!text(row[b])||norm(record[a])===norm(row[b]));
}
function index(rows,keyFor){
  const result=new Map();for(const row of rows)for(const key of keyFor(row).filter(Boolean)){
    if(!result.has(key))result.set(key,[]);result.get(key).push(row);
  }return result;
}
export function applyMondayPeople(sections,rows=[],ready=true){
  const validation=rows.filter(row=>String(row.monday_board_id)==='9433297929');
  const production=rows.filter(row=>String(row.monday_board_id)==='9376982027');
  const byValidation=index(validation,row=>[text(row.monday_item_id)]);
  const byLink=index(production,row=>relationIDs(row.vinculos_validacao));
  const byCode=index(production,row=>[norm(row.id_ua)]);
  const byCourse=index(production,row=>[norm(row.id_titulo)]);
  const select=rows=>{
    const ids=new Set(rows.map(row=>row.monday_board_id+':'+row.monday_item_id));
    return {rows:ids.size===1?rows:[],ambiguous:ids.size>1};
  };
  const assign=record=>{
    const id=text(record.validationItemId||record.parent);
    const exact=select((byValidation.get(id)||[]).filter(row=>compatible(record,row)));
    const linked=select((byLink.get(id)||[]).filter(row=>compatible(record,row)));
    const code=norm(record.unitSourceId||record.uaId);
    const candidates=code?(byCode.get(code)||[]):[];
    const courseCandidates=record.kind==='PE'?(byCourse.get(norm(record.ucId))||[]):[];
    const business=select([...new Set([...candidates,...courseCandidates])].filter(row=>compatible(record,row)&&sameOffer(record,row)
      &&(!text(record.ucId)||!text(row.id_titulo)||norm(record.ucId)===norm(row.id_titulo))));
    const role=key=>{
      for(const candidate of [exact,linked,business]){
        if(candidate.ambiguous)return {names:[],ambiguous:true};
        const names=personNames(candidate.rows.filter(row=>row.papel===key).flatMap(row=>personNames(row.nomes).length?personNames(row.nomes):personNames(decoded(row.valor))));
        if(names.length)return {names,ambiguous:false};
      }
      return {names:[],ambiguous:false};
    };
    const specialist=role('especialista'),reviewer=role('revisor');
    return {...record,mondayPeopleReady:ready,mondaySpecialists:ready?specialist.names:[],mondayReviewers:ready?reviewer.names:[],
      mondayPeopleAmbiguous:ready&&(specialist.ambiguous||reviewer.ambiguous),
      history:(record.history||[]).map(assign)};
  };
  return Object.fromEntries(Object.entries(sections).map(([kind,section])=>[kind,{...section,records:section.records.map(assign)}]));
}
