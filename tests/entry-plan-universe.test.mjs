import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSections} from '../navigation.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {groupUAs,filterRecords} from '../core.mjs';
import {entryPlanUniverse,includeMaterialInventory,countWorkflow,otherWorkflowCounts,selectWorkflow,materialTableRows} from '../workflow.mjs';
import {applyPortalComments,commentSourceKey} from '../portal-comments.mjs';
import {resolveEntryPlanNames} from '../pe-names.mjs';
const plan=(id,status='Validado',extra={})=>({monday_item_validacao:String(id),chave_material:'VALIDACAO_PP_'+id,
  id_titulo:'UC_'+id,id_ua:'UC_'+id+'_PP',titulo:'Nome da UC '+id,categoria_material:'Plano de Produção',
  esteira_producao:'Esteira A',matriz_oferta:'E2A RADIAL',semestre_oferta:'2026.2',bloco:'LOTE 2',
  status_validacao:status,origem_material:'validacao_planos',...extra});
function load(materials,criteria=[],forms=[],comments=[]){
  return entryPlanUniverse(resolveEntryPlanNames(includeMaterialInventory(mergeMondayData(
    buildSections(criteria,materials),adaptMondayForms(forms,comments,materials)),materials),materials),materials);
}
test('reproduz a distribuição dos 455 planos do diagnóstico, contando itens e não subelementos',()=>{
  const distribution=[['Validado',318],['Liberado para validação - NQ',56],['A liberar',30],['Ajustes - MODELAGEM',2],['N/A',3],['Pausado',46]];
  const materials=[];let id=0;for(const [status,n] of distribution)for(let i=0;i<n;i++)materials.push(plan(++id,status));
  const rows=load(materials).PE.records;
  assert.deepEqual(countWorkflow(rows),{all:455,released:56,validating:0,design:0,validated:318,other:81});
  assert.deepEqual(Object.fromEntries(otherWorkflowCounts(rows)),{'A liberar':30,'Ajustes - MODELAGEM':2,'N/A':3,'Pausado':46});
  assert.equal(materialTableRows(groupUAs(rows)).length,455);
  assert.equal(groupUAs(selectWorkflow(rows,'validated')).length,318);
});
test('dois IDs de validação com o mesmo código e oferta continuam sendo dois materiais',()=>{
  const first=plan(1),second={...first,monday_item_validacao:'2',chave_material:'VALIDACAO_PP_2',status_validacao:'Pausado'};
  const criteria=[1,2].map(id=>({subitem_id:String(100+id),parent_item_id:String(id),categoria_material:'Plano de Produção',id_ua:first.id_ua,criterio:'Precisão',entra_no_calculo:true}));
  const rows=load([first,second],criteria).PE.records;
  assert.equal(rows.length,2);assert.equal(groupUAs(rows).length,2);
  assert.deepEqual(new Set(rows.map(r=>r.validationItemId)),new Set(['1','2']));
  assert.equal(countWorkflow(rows).validated,1);assert.equal(countWorkflow(rows).other,1);
});
test('status da coluna prevalece sobre o nome do grupo físico da Monday',()=>{
  const rows=load([plan(1,'A liberar',{monday_group_title:'Validados'}),plan(2,'Validado',{monday_group_title:'Aguardando geração PDF do PP'}),plan(3,'N/A',{monday_group_title:'Pausado'})]).PE.records;
  assert.equal(countWorkflow(rows).validated,1);assert.equal(countWorkflow(rows).other,2);
  assert.deepEqual(Object.fromEntries(otherWorkflowCounts(rows)),{'A liberar':1,'N/A':1});
});
test('formulários sem vínculo permanecem visíveis e editáveis, fora dos totais de planos',()=>{
  const form={id:'f1',monday_item_id:'90',nome_item:'OUTRA_UC_PP',categoria_material:'Planilha de Entrada',conceito_final:'Validado'};
  const sections=load([plan(1)],[],[form]);const rows=sections.PE.records;
  assert.equal(rows.length,2);assert.equal(countWorkflow(rows).all,1);assert.equal(countWorkflow(rows).validated,1);
  assert.equal(selectWorkflow(rows,'all').length,2);assert.equal(selectWorkflow(rows,'validated').length,1);
  const unlinked=rows.find(r=>r.sourceEvent==='90');assert.equal(unlinked.workflowEligible,false);
  assert.equal(commentSourceKey(unlinked),'avaliacao:90:metadata');
  const edited=applyPortalComments(sections,[{id:'c1',source_key:'avaliacao:90:metadata',mode:'source',revision:1,body:'Texto preservado'}]);
  assert.equal(edited.PE.records.find(r=>r.sourceEvent==='90').comment,'Texto preservado');
  assert.equal(countWorkflow(edited.PE.records).all,1);
});
test('formulários e critérios vinculados ao plano mantêm suas origens e filtros sem duplicar o material',()=>{
  const material=plan(10,'Em validação');
  const criterion={subitem_id:'100',parent_item_id:'10',id_ua:'UC_10_PP',criterio:'Precisão',categoria_material:'Plano de Produção',entra_no_calculo:true};
  const form={id:'f1',monday_item_id:'90',validacao_material_item_id:'10',nome_item:'UC_10_PP',categoria_material:'Planilha de Entrada'};
  const sections=load([material],[criterion],[form]);const rows=sections.PE.records;
  assert.equal(rows.length,2);assert.equal(groupUAs(rows).length,1);assert.equal(countWorkflow(rows).validating,1);
  assert.deepEqual(rows.map(commentSourceKey),['criterio:100','avaliacao:90:metadata']);
  assert.equal(filterRecords(rows,{track:'Esteira A',batch:'LOTE 2',uc:material.titulo,ua:material.titulo}).length,2);
  assert.equal(filterRecords(rows,{batch:'LOTE 4'}).length,0);
});
test('sinaliza fonte antiga, mantém outras abas e permite um universo instalado sem planos',()=>{
  const legacy={...plan(1)};delete legacy.origem_material;
  assert.equal(load([legacy]).PE.validationSourceReady,false);
  const ua={...plan(2),categoria_material:'Unidade de Aprendizagem',origem_material:'consolidada'};
  const sections=load([ua],[],[{monday_item_id:'90',nome_item:'INEXISTENTE_PP',categoria_material:'Planilha de Entrada'}]);
  assert.equal(sections.PE.validationSourceReady,true);assert.equal(countWorkflow(sections.PE.records).all,0);
  assert.equal(countWorkflow(sections.UA.records).all,1);assert.equal(sections.UA.records[0].workflowEligible,undefined);
});
