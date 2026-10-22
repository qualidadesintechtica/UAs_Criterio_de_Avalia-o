import {norm,escapeHTML as esc} from './core.mjs?v=v6-6-10-responsaveis-monday-20261022';

// Mede respostas dos critérios disponíveis, sem confundir comentário com avaliação.
export function specialistProgress(records=[]){
  const criteria=new Map(),materials=new Set(),withCriteria=new Set();
  for(const record of records){
    if(record.uaKey)materials.add(record.uaKey);
    if(record.commentOnly||record.portalAddition||record.metadataOnly||record.inventoryOnly)continue;
    const key=JSON.stringify([record.uaKey,record.id??record.criterionKey??record.criterion]);
    if(!criteria.has(key))criteria.set(key,record);
    if(record.uaKey)withCriteria.add(record.uaKey);
  }
  let answered=0;
  for(const record of criteria.values()){
    const classification=norm(record.raw?.classificacao_especialista??record.classification);
    const missing=!classification||['—','-','pendente','nao avaliado','nao avaliada',
      'classificacao nao sincronizada','resultado do criterio nao sincronizado'].includes(classification);
    if(['good','bad','rated'].includes(record.status)||!missing)answered++;
  }
  const total=criteria.size;
  return {answered,total,pending:total-answered,percent:total?Math.round(answered/total*100):null,
    materialsWithoutCriteria:[...materials].filter(key=>!withCriteria.has(key)).length};
}

export function progressLabel(kind){return kind==='UC'?'Progresso dos indicadores':kind==='UA'?'Respostas dos especialistas':'Progresso das respostas';}

export function progressRecordsForUnit(records,unit){
  return unit?records.filter(r=>(r.unitSourceId||r.uaId||r.ua)===unit):records;
}

function emptyTrack(label){
  return '<span class="ua-progress-track" role="progressbar" aria-label="'+esc(label)+'" aria-valuetext="Sem critérios sincronizados"></span>';
}

export function progressMarkup(progress,{compact=false,label='Respostas dos especialistas'}={}){
  const {answered,total,percent,materialsWithoutCriteria}=progress;
  const count=total?`${answered} de ${total} ${total===1?'critério respondido':'critérios respondidos'}`:'Sem critérios sincronizados';
  const warning=materialsWithoutCriteria?` · ${materialsWithoutCriteria} material(is) sem critérios sincronizados`:'';
  return '<div class="specialist-progress'+(compact?' compact':'')+'"><div class="specialist-progress-label"><strong>'+esc(label)+'</strong><b>'+(percent===null?'—':percent+'%')+'</b></div>'+
    (total?'<progress max="100" value="'+percent+'" aria-label="'+esc(count)+'"></progress>':emptyTrack(label))+
    '<small>'+count+warning+'. Progresso dos critérios disponíveis na base.</small></div>';
}

export function materialProgressMarkup(records,name,kind='UA'){
  const {answered,total,percent}=specialistProgress(records);
  const caption=progressLabel(kind),label=caption+' de '+name;
  const head='<span class="ua-progress-label"><span>'+esc(caption)+'</span><b>'+(percent===null?'—':percent+'%')+'</b></span>';
  if(!total)return '<span class="ua-progress ua-progress-empty" role="group" aria-label="'+esc(label)+'">'+head+emptyTrack(label)+'<small>Sem critérios sincronizados</small></span>';
  const count=answered+' de '+total+' '+(total===1?'critério respondido':'critérios respondidos');
  return '<span class="ua-progress" role="group" aria-label="'+esc(label)+'">'+head+'<progress max="100" value="'+percent+'" aria-label="'+esc(count+' de '+name)+'"></progress><small>'+count+'</small></span>';
}
export const uaProgressMarkup=(records,name)=>materialProgressMarkup(records,name,'UA');
