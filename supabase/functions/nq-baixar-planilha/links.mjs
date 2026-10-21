// Usado no navegador e no servidor. O navegador nunca escolhe uma URL arbitrária.
const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const titles=new Set(['planilha de entrada','planilha entrada','link da planilha de entrada','link planilha de entrada',
  'link de planilha de entrada','url da planilha de entrada','arquivo da planilha de entrada','planilha de entrada preenchida']);
function json(value){if(typeof value!=='string')return value;try{return JSON.parse(value);}catch{return null;}}
export function safeURL(value){
  if(typeof value!=='string'||value.length>8192||/[\u0000-\u0020\u007f]/.test(value))return null;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')?u.href:null;}catch{return null;}
}
export function resolvePlanLink(row,configuredIDs=[]){
  const ids=new Set(configuredIDs),candidates=[],seen=new Set();let invalid=false;
  for(const column of Array.isArray(row?.colunas_planilha)?row.colunas_planilha:[]){
    if(ids.size?!ids.has(column.id):!titles.has(norm(column.title)))continue;
    const value=json(column.value),entries=[];
    if(value?.url)entries.push({url:value.url,name:value.text});
    for(const file of Array.isArray(value?.files)?value.files:[]){
      if(file.assetId||file.asset_id)entries.push({assetId:String(file.assetId||file.asset_id),name:file.name});
      else if(file.url||file.linkToFile)entries.push({url:file.url||file.linkToFile,name:file.name});
    }
    // Formato de texto da coluna Link: "rótulo - https://...".
    if(!entries.length&&column.text){const matches=String(column.text).match(/https:\/\/[^\s<>"\u0000-\u001f]+/g)||[];for(const url of matches)entries.push({url});}
    if(!entries.length&&column.text)invalid=true;
    for(const entry of entries){
      const url=entry.url?safeURL(entry.url):null;
      const assetId=entry.assetId&&/^\d{1,24}$/.test(entry.assetId)?entry.assetId:null;
      if(!url&&!assetId){invalid=true;continue;}
      const key=assetId?'asset:'+assetId:'url:'+url;if(seen.has(key))continue;seen.add(key);
      candidates.push({columnId:String(column.id||''),columnTitle:String(column.title||''),url,assetId,name:String(entry.name||'')});
    }
  }
  if(candidates.length>1)return{status:'ambiguous',message:'Mais de uma planilha vinculada. Confira a coluna na Monday.'};
  if(candidates.length===1&&!invalid)return{status:'ready',...candidates[0]};
  return{status:invalid?'invalid':'missing',message:invalid?'O link da planilha precisa ser corrigido na Monday.':'Link da planilha não informado na sincronização.'};
}
export const MAX_FILE_BYTES=20*1024*1024;
export function downloadURL(value){
  const safe=safeURL(value);if(!safe)return null;
  const u=new URL(safe);
  const sheet=u.hostname==='docs.google.com'&&/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)\/(?:edit|view|preview|copy)?$/.exec(u.pathname);
  if(sheet){u.pathname='/spreadsheets/d/'+sheet[1]+'/export';u.searchParams.delete('gid');u.searchParams.delete('usp');u.searchParams.set('format','xlsx');u.hash='';}
  if(/^[a-z0-9-]+\.sharepoint\.com$/.test(u.hostname)||u.hostname==='onedrive.live.com'){u.searchParams.set('download','1');u.hash='';}
  return u.href;
}
export function fileName(value,fallback='Planilha_de_entrada.xlsx'){
  const name=String(value||'').normalize('NFC').replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g,'_').replace(/^\.+|[. ]+$/g,'').slice(0,180);
  return name&&/\.(xlsx|xls|xlsm|ods|csv)$/i.test(name)?name:fallback;
}
export function dispositionName(value){
  const encoded=/filename\*=UTF-8''([^;]+)/i.exec(value||'');
  if(encoded)try{return decodeURIComponent(encoded[1].trim());}catch{}
  return /filename="([^"\r\n]+)"|filename=([^;\r\n]+)/i.exec(value||'')?.slice(1).find(Boolean)?.trim()||'';
}
export function validateFile(bytes,type,name){
  if(!bytes.length)throw Object.assign(new Error('O arquivo retornou vazio.'),{code:'NQ_EMPTY'});
  if(bytes.length>MAX_FILE_BYTES)throw Object.assign(new Error('A planilha ultrapassa o limite de 20 MB.'),{code:'NQ_SIZE'});
  const sample=new TextDecoder().decode(bytes.subarray(0,512)).replace(/^\uFEFF/,'').trimStart();
  if(/html|json|javascript|^(?:text|application)\/(?:[^;]+\+)?xml(?:;|$)/i.test(type||'')||/^(?:<!doctype|<html|<head|<body|<script|<\?xml|[\[{])/i.test(sample))
    throw Object.assign(new Error('A origem retornou uma página de acesso ou visualização. O download exige um link de arquivo autorizado.'),{code:'NQ_NOT_FILE'});
  const zip=bytes[0]===0x50&&bytes[1]===0x4b;
  const ole=bytes[0]===0xd0&&bytes[1]===0xcf&&bytes[2]===0x11&&bytes[3]===0xe0;
  if(!zip&&!ole&&!(/\.csv$/i.test(name)||/text\/csv/i.test(type||'')))
    throw Object.assign(new Error('O endereço não retornou uma planilha Excel, ODS ou CSV.'),{code:'NQ_NOT_FILE'});
}
