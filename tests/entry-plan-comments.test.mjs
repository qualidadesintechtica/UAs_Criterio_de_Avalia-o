import test from 'node:test';
import assert from 'node:assert/strict';
import {collectEntryPlanComments} from '../entry-plan-comments.mjs';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {buildSections} from '../navigation.mjs';
import {groupUAs} from '../core.mjs';
import {filteredScope} from '../filter-scope.mjs';
import {specialistProgress} from '../specialist-progress.mjs';
import {countWorkflow} from '../workflow.mjs';
import {applyPortalComments} from '../portal-comments.mjs';
const plan={monday_item_validacao:'10',chave_material:'VALIDACAO_PP_10',origem_material:'validacao_planos',id_titulo:'UC_A',id_ua:'UC_A_PP',titulo:'Curso A',categoria_material:'Plano de Produção',status_validacao:'Validado'};
const note=(id,event='100',extra={})=>({id,monday_item_id:event,nome_item:'UC_A_PP',categoria_material:'Planilha de Entrada',criterio_id:'c1',criterio_titulo:'Organização',parecer:'Revisar a organização',avaliador:'Revisora A',data_avaliacao:'2026-10-20',...extra});
test('preserva envios diferentes do mesmo critério, inclusive textos iguais',()=>{
 const data=adaptMondayForms([], [note('n1'),note('n2','101',{avaliador:'Revisora B'})], [plan]);
 assert.equal(data.records.length,2);assert.equal(collectEntryPlanComments(data.records).length,2);
 assert.deepEqual(new Set(collectEntryPlanComments(data.records).map(c=>c.author)),new Set(['Revisora A','Revisora B']));
 assert.equal(countWorkflow(data.records).all,1);assert.equal(specialistProgress(data.records).total,0);
});
test('não elimina parecer de formulário apenas porque o texto coincide com um critério',()=>{
 const raw={subitem_id:'1',parent_item_id:'10',categoria_material:'Plano de Produção',criterio:'Organização',parecer_especialista:'Revisar a organização',classificacao_especialista:'Sim',entra_no_calculo:true};
 const sections=mergeMondayData(buildSections([raw],[plan]),adaptMondayForms([],[note('n1')],[plan]));
 assert.equal(collectEntryPlanComments(sections.PE.records).length,2);
 assert.equal(specialistProgress(sections.PE.records).total,1);
});
test('comentário em versão anterior fica visível e participa da busca e somente comentários',()=>{
 const raw={subitem_id:'1',parent_item_id:'10',categoria_material:'Plano de Produção',criterio:'Organização',parecer_especialista:'Verificar acessibilidade antiga',data_classificacao_especialista:'2026-10-19',classificacao_especialista:'Não',entra_no_calculo:true};
 const newer={...raw,subitem_id:'2',parecer_especialista:'',data_classificacao_especialista:'2026-10-21',classificacao_especialista:'Sim'};
 const rows=buildSections([raw,newer],[plan]).PE.records;
 assert.equal(rows.length,1);assert.equal(groupUAs(rows)[0].comments.length,1);
 assert.equal(collectEntryPlanComments(rows)[0].historical,true);
 assert.equal(filteredScope(rows,{commentsOnly:true,query:'acessibilidade antiga'}).length,1);
 assert.equal(specialistProgress(rows).total,1);assert.equal(countWorkflow(rows).validated,1);
});
test('mantém texto original, edição do painel e complemento, sem duplicar fontes idênticas',()=>{
 const rows=adaptMondayForms([],[note('n1')],[plan]);
 const sections=applyPortalComments({PE:rows},[{id:'p1',source_key:'parecer:n1',mode:'source',body:'Texto editado',updated_name:'Lígia',updated_at:'2026-10-21'},
 {id:'p2',source_key:'parecer:n1',mode:'addition',body:'Complemento',updated_name:'Cristina',updated_at:'2026-10-21'}]);
 const comments=collectEntryPlanComments(sections.PE.records);
 assert.equal(comments.length,3);assert.deepEqual(new Set(comments.map(c=>c.text)),new Set(['Revisar a organização','Texto editado','Complemento']));
 assert.equal(comments.find(c=>c.text==='Texto editado').author,'Lígia');
 assert.equal(collectEntryPlanComments([...sections.PE.records,...sections.PE.records]).length,3);
});
test('reconhece tipo explícito Planilha de Entrada se a categoria estiver ausente',()=>{
 const data=adaptMondayForms([],[note('n1','100',{categoria_material:null,tipo_formulario:'Avaliação da Planilha de Entrada'})],[plan]);
 assert.equal(data.records.length,1);assert.equal(data.records[0].kind,'PE');
});
test('planos com vínculo ambíguo mantêm comentários separados, sem atribuição por semelhança',()=>{
 const other={...plan,monday_item_validacao:'11',chave_material:'VALIDACAO_PP_11'};
 const data=adaptMondayForms([],[note('n1')],[plan,other]);
 assert.equal(data.records[0].validationItemId,'');assert.equal(data.records[0].materialKey,'');
 assert.equal(collectEntryPlanComments(data.records).length,1);
});
test('mesmo subitem presente no histórico por duplicação de junção conta uma vez',()=>{
 const record={kind:'PE',id:'1',raw:{subitem_id:'1'},comment:'Texto',specialists:['Ana'],history:[{kind:'PE',id:'1',comment:'Texto',specialists:['Ana']}]};
 assert.equal(collectEntryPlanComments([record]).length,1);
});
