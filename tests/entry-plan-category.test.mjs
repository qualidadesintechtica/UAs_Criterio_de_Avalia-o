import test from 'node:test';
import assert from 'node:assert/strict';
import {materialKind,groupUAs,summarize,filterRecords,exportCSV} from '../core.mjs';
import {buildSections} from '../navigation.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {includeMaterialInventory,countWorkflow,selectWorkflow,materialTableRows} from '../workflow.mjs';
import {resolveEntryPlanNames} from '../pe-names.mjs';
import {commentSourceKey,applyPortalComments} from '../portal-comments.mjs';

const code='COA_TESTE_UC_26';
const plan={chave_material:code+'|'+code+'_PP|Plano de Produção',monday_item_validacao:'10',
  id_titulo:code,id_ua:code+'_PP',titulo:'Comunicação e aprendizagem',item_name:code+'_PP',
  categoria_material:'Plano de Produção',matriz_oferta:'Radial',esteira_producao:'Esteira A',
  semestre_oferta:'2026.2',bloco:'LOTE 2',status_validacao:'Em validação',revisor_validador:'Professor A'};
const form={id:'f1',monday_item_id:'90',nome_item:code+'_PP',categoria_material:'Planilha de Entrada',
  conceito_final:'Validado',data_avaliacao:'2026-10-19'};
const criterion={subitem_id:'101',parent_item_id:'10',id_ua:plan.id_ua,categoria_material:plan.categoria_material,
  criterio:'Precisão',entra_no_calculo:true,apontamos_inconformidade:'Não',parecer_especialista:'Texto original',
  classificacao_feita_por:'Especialista A'};
function load(materials=[plan],forms=[form],criteria=[],notes=[]){
  return resolveEntryPlanNames(includeMaterialInventory(
    mergeMondayData(buildSections(criteria,materials),adaptMondayForms(forms,notes,materials)),materials),materials);
}

