import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecords,outcome,filterRecords,summarize,groupUAs,criteriaSummary,escapeHTML,exportCSV} from '../core.mjs';
const material={monday_item_validacao:'100',id_titulo:'UC1',id_ua:'UA1',titulo:'Introdução à Computação',titulo_ua:'Arquitetura',matriz_oferta:'Radial',esteira_producao:'Graduação',semestre_oferta:'2026.2',categoria_material:'Unidade de Aprendizagem',eh_ua:true,revisor_validador:'Revisor A; Revisor B'};
const criterion={subitem_id:'1000',parent_item_id:'100',id_ua:'UA1',titulo_ua:'Arquitetura',matriz_oferta:'Radial',esteira_producao:'Graduação',criterio:'Precisão científica',categoria_material:'Unidade de Aprendizagem',classificacao_feita_por:'Especialista A',revisor_validador:'Revisor A; Revisor B',parecer_especialista:'Corrigir a referência.',entra_no_calculo:true,apontamos_inconformidade:'Sim',data_classificacao_especialista:'2026-10-01'};
const make=(overrides={})=>({...criterion,...overrides});
test('preserva a regra do BI sem confundir a classificação Sim com a inconformidade',()=>{
  assert.equal(outcome({entra_no_calculo:true,classificacao_especialista:'Sim',apontamos_inconformidade:null}),'good');
  assert.equal(outcome({entra_no_calculo:false,apontamos_inconformidade:'Sim'}),'pending');
  assert.equal(outcome({entra_no_calculo:true,apontamos_inconformidade:'Sim'}),'bad');
});
test('mantém a avaliação vigente e seu comentário sem inflar os totais',()=>{
  const {records,diagnostics}=buildRecords([criterion,make({subitem_id:'1001',apontamos_inconformidade:'Não',parecer_especialista:'Ajuste concluído.',data_classificacao_especialista:'2026-10-03'})],[material]);
  assert.equal(records.length,1);assert.equal(records[0].comment,'Ajuste concluído.');assert.equal(records[0].status,'good');assert.equal(diagnostics.duplicates,1);
});
test('usa o vínculo exato do item antes de qualquer relação por título ou ID',()=>{
  const other={...material,monday_item_validacao:'101',id_titulo:'UC2',titulo:'Outra UC'};
  const {records}=buildRecords([criterion],[material,other]);assert.equal(records[0].uc,'Introdução à Computação');
});
test('não inventa vínculos quando o mesmo ID de UA está em UCs diferentes',()=>{
  const other={...material,monday_item_validacao:'101',id_titulo:'UC2',titulo:'Outra UC'};
  const {records,diagnostics}=buildRecords([make({parent_item_id:'999'})],[material,other]);
  assert.equal(records[0].uc,'UC não localizada');assert.equal(diagnostics.unmatched,1);
});
test('preserva UAs de ofertas distintas e exclui materiais que não são UA',()=>{
  const other={...material,monday_item_validacao:'101',semestre_oferta:'2026.1'};
  const {records}=buildRecords([criterion,make({parent_item_id:'101',subitem_id:'1002'}),make({categoria_material:'Plano de Produção',subitem_id:'1003'})],[material,other]);assert.equal(records.length,2);assert.equal(groupUAs(records).length,2);
});
test('aplica os cinco filtros e conserva todos os critérios do material encontrado',()=>{
  const {records}=buildRecords([criterion,make({subitem_id:'1002',criterio:'Recursos interativos',classificacao_feita_por:'Especialista B',apontamos_inconformidade:'Não'})],[material]);
  assert.equal(filterRecords(records,{track:'Graduação',uc:material.titulo,ua:'Arquitetura',reviewers:'Revisor B',specialists:'Especialista A'}).length,2);
  assert.equal(filterRecords(records,{specialists:'Inexistente'}).length,0);
});
test('filtro Não informado encontra somente materiais inteiramente sem pessoa',()=>{
  const {records}=buildRecords([criterion,make({subitem_id:'1002',criterio:'Recursos interativos',classificacao_feita_por:null})],[material]);
  assert.equal(filterRecords(records,{specialists:'__missing__'}).length,0);
  const unassigned={...records[1],uaKey:'outro-material'};
  assert.deepEqual(filterRecords([...records,unassigned],{specialists:'__missing__'}),[unassigned]);
});
test('busca usa comentários e ignora variações de acentos',()=>{
  const {records}=buildRecords([criterion],[material]);assert.equal(filterRecords(records,{},'REFERENCIA').length,1);assert.equal(filterRecords(records,{},'não existe').length,0);
});
test('não avaliados ficam fora do denominador e ausência de resultado não vira zero',()=>{
  const {records}=buildRecords([criterion,make({subitem_id:'1002',criterio:'Bibliografia',entra_no_calculo:false}),make({subitem_id:'1003',criterio:'Interação',apontamos_inconformidade:'Não'})],[material]);
  assert.deepEqual(summarize(records),{uas:1,good:1,bad:1,pending:1,assessed:2,total:3,rate:50});assert.equal(summarize([]).rate,null);
});
test('agrupa a tabela por UA mantendo os pareceres de cada critério',()=>{
  const {records}=buildRecords([criterion,make({subitem_id:'1002',criterio:'Bibliografia',parecer_especialista:'Atualizar os títulos.'})],[material]);const groups=groupUAs(records);assert.equal(groups.length,1);assert.equal(groups[0].comments.length,2);assert.equal(criteriaSummary(records).length,2);
});
test('exportação preserva texto multilinha e neutraliza fórmulas e HTML',()=>{
  const {records}=buildRecords([make({parecer_especialista:'=HYPERLINK("url")\ntexto; extra'})],[material]);const csv=exportCSV(records);assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('texto; extra'));assert.equal(escapeHTML('<script>alert("x")</script>'),'&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
test('não colapsa subitens sem identificação de critério',()=>{
  const {records}=buildRecords([make({criterio:null,subitem_id:'1001'}),make({criterio:null,subitem_id:'1002'})],[material]);assert.equal(records.length,2);
});
