import test from 'node:test';
import assert from 'node:assert/strict';
import {materialCounts,materialAuditCSV} from '../material-counts.mjs';
import {filterRecords} from '../core.mjs';
import {selectWorkflow} from '../workflow.mjs';

function record(id,status,extra={}){return {id:'r'+id,uaKey:'material'+id,validationItemId:String(id),kind:'PE',uc:'Curso '+id,ucId:'UC'+id,ua:'Plano '+id,uaId:'UC'+id+'_PP',track:'Esteira A',batch:'Lote 1',parent:String(id),specialists:[],reviewers:[],materialStatus:status,workflowEligible:true,...extra};}
function screenshot(){let id=0;const records=[];for(const [status,n] of [['Liberado para validação - NQ',14],['Ajustes - Modelagens',27],['Validado',336],['A liberar',30],['N/A',2],['Pausado',46]])for(let i=0;i<n;i++)records.push(record(++id,status));records.push(...records.slice(0,142).map(r=>({...r,id:r.id+'extra',comment:'Complemento'})),record('f1','Validado',{workflowEligible:false}),record('f2','Liberada',{workflowEligible:false}));return records;}

test('455 planilhas não se tornam 599 ao incluir critérios e dois formulários sem vínculo',()=>{
 const rows=screenshot(),before=JSON.stringify(rows),counts=materialCounts(rows);
 assert.equal(rows.length,599);assert.equal(counts.all,455);assert.equal(counts.cards,377);assert.equal(counts.other,78);assert.equal(counts.unlinked,2);assert.equal(counts.consistent,true);
 assert.deepEqual([counts.released,counts.validating,counts.design,counts.validated],[14,0,27,336]);
 assert.equal(counts.rows.reduce((n,r)=>n+r.count,0),455);assert.equal(JSON.stringify(rows),before);
 const csv=materialAuditCSV(rows),lines=csv.split('\r\n');assert.equal(lines.length,456);assert.equal(new Set(lines.slice(1).map(line=>line.split(';')[0])).size,455);assert.ok(!csv.includes('f1'));assert.ok(!csv.includes('f2'));
});
test('outros status têm recorte próprio e o lote reduz a conferência em todas as abas',()=>{
 const rows=screenshot();assert.equal(materialCounts(selectWorkflow(rows,'other')).all,78);
 for(const kind of ['PE','UA','BDQ','UC']){const data=[record(1,'Validado',{kind}),record(2,'Pausado',{kind,batch:'Lote 2'})];assert.equal(materialCounts(filterRecords(data,{batch:'Lote 2'})).all,1);assert.equal(materialCounts(filterRecords(data,{batch:'Lote 2'})).other,1);}
});
test('um material com múltiplos status conta uma vez e conserva os status originais',()=>{
 const rows=[record(1,'Liberada'),record(1,'Ajustes - MODELAGEM')],counts=materialCounts(rows);
 assert.equal(counts.all,1);assert.equal(counts.design,1);assert.equal(counts.rows[0].status,'Liberada / Ajustes - MODELAGEM');assert.ok(materialAuditCSV(rows).includes('Liberada / Ajustes - MODELAGEM'));
});
test('CSV conserva códigos, coleta IDs de UC e protege valores interpretados como fórmulas',()=>{
 const rows=[record(1,'',{kind:'UC',validationItemId:'',parent:'10',uc:'=FÓRMULA',ua:'Texto; com "aspas"'}),record(1,'',{kind:'UC',validationItemId:'',parent:'11'})];
 const csv=materialAuditCSV(rows);assert.equal(csv.split('\r\n').length,2);assert.ok(csv.includes('"10; 11"'));assert.ok(csv.includes("\"'=FÓRMULA\""));assert.ok(csv.includes('"Texto; com ""aspas"""'));assert.ok(csv.includes('"Sem status"'));
});
test('recorte vazio tem total zero e exporta apenas cabeçalho',()=>{const counts=materialCounts([]);assert.equal(counts.all,0);assert.equal(counts.consistent,true);assert.equal(counts.unlinked,0);assert.equal(materialAuditCSV([]).split('\r\n').length,1);});
