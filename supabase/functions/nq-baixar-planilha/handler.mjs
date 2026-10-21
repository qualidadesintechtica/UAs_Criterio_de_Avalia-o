import {resolvePlanLink,safeURL,downloadURL,fileName,dispositionName,validateFile,MAX_FILE_BYTES} from './links.mjs';
const institutional=email=>typeof email==='string'&&/^[^@\s]+@(animaeducacao\.com\.br|ulife\.com\.br)$/i.test(email);
const fail=(code,message,status=409)=>Object.assign(new Error(message),{code,status});
function allowedURL(value,extraHosts=[]){
  const url=safeURL(value);if(!url)return false;
  const host=new URL(url).hostname;
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.includes(':')||/^[\d.]+$/.test(host))return false;
  return ['docs.google.com','drive.google.com','drive.usercontent.google.com','onedrive.live.com','1drv.ms','files.monday.com','files-monday-com.s3.amazonaws.com'].includes(host)
    ||/^[a-z0-9-]+(?:-my)?\.sharepoint\.com$/.test(host)
    ||/^files-monday-com\.s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(host)
    ||/^[a-z0-9-]+\.googleusercontent\.com$/.test(host)
    ||extraHosts.includes(host);
}
export function createDownloadHandler({createClient,env,fetchImpl=fetch}){
  return async req=>{
    const origin=req.headers.get('Origin')||'';
    const origins=(env('NQ_ORIGINS')||'https://qualidadesintechtica.github.io').split(',').map(x=>x.trim()).filter(Boolean);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
      'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
      'Access-Control-Expose-Headers':'Content-Disposition'};
    if(origins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    const reply=(status,code,message)=>new Response(JSON.stringify({ok:false,code,message}),{status,headers});
    if(origin&&!origins.includes(origin))return reply(403,'NQ_ORIGIN','Endereço do site não autorizado.');
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return reply(405,'NQ_METHOD','Use POST.');
    const authorization=req.headers.get('Authorization')||'';
    if(!/^Bearer \S+$/i.test(authorization))return reply(401,'NQ_SESSION','Entre novamente no painel.');
    if(!req.headers.get('Content-Type')?.includes('application/json'))return reply(415,'NQ_BODY','Formato inválido.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    const abort=()=>controller.abort();req.signal.addEventListener('abort',abort,{once:true});
    try{
      const raw=await req.text();if(raw.length>4096)throw fail('NQ_BODY','Solicitação muito grande.',413);
      let body;try{body=JSON.parse(raw);}catch{throw fail('NQ_BODY','Solicitação inválida.',400);}
      if(!body||typeof body.item_id!=='string'||!/^\d{1,24}$/.test(body.item_id)||typeof body.column_id!=='string'||!body.column_id||body.column_id.length>150||Object.keys(body).some(k=>!['item_id','column_id'].includes(k)))
        throw fail('NQ_BODY','Informe somente o item e a coluna da planilha.',400);
      const url=env('SUPABASE_URL')||'';
      const key=(env('SUPABASE_PUBLISHABLE_KEYS')?JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS')).default:'')||env('SUPABASE_ANON_KEY');
      if(!url||!key)throw fail('NQ_SERVER_SETUP','Configuração do serviço incompleta.',503);
      const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:authorization}}});
      const {data:identity,error:identityError}=await client.auth.getUser(authorization.replace(/^Bearer /i,''));
      if(identityError||!identity?.user)throw fail('NQ_SESSION','Sua sessão expirou. Entre novamente.',401);
      if(!institutional(identity.user.email))throw fail('NQ_PERMISSION','Conta sem acesso institucional.',403);
      const {data:access,error:accessError}=await client.rpc('nq_painel_acesso_institucional').abortSignal(controller.signal);
      if(accessError||access!==true)throw fail('NQ_PERMISSION','Seu acesso precisa ser validado no painel.',403);
      const {data:row,error:rowError}=await client.from('vw_ua_planilhas_links_autenticados').select('*').eq('monday_item_validacao',body.item_id).abortSignal(controller.signal).maybeSingle();
      if(rowError)throw fail('NQ_SQL_SETUP','Instale supabase/11_LINKS_PLANILHAS_ENTRADA.sql.',503);
      if(!row)throw fail('NQ_ITEM','Plano de Produção não localizado para esta conta.',404);
      const columnIDs=(env('NQ_PLANILHA_COLUMN_IDS')||'').split(',').map(x=>x.trim()).filter(Boolean);
      const link=resolvePlanLink(row,columnIDs);
      if(link.status!=='ready')throw fail('NQ_LINK',link.message);
      if(link.columnId!==body.column_id)throw fail('NQ_LINK_CHANGED','O vínculo da planilha mudou. Atualize os dados.');
      const token=env('MONDAY_API_TOKEN');
      async function monday(query,variables){
        const result=await fetchImpl('https://api.monday.com/v2',{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},
          body:JSON.stringify({query,variables}),signal:controller.signal});
        let payload;try{payload=await result.json();}catch{}
        if(!result.ok||payload?.errors||!payload?.data)throw fail('NQ_MONDAY_LOOKUP','Não foi possível conferir o arquivo atual na Monday. Confira o token de leitura no serviço.',503);
        return payload.data;
      }
      async function addressFor(current){
        if(!current.assetId)return {address:downloadURL(current.url),name:current.name};
        if(!token)throw fail('NQ_MONDAY_SETUP','Este anexo exige MONDAY_API_TOKEN no ambiente do serviço.',503);
        const payload=await monday('query($ids: [ID!]!) { assets(ids: $ids) { id name public_url } }',{ids:[current.assetId]});
        const asset=payload.assets?.find(a=>String(a.id)===current.assetId);
        if(!asset?.public_url)throw fail('NQ_ASSET','Não foi possível obter o anexo atual da Monday.');
        return {address:asset.public_url,name:asset.name};
      }
      const extra=(env('NQ_PLANILHAS_HOSTS')||'').split(',').map(x=>x.trim().toLowerCase()).filter(x=>/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(x));
      async function retrieve(address){
        let response;
        for(let hop=0;hop<=5;hop++){
          if(!allowedURL(address,extra))throw fail('NQ_HOST','O domínio do arquivo precisa ser autorizado no serviço.',403);
          response=await fetchImpl(address,{redirect:'manual',credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/octet-stream'},signal:controller.signal});
          if([301,302,303,307,308].includes(response.status)){
            const location=response.headers.get('Location');await response.body?.cancel();
            if(!location||hop===5)throw fail('NQ_REDIRECT','A origem não forneceu um download direto.');
            address=new URL(location,address).href;continue;
          }
          return {response,address};
        }
        return {response,address};
      }
      let {address,name}=await addressFor(link);
      let downloaded=await retrieve(address),response=downloaded.response;
      // Uma única atualização da coluna exata: nunca procura outro arquivo por nome.
      if(!response?.ok&&token&&[401,403,404,410].includes(response.status)){
        await response.body?.cancel();
        const data=await monday('query($ids: [ID!]!, $columns: [String!]) { items(ids: $ids) { id board { id } column_values(ids: $columns) { id text type value column { title } } } }',
          {ids:[body.item_id],columns:[body.column_id]});
        const item=data.items?.find(item=>String(item.id)===body.item_id&&String(item.board?.id)==='9433297929');
        if(!item)throw fail('NQ_LINK_CHANGED','O plano não foi localizado no quadro de validação da Monday. Confira o vínculo.');
        const current=resolvePlanLink({colunas_planilha:(item.column_values||[]).map(column=>({...column,title:column.column?.title||''}))},[body.column_id]);
        if(current.status!=='ready')throw fail('NQ_LINK_CHANGED','A coluna da planilha foi alterada ou está sem um arquivo único. Atualize os dados.');
        if(current.assetId!==link.assetId||current.url!==link.url){
          const fresh=await addressFor(current);name=fresh.name;
          downloaded=await retrieve(fresh.address);response=downloaded.response;
        }
      }
      address=downloaded.address;
      if(!response?.ok){
        await response?.body?.cancel();
        const status=response?.status||0,host=new URL(address).hostname;
        if([401,403].includes(status))throw fail('NQ_SOURCE_AUTH','A origem '+host+' recusou o download (HTTP '+status+'). O arquivo pode exigir login ou um link autorizado. Confira o acesso na origem ou envie o link exato para análise.');
        if([404,410].includes(status))throw fail('NQ_SOURCE_MISSING','A origem '+host+' não encontrou o arquivo (HTTP '+status+'). O link pode ter expirado ou o arquivo ter sido movido. Atualize o link na Monday.');
        if(status===429)throw fail('NQ_SOURCE_LIMIT','A origem '+host+' limitou os downloads (HTTP 429). Aguarde e tente novamente.');
        throw fail('NQ_SOURCE','Não foi possível obter o arquivo de '+host+' (HTTP '+status+'). Confira a disponibilidade na origem.');
      }
      if(Number(response.headers.get('Content-Length'))>MAX_FILE_BYTES){await response.body?.cancel();throw fail('NQ_SIZE','A planilha ultrapassa o limite de 20 MB.',413);}
      const chunks=[];let size=0;const reader=response.body?.getReader();
      if(!reader)throw fail('NQ_EMPTY','O arquivo retornou vazio.');
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_FILE_BYTES)throw fail('NQ_SIZE','A planilha ultrapassa o limite de 20 MB.',413);chunks.push(value);}}
      catch(error){await reader.cancel();throw error;}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      let pathName='';try{pathName=decodeURIComponent(new URL(address).pathname.split('/').pop()||'');}catch{}
      name=fileName(dispositionName(response.headers.get('Content-Disposition')),'')||fileName(name,'')||fileName(pathName,'')||'Planilha_de_entrada_'+body.item_id+(/text\/csv/i.test(response.headers.get('Content-Type')||'')?'.csv':'.xlsx');
      validateFile(bytes,response.headers.get('Content-Type'),name);
      return new Response(bytes,{status:200,headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(size),
        'Content-Disposition':"attachment; filename=\"Planilha_de_entrada.xlsx\"; filename*=UTF-8''"+encodeURIComponent(name),
        'X-Content-Type-Options':'nosniff'}});
    }catch(error){return reply(controller.signal.aborted?504:error.status||409,controller.signal.aborted?'NQ_TIMEOUT':error.code||'NQ_DOWNLOAD',
      controller.signal.aborted?'O download excedeu o tempo limite. Tente novamente.':error.code?error.message:'Não foi possível baixar a planilha. Confira o link e a configuração do serviço.');}
    finally{clearTimeout(timer);req.signal.removeEventListener('abort',abort);}
  };
}
