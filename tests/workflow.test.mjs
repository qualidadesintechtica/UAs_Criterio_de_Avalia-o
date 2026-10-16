import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecords,filterRecords,groupUAs,summarize,unitLabel} from '../core.mjs';
import {buildSections} from '../navigation.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {WORKFLOW_LABELS,workflowStatus,countWorkflow,selectWorkflow,filterOptions,includeMaterialInventory,materialTableRows} from '../workflow.mjs';
import {applyPortalComments,commentSourceKey} from '../portal-comments.mjs';

const material={chave_material:'UC01|UA01|UA',monday_item_validacao:'10',id_titulo:'UC01',id_ua:'UC01_UA01',titulo:'Curso',titulo_ua:'Título da UA',item_name:'UNIDADE 01',categoria_material:'Unidade de Aprendizagem',esteira_producao:'Esteira A',matriz_oferta:'2026',semestre_oferta:'2026.2',bloco:'LOTE 2',status_validacao:'Liberado para Validação',revisor_validador:'Professor'};
const criterion={subitem_id:'101',parent_item_id:'10',id_ua:'UC01_UA01',categoria_material:'Unidade de Aprendizagem',criterio:'Recursos',entra_no_calculo:true,apontamos_inconformidade:'Sim',classificacao_feita_por:'Especialista',revisor_validador:'Professor',parecer_especialista:'Original'};
test('cartões usam status reais, sem transformar inconformidade em análise do design',()=>{
  for(const [value,expected] of [['Liberado para Validação','released'],['Liberado para validação - NQ','released'],['Liberada','released'],['Em validação','validating'],['Em Validação - NQ','validating'],['Requer análise do design','design'],['Requer análise do Design de Aprendizagem','design'],['Ajustes - Conteúdistas e DA','design'],['Validado','validated'],['Validadas','validated'],['Pausado','other'],['Não validado','other'],['Revalidar - NQ','other'],['','other']])assert.equal(workflowStatus(value),expected,value);
  const records=buildRecords([criterion],[material]).records;
  assert.equal(records[0].status,'bad');assert.equal(countWorkflow(records).released,1);assert.equal(countWorkflow(records).design,0);
  assert.equal(WORKFLOW_LABELS.design,'Requer análise do design');
});
test('seleção de status mantém todos os critérios e comentários do material',()=>{
  const rows=buildRecords([criterion,{...criterion,subitem_id:'102',criterio:'Referências',apontamos_inconformidade:'Não'}],[material]).records;
  assert.equal(selectWorkflow(rows,'released').length,2);assert.equal(selectWorkflow(rows,'design').length,0);
  assert.deepEqual(countWorkflow(rows),{all:1,released:1,validating:0,design:0,validated:0,other:0});
});
test('lote e unidade vêm de campos da fonte, sem alterar o nome da UA',()=>{
  const record=buildRecords([criterion],[material]).records[0];
  assert.equal(record.batch,'LOTE 2');assert.equal(record.unitLabel,'UNIDADE 01');assert.equal(record.ua,'Título da UA');
  assert.equal(unitLabel({id_ua:'CURSO_UA03'}),'UNIDADE 03');assert.equal(unitLabel({item_name:'Outro título'}),'');
  assert.equal(filterRecords([record],{batch:'LOTE 2'}).length,1);assert.equal(filterRecords([record],{batch:'LOTE 3'}).length,0);
});
test('não funde ofertas ou lotes distintos do mesmo material',()=>{
  const second={...material,chave_material:'outro',monday_item_validacao:'11',bloco:'LOTE 3'};
  const rows=buildRecords([criterion,{...criterion,subitem_id:'103',parent_item_id:'11'}],[material,second]).records;
  assert.equal(groupUAs(rows).length,2);assert.deepEqual(new Set(rows.map(r=>r.batch)),new Set(['LOTE 2','LOTE 3']));
});
test('catálogo de esteiras é o mesmo inclusive na planilha de entrada',()=>{
  const sections={PE:{records:[{track:'Esteira P'}]},UA:{records:[{track:'Esteira A'}]},UC:{records:[{track:'Esteira C'}]},BDQ:{records:[{track:'Esteira B'}]}};
  assert.deepEqual(filterOptions(sections,'track',{batch:'LOTE 99'}).values,['Esteira A','Esteira B','Esteira C','Esteira P']);
});
test('os seis filtros funcionam em todas as categorias e a escolha continua disponível em recorte vazio',()=>{
  const base={track:'Esteira A',batch:'LOTE 2',uc:'Curso',ua:'UA 1',reviewers:['Professor'],specialists:['Especialista']};
  const filters={track:'Esteira A',batch:'LOTE 2',uc:'Curso',ua:'UA 1',reviewers:'Professor',specialists:'Especialista'};
  const sections=Object.fromEntries(['PE','UA','UC','BDQ'].map(kind=>[kind,{records:[{...base,kind}]}]));
  for(const section of Object.values(sections))assert.equal(filterRecords(section.records,filters).length,1);
  assert.deepEqual(filterOptions(sections,'batch',{track:'Esteira ausente',batch:'LOTE 2'}).values,['LOTE 2']);
  assert.deepEqual(filterOptions(sections,'batch',{batch:'lote 2'}).values,['lote 2']);
  assert.equal(filterRecords([{...base,batch:''}],{batch:'__missing__'}).length,1);
  assert.equal(filterRecords([{...base,track:'Não informada'}],{track:'__missing__'}).length,1);
});
test('materiais liberados aparecem mesmo antes de receber um formulário, sem duplicar a avaliação existente',()=>{
  const existing=buildSections([criterion],[material]);includeMaterialInventory(existing,[material]);assert.equal(existing.UA.records.length,1);
  const sections=includeMaterialInventory(buildSections([],[]),[material,material]);
  assert.equal(sections.UA.records.length,1);assert.equal(countWorkflow(sections.UA.records).released,1);
  assert.equal(summarize(sections.UA.records).total,0);assert.equal(commentSourceKey(sections.UA.records[0]),'material:'+material.chave_material);
});
test('planilha associa o código PP ou título exato à UC e herda apenas o contexto comum das UAs',()=>{
  const pe={id:'f1',monday_item_id:'90',nome_item:'UC01_PP',categoria_material:'Planilha de Entrada',conceito_final:'Ajustes - Conteúdistas e DA'};
  const m2={...material,chave_material:'m2',monday_item_validacao:'11',id_ua:'UC01_UA02',titulo_ua:'UA 2',item_name:'UNIDADE 02'};
  for(const name of ['UC01_PP','Curso']){
    const r=adaptMondayForms([{...pe,nome_item:name}],[],[material,m2]).records[0];
    assert.equal(r.ucId,'UC01');assert.equal(r.uc,'Curso');assert.equal(r.track,'Esteira A');assert.equal(r.batch,'LOTE 2');
    assert.equal(r.materialStatus,pe.conceito_final);assert.equal(r.unitLabel,'');
  }
});
test('não atribui lote ou esteira de uma oferta arbitrária à planilha de entrada',()=>{
  const pe={id:'f1',monday_item_id:'90',nome_item:'UC01_PP',categoria_material:'Planilha de Entrada'};
  const r=adaptMondayForms([pe],[],[material,{...material,esteira_producao:'Esteira B',bloco:'LOTE 3',id_ua:'UC01_UA02'}]).records[0];
  assert.equal(r.track,'Não informada');assert.equal(r.batch,'');assert.equal(r.ucId,'UC01');
});
test('unidade de uma UC sem vínculo exato não herda a unidade de outra UA',()=>{
  const form={id:'f2',monday_item_id:'92',nome_item:'UC01_UA02',categoria_material:'UC',conceito_final:'Validado'};
  const r=adaptMondayForms([form],[],[material]).records[0];
  assert.equal(r.unitLabel,'UNIDADE 02');assert.equal(r.displayUA,'UC01_UA02');
  assert.equal(r.materialStatus,'Validado');assert.equal(r.track,'Esteira A');
});
test('UC conserva seus indicadores e agrega nomes e unidades da UA para a tabela e para o filtro',()=>{
  const forms=[1,2].map(n=>({id:'f'+n,monday_item_id:String(90+n),nome_item:'UC01_UA0'+n,categoria_material:'UC',indicador_1:'Excelente',indicador_1_score:1}));
  const materials=[material,{...material,id_ua:'UC01_UA02',titulo_ua:'Outra UA',item_name:'UNIDADE 02'}];
  const records=adaptMondayForms(forms,[],materials).records;
  assert.equal(records.length,14);const groups=groupUAs(records);assert.equal(groups.length,1);
  assert.deepEqual(groups[0].presentationItems.map(r=>r.unit),['UNIDADE 01','UNIDADE 02']);
  const table=materialTableRows(groups);assert.equal(table.length,2);
  assert.deepEqual(table.map(r=>r.unit),['UNIDADE 01','UNIDADE 02']);
  assert.ok(table.every(r=>r.detailIndex===0&&r.group.criteria.length===14));
  assert.equal(filterRecords(records,{ua:'Outra UA'}).length,7);
  assert.equal(summarize(records).rated,2);
});
test('comentário de um material continua visível quando os critérios chegam depois',()=>{
  const note={id:'n1',source_key:'material:'+material.chave_material,mode:'addition',body:'Complemento do professor',revision:1};
  const initial=includeMaterialInventory(buildSections([],[]),[material]);
  assert.equal(applyPortalComments(initial,[note]).UA.records.length,2);
  const evaluated=buildSections([criterion,{...criterion,subitem_id:'102',criterio:'Referências'}],[material]);
  const rows=applyPortalComments(evaluated,[note]).UA.records;
  assert.equal(rows.length,3);assert.equal(rows.filter(r=>r.portal?.id==='n1').length,1);assert.equal(summarize(rows).total,2);
});
