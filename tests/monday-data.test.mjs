import test from 'node:test';
import assert from 'node:assert/strict';
import {materialKind,groupUAs,summarize} from '../core.mjs';
import {buildSections} from '../navigation.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {uaOutcome} from '../view-model.mjs';
const material={monday_item_validacao:'10',id_titulo:'UC_SAU_TESTE_26',id_ua:'UC_SAU_TESTE_26_UA01',titulo:'Saúde e sociedade',item_name:'UNIDADE 01',matriz_oferta:'Radial',esteira_producao:'Graduação',semestre_oferta:'2026.2',categoria_material:'Unidade de Aprendizagem',eh_ua:true,status_validacao:'Validado'};
const form={id:'form1',monday_item_id:'100',nome_item:'UC_SAU_TESTE_26_UA01',avaliador:'Revisor real',categoria_material:'UC',data_avaliacao:'2026-10-14',synced_at:'2026-10-14T20:00:00Z',conceito_final:'Validado',indicador_1:'Excelente',indicador_1_score:1};
test('menu reconhece as categorias reais, incluindo A1 e A3 como BDQ',()=>{
  for(const [category,kind] of [['Planilha de Entrada','PE'],['Unidade de Aprendizagem','UA'],['UC','UC'],['Avaliação A1','BDQ'],['Avaliação A3','BDQ']])assert.equal(materialKind({categoria_material:category}),kind);
  assert.equal(materialKind({categoria_material:'Plano de Produção'}),'PE');
});
test('cada seção recebe somente sua categoria',()=>{
  const rows=['Planilha de Entrada','Unidade de Aprendizagem','Avaliação A1','UC'].map((category,i)=>({categoria_material:category,subitem_id:String(i),parent_item_id:String(i+10),criterio:'Critério',entra_no_calculo:true}));
  const result=buildSections(rows,[]);for(const key of ['PE','UA','BDQ','UC'])assert.equal(result[key].records.length,1);
});
test('conceitos da UC mantêm a pontuação e os campos sem classificação',()=>{
  const {records}=adaptMondayForms([form],[],[material]);const summary=summarize(records);
  assert.equal(records.length,7);assert.equal(records[0].classification,'Excelente');assert.equal(summary.rated,1);assert.equal(summary.pending,6);assert.equal(summary.score,1);assert.equal(summary.rate,null);
});
test('UC agrupa as avaliações de UAs diferentes e mantém seus indicadores',()=>{
  const second={...form,id:'form2',monday_item_id:'101',nome_item:'UC_SAU_TESTE_26_UA02'};
  const secondMaterial={...material,monday_item_validacao:'11',id_ua:second.nome_item};
  const {records}=adaptMondayForms([form,second],[],[material,secondMaterial]);assert.equal(groupUAs(records).length,1);assert.equal(records.length,14);
});
test('parecer textual não cria uma reprovação nem uma conformidade',()=>{
  const comment={id:'comment1',monday_item_id:'200',nome_item:'UC_SAU_TESTE_26_A1',categoria_material:'Avaliação A1',avaliador:'Revisor real',numero_criterio:3,criterio_titulo:'Complexidade',parecer:'Revisar o nível da questão.'};
  const {records}=adaptMondayForms([], [comment], [material]);assert.equal(records[0].kind,'BDQ');assert.equal(records[0].status,'comment');assert.equal(summarize(records).total,0);assert.equal(groupUAs(records)[0].comments.length,1);
});
test('registro de formulário sem resposta continua visível',()=>{
  const {records}=adaptMondayForms([{...form,categoria_material:'Avaliação A3',nome_item:'UC_SAU_TESTE_26_A3',indicador_1:null}],[],[material]);assert.equal(records.length,1);assert.equal(records[0].metadataOnly,true);assert.equal(summarize(records).assessed,0);
});
test('status atual da esteira prevalece sobre o conceito antigo do formulário',()=>{
  const {records}=adaptMondayForms([{...form,conceito_final:'Ajustes - Conteudistas e DA'}],[],[material]);assert.equal(records[0].materialStatus,'Validado');assert.equal(uaOutcome(groupUAs(records)[0]),'good');
});
test('não associa cursos apenas por nomes parecidos',()=>{
  const wrong={...material,id_titulo:'OUTRA_UC',id_ua:'OUTRA_UC_UA01',titulo:'Saúde e sociedade avançada'};
  const {records}=adaptMondayForms([form],[],[wrong]);assert.equal(records[0].ucId,'UC_SAU_TESTE_26');assert.equal(records[0].unmatched,true);
});
test('integra o parecer sem substituir a classificação formal da esteira',()=>{
  const raw={categoria_material:'Unidade de Aprendizagem',subitem_id:'1',parent_item_id:'10',id_ua:material.id_ua,matriz_oferta:'Radial',esteira_producao:'Graduação',criterio:'Recursos',entra_no_calculo:true,apontamos_inconformidade:'Não'};
  const note={id:'comment1',monday_item_id:'200',nome_item:material.id_ua,categoria_material:'Unidade de Aprendizagem',avaliador:'Revisor real',criterio_id:'recursos',criterio_titulo:'Recursos',parecer:'Sugestão de melhoria.'};
  const sections=mergeMondayData(buildSections([raw],[material]),adaptMondayForms([], [note], [material]));
  assert.equal(groupUAs(sections.UA.records).length,1);assert.equal(summarize(sections.UA.records).good,1);assert.equal(summarize(sections.UA.records).total,1);assert.equal(groupUAs(sections.UA.records)[0].comments.length,1);
});
