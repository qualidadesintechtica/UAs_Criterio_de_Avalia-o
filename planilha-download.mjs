import {resolvePlanLink,fileName,dispositionName,validateFile,MAX_FILE_BYTES} from './supabase/functions/nq-baixar-planilha/links.mjs';
export {resolvePlanLink};
export async function requestPlanDownload(client,config,itemID,columnID,signal,fetchImpl=fetch){
  const {data,error}=await client.auth.getSession();
  if(error||!data?.session?.access_token)throw new Error('Sua sessão expirou. Entre novamente.');
  const response=await fetchImpl(config.supabaseUrl.replace(/\/$/,'')+'/functions/v1/nq-baixar-planilha',{
    method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,apikey:config.publishableKey,'Content-Type':'application/json'},
    body:JSON.stringify({item_id:String(itemID),column_id:columnID}),signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok){
    let error;try{error=await response.json();}catch{}
    if(response.status===404&&error?.code!=='NQ_ITEM')throw new Error('Publique a função nq-baixar-planilha para habilitar o download.');
    throw new Error(error?.message||'Não foi possível baixar a planilha. Confira a configuração do serviço.');
  }
  if(Number(response.headers.get('Content-Length'))>MAX_FILE_BYTES)throw new Error('A planilha ultrapassa o limite de 20 MB.');
  const reader=response.body?.getReader();if(!reader)throw new Error('O arquivo retornou vazio.');
  const chunks=[];let length=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_FILE_BYTES)throw new Error('A planilha ultrapassa o limite de 20 MB.');chunks.push(value);}}
  catch(error){await reader.cancel();throw error;}
  if(signal?.aborted)throw new DOMException('Download cancelado','AbortError');
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const name=fileName(dispositionName(response.headers.get('Content-Disposition')),'Planilha_de_entrada_'+itemID+'.xlsx');
  validateFile(bytes,response.headers.get('Content-Type'),name);
  return{blob:new Blob([bytes],{type:'application/octet-stream'}),filename:name};
}
export function savePlanDownload({blob,filename},doc=document,urlAPI=URL){
  const url=urlAPI.createObjectURL(blob),a=doc.createElement('a');
  a.href=url;a.download=filename;doc.body.appendChild(a);
  try{a.click();}finally{a.remove();setTimeout(()=>urlAPI.revokeObjectURL(url),1000);}
}
