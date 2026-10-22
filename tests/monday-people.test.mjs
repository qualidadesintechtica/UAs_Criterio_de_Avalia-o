import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMondayPeople} from '../monday-people.mjs';
import {personValues} from '../people-filters.mjs';
import {filteredScope} from '../filter-scope.mjs';
import {groupUAs,exportCSV} from '../core.mjs';
import {applyPortalComments} from '../portal-comments.mjs';
const record={id:'1',kind:'UA',uaKey:'UA1',parent:'10',ucId:'UC1',uaId:'UC1_UA01',uc:'Curso',ua:'Unidade',track:'Graduação',batch:'Lote 1',semester:'2026.2',matrix:'Radial',specialists:['Autor da avaliação'],reviewers:['Avaliador do formulário'],assignedReviewers:['Revisor antigo'],comment:'Texto',criterion:'Precisão',status:'good',classification:'Sim',materialStatus:'Validado',history:[]};
const person=(role,name,extra={})=>({monday_board_id:'9433297929',monday_item_id:'10',categoria_material:'Unidade de Aprendizagem',id_titulo:'UC1',id_ua:'UC1_UA01',papel:role,nomes:name,...extra});
test('tabela e filtros usam responsáveis atribuídos, preservando a autoria da avaliação',()=>{
 const rows=applyMondayPeople({UA:{records:[record]}},[person('revisor','João Revisor'),person('especialista','Maria Especialista')]).UA.records;
 assert.deepEqual(personValues(rows[0],'specialists'),['Maria Especialista']);assert.deepEqual(personValues(rows[0],'reviewers'),['João Revisor']);
 assert.deepEqual(rows[0].specialists,['Autor da avaliação']);
 assert.equal(filteredScope(rows,{filters:{specialists:'Maria Especialista',reviewers:'João Revisor'}}).length,1);
 assert.equal(filteredScope(rows,{filters:{reviewers:'Avaliador do formulário'}}).length,0);
 assert.equal(filteredScope(rows,{query:'Maria Especialista'}).length,1);
 assert.match(exportCSV(rows),/Revisor na Monday/);assert.match(exportCSV(rows),/Maria Especialista/);
});
test('usa relação exata da esteira com o ID de validação, incluindo IDs grandes',()=>{
 const r={...record,parent:'94332979290000000001'};
 const source=person('especialista','Maria',{monday_board_id:'9376982027',monday_item_id:'900',id_ua:'OUTRO_CODIGO',vinculos_validacao:JSON.stringify({linkedPulseIds:[{linkedPulseId:r.parent}]})});
 const row=applyMondayPeople({UA:{records:[r]}},[source]).UA.records[0];assert.deepEqual(row.mondaySpecialists,['Maria']);
});
test('vínculo por código e oferta é inequívoco e não escolhe entre lotes quando falta contexto',()=>{
 const a=person('especialista','Especialista Lote 1',{monday_board_id:'9376982027',monday_item_id:'100',bloco:'Lote 1'});
 const b={...a,monday_item_id:'200',nomes:'Especialista Lote 2',bloco:'Lote 2'};
 const exact=applyMondayPeople({UA:{records:[record]}},[a,b]).UA.records[0];assert.deepEqual(exact.mondaySpecialists,['Especialista Lote 1']);
 const unknown=applyMondayPeople({UA:{records:[{...record,batch:''}]}},[a,b]).UA.records[0];assert.deepEqual(unknown.mondaySpecialists,[]);assert.equal(unknown.mondayPeopleAmbiguous,true);
});
test('vínculo ambíguo da esteira não substitui revisor exato da validação',()=>{
 const a=person('especialista','Maria',{monday_board_id:'9376982027',monday_item_id:'100'}),b={...a,monday_item_id:'200'};
 const row=applyMondayPeople({UA:{records:[record]}},[person('revisor','João'),a,b]).UA.records[0];
 assert.deepEqual(row.mondayReviewers,['João']);assert.deepEqual(row.mondaySpecialists,[]);
});
test('nas quatro abas usa apenas a categoria correspondente; UC pode consultar sua UA exata',()=>{
 for(const [kind,category] of [['PE','Plano de Produção'],['UA','Unidade de Aprendizagem'],['BDQ','Avaliação A2'],['UC','Unidade de Aprendizagem']]){
  const r={...record,kind,unitSourceId:kind==='UC'?'UC1_UA01':undefined};
  const row=applyMondayPeople({[kind]:{records:[r]}},[person('revisor','João',{categoria_material:category})])[kind].records[0];
  assert.deepEqual(row.mondayReviewers,['João']);
 }
 const row=applyMondayPeople({PE:{records:[{...record,kind:'PE'}]}},[person('especialista','Especialista da UA')]).PE.records[0];assert.deepEqual(row.mondaySpecialists,[]);
});
test('fontes ausentes ou sem responsáveis não usam autores como se fossem responsáveis',()=>{
 for(const ready of [true,false]){
  const row=applyMondayPeople({UA:{records:[record]}},[],ready).UA.records[0];
  assert.deepEqual(personValues(row,'specialists'),[]);assert.deepEqual(personValues(row,'reviewers'),[]);
 }
});
test('agrega responsáveis de cada unidade e conserva nomes após edição de comentários',()=>{
 const a=person('especialista','Maria'),b=person('especialista','Ana',{monday_item_id:'11',id_ua:'UC1_UA02'});
 const source={UC:{records:[{...record,kind:'UC',uaKey:'UC1',unitSourceId:'UC1_UA01'},{...record,id:'2',kind:'UC',uaKey:'UC1',parent:'11',uaId:'UC1_UA02',unitSourceId:'UC1_UA02'}]}};
 const sections=applyMondayPeople(source,[a,b]);const g=groupUAs(sections.UC.records)[0];assert.deepEqual(personValues(g,'specialists'),['Maria','Ana']);
 const edited=applyPortalComments(sections,[{id:'note',source_key:'criterio:1',mode:'source',body:'Editado'}]);
 assert.deepEqual(edited.UC.records[0].mondaySpecialists,['Maria']);
});
