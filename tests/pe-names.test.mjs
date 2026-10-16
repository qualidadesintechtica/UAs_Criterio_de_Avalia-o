import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptMondayForms,mergeMondayData} from '../monday-data.mjs';
import {buildSections} from '../navigation.mjs';
import {groupUAs,filterRecords,exportCSV} from '../core.mjs';
import {materialTableRows,filterOptions,includeMaterialInventory} from '../workflow.mjs';
import {applyPortalComments,commentSourceKey} from '../portal-comments.mjs';
import {resolveEntryPlanNames} from '../pe-names.mjs';

const code='COA_CTI_CUSVOS_26';
const title='Nome da UC de teste';
const material={id_titulo:code,id_ua:code+'_UA01',chave_material:code+'|'+code+'_UA01|UA',titulo:title,categoria_material:'Unidade de Aprendizagem',esteira_producao:'Esteira A',bloco:'LOTE 2',matriz_oferta:'2026',semestre_oferta:'2026.2'};
const form={id:'form-pe',monday_item_id:'90',nome_item:code+'_PP',categoria_material:'Planilha de Entrada',conceito_final:'Validado'};
function sections(materials=[material],forms=[form],comments=[]){return mergeMondayData(buildSections([],materials),adaptMondayForms(forms,comments,materials));}

test('Planilha de entrada exibe o título da UC nas duas colunas, mantendo o código original',()=>{
  const before=sections(),after=resolveEntryPlanNames(before,[material]);
  const old=before.PE.records[0],row=after.PE.records[0];
  assert.equal(row.uc,title);assert.equal(row.ua,title);assert.equal(row.displayUA,title);
  assert.equal(row.sourceName,code+'_PP');assert.equal(row.ucId,old.ucId);assert.equal(row.uaId,old.uaId);
  assert.equal(row.uaKey,old.uaKey);assert.equal(row.sourceEvent,old.sourceEvent);
  assert.equal(row.unitSourceId,old.unitSourceId);assert.equal(row.courseNameResolved,true);
  assert.equal(commentSourceKey(row),commentSourceKey(old));
  assert.equal(before.PE.records[0].ua,code+'_PP');assert.strictEqual(after.UA,before.UA);
  const table=materialTableRows(groupUAs(after.PE.records));assert.equal(table[0].group.uc,title);assert.equal(table[0].name,title);
});
test('campos vazios e diferenças de caixa não descartam um título disponível para o mesmo código',()=>{
  const materials=[{...material,titulo:null},{...material,id_ua:code+'_UA02',titulo:'  Nome   da UC de teste  '},{...material,id_ua:code+'_UA03',titulo:'nome da uc de teste'},{...material,id_ua:code+'_UA04',titulo:code}];
  const before=sections(materials);assert.equal(before.PE.records[0].uc,code);
  const row=resolveEntryPlanNames(before,materials).PE.records[0];
  assert.equal(row.uc,title);assert.equal(row.ua,title);assert.equal(row.courseNameResolved,true);
});
test('encontra o nome por código de UA ou chave composta quando o ID da UC está vazio',()=>{
  for(const m of [{...material,id_titulo:null},{...material,id_titulo:' ',id_ua:null},{...material,id_titulo:'CODIGO_INTERNO_DA_UC'}]){
    const row=resolveEntryPlanNames(sections([m]),[m]).PE.records[0];
    assert.equal(row.uc,title);assert.equal(row.displayUA,title);
  }
});
test('preserva nomes já legíveis e não tenta adivinhar nomes por códigos parecidos',()=>{
  const human=resolveEntryPlanNames(sections([], [{...form,nome_item:'Comunicação digital'}]),[]).PE.records[0];
  assert.equal(human.uc,'Comunicação digital');assert.equal(human.ua,'Comunicação digital');
  const wrong={...material,id_titulo:code+'_OUTRA',id_ua:code+'_OUTRA_UA01',chave_material:code+'_OUTRA|'+code+'_OUTRA_UA01|UA'};
  const missing=resolveEntryPlanNames(sections([wrong]),[wrong]).PE.records[0];
  assert.equal(missing.courseNameResolved,false);assert.equal(missing.uc,'Nome da UC não localizado');
  assert.equal(resolveEntryPlanNames({PE:{records:[missing]}},[wrong]).PE.records[0].courseNameResolved,false);
  assert.equal(missing.sourceName,code+'_PP');assert.notEqual(missing.ua,code+'_PP');
});
test('conflitos de títulos e ausência de nomes ficam sinalizados sem escolher uma UC arbitrária',()=>{
  const materials=[material,{...material,id_ua:code+'_UA02',titulo:'Outro nome de UC'}];
  const missing=resolveEntryPlanNames(sections(materials),materials).PE.records[0];
  assert.equal(missing.courseNameResolved,false);assert.equal(missing.uc,'Nome da UC não localizado');
  const short={PE:{records:[{ua:'UC01_PP',uc:'UC01',ucId:'UC01',uaId:'UC01',history:[]}]}};
  assert.equal(resolveEntryPlanNames(short,[]).PE.records[0].ua,'Nome da UC não localizado');
});
test('filtros, busca e CSV usam o nome; a busca pelo código original continua disponível',()=>{
  const updated=resolveEntryPlanNames(sections(),[material]),rows=updated.PE.records;
  assert.deepEqual(filterOptions(updated,'uc').values,[title]);assert.deepEqual(filterOptions(updated,'ua').values,[title]);
  assert.equal(filterRecords(rows,{uc:title,ua:title}).length,1);
  assert.equal(filterRecords(rows,{},code+'_PP').length,1);assert.equal(filterRecords(rows,{},title).length,1);
  assert.ok(exportCSV(rows).includes(title));assert.ok(exportCSV(rows).includes(code));
});
test('nomes corrigidos não duplicam planilhas nem perdem comentários e versões anteriores',()=>{
  const note={id:'parecer1',monday_item_id:'90',nome_item:form.nome_item,categoria_material:form.categoria_material,criterio_id:'c1',criterio_titulo:'Critério',parecer:'Parecer Monday'};
  const before=sections([material],[form],[note]);
  const after=resolveEntryPlanNames(before,[material]);
  const key=commentSourceKey(before.PE.records[0]);const saved={id:'portal1',source_key:key,mode:'source',body:'Edição do professor',revision:2};
  const rows=applyPortalComments(after,[saved]).PE.records;
  assert.equal(rows.length,before.PE.records.length);assert.equal(groupUAs(rows).length,1);
  assert.equal(rows[0].comment,'Edição do professor');assert.equal(rows[0].mondayComment,'Parecer Monday');
  assert.equal(rows[0].portal.revision,2);assert.equal(rows[0].ua,title);
});
test('corrige também planilhas do inventário sem alterar filtros operacionais e situação da avaliação',()=>{
  const pe={...material,categoria_material:'Planilha de Entrada',titulo_ua:code+'_PP',id_ua:code+'_PP',chave_material:'pe1',status_validacao:'Em Validação',revisor_validador:'Professor'};
  const before=includeMaterialInventory(buildSections([],[]),[pe]);
  const row=resolveEntryPlanNames(before,[pe]).PE.records[0],old=before.PE.records[0];
  assert.equal(row.ua,title);assert.equal(row.uc,title);
  for(const field of ['id','uaId','ucId','materialKey','batch','track','status','materialStatus','uaKey'])assert.equal(row[field],old[field],field);
  assert.equal(commentSourceKey(row),commentSourceKey(old));
});