test('Plano de Produção e Planilha de entrada alimentam a mesma aba, sem classificar categorias parecidas',()=>{
  for(const category of ['Plano de Produção','plano de producao','  PLANO  DE  PRODUÇÃO  ','Planilha de Entrada','PE'])
    assert.equal(materialKind({categoria_material:category}),'PE',category);
  for(const category of ['Plano de ensino','Plano de Produção adicional','Produção','PP',''])
    assert.equal(materialKind({categoria_material:category}),null,category);
});
test('planos de produção sem formulário passam a compor a tabela e o status real',()=>{
  const sections=load([plan,plan],[]);const rows=sections.PE.records;
  assert.equal(rows.length,1);assert.equal(materialTableRows(groupUAs(rows)).length,1);
  assert.equal(rows[0].ua,plan.titulo);assert.equal(rows[0].uc,plan.titulo);
  assert.equal(countWorkflow(rows).validating,1);assert.equal(summarize(rows).total,0);
  for(const kind of ['UA','BDQ','UC'])assert.equal(sections[kind].records.length,0);
});
test('formulário PE e material Plano de Produção contam uma planilha e usam o status da validação',()=>{
  const rows=load().PE.records;
  assert.equal(groupUAs(rows).length,1);assert.equal(rows.length,1);assert.equal(materialTableRows(groupUAs(rows)).length,1);
  assert.equal(rows[0].materialKey,plan.chave_material);assert.equal(rows[0].materialStatus,'Em validação');
  assert.equal(countWorkflow(rows).all,1);assert.equal(countWorkflow(rows).validating,1);
  assert.equal(countWorkflow(rows).validated,0);assert.equal(selectWorkflow(rows,'validating').length,1);
});
test('critérios, formulário e pareceres da mesma planilha não criam materiais duplicados',()=>{
  const notes=[{id:'note1',monday_item_id:'90',nome_item:form.nome_item,categoria_material:'Plano de Produção',
    criterio_id:'c1',criterio_titulo:'Parecer',parecer:'Revisar a organização'}];
  const rows=load([plan],[form],[criterion],notes).PE.records;
  assert.equal(rows.length,2);assert.equal(groupUAs(rows).length,1);assert.equal(materialTableRows(groupUAs(rows)).length,1);
  assert.equal(summarize(rows).total,1);assert.equal(summarize(rows).good,1);assert.equal(summarize(rows).assessed,1);
  assert.equal(countWorkflow(rows).validating,1);assert.equal(groupUAs(rows)[0].comments.length,2);
});
test('reconhece também a categoria Plano de Produção em formulários e pareceres sem avaliação',()=>{
  assert.equal(load([plan],[{...form,categoria_material:'Plano de Produção'}]).PE.records[0].sourceEvent,'90');
  const rows=load([plan],[],[],[{id:'note1',monday_item_id:'90',nome_item:form.nome_item,
    categoria_material:'Plano de Produção',parecer:'Comentário Monday'}]).PE.records;
  assert.equal(rows.length,1);assert.equal(rows[0].comment,'Comentário Monday');assert.equal(summarize(rows).assessed,0);
});
test('vincula pelo ID do item e também por UC ou título exato quando não há código PP no material',()=>{
  const noUA={...plan,id_ua:null};
  for(const f of [{...form,validacao_material_item_id:'10'},{...form},{...form,nome_item:plan.titulo}]){
    const rows=load([noUA],[f],[{...criterion,id_ua:null}]).PE.records;
    assert.equal(groupUAs(rows).length,1);assert.equal(rows.length,2);assert.equal(rows[1].parent,'10');
    assert.equal(rows[1].materialKey,plan.chave_material);
  }
});
test('planilha recebe o próprio status e nunca o status de uma UA da mesma UC',()=>{
  const ua={...plan,chave_material:'UA1',monday_item_validacao:'20',id_ua:code+'_UA01',
    categoria_material:'Unidade de Aprendizagem',status_validacao:'Validado'};
  const rows=load([ua,plan],[{...form,validacao_material_item_id:'20'}]).PE.records;
  assert.equal(rows[0].materialKey,plan.chave_material);assert.equal(rows[0].materialStatus,'Em validação');
});
test('lotes diferentes são mantidos e a matriz do formulário pode identificar sua oferta',()=>{
  const other={...plan,chave_material:'outro-plano',monday_item_validacao:'11',bloco:'LOTE 4',matriz_oferta:'Híbrida',status_validacao:'Validado'};
  const rows=load([plan,other],[{...form,matriz_oferta:'Híbrida'}]).PE.records;
  assert.equal(groupUAs(rows).length,2);assert.equal(rows.find(r=>r.sourceEvent==='90').materialKey,'outro-plano');
  assert.deepEqual(countWorkflow(rows),{all:2,released:0,validating:1,design:0,validated:1,other:0});
});
test('não escolhe um plano arbitrário quando há dois itens para a mesma UC e oferta',()=>{
  const other={...plan,chave_material:'outro-plano',monday_item_validacao:'11',status_validacao:'Validado'};
  const row=adaptMondayForms([form],[],[plan,other]).records[0];
  assert.equal(row.materialKey,'');assert.equal(row.materialStatus,form.conceito_final);
  assert.equal(adaptMondayForms([{...form,validacao_material_item_id:'10'}],[],[plan,other]).records[0].materialKey,plan.chave_material);
});
test('filtros e exportação incluem plano de produção, com nomes e códigos preservados',()=>{
  const rows=load([plan],[],[criterion]).PE.records;
  assert.equal(filterRecords(rows,{track:'Esteira A',batch:'LOTE 2',uc:plan.titulo,ua:plan.titulo,
    reviewers:'Professor A',specialists:'Especialista A'}).length,1);
  assert.equal(filterRecords(rows,{},code+'_PP').length,1);
  assert.ok(exportCSV(rows).includes(plan.titulo));assert.ok(exportCSV(rows).includes(plan.id_ua));
});
test('edições e histórico continuam vinculados às mesmas origens Monday após reunir a planilha',()=>{
  const old={...criterion,subitem_id:'100',data_classificacao_especialista:'2026-10-16',parecer_especialista:'Primeiro parecer'};
  const sections=load([plan],[form],[old,{...criterion,data_classificacao_especialista:'2026-10-19'}]);
  const rows=applyPortalComments(sections,[
    {id:'edit1',source_key:'criterio:101',mode:'source',body:'Texto editado',revision:2},
    {id:'add1',source_key:'material:'+plan.chave_material,mode:'addition',body:'Complemento',revision:1}
  ]).PE.records;
  const current=rows.find(r=>r.id==='101');
  assert.equal(commentSourceKey(current),'criterio:101');assert.equal(current.comment,'Texto editado');
  assert.equal(current.mondayComment,'Texto original');assert.equal(current.history[0].comment,'Primeiro parecer');
  assert.equal(current.portal.revision,2);assert.equal(rows.filter(r=>r.portal?.id==='add1').length,1);
  assert.equal(groupUAs(rows).length,1);assert.equal(summarize(rows).total,1);
});
