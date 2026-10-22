import {resolvePlanLink,downloadURL,fileName,dispositionName,validateFile,MAX_FILE_BYTES} from './supabase/functions/nq-baixar-planilha/links.mjs?v=v6-6-11-filtros-paginados-20261022';
export {resolvePlanLink};
export function microsoftDownloadURL(link){
  if(link?.status!=='ready'||link.assetId||!link.url)return null;
  const address=downloadURL(link.url);if(!address)return null;
  const url=new URL(address),host=url.hostname;
  if(!(/^[a-z0-9-]+(?:-my)?\.sharepoint\.com$/.test(host)||host==='onedrive.live.com'||host==='1drv.ms'))return null;
  url.searchParams.set('download','1');return url.href;
}
export function requestMicrosoftDownload(link,doc=document){
  const address=microsoftDownloadURL(link);if(!address)throw new Error('O vínculo não é um arquivo Microsoft válido.');
  const a=doc.createElement('a');a.href=address;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
  a.download=fileName(link.name,'Planilha_de_entrada.xlsx');doc.body.appendChild(a);
  try{a.click();}finally{a.remove();}
  return address;
}
const missingService=()=>Object.assign(new Error('O serviço nq-baixar-planilha não foi encontrado. Publique a função nq-baixar-planilha (Edge Function) no Supabase deste painel; atualizar somente o GitHub não ativa o download.'),{code:'NQ_FUNCTION_MISSING'});
export async function downloadConnectionError(config,signal,fetchImpl=fetch){
  // GET sem sessão e sem cabeçalhos extras não exige preflight. Permite ler
  // o 404 que o navegador oculta quando o OPTIONS da função ausente falha.
  try{
    const response=await fetchImpl(config.supabaseUrl.replace(/\/$/,'')+'/functions/v1/nq-baixar-planilha',{
      method:'GET',mode:'cors',signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(response.status===404){
      let data;try{data=await response.json();}catch{}
      if(data?.code==='NOT_FOUND')return missingService();
    }
  }catch{}
  if(signal?.aborted)return new DOMException('Download cancelado','AbortError');
  return Object.assign(new Error('Não foi possível conectar ao serviço de download. Confira sua conexão, a publicação de nq-baixar-planilha e a origem autorizada do site no Supabase. Consulte LEIA_CORRECAO_DOWNLOAD_E_ESPECIALISTAS.md.'),{code:'NQ_DOWNLOAD_CONNECTION'});
}
export async function requestPlanDownload(client,config,itemID,columnID,signal,fetchImpl=fetch){
  const {data,error}=await client.auth.getSession();
  if(error||!data?.session?.access_token)throw new Error('Sua sessão expirou. Entre novamente.');
  let response;
  try{response=await fetchImpl(config.supabaseUrl.replace(/\/$/,'')+'/functions/v1/nq-baixar-planilha',{
    method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,apikey:config.publishableKey,'Content-Type':'application/json'},
    body:JSON.stringify({item_id:String(itemID),column_id:columnID}),signal,credentials:'omit',referrerPolicy:'no-referrer'});}
  catch(error){
    if(signal?.aborted||error?.name==='AbortError')throw error;
    if(error instanceof TypeError||/failed to fetch|networkerror|load failed/i.test(error?.message||''))throw await downloadConnectionError(config,signal,fetchImpl);
    throw error;
  }
  if(!response.ok){
    let error;try{error=await response.json();}catch{}
    if(response.status===404&&error?.code!=='NQ_ITEM')throw missingService();
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
