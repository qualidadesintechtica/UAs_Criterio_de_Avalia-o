import test from 'node:test';
import assert from 'node:assert/strict';
import {readMondayPeople,mondayPeopleMessage} from '../monday-people-loading.mjs';
const row=(id,people=[],board='9376982027')=>({monday_board_id:board,monday_item_id:id,pessoas:people,categoria_material:'UA'});
const page=(rows,more=false)=>({versao:1,registros:rows,lidos:rows.length,tem_mais:more,proximo_board:rows.at(-1)?.monday_board_id??null,proximo_item:rows.at(-1)?.monday_item_id??null});
function client(responses){const calls=[];return {calls,rpc(name,args){calls.push({name,args});return {abortSignal(){return Promise.resolve(responses.shift());}};}};}
test('lê todos os lotes, inclusive materiais vazios e IDs grandes sem perda de precisão',async()=>{
 const source=client([{data:page([row('1')],true)},{data:page([row('9223372036854775806',[{papel:'especialista',nomes:'Maria'}]),row('9000000000000000000',[{papel:'revisor',nomes:'João'}],'9433297929')])}]);
 const progress=[];const rows=await readMondayPeople(source,null,n=>progress.push(n));
 assert.equal(rows.length,2);assert.deepEqual(progress,[1,3]);
 assert.equal(source.calls[1].args.p_apos_item,'1');assert.equal(source.calls[1].args.p_apos_board,'9376982027');
 assert.equal(rows[0].monday_item_id,'9223372036854775806');assert.equal(rows[0].nomes,'Maria');
});
test('timeout do banco reduz o lote e repete o mesmo cursor, sem duplicar resultados',async()=>{
 const source=client([{error:{code:'57014'}},{data:page([row('10',[{papel:'revisor',nomes:'João'}])],true)},{data:page([row('11')])}]);
 assert.equal((await readMondayPeople(source)).length,1);
 assert.deepEqual(source.calls.map(c=>c.args.p_limite),[500,125,125]);
 assert.deepEqual(source.calls.map(c=>c.args.p_apos_item),['0','0','10']);
});
test('a redução de lote é limitada e mantém o erro real após três falhas',async()=>{
 const error={code:'57014'};const source=client(Array.from({length:3},()=>({error})));
 await assert.rejects(readMondayPeople(source),e=>e===error);
 assert.deepEqual(source.calls.map(c=>c.args.p_limite),[500,125,50]);
});
test('falha após lote válido rejeita a carga inteira, sem sucesso com dados parciais',async()=>{
 const error={code:'42501'};const source=client([{data:page([row('1')],true)},{error}]);
 await assert.rejects(readMondayPeople(source),e=>e===error);assert.equal(source.calls.length,2);
});
test('fonte vazia conclui normalmente; contrato incompleto ou cursor repetido falha',async()=>{
 assert.deepEqual(await readMondayPeople(client([{data:page([])}])),[]);
 for(const data of [null,{}, {...page([row('1')],true),proximo_item:'0'},page([row('2'),row('1')])])
   await assert.rejects(readMondayPeople(client([{data}])),e=>['NQ_PEOPLE_RESPONSE','NQ_PEOPLE_CURSOR'].includes(e.code));
 const source=client([{data:page([row('1')],true)},{data:page([row('1')])}]);
 await assert.rejects(readMondayPeople(source),{code:'NQ_PEOPLE_CURSOR'});
});
test('cancelamento não consulta outra página; erro de instalação não provoca fallback pesado',async()=>{
 const controller=new AbortController();controller.abort();const source=client([]);
 await assert.rejects(readMondayPeople(source,controller.signal),{name:'AbortError'});assert.equal(source.calls.length,0);
 const missing=client([{error:{code:'PGRST202'}}]);await assert.rejects(readMondayPeople(missing),{code:'PGRST202'});assert.equal(missing.calls.length,1);
});
test('a interface diferencia tempo, permissão, sessão e instalação mostrando o código real',()=>{
 assert.match(mondayPeopleMessage({code:'57014'}),/tempo.*57014/);
 assert.match(mondayPeopleMessage({code:'PGRST202'}),/14_RESPONSAVEIS_PAGINADOS/);
 assert.match(mondayPeopleMessage({code:'42501'}),/recusou.*42501/);
 assert.match(mondayPeopleMessage({code:'PGRST301'}),/sessão/);
 assert.match(mondayPeopleMessage({code:'42804'}),/42804/);
 assert.ok(!mondayPeopleMessage({code:'unsafe <script>',message:'secret jwt'}).includes('secret'));
});
