import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {isInstitutionalEmail} from '../auth-policy.mjs';

const configContext={window:{}};
vm.runInNewContext(await readFile(new URL('../config.js',import.meta.url),'utf8'),configContext);
const domains=Array.from(configContext.window.UA_CONFIG.allowedDomains);

test('mantém o acesso Ânima e inclui Ulife na configuração entregue',()=>{
  assert.deepEqual(domains,['animaeducacao.com.br','ulife.com.br']);
  assert.equal(isInstitutionalEmail('professor@animaeducacao.com.br',domains),true);
  assert.equal(isInstitutionalEmail('professor@ulife.com.br',domains),true);
});
test('aceita maiúsculas e espaços externos sem ampliar os domínios',()=>{
  assert.equal(isInstitutionalEmail(' PROFESSOR@ULIFE.COM.BR ',domains),true);
  assert.equal(isInstitutionalEmail('professor+revisao@ulife.com.br',domains),true);
});
test('recusa domínios externos, subdomínios e sufixos que imitam o permitido',()=>{
  for(const email of ['prof@gmail.com','prof@ulife.com.br.exemplo.com','prof@sub.ulife.com.br','prof@falsoulife.com.br','prof@animaeducacao.com.br.exemplo.com'])assert.equal(isInstitutionalEmail(email,domains),false,email);
});
test('recusa endereço vazio, incompleto, com dois arrobas ou espaços internos',()=>{
  for(const email of [undefined,'','professor','@ulife.com.br','prof@@ulife.com.br','prof@ulife.com.br@externo.com','prof essor@ulife.com.br','prof@ ulife.com.br'])assert.equal(isInstitutionalEmail(email,domains),false,String(email));
});
