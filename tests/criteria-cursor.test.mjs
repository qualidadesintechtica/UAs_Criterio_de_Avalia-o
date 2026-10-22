import test from 'node:test';
import assert from 'node:assert/strict';
import {readCriteriaCursor,criteriaCursorMessage} from '../criteria-cursor.mjs';
const row=id=>({subitem_id:id,parecer_especialista:'Comentário '+id});
const page=(ids,more=false,rows=ids.map(row))=>({versao:2,lidos:ids.length,registros:rows,proximo_id:ids.at(-1)||null,tem_mais:more});
function fixture(results){const calls=[];return {calls,rpc(name,args){calls.push({name,args});return {abortSignal(){return Promise.resolve(results.shift());}};}};}
test('leitura por cursor preserva IDs de comprimentos diferentes e bigint, com materiais repetidos após o vínculo',async()=>{
 const f=fixture([{data:page(['9999','10000'],true,[row('9999'),row('9999'),row('10000')])},{data:page(['9223372036854775806'])}]);
 const progress=[];const result=await readCriteriaCursor(f,null,n=>progress.push(n));
 assert.equal(result.length,4);assert.equal(result.at(-1).subitem_id,'9223372036854775806');assert.deepEqual(progress,[3,4]);
 assert.deepEqual(f.calls.map(c=>c.args),[{p_apos_id:'0',p_limite:500},{p_apos_id:'10000',p_limite:500}]);
});
test('reduz lote apenas por tempo e repete o mesmo cursor sem duplicar os registros',async()=>{
 const f=fixture([{error:{code:'57014'}},{data:page(['1'],true)},{error:{code:'57014'}},{data:page(['2'])}]);
 assert.equal((await readCriteriaCursor(f)).length,2);assert.deepEqual(f.calls.map(c=>c.args.p_limite),[500,125,125,50]);
 assert.deepEqual(f.calls.map(c=>c.args.p_apos_id),['0','0','1','1']);
});
test('não aceita perda de IDs, cursor textual incorreto, repetição ou resposta parcial inconsistente',async()=>{
 for(const data of [{}, {...page(['9999','10000'],true),proximo_id:'9999'}, {...page(['1']),lidos:2},page([],true)])
  await assert.rejects(readCriteriaCursor(fixture([{data}])),{code:'NQ_CRITERIA_CURSOR'});
 await assert.rejects(readCriteriaCursor(fixture([{data:page(['1'],true)},{data:page(['1'])}])),{code:'NQ_CRITERIA_CURSOR'});
});
test('falha posterior a um lote rejeita o conjunto e não provoca fallback para a view antiga',async()=>{
 const error={code:'PGRST202'};const f=fixture([{data:page(['1'],true)},{error}]);
 await assert.rejects(readCriteriaCursor(f),e=>e===error);assert.equal(f.calls.length,2);assert.match(criteriaCursorMessage(error),/16_CRITERIOS_POR_CURSOR/);
});
test('encerra fonte vazia e respeita cancelamento',async()=>{
 assert.deepEqual(await readCriteriaCursor(fixture([{data:page([])}])),[]);
 const c=new AbortController();c.abort();const f=fixture([]);await assert.rejects(readCriteriaCursor(f,c.signal),{name:'AbortError'});assert.equal(f.calls.length,0);
});
