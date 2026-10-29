import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestEntryPlanId} from '../id-suggestions.mjs';
const material={categoria_material:'Planilha de Entrada',id_ua:'UCD_RAD_CTI_ALGCAO_26_PP',monday_item_validacao:'12420700861'};
const issue={unlinked:true,reference:'UCD_RAD_CTI_ALGCAO_27_PP',formId:'13341677809'};
test('sugere troca de ano somente com um plano oficial inequívoco',()=>{
  const suggestion=suggestEntryPlanId(issue,[material]);
  assert.equal(suggestion.code,material.id_ua);
  assert.equal(suggestion.validationId,'12420700861');
  assert.equal(suggestion.formId,'13341677809');
});
test('não sugere quando há ambiguidade, não é PP ou já está vinculado',()=>{
  assert.equal(suggestEntryPlanId(issue,[material,{...material,id_ua:'UCD_RAD_CTI_ALGCAO_25_PP',monday_item_validacao:'2'}]),null);
  assert.equal(suggestEntryPlanId({...issue,unlinked:false},[material]),null);
  assert.equal(suggestEntryPlanId({...issue,reference:'UCD_RAD_CTI_ALGCAO_27_UA01'},[material]),null);
  assert.equal(suggestEntryPlanId(issue,[{...material,id_ua:'UCD_RAD_OUTRA_ALGCAO_26_PP'}]),null);
});
