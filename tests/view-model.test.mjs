import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecords,groupUAs,summarize} from '../core.mjs';
import {uaOutcome,countUAOutcomes,selectUAOutcome,highlightHTML} from '../view-model.mjs';
const base={parent_item_id:'1',id_ua:'UA1',matriz_oferta:'Radial',esteira_producao:'Graduação',categoria_material:'Unidade de Aprendizagem',classificacao_feita_por:'Especialista A',entra_no_calculo:true,apontamos_inconformidade:'Não',data_classificacao_especialista:'2026-10-01'};
const make=(id,fields={})=>({...base,subitem_id:String(id),criterio:'Critério '+id,...fields});
test('cartão de inconformidade preserva os outros critérios da mesma UA',()=>{
  const {records}=buildRecords([make(1,{apontamos_inconformidade:'Sim'}),make(2),make(3,{parent_item_id:'2',id_ua:'UA2'})],[]);
  const selected=selectUAOutcome(records,'bad');assert.equal(selected.length,2);assert.equal(summarize(selected).good,1);assert.equal(summarize(selected).bad,1);
});
test('contagens dos cartões são exclusivas e somam o total de UAs',()=>{
  const {records}=buildRecords([make(1,{apontamos_inconformidade:'Sim'}),make(2),make(3,{parent_item_id:'2',id_ua:'UA2'}),make(4,{parent_item_id:'3',id_ua:'UA3',entra_no_calculo:false})],[]);
  assert.deepEqual(countUAOutcomes(records),{all:3,good:1,bad:1,pending:1});
});
test('UA com critérios conformes e pendentes mantém a pendência visível',()=>{
  const {records}=buildRecords([make(1),make(2,{entra_no_calculo:false})],[]);const group=groupUAs(records)[0];
  assert.equal(uaOutcome(group),'good');assert.equal(group.summary.pending,1);assert.equal(selectUAOutcome(records,'good').length,2);
});
test('histórico mostra parecer anterior sem contabilizá-lo como avaliação vigente',()=>{
  const {records}=buildRecords([make(1,{criterio:'Precisão',parecer_especialista:'Corrigir.',apontamos_inconformidade:'Sim'}),make(2,{criterio:'Precisão',parecer_especialista:'Corrigido.',data_classificacao_especialista:'2026-10-03'})],[]);
  assert.equal(records.length,1);assert.equal(records[0].comment,'Corrigido.');assert.equal(records[0].history.length,1);assert.equal(records[0].history[0].comment,'Corrigir.');assert.equal(summarize(records).bad,0);
});
test('destaca palavras com acentos sem permitir HTML no comentário',()=>{
  assert.equal(highlightHTML('<img src=x> referência & revisão','REFERENCIA'),'&lt;img src=x&gt; <mark>referência</mark> &amp; revisão');
  assert.equal(highlightHTML('<script>','script'),'&lt;<mark>script</mark>&gt;');
});
test('destaque preserva Unicode com acento combinado e repetições',()=>{
  assert.equal(highlightHTML('revisa\u0303o e revisão','revisao'),'<mark>revisa\u0303o</mark> e <mark>revisão</mark>');
  assert.equal(highlightHTML('📚 revisão','revisao'),'📚 <mark>revisão</mark>');
});
test('recorte vazio apresenta zero UAs em todos os cartões',()=>{
  assert.deepEqual(countUAOutcomes([]),{all:0,good:0,bad:0,pending:0});assert.deepEqual(selectUAOutcome([],'bad'),[]);
});
