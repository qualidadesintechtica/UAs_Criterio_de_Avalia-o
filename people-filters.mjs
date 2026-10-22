export const personKey=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g,'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const clean=value=>String(value??'').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').trim();
const absent=new Set(['nao informado','nao informada','nao localizado','nao localizada','null','undefined','n/a','-','']);
export function personNames(value){
  const found=new Map();
  function visit(value,depth=0){
    if(value==null||depth>8)return;
    if(Array.isArray(value)){for(const part of value)visit(part,depth+1);return;}
    if(typeof value==='object'){
      for(const key of ['name','nome','full_name','display_name','display_value','text'])if(value[key]){visit(value[key],depth+1);return;}
      for(const key of ['people','persons','personsAndTeams','users'])if(Array.isArray(value[key]))visit(value[key],depth+1);
      return;
    }
    if(typeof value!=='string')return;
    const raw=value.trim();
    if(/^[\[{\"]/.test(raw)){try{const decoded=JSON.parse(raw);if(decoded!==raw){visit(decoded,depth+1);return;}}catch{}}
    for(const part of raw.split(/[;,|\n\r]+/)){
      const name=clean(part),key=personKey(name);
      if(!absent.has(key)&&!/^\d+$/.test(key)&&!found.has(key))found.set(key,name);
    }
  }
  visit(value);return [...found.values()];
}
export function personValues(record,field){
  if(record.mondayPeopleReady===false)return [];
  if(record.mondayPeopleReady===true)return personNames(field==='reviewers'?record.mondayReviewers:record.mondaySpecialists);
  if(field==='reviewers'){
    return personNames([record.assignedReviewers,record.reviewers]);
  }
  return personNames([record.specialists,record.assignedSpecialists]);
}
function materialGroups(records){
  const groups=new Map();
  for(const record of records){const key=record.uaKey||record;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record);}
  return groups;
}
export function filterPeopleByMaterial(records,filters={},skip=''){
  const fields=['specialists','reviewers'].filter(field=>field!==skip&&filters[field]);
  if(!fields.length)return records;
  const kept=new Set();
  for(const [key,rows] of materialGroups(records)){
    if(fields.every(field=>{
      const values=personNames(rows.flatMap(row=>personValues(row,field)));
      return filters[field]==='__missing__'?!values.length:values.some(value=>personKey(value)===personKey(filters[field]));
    }))kept.add(key);
  }
  return records.filter(record=>kept.has(record.uaKey||record));
}
export function peopleOptions(records,field){
  const found=new Map();let missing=false;
  for(const rows of materialGroups(records).values()){
    const values=personNames(rows.flatMap(row=>personValues(row,field)));
    if(!values.length)missing=true;
    for(const value of values)if(!found.has(personKey(value)))found.set(personKey(value),value);
  }
  return {values:[...found.values()],missing};
}
