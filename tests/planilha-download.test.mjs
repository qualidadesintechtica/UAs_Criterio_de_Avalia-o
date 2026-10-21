import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePlanLink,safeURL,downloadURL,validateFile,MAX_FILE_BYTES} from '../supabase/functions/nq-baixar-planilha/links.mjs';
import {readFile} from 'node:fs/promises';
const folder=new URL('../supabase/functions/nq-baixar-planilha/',import.meta.url);
const bundled=await readFile(new URL('index.ts',folder),'utf8');
const executable=bundled.replace("import {createClient} from 'npm:@supabase/supabase-js@2';",'').replace(/Deno\.serve\(createDownloadHandler[\s\S]*$/,'export {createDownloadHandler};');
const {createDownloadHandler}=await import('data:text/javascript;base64,'+Buffer.from(executable).toString('base64'));

import {requestPlanDownload,savePlanDownload,downloadConnectionError} from '../planilha-download.mjs';
const column=(url='https://docs.google.com/arquivo.xlsx',extra={})=>({id:'link_pe',title:'Planilha de entrada',type:'link',value:{url,text:'Minha planilha'},...extra});
const row=(...cols)=>({monday_item_validacao:'123',colunas_planilha:cols});
const bytes=new Uint8Array([0x50,0x4b,3,4,0,0,0,0,0,0]);
function fixture(options={}){
 const calls=[],vars={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public',...options.vars};
 const client={auth:{getUser:async()=>options.userError?{error:true}:{data:{user:{id:'u1',email:options.email||'a@ulife.com.br'}}}},
  rpc:()=>({abortSignal:async()=>({data:options.access!==false,error:options.accessError})}),
  from(table){assert.equal(table,'vw_ua_planilhas_links_autenticados');return{select(){return this},eq(key,value){assert.equal(key,'monday_item_validacao');assert.equal(value,'123');return this},abortSignal(){return this},async maybeSingle(){return{data:options.missing?null:options.row||row(column()),error:options.rowError}}};}};
 const fetchImpl=async(url,init)=>{calls.push({url,init});if(options.fetch)return options.fetch(url,init,calls.length);return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':"attachment; filename*=UTF-8''Avalia%C3%A7%C3%A3o.xlsx"}});};
 const handler=createDownloadHandler({createClient:()=>client,env:k=>vars[k],fetchImpl});
 const request=(body={item_id:'123',column_id:'link_pe'},headers={})=>new Request('https://project.supabase.co/functions/v1/nq-baixar-planilha',{method:'POST',headers:{Origin:'https://qualidadesintechtica.github.io',Authorization:'Bearer session','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 return{handler,request,calls,client};
}
test('resolve somente a coluna identificada, pelo ID do item e URL estruturada',()=>{
 assert.equal(resolvePlanLink(row(column())).url,'https://docs.google.com/arquivo.xlsx');
 assert.equal(resolvePlanLink(row(column('https://evil.example/outro.xlsx',{title:'Outro material'}))).status,'missing');
 assert.equal(resolvePlanLink(row(column('https://docs.google.com/a.xlsx',{title:'Arquivo'})),['link_pe']).status,'ready');
 assert.equal(resolvePlanLink(row(column(undefined,{value:JSON.stringify({url:'https://docs.google.com/b.xlsx'})}))).status,'ready');
});
test('não escolhe entre links diferentes; deduplica somente o mesmo endereço',()=>{
 assert.equal(resolvePlanLink(row(column(),column())).status,'ready');
 assert.equal(resolvePlanLink(row(column(),column('https://docs.google.com/outro.xlsx',{id:'segundo'}))).status,'ambiguous');
 assert.equal(resolvePlanLink(row(column(),column('https://docs.google.com/outro.xlsx',{id:'segundo'})),['segundo']).url,'https://docs.google.com/outro.xlsx');
 assert.equal(resolvePlanLink(row(column('javascript:alert(1)'))).status,'invalid');
 assert.equal(resolvePlanLink(row(column(undefined,{value:null,text:'Sem link'}))).status,'invalid');
 assert.equal(resolvePlanLink(row()).status,'missing');
});
test('lê texto de Link e anexo com assetId sem adivinhar um arquivo diferente',()=>{
 assert.equal(resolvePlanLink(row(column(undefined,{value:null,text:'Planilha - https://docs.google.com/a.xlsx'}))).url,'https://docs.google.com/a.xlsx');
 assert.equal(resolvePlanLink(row(column(undefined,{type:'file',value:{files:[{assetId:987,name:'Minha.xlsx'}]}}))).assetId,'987');
 assert.equal(resolvePlanLink(row(column(undefined,{value:{files:[{assetId:987},{assetId:988}]}}))).status,'ambiguous');
});
test('endereços de download conservam tokens de compartilhamento e rejeitam esquemas inseguros',()=>{
 assert.equal(safeURL('https://user:password@docs.google.com/x'),null);
 for(const s of ['http://docs.google.com/x','data:text/html,x','https://docs.google.com:8080/x','https://docs.google.com/a\nb'])assert.equal(safeURL(s),null);
 const google=new URL(downloadURL('https://docs.google.com/spreadsheets/d/ABC_12/edit?resourcekey=abc#gid=7'));
 assert.equal(google.pathname,'/spreadsheets/d/ABC_12/export');assert.equal(google.searchParams.get('format'),'xlsx');assert.equal(google.searchParams.get('resourcekey'),'abc');assert.equal(google.hash,'');
 const ms=new URL(downloadURL('https://tenant.sharepoint.com/:x:/s/test/abc?e=secret'));
 assert.equal(ms.searchParams.get('e'),'secret');assert.equal(ms.searchParams.get('download'),'1');
});
test('arquivo não pode ser uma tela de login salva como planilha',()=>{
 for(const type of ['text/html','application/json','application/xml'])assert.throws(()=>validateFile(bytes,type,'a.xlsx'));
 assert.throws(()=>validateFile(new TextEncoder().encode('<!DOCTYPE html><html>Login</html>'),'application/octet-stream','a.xlsx'));
 assert.throws(()=>validateFile(new Uint8Array(),'application/octet-stream','a.xlsx'));
 assert.throws(()=>validateFile(new Uint8Array(MAX_FILE_BYTES+1),'application/octet-stream','a.xlsx'));
 validateFile(bytes,'application/octet-stream','a.xlsx');
 validateFile(new TextEncoder().encode('nome;nota\nAna;10'),'text/csv','a.csv');
});
test('serviço entrega bytes, nome e cabeçalho de download sem enviar a sessão à origem',async()=>{
 const f=fixture(),r=await f.handler(f.request());assert.equal(r.status,200);
 assert.deepEqual(new Uint8Array(await r.arrayBuffer()),bytes);assert.ok(r.headers.get('Content-Disposition').includes('Avalia%C3%A7%C3%A3o.xlsx'));
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://qualidadesintechtica.github.io');assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.credentials,'omit');assert.equal(f.calls[0].init.headers.Authorization,undefined);assert.equal(f.calls[0].init.redirect,'manual');
});
test('conta externa, sessão inválida, acesso pendente, item ausente e SQL ausente bloqueiam antes do arquivo',async()=>{
 for(const [config,status] of [[{email:'a@externo.com'},403],[{userError:true},401],[{access:false},403],[{accessError:true},403],[{missing:true},404],[{rowError:{code:'42P01'}},503]]){
  const f=fixture(config),r=await f.handler(f.request());assert.equal(r.status,status);assert.equal(f.calls.length,0);
 }
});
test('nega origem estranha, corpo com URL arbitrária e vínculo desatualizado',async()=>{
 const f=fixture();assert.equal((await f.handler(f.request(undefined,{Origin:'https://evil.example'}))).status,403);
 assert.equal((await f.handler(f.request({item_id:'123',column_id:'link_pe',url:'https://evil.example'}))).status,400);
 assert.equal((await f.handler(f.request({item_id:123,column_id:'link_pe'}))).status,400);
 assert.equal((await f.handler(f.request({item_id:'123',column_id:'outra'}))).status,409);
 assert.equal(f.calls.length,0);
});
test('bloqueia URL interna, domínio desconhecido e redirecionamento para rede privada',async()=>{
 for(const url of ['https://127.0.0.1/a.xlsx','https://[::1]/a.xlsx','https://localhost/a.xlsx','https://docs.google.com.evil.example/a.xlsx','https://unknown.example/a.xlsx']){
 const f=fixture({row:row(column(url))});assert.equal((await f.handler(f.request())).status,403);assert.equal(f.calls.length,0);}
 const f=fixture({fetch:async()=>new Response(null,{status:302,headers:{Location:'https://127.0.0.1/private'}})});
 assert.equal((await f.handler(f.request())).status,403);assert.equal(f.calls.length,1);
});
test('limita redirecionamentos e tamanho e rejeita HTML retornado com status 200',async()=>{
 const f=fixture({fetch:async()=>new Response(null,{status:302,headers:{Location:'https://docs.google.com/next'}})});
 assert.equal((await f.handler(f.request())).status,409);assert.equal(f.calls.length,6);
 const large=fixture({fetch:async()=>new Response(bytes,{headers:{'Content-Length':String(MAX_FILE_BYTES+1)}})});
 assert.equal((await large.handler(large.request())).status,413);
 const login=fixture({fetch:async()=>new Response('<html>Entre</html>',{headers:{'Content-Type':'text/html'}})});
 assert.equal((await login.handler(login.request())).status,409);
});
test('renova URL de anexo Monday no servidor, usando o asset da coluna sincronizada',async()=>{
 const attachment=row(column(undefined,{value:{files:[{assetId:'987',name:'Anexo.xlsx'}]}}));
 const noToken=fixture({row:attachment});assert.equal((await noToken.handler(noToken.request())).status,503);assert.equal(noToken.calls.length,0);
 const f=fixture({row:attachment,vars:{MONDAY_API_TOKEN:'private-token'},fetch:async(url,init,n)=>{
 if(n===1){assert.equal(url,'https://api.monday.com/v2');assert.equal(init.headers.Authorization,'private-token');assert.deepEqual(JSON.parse(init.body).variables.ids,['987']);return Response.json({data:{assets:[{id:'987',name:'Anexo.xlsx',public_url:'https://files.monday.com/file.xlsx'}]}});}
 assert.equal(init.headers.Authorization,undefined);return new Response(bytes);}});
 assert.equal((await f.handler(f.request())).status,200);assert.equal(f.calls.length,2);
});
test('cliente baixa Blob e nome, trata função ausente e não salva HTML',async()=>{
 const client={auth:{getSession:async()=>({data:{session:{access_token:'session'}}})}};
 let requested;const result=await requestPlanDownload(client,{supabaseUrl:'https://p.supabase.co',publishableKey:'public'},'123','link_pe',null,async(url,init)=>{requested={url,init};return new Response(bytes,{headers:{'Content-Disposition':'attachment; filename="Planilha.csv"'}});});
 assert.ok(result.blob instanceof Blob);assert.equal(result.filename,'Planilha.csv');assert.equal(requested.init.headers.Authorization,'Bearer session');assert.equal(requested.url,'https://p.supabase.co/functions/v1/nq-baixar-planilha');
 await assert.rejects(requestPlanDownload(client,{supabaseUrl:'https://p.supabase.co'},'123','link_pe',null,async()=>Response.json({code:'NOT_FOUND'},{status:404})),/Publique a função/);
 await assert.rejects(requestPlanDownload(client,{supabaseUrl:'https://p.supabase.co'},'123','link_pe',null,async()=>new Response('<html>Login</html>',{headers:{'Content-Type':'text/html'}})),/página de acesso/);
});
test('salvamento usa Blob local e atributo download, sem navegar ao link externo',()=>{
 let clicked=false,removed=false,appended=false,anchor;
 const doc={body:{appendChild(a){appended=true;anchor=a}},createElement(){return{click(){clicked=true},remove(){removed=true}}}};
 savePlanDownload({blob:new Blob([bytes]),filename:'Planilha.xlsx'},doc,{createObjectURL:()=> 'blob:local',revokeObjectURL(){}});
 assert.ok(clicked&&removed&&appended);assert.equal(anchor.href,'blob:local');assert.equal(anchor.download,'Planilha.xlsx');assert.equal(anchor.target,undefined);
});

test('função completa publicada coincide com os módulos exercitados pelo navegador',async()=>{
 const links=(await readFile(new URL('links.mjs',folder),'utf8')).replaceAll('export ','');
 const handler=(await readFile(new URL('handler.mjs',folder),'utf8')).split('\n').slice(1).join('\n').replaceAll('export ','');
 assert.ok(bundled.includes(links));assert.ok(bundled.includes(handler));
});

test('falha de preflight identifica função ausente por GET sem sessão',async()=>{
 const calls=[],client={auth:{getSession:async()=>({data:{session:{access_token:'private-session'}}})}};
 const fetchImpl=async(url,options)=>{
   calls.push(options);
   if(options.method==='POST')throw new TypeError('Failed to fetch');
   assert.equal(options.headers,undefined);assert.equal(options.credentials,'omit');
   return Response.json({code:'NOT_FOUND',message:'Requested function was not found'},{status:404});
 };
 await assert.rejects(requestPlanDownload(client,{supabaseUrl:'https://p.supabase.co',publishableKey:'public'},'123','link_pe',null,fetchImpl),e=>e.code==='NQ_FUNCTION_MISSING'&&/Publique a função nq-baixar-planilha/.test(e.message));
 assert.deepEqual(calls.map(c=>c.method),['POST','GET']);
});
test('rede indisponível e serviço existente explicam a conexão sem alegar causa falsa',async()=>{
 for(const fetchImpl of [async()=>{throw new TypeError('Failed to fetch');},async()=>Response.json({code:401},{status:401}),async()=>Response.json({code:'NQ_METHOD'},{status:405})]){
   const error=await downloadConnectionError({supabaseUrl:'https://p.supabase.co'},null,fetchImpl);
   assert.equal(error.code,'NQ_DOWNLOAD_CONNECTION');assert.doesNotMatch(error.message,/Failed to fetch|não foi encontrado/);
 }
 const controller=new AbortController();controller.abort();
 const error=await downloadConnectionError({supabaseUrl:'https://p.supabase.co'},controller.signal,async()=>{throw new DOMException('abort','AbortError');});
 assert.equal(error.name,'AbortError');
});
