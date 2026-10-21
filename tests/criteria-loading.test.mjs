import test from 'node:test';import assert from 'node:assert/strict';
import {readCriteriaPages,criteriaPagingMissing} from '../criteria-loading.mjs';

function fixture(pages){
  const calls=[];let active=0,maxActive=0;
  const client={rpc(name,args){calls.push({name,args});return{async abortSignal(signal){
    active++;maxActive=Math.max(maxActive,active);await Promise.resolve();active--;
    const next=pages.shift();if(next instanceof Function)return next(signal);
    return next?.error?next:{data:next};
  }};}};
  return{client,calls,get maxActive(){return maxActive;}};
}
const page=(offset,lidos,more,rows=Array.from({length:lidos},(_,i)=>({subitem_id:offset+i})))=>({versao:1,registros:rows,lidos,proximo_offset:offset+lidos,tem_mais:more});

test('lê todos os lotes em sequência usando o avanço da fonte antes da junção',async()=>{
  const first=[{subitem_id:1,matriz:'A'},{subitem_id:1,matriz:'B'},{subitem_id:2,matriz:'A'}];
  const f=fixture([page(0,2,true,first),page(2,1,false,[{subitem_id:3}])]);const progress=[];
  const rows=await readCriteriaPages(f.client,new AbortController().signal,n=>progress.push(n),2);
  assert.deepEqual(rows,[...first,{subitem_id:3}]);assert.deepEqual(progress,[3,4]);
  assert.deepEqual(f.calls.map(c=>c.args),[{p_offset:0,p_limite:2},{p_offset:2,p_limite:2}]);
  assert.ok(f.calls.every(c=>c.name==='nq_criterios_pagina'));assert.equal(f.maxActive,1);
});
test('não usa a quantidade de linhas após a junção como fim da consulta',async()=>{
  const f=fixture([page(0,2,true,[{subitem_id:1},{subitem_id:1},{subitem_id:2},{subitem_id:2}]),page(2,2,false)]);
  assert.equal((await readCriteriaPages(f.client,undefined,undefined,2)).length,6);assert.equal(f.calls.length,2);
});
test('resposta vazia concluída não dispara consultas extras',async()=>{
  const f=fixture([page(0,0,false)]);assert.deepEqual(await readCriteriaPages(f.client),[]);assert.equal(f.calls.length,1);
});
test('falha de um lote rejeita o conjunto e preserva o erro original',async()=>{
  const error={code:'57014',message:'statement timeout'};
  const f=fixture([page(0,2,true),{error}]);await assert.rejects(readCriteriaPages(f.client,undefined,undefined,2),e=>e===error);
  assert.equal(f.calls.length,2);assert.equal(criteriaPagingMissing(error),false);
});
test('cancelamento antes ou durante a leitura impede aplicar resultados',async()=>{
  const c=new AbortController();c.abort();const f=fixture([]);
  await assert.rejects(readCriteriaPages(f.client,c.signal),{name:'AbortError'});assert.equal(f.calls.length,0);
  const c2=new AbortController(),f2=fixture([()=>{c2.abort();return {data:page(0,1,false)};}]);
  await assert.rejects(readCriteriaPages(f2.client,c2.signal),{name:'AbortError'});
});
test('paginação inválida ou que não avança falha sem laço infinito',async()=>{
  for(const data of [null,true,{...page(0,1,false),versao:2},{...page(0,2,true),proximo_offset:0},
    page(0,0,true),{...page(0,2,true),lidos:3},{...page(0,2,true),registros:[]},
    {...page(0,1,false),registros:[null]},{...page(0,0,false),registros:[{}]}]){
    const f=fixture([data]);await assert.rejects(readCriteriaPages(f.client,undefined,undefined,2),{code:'NQ_CRITERIA_PAGING'});assert.equal(f.calls.length,1);
  }
});
test('compatibilidade identifica somente função ainda não instalada',()=>{
  for(const code of ['PGRST202','42883'])assert.equal(criteriaPagingMissing({code}),true);
  for(const code of ['57014','42501','PGRST301','NQ_SOURCE_TIMEOUT'])assert.equal(criteriaPagingMissing({code}),false);
});
