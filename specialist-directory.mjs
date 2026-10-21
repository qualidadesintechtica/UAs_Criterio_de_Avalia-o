import {norm} from './core.mjs';

// A lista vem do perfil privado cadastrado, nunca dos autores da Monday.
export function specialistNames(people=[]){
  const byName=new Map();
  for(const person of people){
    const name=String(person.nome||'').trim().replace(/\s+/g,' ');
    if(name&&!byName.has(norm(name)))byName.set(norm(name),name);
  }
  return [...byName.values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
export async function readSpecialists(client,signal){
  const people=[],size=200;
  for(let offset=0;;offset+=size){
    const {data,error}=await client.rpc('nq_painel_listar_especialistas',{p_offset:offset,p_limite:size}).abortSignal(signal);
    if(error)throw error;
    if(!Array.isArray(data))throw new Error('Não foi possível consultar os especialistas cadastrados.');
    people.push(...data);
    if(data.length<size)return specialistNames(people);
  }
}
export function registeredSpecialistSelection(names,current=''){
  return names.find(name=>norm(name)===norm(current))||'';
}
