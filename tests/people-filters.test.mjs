import test from 'node:test';
import assert from 'node:assert/strict';
import {personNames,personKey} from '../people-filters.mjs';
import {filterRecords} from '../core.mjs';
import {filteredScope} from '../filter-scope.mjs';
import {filterOptions} from '../workflow.mjs';
import {materialCounts,materialAuditCSV} from '../material-counts.mjs';
import {specialistProgress} from '../specialist-progress.mjs';
import {specialistNames,registeredSpecialistSelection} from '../specialist-directory.mjs';
const row=(id,extra={})=>({id,uaKey:'material1',kind:'UA',ua:'Unidade',uc:'Curso',track:'Graduação',batch:'Lote 1',specialists:[],reviewers:[],materialStatus:'Validado',classification:'Sim',status:'good',comment:'',...extra});
test('combina pessoas em registros diferentes do mesmo material e preserva todos os critérios',()=>{
 const rows=[row('1',{specialists:['Maria Especialista']}),row('2',{reviewers:['João Revisor'],comment:'Texto completo'}),row('3'),row('4',{uaKey:'material2',specialists:['Maria Especialista'],reviewers:['Outro Revisor']})];
 const scope=filteredScope(rows,{filters:{specialists:'Maria Especialista',reviewers:'João Revisor'}});
 assert.deepEqual(scope.map(r=>r.id),['1','2','3']);assert.equal(materialCounts(scope).all,1);
 assert.equal(specialistProgress(scope).total,3);assert.equal(materialAuditCSV(scope).split('\r\n').length,2);
});
test('identifica nomes com espaços, acentos, caixa e caracteres invisíveis, sem adivinhar abreviações',()=>{
 assert.equal(personKey('  MARIA\u00a0  JOSÉ\u200b '),'maria jose');
 assert.equal(filterRecords([row('1',{specialists:['  MARIA\u00a0 JOSÉ\u200b ']})],{specialists:'Maria José'}).length,1);
 assert.equal(filterRecords([row('1',{specialists:['Maria J.']})],{specialists:'Maria José'}).length,0);
});
test('lê listas JSON, objetos e múltiplos responsáveis sem transformar IDs em nomes',()=>{
 assert.deepEqual(personNames('[{"name":"Ana Silva"},{"nome":"João Sousa"}]'),['Ana Silva','João Sousa']);
 assert.deepEqual(personNames({personsAndTeams:[{id:1,name:'Ana Silva'},{id:2,kind:'person'}]}),['Ana Silva']);
 assert.deepEqual(personNames(['Ana  Silva','ANA SILVA','João Sousa; Bia Reis\nClara Lima']),['Ana Silva','João Sousa','Bia Reis','Clara Lima']);
 assert.deepEqual(personNames({personsAndTeams:[{id:1,kind:'person'}]}),[]);
 assert.equal(filterRecords([row('1',{reviewers:'["Ana Silva","João Sousa"]'})],{reviewers:'João Sousa'}).length,1);
});
test('especialista e revisor de materiais diferentes não criam uma correspondência falsa',()=>{
 const rows=[row('1',{specialists:['Ana']}),row('2',{uaKey:'material2',reviewers:['João']})];
 assert.equal(filteredScope(rows,{filters:{specialists:'Ana',reviewers:'João'}}).length,0);
});
test('listas e filtro Não informado usam a mesma definição de material',()=>{
 const rows=[row('1',{reviewers:['João']}),row('2'),row('3',{uaKey:'material2'})];
 const sections={UA:{records:rows}};
 assert.deepEqual(filterOptions(sections,'reviewers').values,['João']);assert.equal(filterOptions(sections,'reviewers').missing,true);
 assert.deepEqual(filterRecords(rows,{reviewers:'__missing__'}).map(r=>r.id),['3']);
 assert.equal(filterOptions({UA:{records:rows.slice(0,2)}},'reviewers').missing,false);
});
test('funciona nas quatro abas sem fundir ofertas ou lotes diferentes',()=>{
 for(const kind of ['PE','UA','BDQ','UC']){
  const rows=[row('1',{kind,uaKey:kind+'|lote1',specialists:['Ana']}),row('2',{kind,uaKey:kind+'|lote1',assignedReviewers:['João']}),row('3',{kind,uaKey:kind+'|lote2',batch:'Lote 2',specialists:['Ana'],reviewers:['João']})];
  assert.equal(filteredScope(rows,{filters:{batch:'Lote 1',specialists:'Ana',reviewers:'João'}}).length,2);
 }
});
test('catálogo de especialistas continua limitado ao cadastro e usa a mesma chave de comparação',()=>{
 const names=specialistNames([{nome:'Maria  José'},{nome:'MARIA JOSÉ'}]);
 assert.deepEqual(names,['Maria José']);assert.equal(registeredSpecialistSelection(names,' Maria\u00a0JOSÉ '),'Maria José');
 assert.equal(registeredSpecialistSelection(names,'Revisor da Monday'),'');
});
test('revisor atribuído e avaliador do formulário permanecem pesquisáveis',()=>{
 const rows=[row('1',{assignedReviewers:['Revisor atribuído'],reviewers:['Avaliador']})];
 assert.equal(filterRecords(rows,{reviewers:'Avaliador'}).length,1);assert.equal(filterRecords(rows,{reviewers:'Revisor atribuído'}).length,1);
 assert.deepEqual(filterOptions({BDQ:{records:rows}},'reviewers').values,['Avaliador','Revisor atribuído']);
});
test('recorte vazio e limpeza não reutilizam os totais da seleção anterior',()=>{
 const rows=[row('1',{specialists:['Ana'],reviewers:['João']}),row('2',{uaKey:'material2'})];
 assert.equal(materialCounts(filteredScope(rows,{filters:{reviewers:'Não existe'}})).all,0);
 assert.equal(materialCounts(filteredScope(rows,{})).all,2);
});
