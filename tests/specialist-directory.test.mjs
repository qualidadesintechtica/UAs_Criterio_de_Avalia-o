import test from 'node:test';
import assert from 'node:assert/strict';
import {specialistNames,readSpecialists,registeredSpecialistSelection} from '../specialist-directory.mjs';
import {filterRecords} from '../core.mjs';

test('lista usa somente nomes do cadastro, normalizados e sem incluir autores da Monday',()=>{
  const names=specialistNames([{nome:'  Maria  Especialista '},{nome:'MÁRIA ESPECIALISTA'},{nome:'Ana Silva'},{nome:''}]);
  assert.deepEqual(names,['Ana Silva','Maria Especialista']);
  assert.equal(registeredSpecialistSelection(names,'Revisor da Monday'),'');
  assert.equal(registeredSpecialistSelection(names,'maria especialista'),'Maria Especialista');
});
test('consulta todas as páginas sem expor listagem administrativa de usuários',async()=>{
  const calls=[],signal=new AbortController().signal;
  const client={rpc(name,args){assert.equal(name,'nq_painel_listar_especialistas');calls.push(args);return{abortSignal(s){assert.equal(s,signal);return Promise.resolve({data:args.p_offset===0?Array.from({length:200},(_,i)=>({nome:'Especialista '+i})):[{nome:'Última especialista'}]});}};}};
  const names=await readSpecialists(client,signal);
  assert.equal(names.length,201);assert.deepEqual(calls.map(x=>x.p_offset),[0,200]);
});
test('falha em uma página não produz lista parcial nem reutiliza nomes da Monday',async()=>{
  const error={code:'PGRST202',message:'missing'};
  const client={rpc(){return{abortSignal:async()=>({error})};}};
  await assert.rejects(readSpecialists(client),e=>e===error);
  assert.deepEqual(await readSpecialists({rpc:()=>({abortSignal:async()=>({data:[]})})}),[]);
});
test('nome canônico continua filtrando materiais com diferenças de acento e caixa',()=>{
  const name=registeredSpecialistSelection(['Maria José'],'MARIA JOSE');
  const records=[{specialists:['MARIA JOSE']},{specialists:['Pessoa não cadastrada']}];
  assert.equal(filterRecords(records,{specialists:name}).length,1);
  assert.equal(registeredSpecialistSelection([],'Maria José'),'');
});
