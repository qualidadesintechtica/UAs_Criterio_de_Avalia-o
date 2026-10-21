import {norm,escapeHTML as esc} from './core.mjs';

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

export function progressMarkup(progress,{compact=false}={}){
  const {answered,total,percent,materialsWithoutCriteria}=progress;
  const label=total?`${answered} de ${total} critérios respondidos`:'Sem critérios sincronizados';
  const warning=materialsWithoutCriteria?` · ${materialsWithoutCriteria} material(is) sem critérios sincronizados`:'';
  return '<div class="specialist-progress'+(compact?' compact':'')+'"><div class="specialist-progress-label"><strong>Respostas dos especialistas</strong><b>'+(percent===null?'—':percent+'%')+'</b></div>'+
    '<progress max="100" value="'+(percent??0)+'" aria-label="'+label+'"></progress>'+
    '<small>'+label+warning+'. Progresso dos critérios disponíveis na base.</small></div>';
}

export function uaProgressMarkup(records,name){
  const {answered,total,percent}=specialistProgress(records);
  const label='Respostas dos especialistas de '+name;
  if(!total)return '<span class="ua-progress ua-progress-empty" role="group" aria-label="'+esc(label)+'"><span>Sem critérios sincronizados</span></span>';
  const count=answered+' de '+total+' '+(total===1?'critério respondido':'critérios respondidos');
  return '<span class="ua-progress" role="group" aria-label="'+esc(label)+'"><span class="ua-progress-label"><span>Respostas dos especialistas</span><b>'+percent+'%</b></span><progress max="100" value="'+percent+'" aria-label="'+esc(count+' de '+name)+'"></progress><small>'+count+'</small></span>';
}
