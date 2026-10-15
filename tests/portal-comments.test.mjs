import test from 'node:test';
import assert from 'node:assert/strict';
import {commentSourceKey,applyPortalComments,validateComment,commentError} from '../portal-comments.mjs';
import {summarize,groupUAs,filterRecords,exportCSV} from '../core.mjs';

const original={id:'101',raw:{subitem_id:101},uaKey:'UA-1',kind:'UA',uc:'Curso',ucId:'UC1',ua:'Unidade 1',uaId:'UA1',track:'Esteira',matrix:'2026',semester:'1',specialists:['Especialista'],reviewers:['Revisor'],criterion:'Critério 1',classification:'Não',status:'bad',comment:'Texto original da Monday',date:'2026-10-14',sourceLabel:'Monday',history:[]};
const sections={UA:{records:[original],diagnostics:{duplicates:0}},UC:{records:[]}};
const note={id:'a1',source_key:'criterio:101',mode:'source',body:'Parecer atualizado',revision:2,updated_name:'Professora',updated_email:'professora@animaeducacao.com.br',updated_at:'2026-10-15T12:00:00Z'};

test('identifica critérios, pareceres e cada indicador sem depender do nome do material',()=>{
  assert.equal(commentSourceKey(original),'criterio:101');
  assert.equal(commentSourceKey({...original,raw:undefined,uaKey:'novo vínculo'}),'criterio:101');
  assert.equal(commentSourceKey({id:'comment:uuid'}),'parecer:uuid');
  assert.equal(commentSourceKey({id:'form:90:I2',sourceEvent:'90',criterionKey:'I2'}),'avaliacao:90:I2');
  assert.equal(commentSourceKey({id:'form:90',sourceEvent:'90',criterionKey:'metadata'}),'avaliacao:90:metadata');
  assert.equal(commentSourceKey({}), '');
});
test('edita a visualização mantendo o original, a classificação e os responsáveis',()=>{
  const updated=applyPortalComments(sections,[note]).UA.records[0];
  assert.equal(updated.comment,note.body);assert.equal(updated.mondayComment,original.comment);
  assert.equal(updated.portal.revision,2);assert.equal(updated.classification,original.classification);
  assert.deepEqual(updated.specialists,original.specialists);assert.equal(updated.date,original.date);
  assert.equal(original.comment,'Texto original da Monday');assert.equal(original.portal,undefined);
  assert.deepEqual(summarize([updated]),summarize([original]));
});
test('comentários complementares não alteram totais, média, responsáveis ou classificação',()=>{
  const addition={...note,id:'a2',mode:'addition'};
  const rows=applyPortalComments(sections,[addition]).UA.records;
  assert.equal(rows.length,2);assert.equal(rows[1].status,'comment');assert.equal(rows[1].portalAddition,true);
  assert.deepEqual(summarize(rows),summarize([original]));
  assert.equal(groupUAs(rows)[0].comments.length,2);
  assert.equal(commentSourceKey(rows[1]),'criterio:101');
});
test('mantém adições distintas e edições sem duplicar os critérios',()=>{
  const notes=[note,{...note,id:'a2',mode:'addition'},{...note,id:'a3',mode:'addition',body:'Outra observação'}];
  const first=applyPortalComments(sections,notes),second=applyPortalComments(sections,notes);
  assert.deepEqual(first,second);assert.equal(first.UA.records.length,3);
  assert.equal(first.UA.records.filter(r=>!r.commentOnly).length,1);
});
test('separa indicadores de UC e mantém notas vinculadas após renomear o material',()=>{
  const one={...original,raw:undefined,id:'form:99:I1',sourceEvent:'99',criterionKey:'I1'};
  const two={...one,id:'form:99:I2',criterionKey:'I2'};
  const scoped={UC:{records:[one,two]}};
  const rows=applyPortalComments(scoped,[{...note,source_key:'avaliacao:99:I2'}]).UC.records;
  assert.equal(rows[0].comment,original.comment);assert.equal(rows[1].comment,note.body);
  assert.equal(applyPortalComments({UC:{records:[{...two,uaKey:'renomeado'}]}},[{...note,source_key:'avaliacao:99:I2'}]).UC.records[0].comment,note.body);
});
test('atualiza texto da fonte separadamente sem apagar edição do painel',()=>{
  const refreshed={UA:{records:[{...original,comment:'Nova sincronização Monday'}]}};
  const r=applyPortalComments(refreshed,[note]).UA.records[0];
  assert.equal(r.comment,note.body);assert.equal(r.mondayComment,'Nova sincronização Monday');
  assert.deepEqual(applyPortalComments(sections,[]).UA.records[0],original);
});
test('busca, lista e exportação usam o comentário salvo',()=>{
  const rows=applyPortalComments(sections,[note]).UA.records;
  assert.equal(filterRecords(rows,{},'atualizado').length,1);
  assert.equal(groupUAs(rows)[0].comments[0].text,note.body);
  assert.ok(exportCSV(rows).includes(note.body));
  assert.ok(exportCSV(rows).includes(note.updated_email));
  assert.ok(exportCSV(rows).includes('comentário editado no painel'));
  assert.ok(exportCSV(rows).includes(original.comment));
});
test('preserva edições e complementos quando a Monday cria nova classificação do mesmo critério',()=>{
  const previous={...original,raw:undefined};
  const latest={...original,id:'102',raw:{subitem_id:102},comment:'Nova avaliação Monday',history:[previous]};
  const rows=applyPortalComments({UA:{records:[latest]}},[note,{...note,id:'a2',mode:'addition'}]).UA.records;
  assert.equal(rows[0].comment,'Nova avaliação Monday');
  assert.equal(rows[0].history[0].comment,note.body);
  assert.equal(rows[0].history[0].mondayComment,original.comment);
  assert.equal(rows[1].portal.id,'a2');assert.equal(rows[1].uaKey,latest.uaKey);
  assert.equal(summarize(rows).total,1);
});
test('valida vazio, limite de caracteres e texto puro',()=>{
  assert.ok(validateComment(' \n ').error);assert.ok(validateComment('a'.repeat(10001)).error);
  assert.equal(validateComment('a'.repeat(10000)).body.length,10000);
  assert.equal(validateComment('  <script>alert(1)</script>\ntexto  ').body,'<script>alert(1)</script>\ntexto');
  assert.ok(!validateComment('😀'.repeat(10000)).error);
});
test('explica conflito, sessão e instalação sem expor mensagens brutas',()=>{
  assert.match(commentError({message:'NQ_COMMENT_CONFLICT'}),/Seu texto foi mantido/);
  assert.match(commentError({code:'PGRST202'}),/SQL 03/);
  assert.match(commentError({code:'42501'}),/sessão expirou/);
  assert.ok(!commentError({message:'secret internal query'}).includes('secret'));
});
