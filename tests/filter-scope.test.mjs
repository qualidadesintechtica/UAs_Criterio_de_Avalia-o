import test from 'node:test';
import assert from 'node:assert/strict';
import {filteredScope} from '../filter-scope.mjs';
import {materialCounts,materialAuditCSV} from '../material-counts.mjs';

const row=(id,extra={})=>({id:String(id),uaKey:'material'+id,kind:'UA',uc:'Curso A',ua:'Material '+id,track:'Esteira A',batch:'Lote A',specialists:['Especialista A'],reviewers:['Revisor A'],materialStatus:'Validado',comment:'',...extra});

test('seleção conjunta aplica esteira, lote, UC, material, revisor e especialista sem alterar a base',()=>{
 const records=[row(1),row(2,{track:'Esteira B'}),row(3,{batch:'Lote B'}),row(4,{uc:'Curso B'}),row(5,{reviewers:['Revisor B']}),row(6,{specialists:['Especialista B']})];
 const before=JSON.stringify(records),selection={filters:{track:'Esteira A',batch:'Lote A',uc:'Curso A',ua:'Material 1',reviewers:'Revisor A',specialists:'Especialista A'}};
 assert.deepEqual(filteredScope(records,selection).map(r=>r.id),['1']);assert.equal(JSON.stringify(records),before);
});
test('busca por comentário mantém os outros critérios do material encontrado',()=>{
 const records=[row(1,{comment:'Evidência de acessibilidade'}),row(1,{id:'segundo',criterion:'Referências'}),row(2)];
 const scope=filteredScope(records,{query:'acessibilidade'});assert.equal(scope.length,2);assert.equal(materialCounts(scope).all,1);
 assert.equal(filteredScope(records,{query:'acessibilidade',filters:{batch:'Lote ausente'}}).length,0);
});
test('status e somente comentários afetam o mesmo recorte contado e exportado',()=>{
 const records=[row(1,{comment:'Parecer'}),row(2,{comment:'Parecer',materialStatus:'Liberada'}),row(3)];
 const scope=filteredScope(records,{commentsOnly:true,status:'validated'});assert.deepEqual(scope.map(r=>r.id),['1']);
 assert.equal(materialCounts(scope).all,1);assert.equal(materialCounts(scope).validated,1);assert.equal(materialAuditCSV(scope).split('\r\n').length,2);
});
test('sem vínculo na PE continua acessível em Todos, fora da contagem, e não entra em status',()=>{
 const records=[row(1,{kind:'PE',validationItemId:'1',workflowEligible:true}),row(2,{kind:'PE',workflowEligible:false})];
 assert.equal(filteredScope(records).length,2);assert.equal(materialCounts(filteredScope(records)).all,1);assert.equal(filteredScope(records,{status:'validated'}).length,1);
});
test('não informado e filtros sem correspondência não reutilizam totais gerais',()=>{
 const records=[row(1,{reviewers:[]}),row(2)];assert.deepEqual(filteredScope(records,{filters:{reviewers:'__missing__'}}).map(r=>r.id),['1']);
 const scope=filteredScope(records,{filters:{track:'Esteira B'}});assert.equal(scope.length,0);assert.equal(materialCounts(scope).all,0);
});
