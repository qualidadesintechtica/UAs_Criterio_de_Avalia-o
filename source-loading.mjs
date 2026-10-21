export async function queryWithDeadline(work,parentSignal,timeoutMs=15000){
  if(parentSignal?.aborted)throw new DOMException('Consulta cancelada','AbortError');
  const controller=new AbortController();let timer,onAbort;
  const stopped=new Promise((_,reject)=>{
    onAbort=()=>{controller.abort();reject(new DOMException('Consulta cancelada','AbortError'));};
    parentSignal?.addEventListener('abort',onAbort,{once:true});
    timer=setTimeout(()=>{controller.abort();const error=new Error('Limite de tempo da consulta');error.code='NQ_SOURCE_TIMEOUT';reject(error);},timeoutMs);
  });
  try{return await Promise.race([Promise.resolve().then(()=>work(controller.signal)),stopped]);}
  finally{clearTimeout(timer);parentSignal?.removeEventListener('abort',onAbort);}
}

export function connectionMessage(error){
  const message=String(error?.message||'');
  if(error?.code==='57014'||/statement timeout/i.test(message))return 'A consulta excedeu o tempo de execução no banco. Para a fonte de critérios, instale supabase/10_CRITERIOS_PAGINADOS.sql e use a página V6.6.1 ou posterior. Se o erro continuar, confira o plano de execução da fonte indicada.';
  if(error?.code==='NQ_SOURCE_TIMEOUT'||error?.name==='AbortError'||/timeout|abort/i.test(message))return 'A consulta não terminou dentro do limite de tempo. Atualize os dados; se persistir, confira a fonte indicada.';
  if(/fetch|network/i.test(message))return 'Houve uma falha de comunicação com a base do Supabase. Tente atualizar os dados.';
  return '';
}
