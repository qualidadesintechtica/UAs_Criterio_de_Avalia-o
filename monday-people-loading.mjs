import {queryWithDeadline} from './source-loading.mjs?v=v6-6-12-carga-criterios-20261022';

const failure=(code,message)=>Object.assign(new Error(message),{code});
const cursor=value=>typeof value==='string'&&/^\d{1,19}$/.test(value);
const key=(board,item)=>BigInt(board)*10000000000000000000n+BigInt(item);

// Cada chamada limita os materiais ANTES de ler suas colunas de pessoas.
// Não há fallback para a view que reprocessava a base inteira em cada lote.
export async function readMondayPeople(client,signal,onProgress=()=>{}){
  const rows=[];let board='0',item='0',size=500,total=0;
  for(;;){
    if(signal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
    let data;
    try{
      const result=await queryWithDeadline(pageSignal=>client.rpc('nq_painel_responsaveis_pagina',{
        p_apos_board:board,p_apos_item:item,p_limite:size
      }).abortSignal(pageSignal),signal,10000);
      if(result.error)throw result.error;
      data=result.data;
    }catch(error){
      if(['57014','NQ_SOURCE_TIMEOUT'].includes(error?.code)&&size>50){size=size===500?125:50;continue;}
      throw error;
    }
    if(data?.versao!==1||!Array.isArray(data.registros)||typeof data.tem_mais!=='boolean'
      ||!Number.isSafeInteger(data.lidos)||data.lidos!==data.registros.length||data.lidos>size)
      throw failure('NQ_PEOPLE_RESPONSE','Resposta inválida da consulta de responsáveis.');
    const page=[];let previous=key(board,item);
    for(const row of data.registros){
      if(!cursor(row.monday_board_id)||!cursor(row.monday_item_id)||!Array.isArray(row.pessoas))
        throw failure('NQ_PEOPLE_RESPONSE','Material inválido na consulta de responsáveis.');
      const current=key(row.monday_board_id,row.monday_item_id);
      if(current<=previous)throw failure('NQ_PEOPLE_CURSOR','A consulta de responsáveis não avançou.');
      previous=current;
      for(const person of row.pessoas){
        if(!['especialista','revisor'].includes(person?.papel))continue;
        const {pessoas,...material}=row;
        page.push({...material,...person});
      }
    }
    const last=data.registros.at(-1);
    if(data.tem_mais&&(!last||data.proximo_board!==last.monday_board_id||data.proximo_item!==last.monday_item_id))
      throw failure('NQ_PEOPLE_CURSOR','Cursor inválido na consulta de responsáveis.');
    rows.push(...page);total+=data.lidos;onProgress(total);
    if(!data.tem_mais)return rows;
    board=data.proximo_board;item=data.proximo_item;
  }
}

export function mondayPeopleMessage(error){
  const code=String(error?.code||'');
  const tag=/^[a-z0-9_]{1,40}$/i.test(code)?' (código '+code+')':'';
  if(['PGRST202','42883','42P01','PGRST205'].includes(code))
    return 'A consulta paginada de responsáveis precisa ser instalada'+tag+'. Execute supabase/14_RESPONSAVEIS_PAGINADOS.sql e atualize os dados.';
  if(code==='57014'||code==='NQ_SOURCE_TIMEOUT'||error?.name==='AbortError')
    return 'A consulta dos responsáveis da Monday excedeu o tempo disponível'+tag+'. Execute supabase/14_RESPONSAVEIS_PAGINADOS.sql para instalar a leitura por lotes e os índices; depois atualize os dados.';
  if(code==='42501'||error?.status===403)
    return 'A base recusou o acesso aos responsáveis da Monday'+tag+'. Saia e entre novamente. Se persistir, execute supabase/14_RESPONSAVEIS_PAGINADOS.sql para conferir as permissões da consulta.';
  if(['PGRST301','PGRST303'].includes(code)||error?.status===401)
    return 'A sessão não foi aceita na consulta de responsáveis'+tag+'. Saia e entre novamente.';
  return 'Não foi possível consultar os responsáveis da Monday'+tag+'. Atualize os dados. Se persistir, informe este código à administração.';
}
