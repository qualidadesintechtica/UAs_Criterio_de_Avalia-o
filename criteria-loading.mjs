const invalidPage=()=>Object.assign(new Error('Resposta de paginação de critérios inválida.'),{code:'NQ_CRITERIA_PAGING'});

export async function readCriteriaPages(client,signal,onProgress=()=>{},pageSize=200){
  if(!Number.isInteger(pageSize)||pageSize<1||pageSize>500)throw invalidPage();
  const rows=[];let offset=0;
  for(;;){
    if(signal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
    const {data,error}=await client.rpc('nq_criterios_pagina',{p_offset:offset,p_limite:pageSize}).abortSignal(signal);
    if(error)throw error;
    if(signal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
    if(data?.versao!==1||!Array.isArray(data.registros)||typeof data.tem_mais!=='boolean'
      ||!Number.isInteger(data.lidos)||data.lidos<0||data.lidos>pageSize
      ||!Number.isInteger(data.proximo_offset)||data.proximo_offset!==offset+data.lidos
      ||(data.tem_mais&&data.lidos!==pageSize)||data.registros.length<data.lidos
      ||data.registros.some(row=>!row||typeof row!=='object'||Array.isArray(row))
      ||(!data.lidos&&data.registros.length))throw invalidPage();
    for(const row of data.registros)rows.push(row);onProgress(rows.length);
    if(!data.tem_mais)return rows;
    offset=data.proximo_offset;
  }
}

export function criteriaPagingMissing(error){
  return error?.code==='PGRST202'||error?.code==='42883';
}
