import {personNames,personValues,filterPeopleByMaterial} from './people-filters.mjs?v=v6-6-10-responsaveis-monday-20261022';
import {collectEntryPlanComments} from './entry-plan-comments.mjs?v=v6-6-10-responsaveis-monday-20261022';
export const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const text = value => value == null ? '' : String(value).trim();
export const names=personNames;
export function isTrue(v) { return v === true || ['true','1','sim','s','yes'].includes(norm(v)); }
export function outcome(row) {
  if (!isTrue(row.entra_no_calculo)) return 'pending';
  return ['sim','s','yes','true','1','x'].includes(norm(row.apontamos_inconformidade)) ? 'bad' : 'good';
}
export function isUA(row) {
  const c = norm(row.categoria_material);
  if (c) return c === 'ua' || c.includes('unidade de aprendizagem');
  return isTrue(row.eh_ua);
}
export function materialKind(row) {
  if(isUA(row))return 'UA';
  const category=norm(row.categoria_material).replace(/\s+/g,' ');
  // Na base de validações, Plano de Produção é a categoria da Planilha de entrada.
  if(category==='pe'||category==='plano de producao'||/^planilhas? de entrada\b/.test(category))return 'PE';
  if(category==='bdq'||/^bancos? de questoes\b/.test(category)||['avaliacao a1','avaliacao a2','avaliacao a3','a1','a2','a3'].includes(category))return 'BDQ';
  if(category==='uc'||/^unidades? curriculares\b/.test(category))return 'UC';
  return null;
}
export function bdqAssessmentType(row={}){
  if(!row)return '';
  const category=norm(row.categoria_material).replace(/\s+/g,' ');
  const explicit=category.match(/^(?:avaliacao\s+)?(a[123])$/);
  if(explicit)return explicit[1].toUpperCase();
  for(const value of [row.id_ua,row.nome_item,row.item_name]){
    const match=text(value).match(/(?:^|_)(A[123])$/i);if(match)return match[1].toUpperCase();
  }
  return '';
}
function stamp(row) {
  for (const k of ['data_classificacao_especialista','sincronizado_em','ultima_atualizacao_monday','updated_at','created_at']) {
    const s = Date.parse(row[k] || '');
    if (Number.isFinite(s)) return s;
  }
  return 0;
}
function later(a,b) {
  if (stamp(a) !== stamp(b)) return stamp(a) > stamp(b);
  try { return BigInt(a.subitem_id || 0) > BigInt(b.subitem_id || 0); } catch { return text(a.subitem_id) > text(b.subitem_id); }
}
function indexBy(rows, key) {
  const map = new Map();
  for (const row of rows) { const k=key(row); if (!k) continue; if (!map.has(k)) map.set(k,[]); map.get(k).push(row); }
  return map;
}
function uniqueMaterial(rows) {
  if (!rows?.length) return null;
  const ids = new Set(rows.map(r => [text(r.id_titulo),text(r.id_ua),norm(r.matriz_oferta),norm(r.esteira_producao),text(r.semestre_oferta),norm(r.bloco||r.lote),entryValidationId(r),materialKind(r)==='BDQ'?text(r.monday_item_validacao)||text(r.chave_material):''].join('|')));
  return ids.size === 1 ? rows[0] : null;
}
export function entryValidationId(row){
  return row?.origem_material==='validacao_planos'?text(row.monday_item_validacao):'';
}
export function materialGroupKey(kind,uc,ua,matrix,track,semester,batch='',validationId=''){
  if(kind==='PE'&&text(validationId))return JSON.stringify(['PE','validacao',text(validationId)]);
  return JSON.stringify([kind,text(uc),text(ua),text(matrix),text(track)||'Não informada',text(semester),text(batch)]);
}
export function unitLabel(row={}){
  const explicit=text(row.unidade_ua||row.unidade_da_ua||row.unidade);
  if(explicit)return explicit;
  const item=text(row.item_name);
  if(/^(unidade|ua)\s*\d+\b/i.test(item))return item;
  const code=text(row.id_ua||row.nome_item).match(/(?:^|_)(?:UA|UNIDADE)[_\s]*(\d+)(?:$|_)/i);
  return code?'UNIDADE '+code[1].padStart(2,'0'):'';
}
export function buildRecords(criteria, materials,kind='UA') {
  if(!['UA','PE','BDQ','UC'].includes(kind))throw new RangeError('Categoria de material não reconhecida.');
  const uaMaterials=materials.filter(row=>materialKind(row)===kind);
  const byParent=indexBy(uaMaterials,r=>text(r.monday_item_validacao));
  const byUA=indexBy(uaMaterials,r=>text(r.id_ua) ? [text(r.id_ua),norm(r.matriz_oferta),norm(r.esteira_producao)].join('|') : '');
  const latest=new Map();
  const versions=new Map();
  const diagnostics={excluded:0,unmatched:0,missingSpecialists:0,duplicates:0};
  for (const row of criteria) {
    if (materialKind(row)!==kind) { diagnostics.excluded++; continue; }
    const material=uniqueMaterial(byParent.get(text(row.parent_item_id))) || uniqueMaterial(byUA.get([text(row.id_ua),norm(row.matriz_oferta),norm(row.esteira_producao)].join('|')));
    const uc=text(material?.titulo || row.titulo_uc || row.nome_uc || row.uc);
    const ucId=text(material?.id_titulo || row.id_titulo);
    const uaId=text(row.id_ua || material?.id_ua);
    const parent=text(row.parent_item_id);
    const criterion=text(row.criterio || row.pergunta || 'Critério não informado');
    const specialists=names([row.classificacao_feita_por,row.especialista,material?.especialista_modelagem,material?.especialista]);
    const reviewers=names(row.revisor_validador || material?.revisor_validador);
    const managers=names(material?.gestor_validacao_nq||row.gestor_validacao_nq);
    const assignedReviewers=names(material?.revisor_validador||row.revisor_validador);
    const assessmentType=kind==='BDQ'?bdqAssessmentType(material)||bdqAssessmentType(row):'';
    const track=text(row.esteira_producao || material?.esteira_producao);
    const matrix=text(row.matriz_oferta || material?.matriz_oferta);
    const semester=text(material?.semestre_oferta || row.semestre_oferta);
    const batch=text(material?.bloco||material?.lote||row.bloco||row.lote);
    const ua=text(row.titulo_ua || material?.titulo_ua || material?.item_name || (kind==='UC'?uc:'') || (uaId ? kind+' '+uaId : 'Material sem título'));
    // Sem vínculo inequívoco, o item continua visível, sem inventar uma UC.
    const validationItemId=kind==='PE'?entryValidationId(material):'';
    const uaKey=materialGroupKey(kind,ucId || parent || uaId,uaId || parent || text(row.subitem_id),matrix,track,semester,batch,validationItemId);
    const record={id:text(row.subitem_id),kind,uaKey,validationItemId,uc:uc || 'UC não localizada',ucId,ua,uaId,parent,track:track || 'Não informada',matrix,semester,batch,unitLabel:unitLabel({...row,...material}),materialKey:text(material?.chave_material),specialists,reviewers,managers,assignedReviewers,assessmentType,criterion,question:text(row.pergunta),classification:text(row.classificacao_especialista),comment:text(row.parecer_especialista),date:text(row.data_classificacao_especialista),status:outcome(row),materialStatus:text(material?.status_validacao||row.status_validacao),unmatched:!material && !uc,raw:row};
    const key=uaKey+'|'+norm(criterion)+(row.criterio||row.pergunta?'':'|'+text(row.subitem_id));
    if (!versions.has(key)) versions.set(key,[]);
    versions.get(key).push(record);
    const previous=latest.get(key);
    if (previous) diagnostics.duplicates++;
    if (!previous || later(row,previous.raw)) latest.set(key,record);
  }
  const records=[...latest.entries()].map(([key,record])=>({...record,history:versions.get(key).filter(r=>r!==record).sort((a,b)=>later(a.raw,b.raw)?-1:later(b.raw,a.raw)?1:0).map(({raw,...r})=>r)}));
  diagnostics.unmatched=records.filter(r=>r.unmatched).length;
  diagnostics.missingSpecialists=records.filter(r=>!r.specialists.length).length;
  return {records,diagnostics};
}
export function filterRecords(records, filters={}, query='', status='all', skip='') {
  const q=norm(query);
  const rows=records.filter(r=> {
    for (const field of ['track','batch','uc','ua']) {
      if (field===skip || !filters[field]) continue;
      const vals=(field==='ua'?[r.displayUA||r.ua]:Array.isArray(r[field]) ? r[field] : [r[field]]).filter(v=>text(v)&&!['nao informada','nao informado'].includes(norm(v)));
      if (!vals.length && filters[field]==='__missing__') continue;
      if (!vals.some(v=>norm(v)===norm(filters[field]))) return false;
    }
    if (status!=='all' && r.status!==status) return false;
    return !q || norm([r.uc,r.ucId,r.ua,r.displayUA,r.sourceName,r.uaId,r.unitSourceId,r.unitLabel,r.track,r.batch,r.matrix,...r.specialists,...r.reviewers,...(r.managers||[]),...(r.assignedReviewers||[]),r.assessmentType,r.criterion,r.comment,...personValues(r,'specialists'),...personValues(r,'reviewers'),...(r.kind==='PE'?collectEntryPlanComments([r]).flatMap(c=>[c.text,c.author,c.criterion]):[])].join(' ')).includes(q);
  });
  return filterPeopleByMaterial(rows,filters,skip);
}
export function summarize(records) {
  const evaluations=records.filter(r=>!r.commentOnly);
  const good=evaluations.filter(r=>r.status==='good').length;
  const bad=evaluations.filter(r=>r.status==='bad').length;
  const rated=evaluations.filter(r=>r.status==='rated').length;
  const pending=evaluations.length-good-bad-rated;
  const result={uas:new Set(records.map(r=>r.uaKey)).size,good,bad,pending,assessed:good+bad+rated,total:evaluations.length,rate:good+bad ? good/(good+bad)*100 : null};
  if(rated){const scores=evaluations.filter(r=>r.status==='rated'&&typeof r.score==='number'&&Number.isFinite(r.score)).map(r=>r.score);result.rated=rated;result.score=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;}
  return result;
}
export function groupUAs(records) {
  const groups=new Map();
  for (const r of records) {
    if (!groups.has(r.uaKey)) groups.set(r.uaKey,{...r,specialists:[],reviewers:[],managers:[],assignedReviewers:[],criteria:[],comments:[],mondaySpecialists:[],mondayReviewers:[]});
    const g=groups.get(r.uaKey);g.criteria.push(r);
    g.mondaySpecialists=names([g.mondaySpecialists,r.mondaySpecialists]);g.mondayReviewers=names([g.mondayReviewers,r.mondayReviewers]);
    g.specialists=[...new Set([...g.specialists,...r.specialists])];g.reviewers=[...new Set([...g.reviewers,...r.reviewers])];
    g.managers=[...new Set([...g.managers,...(r.managers||[])])];g.assignedReviewers=[...new Set([...g.assignedReviewers,...(r.assignedReviewers||[])])];
    if (r.comment) g.comments.push({criterion:r.criterion,text:r.comment});
  }
  return [...groups.values()].map(g=>({...g,comments:g.kind==='PE'?collectEntryPlanComments(g.criteria):g.comments,presentationItems:[...new Map(g.criteria.map(r=>{const item={name:r.displayUA||r.ua,unit:r.unitLabel||'',id:r.unitSourceId||r.uaId||r.ua};return [JSON.stringify(item),item];})).values()],unitLabel:[...new Set(g.criteria.map(r=>r.unitLabel).filter(Boolean))].join('; '),summary:summarize(g.criteria),materialStatuses:[...new Set(g.criteria.map(r=>text(r.materialStatus)).filter(Boolean))],requiresAdjustment:g.criteria.some(r=>norm(r.materialStatus).includes('ajustes'))})).sort((a,b)=> a.uc.localeCompare(b.uc,'pt-BR',{numeric:true}) || a.ua.localeCompare(b.ua,'pt-BR',{numeric:true}));
}
export function criteriaSummary(records) {
  const map=new Map();
  for (const r of records) { if(r.commentOnly)continue;if (!map.has(r.criterion)) map.set(r.criterion,[]);map.get(r.criterion).push(r); }
  return [...map.entries()].map(([name,rows])=>({name,...summarize(rows)})).sort((a,b)=> b.bad-a.bad || a.name.localeCompare(b.name,'pt-BR'));
}
export function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function csvCell(value) {
  let s=String(value??'');
  if (/^\s*[=+@\-]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export function exportCSV(records) {
  const headings=['Categoria','Esteira','UC','ID UC','Material','ID material','Matriz','Semestre','Especialista','Revisor','Critério','Resultado','Classificação registrada','Comentários','Data da avaliação','Status Monday','Origem','Autor da última edição do comentário','E-mail do autor do comentário','Data da edição do comentário','Versão do comentário','Texto atual da fonte Monday','UA de referência','Unidade da UA','Lote','ID do item de validação','Gestor do material','Revisor atribuído na validação','Tipo de BDQ','Revisor na Monday','Especialista na Monday'];
  const label={good:'Conforme',bad:'Inconformidade',pending:'Não avaliado',rated:'Avaliado por conceito',comment:'Parecer / registro textual'};
  return '\ufeff'+[headings,...records.map(r=>[r.kind||'UA',r.track,r.uc,r.ucId,r.ua,r.uaId,r.matrix,r.semester,r.specialists.join('; '),r.reviewers.join('; '),r.criterion,label[r.status],r.classification,r.comment,r.date,r.materialStatus||'',r.portal?(r.portalAddition?'Comentário do painel':'Avaliação Monday · comentário editado no painel'):r.sourceLabel||'Critérios de validação Monday',r.portal?.updated_name||'',r.portal?.updated_email||'',r.portal?.updated_at||'',r.portal?.revision||'',r.mondayComment??'',r.displayUA||r.ua,r.unitLabel||'',r.batch||'',r.validationItemId||r.parent||'',(r.managers||[]).join('; '),(r.assignedReviewers||[]).join('; '),r.assessmentType||'',personValues(r,'reviewers').join('; '),personValues(r,'specialists').join('; ')])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
