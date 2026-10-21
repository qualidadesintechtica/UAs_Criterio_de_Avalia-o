import test from 'node:test';
import assert from 'node:assert/strict';
import {queryWithDeadline,connectionMessage} from '../source-loading.mjs';
import {mergeEntryPlanMaterials,entryPlanUniverse} from '../workflow.mjs';
test('consulta concluída mantém o resultado e não cancela as demais fontes',async()=>{
  const parent=new AbortController();let ownSignal;
  assert.deepEqual(await queryWithDeadline(signal=>{ownSignal=signal;return ['material'];},parent.signal,100),['material']);
  assert.equal(parent.signal.aborted,false);assert.equal(ownSignal.aborted,false);
});
test('consulta de planos travada tem prazo próprio, preservando fontes que concluíram',async()=>{
  const parent=new AbortController();let planSignal;
  const results=await Promise.allSettled([
    queryWithDeadline(()=>['UA'],parent.signal,100),
    queryWithDeadline(signal=>{planSignal=signal;return new Promise(()=>{});},parent.signal,10)
  ]);
  assert.deepEqual(results[0],{status:'fulfilled',value:['UA']});
  assert.equal(results[1].reason.code,'NQ_SOURCE_TIMEOUT');assert.equal(planSignal.aborted,true);
  assert.equal(parent.signal.aborted,false);
});
test('cancelamento da sessão interrompe a consulta pendente e rejeita uma consulta já cancelada',async()=>{
  const controller=new AbortController();const pending=queryWithDeadline(()=>new Promise(()=>{}),controller.signal,100);
  controller.abort();await assert.rejects(pending,{name:'AbortError'});
  let called=false;await assert.rejects(queryWithDeadline(()=>{called=true;},controller.signal),{name:'AbortError'});
  assert.equal(called,false);
});
test('erros da fonte são preservados sem serem convertidos em tempo excedido',async()=>{
  const error={code:'PGRST205',message:'view not found'};
  await assert.rejects(queryWithDeadline(()=>Promise.reject(error),undefined,100),e=>e===error);
});
test('distingue statement timeout, limite de carregamento e falha de comunicação',()=>{
  assert.match(connectionMessage({code:'57014',message:'canceling statement due to statement timeout'}),/banco/);
  assert.match(connectionMessage({code:'NQ_SOURCE_TIMEOUT'}),/limite de tempo/);
  assert.match(connectionMessage({name:'AbortError'}),/limite de tempo/);
  assert.match(connectionMessage({message:'Failed to fetch'}),/comunicação/);
  assert.equal(connectionMessage({code:'42501',message:'permission denied'}),'');
  assert.ok(!connectionMessage({code:'57014'}).includes('internet'));
  assert.match(connectionMessage({code:'57014'}),/10_CRITERIOS_PAGINADOS/);
  assert.ok(!connectionMessage({code:'57014'}).includes('SQL 07'));
});
test('combina planos da fonte própria sem repetir o material legado do mesmo item',()=>{
  const ua={categoria_material:'Unidade de Aprendizagem',monday_item_validacao:'1'};
  const legacy={categoria_material:'Plano de Produção',monday_item_validacao:'2',chave_material:'legado'};
  const plan={...legacy,chave_material:'VALIDACAO_PP_2',origem_material:'validacao_planos'};
  const other={...legacy,monday_item_validacao:'3'};
  assert.deepEqual(mergeEntryPlanMaterials([ua,legacy,other],[plan]),[ua,other,plan]);
});
test('fonte vazia consultada com sucesso é diferente de fonte indisponível',()=>{
  const sections={PE:{records:[]},UA:{records:[]}};
  assert.equal(entryPlanUniverse(sections,[],true).PE.validationSourceReady,true);
  assert.equal(entryPlanUniverse(sections,[{origem_material:'consolidada'}],false).PE.validationSourceReady,false);
});
