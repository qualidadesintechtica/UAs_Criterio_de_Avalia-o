import {queryWithDeadline} from './source-loading.mjs?v=v6-6-12-carga-criterios-20261022';
const invalid=()=>Object.assign(new Error('Resposta inválida da paginação de critérios.'),{code:'NQ_CRITERIA_CURSOR'});
const id=value=>typeof value==='string'&&/^\d{1,19}$/.test(value);

export async function readCriteriaCursor(client,signal,onProgress=()=>{}){
  const rows=[];let after='0',size=500;
  for(;;){
    if(signal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
    let data;
    try{
      const result=await queryWithDeadline(pageSignal=>client.rpc('nq_criterios_cursor',{
        p_apos_id:after,p_limite:size
      }).abortSignal(pageSignal),signal,15000);
      if(result.error)throw result.error;
      data=result.data;
    }catch(error){
      if(['57014','NQ_SOURCE_TIMEOUT'].includes(error?.code)&&size>50){size=size===500?125:50;continue;}
      throw error;
    }
    if(data?.versao!==2||!Array.isArray(data.registros)||typeof data.tem_mais!=='boolean'
      ||!Number.isSafeInteger(data.lidos)||data.lidos<0||data.lidos>size)throw invalid();
    const sourceIDs=new Set();let max=BigInt(after);
    for(const row of data.registros){
      if(!row||!id(row.subitem_id)||BigInt(row.subitem_id)<=BigInt(after))throw invalid();
      sourceIDs.add(row.subitem_id);if(BigInt(row.subitem_id)>max)max=BigInt(row.subitem_id);
    }
    if(sourceIDs.size!==data.lidos||data.lidos===0&&data.tem_mais
      ||data.lidos>0&&(!id(data.proximo_id)||BigInt(data.proximo_id)!==max)
      ||data.lidos===0&&data.proximo_id!==null)throw invalid();
    rows.push(...data.registros);onProgress(rows.length);
    if(!data.tem_mais)return rows;
    after=data.proximo_id;
  }
}

export function criteriaCursorMessage(error){
  if(['PGRST202','42883'].includes(error?.code))
    return 'Instale supabase/16_CRITERIOS_POR_CURSOR.sql no Supabase para usar a página V6.6.12.';
  if(error?.code==='57014'||error?.code==='NQ_SOURCE_TIMEOUT')
    return 'Um lote de critérios excedeu o tempo disponível. A carga foi interrompida para evitar resultados incompletos. Confira a função nq_criterios_cursor e o código '+error.code+'.';
  if(error?.code==='NQ_CRITERIA_CURSOR')
    return 'A base devolveu uma página de critérios inconsistente (NQ_CRITERIA_CURSOR). Confira a instalação do SQL 16.';
  return '';
}
