// Sugestões somente de leitura: a correção do ID é sempre feita na Monday.
import {materialKind,norm,text,entryValidationId} from './core.mjs';
const planCode=value=>text(value).trim().toUpperCase();
const parts=value=>{const match=planCode(value).match(/^(.+)_([0-9]{2})_PP$/);return match?{stem:match[1],year:match[2]}:null;};
export function suggestEntryPlanId(issue,materials=[]){
  if(!issue?.unlinked)return null;
  const source=planCode(issue.reference),parsed=parts(source);
  if(!parsed)return null;
  const matches=new Map();
  for(const material of materials){
    if(materialKind(material)!=='PE')continue;
    const candidate=planCode(material.id_ua),p=parts(candidate);
    if(!p||p.stem!==parsed.stem||p.year===parsed.year)continue;
    const id=text(entryValidationId(material)||material.monday_item_validacao);
    if(!id)continue;
    matches.set(candidate+'|'+id,{code:candidate,validationId:id});
  }
  if(matches.size!==1)return null;
  return {...matches.values().next().value,formId:text(issue.formId),source,kind:'possible-year-typo'};
}
