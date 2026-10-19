import test from 'node:test';
import assert from 'node:assert/strict';
import {materialKind,bdqAssessmentType,groupUAs,filterRecords,exportCSV} from '../core.mjs';
import {buildSections} from '../navigation.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {includeMaterialInventory,workflowStatus,countWorkflow,mergeBDQValidationMaterials} from '../workflow.mjs';
import {applyPortalComments,commentSourceKey} from '../portal-comments.mjs';
const bank=type=>({chave_material:'BDQ_'+type,monday_item_validacao:'70'+type.slice(1),id_titulo:'UC_TESTE',
  id_ua:'UC_TESTE_'+type,titulo:'Nome da UC',item_name:'Banco de questões '+type,categoria_material:'Avaliação '+type,
  matriz_oferta:'E2A RADIAL',esteira_producao:'Esteira A',semestre_oferta:'2026.2',bloco:'LOTE 2',
  status_validacao:'Ajustes - MODELAGEM',gestor_validacao_nq:'Gestor '+type,revisor_validador:'Revisor '+type});
function load(materials,forms=[],notes=[],criteria=[]){return includeMaterialInventory(mergeMondayData(buildSections(criteria,materials),adaptMondayForms(forms,notes,materials)),materials);}
test('Modelagem e Modelagens entram em Requer análise do design em todas as abas',()=>{
  for(const value of ['Ajustes - MODELAGEM','Ajustes - Modelagens','Em ajustes - MODELAGEM','Ajustes – Modelagem','  AJUSTES  -  MODELAGEM  '])assert.equal(workflowStatus(value),'design',value);
  assert.equal(workflowStatus('Ajustes - GERÊNCIA DE TECNOLOGIA'),'other');
  for(const kind of ['PE','UA','BDQ','UC'])assert.equal(countWorkflow([{kind,uaKey:kind,uc:'UC',ua:'Material',specialists:[],reviewers:[],materialStatus:'Ajustes - MODELAGEM'}]).design,1);
});
test('BDQ reconhece A1, A2 e A3 sem aceitar A4 ou confundir categorias',()=>{
  for(const type of ['A1','A2','A3']){
    assert.equal(materialKind({categoria_material:'Avaliação '+type}),'BDQ');
    assert.equal(materialKind({categoria_material:type}),'BDQ');
    assert.equal(bdqAssessmentType(bank(type)),type);
    assert.equal(bdqAssessmentType({categoria_material:'BDQ',nome_item:'UC_TESTE_'+type}),type);
  }
  assert.equal(materialKind({categoria_material:'Avaliação A4'}),null);
  assert.equal(bdqAssessmentType({categoria_material:'BDQ',nome_item:'SEM_TIPO'}),'');
});
test('inventário mostra os três bancos separadamente com gestor e revisor reais',()=>{
  const rows=load(['A1','A2','A3'].map(bank)).BDQ.records;assert.equal(rows.length,3);assert.equal(groupUAs(rows).length,3);
  assert.deepEqual(new Set(rows.map(r=>r.assessmentType)),new Set(['A1','A2','A3']));
  for(const row of rows){assert.deepEqual(row.managers,['Gestor '+row.assessmentType]);assert.deepEqual(row.assignedReviewers,['Revisor '+row.assessmentType]);}
  assert.equal(countWorkflow(rows).design,3);
});
test('A2 vincula por código exato, preserva o avaliador e mostra o revisor atribuído',()=>{
  const material=bank('A2');
  const form={id:'f2',monday_item_id:'90',nome_item:'UC_TESTE_A2',categoria_material:'Avaliação A2',avaliador:'Avaliador do formulário',conceito_final:'Validado'};
  const rows=load([material],[form]).BDQ.records;assert.equal(rows.length,1);
  const row=rows[0];assert.equal(row.uc,'Nome da UC');assert.equal(row.ucId,'UC_TESTE');assert.equal(row.assessmentType,'A2');
  assert.deepEqual(row.managers,['Gestor A2']);assert.deepEqual(row.assignedReviewers,['Revisor A2']);
  assert.deepEqual(row.reviewers,['Avaliador do formulário','Revisor A2']);
  assert.equal(commentSourceKey(row),'avaliacao:90:metadata');assert.equal(countWorkflow(rows).design,1);
  assert.equal(filterRecords(rows,{reviewers:'Revisor A2'}).length,1);
  assert.equal(filterRecords(rows,{reviewers:'Avaliador do formulário'}).length,1);
});
test('parecer A2 mantém sua origem, gestor, revisor e edição com histórico',()=>{
  const material=bank('A2');const note={id:'nota2',monday_item_id:'90',nome_item:material.id_ua,categoria_material:material.categoria_material,parecer:'Original Monday',avaliador:'Avaliador'};
  const sections=load([material],[],[note]);const key=commentSourceKey(sections.BDQ.records[0]);
  assert.equal(key,'parecer:nota2');
  const row=applyPortalComments(sections,[{id:'salvo',source_key:key,mode:'source',revision:2,body:'Edição do professor'}]).BDQ.records[0];
  assert.equal(row.comment,'Edição do professor');assert.equal(row.mondayComment,'Original Monday');assert.equal(row.portal.revision,2);
  assert.deepEqual(row.managers,['Gestor A2']);assert.deepEqual(row.assignedReviewers,['Revisor A2']);
});
test('gestor e revisor não são herdados de uma UA ou de uma oferta ambígua',()=>{
  const material=bank('A2'),other={...material,monday_item_validacao:'999',chave_material:'OUTRO',esteira_producao:'Esteira B',gestor_validacao_nq:'Outro gestor'};
  const form={monday_item_id:'90',nome_item:material.id_ua,categoria_material:'Avaliação A2'};
  for(const materials of [[material,other],[{...material,id_ua:'UC_TESTE_UA01',categoria_material:'Unidade de Aprendizagem'}]]){
    const row=adaptMondayForms([form],[],materials).records[0];
    assert.deepEqual(row.managers,[]);assert.deepEqual(row.assignedReviewers,[]);
  }
});
test('critério sem vínculo com inventário conserva o gestor e revisor da própria fonte',()=>{
  const criterion={subitem_id:'c2',parent_item_id:'702',id_ua:'UC_TESTE_A2',categoria_material:'Avaliação A2',criterio:'Precisão',gestor_validacao_nq:'Gestor da fonte',revisor_validador:'Revisor da fonte'};
  const row=buildSections([criterion],[]).BDQ.records[0];assert.deepEqual(row.managers,['Gestor da fonte']);assert.deepEqual(row.assignedReviewers,['Revisor da fonte']);
});
test('busca e CSV incluem gestor, revisor atribuído e tipo A2, mantendo as colunas anteriores',()=>{
  const rows=load([bank('A2')]).BDQ.records;
  assert.equal(filterRecords(rows,{},'Gestor A2').length,1);assert.equal(filterRecords(rows,{},'Revisor A2').length,1);
  const csv=exportCSV(rows);assert.ok(csv.includes('"Gestor do material";"Revisor atribuído na validação";"Tipo de BDQ"'));
  assert.ok(csv.includes('"Gestor A2";"Revisor A2";"A2"'));
  assert.ok(csv.startsWith('\ufeff"Categoria";"Esteira";"UC";"ID UC"'));
});
test('consulta direta completa BDQs ausentes e atualiza responsáveis sem trocar a chave dos existentes',()=>{
  const existing=bank('A1'),a2={...bank('A2'),chave_material:'VALIDACAO_BDQ_702'},currentA1={...existing,chave_material:'VALIDACAO_BDQ_701',gestor_validacao_nq:'Gestor atual',revisor_validador:'Revisor atual'};
  const ua={...bank('A3'),categoria_material:'Unidade de Aprendizagem',chave_material:'UA'};
  const merged=mergeBDQValidationMaterials([existing,ua],[currentA1,a2]);
  assert.equal(merged.length,3);assert.equal(merged[0].chave_material,existing.chave_material);
  assert.equal(merged[0].gestor_validacao_nq,'Gestor atual');assert.equal(merged[0].revisor_validador,'Revisor atual');
  assert.strictEqual(merged[1],ua);assert.equal(merged[2].chave_material,'VALIDACAO_BDQ_702');
  assert.deepEqual(mergeBDQValidationMaterials(merged,[currentA1,a2]),merged);
  assert.equal(load(merged).BDQ.records.length,2);
});
test('vínculo de um formulário A2 com uma UA não transfere responsáveis da UA ao banco',()=>{
  const ua={...bank('A2'),categoria_material:'Unidade de Aprendizagem',id_ua:'UC_TESTE_UA01'};
  const row=adaptMondayForms([{monday_item_id:'90',validacao_material_item_id:ua.monday_item_validacao,nome_item:'UC_TESTE_A2',categoria_material:'Avaliação A2'}],[],[ua]).records[0];
  assert.deepEqual(row.managers,[]);assert.deepEqual(row.assignedReviewers,[]);
});
